-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 012: Interacciones Medicamentosas (DrugBank Integration)
-- Fecha: 2025-02-05
-- Descripción: Tabla para almacenar interacciones medicamentosas y soporte DrugBank

-- ============================================================
-- TABLA DE INTERACCIONES MEDICAMENTOSAS
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_drug_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Medicamentos involucrados
  medicamento1_id UUID REFERENCES hosix_medicamentos(id) NOT NULL,
  medicamento2_id UUID REFERENCES hosix_medicamentos(id) NOT NULL,
  
  -- Información de la interacción
  severidad VARCHAR(20) NOT NULL, -- 'leve', 'moderada', 'grave', 'critica'
  descripcion TEXT NOT NULL,
  recomendacion TEXT,
  
  -- Fuente de la información
  fuente VARCHAR(50) DEFAULT 'drugbank', -- 'drugbank', 'manual', 'literatura'
  
  -- Información adicional
  mecanismo_accion TEXT,
  evidencia_nivel VARCHAR(20), -- 'alta', 'media', 'baja'
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_drug_interactions_med1 ON hosix_drug_interactions(medicamento1_id);
CREATE INDEX idx_drug_interactions_med2 ON hosix_drug_interactions(medicamento2_id);
CREATE INDEX idx_drug_interactions_severidad ON hosix_drug_interactions(severidad);
CREATE INDEX idx_drug_interactions_both ON hosix_drug_interactions(medicamento1_id, medicamento2_id);

-- Índice único funcional para evitar duplicados (A-B es igual a B-A)
CREATE UNIQUE INDEX idx_drug_interactions_unique ON hosix_drug_interactions (
  LEAST(medicamento1_id, medicamento2_id),
  GREATEST(medicamento1_id, medicamento2_id)
);

-- ============================================================
-- AGREGAR CAMPO DRUGBANK_ID A MEDICAMENTOS
-- ============================================================
ALTER TABLE hosix_medicamentos 
ADD COLUMN IF NOT EXISTS drugbank_id VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_medicamentos_drugbank_id ON hosix_medicamentos(drugbank_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE hosix_drug_interactions ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer interacciones (información pública)
CREATE POLICY "drug_interactions_read" ON hosix_drug_interactions
  FOR SELECT USING (true);

-- Política: Solo usuarios autenticados pueden insertar
CREATE POLICY "drug_interactions_insert" ON hosix_drug_interactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política: Solo usuarios autenticados pueden actualizar
CREATE POLICY "drug_interactions_update" ON hosix_drug_interactions
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- FUNCIÓN PARA BUSCAR INTERACCIONES
-- ============================================================
CREATE OR REPLACE FUNCTION buscar_interacciones_medicamento(
  p_medicamento_id UUID
)
RETURNS TABLE (
  medicamento_id UUID,
  medicamento_nombre VARCHAR,
  severidad VARCHAR,
  descripcion TEXT,
  recomendacion TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN di.medicamento1_id = p_medicamento_id 
      THEN di.medicamento2_id 
      ELSE di.medicamento1_id 
    END as medicamento_id,
    m.nombre_comercial as medicamento_nombre,
    di.severidad,
    di.descripcion,
    di.recomendacion
  FROM hosix_drug_interactions di
  LEFT JOIN hosix_medicamentos m ON (
    (di.medicamento1_id = p_medicamento_id AND m.id = di.medicamento2_id) OR
    (di.medicamento2_id = p_medicamento_id AND m.id = di.medicamento1_id)
  )
  WHERE di.medicamento1_id = p_medicamento_id 
     OR di.medicamento2_id = p_medicamento_id
  ORDER BY 
    CASE di.severidad
      WHEN 'critica' THEN 1
      WHEN 'grave' THEN 2
      WHEN 'moderada' THEN 3
      WHEN 'leve' THEN 4
      ELSE 5
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- COMENTARIOS
-- ============================================================
COMMENT ON TABLE hosix_drug_interactions IS 'Interacciones medicamentosas entre pares de medicamentos';
COMMENT ON COLUMN hosix_drug_interactions.severidad IS 'Nivel de severidad: leve, moderada, grave, critica';
COMMENT ON COLUMN hosix_drug_interactions.fuente IS 'Fuente de la información: drugbank, manual, literatura';
COMMENT ON COLUMN hosix_medicamentos.drugbank_id IS 'ID del medicamento en DrugBank para integración';

