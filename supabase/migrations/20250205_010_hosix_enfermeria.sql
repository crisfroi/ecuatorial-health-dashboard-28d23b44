-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 010: Módulo de Enfermería
-- Fecha: 2025-02-05
-- Descripción: Implementación completa del módulo asistencial de Enfermería

-- ============================================================
-- 1. WORKLIST DE ENFERMERÍA
-- ============================================================
-- Lista de pacientes asignados a enfermería por área/servicio
CREATE TABLE IF NOT EXISTS hosix_enfermeria_worklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID, -- Puede ser urgencia, hospitalización, etc.
  tipo_episodio VARCHAR(50) NOT NULL, -- 'urgencia', 'hospitalizacion', 'consulta', 'quirofano'
  servicio_id UUID REFERENCES hosix_servicios(id),
  
  -- Asignación
  enfermera_asignada_id UUID REFERENCES hosix_usuarios(id),
  fecha_asignacion TIMESTAMPTZ DEFAULT now(),
  
  -- Estado y prioridad
  estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'en_atencion', 'completado', 'cancelado'
  prioridad VARCHAR(20) DEFAULT 'normal', -- 'baja', 'normal', 'alta', 'critica'
  
  -- Información adicional
  observaciones TEXT,
  requiere_atencion_continua BOOLEAN DEFAULT false,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Índices
  CONSTRAINT fk_episodio_urgencia FOREIGN KEY (episodio_id) 
    REFERENCES hosix_urgencias_episodios(id) ON DELETE CASCADE,
  CONSTRAINT fk_episodio_hospitalizacion FOREIGN KEY (episodio_id) 
    REFERENCES hosix_hospitalizacion_episodios(id) ON DELETE CASCADE
);

CREATE INDEX idx_enfermeria_worklist_paciente ON hosix_enfermeria_worklist(paciente_id);
CREATE INDEX idx_enfermeria_worklist_episodio ON hosix_enfermeria_worklist(episodio_id, tipo_episodio);
CREATE INDEX idx_enfermeria_worklist_enfermera ON hosix_enfermeria_worklist(enfermera_asignada_id);
CREATE INDEX idx_enfermeria_worklist_estado ON hosix_enfermeria_worklist(estado, prioridad);
CREATE INDEX idx_enfermeria_worklist_servicio ON hosix_enfermeria_worklist(servicio_id);

-- ============================================================
-- 2. CONSTANTES VITALES
-- ============================================================
-- Registro de signos vitales del paciente
CREATE TABLE IF NOT EXISTS hosix_enfermeria_constantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_enfermeria_worklist(id),
  
  -- Fecha y hora
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
  registrado_por UUID REFERENCES hosix_usuarios(id),
  
  -- Signos vitales
  presion_arterial_sistolica INT,
  presion_arterial_diastolica INT,
  frecuencia_cardiaca INT,
  frecuencia_respiratoria INT,
  temperatura_celsius NUMERIC(4,2),
  saturacion_oxigeno NUMERIC(5,2), -- SpO2 %
  glucosa_capilar NUMERIC(5,2), -- mg/dL
  peso_kg NUMERIC(5,2),
  talla_cm NUMERIC(5,2),
  imc NUMERIC(4,2), -- Calculado automáticamente
  
  -- Signos adicionales (JSON para flexibilidad)
  signos_adicionales JSONB DEFAULT '{}',
  -- Ejemplo: { "dolor_escala": 7, "nivel_conciencia": "GCS 15", "pupilas": "isocoricas" }
  
  -- Observaciones
  observaciones TEXT,
  alertas TEXT[], -- Array de alertas generadas
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_constantes_paciente ON hosix_enfermeria_constantes(paciente_id, fecha_registro DESC);
CREATE INDEX idx_constantes_episodio ON hosix_enfermeria_constantes(episodio_id, tipo_episodio);
CREATE INDEX idx_constantes_worklist ON hosix_enfermeria_worklist(id);

-- Función para calcular IMC automáticamente
CREATE OR REPLACE FUNCTION calcular_imc()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.peso_kg IS NOT NULL AND NEW.talla_cm IS NOT NULL AND NEW.talla_cm > 0 THEN
    NEW.imc := ROUND((NEW.peso_kg / POWER(NEW.talla_cm / 100.0, 2))::NUMERIC, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_imc
  BEFORE INSERT OR UPDATE ON hosix_enfermeria_constantes
  FOR EACH ROW
  EXECUTE FUNCTION calcular_imc();

-- ============================================================
-- 3. EVALUACIONES INICIALES DE ENFERMERÍA
-- ============================================================
-- Evaluación inicial del paciente al ingresar
CREATE TABLE IF NOT EXISTS hosix_enfermeria_evaluaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_enfermeria_worklist(id),
  
  -- Fecha
  fecha_evaluacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  evaluado_por UUID REFERENCES hosix_usuarios(id),
  
  -- Datos de evaluación
  motivo_ingreso TEXT,
  alergias TEXT[],
  medicamentos_actuales JSONB DEFAULT '[]',
  antecedentes_relevantes TEXT,
  
  -- Estado funcional
  nivel_dependencia VARCHAR(50), -- 'independiente', 'dependencia_parcial', 'dependencia_total'
  movilidad VARCHAR(50), -- 'autonoma', 'con_ayuda', 'encamado'
  estado_nutricional VARCHAR(50), -- 'normal', 'riesgo', 'desnutricion'
  
  -- Escalas de valoración
  escala_glasgow INT, -- Escala de Glasgow (3-15)
  escala_norton NUMERIC(3,1), -- Escala de Norton (5-20)
  escala_braden NUMERIC(3,1), -- Escala de Braden (6-23)
  
  -- Observaciones
  observaciones TEXT,
  plan_cuidados_inicial TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_evaluaciones_paciente ON hosix_enfermeria_evaluaciones(paciente_id, fecha_evaluacion DESC);
CREATE INDEX idx_evaluaciones_episodio ON hosix_enfermeria_evaluaciones(episodio_id, tipo_episodio);

-- ============================================================
-- 4. PLANES DE CUIDADO
-- ============================================================
-- Planes de cuidado estandarizados y personalizados
CREATE TABLE IF NOT EXISTS hosix_enfermeria_planes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_enfermeria_worklist(id),
  
  -- Tipo de plan
  tipo_plan VARCHAR(50) NOT NULL, -- 'estandarizado', 'personalizado', 'nanda'
  nombre_plan VARCHAR(255),
  codigo_nanda VARCHAR(50), -- Código NANDA si aplica
  
  -- Diagnóstico de enfermería
  diagnostico_enfermeria TEXT NOT NULL,
  factores_relacionados TEXT[],
  caracteristicas_definitorias TEXT[],
  
  -- Objetivos y resultados esperados
  objetivos JSONB DEFAULT '[]',
  -- Ejemplo: [{"descripcion": "Mantener integridad cutánea", "fecha_esperada": "2025-02-10"}]
  
  -- Intervenciones
  intervenciones JSONB DEFAULT '[]',
  -- Ejemplo: [{"tipo": "cuidado", "descripcion": "Cambio de posición cada 2 horas", "frecuencia": "cada_2h"}]
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'activo', -- 'activo', 'suspendido', 'completado', 'cancelado'
  fecha_inicio TIMESTAMPTZ DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  
  -- Responsable
  creado_por UUID REFERENCES hosix_usuarios(id),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_planes_paciente ON hosix_enfermeria_planes(paciente_id, estado);
CREATE INDEX idx_planes_episodio ON hosix_enfermeria_planes(episodio_id, tipo_episodio);
CREATE INDEX idx_planes_estado ON hosix_enfermeria_planes(estado, fecha_inicio);

-- ============================================================
-- 5. KARDEX - DISPENSACIONES Y CUIDADOS
-- ============================================================
-- Registro de dispensaciones de medicamentos y cuidados realizados
CREATE TABLE IF NOT EXISTS hosix_enfermeria_kardex (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_enfermeria_worklist(id),
  prescripcion_id UUID REFERENCES hosix_prescripciones(id),
  plan_cuidado_id UUID REFERENCES hosix_enfermeria_planes(id),
  
  -- Tipo de registro
  tipo_registro VARCHAR(50) NOT NULL, -- 'dispensacion', 'cuidado', 'administracion', 'observacion'
  
  -- Fecha y hora exacta
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  registrado_por UUID REFERENCES hosix_usuarios(id),
  
  -- Detalles de dispensación (si aplica)
  medicamento_id UUID REFERENCES hosix_medicamentos(id),
  medicamento_texto VARCHAR(255),
  dosis VARCHAR(100),
  via_administracion VARCHAR(50),
  hora_programada TIME,
  hora_real TIME,
  
  -- Detalles de cuidado (si aplica)
  tipo_cuidado VARCHAR(100), -- 'cambio_postura', 'cura', 'higiene', 'alimentacion', etc.
  descripcion_cuidado TEXT,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'realizado', -- 'programado', 'realizado', 'omitido', 'rechazado'
  motivo_omision TEXT,
  
  -- Observaciones
  observaciones TEXT,
  respuesta_paciente TEXT, -- Reacción o respuesta del paciente
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_kardex_paciente ON hosix_enfermeria_kardex(paciente_id, fecha_hora DESC);
CREATE INDEX idx_kardex_episodio ON hosix_enfermeria_kardex(episodio_id, tipo_episodio);
CREATE INDEX idx_kardex_tipo ON hosix_enfermeria_kardex(tipo_registro, estado);
CREATE INDEX idx_kardex_prescripcion ON hosix_enfermeria_kardex(prescripcion_id);

-- ============================================================
-- 6. BALANCE HÍDRICO
-- ============================================================
-- Control de líquidos ingeridos y eliminados
CREATE TABLE IF NOT EXISTS hosix_enfermeria_balance_hidrico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_enfermeria_worklist(id),
  
  -- Fecha y turno
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  turno VARCHAR(20), -- 'mañana', 'tarde', 'noche', '24h'
  
  -- Líquidos ingeridos (en ml)
  ingesta_oral NUMERIC(6,2) DEFAULT 0,
  ingesta_sonda NUMERIC(6,2) DEFAULT 0,
  ingesta_venosa NUMERIC(6,2) DEFAULT 0,
  ingesta_otros NUMERIC(6,2) DEFAULT 0,
  total_ingesta NUMERIC(6,2) DEFAULT 0,
  
  -- Líquidos eliminados (en ml)
  eliminacion_orina NUMERIC(6,2) DEFAULT 0,
  eliminacion_heces NUMERIC(6,2) DEFAULT 0,
  eliminacion_sonda NUMERIC(6,2) DEFAULT 0,
  eliminacion_drenajes NUMERIC(6,2) DEFAULT 0,
  eliminacion_otros NUMERIC(6,2) DEFAULT 0,
  total_eliminacion NUMERIC(6,2) DEFAULT 0,
  
  -- Balance
  balance_diario NUMERIC(6,2), -- Calculado: ingesta - eliminación
  balance_acumulado NUMERIC(6,2), -- Balance acumulado desde inicio
  
  -- Observaciones
  observaciones TEXT,
  
  -- Registrado por
  registrado_por UUID REFERENCES hosix_usuarios(id),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint único por paciente, fecha y turno
  UNIQUE(paciente_id, episodio_id, fecha, turno)
);

CREATE INDEX idx_balance_paciente ON hosix_enfermeria_balance_hidrico(paciente_id, fecha DESC);
CREATE INDEX idx_balance_episodio ON hosix_enfermeria_balance_hidrico(episodio_id, tipo_episodio);

-- Función para calcular totales y balance automáticamente
CREATE OR REPLACE FUNCTION calcular_balance_hidrico()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular total ingesta
  NEW.total_ingesta := COALESCE(NEW.ingesta_oral, 0) + 
                       COALESCE(NEW.ingesta_sonda, 0) + 
                       COALESCE(NEW.ingesta_venosa, 0) + 
                       COALESCE(NEW.ingesta_otros, 0);
  
  -- Calcular total eliminación
  NEW.total_eliminacion := COALESCE(NEW.eliminacion_orina, 0) + 
                           COALESCE(NEW.eliminacion_heces, 0) + 
                           COALESCE(NEW.eliminacion_sonda, 0) + 
                           COALESCE(NEW.eliminacion_drenajes, 0) + 
                           COALESCE(NEW.eliminacion_otros, 0);
  
  -- Calcular balance diario
  NEW.balance_diario := NEW.total_ingesta - NEW.total_eliminacion;
  
  -- Calcular balance acumulado (suma de todos los registros del episodio)
  SELECT COALESCE(SUM(balance_diario), 0) INTO NEW.balance_acumulado
  FROM hosix_enfermeria_balance_hidrico
  WHERE paciente_id = NEW.paciente_id
    AND episodio_id = NEW.episodio_id
    AND fecha <= NEW.fecha;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_balance_hidrico
  BEFORE INSERT OR UPDATE ON hosix_enfermeria_balance_hidrico
  FOR EACH ROW
  EXECUTE FUNCTION calcular_balance_hidrico();

-- ============================================================
-- 7. DIARIO CLÍNICO DE ENFERMERÍA
-- ============================================================
-- Anotaciones de enfermería en el diario clínico
CREATE TABLE IF NOT EXISTS hosix_enfermeria_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  worklist_id UUID REFERENCES hosix_enfermeria_worklist(id),
  
  -- Fecha y hora
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  registrado_por UUID REFERENCES hosix_usuarios(id),
  
  -- Tipo de anotación
  tipo_anotacion VARCHAR(50), -- 'evolucion', 'incidente', 'comunicacion', 'cuidado'
  
  -- Contenido
  titulo VARCHAR(255),
  contenido TEXT NOT NULL,
  
  -- Modelo predefinido usado (si aplica)
  modelo_predefinido_id UUID,
  modelo_predefinido_nombre VARCHAR(255),
  
  -- Datos estructurados (JSON)
  datos_estructurados JSONB DEFAULT '{}',
  
  -- Firma
  firmado BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_diario_paciente ON hosix_enfermeria_diario(paciente_id, fecha_hora DESC);
CREATE INDEX idx_diario_episodio ON hosix_enfermeria_diario(episodio_id, tipo_episodio);
CREATE INDEX idx_diario_tipo ON hosix_enfermeria_diario(tipo_anotacion);

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE hosix_enfermeria_worklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_enfermeria_constantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_enfermeria_evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_enfermeria_planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_enfermeria_kardex ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_enfermeria_balance_hidrico ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_enfermeria_diario ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (ajustar según necesidades de seguridad)
-- Los usuarios pueden ver sus propios registros y los de su servicio

-- Worklist
CREATE POLICY "Usuarios pueden ver worklist de su servicio"
  ON hosix_enfermeria_worklist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND (u.centro_salud_id = hosix_enfermeria_worklist.servicio_id OR u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE nivel_acceso >= 5
      ))
    )
  );

CREATE POLICY "Enfermeras pueden crear worklist"
  ON hosix_enfermeria_worklist FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE codigo IN ('ENFERMERA', 'ENFERMERA_JEFE', 'ADMIN')
      )
    )
  );

CREATE POLICY "Enfermeras pueden actualizar worklist"
  ON hosix_enfermeria_worklist FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND (u.id = enfermera_asignada_id OR u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE codigo IN ('ENFERMERA_JEFE', 'ADMIN')
      ))
    )
  );

-- Constantes vitales
CREATE POLICY "Usuarios pueden ver constantes de su servicio"
  ON hosix_enfermeria_constantes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE nivel_acceso >= 3
      )
    )
  );

CREATE POLICY "Enfermeras pueden registrar constantes"
  ON hosix_enfermeria_constantes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE codigo IN ('ENFERMERA', 'ENFERMERA_JEFE', 'MEDICO', 'ADMIN')
      )
    )
  );

-- Evaluaciones
CREATE POLICY "Usuarios pueden ver evaluaciones de su servicio"
  ON hosix_enfermeria_evaluaciones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE nivel_acceso >= 3
      )
    )
  );

CREATE POLICY "Enfermeras pueden crear evaluaciones"
  ON hosix_enfermeria_evaluaciones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE codigo IN ('ENFERMERA', 'ENFERMERA_JEFE', 'ADMIN')
      )
    )
  );

-- Planes de cuidado
CREATE POLICY "Usuarios pueden ver planes de su servicio"
  ON hosix_enfermeria_planes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE nivel_acceso >= 3
      )
    )
  );

CREATE POLICY "Enfermeras pueden crear planes"
  ON hosix_enfermeria_planes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE codigo IN ('ENFERMERA', 'ENFERMERA_JEFE', 'ADMIN')
      )
    )
  );

-- Kardex
CREATE POLICY "Usuarios pueden ver kardex de su servicio"
  ON hosix_enfermeria_kardex FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE nivel_acceso >= 3
      )
    )
  );

CREATE POLICY "Enfermeras pueden registrar kardex"
  ON hosix_enfermeria_kardex FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE codigo IN ('ENFERMERA', 'ENFERMERA_JEFE', 'ADMIN')
      )
    )
  );

-- Balance hídrico
CREATE POLICY "Usuarios pueden ver balance de su servicio"
  ON hosix_enfermeria_balance_hidrico FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE nivel_acceso >= 3
      )
    )
  );

CREATE POLICY "Enfermeras pueden registrar balance"
  ON hosix_enfermeria_balance_hidrico FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE codigo IN ('ENFERMERA', 'ENFERMERA_JEFE', 'ADMIN')
      )
    )
  );

-- Diario clínico
CREATE POLICY "Usuarios pueden ver diario de su servicio"
  ON hosix_enfermeria_diario FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE nivel_acceso >= 3
      )
    )
  );

CREATE POLICY "Enfermeras pueden crear anotaciones en diario"
  ON hosix_enfermeria_diario FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
      AND u.perfil_id IN (
        SELECT id FROM hosix_perfiles WHERE codigo IN ('ENFERMERA', 'ENFERMERA_JEFE', 'ADMIN')
      )
    )
  );

-- ============================================================
-- 9. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================

COMMENT ON TABLE hosix_enfermeria_worklist IS 'Worklist de pacientes asignados a enfermería por área/servicio';
COMMENT ON TABLE hosix_enfermeria_constantes IS 'Registro de constantes vitales del paciente';
COMMENT ON TABLE hosix_enfermeria_evaluaciones IS 'Evaluaciones iniciales de enfermería al ingreso';
COMMENT ON TABLE hosix_enfermeria_planes IS 'Planes de cuidado estandarizados y personalizados';
COMMENT ON TABLE hosix_enfermeria_kardex IS 'Kardex de dispensaciones de medicamentos y cuidados realizados';
COMMENT ON TABLE hosix_enfermeria_balance_hidrico IS 'Control de balance hídrico (líquidos ingeridos/eliminados)';
COMMENT ON TABLE hosix_enfermeria_diario IS 'Diario clínico de enfermería con anotaciones';

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================

