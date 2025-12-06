-- Create hosix_cpoe_prescripciones table for CPOE (Computerized Physician Order Entry)
-- This stores electronic prescriptions with safety alerts and clinical decision support

CREATE TABLE IF NOT EXISTS hosix_cpoe_prescripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  medico_id UUID REFERENCES profesionales_sanitarios(id) NOT NULL,
  
  -- Medicamento
  medicamento_id UUID REFERENCES hosix_articulos(id) NOT NULL,
  nombre_medicamento VARCHAR(255) NOT NULL,
  principio_activo VARCHAR(255),
  
  -- Posología
  dosis VARCHAR(100) NOT NULL,
  unidad_dosis VARCHAR(50),
  via_administracion VARCHAR(50) NOT NULL,
  frecuencia VARCHAR(100) NOT NULL,
  duracion_dias INT,
  
  -- Fechas
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  
  -- CDS - Alertas de seguridad
  tiene_alerta_interaccion BOOLEAN DEFAULT false,
  tiene_alerta_alergia BOOLEAN DEFAULT false,
  tiene_alerta_dosis BOOLEAN DEFAULT false,
  alertas_ignoradas JSONB,
  
  -- Estado
  estado VARCHAR(30) DEFAULT 'activa',
  
  -- Firma electrónica
  firmada BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  hash_firma VARCHAR(255),
  
  instrucciones_paciente TEXT,
  observaciones_medicas TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE hosix_cpoe_prescripciones ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow SELECT for authenticated users
CREATE POLICY "cpoe_prescripciones_select"
ON hosix_cpoe_prescripciones FOR SELECT
USING (true);

-- RLS Policy: Allow INSERT for authenticated users
CREATE POLICY "cpoe_prescripciones_insert"
ON hosix_cpoe_prescripciones FOR INSERT
WITH CHECK (true);

-- RLS Policy: Allow UPDATE for authenticated users
CREATE POLICY "cpoe_prescripciones_update"
ON hosix_cpoe_prescripciones FOR UPDATE
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cpoe_prescripciones_paciente_id ON hosix_cpoe_prescripciones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_cpoe_prescripciones_medico_id ON hosix_cpoe_prescripciones(medico_id);
CREATE INDEX IF NOT EXISTS idx_cpoe_prescripciones_estado ON hosix_cpoe_prescripciones(estado);
CREATE INDEX IF NOT EXISTS idx_cpoe_prescripciones_fecha_inicio ON hosix_cpoe_prescripciones(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_cpoe_prescripciones_medicamento_id ON hosix_cpoe_prescripciones(medicamento_id);
