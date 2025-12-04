-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 005: Facturación, Reportes y Business Intelligence
-- Fecha: 2025-01-16

-- ============================================================
-- 1. MÓDULO DE FACTURACIÓN
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_aseguradoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50),
  direccion TEXT,
  telefono VARCHAR(50),
  email VARCHAR(255),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_tarifas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aseguradora_id UUID REFERENCES hosix_aseguradoras(id),
  codigo_concepto VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  vigente_desde DATE NOT NULL,
  vigente_hasta DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_facturacion_cuentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  aseguradora_id UUID REFERENCES hosix_aseguradoras(id),
  
  numero_cuenta VARCHAR(50) UNIQUE NOT NULL,
  estado VARCHAR(50) DEFAULT 'abierta',
  
  fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_cierre TIMESTAMPTZ,
  
  total_facturado DECIMAL(12,2) DEFAULT 0,
  total_pagado DECIMAL(12,2) DEFAULT 0,
  saldo_pendiente DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_facturacion_conceptos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  tipo_concepto VARCHAR(50),
  precio_base DECIMAL(12,2),
  requiere_autorizar BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_factura VARCHAR(50) UNIQUE NOT NULL,
  cuenta_id UUID REFERENCES hosix_facturacion_cuentas(id) NOT NULL,
  
  fecha_emision TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_vencimiento DATE,
  
  subtotal DECIMAL(12,2) NOT NULL,
  impuesto DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  
  estado VARCHAR(50) DEFAULT 'emitida',
  concepto_rechazo TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_facturas_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID REFERENCES hosix_facturas(id) NOT NULL,
  
  concepto_id UUID REFERENCES hosix_facturacion_conceptos(id),
  concepto_texto VARCHAR(255),
  cantidad DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_cajas_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_movimiento VARCHAR(50) UNIQUE NOT NULL,
  
  factura_id UUID REFERENCES hosix_facturas(id),
  tipo_movimiento VARCHAR(50) NOT NULL,
  forma_pago VARCHAR(50),
  
  monto DECIMAL(12,2) NOT NULL,
  usuario_id UUID REFERENCES hosix_usuarios(id),
  
  fecha_movimiento TIMESTAMPTZ NOT NULL DEFAULT now(),
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. MÓDULO DE STOCK Y SUMINISTROS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_stock_medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicamento_id UUID REFERENCES hosix_medicamentos(id) NOT NULL,
  
  cantidad_disponible DECIMAL(10,2) NOT NULL DEFAULT 0,
  cantidad_minima DECIMAL(10,2) DEFAULT 0,
  cantidad_maxima DECIMAL(10,2) DEFAULT 0,
  
  lote_actual VARCHAR(100),
  fecha_caducidad DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(medicamento_id)
);

CREATE TABLE IF NOT EXISTS hosix_stock_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicamento_id UUID REFERENCES hosix_medicamentos(id) NOT NULL,
  
  tipo_movimiento VARCHAR(50) NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  cantidad_anterior DECIMAL(10,2),
  cantidad_nueva DECIMAL(10,2),
  
  referencia_documento VARCHAR(100),
  usuario_id UUID REFERENCES hosix_usuarios(id),
  
  fecha_movimiento TIMESTAMPTZ NOT NULL DEFAULT now(),
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. MÓDULO DE REPORTES / BI
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_kpis_reportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificadores
  tipo_reporte VARCHAR(100) NOT NULL,
  fecha_reporte DATE NOT NULL DEFAULT CURRENT_DATE,
  periodo VARCHAR(50),
  
  -- Métricas
  total_pacientes INT DEFAULT 0,
  total_citas INT DEFAULT 0,
  total_urgencias INT DEFAULT 0,
  total_hospitalizaciones INT DEFAULT 0,
  total_cirugias INT DEFAULT 0,
  
  ocupacion_camas DECIMAL(5,2) DEFAULT 0,
  estancia_promedio DECIMAL(5,2) DEFAULT 0,
  
  facturacion_total DECIMAL(12,2) DEFAULT 0,
  facturacion_cobrada DECIMAL(12,2) DEFAULT 0,
  facturacion_pendiente DECIMAL(12,2) DEFAULT 0,
  
  datos_adicionales JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_aseguradoras_codigo ON hosix_aseguradoras(codigo);
CREATE INDEX IF NOT EXISTS idx_tarifas_aseguradora ON hosix_tarifas(aseguradora_id);
CREATE INDEX IF NOT EXISTS idx_tarifas_concepto ON hosix_tarifas(codigo_concepto);

CREATE INDEX IF NOT EXISTS idx_cuentas_paciente ON hosix_facturacion_cuentas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_numero ON hosix_facturacion_cuentas(numero_cuenta);
CREATE INDEX IF NOT EXISTS idx_cuentas_estado ON hosix_facturacion_cuentas(estado);

CREATE INDEX IF NOT EXISTS idx_facturas_numero ON hosix_facturas(numero_factura);
CREATE INDEX IF NOT EXISTS idx_facturas_cuenta ON hosix_facturas(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON hosix_facturas(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON hosix_facturas(estado);

CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON hosix_cajas_movimientos(tipo_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON hosix_cajas_movimientos(fecha_movimiento);

CREATE INDEX IF NOT EXISTS idx_stock_medicamento ON hosix_stock_medicamentos(medicamento_id);
CREATE INDEX IF NOT EXISTS idx_stock_movimientos_medicamento ON hosix_stock_movimientos(medicamento_id);
CREATE INDEX IF NOT EXISTS idx_stock_movimientos_fecha ON hosix_stock_movimientos(fecha_movimiento);

CREATE INDEX IF NOT EXISTS idx_kpis_fecha ON hosix_kpis_reportes(fecha_reporte);
CREATE INDEX IF NOT EXISTS idx_kpis_tipo ON hosix_kpis_reportes(tipo_reporte);

-- ============================================================
-- 5. RLS POLICIES
-- ============================================================

ALTER TABLE hosix_aseguradoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_tarifas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_facturacion_cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_facturacion_conceptos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_facturas_lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cajas_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_stock_medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_stock_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_kpis_reportes ENABLE ROW LEVEL SECURITY;

-- Facturación - Lectura y escritura
CREATE POLICY "aseguradoras_read_policy" ON hosix_aseguradoras FOR SELECT USING (activo = true OR true);
CREATE POLICY "cuentas_read_policy" ON hosix_facturacion_cuentas FOR SELECT USING (true);
CREATE POLICY "cuentas_insert_policy" ON hosix_facturacion_cuentas FOR INSERT WITH CHECK (true);
CREATE POLICY "facturas_read_policy" ON hosix_facturas FOR SELECT USING (true);
CREATE POLICY "facturas_insert_policy" ON hosix_facturas FOR INSERT WITH CHECK (true);

-- Stock
CREATE POLICY "stock_read_policy" ON hosix_stock_medicamentos FOR SELECT USING (true);
CREATE POLICY "stock_movimientos_read_policy" ON hosix_stock_movimientos FOR SELECT USING (true);
CREATE POLICY "stock_movimientos_insert_policy" ON hosix_stock_movimientos FOR INSERT WITH CHECK (true);

-- Reportes
CREATE POLICY "kpis_read_policy" ON hosix_kpis_reportes FOR SELECT USING (true);
CREATE POLICY "kpis_insert_policy" ON hosix_kpis_reportes FOR INSERT WITH CHECK (true);

-- ============================================================
-- 6. DATOS DE PRUEBA
-- ============================================================

-- Insertar aseguradoras de prueba
INSERT INTO hosix_aseguradoras (codigo, nombre, tipo, activo) VALUES
('IESS', 'Instituto Ecuatoriano de Seguridad Social', 'publica', true),
('SALUD_PRI', 'Seguros de Salud Privados', 'privada', true),
('DIRCOSS', 'Dirección de Coordinación de Seguridad Social', 'publica', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar conceptos facturables de prueba
INSERT INTO hosix_facturacion_conceptos (codigo, descripcion, tipo_concepto, precio_base, activo) VALUES
('CONS_MED', 'Consulta Médica', 'servicio', 50.00, true),
('ESTANCIA_DIA', 'Estancia Hospitalaria por Día', 'servicio', 100.00, true),
('CIRUGIA_MAYOR', 'Cirugía Mayor', 'procedimiento', 500.00, true),
('LABORATORIO', 'Servicio de Laboratorio', 'servicio', 30.00, true),
('RADIOLOGIA', 'Servicio de Radiología', 'servicio', 75.00, true)
ON CONFLICT (codigo) DO NOTHING;
