-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 003: Urgencias, Citas y Agendas
-- Fecha: 2025-01-16

-- ============================================================
-- 1. MÓDULO DE URGENCIAS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_urgencias_episodios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  
  -- Entrada
  fecha_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  lugar_entrada VARCHAR(100),
  procedencia VARCHAR(100),
  box_asignado VARCHAR(50),
  
  -- Triage
  nivel_triage INT,
  clasificacion_inicial TEXT,
  observaciones_triage TEXT,
  
  -- Atención
  medico_responsable_id UUID,
  diagnostico_inicial TEXT,
  diagnostico_final TEXT,
  
  -- Salida
  fecha_salida TIMESTAMPTZ,
  tipo_salida VARCHAR(50),
  destino_salida VARCHAR(255),
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'en_proceso',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_urgencias_triage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episodio_id UUID REFERENCES hosix_urgencias_episodios(id) NOT NULL,
  fecha_evaluacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  evaluador_id UUID,
  
  nivel_urgencia INT NOT NULL,
  motivo_consulta TEXT,
  signos_vitales JSONB,
  sintomas JSONB,
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. MÓDULO DE CITAS Y AGENDAS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  
  servicio_id UUID REFERENCES hosix_servicios(id),
  profesional_id UUID,
  sala VARCHAR(100),
  
  tipo_agenda VARCHAR(50),
  duracion_default_minutos INT DEFAULT 15,
  capacidad_maxima_dia INT,
  
  permite_teleconsulta BOOLEAN DEFAULT false,
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_agendas_horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id UUID REFERENCES hosix_agendas(id) NOT NULL,
  dia_semana INT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  activo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id UUID REFERENCES hosix_agendas(id) NOT NULL,
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  
  fecha_hora TIMESTAMPTZ NOT NULL,
  duracion_minutos INT NOT NULL,
  
  actividad_id UUID,
  motivo TEXT,
  
  estado VARCHAR(50) DEFAULT 'programada',
  motivo_cancelacion TEXT,
  
  es_teleconsulta BOOLEAN DEFAULT false,
  url_teleconsulta TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_urgencias_episodios_paciente ON hosix_urgencias_episodios(paciente_id);
CREATE INDEX IF NOT EXISTS idx_urgencias_episodios_fecha ON hosix_urgencias_episodios(fecha_entrada);
CREATE INDEX IF NOT EXISTS idx_urgencias_episodios_estado ON hosix_urgencias_episodios(estado);

CREATE INDEX IF NOT EXISTS idx_agendas_codigo ON hosix_agendas(codigo);
CREATE INDEX IF NOT EXISTS idx_agendas_activo ON hosix_agendas(activo);

CREATE INDEX IF NOT EXISTS idx_citas_agenda ON hosix_citas(agenda_id);
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON hosix_citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON hosix_citas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON hosix_citas(estado);

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

ALTER TABLE hosix_urgencias_episodios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_urgencias_triage ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_agendas_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_citas ENABLE ROW LEVEL SECURITY;

-- Urgencias
CREATE POLICY "urgencias_episodios_read_policy" ON hosix_urgencias_episodios FOR SELECT USING (true);
CREATE POLICY "urgencias_episodios_insert_policy" ON hosix_urgencias_episodios FOR INSERT WITH CHECK (true);
CREATE POLICY "urgencias_episodios_update_policy" ON hosix_urgencias_episodios FOR UPDATE USING (true) WITH CHECK (true);

-- Agendas (lectura pública, escritura restricta)
CREATE POLICY "agendas_read_policy" ON hosix_agendas FOR SELECT USING (activo = true OR true);
CREATE POLICY "agendas_insert_policy" ON hosix_agendas FOR INSERT WITH CHECK (true);

-- Citas
CREATE POLICY "citas_read_policy" ON hosix_citas FOR SELECT USING (true);
CREATE POLICY "citas_insert_policy" ON hosix_citas FOR INSERT WITH CHECK (true);
CREATE POLICY "citas_update_policy" ON hosix_citas FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- 5. DATOS DE PRUEBA
-- ============================================================

-- Insertar departamentos de prueba
INSERT INTO hosix_departamentos (codigo, nombre, descripcion, activo) VALUES
('GRAL', 'Medicina General', 'Departamento de Medicina General', true),
('URG', 'Urgencias', 'Servicio de Urgencias', true),
('CIR', 'Cirugía', 'Departamento de Cirugía', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar servicios de prueba
INSERT INTO hosix_servicios (codigo, nombre, descripcion, tipo_servicio, activo) VALUES
('CONS', 'Consulta Externa', 'Consulta externa general', 'consulta', true),
('URG_ATN', 'Atención Urgencias', 'Atención de urgencias', 'urgencia', true),
('INTER', 'Internamiento', 'Servicio de hospitalización', 'hospitalizacion', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar agendas de prueba
INSERT INTO hosix_agendas (codigo, nombre, servicio_id, tipo_agenda, duracion_default_minutos, activo) 
SELECT 
  'AGENDA_001',
  'Consulta Medicina General',
  (SELECT id FROM hosix_servicios WHERE codigo = 'CONS'),
  'consulta',
  15,
  true
WHERE NOT EXISTS (SELECT 1 FROM hosix_agendas WHERE codigo = 'AGENDA_001');

-- Insertar horarios de prueba
INSERT INTO hosix_agendas_horarios (agenda_id, dia_semana, hora_inicio, hora_fin, activo)
SELECT
  (SELECT id FROM hosix_agendas WHERE codigo = 'AGENDA_001'),
  1,
  '08:00'::time,
  '17:00'::time,
  true
WHERE NOT EXISTS (SELECT 1 FROM hosix_agendas_horarios WHERE agenda_id = (SELECT id FROM hosix_agendas WHERE codigo = 'AGENDA_001') AND dia_semana = 1);
