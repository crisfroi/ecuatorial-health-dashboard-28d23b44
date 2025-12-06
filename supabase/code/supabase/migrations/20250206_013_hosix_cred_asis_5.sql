-- ASIS 5.0 - Módulo de CRED: Crecimiento, Desarrollo y Vacunaciones
-- ====================================================================

-- Tabla: Controles CRED
CREATE TABLE IF NOT EXISTS hosix_cred_controles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  fecha_control DATE NOT NULL,
  edad_meses INT NOT NULL,
  peso_kg DECIMAL(5,2),
  talla_cm DECIMAL(5,1),
  perimetro_cefalico_cm DECIMAL(5,1),
  imc DECIMAL(5,2),
  estado_nutricion VARCHAR(50), -- normal, bajo_peso, sobrepeso, obeso
  desarrollo_psicomotor VARCHAR(255),
  lenguaje_estado VARCHAR(255),
  desarrollo_social VARCHAR(255),
  desarrollo_cognitivo VARCHAR(255),
  signos_alarma TEXT,
  hallazgos_examen_fisico TEXT,
  recomendaciones TEXT,
  derivacion_necesaria BOOLEAN DEFAULT false,
  motivo_derivacion TEXT,
  profesional_id UUID REFERENCES profesionales_sanitarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Catálogo de vacunas
CREATE TABLE IF NOT EXISTS hosix_cred_vacunas_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL UNIQUE,
  codigo_vacuna VARCHAR(50),
  edad_minima_meses INT,
  edad_maxima_anos INT,
  dosis_requeridas INT,
  intervalo_dosis_dias INT,
  descripcion TEXT,
  efectos_adversos TEXT,
  contraindicaciones TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Vacunaciones
CREATE TABLE IF NOT EXISTS hosix_cred_vacunaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  vacuna_id UUID NOT NULL REFERENCES hosix_cred_vacunas_catalogo(id),
  numero_dosis INT NOT NULL,
  fecha_aplicacion DATE NOT NULL,
  edad_meses_aplicacion INT,
  lote_vacuna VARCHAR(100),
  fabricante VARCHAR(100),
  numero_serial VARCHAR(100),
  via_administracion VARCHAR(50), -- IM, SC, oral
  sitio_inyeccion VARCHAR(50),
  reaccion_adversa BOOLEAN DEFAULT false,
  tipo_reaccion_adversa TEXT,
  severa BOOLEAN DEFAULT false,
  requiere_seguimiento BOOLEAN DEFAULT false,
  fecha_seguimiento DATE,
  profesional_id UUID REFERENCES profesionales_sanitarios(id),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Esquema de vacunación esperado
CREATE TABLE IF NOT EXISTS hosix_cred_esquema_vacunacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  vacuna_id UUID NOT NULL REFERENCES hosix_cred_vacunas_catalogo(id),
  numero_dosis INT NOT NULL,
  fecha_esperada DATE NOT NULL,
  completado BOOLEAN DEFAULT false,
  fecha_aplicacion_real DATE,
  dias_atraso INT,
  motivo_atraso TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: Valoración del desarrollo
CREATE TABLE IF NOT EXISTS hosix_cred_valoracion_desarrollo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  fecha_valoracion DATE NOT NULL,
  edad_meses INT,
  -- Escala Denver (4 áreas)
  area_motricidad_gruesa VARCHAR(50), -- normal, problema, sin oportunidad
  area_motricidad_fina VARCHAR(50),
  area_lenguaje VARCHAR(50),
  area_personal_social VARCHAR(50),
  -- Resultado general
  desarrollo_normal BOOLEAN DEFAULT true,
  sospecha_retraso BOOLEAN DEFAULT false,
  requiere_evaluacion_especializada BOOLEAN DEFAULT false,
  especialidad_derivacion VARCHAR(100),
  recomendaciones_padre TEXT,
  plan_seguimiento TEXT,
  profesional_id UUID REFERENCES profesionales_sanitarios(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE hosix_cred_controles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cred_vacunas_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cred_vacunaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cred_esquema_vacunacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cred_valoracion_desarrollo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRED controles visible" ON hosix_cred_controles
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('enfermeria', 'pediatra', 'medico'), false)
  );

CREATE POLICY "CRED controles crear" ON hosix_cred_controles
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') IN ('enfermeria', 'pediatra', 'medico'), false)
  );

CREATE POLICY "CRED vacunas catalogo" ON hosix_cred_vacunas_catalogo
  FOR SELECT USING (true);

CREATE POLICY "CRED vacunaciones visible" ON hosix_cred_vacunaciones
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('enfermeria', 'pediatra', 'medico'), false)
  );

CREATE POLICY "CRED vacunaciones crear" ON hosix_cred_vacunaciones
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') IN ('enfermeria', 'pediatra'), false)
  );

CREATE POLICY "CRED esquema visible" ON hosix_cred_esquema_vacunacion
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('enfermeria', 'pediatra', 'medico'), false)
  );

CREATE POLICY "CRED valoracion visible" ON hosix_cred_valoracion_desarrollo
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'user_role') IN ('enfermeria', 'pediatra', 'medico', 'psicologo'), false)
  );

CREATE POLICY "CRED valoracion crear" ON hosix_cred_valoracion_desarrollo
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'user_role') IN ('enfermeria', 'pediatra', 'medico', 'psicologo'), false)
  );

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX idx_cred_controles_paciente ON hosix_cred_controles(paciente_id);
CREATE INDEX idx_cred_controles_fecha ON hosix_cred_controles(fecha_control);
CREATE INDEX idx_cred_vacunaciones_paciente ON hosix_cred_vacunaciones(paciente_id);
CREATE INDEX idx_cred_vacunaciones_vacuna ON hosix_cred_vacunaciones(vacuna_id);
CREATE INDEX idx_cred_esquema_paciente ON hosix_cred_esquema_vacunacion(paciente_id);
CREATE INDEX idx_cred_esquema_fecha ON hosix_cred_esquema_vacunacion(fecha_esperada);
CREATE INDEX idx_cred_valoracion_paciente ON hosix_cred_valoracion_desarrollo(paciente_id);

-- ============================================================================
-- SEED DATA: Vacunas comunes
-- ============================================================================

INSERT INTO hosix_cred_vacunas_catalogo (nombre, codigo_vacuna, edad_minima_meses, edad_maxima_anos, dosis_requeridas, intervalo_dosis_dias) VALUES
('BCG', 'BCG', 0, 18, 1, 0),
('HepB (Hepatitis B)', 'HepB', 0, 18, 3, 30),
('Rotavirus', 'RotaV', 2, 24, 3, 28),
('Pentavalente (DPT+HiB+HepB)', 'Penta', 2, 60, 3, 56),
('Neumococo', 'PCV13', 2, 60, 3, 56),
('Polio (IPV)', 'IPV', 2, 60, 4, 56),
('MMR (Sarampión, Paperas, Rubéola)', 'MMR', 12, 120, 2, 365),
('Varicela', 'VAR', 12, 120, 2, 365),
('Influenza', 'FLU', 6, 1200, 2, 30),
('Fiebre Amarilla', 'YF', 12, 1200, 1, 0)
ON CONFLICT DO NOTHING;
