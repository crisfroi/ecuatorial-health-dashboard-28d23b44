-- Migration for Guard Management System Tables
-- Creates all necessary tables for managing medical guards, schedules, validation, and payroll

-- Create enum types for guard system
CREATE TYPE categoria_profesional_guardia AS ENUM (
  'especialista',
  'general_licenciado', 
  'tecnico_diplomado',
  'auxiliar',
  'subalterno',
  'odepac',
  'secre_asist_pacientes',
  'caja'
);

CREATE TYPE tipo_guardia AS ENUM ('fisica', 'localizable', 'administrativa');
CREATE TYPE tipo_dia AS ENUM ('ordinario', 'fin_semana', 'festivo');
CREATE TYPE estado_guardia AS ENUM ('borrador', 'planificada', 'realizada', 'no_presentado');
CREATE TYPE estado_validacion AS ENUM ('pendiente', 'validada', 'rechazada');
CREATE TYPE etapa_validacion AS ENUM (
  'dir_medica',
  'dir_admin', 
  'dir_enfermeria',
  'jefe_rrhh',
  'admin_hospital',
  'dir_gerente',
  'dg_coordinacion'
);
CREATE TYPE forma_pago AS ENUM ('transfer_trabajador', 'transfer_hospital', 'otro');
CREATE TYPE fuente_baremo AS ENUM ('protocol', 'excel', 'manual');
CREATE TYPE rol_usuario_guardias AS ENUM (
  'admin',
  'validador',
  'visualizador', 
  'rrhh',
  'dir_medica',
  'dir_admin',
  'dir_enfermeria',
  'dir_gerente',
  'dg'
);

-- Table for guard professionals (extended from existing professionals)
CREATE TABLE IF NOT EXISTS profesionales_guardias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id UUID REFERENCES profesionales_sanitarios(id) ON DELETE CASCADE,
  categoria categoria_profesional_guardia NOT NULL,
  unidad_servicio TEXT NOT NULL,
  banco TEXT,
  iban_cuenta TEXT,
  activo BOOLEAN DEFAULT true,
  telefono_guardias TEXT,
  email_guardias TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for guards/shifts
CREATE TABLE IF NOT EXISTS guardias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_guardia_id UUID REFERENCES profesionales_guardias(id) ON DELETE CASCADE,
  centro_salud_id UUID REFERENCES centros_salud(id) ON DELETE CASCADE,
  tipo tipo_guardia NOT NULL,
  fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
  horas DECIMAL(4,2) GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (fecha_fin - fecha_inicio)) / 3600
  ) STORED,
  tipo_dia tipo_dia NOT NULL,
  estado estado_guardia DEFAULT 'planificada',
  validacion_estado estado_validacion DEFAULT 'pendiente',
  observaciones TEXT,
  -- Fields for on-call guards
  localizable_activada BOOLEAN DEFAULT false,
  hora_llamada TIMESTAMP WITH TIME ZONE,
  hora_llegada TIMESTAMP WITH TIME ZONE,
  servicio_atendido TEXT,
  caso_atendido TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT guardias_fecha_check CHECK (fecha_fin > fecha_inicio),
  CONSTRAINT guardias_duracion_check CHECK (
    EXTRACT(EPOCH FROM (fecha_fin - fecha_inicio)) / 3600 BETWEEN 12 AND 24
  )
);

-- Table for validations
CREATE TABLE IF NOT EXISTS validaciones_guardias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardia_id UUID REFERENCES guardias(id) ON DELETE CASCADE,
  etapa etapa_validacion NOT NULL,
  usuario_id UUID, -- Will reference auth.users when implemented
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resultado TEXT CHECK (resultado IN ('aprobada', 'rechazada')),
  comentario TEXT,
  firma TEXT, -- For digital signature hash
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for payroll/nomina
CREATE TABLE IF NOT EXISTS nominas_guardias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes INTEGER CHECK (mes BETWEEN 1 AND 12),
  anio INTEGER CHECK (anio BETWEEN 2024 AND 2030),
  centro_salud_id UUID REFERENCES centros_salud(id) ON DELETE CASCADE,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviada_seaf', 'aprobada', 'pagada')),
  totales_por_categoria JSONB,
  totales_por_tipo JSONB,
  total_general DECIMAL(12,2) DEFAULT 0,
  archivo_pdf TEXT,
  archivo_xlsx TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(mes, anio, centro_salud_id)
);

-- Table for payroll lines
CREATE TABLE IF NOT EXISTS nomina_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomina_id UUID REFERENCES nominas_guardias(id) ON DELETE CASCADE,
  profesional_guardia_id UUID REFERENCES profesionales_guardias(id) ON DELETE CASCADE,
  categoria categoria_profesional_guardia NOT NULL,
  conteo_ordinarias INTEGER DEFAULT 0,
  conteo_fines INTEGER DEFAULT 0,
  conteo_festivos INTEGER DEFAULT 0,
  localizable_programadas INTEGER DEFAULT 0,
  localizable_llamadas INTEGER DEFAULT 0,
  coste_unitario DECIMAL(10,2) DEFAULT 0,
  total_linea DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for payments
CREATE TABLE IF NOT EXISTS pagos_guardias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomina_id UUID REFERENCES nominas_guardias(id) ON DELETE CASCADE,
  profesional_guardia_id UUID REFERENCES profesionales_guardias(id) ON DELETE CASCADE,
  forma_pago forma_pago NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE,
  comprobante_url TEXT,
  observacion TEXT,
  monto DECIMAL(12,2) NOT NULL CHECK (monto >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for guard system users
CREATE TABLE IF NOT EXISTS usuarios_guardias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE,
  rol rol_usuario_guardias NOT NULL,
  centro_salud_id UUID REFERENCES centros_salud(id) ON DELETE SET NULL,
  firma_digital TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for audit log
CREATE TABLE IF NOT EXISTS bitacora_guardias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT NOT NULL CHECK (ref IN ('guardia', 'nomina', 'pago')),
  ref_id UUID NOT NULL,
  usuario_id UUID,
  accion TEXT NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  detalle TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for scale/baremo adjustments
CREATE TABLE IF NOT EXISTS ajustes_baremo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuente fuente_baremo NOT NULL,
  categoria categoria_profesional_guardia NOT NULL,
  tipo_guardia tipo_guardia NOT NULL,
  tipo_dia tipo_dia NOT NULL,
  valor DECIMAL(10,2) CHECK (valor >= 0 AND valor <= 100000),
  porcentaje_localizable_condicion INTEGER CHECK (porcentaje_localizable_condicion BETWEEN 0 AND 100),
  porcentaje_localizable_llamada INTEGER CHECK (porcentaje_localizable_llamada BETWEEN 0 AND 100),
  vigente_desde DATE NOT NULL,
  vigente_hasta DATE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT baremo_vigencia_check CHECK (vigente_hasta IS NULL OR vigente_hasta > vigente_desde)
);

-- Table for system configuration
CREATE TABLE IF NOT EXISTS configuracion_guardias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuente_baremo fuente_baremo DEFAULT 'protocol',
  limite_guardias_minimo INTEGER DEFAULT 4 CHECK (limite_guardias_minimo >= 1),
  limite_guardias_maximo INTEGER DEFAULT 6 CHECK (limite_guardias_maximo >= 1),
  duracion_minima_horas INTEGER DEFAULT 12 CHECK (duracion_minima_horas BETWEEN 8 AND 24),
  duracion_maxima_horas INTEGER DEFAULT 24 CHECK (duracion_maxima_horas BETWEEN 8 AND 48),
  notificaciones_activas BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT configuracion_limites_check CHECK (limite_guardias_maximo >= limite_guardias_minimo),
  CONSTRAINT configuracion_duracion_check CHECK (duracion_maxima_horas >= duracion_minima_horas)
);

-- Create indexes for better performance
CREATE INDEX idx_guardias_profesional ON guardias(profesional_guardia_id);
CREATE INDEX idx_guardias_centro ON guardias(centro_salud_id);
CREATE INDEX idx_guardias_fecha ON guardias(fecha_inicio, fecha_fin);
CREATE INDEX idx_guardias_estado ON guardias(estado);
CREATE INDEX idx_guardias_validacion ON guardias(validacion_estado);
CREATE INDEX idx_validaciones_guardia ON validaciones_guardias(guardia_id);
CREATE INDEX idx_nominas_mes_anio ON nominas_guardias(mes, anio, centro_salud_id);
CREATE INDEX idx_pagos_nomina ON pagos_guardias(nomina_id);
CREATE INDEX idx_bitacora_ref ON bitacora_guardias(ref, ref_id);
CREATE INDEX idx_baremo_categoria_tipo ON ajustes_baremo(categoria, tipo_guardia, tipo_dia, activo);

-- Insert default configuration
INSERT INTO configuracion_guardias (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- Insert default scale values based on protocol
INSERT INTO ajustes_baremo (fuente, categoria, tipo_guardia, tipo_dia, valor, vigente_desde) VALUES
-- Physical Guards - Specialists
('protocol', 'especialista', 'fisica', 'ordinario', 30000, '2024-01-01'),
('protocol', 'especialista', 'fisica', 'fin_semana', 36000, '2024-01-01'),
('protocol', 'especialista', 'fisica', 'festivo', 36000, '2024-01-01'),

-- Physical Guards - General/Licensed
('protocol', 'general_licenciado', 'fisica', 'ordinario', 25000, '2024-01-01'),
('protocol', 'general_licenciado', 'fisica', 'fin_semana', 30000, '2024-01-01'),
('protocol', 'general_licenciado', 'fisica', 'festivo', 30000, '2024-01-01'),

-- Physical Guards - Technical/Diploma
('protocol', 'tecnico_diplomado', 'fisica', 'ordinario', 20000, '2024-01-01'),
('protocol', 'tecnico_diplomado', 'fisica', 'fin_semana', 24000, '2024-01-01'),
('protocol', 'tecnico_diplomado', 'fisica', 'festivo', 24000, '2024-01-01'),

-- Physical Guards - Auxiliaries
('protocol', 'auxiliar', 'fisica', 'ordinario', 15000, '2024-01-01'),
('protocol', 'auxiliar', 'fisica', 'fin_semana', 18000, '2024-01-01'),
('protocol', 'auxiliar', 'fisica', 'festivo', 18000, '2024-01-01'),

-- Physical Guards - Subordinates
('protocol', 'subalterno', 'fisica', 'ordinario', 10000, '2024-01-01'),
('protocol', 'subalterno', 'fisica', 'fin_semana', 12000, '2024-01-01'),
('protocol', 'subalterno', 'fisica', 'festivo', 12000, '2024-01-01'),

-- Administrative Guards
('protocol', 'especialista', 'administrativa', 'ordinario', 35000, '2024-01-01'),
('protocol', 'especialista', 'administrativa', 'fin_semana', 43750, '2024-01-01'),
('protocol', 'especialista', 'administrativa', 'festivo', 43750, '2024-01-01'),

-- On-call Guards (Localizable) - with 50% base rate plus call fees
('protocol', 'especialista', 'localizable', 'ordinario', 15000, '2024-01-01'),
('protocol', 'especialista', 'localizable', 'fin_semana', 18000, '2024-01-01'),
('protocol', 'especialista', 'localizable', 'festivo', 18000, '2024-01-01')

ON CONFLICT DO NOTHING;

-- Create function to automatically determine day type
CREATE OR REPLACE FUNCTION determinar_tipo_dia(fecha_guardia DATE)
RETURNS tipo_dia
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if it's weekend (Saturday = 6, Sunday = 0)
  IF EXTRACT(DOW FROM fecha_guardia) IN (0, 6) THEN
    RETURN 'fin_semana';
  END IF;
  
  -- TODO: Add logic for holidays (festivo)
  -- For now, return 'ordinario' for weekdays
  RETURN 'ordinario';
END;
$$;

-- Create trigger to automatically set day type and validation
CREATE OR REPLACE FUNCTION trigger_guardia_campos()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set day type automatically
  NEW.tipo_dia = determinar_tipo_dia(NEW.fecha_inicio::DATE);
  
  -- Set updated_at
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_guardias_before_update
  BEFORE UPDATE ON guardias
  FOR EACH ROW
  EXECUTE FUNCTION trigger_guardia_campos();

-- Create function to calculate scale/baremo
CREATE OR REPLACE FUNCTION calcular_baremo(
  p_categoria categoria_profesional_guardia,
  p_tipo_guardia tipo_guardia,
  p_tipo_dia tipo_dia,
  p_fuente fuente_baremo DEFAULT 'protocol'
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
  v_valor DECIMAL(10,2);
BEGIN
  SELECT valor INTO v_valor
  FROM ajustes_baremo
  WHERE categoria = p_categoria
    AND tipo_guardia = p_tipo_guardia
    AND tipo_dia = p_tipo_dia
    AND fuente = p_fuente
    AND activo = true
    AND vigente_desde <= CURRENT_DATE
    AND (vigente_hasta IS NULL OR vigente_hasta >= CURRENT_DATE)
  ORDER BY vigente_desde DESC
  LIMIT 1;
  
  RETURN COALESCE(v_valor, 0);
END;
$$;

-- Enable Row Level Security
ALTER TABLE profesionales_guardias ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardias ENABLE ROW LEVEL SECURITY;
ALTER TABLE validaciones_guardias ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominas_guardias ENABLE ROW LEVEL SECURITY;
ALTER TABLE nomina_lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_guardias ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_guardias ENABLE ROW LEVEL SECURITY;
ALTER TABLE bitacora_guardias ENABLE ROW LEVEL SECURITY;
ALTER TABLE ajustes_baremo ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_guardias ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (to be refined later)
CREATE POLICY "Allow authenticated users to read guard professionals" ON profesionales_guardias
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read guards" ON guardias
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read validations" ON validaciones_guardias
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read payroll" ON nominas_guardias
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read payroll lines" ON nomina_lineas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read payments" ON pagos_guardias
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read guard users" ON usuarios_guardias
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read audit log" ON bitacora_guardias
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read scale adjustments" ON ajustes_baremo
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read configuration" ON configuracion_guardias
  FOR SELECT TO authenticated USING (true);
