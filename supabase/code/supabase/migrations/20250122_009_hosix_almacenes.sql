-- =========================================
-- HOSIX - ADM 11.0: ALMACENES Y GESTIÓN DE STOCK
-- Fecha: 22 Enero 2025
-- Descripción: Gestión completa de almacenes, depósitos, stock, lotes y movimientos
-- =========================================

-- ===========================================
-- 1. TABLA: ALMACENES PRINCIPALES
-- ===========================================

CREATE TABLE IF NOT EXISTS hosix_almacenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  ubicacion VARCHAR(255),
  responsable_id UUID REFERENCES profesionales_sanitarios(id),
  requiere_refrigeracion BOOLEAN DEFAULT false,
  temperatura_minima DECIMAL(5,1),
  temperatura_maxima DECIMAL(5,1),
  activo BOOLEAN DEFAULT true,
  centro_salud_id UUID REFERENCES centros_salud(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hosix_almacenes_centro ON hosix_almacenes(centro_salud_id);
CREATE INDEX idx_hosix_almacenes_activo ON hosix_almacenes(activo);

-- ===========================================
-- 2. TABLA: DEPÓSITOS (SUB-ALMACENES)
-- ===========================================

CREATE TABLE IF NOT EXISTS hosix_almacenes_depositos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  almacen_id UUID NOT NULL REFERENCES hosix_almacenes(id),
  codigo VARCHAR(50) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  zona_almacenamiento VARCHAR(100),
  requiere_refrigeracion BOOLEAN DEFAULT false,
  temperatura_minima DECIMAL(5,1),
  temperatura_maxima DECIMAL(5,1),
  capacidad_maxima_articulos INT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(almacen_id, codigo)
);

CREATE INDEX idx_hosix_depositos_almacen ON hosix_almacenes_depositos(almacen_id);
CREATE INDEX idx_hosix_depositos_activo ON hosix_almacenes_depositos(activo);

-- ===========================================
-- 3. TABLA: STOCK ACTUAL
-- ===========================================

CREATE TABLE IF NOT EXISTS hosix_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposito_id UUID NOT NULL REFERENCES hosix_almacenes_depositos(id),
  articulo_id UUID NOT NULL REFERENCES hosix_articulos(id),
  cantidad_total DECIMAL(12,3) NOT NULL DEFAULT 0,
  cantidad_disponible DECIMAL(12,3) NOT NULL DEFAULT 0,
  cantidad_reservada DECIMAL(12,3) NOT NULL DEFAULT 0,
  stock_minimo DECIMAL(12,3),
  stock_critico DECIMAL(12,3),
  ultima_actualizacion TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deposito_id, articulo_id)
);

CREATE INDEX idx_hosix_stock_deposito ON hosix_stock(deposito_id);
CREATE INDEX idx_hosix_stock_articulo ON hosix_stock(articulo_id);
CREATE INDEX idx_hosix_stock_alertas ON hosix_stock(cantidad_disponible, stock_minimo, stock_critico);

-- ===========================================
-- 4. TABLA: LOTES CON CADUCIDAD (FIFO)
-- ===========================================

CREATE TABLE IF NOT EXISTS hosix_stock_lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES hosix_stock(id),
  numero_lote VARCHAR(100) NOT NULL,
  fecha_entrada TIMESTAMPTZ NOT NULL,
  fecha_fabricacion DATE,
  fecha_vencimiento DATE NOT NULL,
  cantidad_original DECIMAL(12,3) NOT NULL,
  cantidad_disponible DECIMAL(12,3) NOT NULL,
  dias_para_caducidad INT GENERATED ALWAYS AS (fecha_vencimiento - CURRENT_DATE) STORED,
  posicion_fifo INT NOT NULL,
  costo_unitario DECIMAL(12,4),
  costo_total DECIMAL(14,2) GENERATED ALWAYS AS (ROUND(cantidad_original * costo_unitario, 2)) STORED,
  proveedor_id UUID REFERENCES hosix_proveedores(id),
  numero_factura_compra VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hosix_lotes_stock ON hosix_stock_lotes(stock_id);
CREATE INDEX idx_hosix_lotes_vencimiento ON hosix_stock_lotes(fecha_vencimiento);
CREATE INDEX idx_hosix_lotes_fifo ON hosix_stock_lotes(stock_id, posicion_fifo);
CREATE INDEX idx_hosix_lotes_caducidad ON hosix_stock_lotes(dias_para_caducidad);

-- ===========================================
-- 5. TABLA: MOVIMIENTOS DE STOCK
-- ===========================================

CREATE TABLE IF NOT EXISTS hosix_stock_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES hosix_stock(id),
  lote_id UUID REFERENCES hosix_stock_lotes(id),
  tipo_movimiento VARCHAR(50) NOT NULL,
  cantidad DECIMAL(12,3) NOT NULL,
  orden_compra_id UUID,
  episodio_paciente_id UUID,
  centro_coste_id UUID,
  deposito_origen_id UUID REFERENCES hosix_almacenes_depositos(id),
  deposito_destino_id UUID REFERENCES hosix_almacenes_depositos(id),
  numero_referencia VARCHAR(100),
  motivo TEXT,
  observaciones TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hosix_movimientos_stock ON hosix_stock_movimientos(stock_id);
CREATE INDEX idx_hosix_movimientos_lote ON hosix_stock_movimientos(lote_id);
CREATE INDEX idx_hosix_movimientos_tipo ON hosix_stock_movimientos(tipo_movimiento);
CREATE INDEX idx_hosix_movimientos_fecha ON hosix_stock_movimientos(created_at);
CREATE INDEX idx_hosix_movimientos_deposito_origen ON hosix_stock_movimientos(deposito_origen_id);
CREATE INDEX idx_hosix_movimientos_deposito_destino ON hosix_stock_movimientos(deposito_destino_id);

-- ===========================================
-- 6. TABLA: ÓRDENES DE COMPRA
-- ===========================================

CREATE TABLE IF NOT EXISTS hosix_ordenes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_orden VARCHAR(50) UNIQUE NOT NULL,
  proveedor_id UUID NOT NULL REFERENCES hosix_proveedores(id),
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_solicitada DATE,
  fecha_entrega_estimada DATE,
  fecha_entrega_real DATE,
  subtotal DECIMAL(14,2) DEFAULT 0,
  impuestos DECIMAL(14,2) DEFAULT 0,
  total DECIMAL(14,2) GENERATED ALWAYS AS (subtotal + impuestos) STORED,
  estado VARCHAR(50) DEFAULT 'borrador',
  creado_por UUID REFERENCES auth.users(id),
  responsable_id UUID REFERENCES profesionales_sanitarios(id),
  observaciones TEXT,
  centro_salud_id UUID REFERENCES centros_salud(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hosix_ordenes_proveedor ON hosix_ordenes_compra(proveedor_id);
CREATE INDEX idx_hosix_ordenes_estado ON hosix_ordenes_compra(estado);
CREATE INDEX idx_hosix_ordenes_fecha ON hosix_ordenes_compra(fecha_creacion);

-- ===========================================
-- 7. TABLA: LÍNEAS DE ÓRDENES DE COMPRA
-- ===========================================

CREATE TABLE IF NOT EXISTS hosix_ordenes_compra_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_compra_id UUID NOT NULL REFERENCES hosix_ordenes_compra(id),
  articulo_id UUID NOT NULL REFERENCES hosix_articulos(id),
  cantidad_solicitada DECIMAL(12,3) NOT NULL,
  cantidad_recibida DECIMAL(12,3) DEFAULT 0,
  precio_unitario DECIMAL(12,4) NOT NULL,
  subtotal DECIMAL(14,2) GENERATED ALWAYS AS (cantidad_solicitada * precio_unitario) STORED,
  numero_linea INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hosix_ordenes_lineas_orden ON hosix_ordenes_compra_lineas(orden_compra_id);
CREATE INDEX idx_hosix_ordenes_lineas_articulo ON hosix_ordenes_compra_lineas(articulo_id);

-- ===========================================
-- 8. TABLA: INVENTARIOS FÍSICOS
-- ===========================================

CREATE TABLE IF NOT EXISTS hosix_inventarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_inventario VARCHAR(50) UNIQUE NOT NULL,
  almacen_id UUID NOT NULL REFERENCES hosix_almacenes(id),
  deposito_id UUID REFERENCES hosix_almacenes_depositos(id),
  fecha_programada DATE NOT NULL,
  fecha_inicio_conteo TIMESTAMPTZ,
  fecha_fin_conteo TIMESTAMPTZ,
  coordinador_id UUID REFERENCES profesionales_sanitarios(id),
  usuarios_conteo JSONB DEFAULT '[]',
  estado VARCHAR(50) DEFAULT 'programado',
  total_diferencia DECIMAL(14,2) DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hosix_inventarios_almacen ON hosix_inventarios(almacen_id);
CREATE INDEX idx_hosix_inventarios_deposito ON hosix_inventarios(deposito_id);
CREATE INDEX idx_hosix_inventarios_estado ON hosix_inventarios(estado);
CREATE INDEX idx_hosix_inventarios_fecha ON hosix_inventarios(fecha_programada);

-- ===========================================
-- 9. TABLA: LÍNEAS DE INVENTARIOS FÍSICOS
-- ===========================================

CREATE TABLE IF NOT EXISTS hosix_inventarios_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventario_id UUID NOT NULL REFERENCES hosix_inventarios(id),
  articulo_id UUID NOT NULL REFERENCES hosix_articulos(id),
  cantidad_sistema DECIMAL(12,3),
  cantidad_fisica DECIMAL(12,3),
  diferencia DECIMAL(12,3) GENERATED ALWAYS AS (cantidad_fisica - cantidad_sistema) STORED,
  lotes_encontrados JSONB DEFAULT '[]',
  observaciones TEXT,
  contado_por UUID REFERENCES auth.users(id),
  fecha_conteo TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hosix_inventarios_lineas_inventario ON hosix_inventarios_lineas(inventario_id);
CREATE INDEX idx_hosix_inventarios_lineas_articulo ON hosix_inventarios_lineas(articulo_id);

-- ===========================================
-- 10. TABLA: CENTROS DE COSTE
-- ===========================================

CREATE TABLE IF NOT EXISTS hosix_centros_coste (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  departamento_id UUID REFERENCES hosix_departamentos(id),
  servicio_id UUID REFERENCES hosix_servicios(id),
  presupuesto_anual DECIMAL(14,2),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hosix_centros_coste_departamento ON hosix_centros_coste(departamento_id);
CREATE INDEX idx_hosix_centros_coste_servicio ON hosix_centros_coste(servicio_id);

-- ===========================================
-- 11. TABLA: PROVEEDORES
-- ===========================================

CREATE TABLE IF NOT EXISTS hosix_proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  contacto VARCHAR(255),
  email VARCHAR(255),
  telefono VARCHAR(20),
  direccion TEXT,
  ciudad VARCHAR(100),
  pais VARCHAR(100),
  plazo_pago_dias INT DEFAULT 30,
  minimo_pedido DECIMAL(12,2),
  responsable_contacto VARCHAR(255),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hosix_proveedores_codigo ON hosix_proveedores(codigo);
CREATE INDEX idx_hosix_proveedores_nombre ON hosix_proveedores(nombre);

-- ===========================================
-- 12. POLÍTICAS DE SEGURIDAD (RLS)
-- ===========================================

ALTER TABLE hosix_almacenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_almacenes_depositos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_stock_lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_stock_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_ordenes_compra_lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_inventarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_inventarios_lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_centros_coste ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_proveedores ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Almacenes
CREATE POLICY "hosix_almacenes_select" ON hosix_almacenes
  FOR SELECT USING (
    centro_salud_id = (SELECT centro_salud_id FROM profesionales_sanitarios WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "hosix_almacenes_insert" ON hosix_almacenes
  FOR INSERT WITH CHECK (
    centro_salud_id = (SELECT centro_salud_id FROM profesionales_sanitarios WHERE auth_user_id = auth.uid())
  );

-- RLS Policy: Depósitos
CREATE POLICY "hosix_depositos_select" ON hosix_almacenes_depositos
  FOR SELECT USING (
    almacen_id IN (
      SELECT id FROM hosix_almacenes 
      WHERE centro_salud_id = (SELECT centro_salud_id FROM profesionales_sanitarios WHERE auth_user_id = auth.uid())
    )
  );

-- RLS Policy: Stock
CREATE POLICY "hosix_stock_select" ON hosix_stock
  FOR SELECT USING (
    deposito_id IN (
      SELECT id FROM hosix_almacenes_depositos 
      WHERE almacen_id IN (
        SELECT id FROM hosix_almacenes 
        WHERE centro_salud_id = (SELECT centro_salud_id FROM profesionales_sanitarios WHERE auth_user_id = auth.uid())
      )
    )
  );

-- RLS Policy: Movimientos
CREATE POLICY "hosix_movimientos_select" ON hosix_stock_movimientos
  FOR SELECT USING (
    stock_id IN (
      SELECT id FROM hosix_stock 
      WHERE deposito_id IN (
        SELECT id FROM hosix_almacenes_depositos 
        WHERE almacen_id IN (
          SELECT id FROM hosix_almacenes 
          WHERE centro_salud_id = (SELECT centro_salud_id FROM profesionales_sanitarios WHERE auth_user_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "hosix_movimientos_insert" ON hosix_stock_movimientos
  FOR INSERT WITH CHECK (
    stock_id IN (
      SELECT id FROM hosix_stock 
      WHERE deposito_id IN (
        SELECT id FROM hosix_almacenes_depositos 
        WHERE almacen_id IN (
          SELECT id FROM hosix_almacenes 
          WHERE centro_salud_id = (SELECT centro_salud_id FROM profesionales_sanitarios WHERE auth_user_id = auth.uid())
        )
      )
    )
  );

-- RLS Policy: Órdenes
CREATE POLICY "hosix_ordenes_select" ON hosix_ordenes_compra
  FOR SELECT USING (
    centro_salud_id = (SELECT centro_salud_id FROM profesionales_sanitarios WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "hosix_ordenes_insert" ON hosix_ordenes_compra
  FOR INSERT WITH CHECK (
    centro_salud_id = (SELECT centro_salud_id FROM profesionales_sanitarios WHERE auth_user_id = auth.uid())
  );

-- RLS Policy: Inventarios
CREATE POLICY "hosix_inventarios_select" ON hosix_inventarios
  FOR SELECT USING (
    almacen_id IN (
      SELECT id FROM hosix_almacenes 
      WHERE centro_salud_id = (SELECT centro_salud_id FROM profesionales_sanitarios WHERE auth_user_id = auth.uid())
    )
  );

-- RLS Policy: Centros de Coste
CREATE POLICY "hosix_centros_coste_select" ON hosix_centros_coste
  FOR SELECT USING (true);

-- RLS Policy: Proveedores
CREATE POLICY "hosix_proveedores_select" ON hosix_proveedores
  FOR SELECT USING (true);

-- ===========================================
-- 13. DATOS SEMILLA (SEED)
-- ===========================================

INSERT INTO hosix_almacenes (codigo, nombre, ubicacion, activo)
VALUES 
  ('ALMAC-001', 'Almacén Principal', 'Planta Sótano 1', true),
  ('ALMAC-002', 'Almacén Farmacia', 'Planta 2 - Sección A', true),
  ('ALMAC-003', 'Almacén Quirófanos', 'Planta 3 - Ala Norte', true)
ON CONFLICT DO NOTHING;

INSERT INTO hosix_almacenes_depositos (almacen_id, codigo, nombre, zona_almacenamiento, activo)
SELECT a.id, d.codigo, d.nombre, d.zona, true
FROM (VALUES 
  ('ALMAC-001', 'DEP-001', 'Depósito General A', 'A1'),
  ('ALMAC-001', 'DEP-002', 'Depósito General B', 'B1'),
  ('ALMAC-002', 'DEP-003', 'Depósito Medicamentos Refrigerados', 'R1'),
  ('ALMAC-002', 'DEP-004', 'Depósito Medicamentos Temperatura Ambiente', 'T1')
) AS d(almacen_codigo, codigo, nombre, zona)
JOIN hosix_almacenes a ON a.codigo = d.almacen_codigo
WHERE NOT EXISTS (
  SELECT 1 FROM hosix_almacenes_depositos 
  WHERE codigo = d.codigo
);

INSERT INTO hosix_centros_coste (codigo, nombre, descripcion, activo)
VALUES 
  ('CC-001', 'Quirófanos', 'Centro de coste de quirófanos', true),
  ('CC-002', 'Farmacia', 'Centro de coste de farmacia', true),
  ('CC-003', 'Urgencias', 'Centro de coste de urgencias', true),
  ('CC-004', 'Hospitalización', 'Centro de coste de hospitalización', true)
ON CONFLICT DO NOTHING;

INSERT INTO hosix_proveedores (codigo, nombre, ciudad, contacto, telefono, activo)
VALUES 
  ('PROV-001', 'Farmacos Internacionales S.A.', 'Malabo', 'Juan García', '+240-222-123456', true),
  ('PROV-002', 'Médica Central de Distribución', 'Bata', 'María López', '+240-333-654321', true),
  ('PROV-003', 'Suministros Hospitalarios Guinea', 'Malabo', 'Carlos Rodríguez', '+240-222-789012', true)
ON CONFLICT DO NOTHING;

-- ===========================================
-- FIN DE LA MIGRACIÓN
-- =========================================
