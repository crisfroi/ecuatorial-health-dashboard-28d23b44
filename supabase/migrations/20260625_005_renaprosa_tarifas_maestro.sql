-- Tarifas maestro: Precios de conceptos por aseguradora
-- Fuente única de verdad para todos los nodos HOSIX
CREATE TABLE IF NOT EXISTS public.renaprosa_tarifas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concepto_id UUID NOT NULL REFERENCES public.renaprosa_conceptos_maestro(id) ON DELETE CASCADE,
  aseguradora_id UUID REFERENCES public.renaprosa_aseguradoras(id) ON DELETE SET NULL,
  precio DECIMAL(12, 2) NOT NULL,
  vigente_desde DATE NOT NULL,
  vigente_hasta DATE,
  activo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda y filtrado
CREATE INDEX IF NOT EXISTS idx_tarifas_concepto ON public.renaprosa_tarifas(concepto_id);
CREATE INDEX IF NOT EXISTS idx_tarifas_aseguradora ON public.renaprosa_tarifas(aseguradora_id);
CREATE INDEX IF NOT EXISTS idx_tarifas_vigente_desde ON public.renaprosa_tarifas(vigente_desde);
CREATE INDEX IF NOT EXISTS idx_tarifas_vigente_hasta ON public.renaprosa_tarifas(vigente_hasta);
CREATE INDEX IF NOT EXISTS idx_tarifas_activo ON public.renaprosa_tarifas(activo);

-- Vista: Tarifas vigentes por concepto
CREATE OR REPLACE VIEW public.vw_tarifas_vigentes AS
SELECT 
  rt.id,
  rc.id as concepto_id,
  rc.codigo,
  rc.descripcion as concepto,
  ra.id as aseguradora_id,
  ra.nombre as aseguradora,
  rt.precio,
  rt.vigente_desde,
  rt.vigente_hasta,
  rt.activo
FROM public.renaprosa_tarifas rt
JOIN public.renaprosa_conceptos_maestro rc ON rt.concepto_id = rc.id
LEFT JOIN public.renaprosa_aseguradoras ra ON rt.aseguradora_id = ra.id
WHERE rt.activo = true
  AND rt.vigente_desde <= CURRENT_DATE
  AND (rt.vigente_hasta IS NULL OR rt.vigente_hasta >= CURRENT_DATE)
ORDER BY rc.codigo, ra.nombre;

-- RLS: Solo admin_renaprosa puede crear/actualizar
ALTER TABLE public.renaprosa_tarifas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin RENAPROSA: Crud completo" ON public.renaprosa_tarifas
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin_renaprosa')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin_renaprosa');

CREATE POLICY "Lectura pública para HOSIX" ON public.renaprosa_tarifas
  FOR SELECT USING (true);

-- Seed de datos de ejemplo: Tarifas para cada concepto
INSERT INTO public.renaprosa_tarifas (concepto_id, aseguradora_id, precio, vigente_desde, vigente_hasta)
SELECT 
  rc.id,
  ra.id,
  CASE 
    WHEN rc.codigo = 'CONS-MED' THEN 55.00
    WHEN rc.codigo = 'CIRUGIA-MAY' THEN 550.00
    WHEN rc.codigo = 'ESTANCIA-DIA' THEN 120.00
    WHEN rc.codigo = 'LABORATORIO' THEN 35.00
    WHEN rc.codigo = 'RADIOLOGIA' THEN 85.00
    ELSE rc.precio_base
  END,
  '2025-01-01'::DATE,
  '2025-12-31'::DATE
FROM public.renaprosa_conceptos_maestro rc
CROSS JOIN public.renaprosa_aseguradoras ra
WHERE rc.activo = true AND ra.activo = true
ON CONFLICT DO NOTHING;

-- Tarifas generales (sin aseguradora específica)
INSERT INTO public.renaprosa_tarifas (concepto_id, precio, vigente_desde, vigente_hasta)
SELECT 
  id,
  precio_base,
  '2025-01-01'::DATE,
  NULL
FROM public.renaprosa_conceptos_maestro
WHERE activo = true
ON CONFLICT DO NOTHING;
