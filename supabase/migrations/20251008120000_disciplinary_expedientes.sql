-- Expedientes disciplinarios module

-- Enum for estado
DO $$ BEGIN
  CREATE TYPE expediente_estado AS ENUM ('abierto','en_revision','resuelto','cerrado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Main table
CREATE TABLE IF NOT EXISTS public.expedientes_disciplinarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id uuid NOT NULL REFERENCES public.profesionales_sanitarios(id) ON DELETE RESTRICT,
  motivo text NOT NULL,
  estado expediente_estado NOT NULL DEFAULT 'abierto',
  fecha_apertura timestamptz NOT NULL DEFAULT now(),
  resolucion_final text,
  archivo_adjunto_url text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- History table
CREATE TABLE IF NOT EXISTS public.historial_acciones_expediente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id uuid NOT NULL REFERENCES public.expedientes_disciplinarios(id) ON DELETE CASCADE,
  accion text NOT NULL, -- 'apertura','nota','cambio_estado','resolucion'
  comentario text,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS expedientes_profesional_idx ON public.expedientes_disciplinarios(profesional_id);
CREATE INDEX IF NOT EXISTS expedientes_estado_idx ON public.expedientes_disciplinarios(estado);
CREATE INDEX IF NOT EXISTS hist_exp_expediente_idx ON public.historial_acciones_expediente(expediente_id);
CREATE INDEX IF NOT EXISTS hist_exp_actor_idx ON public.historial_acciones_expediente(actor_id);

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('expedientes','expedientes', true)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.expedientes_disciplinarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_acciones_expediente ENABLE ROW LEVEL SECURITY;

-- Read policies (authenticated)
DO $$ BEGIN
  CREATE POLICY expedientes_select_auth ON public.expedientes_disciplinarios
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY hist_exp_select_auth ON public.historial_acciones_expediente
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- No INSERT/UPDATE/DELETE policies here; writes are performed via Edge Functions using service role.
