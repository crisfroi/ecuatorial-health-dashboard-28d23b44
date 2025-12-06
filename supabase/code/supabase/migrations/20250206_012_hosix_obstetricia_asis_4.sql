-- ASIS 4.0 - Módulo de Obstetricia: Gestaciones, Controles, Partos, Puerperio
-- ============================================================================

-- Tabla: Catálogo de tipos de parto
CREATE TABLE IF NOT EXISTS hosix_obstetricia_tipos_parto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  requiere_quirofano BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Gestaciones
CREATE TABLE IF NOT EXISTS hosix_obstetricia_gestaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  numero_gesta INT NOT NULL,
  numero_para INT NOT NULL,
  fecha_ultima_menstruacion DATE NOT NULL,
  fecha_probable_parto DATE GENERATED ALWAYS AS (fecha_ultima_menstruacion + INTERVAL '280 days') STORED,
  grupo_sanguineo VARCHAR(10),
  factor_rh VARCHAR(10),
  tiene_aloinmunizacion BOOLEAN DEFAULT false,
  es_embarazo_multiple BOOLEAN DEFAULT false,
  numero_fetos INT DEFAULT 1,
  antecedentes_obstetricos TEXT,
  patologias_preexistentes JSONB,
  medicaciones_actuales JSONB,
  estado_gestacion VARCHAR(30) DEFAULT 'activa', -- activa, finalizada, aborto, complicada
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Controles prenatales
CREATE TABLE IF NOT EXISTS hosix_obstetricia_controles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gestacion_id UUID NOT NULL REFERENCES hosix_obstetricia_gestaciones(id),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  numero_control INT NOT NULL,
  fecha_control DATE NOT NULL,
  semanas_gestacion INT,
  peso_kg DECIMAL(5,2),
  presion_sistolica INT,
  presion_diastolica INT,
  glucosa_ayunas INT,
  proteinas_orina DECIMAL(5,2),
  altura_uterina_cm DECIMAL(5,1),
  movimientos_fetales BOOLEAN,
  signos_alarma TEXT,
  hallazgos_clinicos TEXT,
  ultrasonido_realizado BOOLEAN DEFAULT false,
  hallazgos_ultrasonido TEXT,
  analisis_laboratorio JSONB,
  plan_seguimiento TEXT,
  proximidad_control INT, -- dias
  profesional_id UUID REFERENCES profesionales_sanitarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Partos
CREATE TABLE IF NOT EXISTS hosix_obstetricia_partos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gestacion_id UUID NOT NULL REFERENCES hosix_obstetricia_gestaciones(id),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  fecha_hora_inicio TIMESTAMPTZ NOT NULL,
  fecha_hora_fin TIMESTAMPTZ,
  duracion_horas DECIMAL(5,2),
  tipo_parto_id UUID REFERENCES hosix_obstetricia_tipos_parto(id),
  duracion_trabajo_parto_horas INT,
  presentacion_fetal VARCHAR(50),
  posicion_fetal VARCHAR(50),
  complicaciones_maternas TEXT,
  uso_anestesia BOOLEAN DEFAULT false,
  tipo_anestesia VARCHAR(100),
  necesito_transfusion BOOLEAN DEFAULT false,
  cantidad_sangre_perdida_ml INT,
  episiotomia_realizada BOOLEAN DEFAULT false,
  rasgaduras_grado INT, -- 1-4
  uso_oxitocina BOOLEAN DEFAULT false,
  uso_ergotamina BOOLEAN DEFAULT false,
  parto_asistido_por VARCHAR(100),
  partero_id UUID REFERENCES profesionales_sanitarios(id),
  obstetra_id UUID REFERENCES profesionales_sanitarios(id),
  pediatra_id UUID REFERENCES profesionales_sanitarios(id),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Datos del recién nacido
CREATE TABLE IF NOT EXISTS hosix_obstetricia_recien_nacidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parto_id UUID NOT NULL REFERENCES hosix_obstetricia_partos(id),
  numero_feto INT DEFAULT 1,
  sexo VARCHAR(10),
  peso_gramos INT,
  talla_cm DECIMAL(5,1),
  perimetro_cefalico_cm DECIMAL(5,1),
  apgar_1min INT CHECK (apgar_1min >= 0 AND apgar_1min <= 10),
  apgar_5min INT CHECK (apgar_5min >= 0 AND apgar_5min <= 10),
  complicaciones_neonato TEXT,
  requiere_resucitacion BOOLEAN DEFAULT false,
  color_piel VARCHAR(50),
  llanto_vigoroso BOOLEAN DEFAULT true,
  reflejo_succion BOOLEAN DEFAULT true,
  reflejo_moro BOOLEAN DEFAULT true,
  necesita_incubadora BOOLEAN DEFAULT false,
  vih_serologico VARCHAR(20),
  sifilis_serologico VARCHAR(20),
  hepatitis_b_testado BOOLEAN DEFAULT false,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Período puerperio
CREATE TABLE IF NOT EXISTS hosix_obstetricia_puerperio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parto_id UUID NOT NULL REFERENCES hosix_obstetricia_partos(id),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  dias_postparto INT,
  involucion_uterina VARCHAR(50),
  loquios_caracteristicas TEXT,
  hemorragia_postparto BOOLEAN DEFAULT false,
  cantidad_sangrado_ml INT,
  requiere_transfusion BOOLEAN DEFAULT false,
  infeccion_puerperal BOOLEAN DEFAULT false,
  signos_infeccion TEXT,
  lactancia_estado VARCHAR(50), -- exclusiva, mixta, artificial
  problemas_lactancia TEXT,
  cicatrizacion_episiotomia VARCHAR(50),
  dolor_perineal INT CHECK (dolor_perineal >= 0 AND dolor_perineal <= 10),
  movilizacion VARCHAR(50),
  estado_emocional VARCHAR(100),
  depresion_postparto BOOLEAN DEFAULT false,
  escala_edimburgo INT,
  requiere_apoyo_psicologico BOOLEAN DEFAULT false,
  alta_puerperio_fecha DATE,
  complicaciones_tardias TEXT,
  seguimiento_programado_fecha DATE,
  profesional_id UUID REFERENCES profesionales_sanitarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE hosix_obstetricia_tipos_parto ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_obstetricia_gestaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_obstetricia_controles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_obstetricia_partos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_obstetricia_recien_nacidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_obstetricia_puerperio ENABLE ROW LEVEL SECURITY;

-- RLS: Tipos de parto (todos pueden leer, solo admin crea)
CREATE POLICY "Todos leen tipos parto" ON hosix_obstetricia_tipos_parto
  FOR SELECT USING (true);

-- RLS: Gestaciones (obstetra/matrona ver todas, paciente su propia)
CREATE POLICY "Gestaciones visible" ON hosix_obstetricia_gestaciones
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') = 'obstetra', false)
    OR COALESCE((auth.jwt() ->> 'user_role') = 'matrona', false)
    OR paciente_id = (SELECT paciente_id FROM hosix_pacientes WHERE user_id = auth.uid())
  );

CREATE POLICY "Gestaciones crear" ON hosix_obstetricia_gestaciones
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') = 'obstetra', false)
    OR COALESCE((auth.jwt() ->> 'user_role') = 'matrona', false)
  );

CREATE POLICY "Gestaciones actualizar" ON hosix_obstetricia_gestaciones
  FOR UPDATE USING (
    COALESCE((auth.jwt() ->> 'user_role') = 'obstetra', false)
    OR COALESCE((auth.jwt() ->> 'user_role') = 'matrona', false)
  );

-- RLS: Controles prenatales
CREATE POLICY "Controles visible" ON hosix_obstetricia_controles
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('obstetra', 'matrona', 'enfermeria'), false)
  );

CREATE POLICY "Controles crear" ON hosix_obstetricia_controles
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') IN ('obstetra', 'matrona', 'enfermeria'), false)
  );

-- RLS: Partos
CREATE POLICY "Partos visible" ON hosix_obstetricia_partos
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('obstetra', 'matrona', 'pediatra', 'anestesiologo'), false)
  );

CREATE POLICY "Partos crear" ON hosix_obstetricia_partos
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') IN ('obstetra', 'matrona'), false)
  );

-- RLS: Recién nacidos
CREATE POLICY "Recien nacidos visible" ON hosix_obstetricia_recien_nacidos
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('obstetra', 'pediatra', 'matrona', 'enfermeria'), false)
  );

CREATE POLICY "Recien nacidos crear" ON hosix_obstetricia_recien_nacidos
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') IN ('obstetra', 'pediatra', 'matrona'), false)
  );

-- RLS: Puerperio
CREATE POLICY "Puerperio visible" ON hosix_obstetricia_puerperio
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('obstetra', 'matrona', 'enfermeria'), false)
  );

CREATE POLICY "Puerperio crear" ON hosix_obstetricia_puerperio
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') IN ('obstetra', 'matrona', 'enfermeria'), false)
  );

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX idx_gestaciones_paciente ON hosix_obstetricia_gestaciones(paciente_id);
CREATE INDEX idx_gestaciones_estado ON hosix_obstetricia_gestaciones(estado_gestacion);
CREATE INDEX idx_controles_gestacion ON hosix_obstetricia_controles(gestacion_id);
CREATE INDEX idx_controles_paciente ON hosix_obstetricia_controles(paciente_id);
CREATE INDEX idx_controles_fecha ON hosix_obstetricia_controles(fecha_control);
CREATE INDEX idx_partos_gestacion ON hosix_obstetricia_partos(gestacion_id);
CREATE INDEX idx_partos_paciente ON hosix_obstetricia_partos(paciente_id);
CREATE INDEX idx_partos_fecha ON hosix_obstetricia_partos(fecha_hora_inicio);
CREATE INDEX idx_recien_nacidos_parto ON hosix_obstetricia_recien_nacidos(parto_id);
CREATE INDEX idx_puerperio_parto ON hosix_obstetricia_puerperio(parto_id);
CREATE INDEX idx_puerperio_paciente ON hosix_obstetricia_puerperio(paciente_id);

-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO hosix_obstetricia_tipos_parto (nombre, descripcion, requiere_quirofano) VALUES
('Vaginal Espontáneo', 'Parto vaginal sin intervenciones', false),
('Vaginal Asistido', 'Parto con fórceps o ventosa', false),
('Cesárea Electiva', 'Cesárea programada sin complicaciones', true),
('Cesárea de Emergencia', 'Cesárea de urgencia por complicaciones', true),
('Vaginal Post-Cesárea', 'Parto vaginal después de cesárea previa', false)
ON CONFLICT DO NOTHING;
