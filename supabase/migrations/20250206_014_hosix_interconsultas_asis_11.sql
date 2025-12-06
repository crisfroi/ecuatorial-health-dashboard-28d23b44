-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 014: Módulo de Interconsultas (ASIS 11.0)
-- Fecha: 2025-02-06
-- Descripción: Sistema completo de solicitud, respuesta y seguimiento de interconsultas

-- ============================================================
-- 1. CATÁLOGO DE ESPECIALIDADES PARA INTERCONSULTAS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_interconsultas_especialidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  requiere_internacion BOOLEAN DEFAULT false,
  tiempo_respuesta_dias INT DEFAULT 3,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. SOLICITUDES DE INTERCONSULTA
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_interconsultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  numero_solicitud VARCHAR(20) NOT NULL UNIQUE,
  
  -- Relaciones
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  episodio_id UUID,
  tipo_episodio VARCHAR(50), -- 'urgencia', 'hospitalizacion', 'consulta'
  medico_solicitante_id UUID NOT NULL REFERENCES hosix_usuarios(id),
  servicio_solicitante_id UUID REFERENCES hosix_servicios(id),
  
  -- Especialidad
  especialidad_solicitada_id UUID REFERENCES hosix_interconsultas_especialidades(id),
  especialidad_solicitada VARCHAR(100) NOT NULL,
  medico_solicitado_id UUID REFERENCES hosix_usuarios(id),
  
  -- Información clínica
  motivo_interconsulta TEXT NOT NULL,
  pregunta_clinica TEXT,
  antecedentes_relevantes TEXT,
  hallazgos_relevantes TEXT,
  
  -- Prioridad y urgencia
  prioridad VARCHAR(20) DEFAULT 'normal', -- 'baja', 'normal', 'alta', 'urgente'
  es_urgente BOOLEAN DEFAULT false,
  
  -- Fechas
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_limite_respuesta TIMESTAMPTZ,
  
  -- Estado
  estado_solicitud VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'en_evaluacion', 'respondida', 'cancelada'
  razon_cancelacion TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interconsultas_paciente ON hosix_interconsultas(paciente_id);
CREATE INDEX idx_interconsultas_numero ON hosix_interconsultas(numero_solicitud);
CREATE INDEX idx_interconsultas_estado ON hosix_interconsultas(estado_solicitud);
CREATE INDEX idx_interconsultas_especialidad ON hosix_interconsultas(especialidad_solicitada);
CREATE INDEX idx_interconsultas_medico_solicitado ON hosix_interconsultas(medico_solicitado_id);
CREATE INDEX idx_interconsultas_fecha ON hosix_interconsultas(fecha_solicitud DESC);

-- ============================================================
-- 3. RESPUESTAS DE INTERCONSULTA
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_interconsultas_respuestas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relación
  interconsulta_id UUID NOT NULL REFERENCES hosix_interconsultas(id) ON DELETE CASCADE,
  
  -- Información
  medico_respondiente_id UUID NOT NULL REFERENCES hosix_usuarios(id),
  especialidad_respondiente VARCHAR(100),
  
  -- Contenido
  hallazgos_clinicos TEXT NOT NULL,
  interpretacion_diagnostica TEXT,
  recomendaciones TEXT NOT NULL,
  plan_manejo TEXT,
  
  -- Medicamentos recomendados
  medicamentos_recomendados JSONB DEFAULT '[]',
  
  -- Procedimientos recomendados
  procedimientos_recomendados JSONB DEFAULT '[]',
  
  -- Seguimiento
  requiere_seguimiento BOOLEAN DEFAULT false,
  intervalos_seguimiento VARCHAR(100),
  
  -- Fechas
  fecha_respuesta TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interconsultas_respuestas_interconsulta ON hosix_interconsultas_respuestas(interconsulta_id);
CREATE INDEX idx_interconsultas_respuestas_medico ON hosix_interconsultas_respuestas(medico_respondiente_id);
CREATE INDEX idx_interconsultas_respuestas_fecha ON hosix_interconsultas_respuestas(fecha_respuesta DESC);

-- ============================================================
-- 4. SEGUIMIENTO DE INTERCONSULTAS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_interconsultas_seguimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  interconsulta_id UUID NOT NULL REFERENCES hosix_interconsultas(id) ON DELETE CASCADE,
  respuesta_id UUID REFERENCES hosix_interconsultas_respuestas(id),
  
  -- Información
  profesional_id UUID NOT NULL REFERENCES hosix_usuarios(id),
  tipo_seguimiento VARCHAR(50) NOT NULL, -- 'consulta_virtual', 'consulta_presencial', 'llamada', 'nota_clinica'
  
  -- Contenido
  observaciones TEXT,
  resultado_clinico TEXT,
  complicaciones TEXT,
  
  -- Acciones
  requiere_nueva_interconsulta BOOLEAN DEFAULT false,
  nueva_especialidad_solicitada VARCHAR(100),
  
  -- Fechas
  fecha_seguimiento TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interconsultas_seguimiento_interconsulta ON hosix_interconsultas_seguimiento(interconsulta_id);
CREATE INDEX idx_interconsultas_seguimiento_profesional ON hosix_interconsultas_seguimiento(profesional_id);
CREATE INDEX idx_interconsultas_seguimiento_fecha ON hosix_interconsultas_seguimiento(fecha_seguimiento DESC);

-- ============================================================
-- 5. REFERENCIAS Y DERIVACIONES
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_interconsultas_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relación
  interconsulta_id UUID NOT NULL REFERENCES hosix_interconsultas(id) ON DELETE CASCADE,
  
  -- Derivación
  hospital_destino VARCHAR(255),
  servicio_destino VARCHAR(100),
  razon_derivacion TEXT NOT NULL,
  es_contrarreferencia BOOLEAN DEFAULT false,
  
  -- Responsables
  medico_derivante_id UUID REFERENCES hosix_usuarios(id),
  medico_receptor_id UUID REFERENCES hosix_usuarios(id),
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'aceptada', 'rechazada', 'completada'
  fecha_aceptacion TIMESTAMPTZ,
  
  -- Fechas
  fecha_derivacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interconsultas_referrals_interconsulta ON hosix_interconsultas_referrals(interconsulta_id);
CREATE INDEX idx_interconsultas_referrals_estado ON hosix_interconsultas_referrals(estado);

-- ============================================================
-- 6. COMUNICACIONES / CONVERSACIONES
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_interconsultas_comunicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  interconsulta_id UUID NOT NULL REFERENCES hosix_interconsultas(id) ON DELETE CASCADE,
  
  -- Participantes
  remitente_id UUID NOT NULL REFERENCES hosix_usuarios(id),
  destinatario_id UUID REFERENCES hosix_usuarios(id),
  
  -- Contenido
  tipo_comunicacion VARCHAR(50) NOT NULL, -- 'mensaje', 'comentario', 'aclaracion', 'urgencia'
  contenido TEXT NOT NULL,
  
  -- Archivos adjuntos
  adjuntos JSONB DEFAULT '[]',
  
  -- Estado
  leido BOOLEAN DEFAULT false,
  fecha_lectura TIMESTAMPTZ,
  
  -- Fechas
  fecha_comunicacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interconsultas_comunicaciones_interconsulta ON hosix_interconsultas_comunicaciones(interconsulta_id);
CREATE INDEX idx_interconsultas_comunicaciones_remitente ON hosix_interconsultas_comunicaciones(remitente_id);
CREATE INDEX idx_interconsultas_comunicaciones_destinatario ON hosix_interconsultas_comunicaciones(destinatario_id);
CREATE INDEX idx_interconsultas_comunicaciones_leido ON hosix_interconsultas_comunicaciones(leido);

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE hosix_interconsultas_especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_interconsultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_interconsultas_respuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_interconsultas_seguimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_interconsultas_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_interconsultas_comunicaciones ENABLE ROW LEVEL SECURITY;

-- Política: Médicos ven sus propias solicitudes y respuestas
CREATE POLICY "Médicos ven sus solicitudes" ON hosix_interconsultas
  FOR SELECT USING (
    medico_solicitante_id = auth.uid() OR
    medico_solicitado_id = auth.uid() OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Médicos crean solicitudes" ON hosix_interconsultas
  FOR INSERT WITH CHECK (
    medico_solicitante_id = auth.uid() OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Médicos responden interconsultas" ON hosix_interconsultas_respuestas
  FOR INSERT WITH CHECK (
    medico_respondiente_id = auth.uid() OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Médicos ven respuestas" ON hosix_interconsultas_respuestas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM hosix_interconsultas
      WHERE id = interconsulta_id
      AND (medico_solicitante_id = auth.uid() OR medico_solicitado_id = auth.uid())
    ) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- ============================================================
-- 8. DATOS SEMILLA
-- ============================================================

INSERT INTO hosix_interconsultas_especialidades (nombre, descripcion, requiere_internacion, tiempo_respuesta_dias)
VALUES
  ('Cardiología', 'Enfermedades del corazón y sistema vascular', false, 3),
  ('Neurología', 'Enfermedades del sistema nervioso', false, 3),
  ('Endocrinología', 'Enfermedades endocrinas y metabolismo', false, 5),
  ('Infectología', 'Enfermedades infecciosas', true, 2),
  ('Oncología', 'Cáncer y tumores', true, 5),
  ('Psiquiatría', 'Trastornos mentales y del comportamiento', false, 7),
  ('Traumatología', 'Lesiones óseas y articulares', true, 2),
  ('Oftalmología', 'Enfermedades oculares', false, 5),
  ('ORL', 'Otorrinolaringología', false, 4),
  ('Neurocirugía', 'Cirugía del sistema nervioso', true, 3),
  ('Cirugía General', 'Cirugía general y urgencias quirúrgicas', true, 2),
  ('Anestesiología', 'Anestesia y cuidados perioperatorios', true, 1),
  ('Neumología', 'Enfermedades respiratorias', false, 3),
  ('Gastroenterología', 'Enfermedades digestivas', false, 4),
  ('Nefrología', 'Enfermedades renales', false, 4),
  ('Hematología', 'Enfermedades de la sangre', false, 5),
  ('Reumatología', 'Enfermedades reumáticas', false, 7),
  ('Dermatología', 'Enfermedades de la piel', false, 7),
  ('Ginecología', 'Salud femenina y obstetricia', true, 3),
  ('Pediatría', 'Medicina del niño', true, 2)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. FUNCIÓN PARA GENERAR NÚMERO DE SOLICITUD
-- ============================================================

CREATE OR REPLACE FUNCTION generar_numero_interconsulta()
RETURNS VARCHAR AS $$
DECLARE
  v_numero VARCHAR(20);
  v_anio INT;
  v_consecutivo INT;
BEGIN
  v_anio := EXTRACT(YEAR FROM NOW());
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_solicitud, 8) AS INT)), 0) + 1
  INTO v_consecutivo
  FROM hosix_interconsultas
  WHERE EXTRACT(YEAR FROM fecha_solicitud) = v_anio;
  
  v_numero := 'INTC-' || v_anio || '-' || LPAD(v_consecutivo::TEXT, 5, '0');
  
  RETURN v_numero;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 10. TRIGGER PARA NÚMERO AUTOMÁTICO DE SOLICITUD
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_generar_numero_interconsulta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_solicitud IS NULL THEN
    NEW.numero_solicitud := generar_numero_interconsulta();
  END IF;
  
  -- Calcular fecha límite de respuesta
  IF NEW.fecha_limite_respuesta IS NULL THEN
    NEW.fecha_limite_respuesta := NOW() + INTERVAL '3 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_numero_interconsulta ON hosix_interconsultas;
CREATE TRIGGER trigger_numero_interconsulta
BEFORE INSERT ON hosix_interconsultas
FOR EACH ROW
EXECUTE FUNCTION trigger_generar_numero_interconsulta();

-- ============================================================
-- 11. TRIGGER PARA ACTUALIZAR ESTADO AL RESPONDER
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_actualizar_estado_interconsulta()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hosix_interconsultas
  SET estado_solicitud = 'respondida', updated_at = NOW()
  WHERE id = NEW.interconsulta_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_estado_al_responder ON hosix_interconsultas_respuestas;
CREATE TRIGGER trigger_actualizar_estado_al_responder
AFTER INSERT ON hosix_interconsultas_respuestas
FOR EACH ROW
EXECUTE FUNCTION trigger_actualizar_estado_interconsulta();

-- ============================================================
-- 12. VISTAS ÚTILES
-- ============================================================

CREATE OR REPLACE VIEW hosix_interconsultas_pendientes AS
SELECT 
  ic.id,
  ic.numero_solicitud,
  ic.especialidad_solicitada,
  p.nombre as paciente_nombre,
  u_solicitante.nombre as medico_solicitante,
  u_solicitado.nombre as medico_solicitado,
  ic.prioridad,
  ic.fecha_solicitud,
  ic.fecha_limite_respuesta,
  CURRENT_DATE - ic.fecha_solicitud::DATE as dias_espera,
  ic.es_urgente
FROM hosix_interconsultas ic
LEFT JOIN hosix_pacientes p ON ic.paciente_id = p.id
LEFT JOIN hosix_usuarios u_solicitante ON ic.medico_solicitante_id = u_solicitante.id
LEFT JOIN hosix_usuarios u_solicitado ON ic.medico_solicitado_id = u_solicitado.id
WHERE ic.estado_solicitud IN ('pendiente', 'en_evaluacion')
ORDER BY 
  CASE WHEN ic.es_urgente THEN 0 ELSE 1 END,
  CASE 
    WHEN ic.prioridad = 'urgente' THEN 0
    WHEN ic.prioridad = 'alta' THEN 1
    WHEN ic.prioridad = 'normal' THEN 2
    ELSE 3
  END,
  ic.fecha_solicitud ASC;

CREATE OR REPLACE VIEW hosix_interconsultas_respondidas AS
SELECT 
  ic.numero_solicitud,
  ic.especialidad_solicitada,
  p.nombre as paciente_nombre,
  u_respondiente.nombre as medico_respondiente,
  ir.fecha_respuesta,
  EXTRACT(DAY FROM ir.fecha_respuesta - ic.fecha_solicitud) as dias_respuesta
FROM hosix_interconsultas ic
INNER JOIN hosix_interconsultas_respuestas ir ON ic.id = ir.interconsulta_id
LEFT JOIN hosix_pacientes p ON ic.paciente_id = p.id
LEFT JOIN hosix_usuarios u_respondiente ON ir.medico_respondiente_id = u_respondiente.id
ORDER BY ir.fecha_respuesta DESC;

-- ============================================================
-- 13. COMENTARIOS DE TABLAS
-- ============================================================

COMMENT ON TABLE hosix_interconsultas IS 'Solicitudes de interconsulta entre especialidades médicas';
COMMENT ON TABLE hosix_interconsultas_respuestas IS 'Respuestas de especialistas a solicitudes de interconsulta';
COMMENT ON TABLE hosix_interconsultas_seguimiento IS 'Seguimiento clínico de las recomendaciones de interconsultas';
COMMENT ON TABLE hosix_interconsultas_referrals IS 'Derivaciones y contraderivaciones entre instituciones';
COMMENT ON TABLE hosix_interconsultas_comunicaciones IS 'Canal de comunicación entre profesionales sobre interconsultas';
