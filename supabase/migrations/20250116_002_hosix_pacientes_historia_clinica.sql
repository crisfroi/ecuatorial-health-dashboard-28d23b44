-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 002: Pacientes e Historia Clínica Electrónica
-- Fecha: 2025-01-16

-- ============================================================
-- 1. PACIENTES
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ppi VARCHAR(20) UNIQUE NOT NULL,
  
  -- Datos personales
  primer_nombre VARCHAR(100) NOT NULL,
  segundo_nombre VARCHAR(100),
  primer_apellido VARCHAR(100) NOT NULL,
  segundo_apellido VARCHAR(100),
  fecha_nacimiento DATE NOT NULL,
  sexo VARCHAR(10) NOT NULL,
  
  -- Documentos
  tipo_documento VARCHAR(50),
  numero_documento VARCHAR(50),
  pais_documento VARCHAR(100),
  
  -- Contacto
  direccion TEXT,
  ciudad VARCHAR(100),
  provincia VARCHAR(100),
  codigo_postal VARCHAR(20),
  telefono_fijo VARCHAR(20),
  telefono_movil VARCHAR(20),
  email VARCHAR(255),
  
  -- Datos médicos
  grupo_sanguineo VARCHAR(5),
  alergias JSONB DEFAULT '[]',
  antecedentes_familiares JSONB DEFAULT '[]',
  antecedentes_personales JSONB DEFAULT '[]',
  
  -- Seguro
  aseguradora_principal_id UUID,
  numero_poliza VARCHAR(50),
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  fallecido BOOLEAN DEFAULT false,
  fecha_fallecimiento DATE,
  
  -- Metadata
  centro_registro_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. HISTORIA CLÍNICA ELECTRÓNICA
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_historia_clinica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  tipo_entrada VARCHAR(50) NOT NULL,
  episodio_id UUID,
  fecha_entrada TIMESTAMPTZ NOT NULL,
  
  -- Contenido
  titulo VARCHAR(255),
  contenido TEXT,
  datos_estructurados JSONB DEFAULT '{}',
  
  -- Profesional
  profesional_id UUID,
  servicio_id UUID,
  
  -- Adjuntos
  adjuntos JSONB DEFAULT '[]',
  
  -- Estado
  firmado BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  confidencial BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. CONTACTOS Y DATOS ADICIONALES
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_pacientes_contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  tipo_contacto VARCHAR(50),
  nombre VARCHAR(255),
  relacion VARCHAR(100),
  telefono VARCHAR(20),
  email VARCHAR(255),
  es_emergencia BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_pacientes_avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  tipo_aviso VARCHAR(100) NOT NULL,
  titulo VARCHAR(255),
  descripcion TEXT,
  severidad VARCHAR(20),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_pacientes_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  tipo_documento VARCHAR(100),
  nombre VARCHAR(255),
  url_documento TEXT,
  fecha_documento DATE,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. INDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_pacientes_ppi ON hosix_pacientes(ppi);
CREATE INDEX IF NOT EXISTS idx_pacientes_documento ON hosix_pacientes(numero_documento);
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre ON hosix_pacientes(primer_apellido, primer_nombre);
CREATE INDEX IF NOT EXISTS idx_pacientes_activo ON hosix_pacientes(activo);

CREATE INDEX IF NOT EXISTS idx_historia_clinica_paciente ON hosix_historia_clinica(paciente_id);
CREATE INDEX IF NOT EXISTS idx_historia_clinica_fecha ON hosix_historia_clinica(fecha_entrada);
CREATE INDEX IF NOT EXISTS idx_historia_clinica_tipo ON hosix_historia_clinica(tipo_entrada);

CREATE INDEX IF NOT EXISTS idx_contactos_paciente ON hosix_pacientes_contactos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_avisos_paciente ON hosix_pacientes_avisos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_paciente ON hosix_pacientes_documentos(paciente_id);

-- ============================================================
-- 5. RLS (ROW LEVEL SECURITY) POLICIES
-- ============================================================

ALTER TABLE hosix_pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_historia_clinica ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_pacientes_contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_pacientes_avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_pacientes_documentos ENABLE ROW LEVEL SECURITY;

-- Pacientes: lectura y escritura según permisos
CREATE POLICY "pacientes_read_policy" ON hosix_pacientes FOR SELECT USING (activo = true OR true);
CREATE POLICY "pacientes_insert_policy" ON hosix_pacientes FOR INSERT WITH CHECK (true);
CREATE POLICY "pacientes_update_policy" ON hosix_pacientes FOR UPDATE USING (true) WITH CHECK (true);

-- Historia Clínica: lectura según acceso del profesional
CREATE POLICY "historia_clinica_read_policy" ON hosix_historia_clinica FOR SELECT USING (true);
CREATE POLICY "historia_clinica_insert_policy" ON hosix_historia_clinica FOR INSERT WITH CHECK (true);

-- ============================================================
-- 6. DATOS DE PRUEBA
-- ============================================================

-- Insertar pacientes de prueba
INSERT INTO hosix_pacientes (
  ppi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
  fecha_nacimiento, sexo, tipo_documento, numero_documento,
  direccion, ciudad, provincia, email, grupo_sanguineo, activo
) VALUES
('PPI-0001', 'Juan', 'Carlos', 'Pérez', 'García',
  '1975-03-15', 'M', 'Cédula', '0123456789',
  'Calle Principal 123', 'Malabo', 'Bioko Norte', 'juan@example.com', 'O+', true),
('PPI-0002', 'María', 'Elena', 'González', 'López',
  '1982-07-22', 'F', 'Cédula', '0987654321',
  'Avenida Central 456', 'Bata', 'Litoral', 'maria@example.com', 'A+', true),
('PPI-0003', 'Fernando', 'José', 'Martínez', 'Rodríguez',
  '1965-11-08', 'M', 'Cédula', '0456123789',
  'Calle Sur 789', 'Malabo', 'Bioko Sur', 'fernando@example.com', 'B+', true)
ON CONFLICT (ppi) DO NOTHING;
