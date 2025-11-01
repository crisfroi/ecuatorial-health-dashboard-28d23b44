-- Areas profesionales lookup table and FK migration
-- 1) Create lookup table
CREATE TABLE IF NOT EXISTS public.areas_profesionales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_areas_profesionales_updated_at ON public.areas_profesionales;
CREATE TRIGGER trg_areas_profesionales_updated_at
BEFORE UPDATE ON public.areas_profesionales
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) RLS and policies
ALTER TABLE public.areas_profesionales ENABLE ROW LEVEL SECURITY;

-- Allow read to everyone (adjust if you need to restrict)
DROP POLICY IF EXISTS "areas_profesionales_select_all" ON public.areas_profesionales;
CREATE POLICY "areas_profesionales_select_all"
ON public.areas_profesionales FOR SELECT
USING (true);

-- Allow insert/update/delete only to admin-like roles
DROP POLICY IF EXISTS "areas_profesionales_admin_write" ON public.areas_profesionales;
CREATE POLICY "areas_profesionales_admin_write"
ON public.areas_profesionales FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO')
  )
);

-- 3) Add FK column to profesionales_sanitarios
ALTER TABLE public.profesionales_sanitarios
ADD COLUMN IF NOT EXISTS area_profesional_id UUID REFERENCES public.areas_profesionales(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profesionales_area_profesional_id ON public.profesionales_sanitarios(area_profesional_id);

-- 4) Backfill lookup values from existing text column
INSERT INTO public.areas_profesionales (nombre)
SELECT DISTINCT TRIM(area_profesional)
FROM public.profesionales_sanitarios
WHERE area_profesional IS NOT NULL AND TRIM(area_profesional) <> ''
ON CONFLICT (nombre) DO NOTHING;

-- 5) Backfill FK on professionals by matching name (case-insensitive, trimmed)
UPDATE public.profesionales_sanitarios p
SET area_profesional_id = a.id
FROM public.areas_profesionales a
WHERE p.area_profesional IS NOT NULL
  AND TRIM(LOWER(p.area_profesional)) = TRIM(LOWER(a.nombre))
  AND (p.area_profesional_id IS NULL OR p.area_profesional_id <> a.id);

-- 6) Sync trigger: derive text from FK on insert/update
CREATE OR REPLACE FUNCTION public.sync_area_profesional_text()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.area_profesional_id IS NOT NULL THEN
    SELECT nombre INTO NEW.area_profesional FROM public.areas_profesionales WHERE id = NEW.area_profesional_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profesionales_sync_area_text ON public.profesionales_sanitarios;
CREATE TRIGGER trg_profesionales_sync_area_text
BEFORE INSERT OR UPDATE OF area_profesional_id ON public.profesionales_sanitarios
FOR EACH ROW EXECUTE FUNCTION public.sync_area_profesional_text();

-- Optional: try to resolve FK from text when provided (best-effort, no inserts)
CREATE OR REPLACE FUNCTION public.try_link_area_profesional_id()
RETURNS TRIGGER AS $$
DECLARE
  aid UUID;
BEGIN
  IF (NEW.area_profesional_id IS NULL) AND (NEW.area_profesional IS NOT NULL) THEN
    SELECT id INTO aid FROM public.areas_profesionales WHERE TRIM(LOWER(nombre)) = TRIM(LOWER(NEW.area_profesional)) LIMIT 1;
    IF aid IS NOT NULL THEN
      NEW.area_profesional_id = aid;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profesionales_try_link_area ON public.profesionales_sanitarios;
CREATE TRIGGER trg_profesionales_try_link_area
BEFORE INSERT OR UPDATE OF area_profesional ON public.profesionales_sanitarios
FOR EACH ROW EXECUTE FUNCTION public.try_link_area_profesional_id();






