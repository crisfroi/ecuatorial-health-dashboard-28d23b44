-- ASIS 11.0 - Módulo de Interconsultas
-- ====================================

-- Tabla: Solicitudes de interconsulta
CREATE TABLE IF NOT EXISTS hosix_interconsultas_solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_solicitud VARCHAR(50) UNIQUE DEFAULT 'IC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(CAST(NEXTVAL('hosix_interconsulta_seq') AS TEXT), 4, '0'),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  episodio_id UUID,
  medico_solicitante_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  especialidad_solicitada VARCHAR(100) NOT NULL,
  especialista_sugerido_id UUID REFERENCES profesionales_sanitarios(id),
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  urgencia VARCHAR(30) DEFAULT 'normal', -- baja, normal, urgente, critica
  motivo_solicitud TEXT NOT NULL,
  diagnostico_presuntivo TEXT,
  informacion_clinica_relevante TEXT,
  hallazgos_exploracion_fisica TEXT,
  resultados_laboratorio_imagenes TEXT,
  medicaciones_actuales JSONB,
  alergias_medicamentos TEXT,
  antecedentes_quirurgicos TEXT,
  historia_enfermedad_actual TEXT,
  preguntas_especificas TEXT,
  estado_solicitud VARCHAR(30) DEFAULT 'pendiente', -- pendiente, asignada, en_evaluacion, respondida, cerrada, cancelada
  especialista_asignado_id UUID REFERENCES profesionales_sanitarios(id),
  fecha_asignacion TIMESTAMPTZ,
  fecha_plazo_respuesta DATE,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE SEQUENCE hosix_interconsulta_seq START 1;

-- Tabla: Respuestas a interconsultas
CREATE TABLE IF NOT EXISTS hosix_interconsultas_respuestas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES hosix_interconsultas_solicitudes(id),
  especialista_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  fecha_respuesta TIMESTAMPTZ DEFAULT now(),
  diagnostico_especialista TEXT NOT NULL,
  diagnostico_diferencial TEXT,
  codigos_cie10 VARCHAR(255),
  hallazgos_examen_clinico TEXT,
  interpretacion_examenes TEXT,
  plan_manejo_recomendado TEXT,
  medicamentos_recomendados JSONB,
  procedimientos_recomendados JSONB,
  interconsulta_adicional_necesaria BOOLEAN DEFAULT false,
  especialidad_interconsulta_adicional VARCHAR(100),
  seguimiento_requiere BOOLEAN DEFAULT false,
  tipo_seguimiento VARCHAR(100), -- presencial, telefonica, por_mail
  plazo_seguimiento_dias INT,
  paciente_puede_regresar_medico_solicitante BOOLEAN DEFAULT true,
  pronostico TEXT,
  complicaciones_riesgos_previstos TEXT,
  criterios_alta_especialista TEXT,
  observaciones_finales TEXT,
  firmado BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Seguimiento de interconsultas
CREATE TABLE IF NOT EXISTS hosix_interconsultas_seguimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES hosix_interconsultas_solicitudes(id),
  respuesta_id UUID NOT NULL REFERENCES hosix_interconsultas_respuestas(id),
  fecha_seguimiento TIMESTAMPTZ DEFAULT now(),
  tipo_seguimiento VARCHAR(100), -- presencial, telefonica, por_mail, otro
  profesional_realiza_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  estado_clinico TEXT,
  adherencia_recomendaciones VARCHAR(100), -- excelente, buena, parcial, mala
  efectividad_tratamiento VARCHAR(100), -- excelente, buena, parcial, inefectiva
  nuevos_sintomas TEXT,
  complicaciones_desarrolladas TEXT,
  necesita_evaluacion_nuevamente BOOLEAN DEFAULT false,
  plan_siguiente_paso TEXT,
  alta_especialista BOOLEAN DEFAULT false,
  motivo_alta TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Registro de derivaciones
CREATE TABLE IF NOT EXISTS hosix_interconsultas_derivaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES hosix_interconsultas_solicitudes(id),
  respuesta_id UUID REFERENCES hosix_interconsultas_respuestas(id),
  centro_derivacion VARCHAR(255),
  especialidad_destino VARCHAR(100),
  motivo_derivacion TEXT NOT NULL,
  se_entrega_documento_paciente BOOLEAN DEFAULT false,
  tipo_documento_entregado TEXT,
  fecha_derivacion DATE NOT NULL,
  responsable_derivacion_id UUID REFERENCES profesionales_sanitarios(id),
  estatus_confirmacion_recepcion VARCHAR(30), -- pendiente, confirmado, no_confirmado
  fecha_confirmacion_recepcion DATE,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Comunicación en la interconsulta
CREATE TABLE IF NOT EXISTS hosix_interconsultas_comunicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES hosix_interconsultas_solicitudes(id),
  tipo_comunicacion VARCHAR(50), -- mail, telefonica, presencial, portal
  remitente_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  destinatario_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  fecha_comunicacion TIMESTAMPTZ DEFAULT now(),
  asunto VARCHAR(255),
  contenido TEXT NOT NULL,
  archivos_adjuntos JSONB,
  es_urgente BOOLEAN DEFAULT false,
  requiere_respuesta BOOLEAN DEFAULT false,
  respuesta_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE hosix_interconsultas_solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_interconsultas_respuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_interconsultas_seguimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_interconsultas_derivaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_interconsultas_comunicaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Interconsultas solicitudes visible" ON hosix_interconsultas_solicitudes
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('medico', 'especialista', 'admin'), false)
  );

CREATE POLICY "Interconsultas solicitudes crear" ON hosix_interconsultas_solicitudes
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') = 'medico', false)
  );

CREATE POLICY "Interconsultas solicitudes actualizar" ON hosix_interconsultas_solicitudes
  FOR UPDATE USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('medico', 'especialista', 'admin'), false)
  );

CREATE POLICY "Interconsultas respuestas visible" ON hosix_interconsultas_respuestas
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('medico', 'especialista', 'admin'), false)
  );

CREATE POLICY "Interconsultas respuestas crear" ON hosix_interconsultas_respuestas
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') = 'especialista', false)
  );

CREATE POLICY "Interconsultas seguimiento visible" ON hosix_interconsultas_seguimiento
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('medico', 'especialista', 'admin'), false)
  );

CREATE POLICY "Interconsultas seguimiento crear" ON hosix_interconsultas_seguimiento
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') IN ('medico', 'especialista'), false)
  );

CREATE POLICY "Interconsultas derivaciones" ON hosix_interconsultas_derivaciones
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('medico', 'especialista', 'admin'), false)
  );

CREATE POLICY "Interconsultas comunicaciones" ON hosix_interconsultas_comunicaciones
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('medico', 'especialista', 'admin'), false)
    OR remitente_id = (SELECT id FROM profesionales_sanitarios WHERE user_id = auth.uid())
    OR destinatario_id = (SELECT id FROM profesionales_sanitarios WHERE user_id = auth.uid())
  );

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX idx_interconsultas_solicitudes_paciente ON hosix_interconsultas_solicitudes(paciente_id);
CREATE INDEX idx_interconsultas_solicitudes_fecha ON hosix_interconsultas_solicitudes(fecha_solicitud);
CREATE INDEX idx_interconsultas_solicitudes_estado ON hosix_interconsultas_solicitudes(estado_solicitud);
CREATE INDEX idx_interconsultas_solicitudes_especialidad ON hosix_interconsultas_solicitudes(especialidad_solicitada);
CREATE INDEX idx_interconsultas_respuestas_solicitud ON hosix_interconsultas_respuestas(solicitud_id);
CREATE INDEX idx_interconsultas_respuestas_especialista ON hosix_interconsultas_respuestas(especialista_id);
CREATE INDEX idx_interconsultas_seguimiento_solicitud ON hosix_interconsultas_seguimiento(solicitud_id);
CREATE INDEX idx_interconsultas_derivaciones_solicitud ON hosix_interconsultas_derivaciones(solicitud_id);
CREATE INDEX idx_interconsultas_comunicaciones_solicitud ON hosix_interconsultas_comunicaciones(solicitud_id);
