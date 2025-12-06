-- ASIS 10.0 - Módulo de Farmacia Clínica
-- =======================================

-- Tabla: Dispensarios (mostradores de farmacia)
CREATE TABLE IF NOT EXISTS hosix_farmacia_dispensario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_dispensario VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  ubicacion VARCHAR(100),
  responsable_id UUID REFERENCES profesionales_sanitarios(id),
  horario_apertura TIME,
  horario_cierre TIME,
  tipos_servicio JSONB, -- ej: ["medicamentos_hospital", "medicamentos_paciente", "dispositivos"]
  tiene_control_temperatura BOOLEAN DEFAULT false,
  temperatura_minima_celsius DECIMAL(4,1),
  temperatura_maxima_celsius DECIMAL(4,1),
  tiene_nevera BOOLEAN DEFAULT false,
  operativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Dispensaciones de medicamentos
CREATE TABLE IF NOT EXISTS hosix_farmacia_dispensaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_dispensacion VARCHAR(50) UNIQUE DEFAULT 'FARM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(CAST(NEXTVAL('hosix_farmacia_dispensacion_seq') AS TEXT), 4, '0'),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  prescripcion_id UUID,
  articulo_id UUID NOT NULL REFERENCES hosix_articulos(id),
  dispensario_id UUID NOT NULL REFERENCES hosix_farmacia_dispensario(id),
  cantidad_dispensada INT NOT NULL,
  unidad_dispensacion VARCHAR(50),
  lote_medicamento VARCHAR(100),
  fecha_vencimiento_medicamento DATE,
  fecha_dispensacion TIMESTAMPTZ DEFAULT now(),
  farmaceutico_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  tecnico_farmacia_id UUID REFERENCES profesionales_sanitarios(id),
  forma_farmaceutica VARCHAR(100),
  dosis_medicamento VARCHAR(100),
  via_administracion VARCHAR(50),
  instrucciones_paciente TEXT,
  advertencias_medicamento TEXT,
  interacciones_detectadas JSONB,
  alergias_revisadas BOOLEAN DEFAULT false,
  paciente_orienta BOOLEAN DEFAULT false,
  costo_medicamento DECIMAL(8,2),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE SEQUENCE hosix_farmacia_dispensacion_seq START 1;

-- Tabla: Control de medicamentos restringidos
CREATE TABLE IF NOT EXISTS hosix_farmacia_medicamentos_restringidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispensacion_id UUID NOT NULL REFERENCES hosix_farmacia_dispensaciones(id),
  articulo_id UUID NOT NULL REFERENCES hosix_articulos(id),
  numero_receta_controlada VARCHAR(100),
  fecha_receta DATE,
  firma_medico_prescriptor BOOLEAN DEFAULT false,
  datos_paciente_verificados BOOLEAN DEFAULT false,
  motivo_restriccion TEXT,
  dosificacion_verificada BOOLEAN DEFAULT false,
  interacciones_consultadas BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Farmacovigilancia (eventos adversos)
CREATE TABLE IF NOT EXISTS hosix_farmacia_farmacovigilancia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_reporte VARCHAR(50) UNIQUE DEFAULT 'FV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(CAST(NEXTVAL('hosix_farmacia_farmacovigilancia_seq') AS TEXT), 4, '0'),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  articulo_id UUID NOT NULL REFERENCES hosix_articulos(id),
  dispensacion_id UUID REFERENCES hosix_farmacia_dispensaciones(id),
  fecha_evento TIMESTAMPTZ NOT NULL,
  fecha_reporte TIMESTAMPTZ DEFAULT now(),
  tipo_evento_adverso VARCHAR(100), -- reaccion_alergica, toxicidad, interaccion, etc
  descripcion_evento TEXT NOT NULL,
  sintomas TEXT NOT NULL,
  severidad VARCHAR(30), -- leve, moderada, grave, mortal
  fecha_inicio_sintomas TIMESTAMPTZ,
  fecha_resolucion_sintomas TIMESTAMPTZ,
  accion_tomada TEXT,
  resultado_evento VARCHAR(100), -- recuperado, no_recuperado, fatal, desconocido
  medicamentos_involucrados JSONB,
  puede_estar_relacionado_medicamento BOOLEAN DEFAULT true,
  tiempo_relacion_horas INT,
  reportado_por_id UUID REFERENCES profesionales_sanitarios(id),
  reportado_a_farmacovigilancia BOOLEAN DEFAULT false,
  reportado_a_fabricante BOOLEAN DEFAULT false,
  numero_reporte_fabricante VARCHAR(100),
  comentarios_adicionales TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE SEQUENCE hosix_farmacia_farmacovigilancia_seq START 1;

-- Tabla: Reporte de reacciones adversas
CREATE TABLE IF NOT EXISTS hosix_farmacia_reacciones_adversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmacovigilancia_id UUID NOT NULL REFERENCES hosix_farmacia_farmacovigilancia(id),
  sistema_organo_afectado VARCHAR(100),
  tipo_reaccion VARCHAR(100),
  diagnostico_reaccion_adversa TEXT,
  codigo_cie10 VARCHAR(20),
  fue_prevista BOOLEAN DEFAULT false,
  tratamiento_reaccion TEXT,
  medicamento_retirado BOOLEAN DEFAULT false,
  fecha_retiro_medicamento DATE,
  medicamento_sustituto VARCHAR(255),
  evolucion_clinica VARCHAR(255),
  comentarios_especialista TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Auditoría de dispensación
CREATE TABLE IF NOT EXISTS hosix_farmacia_auditoria_dispensacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispensacion_id UUID NOT NULL REFERENCES hosix_farmacia_dispensaciones(id),
  tipo_auditoria VARCHAR(50), -- revision_farmaceutica, control_calidad, auditoria_interna
  auditor_id UUID REFERENCES profesionales_sanitarios(id),
  fecha_auditoria TIMESTAMPTZ DEFAULT now(),
  hallazgos TEXT,
  conformidad BOOLEAN DEFAULT true,
  no_conformidades TEXT,
  acciones_correctivas TEXT,
  fecha_cierre_acciones DATE,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE hosix_farmacia_dispensario ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_farmacia_dispensaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_farmacia_medicamentos_restringidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_farmacia_farmacovigilancia ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_farmacia_reacciones_adversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_farmacia_auditoria_dispensacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmacia dispensarios" ON hosix_farmacia_dispensario
  FOR SELECT USING (operativa = true OR COALESCE((auth.jwt() ->> 'user_role') IN ('farmaceutico', 'admin'), false));

CREATE POLICY "Farmacia dispensaciones visible" ON hosix_farmacia_dispensaciones
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('farmaceutico', 'medico', 'enfermeria'), false)
  );

CREATE POLICY "Farmacia dispensaciones crear" ON hosix_farmacia_dispensaciones
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') = 'farmaceutico', false)
  );

CREATE POLICY "Farmacia medicamentos restringidos" ON hosix_farmacia_medicamentos_restringidos
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('farmaceutico', 'medico'), false)
  );

CREATE POLICY "Farmacia farmacovigilancia visible" ON hosix_farmacia_farmacovigilancia
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('farmaceutico', 'medico', 'enfermeria'), false)
  );

CREATE POLICY "Farmacia farmacovigilancia crear" ON hosix_farmacia_farmacovigilancia
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') IN ('farmaceutico', 'medico', 'enfermeria'), false)
  );

CREATE POLICY "Farmacia auditorias" ON hosix_farmacia_auditoria_dispensacion
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('farmaceutico', 'admin'), false)
  );

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX idx_farmacia_dispensaciones_paciente ON hosix_farmacia_dispensaciones(paciente_id);
CREATE INDEX idx_farmacia_dispensaciones_fecha ON hosix_farmacia_dispensaciones(fecha_dispensacion);
CREATE INDEX idx_farmacia_dispensaciones_articulo ON hosix_farmacia_dispensaciones(articulo_id);
CREATE INDEX idx_farmacia_farmacovigilancia_paciente ON hosix_farmacia_farmacovigilancia(paciente_id);
CREATE INDEX idx_farmacia_farmacovigilancia_fecha ON hosix_farmacia_farmacovigilancia(fecha_evento);
CREATE INDEX idx_farmacia_farmacovigilancia_articulo ON hosix_farmacia_farmacovigilancia(articulo_id);
CREATE INDEX idx_farmacia_medicamentos_restringidos ON hosix_farmacia_medicamentos_restringidos(dispensacion_id);
CREATE INDEX idx_farmacia_auditoria ON hosix_farmacia_auditoria_dispensacion(dispensacion_id);
