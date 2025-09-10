-- Biometric Shifts (turnos) and Schedules (cuadrantes) for device integration
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.turnos_biometricos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_turno text NOT NULL,
  hora_inicio time NOT NULL,
  hora_fin time NOT NULL,
  tolerancia_minutos integer NOT NULL DEFAULT 0,
  tipo text NOT NULL CHECK (tipo IN ('diurno','nocturno','festivo')),
  centro_salud_id uuid REFERENCES public.centros_salud(id) ON DELETE SET NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_turnos_centro ON public.turnos_biometricos(centro_salud_id);

CREATE TABLE IF NOT EXISTS public.cuadrantes_biometricos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_profesional uuid NOT NULL REFERENCES public.profesionales_sanitarios(id) ON DELETE CASCADE,
  turno_id uuid NOT NULL REFERENCES public.turnos_biometricos(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  centro_salud_id uuid REFERENCES public.centros_salud(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id_profesional, fecha)
);

CREATE INDEX IF NOT EXISTS idx_cuadrantes_centro_fecha ON public.cuadrantes_biometricos(centro_salud_id, fecha);

ALTER TABLE public.turnos_biometricos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuadrantes_biometricos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "turnos_select_auth" ON public.turnos_biometricos;
CREATE POLICY "turnos_select_auth" ON public.turnos_biometricos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "turnos_write_auth" ON public.turnos_biometricos;
CREATE POLICY "turnos_write_auth" ON public.turnos_biometricos FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "cuad_select_auth" ON public.cuadrantes_biometricos;
CREATE POLICY "cuad_select_auth" ON public.cuadrantes_biometricos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "cuad_write_auth" ON public.cuadrantes_biometricos;
CREATE POLICY "cuad_write_auth" ON public.cuadrantes_biometricos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS turnos_set_updated_at ON public.turnos_biometricos;
CREATE TRIGGER turnos_set_updated_at BEFORE UPDATE ON public.turnos_biometricos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS cuadrantes_set_updated_at ON public.cuadrantes_biometricos;
CREATE TRIGGER cuadrantes_set_updated_at BEFORE UPDATE ON public.cuadrantes_biometricos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
