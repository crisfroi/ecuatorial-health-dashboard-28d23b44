-- ASIS 9.0 - Módulo de Imagenología (RIS)
-- ========================================

-- Tabla: Modalidades de imagenología
CREATE TABLE IF NOT EXISTS hosix_imagenologia_modalidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_modalidad VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  tipo_modalidad VARCHAR(50), -- RX, CT, MRI, US, PET, etc
  marca_equipo VARCHAR(100),
  modelo_equipo VARCHAR(100),
  numero_serie VARCHAR(100),
  ubicacion VARCHAR(100),
  responsable_id UUID REFERENCES profesionales_sanitarios(id),
  con_contraste BOOLEAN DEFAULT false,
  requiere_sedacion BOOLEAN DEFAULT false,
  tiempo_promedio_estudio_minutos INT,
  costo_estudio DECIMAL(8,2),
  operativa BOOLEAN DEFAULT true,
  fecha_ultima_mantenimiento DATE,
  proxima_mantenimiento DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Protocolos de estudio
CREATE TABLE IF NOT EXISTS hosix_imagenologia_protocolos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_protocolo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  modalidad_id UUID NOT NULL REFERENCES hosix_imagenologia_modalidades(id),
  region_anatomica VARCHAR(100),
  indicaciones TEXT,
  contraindicaciones TEXT,
  preparacion_paciente TEXT,
  parametros_adquisicion JSONB,
  secuencias_protocolo JSONB,
  tiempo_escaneo_minutos INT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Solicitudes de imagenología
CREATE TABLE IF NOT EXISTS hosix_imagenologia_solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_solicitud VARCHAR(50) UNIQUE DEFAULT 'IMG-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(CAST(NEXTVAL('hosix_imagenologia_solicitud_seq') AS TEXT), 4, '0'),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  episodio_id UUID,
  protocolo_id UUID NOT NULL REFERENCES hosix_imagenologia_protocolos(id),
  medico_solicitante_id UUID REFERENCES profesionales_sanitarios(id),
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  fecha_estudio_programada DATE,
  razon_solicitud TEXT NOT NULL,
  diagnostico_presuntivo TEXT,
  informacion_clinica_relevante TEXT,
  medicaciones_contraste JSONB,
  alergias_conocidas TEXT,
  estado_solicitud VARCHAR(30) DEFAULT 'pendiente', -- pendiente, programada, completada, reportada, cancelada
  prioridad VARCHAR(20) DEFAULT 'normal', -- baja, normal, urgente
  requiere_resultado_urgente BOOLEAN DEFAULT false,
  requiere_seguimiento BOOLEAN DEFAULT false,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE SEQUENCE hosix_imagenologia_solicitud_seq START 1;

-- Tabla: Estudios realizados
CREATE TABLE IF NOT EXISTS hosix_imagenologia_estudios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES hosix_imagenologia_solicitudes(id),
  modalidad_id UUID NOT NULL REFERENCES hosix_imagenologia_modalidades(id),
  fecha_hora_inicio TIMESTAMPTZ NOT NULL,
  fecha_hora_fin TIMESTAMPTZ,
  duracion_minutos INT,
  tecnico_realiza_id UUID REFERENCES profesionales_sanitarios(id),
  numero_imagenes INT,
  calidad_imagenes VARCHAR(50), -- optima, aceptable, deficiente
  complicaciones_durante_estudio TEXT,
  uso_contraste BOOLEAN DEFAULT false,
  tipo_contraste VARCHAR(100),
  volumen_contraste_ml DECIMAL(5,2),
  reaccion_contraste BOOLEAN DEFAULT false,
  tipo_reaccion_contraste TEXT,
  radiacion_estimada DECIMAL(6,3), -- mSv
  estado_estudio VARCHAR(30) DEFAULT 'completado', -- en_progreso, completado, fallido
  archivo_dicom_ubicacion VARCHAR(500),
  observaciones_tecnicas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Reportes de imagenología
CREATE TABLE IF NOT EXISTS hosix_imagenologia_reportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudio_id UUID NOT NULL REFERENCES hosix_imagenologia_estudios(id),
  radiologia_especialista_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  fecha_reporte TIMESTAMPTZ DEFAULT now(),
  hallazgos_principales TEXT NOT NULL,
  hallazgos_secundarios TEXT,
  diagnostico_radiologico TEXT,
  impresion_clinica TEXT,
  necesita_seguimiento BOOLEAN DEFAULT false,
  tipo_seguimiento VARCHAR(100),
  plazo_seguimiento_dias INT,
  recomendaciones TEXT,
  tecnicas_futuras_sugeridas TEXT,
  estado_reporte VARCHAR(30) DEFAULT 'borrador', -- borrador, revisado, finalizado
  firmado BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  comparacion_con_estudios_previos TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Comparación con estudios previos
CREATE TABLE IF NOT EXISTS hosix_imagenologia_comparacion_estudios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudio_actual_id UUID NOT NULL REFERENCES hosix_imagenologia_estudios(id),
  estudio_previo_id UUID NOT NULL REFERENCES hosix_imagenologia_estudios(id),
  fecha_estudio_previo DATE,
  cambios_detectados TEXT,
  progresion BOOLEAN,
  regresion BOOLEAN,
  estable BOOLEAN,
  notas_comparativa TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE hosix_imagenologia_modalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_imagenologia_protocolos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_imagenologia_solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_imagenologia_estudios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_imagenologia_reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_imagenologia_comparacion_estudios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Imagenologia modalidades" ON hosix_imagenologia_modalidades
  FOR SELECT USING (operativa = true OR COALESCE((auth.jwt() ->> 'user_role') IN ('admin', 'tecnico_radiologia'), false));

CREATE POLICY "Imagenologia protocolos" ON hosix_imagenologia_protocolos
  FOR SELECT USING (activo = true);

CREATE POLICY "Imagenologia solicitudes visible" ON hosix_imagenologia_solicitudes
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('radiologia', 'tecnico_radiologia', 'medico'), false)
  );

CREATE POLICY "Imagenologia solicitudes crear" ON hosix_imagenologia_solicitudes
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') IN ('medico', 'enfermeria'), false)
  );

CREATE POLICY "Imagenologia estudios visible" ON hosix_imagenologia_estudios
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('radiologia', 'tecnico_radiologia', 'medico'), false)
  );

CREATE POLICY "Imagenologia estudios crear" ON hosix_imagenologia_estudios
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') = 'tecnico_radiologia', false)
  );

CREATE POLICY "Imagenologia reportes visible" ON hosix_imagenologia_reportes
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('radiologia', 'tecnico_radiologia', 'medico'), false)
  );

CREATE POLICY "Imagenologia reportes crear" ON hosix_imagenologia_reportes
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') = 'radiologia', false)
  );

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX idx_imagenologia_solicitudes_paciente ON hosix_imagenologia_solicitudes(paciente_id);
CREATE INDEX idx_imagenologia_solicitudes_fecha ON hosix_imagenologia_solicitudes(fecha_solicitud);
CREATE INDEX idx_imagenologia_solicitudes_estado ON hosix_imagenologia_solicitudes(estado_solicitud);
CREATE INDEX idx_imagenologia_estudios_solicitud ON hosix_imagenologia_estudios(solicitud_id);
CREATE INDEX idx_imagenologia_estudios_modalidad ON hosix_imagenologia_estudios(modalidad_id);
CREATE INDEX idx_imagenologia_reportes_estudio ON hosix_imagenologia_reportes(estudio_id);
CREATE INDEX idx_imagenologia_comparacion ON hosix_imagenologia_comparacion_estudios(estudio_actual_id);

-- ============================================================================
-- SEED DATA: Modalidades y protocolos comunes
-- ============================================================================

INSERT INTO hosix_imagenologia_modalidades (codigo_modalidad, nombre, tipo_modalidad, ubicacion) VALUES
('RX-01', 'Radiografía Digital - Tórax', 'RX', 'Piso 2 - Radiografía'),
('CT-01', 'Tomografía Computarizada Helicoidal', 'CT', 'Piso 3 - TAC'),
('US-01', 'Ultrasonido de Abdomen', 'US', 'Piso 2 - Ultrasonido'),
('MRI-01', 'Resonancia Magnética', 'MRI', 'Piso 3 - RMN'),
('PET-01', 'Tomografía por Emisión de Positrones', 'PET', 'Piso 4 - PET')
ON CONFLICT DO NOTHING;
