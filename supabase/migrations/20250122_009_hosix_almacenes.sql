-- ============================================
-- ADM 11.0 - GESTIÓN DE ALMACENES Y STOCK
-- ============================================
-- Fecha: 2025-01-22
-- Funcionalidades:
-- - Gestión de almacenes y depósitos
-- - Control de stock
-- - Movimientos de inventario
-- - Lotes y caducidades (FIFO)
-- - Órdenes de compra
-- - Inventarios físicos

-- ============================================
-- 1. ALMACENES Y DEPÓSITOS
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_almacenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  -- Ubicación
  ubicacion_fisica VARCHAR(255),
  area_m2 DECIMAL(10,2),
  
  -- Responsable
  responsable_id UUID REFERENCES profesionales_sanitarios(id),
  
  -- Características
  requiere_refrigeracion BOOLEAN DEFAULT false,
  temperatura_minima DECIMAL(5,2),
  temperatura_maxima DECIMAL(5,2),
  humedad_optima INT,
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para almacenes
ALTER TABLE hosix_almacenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "almacenes_read_all" ON hosix_almacenes
FOR SELECT USING (true);

CREATE POLICY "almacenes_insert_admin" ON hosix_almacenes
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT u.id FROM auth.users u
    WHERE u.email LIKE '%admin%'
  )
);

CREATE POLICY "almacenes_update_admin" ON hosix_almacenes
FOR UPDATE USING (
  auth.uid() IN (
    SELECT u.id FROM auth.users u
    WHERE u.email LIKE '%admin%'
  )
);

-- Tabla de depósitos dentro de almacenes
CREATE TABLE IF NOT EXISTS hosix_almacenes_depositos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  almacen_id UUID REFERENCES hosix_almacenes(id) NOT NULL,
  
  codigo VARCHAR(50) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  -- Tipo de depósito
  tipo_deposito VARCHAR(50), -- estanteria, refrigerador, congelador, cajon, repisa
  
  -- Capacidad
  capacidad_maxima INT,
  unidad_capacidad VARCHAR(20), -- unidades, cajas, kg, litros
  
  -- Ubicación dentro del almacén
  ubicacion_relativa VARCHAR(100), -- pasillo A, nivel 2, etc.
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  
  UNIQUE(almacen_id, codigo),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hosix_almacenes_depositos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "depositos_read_all" ON hosix_almacenes_depositos
FOR SELECT USING (true);

CREATE POLICY "depositos_insert_admin" ON hosix_almacenes_depositos
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%')
);

CREATE POLICY "depositos_update_admin" ON hosix_almacenes_depositos
FOR UPDATE USING (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%')
);

-- ============================================
-- 2. STOCK E INVENTARIO
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  articulo_id UUID REFERENCES hosix_articulos(id) NOT NULL,
  almacen_id UUID REFERENCES hosix_almacenes(id) NOT NULL,
  deposito_id UUID REFERENCES hosix_almacenes_depositos(id),
  
  -- Cantidad
  cantidad_actual DECIMAL(15,2) NOT NULL DEFAULT 0,
  cantidad_reservada DECIMAL(15,2) DEFAULT 0,
  cantidad_disponible DECIMAL(15,2) GENERATED ALWAYS AS (cantidad_actual - cantidad_reservada) STORED,
  
  -- Umbrales
  stock_minimo DECIMAL(15,2),
  stock_maximo DECIMAL(15,2),
  
  -- Último movimiento
  fecha_ultimo_movimiento TIMESTAMPTZ,
  
  -- Control de caducidad
  requiere_lote BOOLEAN DEFAULT false,
  requiere_caducidad BOOLEAN DEFAULT false,
  
  -- Metadatos
  actualizado_por UUID REFERENCES auth.users(id),
  
  UNIQUE(articulo_id, almacen_id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hosix_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_read_all" ON hosix_stock
FOR SELECT USING (true);

CREATE POLICY "stock_insert_warehouse" ON hosix_stock
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

CREATE POLICY "stock_update_warehouse" ON hosix_stock
FOR UPDATE USING (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

-- ============================================
-- 3. LOTES Y CADUCIDADES
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_stock_lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID REFERENCES hosix_stock(id) NOT NULL,
  
  numero_lote VARCHAR(100) NOT NULL,
  cantidad_lote DECIMAL(15,2) NOT NULL,
  
  -- Caducidad (FIFO)
  fecha_vencimiento DATE,
  dias_para_vencer INT GENERATED ALWAYS AS (
    EXTRACT(DAY FROM (fecha_vencimiento - CURRENT_DATE))::INT
  ) STORED,
  
  -- Control
  activo BOOLEAN DEFAULT true,
  fecha_entrada TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(stock_id, numero_lote),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hosix_stock_lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lotes_read_all" ON hosix_stock_lotes
FOR SELECT USING (true);

CREATE POLICY "lotes_insert_warehouse" ON hosix_stock_lotes
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

CREATE POLICY "lotes_update_warehouse" ON hosix_stock_lotes
FOR UPDATE USING (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

-- ============================================
-- 4. MOVIMIENTOS DE INVENTARIO
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_stock_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  articulo_id UUID REFERENCES hosix_articulos(id) NOT NULL,
  almacen_origen_id UUID REFERENCES hosix_almacenes(id),
  almacen_destino_id UUID REFERENCES hosix_almacenes(id),
  
  -- Tipo de movimiento
  tipo_movimiento VARCHAR(50) NOT NULL, -- entrada_compra, entrada_devolucion, salida_compra, salida_paciente, salida_consume, transferencia, ajuste, devolucion_proveedor
  documento_referencia VARCHAR(100),
  
  -- Cantidades
  cantidad DECIMAL(15,2) NOT NULL,
  unidad VARCHAR(50),
  
  -- Lote (si aplica)
  numero_lote VARCHAR(100),
  fecha_vencimiento DATE,
  
  -- Responsables
  usuario_origen_id UUID REFERENCES auth.users(id),
  usuario_destino_id UUID REFERENCES auth.users(id),
  
  -- Información adicional
  motivo TEXT,
  aprobado_por UUID REFERENCES profesionales_sanitarios(id),
  
  -- Para movimientos a paciente
  paciente_id UUID REFERENCES hosix_pacientes(id),
  episodio_id UUID,
  cuenta_paciente_id UUID,
  
  -- Para movimientos de compra
  orden_compra_id UUID,
  proveedor_id UUID,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'registrado', -- registrado, aprobado, rechazado
  fecha_aprobacion TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_movimientos_articulo ON hosix_stock_movimientos(articulo_id);
CREATE INDEX idx_movimientos_almacen_origen ON hosix_stock_movimientos(almacen_origen_id);
CREATE INDEX idx_movimientos_almacen_destino ON hosix_stock_movimientos(almacen_destino_id);
CREATE INDEX idx_movimientos_tipo ON hosix_stock_movimientos(tipo_movimiento);
CREATE INDEX idx_movimientos_fecha ON hosix_stock_movimientos(created_at);

ALTER TABLE hosix_stock_movimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "movimientos_read_all" ON hosix_stock_movimientos
FOR SELECT USING (true);

CREATE POLICY "movimientos_insert_warehouse" ON hosix_stock_movimientos
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

CREATE POLICY "movimientos_update_warehouse" ON hosix_stock_movimientos
FOR UPDATE USING (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

-- ============================================
-- 5. ÓRDENES DE COMPRA
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_ordenes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_orden VARCHAR(50) UNIQUE NOT NULL,
  
  proveedor_id UUID,
  codigo_proveedor VARCHAR(100),
  
  -- Fechas
  fecha_orden TIMESTAMPTZ DEFAULT now(),
  fecha_esperada_entrega DATE,
  fecha_entrega_real DATE,
  
  -- Monto
  subtotal DECIMAL(15,2),
  impuesto DECIMAL(15,2),
  total DECIMAL(15,2),
  
  -- Usuario responsable
  usuario_id UUID REFERENCES auth.users(id),
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, confirmada, entregada_parcial, entregada, cancelada
  
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hosix_ordenes_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ordenes_read_all" ON hosix_ordenes_compra
FOR SELECT USING (true);

CREATE POLICY "ordenes_insert_warehouse" ON hosix_ordenes_compra
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

CREATE POLICY "ordenes_update_warehouse" ON hosix_ordenes_compra
FOR UPDATE USING (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

-- Líneas de órdenes de compra
CREATE TABLE IF NOT EXISTS hosix_ordenes_compra_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_compra_id UUID REFERENCES hosix_ordenes_compra(id) NOT NULL,
  
  articulo_id UUID REFERENCES hosix_articulos(id) NOT NULL,
  cantidad_solicitada DECIMAL(15,2) NOT NULL,
  cantidad_recibida DECIMAL(15,2) DEFAULT 0,
  
  -- Precio
  precio_unitario DECIMAL(15,4),
  descuento_porcentaje DECIMAL(5,2),
  total_linea DECIMAL(15,2),
  
  -- Almacén destino
  almacen_destino_id UUID REFERENCES hosix_almacenes(id),
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, parcialmente_recibida, recibida
  
  numero_linea INT,
  
  UNIQUE(orden_compra_id, numero_linea),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hosix_ordenes_compra_lineas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orden_lineas_read_all" ON hosix_ordenes_compra_lineas
FOR SELECT USING (true);

-- ============================================
-- 6. INVENTARIOS FÍSICOS
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_inventarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_inventario VARCHAR(50) UNIQUE NOT NULL,
  
  -- Alcance
  almacen_id UUID REFERENCES hosix_almacenes(id) NOT NULL,
  deposito_id UUID REFERENCES hosix_almacenes_depositos(id),
  
  -- Fechas
  fecha_programada DATE,
  fecha_inicio TIMESTAMPTZ,
  fecha_cierre TIMESTAMPTZ,
  
  -- Responsables
  usuario_creador_id UUID REFERENCES auth.users(id),
  usuarios_inventariadores JSONB DEFAULT '[]', -- Array de UIDs
  
  -- Resultados
  cantidad_articulos INT,
  diferencias_encontradas INT,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'planificado', -- planificado, en_proceso, cerrado, regularizado
  
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hosix_inventarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventarios_read_all" ON hosix_inventarios
FOR SELECT USING (true);

CREATE POLICY "inventarios_insert_warehouse" ON hosix_inventarios
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

CREATE POLICY "inventarios_update_warehouse" ON hosix_inventarios
FOR UPDATE USING (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

-- Líneas de inventario físico
CREATE TABLE IF NOT EXISTS hosix_inventarios_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventario_id UUID REFERENCES hosix_inventarios(id) NOT NULL,
  
  articulo_id UUID REFERENCES hosix_articulos(id) NOT NULL,
  
  -- Cantidades
  cantidad_esperada DECIMAL(15,2),
  cantidad_encontrada DECIMAL(15,2),
  diferencia DECIMAL(15,2) GENERATED ALWAYS AS (cantidad_encontrada - cantidad_esperada) STORED,
  
  -- Lote (si aplica)
  numero_lote VARCHAR(100),
  fecha_vencimiento DATE,
  
  -- Observaciones
  observaciones TEXT,
  
  -- Usuario que registró
  usuario_id UUID REFERENCES auth.users(id),
  fecha_registro TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hosix_inventarios_lineas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_lineas_read_all" ON hosix_inventarios_lineas
FOR SELECT USING (true);

CREATE POLICY "inv_lineas_insert_warehouse" ON hosix_inventarios_lineas
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

CREATE POLICY "inv_lineas_update_warehouse" ON hosix_inventarios_lineas
FOR UPDATE USING (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%' OR u.email LIKE '%almacen%')
);

-- ============================================
-- 7. CENTROS DE COSTE (para salidas directas)
-- ============================================

CREATE TABLE IF NOT EXISTS hosix_centros_coste (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  servicio_id UUID REFERENCES hosix_servicios(id),
  responsable_id UUID REFERENCES profesionales_sanitarios(id),
  
  activo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hosix_centros_coste ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cc_read_all" ON hosix_centros_coste
FOR SELECT USING (true);

CREATE POLICY "cc_insert_admin" ON hosix_centros_coste
FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%')
);

CREATE POLICY "cc_update_admin" ON hosix_centros_coste
FOR UPDATE USING (
  auth.uid() IN (SELECT u.id FROM auth.users u WHERE u.email LIKE '%admin%')
);

-- ============================================
-- 8. DATOS INICIALES (SEED DATA)
-- ============================================

INSERT INTO hosix_almacenes (codigo, nombre, descripcion, requiere_refrigeracion, temperatura_minima, temperatura_maxima, activo) VALUES
('ALM_PRINCIPAL', 'Almacén Principal', 'Almacén principal de medicamentos y materiales', false, NULL, NULL, true),
('ALM_FARMACIA', 'Almacén Farmacia', 'Almacén de medicamentos de farmacia', true, 15, 25, true),
('ALM_QUIRURGICO', 'Almacén Quirúrgico', 'Material quirúrgico y estéril', false, NULL, NULL, true),
('ALM_LABORATORIO', 'Almacén Laboratorio', 'Reactivos y muestras de laboratorio', true, 2, 8, true)
ON CONFLICT DO NOTHING;

INSERT INTO hosix_almacenes_depositos (almacen_id, codigo, nombre, tipo_deposito, ubicacion_relativa, activo) 
SELECT id, 'DEP_01', 'Depósito 1', 'estanteria', 'Pasillo A, Nivel 1', true FROM hosix_almacenes WHERE codigo = 'ALM_PRINCIPAL'
ON CONFLICT DO NOTHING;

INSERT INTO hosix_almacenes_depositos (almacen_id, codigo, nombre, tipo_deposito, ubicacion_relativa, activo) 
SELECT id, 'DEP_REF', 'Refrigerador Principal', 'refrigerador', 'Zona Refrigerada', true FROM hosix_almacenes WHERE codigo = 'ALM_FARMACIA'
ON CONFLICT DO NOTHING;

INSERT INTO hosix_centros_coste (codigo, nombre, descripcion, activo) VALUES
('CC_FARMACIA', 'Centro de Coste Farmacia', 'Consumo de medicamentos', true),
('CC_QUIROFANO', 'Centro de Coste Quirófano', 'Consumo quirúrgico', true),
('CC_LABORATORIO', 'Centro de Coste Laboratorio', 'Consumo laboratorio', true),
('CC_ENFERMERIA', 'Centro de Coste Enfermería', 'Consumo de enfermería', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. ÍNDICES ADICIONALES
-- ============================================

CREATE INDEX idx_stock_articulo ON hosix_stock(articulo_id);
CREATE INDEX idx_stock_almacen ON hosix_stock(almacen_id);
CREATE INDEX idx_lotes_stock ON hosix_stock_lotes(stock_id);
CREATE INDEX idx_lotes_vencimiento ON hosix_stock_lotes(fecha_vencimiento);
CREATE INDEX idx_inventarios_almacen ON hosix_inventarios(almacen_id);
CREATE INDEX idx_inv_lineas_inventario ON hosix_inventarios_lineas(inventario_id);
CREATE INDEX idx_ordenes_estado ON hosix_ordenes_compra(estado);
