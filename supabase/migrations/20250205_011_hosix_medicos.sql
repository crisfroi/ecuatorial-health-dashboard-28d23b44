-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 011: Módulo de Médicos
-- Fecha: 2025-02-05
-- Descripción: Implementación completa del módulo asistencial de Médicos

-- ============================================================
-- 1. WORKLIST DE MÉDICOS
-- ============================================================
-- Lista de pacientes asignados a médicos por servicio/especialidad
CREATE TABLE IF NOT EXISTS hosix_medicos_worklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID, -- Puede ser urgencia, hospitalización, consulta, etc.
  tipo_episodio VARCHAR(50) NOT NULL, -- 'urgencia', 'hospitalizacion', 'consulta', 'quirofano'
  servicio_id UUID REFERENCES hosix_servicios(id),
  
  -- Asignación
  medico_asignado_id UUID REFERENCES hosix_usuarios(id),
  fecha_asignacion TIMESTAMPTZ DEFAULT now(),
  
  -- Estado y prioridad
  estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'en_consulta', 'completado', 'cancelado'
  prioridad VARCHAR(20) DEFAULT 'normal', -- 'baja', 'normal', 'alta', 'critica'
  
  -- Información adicional
  motivo_consulta TEXT,
  observaciones TEXT,
  requiere_seguimiento BOOLEAN DEFAULT false,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_medicos_worklist_paciente ON hosix_medicos_worklist(paciente_id);
CREATE INDEX idx_medicos_worklist_episodio ON hosix_medicos_worklist(episodio_id, tipo_episodio);
CREATE INDEX idx_medicos_worklist_medico ON hosix_medicos_worklist(medico_asignado_id);
CREATE INDEX idx_medicos_worklist_estado ON hosix_medicos_worklist(estado, prioridad);
CREATE INDEX idx_medicos_worklist_servicio ON hosix_medicos_worklist(servicio_id);

-- ============================================================
-- 2. DIAGNÓSTICOS MÉDICOS
-- ============================================================
-- Diagnósticos asociados a episodios/consultas
CREATE TABLE IF NOT EXISTS hosix_diagnosticos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_medicos_worklist(id),
  consulta_id UUID, -- Referencia a consulta médica si aplica
  
  -- Diagnóstico
  codigo_cie10_id UUID REFERENCES hosix_codificacion_cie10(id),
  codigo_cie10 VARCHAR(20), -- Código CIE-10
  descripcion_diagnostico TEXT NOT NULL,
  tipo_diagnostico VARCHAR(50) DEFAULT 'principal', -- 'principal', 'secundario', 'complicacion', 'comorbilidad'
  
  -- Clasificación
  certeza VARCHAR(50) DEFAULT 'presuntivo', -- 'presuntivo', 'confirmado', 'diferencial'
  fecha_diagnostico TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Profesional
  medico_id UUID REFERENCES hosix_usuarios(id),
  
  -- Observaciones
  observaciones TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_diagnosticos_paciente ON hosix_diagnosticos(paciente_id, fecha_diagnostico DESC);
CREATE INDEX idx_diagnosticos_episodio ON hosix_diagnosticos(episodio_id, tipo_episodio);
CREATE INDEX idx_diagnosticos_cie10 ON hosix_diagnosticos(codigo_cie10);
CREATE INDEX idx_diagnosticos_tipo ON hosix_diagnosticos(tipo_diagnostico);

-- ============================================================
-- 3. TRATAMIENTOS MÉDICOS
-- ============================================================
-- Tratamientos y terapias prescritas
CREATE TABLE IF NOT EXISTS hosix_tratamientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_medicos_worklist(id),
  diagnostico_id UUID REFERENCES hosix_diagnosticos(id),
  
  -- Tratamiento
  tipo_tratamiento VARCHAR(50) NOT NULL, -- 'medicamento', 'terapia', 'procedimiento', 'quirurgico', 'fisioterapia', 'otro'
  descripcion TEXT NOT NULL,
  indicaciones TEXT,
  
  -- Duración
  fecha_inicio TIMESTAMPTZ DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  duracion_dias INT,
  
  -- Profesional
  medico_id UUID REFERENCES hosix_usuarios(id),
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'activo', -- 'activo', 'suspendido', 'completado', 'cancelado'
  
  -- Resultado
  resultado TEXT,
  efectividad VARCHAR(50), -- 'efectivo', 'parcial', 'inefectivo', 'pendiente'
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tratamientos_paciente ON hosix_tratamientos(paciente_id, fecha_inicio DESC);
CREATE INDEX idx_tratamientos_episodio ON hosix_tratamientos(episodio_id, tipo_episodio);
CREATE INDEX idx_tratamientos_diagnostico ON hosix_tratamientos(diagnostico_id);
CREATE INDEX idx_tratamientos_estado ON hosix_tratamientos(estado);

-- ============================================================
-- 4. INTERCONSULTAS MÉDICAS
-- ============================================================
-- Solicitudes y respuestas de interconsultas
CREATE TABLE IF NOT EXISTS hosix_interconsultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_medicos_worklist(id),
  
  -- Solicitud
  servicio_solicitante_id UUID REFERENCES hosix_servicios(id),
  servicio_destino_id UUID REFERENCES hosix_servicios(id) NOT NULL,
  medico_solicitante_id UUID REFERENCES hosix_usuarios(id),
  medico_destino_id UUID REFERENCES hosix_usuarios(id),
  
  -- Motivo y pregunta clínica
  motivo_interconsulta TEXT NOT NULL,
  pregunta_clinica TEXT,
  antecedentes_relevantes TEXT,
  
  -- Urgencia
  urgencia VARCHAR(20) DEFAULT 'normal', -- 'baja', 'normal', 'alta', 'critica'
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  fecha_limite_respuesta TIMESTAMPTZ,
  
  -- Respuesta
  fecha_respuesta TIMESTAMPTZ,
  respuesta_medica TEXT,
  recomendaciones TEXT,
  requiere_seguimiento BOOLEAN DEFAULT false,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'en_revision', 'respondida', 'cancelada'
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interconsultas_paciente ON hosix_interconsultas(paciente_id, fecha_solicitud DESC);
CREATE INDEX idx_interconsultas_episodio ON hosix_interconsultas(episodio_id, tipo_episodio);
CREATE INDEX idx_interconsultas_estado ON hosix_interconsultas(estado, urgencia);
CREATE INDEX idx_interconsultas_servicio_destino ON hosix_interconsultas(servicio_destino_id);

-- ============================================================
-- 5. CONSULTAS MÉDICAS
-- ============================================================
-- Registro detallado de consultas médicas
CREATE TABLE IF NOT EXISTS hosix_consultas_medicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_medicos_worklist(id),
  cita_id UUID REFERENCES hosix_citas(id),
  
  -- Fecha y profesional
  fecha_consulta TIMESTAMPTZ NOT NULL DEFAULT now(),
  medico_id UUID REFERENCES hosix_usuarios(id) NOT NULL,
  servicio_id UUID REFERENCES hosix_servicios(id),
  
  -- Anamnesis
  motivo_consulta TEXT,
  enfermedad_actual TEXT,
  antecedentes_personales TEXT,
  antecedentes_familiares TEXT,
  alergias TEXT[],
  medicamentos_actuales JSONB DEFAULT '[]',
  
  -- Exploración física
  exploracion_fisica JSONB DEFAULT '{}',
  -- Ejemplo: { "ta": "120/80", "fc": 72, "fr": 16, "temp": 36.5, "peso": 70, "talla": 170 }
  
  -- Diagnósticos de la consulta
  diagnosticos_principales UUID[], -- Referencias a hosix_diagnosticos
  diagnosticos_secundarios UUID[],
  
  -- Plan terapéutico
  plan_terapeutico TEXT,
  tratamientos_prescritos UUID[], -- Referencias a hosix_tratamientos
  prescripciones UUID[], -- Referencias a hosix_prescripciones
  
  -- Órdenes y solicitudes
  ordenes_laboratorio JSONB DEFAULT '[]',
  ordenes_imagenologia JSONB DEFAULT '[]',
  ordenes_otros JSONB DEFAULT '[]',
  
  -- Seguimiento
  requiere_control BOOLEAN DEFAULT false,
  fecha_proximo_control DATE,
  observaciones TEXT,
  
  -- Firma
  firmado BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_consultas_paciente ON hosix_consultas_medicas(paciente_id, fecha_consulta DESC);
CREATE INDEX idx_consultas_episodio ON hosix_consultas_medicas(episodio_id, tipo_episodio);
CREATE INDEX idx_consultas_medico ON hosix_consultas_medicas(medico_id);
CREATE INDEX idx_consultas_fecha ON hosix_consultas_medicas(fecha_consulta);

-- ============================================================
-- 6. CUESTIONARIOS Y ESCALAS CLÍNICAS
-- ============================================================
-- Registro de cuestionarios y escalas aplicadas
CREATE TABLE IF NOT EXISTS hosix_cuestionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  consulta_id UUID REFERENCES hosix_consultas_medicas(id),
  
  -- Cuestionario
  nombre_cuestionario VARCHAR(255) NOT NULL, -- 'Barthel', 'Glasgow', 'Norton', etc.
  tipo_cuestionario VARCHAR(100), -- 'dependencia', 'cognitivo', 'dolor', 'nutricional', etc.
  version VARCHAR(50),
  
  -- Fecha y profesional
  fecha_aplicacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  aplicado_por UUID REFERENCES hosix_usuarios(id),
  
  -- Respuestas (JSON flexible)
  respuestas JSONB NOT NULL DEFAULT '{}',
  puntuacion_total NUMERIC(5,2),
  interpretacion TEXT,
  
  -- Observaciones
  observaciones TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cuestionarios_paciente ON hosix_cuestionarios(paciente_id, fecha_aplicacion DESC);
CREATE INDEX idx_cuestionarios_tipo ON hosix_cuestionarios(tipo_cuestionario);
CREATE INDEX idx_cuestionarios_nombre ON hosix_cuestionarios(nombre_cuestionario);

-- ============================================================
-- 7. MAPAS DENTALES
-- ============================================================
-- Mapas dentales para odontología
CREATE TABLE IF NOT EXISTS hosix_mapas_dentales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  consulta_id UUID REFERENCES hosix_consultas_medicas(id),
  
  -- Tipo de mapa
  tipo_mapa VARCHAR(50) DEFAULT 'adulto', -- 'adulto', 'pediatrico', 'mixto'
  
  -- Datos del mapa (JSON para flexibilidad)
  dientes JSONB NOT NULL DEFAULT '{}',
  -- Estructura: { "11": { "estado": "sano", "tratamiento": "obturacion", "fecha": "2025-01-15" }, ... }
  
  -- Fecha
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT now(),
  creado_por UUID REFERENCES hosix_usuarios(id),
  
  -- Observaciones
  observaciones TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mapas_dentales_paciente ON hosix_mapas_dentales(paciente_id, fecha_creacion DESC);

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE hosix_medicos_worklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_diagnosticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_tratamientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_interconsultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_consultas_medicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cuestionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_mapas_dentales ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas
CREATE POLICY "medicos_worklist_read" ON hosix_medicos_worklist FOR SELECT USING (true);
CREATE POLICY "medicos_worklist_insert" ON hosix_medicos_worklist FOR INSERT WITH CHECK (true);
CREATE POLICY "medicos_worklist_update" ON hosix_medicos_worklist FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "diagnosticos_read" ON hosix_diagnosticos FOR SELECT USING (true);
CREATE POLICY "diagnosticos_insert" ON hosix_diagnosticos FOR INSERT WITH CHECK (true);
CREATE POLICY "diagnosticos_update" ON hosix_diagnosticos FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "tratamientos_read" ON hosix_tratamientos FOR SELECT USING (true);
CREATE POLICY "tratamientos_insert" ON hosix_tratamientos FOR INSERT WITH CHECK (true);
CREATE POLICY "tratamientos_update" ON hosix_tratamientos FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "interconsultas_read" ON hosix_interconsultas FOR SELECT USING (true);
CREATE POLICY "interconsultas_insert" ON hosix_interconsultas FOR INSERT WITH CHECK (true);
CREATE POLICY "interconsultas_update" ON hosix_interconsultas FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "consultas_read" ON hosix_consultas_medicas FOR SELECT USING (true);
CREATE POLICY "consultas_insert" ON hosix_consultas_medicas FOR INSERT WITH CHECK (true);
CREATE POLICY "consultas_update" ON hosix_consultas_medicas FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "cuestionarios_read" ON hosix_cuestionarios FOR SELECT USING (true);
CREATE POLICY "cuestionarios_insert" ON hosix_cuestionarios FOR INSERT WITH CHECK (true);
CREATE POLICY "cuestionarios_update" ON hosix_cuestionarios FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "mapas_dentales_read" ON hosix_mapas_dentales FOR SELECT USING (true);
CREATE POLICY "mapas_dentales_insert" ON hosix_mapas_dentales FOR INSERT WITH CHECK (true);
CREATE POLICY "mapas_dentales_update" ON hosix_mapas_dentales FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- 9. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================

COMMENT ON TABLE hosix_medicos_worklist IS 'Worklist de pacientes asignados a médicos por servicio/especialidad';
COMMENT ON TABLE hosix_diagnosticos IS 'Diagnósticos médicos asociados a episodios/consultas';
COMMENT ON TABLE hosix_tratamientos IS 'Tratamientos y terapias prescritas por médicos';
COMMENT ON TABLE hosix_interconsultas IS 'Solicitudes y respuestas de interconsultas médicas';
COMMENT ON TABLE hosix_consultas_medicas IS 'Registro detallado de consultas médicas';
COMMENT ON TABLE hosix_cuestionarios IS 'Registro de cuestionarios y escalas clínicas aplicadas';
COMMENT ON TABLE hosix_mapas_dentales IS 'Mapas dentales para odontología';

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================

