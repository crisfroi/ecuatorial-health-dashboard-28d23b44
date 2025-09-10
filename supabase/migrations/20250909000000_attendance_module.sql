-- Attendance & Payroll module: dispositivos, empleado_dispositivo_map, attendance_logs
-- Requires pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Dispositivos de fichaje
CREATE TABLE IF NOT EXISTS public.dispositivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  ubicacion text,
  centro_salud_id uuid REFERENCES public.centros_salud(id) ON DELETE SET NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispositivos_centro ON public.dispositivos(centro_salud_id);

-- 2) Mapeo EnNo <-> Profesional por dispositivo
CREATE TABLE IF NOT EXISTS public.empleado_dispositivo_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_profesional uuid NOT NULL REFERENCES public.profesionales_sanitarios(id) ON DELETE CASCADE,
  en_no text NOT NULL,
  id_dispositivo uuid NOT NULL REFERENCES public.dispositivos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id_dispositivo, en_no),
  UNIQUE(id_profesional, id_dispositivo)
);

CREATE INDEX IF NOT EXISTS idx_emp_map_prof ON public.empleado_dispositivo_map(id_profesional);
CREATE INDEX IF NOT EXISTS idx_emp_map_device ON public.empleado_dispositivo_map(id_dispositivo);

-- 3) Logs de asistencia crudos importados
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_profesional uuid REFERENCES public.profesionales_sanitarios(id) ON DELETE SET NULL,
  id_dispositivo uuid NOT NULL REFERENCES public.dispositivos(id) ON DELETE CASCADE,
  en_no text,
  inout text CHECK (inout IN ('IN','OUT')),
  mode text,
  fecha_hora timestamptz NOT NULL,
  raw_line text,
  source_file text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_att_logs_prof_fecha ON public.attendance_logs(id_profesional, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_att_logs_device_fecha ON public.attendance_logs(id_dispositivo, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_att_logs_enno_fecha ON public.attendance_logs(en_no, fecha_hora DESC);

-- RLS
ALTER TABLE public.dispositivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleado_dispositivo_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Policies: baseline (application-level filtering by center and sector público already applied in app)
-- Only authenticated users can read; inserts/updates allowed to authenticated to simplify initial rollout
DROP POLICY IF EXISTS "dispositivos_select_auth" ON public.dispositivos;
CREATE POLICY "dispositivos_select_auth" ON public.dispositivos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "dispositivos_write_auth" ON public.dispositivos;
CREATE POLICY "dispositivos_write_auth" ON public.dispositivos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "emp_map_select_auth" ON public.empleado_dispositivo_map;
CREATE POLICY "emp_map_select_auth" ON public.empleado_dispositivo_map
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "emp_map_write_auth" ON public.empleado_dispositivo_map;
CREATE POLICY "emp_map_write_auth" ON public.empleado_dispositivo_map
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "att_logs_select_auth" ON public.attendance_logs;
CREATE POLICY "att_logs_select_auth" ON public.attendance_logs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "att_logs_write_auth" ON public.attendance_logs;
CREATE POLICY "att_logs_write_auth" ON public.attendance_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dispositivos_set_updated_at ON public.dispositivos;
CREATE TRIGGER dispositivos_set_updated_at
BEFORE UPDATE ON public.dispositivos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS emp_map_set_updated_at ON public.empleado_dispositivo_map;
CREATE TRIGGER emp_map_set_updated_at
BEFORE UPDATE ON public.empleado_dispositivo_map
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
