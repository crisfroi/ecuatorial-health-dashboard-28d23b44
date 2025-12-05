-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 004: Hospitalización, Quirófanos y Farmacia
-- Fecha: 2025-01-16

-- ============================================================
-- 1. MÓDULO DE HOSPITALIZACIÓN
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_camas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100),
  
  servicio_id UUID REFERENCES hosix_servicios(id),
  ubicacion VARCHAR(255),
  tipo_cama VARCHAR(50),
  
  estado VARCHAR(50) DEFAULT 'disponible',
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_hospitalizacion_episodios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  
  -- Ingreso
  fecha_ingreso TIMESTAMPTZ NOT NULL DEFAULT now(),
  origen_ingreso VARCHAR(100),
  diagnostico_ingreso TEXT,
  medico_responsable_id UUID,
  servicio_id UUID REFERENCES hosix_servicios(id),
  cama_id UUID REFERENCES hosix_camas(id),
  
  -- Duración
  duracion_prevista_dias INT,
  
  -- Alta
  fecha_alta TIMESTAMPTZ,
  tipo_alta VARCHAR(50),
  diagnostico_alta TEXT,
  informe_alta TEXT,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'activo',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_hospitalizacion_traslados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episodio_id UUID REFERENCES hosix_hospitalizacion_episodios(id) NOT NULL,
  
  fecha_traslado TIMESTAMPTZ NOT NULL DEFAULT now(),
  cama_origen_id UUID REFERENCES hosix_camas(id),
  cama_destino_id UUID REFERENCES hosix_camas(id),
  servicio_origen_id UUID,
  servicio_destino_id UUID,
  
  motivo_traslado VARCHAR(255),
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. MÓDULO DE QUIRÓFANOS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_quirofanos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  
  area_quirurgica VARCHAR(100),
  tipo_quirofano VARCHAR(50),
  especialidades JSONB DEFAULT '[]',
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_quirofanos_intervenciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quirofano_id UUID REFERENCES hosix_quirofanos(id) NOT NULL,
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  
  -- Programación
  fecha_programada TIMESTAMPTZ NOT NULL,
  hora_inicio_estimada TIME,
  duracion_estimada_minutos INT,
  
  -- Procedimiento
  procedimiento_principal TEXT NOT NULL,
  procedimientos_secundarios JSONB DEFAULT '[]',
  tipo_intervencion VARCHAR(50),
  tipo_anestesia VARCHAR(50),
  
  -- Equipo
  cirujano_principal_id UUID,
  equipo_medico JSONB DEFAULT '[]',
  
  -- Ejecución
  fecha_inicio_real TIMESTAMPTZ,
  fecha_fin_real TIMESTAMPTZ,
  
  -- Resultado
  estado VARCHAR(50) DEFAULT 'programada',
  motivo_cancelacion TEXT,
  complicaciones JSONB DEFAULT '[]',
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. MÓDULO DE FARMACIA Y PRESCRIPCIÓN
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  codigo_barras VARCHAR(100),
  
  nombre_comercial VARCHAR(255) NOT NULL,
  principio_activo VARCHAR(255),
  presentacion VARCHAR(255),
  concentracion VARCHAR(100),
  forma_farmaceutica VARCHAR(100),
  via_administracion VARCHAR(100),
  
  familia VARCHAR(100),
  grupo VARCHAR(100),
  
  requiere_receta BOOLEAN DEFAULT true,
  controlado BOOLEAN DEFAULT false,
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_prescripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  
  medicamento_id UUID REFERENCES hosix_medicamentos(id),
  medicamento_texto VARCHAR(255),
  
  dosis VARCHAR(100),
  frecuencia VARCHAR(100),
  via_administracion VARCHAR(100),
  duracion_dias INT,
  instrucciones TEXT,
  
  prescriptor_id UUID,
  fecha_prescripcion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  
  estado VARCHAR(50) DEFAULT 'activa',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_dispensaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescripcion_id UUID REFERENCES hosix_prescripciones(id) NOT NULL,
  
  cantidad_dispensada DECIMAL(10,2),
  unidad VARCHAR(50),
  lote VARCHAR(100),
  fecha_caducidad DATE,
  
  dispensador_id UUID,
  fecha_dispensacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  confirmado_por UUID,
  fecha_confirmacion TIMESTAMPTZ,
  
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_camas_codigo ON hosix_camas(codigo);
CREATE INDEX IF NOT EXISTS idx_camas_estado ON hosix_camas(estado);
CREATE INDEX IF NOT EXISTS idx_camas_servicio ON hosix_camas(servicio_id);

CREATE INDEX IF NOT EXISTS idx_hospitalizacion_episodios_paciente ON hosix_hospitalizacion_episodios(paciente_id);
CREATE INDEX IF NOT EXISTS idx_hospitalizacion_episodios_fecha ON hosix_hospitalizacion_episodios(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_hospitalizacion_episodios_estado ON hosix_hospitalizacion_episodios(estado);

CREATE INDEX IF NOT EXISTS idx_quirofanos_codigo ON hosix_quirofanos(codigo);
CREATE INDEX IF NOT EXISTS idx_quirofanos_activo ON hosix_quirofanos(activo);

CREATE INDEX IF NOT EXISTS idx_quirofanos_intervenciones_paciente ON hosix_quirofanos_intervenciones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_quirofanos_intervenciones_fecha ON hosix_quirofanos_intervenciones(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_quirofanos_intervenciones_estado ON hosix_quirofanos_intervenciones(estado);

CREATE INDEX IF NOT EXISTS idx_medicamentos_codigo ON hosix_medicamentos(codigo);
CREATE INDEX IF NOT EXISTS idx_medicamentos_activo ON hosix_medicamentos(activo);

CREATE INDEX IF NOT EXISTS idx_prescripciones_paciente ON hosix_prescripciones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_prescripciones_estado ON hosix_prescripciones(estado);

CREATE INDEX IF NOT EXISTS idx_dispensaciones_prescripcion ON hosix_dispensaciones(prescripcion_id);

-- ============================================================
-- 5. RLS POLICIES
-- ============================================================

ALTER TABLE hosix_camas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_hospitalizacion_episodios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_hospitalizacion_traslados ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_quirofanos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_quirofanos_intervenciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_prescripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_dispensaciones ENABLE ROW LEVEL SECURITY;

-- Hospitalizacion
CREATE POLICY "hospitalizacion_read_policy" ON hosix_hospitalizacion_episodios FOR SELECT USING (true);
CREATE POLICY "hospitalizacion_insert_policy" ON hosix_hospitalizacion_episodios FOR INSERT WITH CHECK (true);
CREATE POLICY "hospitalizacion_update_policy" ON hosix_hospitalizacion_episodios FOR UPDATE USING (true) WITH CHECK (true);

-- Camas
CREATE POLICY "camas_read_policy" ON hosix_camas FOR SELECT USING (true);
CREATE POLICY "camas_insert_policy" ON hosix_camas FOR INSERT WITH CHECK (true);

-- Quirófanos
CREATE POLICY "quirofanos_read_policy" ON hosix_quirofanos FOR SELECT USING (activo = true OR true);
CREATE POLICY "quirofanos_intervenciones_read_policy" ON hosix_quirofanos_intervenciones FOR SELECT USING (true);
CREATE POLICY "quirofanos_intervenciones_insert_policy" ON hosix_quirofanos_intervenciones FOR INSERT WITH CHECK (true);

-- Medicamentos y Farmacia
CREATE POLICY "medicamentos_read_policy" ON hosix_medicamentos FOR SELECT USING (activo = true OR true);
CREATE POLICY "prescripciones_read_policy" ON hosix_prescripciones FOR SELECT USING (true);
CREATE POLICY "prescripciones_insert_policy" ON hosix_prescripciones FOR INSERT WITH CHECK (true);
CREATE POLICY "dispensaciones_read_policy" ON hosix_dispensaciones FOR SELECT USING (true);
CREATE POLICY "dispensaciones_insert_policy" ON hosix_dispensaciones FOR INSERT WITH CHECK (true);

-- ============================================================
-- 6. DATOS DE PRUEBA
-- ============================================================

-- Insertar quirófanos de prueba
INSERT INTO hosix_quirofanos (codigo, nombre, area_quirurgica, tipo_quirofano, activo) VALUES
('QF_001', 'Quirófano 1', 'Ala Quirúrgica', 'general', true),
('QF_002', 'Quirófano 2', 'Ala Quirúrgica', 'especializado', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar medicamentos de prueba
INSERT INTO hosix_medicamentos (codigo, nombre_comercial, principio_activo, forma_farmaceutica, activo) VALUES
('MED_001', 'Amoxicilina', 'Amoxicilina', 'Cápsula', true),
('MED_002', 'Paracetamol', 'Paracetamol', 'Tableta', true),
('MED_003', 'Ibuprofeno', 'Ibuprofeno', 'Tableta', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar camas de prueba
INSERT INTO hosix_camas (codigo, nombre, tipo_cama, estado, activo) VALUES
('CAMA_001', 'Cama 1 - Medicina General', 'general', 'disponible', true),
('CAMA_002', 'Cama 2 - Medicina General', 'general', 'disponible', true),
('CAMA_003', 'Cama 3 - Cuidados Intensivos', 'uci', 'disponible', true)
ON CONFLICT (codigo) DO NOTHING;
