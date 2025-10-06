-- Sistema de parámetros dinámicos para profesionales
-- Permite crear parámetros personalizados sin necesidad de modificar código

-- Enum para tipos de datos de parámetros
CREATE TYPE tipo_dato_parametro AS ENUM (
  'texto',
  'numero',
  'fecha',
  'boolean',
  'seleccion_unica',
  'seleccion_multiple',
  'archivo',
  'moneda'
);

-- Enum para categorías de parámetros
CREATE TYPE categoria_parametro AS ENUM (
  'formacion',
  'condecoracion',
  'promocion',
  'incidencia',
  'evento',
  'salario',
  'certificacion',
  'evaluacion',
  'disciplinario',
  'reconocimiento',
  'otro'
);

-- Tabla de definiciones de parámetros personalizados
CREATE TABLE IF NOT EXISTS parametros_profesionales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  tipo_dato tipo_dato_parametro NOT NULL,
  categoria categoria_parametro NOT NULL DEFAULT 'otro',
  icono TEXT DEFAULT 'Award', -- Nombre del icono de lucide-react
  color TEXT DEFAULT '#3b82f6', -- Color hex para el parámetro
  opciones_seleccion JSONB, -- Para tipo seleccion_unica o seleccion_multiple
  unidad TEXT, -- Para números (ej: "años", "CFA", etc)
  es_obligatorio BOOLEAN DEFAULT false,
  visible_en_detalles BOOLEAN DEFAULT true,
  orden_visualizacion INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabla de valores de parámetros asignados a profesionales
CREATE TABLE IF NOT EXISTS valores_parametros_profesionales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id UUID NOT NULL REFERENCES profesionales_sanitarios(id) ON DELETE CASCADE,
  parametro_id UUID NOT NULL REFERENCES parametros_profesionales(id) ON DELETE CASCADE,
  valor_texto TEXT,
  valor_numero NUMERIC,
  valor_fecha DATE,
  valor_boolean BOOLEAN,
  valor_seleccion TEXT[], -- Array para selección múltiple
  valor_archivo_url TEXT,
  notas TEXT,
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  registrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profesional_id, parametro_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_parametros_categoria ON parametros_profesionales(categoria);
CREATE INDEX IF NOT EXISTS idx_parametros_activo ON parametros_profesionales(activo);
CREATE INDEX IF NOT EXISTS idx_valores_profesional ON valores_parametros_profesionales(profesional_id);
CREATE INDEX IF NOT EXISTS idx_valores_parametro ON valores_parametros_profesionales(parametro_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_updated_at_parametros()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_parametros
BEFORE UPDATE ON parametros_profesionales
FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_parametros();

CREATE TRIGGER trigger_actualizar_valores_parametros
BEFORE UPDATE ON valores_parametros_profesionales
FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_parametros();

-- RLS Policies
ALTER TABLE parametros_profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE valores_parametros_profesionales ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer parámetros activos
CREATE POLICY "Todos pueden ver parámetros activos"
ON parametros_profesionales FOR SELECT
USING (activo = true);

-- Solo admins pueden gestionar parámetros
CREATE POLICY "Admins pueden gestionar parámetros"
ON parametros_profesionales FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO', 'PERSONALIDAD_MINISTERIAL')
  )
);

-- Todos autenticados pueden ver valores de parámetros
CREATE POLICY "Usuarios autenticados pueden ver valores"
ON valores_parametros_profesionales FOR SELECT
USING (auth.role() = 'authenticated');

-- Solo admins y RRHH pueden modificar valores
CREATE POLICY "Admins pueden gestionar valores"
ON valores_parametros_profesionales FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('SUPER_ADMINISTRADOR', 'RRHH_MINISTERIO', 'ADMIN_CENTRO_SANITARIO')
  )
);

-- Insertar algunos parámetros de ejemplo
INSERT INTO parametros_profesionales (nombre, descripcion, tipo_dato, categoria, icono, color, visible_en_detalles, orden_visualizacion) VALUES
('Condecoraciones', 'Condecoraciones y reconocimientos recibidos', 'texto', 'condecoracion', 'Award', '#f59e0b', true, 1),
('Salario Base', 'Salario base mensual', 'moneda', 'salario', 'DollarSign', '#10b981', true, 2),
('Última Evaluación', 'Fecha de última evaluación de desempeño', 'fecha', 'evaluacion', 'ClipboardCheck', '#6366f1', true, 3),
('Certificaciones Adicionales', 'Certificaciones profesionales adicionales', 'texto', 'certificacion', 'FileCheck', '#8b5cf6', true, 4),
('Promoción', 'Historial de promociones', 'fecha', 'promocion', 'TrendingUp', '#ec4899', true, 5)
ON CONFLICT (nombre) DO NOTHING;