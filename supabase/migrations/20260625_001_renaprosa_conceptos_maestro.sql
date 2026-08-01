-- Conceptos maestros: Servicios, procedimientos, materiales, etc.
-- Fuente única de verdad para todos los nodos HOSIX
CREATE TABLE IF NOT EXISTS public.renaprosa_conceptos_maestro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  tipo_concepto VARCHAR(50) NOT NULL,
  precio_base DECIMAL(12, 2) NOT NULL,
  usa_tarifacion_dinamica BOOLEAN DEFAULT false,
  visible_aseguradoras BOOLEAN DEFAULT true,
  snomed_code VARCHAR(50),
  cpt_code VARCHAR(50),
  nota TEXT,
  activo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda y filtrado
CREATE INDEX IF NOT EXISTS idx_conceptos_maestro_codigo ON public.renaprosa_conceptos_maestro(codigo);
CREATE INDEX IF NOT EXISTS idx_conceptos_maestro_tipo ON public.renaprosa_conceptos_maestro(tipo_concepto);
CREATE INDEX IF NOT EXISTS idx_conceptos_maestro_activo ON public.renaprosa_conceptos_maestro(activo);
CREATE INDEX IF NOT EXISTS idx_conceptos_maestro_tarifacion_dinamica ON public.renaprosa_conceptos_maestro(usa_tarifacion_dinamica);

-- RLS: Solo admin_renaprosa puede crear/actualizar
ALTER TABLE public.renaprosa_conceptos_maestro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin RENAPROSA: Crud completo" ON public.renaprosa_conceptos_maestro
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin_renaprosa')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin_renaprosa');

CREATE POLICY "Lectura pública para HOSIX" ON public.renaprosa_conceptos_maestro
  FOR SELECT USING (true);

-- Seed de datos de ejemplo
INSERT INTO public.renaprosa_conceptos_maestro (codigo, descripcion, tipo_concepto, precio_base, usa_tarifacion_dinamica, visible_aseguradoras, activo) VALUES
  ('CONS-MED', 'Consulta Médica', 'servicio', 50.00, false, true, true),
  ('CIRUGIA-MAY', 'Cirugía Mayor', 'procedimiento', 500.00, true, true, true),
  ('ESTANCIA-DIA', 'Estancia Hospitalaria por Día', 'servicio', 100.00, true, true, true),
  ('LABORATORIO', 'Servicio de Laboratorio', 'servicio', 30.00, false, true, true),
  ('RADIOLOGIA', 'Servicio de Radiología', 'servicio', 75.00, true, true, true)
ON CONFLICT (codigo) DO NOTHING;
