-- Catalogs for faults and sanctions
CREATE TABLE IF NOT EXISTS public.faltas_catalogo (
  codigo text PRIMARY KEY,
  nombre text NOT NULL,
  categoria text,
  activo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.sanciones_catalogo (
  codigo text PRIMARY KEY,
  nombre text NOT NULL,
  requiere_periodo boolean NOT NULL DEFAULT false,
  requiere_monto boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true
);

INSERT INTO public.faltas_catalogo (codigo, nombre, categoria) VALUES
  ('negligencia', 'Negligencia', 'conducta'),
  ('incumplimiento', 'Incumplimiento de Deberes', 'conducta'),
  ('mala_practica', 'Mala Práctica', 'tecnica'),
  ('ausencia_injustificada', 'Ausencia Injustificada', 'asistencia')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.sanciones_catalogo (codigo, nombre, requiere_periodo, requiere_monto) VALUES
  ('amonestacion', 'Amonestación Escrita', false, false),
  ('suspension', 'Suspensión Temporal', true, false),
  ('multa', 'Multa Económica', false, true),
  ('inhabilitacion', 'Inhabilitación Permanente', false, false)
ON CONFLICT (codigo) DO NOTHING;

-- Extend expediente states
DO $$ BEGIN
  CREATE TYPE expediente_estado_v2 AS ENUM (
    'borrador','en_investigacion','audiencia_programada','pendiente_resolucion','sancionado','archivado','abierto','en_revision','resuelto','cerrado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add new columns
ALTER TABLE public.expedientes_disciplinarios
  ADD COLUMN IF NOT EXISTS fecha_incidente timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS falta_codigo text REFERENCES public.faltas_catalogo(codigo),
  ADD COLUMN IF NOT EXISTS gravedad text CHECK (gravedad IN ('leve','grave','muy_grave')),
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS centro_salud_id uuid REFERENCES public.centros_salud(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pruebas_urls jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS autoridad_solicitante uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sancion_tipo text REFERENCES public.sanciones_catalogo(codigo),
  ADD COLUMN IF NOT EXISTS sancion_fecha_inicio date,
  ADD COLUMN IF NOT EXISTS sancion_fecha_fin date,
  ADD COLUMN IF NOT EXISTS multa_monto numeric,
  ADD COLUMN IF NOT EXISTS inhabilitacion_permanente boolean NOT NULL DEFAULT false;

-- Migrate enum type if needed
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='expedientes_disciplinarios' AND column_name='estado'
  ) THEN
    ALTER TABLE public.expedientes_disciplinarios
      ALTER COLUMN estado TYPE expediente_estado_v2 USING estado::text::expediente_estado_v2;
  END IF;
EXCEPTION WHEN others THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS expedientes_centro_idx ON public.expedientes_disciplinarios(centro_salud_id);
CREATE INDEX IF NOT EXISTS expedientes_fecha_incidente_idx ON public.expedientes_disciplinarios(fecha_incidente);
