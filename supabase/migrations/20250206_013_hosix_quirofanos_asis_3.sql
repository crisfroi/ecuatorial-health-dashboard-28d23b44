-- ASIS 3.0 - Módulo de Quirófanos
-- Gestión de bloques quirúrgicos, salas, programaciones, equipos y procedimientos

-- 1. Bloques Quirúrgicos (diferentes bloques del hospital)
CREATE TABLE hosix_quirofanos_bloques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  numero_salas INT DEFAULT 0,
  ubicacion VARCHAR(255),
  telefono VARCHAR(20),
  responsable_id UUID REFERENCES profesionales_sanitarios(id),
  horario_inicio TIME DEFAULT '07:00:00',
  horario_fin TIME DEFAULT '19:00:00',
  dias_operacion VARCHAR(100) DEFAULT 'L,M,X,J,V',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Salas Quirúrgicas (quirófanos)
CREATE TABLE hosix_quirofanos_salas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bloque_id UUID NOT NULL REFERENCES hosix_quirofanos_bloques(id),
  numero_sala INT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  tipo_procedimiento VARCHAR(100), -- general, traumatología, cardiovascular, etc.
  capacidad_personal INT DEFAULT 8,
  
  -- Equipamiento
  tiene_anestesia BOOLEAN DEFAULT true,
  tiene_monitor_cardiaco BOOLEAN DEFAULT true,
  tiene_aspiracion BOOLEAN DEFAULT true,
  tiene_rayos_x BOOLEAN DEFAULT false,
  tiene_laparoscopia BOOLEAN DEFAULT false,
  
  estado VARCHAR(50) DEFAULT 'operativa', -- operativa, mantenimiento, fuera_servicio
  
  -- Control
  ultima_desinfeccion TIMESTAMPTZ,
  proxima_mantencion DATE,
  responsable_id UUID REFERENCES profesionales_sanitarios(id),
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(bloque_id, numero_sala)
);

-- 3. Equipos Quirúrgicos (instrumental, máquinas, etc.)
CREATE TABLE hosix_quirofanos_equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID NOT NULL REFERENCES hosix_quirofanos_salas(id),
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(100), -- monitor, desfibrilador, bomba_infusion, aspirador, etc.
  codigo_serial VARCHAR(100) UNIQUE,
  fabricante VARCHAR(255),
  modelo VARCHAR(255),
  
  -- Mantenimiento
  fecha_adquisicion DATE,
  fecha_ultimo_servicio TIMESTAMPTZ,
  proxima_servicio TIMESTAMPTZ,
  estado VARCHAR(50) DEFAULT 'operativo', -- operativo, mantenimiento, fuera_servicio
  
  -- Responsable
  responsable_id UUID REFERENCES profesionales_sanitarios(id),
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Programaciones de Quirófano
CREATE TABLE hosix_quirofanos_programaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID NOT NULL REFERENCES hosix_quirofanos_salas(id),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  episodio_id UUID,
  
  -- Procedimiento
  tipo_procedimiento VARCHAR(255) NOT NULL,
  descripcion_procedimiento TEXT,
  diagnostico_principal VARCHAR(255),
  
  -- Personal quirúrgico
  cirujano_principal_id UUID REFERENCES profesionales_sanitarios(id),
  asistentes_quirurgicos UUID[],
  anestesiologo_id UUID REFERENCES profesionales_sanitarios(id),
  instrumentista_id UUID REFERENCES profesionales_sanitarios(id),
  circulante_id UUID REFERENCES profesionales_sanitarios(id),
  
  -- Fechas y horarios
  fecha_programada DATE NOT NULL,
  hora_entrada TIME NOT NULL,
  duracion_estimada INT, -- en minutos
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'programada', -- programada, en_quirofano, completada, cancelada, suspendida
  
  -- Observaciones
  observaciones TEXT,
  motivo_cancelacion TEXT,
  
  -- Prioridad
  prioridad VARCHAR(20) DEFAULT 'normal', -- electiva, urgente, emergencia
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Diario Quirúrgico (registro de procedimientos realizados)
CREATE TABLE hosix_quirofanos_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programacion_id UUID NOT NULL REFERENCES hosix_quirofanos_programaciones(id),
  sala_id UUID NOT NULL REFERENCES hosix_quirofanos_salas(id),
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  
  -- Tiempos quirúrgicos
  hora_inicio_real TIMESTAMPTZ,
  hora_fin_real TIMESTAMPTZ,
  duracion_real INT GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (hora_fin_real - hora_inicio_real))::INT / 60
  ) STORED,
  
  -- Procedimiento realizado
  procedimiento_realizado TEXT,
  hallazgos TEXT,
  complicaciones TEXT,
  
  -- Incidentes
  evento_adverso BOOLEAN DEFAULT false,
  descripcion_evento TEXT,
  
  -- Recuento de gasas/instrumentos
  gasas_contadas INT,
  gasas_utilizadas INT,
  instrumentos_contados INT,
  todas_cuentas_ok BOOLEAN DEFAULT true,
  
  -- Muestras
  muestra_enviada BOOLEAN DEFAULT false,
  tipo_muestra VARCHAR(100),
  laboratorio_id VARCHAR(100),
  
  -- Registrador
  observaciones_cirugia TEXT,
  firma_cirujano BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Histórico de Mantenimiento
CREATE TABLE hosix_quirofanos_mantenimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID NOT NULL REFERENCES hosix_quirofanos_salas(id),
  tipo VARCHAR(50) NOT NULL, -- desinfeccion, mantenimiento_preventivo, reparacion
  
  descripcion TEXT,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ,
  
  tecnico_responsable VARCHAR(255),
  empresa_servicio VARCHAR(255),
  
  costo DECIMAL(12, 2),
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Preferencias del Cirujano (equipamiento, asistentes, etc.)
CREATE TABLE hosix_quirofanos_preferencias_cirujano (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cirujano_id UUID NOT NULL REFERENCES profesionales_sanitarios(id),
  
  -- Preferencias de equipo y disposición
  posicion_paciente_preferida VARCHAR(100),
  instrumental_preferido TEXT,
  drenaje_preferido VARCHAR(100),
  suturas_preferidas TEXT,
  
  -- Asistentes preferidos
  asistentes_preferidos UUID[],
  
  -- Comodidades
  musica_quirofano BOOLEAN DEFAULT false,
  tipo_musica VARCHAR(100),
  temperatura_preferida INT DEFAULT 21,
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(cirujano_id)
);

-- Índices para performance
CREATE INDEX idx_quirofanos_bloques_activo ON hosix_quirofanos_bloques(activo);
CREATE INDEX idx_quirofanos_salas_bloque ON hosix_quirofanos_salas(bloque_id);
CREATE INDEX idx_quirofanos_salas_estado ON hosix_quirofanos_salas(estado);
CREATE INDEX idx_quirofanos_equipos_sala ON hosix_quirofanos_equipos(sala_id);
CREATE INDEX idx_quirofanos_programaciones_fecha ON hosix_quirofanos_programaciones(fecha_programada);
CREATE INDEX idx_quirofanos_programaciones_sala ON hosix_quirofanos_programaciones(sala_id);
CREATE INDEX idx_quirofanos_programaciones_paciente ON hosix_quirofanos_programaciones(paciente_id);
CREATE INDEX idx_quirofanos_programaciones_estado ON hosix_quirofanos_programaciones(estado);
CREATE INDEX idx_quirofanos_diario_sala_fecha ON hosix_quirofanos_diario(sala_id, created_at DESC);
CREATE INDEX idx_quirofanos_diario_paciente ON hosix_quirofanos_diario(paciente_id);
CREATE INDEX idx_quirofanos_mantenimiento_sala ON hosix_quirofanos_mantenimiento(sala_id);

-- RLS Policies
ALTER TABLE hosix_quirofanos_bloques ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_quirofanos_salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_quirofanos_equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_quirofanos_programaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_quirofanos_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_quirofanos_mantenimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_quirofanos_preferencias_cirujano ENABLE ROW LEVEL SECURITY;

-- Policy: Médicos ven quirófanos de su centro
CREATE POLICY "quirofanos_ver_centro"
ON hosix_quirofanos_bloques
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profesionales_sanitarios p
    WHERE p.user_id = auth.uid()
    AND p.centro_salud_id = (
      SELECT centro_salud_id FROM hosix_quirofanos_bloques hqb
      WHERE hqb.id = hosix_quirofanos_bloques.id
      LIMIT 1
    )
  )
);

-- Policy: Cirujanos editan sus preferencias
CREATE POLICY "preferencias_cirujano_self"
ON hosix_quirofanos_preferencias_cirujano
FOR SELECT
USING (cirujano_id = (SELECT id FROM profesionales_sanitarios WHERE user_id = auth.uid()));

-- Seed data: Bloques quirúrgicos
INSERT INTO hosix_quirofanos_bloques (nombre, descripcion, numero_salas, ubicacion, horario_inicio, horario_fin, dias_operacion) 
VALUES
  ('Bloque A - Cirugia General', 'Procedimientos generales y digestivos', 3, 'Planta 2', '07:00:00', '19:00:00', 'L,M,X,J,V'),
  ('Bloque B - Traumatologia', 'Fracturas, artroscopia, ortopedia', 2, 'Planta 2', '08:00:00', '20:00:00', 'L,M,X,J,V'),
  ('Bloque C - Cardiovascular', 'Cirugía cardiaca y vascular', 2, 'Planta 3', '07:00:00', '17:00:00', 'L,M,X,J,V');

-- Seed data: Salas quirúrgicas
INSERT INTO hosix_quirofanos_salas (bloque_id, numero_sala, nombre, tipo_procedimiento, tiene_laparoscopia) 
SELECT id, 1, 'Sala 201A', 'general', true FROM hosix_quirofanos_bloques WHERE nombre = 'Bloque A - Cirugia General'
UNION ALL
SELECT id, 1, 'Sala 301A', 'traumatologia', false FROM hosix_quirofanos_bloques WHERE nombre = 'Bloque B - Traumatologia'
UNION ALL
SELECT id, 1, 'Sala 401A', 'cardiovascular', false FROM hosix_quirofanos_bloques WHERE nombre = 'Bloque C - Cardiovascular';

COMMIT;
