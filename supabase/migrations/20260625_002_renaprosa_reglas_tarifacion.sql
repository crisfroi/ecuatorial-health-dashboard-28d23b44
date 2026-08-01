-- Reglas de tarifación dinámica
-- Permiten calcular precios en función de múltiples parámetros
CREATE TABLE IF NOT EXISTS public.renaprosa_reglas_tarifacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concepto_id UUID NOT NULL REFERENCES public.renaprosa_conceptos_maestro(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  tipo_regla VARCHAR(50) NOT NULL,
  condicion_json JSONB NOT NULL,
  tipo_aplicacion VARCHAR(50) NOT NULL,
  valor_aplicacion DECIMAL(12, 2) NOT NULL,
  orden_aplicacion INTEGER NOT NULL DEFAULT 1,
  permitir_acumulacion BOOLEAN DEFAULT true,
  es_descuento BOOLEAN DEFAULT false,
  precio_minimo DECIMAL(12, 2),
  precio_maximo DECIMAL(12, 2),
  requiere_aprobacion BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  nota TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda y filtrado
CREATE INDEX IF NOT EXISTS idx_reglas_concepto ON public.renaprosa_reglas_tarifacion(concepto_id);
CREATE INDEX IF NOT EXISTS idx_reglas_tipo ON public.renaprosa_reglas_tarifacion(tipo_regla);
CREATE INDEX IF NOT EXISTS idx_reglas_orden ON public.renaprosa_reglas_tarifacion(orden_aplicacion);
CREATE INDEX IF NOT EXISTS idx_reglas_activo ON public.renaprosa_reglas_tarifacion(activo);

-- Vista: Reglas por concepto (útil para querys)
CREATE OR REPLACE VIEW public.vw_reglas_tarifacion_por_concepto AS
SELECT 
  rc.id as concepto_id,
  rc.codigo,
  rc.descripcion as concepto,
  rr.id as regla_id,
  rr.nombre,
  rr.tipo_regla,
  rr.tipo_aplicacion,
  rr.valor_aplicacion,
  rr.orden_aplicacion,
  rr.activo
FROM public.renaprosa_conceptos_maestro rc
LEFT JOIN public.renaprosa_reglas_tarifacion rr ON rc.id = rr.concepto_id
WHERE rc.activo = true AND (rr.activo = true OR rr.id IS NULL)
ORDER BY rc.codigo, rr.orden_aplicacion;

-- RLS: Solo admin_renaprosa puede crear/actualizar
ALTER TABLE public.renaprosa_reglas_tarifacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin RENAPROSA: Crud completo" ON public.renaprosa_reglas_tarifacion
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin_renaprosa')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin_renaprosa');

CREATE POLICY "Lectura pública para HOSIX" ON public.renaprosa_reglas_tarifacion
  FOR SELECT USING (true);

-- Seed de datos de ejemplo
INSERT INTO public.renaprosa_reglas_tarifacion (concepto_id, nombre, tipo_regla, condicion_json, tipo_aplicacion, valor_aplicacion, orden_aplicacion, es_descuento, activo) 
SELECT 
  id, 
  'Descuento Menores de 5 años', 
  'edad', 
  '{"edad_minima": 0, "edad_maxima": 5}'::jsonb,
  'porcentaje',
  -20,
  1,
  true,
  true
FROM public.renaprosa_conceptos_maestro 
WHERE codigo = 'CONS-MED'
LIMIT 1;
