-- ============================================
-- HOSIX - ADM 10.0 SUMINISTROS
-- Migración: 20250121_008_hosix_suministros.sql
-- ============================================

-- ============================================
-- 1. FAMILIAS DE ARTÍCULOS
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos_familias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articulos_familias_codigo ON hosix_articulos_familias(codigo);
CREATE INDEX IF NOT EXISTS idx_articulos_familias_activo ON hosix_articulos_familias(activo);

-- RLS Policy para familias
ALTER TABLE hosix_articulos_familias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_familias_select" ON hosix_articulos_familias
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_familias_insert" ON hosix_articulos_familias
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

CREATE POLICY "hosix_articulos_familias_update" ON hosix_articulos_familias
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- 2. GRUPOS DE ARTÍCULOS
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos_grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  familia_id UUID REFERENCES hosix_articulos_familias(id) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articulos_grupos_codigo ON hosix_articulos_grupos(codigo);
CREATE INDEX IF NOT EXISTS idx_articulos_grupos_familia ON hosix_articulos_grupos(familia_id);
CREATE INDEX IF NOT EXISTS idx_articulos_grupos_activo ON hosix_articulos_grupos(activo);

ALTER TABLE hosix_articulos_grupos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_grupos_select" ON hosix_articulos_grupos
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_grupos_insert" ON hosix_articulos_grupos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

CREATE POLICY "hosix_articulos_grupos_update" ON hosix_articulos_grupos
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- 3. UNIDADES DE DOSIS
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos_unidades_dosis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  simbolo VARCHAR(10),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unidades_dosis_codigo ON hosix_articulos_unidades_dosis(codigo);
CREATE INDEX IF NOT EXISTS idx_unidades_dosis_activo ON hosix_articulos_unidades_dosis(activo);

ALTER TABLE hosix_articulos_unidades_dosis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_unidades_dosis_select" ON hosix_articulos_unidades_dosis
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_unidades_dosis_insert" ON hosix_articulos_unidades_dosis
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- 4. UBICACIONES DE ALMACENAMIENTO
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos_ubicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50), -- almacen, deposito, planta, area
  temperatura_minima DECIMAL(5,2),
  temperatura_maxima DECIMAL(5,2),
  humedad_minima DECIMAL(5,2),
  humedad_maxima DECIMAL(5,2),
  capacidad_items INT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ubicaciones_codigo ON hosix_articulos_ubicaciones(codigo);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_tipo ON hosix_articulos_ubicaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_activo ON hosix_articulos_ubicaciones(activo);

ALTER TABLE hosix_articulos_ubicaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_ubicaciones_select" ON hosix_articulos_ubicaciones
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_ubicaciones_insert" ON hosix_articulos_ubicaciones
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- 5. UNIDADES DE COMPRA
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos_unidades_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  cantidad_unidades_basicas INT NOT NULL DEFAULT 1,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unidades_compra_codigo ON hosix_articulos_unidades_compra(codigo);
CREATE INDEX IF NOT EXISTS idx_unidades_compra_activo ON hosix_articulos_unidades_compra(activo);

ALTER TABLE hosix_articulos_unidades_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_unidades_compra_select" ON hosix_articulos_unidades_compra
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_unidades_compra_insert" ON hosix_articulos_unidades_compra
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- 6. UNIDADES DE DISPENSACIÓN
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos_unidades_dispensacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  cantidad_unidades_basicas INT NOT NULL DEFAULT 1,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unidades_dispensacion_codigo ON hosix_articulos_unidades_dispensacion(codigo);
CREATE INDEX IF NOT EXISTS idx_unidades_dispensacion_activo ON hosix_articulos_unidades_dispensacion(activo);

ALTER TABLE hosix_articulos_unidades_dispensacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_unidades_dispensacion_select" ON hosix_articulos_unidades_dispensacion
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_unidades_dispensacion_insert" ON hosix_articulos_unidades_dispensacion
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- 7. ARTÍCULOS (MAESTRO PRINCIPAL)
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  codigo_barras VARCHAR(100),
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  -- Clasificación
  familia_id UUID REFERENCES hosix_articulos_familias(id),
  grupo_id UUID REFERENCES hosix_articulos_grupos(id),
  
  -- Medicamento específico
  es_medicamento BOOLEAN DEFAULT false,
  nombre_comercial VARCHAR(255),
  principio_activo VARCHAR(255),
  concentracion VARCHAR(100),
  forma_farmaceutica VARCHAR(100), -- tableta, inyección, jarabe, etc.
  via_administracion VARCHAR(100), -- oral, inyectable, tópica, etc.
  
  -- Unidades
  unidad_dosis_id UUID REFERENCES hosix_articulos_unidades_dosis(id),
  unidad_compra_id UUID REFERENCES hosix_articulos_unidades_compra(id),
  unidad_dispensacion_id UUID REFERENCES hosix_articulos_unidades_dispensacion(id),
  
  -- Control
  requiere_receta BOOLEAN DEFAULT false,
  controlado BOOLEAN DEFAULT false,
  requiere_refrigeracion BOOLEAN DEFAULT false,
  
  -- Ubicación
  ubicacion_principal_id UUID REFERENCES hosix_articulos_ubicaciones(id),
  ubicaciones_alternativas JSONB DEFAULT '[]', -- array de ubicaciones
  
  -- Proveedores
  proveedores JSONB DEFAULT '[]', -- [{proveedor_id, codigo_proveedor}]
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articulos_codigo ON hosix_articulos(codigo);
CREATE INDEX IF NOT EXISTS idx_articulos_codigo_barras ON hosix_articulos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_articulos_familia ON hosix_articulos(familia_id);
CREATE INDEX IF NOT EXISTS idx_articulos_grupo ON hosix_articulos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_articulos_es_medicamento ON hosix_articulos(es_medicamento);
CREATE INDEX IF NOT EXISTS idx_articulos_controlado ON hosix_articulos(controlado);
CREATE INDEX IF NOT EXISTS idx_articulos_activo ON hosix_articulos(activo);
CREATE INDEX IF NOT EXISTS idx_articulos_nombre ON hosix_articulos USING GIN(to_tsvector('spanish', nombre));

ALTER TABLE hosix_articulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_select" ON hosix_articulos
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_insert" ON hosix_articulos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

CREATE POLICY "hosix_articulos_update" ON hosix_articulos
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- 8. TIPOS DE ENVASE
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos_tipos_envase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  capacidad DECIMAL(10,2),
  unidad_capacidad VARCHAR(50), -- ml, mg, unidad, etc.
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tipos_envase_codigo ON hosix_articulos_tipos_envase(codigo);
CREATE INDEX IF NOT EXISTS idx_tipos_envase_activo ON hosix_articulos_tipos_envase(activo);

ALTER TABLE hosix_articulos_tipos_envase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_tipos_envase_select" ON hosix_articulos_tipos_envase
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_tipos_envase_insert" ON hosix_articulos_tipos_envase
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- 9. CONTROL DE UNIDADES POR ENVASE
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_articulos_control_envase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  articulo_id UUID REFERENCES hosix_articulos(id) NOT NULL,
  tipo_envase_id UUID REFERENCES hosix_articulos_tipos_envase(id) NOT NULL,
  unidades_por_envase INT NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_control_envase_articulo ON hosix_articulos_control_envase(articulo_id);
CREATE INDEX IF NOT EXISTS idx_control_envase_envase ON hosix_articulos_control_envase(tipo_envase_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_control_envase_unique ON hosix_articulos_control_envase(articulo_id, tipo_envase_id);

ALTER TABLE hosix_articulos_control_envase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosix_articulos_control_envase_select" ON hosix_articulos_control_envase
FOR SELECT USING (true);

CREATE POLICY "hosix_articulos_control_envase_insert" ON hosix_articulos_control_envase
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM hosix_usuarios u
    WHERE u.id = auth.uid() AND u.activo = true
  )
);

-- ============================================
-- INSERCIÓN DE DATOS DE PRUEBA
-- ============================================

-- Familias
INSERT INTO hosix_articulos_familias (codigo, nombre, descripcion) VALUES
('FAM_MED', 'Medicamentos', 'Medicamentos farmacéuticos'),
('FAM_MAT', 'Materiales Médicos', 'Materiales para procedimientos médicos'),
('FAM_EQ', 'Equipos Médicos', 'Equipos médicos menores'),
('FAM_SUM', 'Suministros Generales', 'Suministros diversos para hospital')
ON CONFLICT (codigo) DO NOTHING;

-- Unidades de Dosis
INSERT INTO hosix_articulos_unidades_dosis (codigo, nombre, simbolo) VALUES
('UN_COMP', 'Comprimido', 'comp'),
('UN_INY', 'Inyección', 'inj'),
('UN_JAR', 'Jarabe', 'jar'),
('UN_AMP', 'Ampolla', 'amp'),
('UN_CPS', 'Cápsula', 'caps'),
('UN_ML', 'Mililitro', 'ml'),
('UN_MG', 'Miligramo', 'mg'),
('UN_UNIT', 'Unidad', 'u')
ON CONFLICT (codigo) DO NOTHING;

-- Unidades de Compra
INSERT INTO hosix_articulos_unidades_compra (codigo, nombre, cantidad_unidades_basicas) VALUES
('UC_CAJA', 'Caja', 12),
('UC_BLISTER', 'Blister', 10),
('UC_BOTELLA', 'Botella', 1),
('UC_FRASCO', 'Frasco', 1)
ON CONFLICT (codigo) DO NOTHING;

-- Unidades de Dispensación
INSERT INTO hosix_articulos_unidades_dispensacion (codigo, nombre, cantidad_unidades_basicas) VALUES
('UD_UNIT', 'Unidad', 1),
('UD_PACK', 'Pack', 5),
('UD_DOSIS', 'Dosis', 1)
ON CONFLICT (codigo) DO NOTHING;

-- Ubicaciones
INSERT INTO hosix_articulos_ubicaciones (codigo, nombre, tipo, temperatura_minima, temperatura_maxima) VALUES
('UB_FARM', 'Farmacia Principal', 'almacen', 18, 25),
('UB_REFRIG', 'Refrigerador Farmacia', 'almacen', 2, 8),
('UB_ENFERM', 'Almacén Enfermería', 'area', 18, 25),
('UB_QUIROF', 'Almacén Quirófano', 'area', 18, 25)
ON CONFLICT (codigo) DO NOTHING;

-- Tipos de Envase
INSERT INTO hosix_articulos_tipos_envase (codigo, nombre, capacidad, unidad_capacidad) VALUES
('ENV_COMP', 'Comprimidos', 12, 'unidades'),
('ENV_FRASCO', 'Frasco de vidrio', 100, 'ml'),
('ENV_AMP', 'Ampolla', 2, 'ml'),
('ENV_BLISTER', 'Blister', 10, 'unidades')
ON CONFLICT (codigo) DO NOTHING;
