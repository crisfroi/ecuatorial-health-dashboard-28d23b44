-- ASIS 8.0 - Módulo de Laboratorio Clínico
-- =======================================

-- Tabla: Catálogo de pruebas de laboratorio
CREATE TABLE IF NOT EXISTS hosix_laboratorio_pruebas_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_prueba VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  grupo_prueba VARCHAR(100), -- Hematología, Bioquímica, Inmunología, etc
  descripcion TEXT,
  especimen_requerido VARCHAR(100), -- Sangre, orina, etc
  volumen_ml INT,
  tiempo_procesamiento_horas INT,
  requiere_ayuno BOOLEAN DEFAULT false,
  unidad_resultado VARCHAR(50),
  valor_referencia_minimo DECIMAL(10,2),
  valor_referencia_maximo DECIMAL(10,2),
  costo_prueba DECIMAL(8,2),
  activa BOOLEAN DEFAULT true,
  acta_segun TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Solicitudes de laboratorio
CREATE TABLE IF NOT EXISTS hosix_laboratorio_solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_solicitud VARCHAR(50) UNIQUE DEFAULT 'LAB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(CAST(NEXTVAL('hosix_laboratorio_solicitud_seq') AS TEXT), 4, '0'),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  episodio_id UUID,
  medico_solicitante_id UUID REFERENCES profesionales_sanitarios(id),
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  fecha_realizacion DATE,
  razon_solicitud TEXT NOT NULL,
  diagnostico_presuntivo TEXT,
  medicaciones_actuales JSONB,
  observaciones_preanalitical TEXT,
  estado_solicitud VARCHAR(30) DEFAULT 'pendiente', -- pendiente, recibida, procesando, completada, cancelada
  prioridad VARCHAR(20) DEFAULT 'normal', -- baja, normal, urgente, critica
  requiere_resultado_urgente BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE SEQUENCE hosix_laboratorio_solicitud_seq START 1;

-- Tabla: Detalles de solicitud (pruebas solicitadas)
CREATE TABLE IF NOT EXISTS hosix_laboratorio_solicitud_detalles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES hosix_laboratorio_solicitudes(id),
  prueba_id UUID NOT NULL REFERENCES hosix_laboratorio_pruebas_catalogo(id),
  cantidad INT DEFAULT 1,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Muestras de laboratorio
CREATE TABLE IF NOT EXISTS hosix_laboratorio_muestras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES hosix_laboratorio_solicitudes(id),
  numero_muestra VARCHAR(50) UNIQUE,
  tipo_especimen VARCHAR(100),
  fecha_toma TIMESTAMPTZ NOT NULL,
  enfermero_toma_id UUID REFERENCES profesionales_sanitarios(id),
  volumen_obtenido_ml DECIMAL(5,2),
  estado_muestra VARCHAR(30) DEFAULT 'valida', -- valida, hemolizada, insuficiente, contaminada
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Resultados de laboratorio
CREATE TABLE IF NOT EXISTS hosix_laboratorio_resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES hosix_laboratorio_solicitudes(id),
  muestra_id UUID REFERENCES hosix_laboratorio_muestras(id),
  prueba_id UUID NOT NULL REFERENCES hosix_laboratorio_pruebas_catalogo(id),
  resultado_numerico DECIMAL(15,4),
  resultado_texto VARCHAR(255),
  valor_referencia_minimo DECIMAL(10,2),
  valor_referencia_maximo DECIMAL(10,2),
  unidad VARCHAR(50),
  esta_fuera_rango BOOLEAN DEFAULT false,
  critico BOOLEAN DEFAULT false,
  anomalias_detectadas TEXT,
  fecha_resultado TIMESTAMPTZ NOT NULL,
  analista_id UUID REFERENCES profesionales_sanitarios(id),
  requiere_confirmacion BOOLEAN DEFAULT false,
  confirmado BOOLEAN DEFAULT false,
  metodo_analisis VARCHAR(100),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Interpretación de resultados
CREATE TABLE IF NOT EXISTS hosix_laboratorio_interpretacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resultado_id UUID NOT NULL REFERENCES hosix_laboratorio_resultados(id),
  medico_interpreta_id UUID REFERENCES profesionales_sanitarios(id),
  interpretacion TEXT NOT NULL,
  hallazgos_clinicamente_significativos TEXT,
  recomendaciones_seguimiento TEXT,
  pruebas_complementarias_sugeridas JSONB,
  derivacion_especialista BOOLEAN DEFAULT false,
  especialidad_derivacion VARCHAR(100),
  fecha_interpretacion TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE hosix_laboratorio_pruebas_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_laboratorio_solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_laboratorio_solicitud_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_laboratorio_muestras ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_laboratorio_resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_laboratorio_interpretacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lab catalogo publico" ON hosix_laboratorio_pruebas_catalogo
  FOR SELECT USING (true);

CREATE POLICY "Lab solicitudes visible" ON hosix_laboratorio_solicitudes
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('laboratorista', 'medico', 'enfermeria'), false)
    OR COALESCE((auth.jwt() ->> 'user_role') = 'admin', false)
  );

CREATE POLICY "Lab solicitudes crear" ON hosix_laboratorio_solicitudes
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') IN ('medico', 'enfermeria'), false)
  );

CREATE POLICY "Lab detalles visible" ON hosix_laboratorio_solicitud_detalles
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('laboratorista', 'medico', 'enfermeria'), false)
  );

CREATE POLICY "Lab muestras visible" ON hosix_laboratorio_muestras
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('laboratorista', 'enfermeria', 'medico'), false)
  );

CREATE POLICY "Lab muestras crear" ON hosix_laboratorio_muestras
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') IN ('laboratorista', 'enfermeria'), false)
  );

CREATE POLICY "Lab resultados visible" ON hosix_laboratorio_resultados
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('laboratorista', 'medico', 'enfermeria'), false)
  );

CREATE POLICY "Lab resultados crear" ON hosix_laboratorio_resultados
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') = 'laboratorista', false)
  );

CREATE POLICY "Lab interpretacion visible" ON hosix_laboratorio_interpretacion
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('laboratorista', 'medico'), false)
  );

CREATE POLICY "Lab interpretacion crear" ON hosix_laboratorio_interpretacion
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') = 'medico', false)
  );

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX idx_lab_solicitudes_paciente ON hosix_laboratorio_solicitudes(paciente_id);
CREATE INDEX idx_lab_solicitudes_fecha ON hosix_laboratorio_solicitudes(fecha_solicitud);
CREATE INDEX idx_lab_solicitudes_estado ON hosix_laboratorio_solicitudes(estado_solicitud);
CREATE INDEX idx_lab_solicitud_detalles ON hosix_laboratorio_solicitud_detalles(solicitud_id);
CREATE INDEX idx_lab_muestras_solicitud ON hosix_laboratorio_muestras(solicitud_id);
CREATE INDEX idx_lab_resultados_solicitud ON hosix_laboratorio_resultados(solicitud_id);
CREATE INDEX idx_lab_resultados_prueba ON hosix_laboratorio_resultados(prueba_id);
CREATE INDEX idx_lab_interpretacion_resultado ON hosix_laboratorio_interpretacion(resultado_id);

-- ============================================================================
-- SEED DATA: Pruebas comunes
-- ============================================================================

INSERT INTO hosix_laboratorio_pruebas_catalogo 
(codigo_prueba, nombre, grupo_prueba, especimen_requerido, unidad_resultado, valor_referencia_minimo, valor_referencia_maximo) VALUES
('HC', 'Hemograma Completo', 'Hematología', 'Sangre', 'Células/μL', 4.5, 11.0),
('GLUC', 'Glucosa en ayuno', 'Bioquímica', 'Sangre', 'mg/dL', 70, 100),
('CREAT', 'Creatinina', 'Bioquímica', 'Sangre', 'mg/dL', 0.6, 1.2),
('BUN', 'Nitrógeno Ureico', 'Bioquímica', 'Sangre', 'mg/dL', 7, 20),
('ALT', 'Alanina Aminotransferasa', 'Bioquímica', 'Sangre', 'U/L', 7, 56),
('AST', 'Aspartato Aminotransferasa', 'Bioquímica', 'Sangre', 'U/L', 10, 40),
('BILI', 'Bilirrubina Total', 'Bioquímica', 'Sangre', 'mg/dL', 0.1, 1.2),
('COL', 'Colesterol Total', 'Bioquímica', 'Sangre', 'mg/dL', 150, 200),
('TRP', 'Triglicéridos', 'Bioquímica', 'Sangre', 'mg/dL', 50, 150),
('TSH', 'Hormona Estimulante Tiroidea', 'Inmunología', 'Sangre', 'mIU/L', 0.4, 4.0),
('VIH', 'Prueba VIH', 'Inmunología', 'Sangre', 'Positivo/Negativo', 0, 1),
('SIFILIS', 'RPR/Sífilis', 'Inmunología', 'Sangre', 'Positivo/Negativo', 0, 1),
('CULTIVO', 'Cultivo General', 'Microbiología', 'Sangre', 'Positivo/Negativo', 0, 1),
('ACO', 'Análisis de Coagulación', 'Hematología', 'Sangre', 'Segundos', 11, 13.5)
ON CONFLICT DO NOTHING;
