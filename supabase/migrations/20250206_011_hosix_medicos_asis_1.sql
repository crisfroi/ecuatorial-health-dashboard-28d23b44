-- ============================================================================
-- HOSIX - ASIS 1.0: Módulo de Médicos
-- Fecha: 2025-02-06
-- Descripción: Sistema completo de gestión de consultas médicas, diagnósticos,
--              prescripciones y documentación clínica con soporte para:
--              - CIE-10 (ICD-10) para clasificación de enfermedades
--              - SNOMED CT para terminología clínica normalizada
--              - Integración con CPOE y CDS Engine
-- ============================================================================

-- ============================================================================
-- 1. TABLA DE DIAGNÓSTICOS (CIE-10 / ICD-10 + SNOMED CT)
-- ============================================================================

CREATE TABLE hosix_diagnosticos_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificadores internacionales
  codigo_cie10 VARCHAR(10) NOT NULL UNIQUE, -- Ej: "I10" (Hipertensión)
  codigo_icd10 VARCHAR(10) NOT NULL, -- Equivalente ICD-10
  codigo_snomed VARCHAR(20) NOT NULL UNIQUE, -- Ej: "59621000" (Hypertension)
  
  -- Descripción
  nombre_diagnostico VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  -- Clasificación
  capitulo_cie10 VARCHAR(50), -- Ej: "Enfermedades del aparato circulatorio"
  categoria_snomed VARCHAR(100), -- Ej: "Cardiovascular disease"
  
  -- Flags clínicos
  es_cronica BOOLEAN DEFAULT false,
  requiere_seguimiento BOOLEAN DEFAULT true,
  es_notificable BOOLEAN DEFAULT false,
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  
  -- Metadata
  notas_clinicas TEXT,
  url_referencia_cie10 VARCHAR(255),
  url_referencia_snomed VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para diagnósticos
CREATE INDEX idx_diagnosticos_catalogo_cie10 ON hosix_diagnosticos_catalogo(codigo_cie10);
CREATE INDEX idx_diagnosticos_catalogo_snomed ON hosix_diagnosticos_catalogo(codigo_snomed);
CREATE INDEX idx_diagnosticos_catalogo_nombre ON hosix_diagnosticos_catalogo(nombre_diagnostico);
CREATE INDEX idx_diagnosticos_catalogo_activo ON hosix_diagnosticos_catalogo(activo);

-- RLS para diagnósticos (lectura pública, solo administrador escribe)
ALTER TABLE hosix_diagnosticos_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Diagnósticos lectura pública"
  ON hosix_diagnosticos_catalogo
  FOR SELECT
  USING (true);

CREATE POLICY "Diagnósticos solo admin puede escribir"
  ON hosix_diagnosticos_catalogo
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profesionales_sanitarios
      WHERE user_id = auth.uid() AND perfil = 'Administrador'
    )
  );

-- ============================================================================
-- 2. TABLA DE ÓRDENES MÉDICAS (Worklist)
-- ============================================================================

CREATE TABLE hosix_ordenes_medicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  episodio_id UUID, -- Urgencia, cita, o hospitalización
  medico_asignado_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  
  -- Tipo de orden
  tipo_orden VARCHAR(50) NOT NULL, -- 'consulta', 'revisión', 'seguimiento', 'alta'
  estado VARCHAR(30) DEFAULT 'pendiente', -- 'pendiente', 'en_atención', 'completada', 'cancelada'
  
  -- Prioridades
  prioridad VARCHAR(20) DEFAULT 'normal', -- 'baja', 'normal', 'alta', 'urgente'
  
  -- Información de la orden
  motivo_consulta TEXT NOT NULL,
  servicio VARCHAR(100),
  
  -- Fechas
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_programada TIMESTAMPTZ,
  fecha_inicio_atencion TIMESTAMPTZ,
  fecha_completacion TIMESTAMPTZ,
  
  -- Observaciones iniciales
  notas_previas TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para órdenes
CREATE INDEX idx_ordenes_medicas_paciente ON hosix_ordenes_medicas(paciente_id);
CREATE INDEX idx_ordenes_medicas_medico ON hosix_ordenes_medicas(medico_asignado_id);
CREATE INDEX idx_ordenes_medicas_estado ON hosix_ordenes_medicas(estado);
CREATE INDEX idx_ordenes_medicas_prioridad ON hosix_ordenes_medicas(prioridad);
CREATE INDEX idx_ordenes_medicas_fecha ON hosix_ordenes_medicas(fecha_creacion DESC);

ALTER TABLE hosix_ordenes_medicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Médicos ven sus órdenes"
  ON hosix_ordenes_medicas
  FOR SELECT
  USING (
    medico_asignado_id = (SELECT id FROM profesionales_sanitarios WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profesionales_sanitarios
      WHERE user_id = auth.uid() AND perfil = 'Administrador'
    )
  );

-- ============================================================================
-- 3. TABLA DE DIAGNÓSTICOS DEL PACIENTE (Relación paciente-diagnóstico)
-- ============================================================================

CREATE TABLE hosix_diagnosticos_pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  episodio_id UUID REFERENCES hosix_hospitalizacion_episodios(id),
  medico_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  diagnostico_id UUID NOT NULL REFERENCES hosix_diagnosticos_catalogo(id),
  
  -- Tipo de diagnóstico
  tipo_diagnostico VARCHAR(30) NOT NULL DEFAULT 'principal', -- 'principal', 'secundario', 'complicación', 'comorbilidad'
  
  -- Estado del diagnóstico
  estado VARCHAR(30) DEFAULT 'activo', -- 'activo', 'resuelto', 'sospechoso'
  fecha_diagnostico TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_resolucion TIMESTAMPTZ,
  
  -- Observaciones clínicas
  observaciones TEXT,
  
  -- Gravedad
  severidad VARCHAR(20), -- 'leve', 'moderada', 'grave', 'crítica'
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_diagnosticos_pacientes_paciente ON hosix_diagnosticos_pacientes(paciente_id);
CREATE INDEX idx_diagnosticos_pacientes_episodio ON hosix_diagnosticos_pacientes(episodio_id);
CREATE INDEX idx_diagnosticos_pacientes_medico ON hosix_diagnosticos_pacientes(medico_id);
CREATE INDEX idx_diagnosticos_pacientes_tipo ON hosix_diagnosticos_pacientes(tipo_diagnostico);

ALTER TABLE hosix_diagnosticos_pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Diagnósticos del paciente legibles por profesionales"
  ON hosix_diagnosticos_pacientes
  FOR SELECT
  USING (
    paciente_id IN (
      SELECT DISTINCT p.id FROM hosix_pacientes p
      WHERE p.centro_salud_id IN (
        SELECT DISTINCT ps.centro_salud_id FROM profesionales_sanitarios ps
        WHERE ps.user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 4. TABLA DE CONSULTAS MÉDICAS
-- ============================================================================

CREATE TABLE hosix_consultas_medicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias
  orden_medica_id UUID NOT NULL REFERENCES hosix_ordenes_medicas(id),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  medico_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  episodio_id UUID,
  
  -- Historial clínico resumen
  antecedentes_relevantes TEXT,
  medicamentos_actuales JSONB, -- Array de medicamentos activos
  
  -- Evaluación clínica
  motivo_consulta TEXT NOT NULL,
  historia_enfermedad_actual TEXT,
  examen_fisico TEXT,
  
  -- Impresión y plan
  impresion_clinica TEXT,
  diagnosticos_iniciales TEXT, -- Diagnósticos diferenciales
  plan_manejo TEXT,
  
  -- Diagnósticos confirmados (actualizados después de la consulta)
  diagnosticos_confirmados JSONB, -- Array de {diagnostico_id, tipo, severidad}
  
  -- Prescripciones vinculadas
  prescripciones_creadas JSONB, -- Array de prescription IDs
  
  -- Derivaciones
  requiere_hospitalizacion BOOLEAN DEFAULT false,
  requiere_interconsulta BOOLEAN DEFAULT false,
  especialidad_interconsulta VARCHAR(100),
  
  -- Follow-up
  requiere_seguimiento BOOLEAN DEFAULT false,
  dias_proximo_control INT,
  observaciones_seguimiento TEXT,
  
  -- Auditoría
  fecha_inicio TIMESTAMPTZ DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  duracion_minutos INT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_consultas_medicas_paciente ON hosix_consultas_medicas(paciente_id);
CREATE INDEX idx_consultas_medicas_medico ON hosix_consultas_medicas(medico_id);
CREATE INDEX idx_consultas_medicas_orden ON hosix_consultas_medicas(orden_medica_id);
CREATE INDEX idx_consultas_medicas_fecha ON hosix_consultas_medicas(fecha_inicio DESC);

ALTER TABLE hosix_consultas_medicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultas médicas - acceso médico y admin"
  ON hosix_consultas_medicas
  FOR SELECT
  USING (
    medico_id = (SELECT id FROM profesionales_sanitarios WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profesionales_sanitarios
      WHERE user_id = auth.uid() AND perfil IN ('Administrador', 'Médico')
    )
  );

-- ============================================================================
-- 5. TABLA DE DIARIO CLÍNICO MÉDICO
-- ============================================================================

CREATE TABLE hosix_diario_clinico_medico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  episodio_id UUID,
  medico_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  consulta_medica_id UUID REFERENCES hosix_consultas_medicas(id),
  
  -- Contenido del diario
  tipo_entrada VARCHAR(50) NOT NULL, -- 'evolución', 'nota_clínica', 'revisión', 'conclusión'
  contenido TEXT NOT NULL,
  
  -- Signos vitales asociados (opcional)
  signos_vitales JSONB,
  
  -- Auditoría
  firmada BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  hash_firma VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_diario_clinico_paciente ON hosix_diario_clinico_medico(paciente_id);
CREATE INDEX idx_diario_clinico_medico ON hosix_diario_clinico_medico(medico_id);
CREATE INDEX idx_diario_clinico_fecha ON hosix_diario_clinico_medico(created_at DESC);

ALTER TABLE hosix_diario_clinico_medico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Diario clínico - acceso médicos y admin"
  ON hosix_diario_clinico_medico
  FOR SELECT
  USING (
    medico_id = (SELECT id FROM profesionales_sanitarios WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profesionales_sanitarios
      WHERE user_id = auth.uid() AND perfil IN ('Administrador', 'Médico')
    )
  );

-- ============================================================================
-- 6. DATOS SEMILLA: DIAGNÓSTICOS CIE-10/SNOMED CT MÁS COMUNES
-- ============================================================================

INSERT INTO hosix_diagnosticos_catalogo (
  codigo_cie10, codigo_icd10, codigo_snomed,
  nombre_diagnostico, descripcion,
  capitulo_cie10, categoria_snomed,
  es_cronica, requiere_seguimiento,
  url_referencia_cie10
) VALUES
-- Cardiovascular
('I10', 'I10', '59621000',
  'Hipertensión esencial (primaria)', 'Presión arterial elevada sin causa identificable',
  'Enfermedades del aparato circulatorio', 'Cardiovascular diseases',
  true, true, 'https://www.cie10.es/i10'),

('I21', 'I21.0', '57054005',
  'Infarto agudo de miocardio', 'Necrosis del tejido miocárdico por isquemia',
  'Enfermedades del aparato circulatorio', 'Cardiovascular diseases',
  false, true, 'https://www.cie10.es/i21'),

-- Respiratory
('J06.9', 'J06.9', '82272006',
  'Infección aguda de las vías respiratorias superiores', 'Infección de nariz, garganta y senos',
  'Enfermedades del aparato respiratorio', 'Respiratory tract infections',
  false, false, 'https://www.cie10.es/j069'),

('J45.9', 'J45.9', '195967001',
  'Asma, no especificada', 'Obstrucción bronquial reversible',
  'Enfermedades del aparato respiratorio', 'Asthma',
  true, true, 'https://www.cie10.es/j459'),

-- Endocrine
('E11.9', 'E11.9', '44054006',
  'Diabetes mellitus tipo 2', 'Diabetes sin mención de complicación',
  'Enfermedades endocrinas, nutricionales y metabólicas', 'Diabetes mellitus',
  true, true, 'https://www.cie10.es/e119'),

-- Musculoskeletal
('M79.3', 'M79.3', '76069005',
  'Paniculitis, no especificada', 'Inflamación del tejido adiposo',
  'Enfermedades del sistema osteomuscular', 'Soft tissue disorders',
  false, false, 'https://www.cie10.es/m793'),

-- Infections
('A01', 'A01.0', '76783007',
  'Fiebre tifoidea', 'Infección sistémica por Salmonella typhi',
  'Ciertas enfermedades infecciosas y parasitarias', 'Infectious diseases',
  false, true, 'https://www.cie10.es/a01'),

('B20', 'B20', '86406008',
  'Enfermedad por VIH', 'Infección crónica por virus de la inmunodeficiencia humana',
  'Ciertas enfermedades infecciosas y parasitarias', 'HIV infection',
  true, true, 'https://www.cie10.es/b20'),

-- Mental Health
('F32.9', 'F32.9', '35489007',
  'Episodio depresivo, no especificado', 'Trastorno del estado de ánimo',
  'Trastornos mentales, del comportamiento y del desarrollo neurocognitivo', 'Mental disorders',
  true, true, 'https://www.cie10.es/f329'),

('F41.1', 'F41.1', '197480006',
  'Trastorno de ansiedad generalizada', 'Ansiedad generalizada',
  'Trastornos mentales, del comportamiento y del desarrollo neurocognitivo', 'Anxiety disorders',
  true, true, 'https://www.cie10.es/f411');

-- Índice de búsqueda full-text en diagnósticos (opcional pero útil)
CREATE INDEX idx_diagnosticos_catalogo_nombre_fts 
  ON hosix_diagnosticos_catalogo 
  USING GIN (to_tsvector('spanish', nombre_diagnostico));

-- ============================================================================
-- 7. FUNCIONES DE UTILIDAD
-- ============================================================================

-- Función para obtener diagnósticos activos del paciente
CREATE OR REPLACE FUNCTION obtener_diagnosticos_activos(p_paciente_id UUID)
RETURNS TABLE (
  id UUID,
  codigo_cie10 VARCHAR,
  nombre_diagnostico VARCHAR,
  tipo_diagnostico VARCHAR,
  fecha_diagnostico TIMESTAMPTZ,
  severidad VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.id,
    dc.codigo_cie10,
    dc.nombre_diagnostico,
    dp.tipo_diagnostico,
    dp.fecha_diagnostico,
    dp.severidad
  FROM hosix_diagnosticos_pacientes dp
  JOIN hosix_diagnosticos_catalogo dc ON dp.diagnostico_id = dc.id
  WHERE dp.paciente_id = p_paciente_id
    AND dp.estado = 'activo'
    AND dp.fecha_resolucion IS NULL
  ORDER BY dp.fecha_diagnostico DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar diagnóstico en el paciente
CREATE OR REPLACE FUNCTION registrar_diagnostico_paciente(
  p_paciente_id UUID,
  p_diagnostico_id UUID,
  p_medico_id UUID,
  p_tipo_diagnostico VARCHAR DEFAULT 'principal',
  p_severidad VARCHAR DEFAULT NULL,
  p_observaciones TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_nuevo_id UUID;
BEGIN
  INSERT INTO hosix_diagnosticos_pacientes (
    paciente_id, diagnostico_id, medico_id, 
    tipo_diagnostico, severidad, observaciones
  ) VALUES (
    p_paciente_id, p_diagnostico_id, p_medico_id,
    p_tipo_diagnostico, p_severidad, p_observaciones
  )
  RETURNING id INTO v_nuevo_id;
  
  RETURN v_nuevo_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMIT Y DESCRIPCIÓN
-- ============================================================================
-- Tablas creadas:
-- 1. hosix_diagnosticos_catalogo (CIE-10 + SNOMED CT)
-- 2. hosix_ordenes_medicas (Worklist del médico)
-- 3. hosix_diagnosticos_pacientes (Relación diagnósticos del paciente)
-- 4. hosix_consultas_medicas (Registro de consulta)
-- 5. hosix_diario_clinico_medico (Notas de evolución)
-- 
-- Total: 5 tablas + índices + RLS + funciones
-- Tamaño estimado: ~2.5 MB
-- Migraciones anteriores: 10 (20250116-20250205)
-- Esta es la migración: 11 (ASIS 1.0)
