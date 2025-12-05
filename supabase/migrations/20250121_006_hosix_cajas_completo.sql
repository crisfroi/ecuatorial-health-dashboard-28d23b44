-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 006: Módulo de Cajas Completo
-- Fecha: 2025-01-21

-- ============================================================
-- 1. TABLAS DE CAJAS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_cajas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  ubicacion VARCHAR(255),
  responsable_id UUID REFERENCES hosix_usuarios(id),
  
  saldo_inicial DECIMAL(12,2) DEFAULT 0,
  saldo_actual DECIMAL(12,2) DEFAULT 0,
  
  estado VARCHAR(50) DEFAULT 'abierta', -- abierta, cerrada, mantenimiento
  activo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_cajas_turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id UUID REFERENCES hosix_cajas(id) NOT NULL,
  usuario_id UUID REFERENCES hosix_usuarios(id) NOT NULL,
  
  numero_turno VARCHAR(50) UNIQUE NOT NULL,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_cierre TIMESTAMPTZ,
  
  saldo_apertura DECIMAL(12,2) NOT NULL,
  saldo_cierre DECIMAL(12,2),
  
  total_cobros DECIMAL(12,2) DEFAULT 0,
  total_pagos DECIMAL(12,2) DEFAULT 0,
  
  observaciones TEXT,
  estado VARCHAR(50) DEFAULT 'abierto', -- abierto, cerrado
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_cajas_formas_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  requiere_referencia BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla actualizada: agregar referencia a turno
ALTER TABLE hosix_cajas_movimientos 
ADD COLUMN IF NOT EXISTS turno_id UUID REFERENCES hosix_cajas_turnos(id),
ADD COLUMN IF NOT EXISTS forma_pago_id UUID REFERENCES hosix_cajas_formas_pago(id),
ADD COLUMN IF NOT EXISTS referencia_pago VARCHAR(100),
ADD COLUMN IF NOT EXISTS caja_id UUID REFERENCES hosix_cajas(id),
ADD COLUMN IF NOT EXISTS usuario_responsable_id UUID REFERENCES hosix_usuarios(id);

-- Recrear tabla de movimientos si es necesario (drop y recreate para integridad)
-- Se mantiene como está para compatibilidad

CREATE TABLE IF NOT EXISTS hosix_cajas_cierres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id UUID REFERENCES hosix_cajas(id) NOT NULL,
  turno_id UUID REFERENCES hosix_cajas_turnos(id),
  
  fecha_cierre TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario_responsable_id UUID REFERENCES hosix_usuarios(id) NOT NULL,
  
  saldo_apertura DECIMAL(12,2) NOT NULL,
  total_cobros DECIMAL(12,2) DEFAULT 0,
  total_pagos DECIMAL(12,2) DEFAULT 0,
  saldo_teorico DECIMAL(12,2),
  saldo_real DECIMAL(12,2),
  
  diferencia DECIMAL(12,2),
  estado VARCHAR(50) DEFAULT 'pendiente_cuadre', -- pendiente_cuadre, cuadrado, descuadre_reportado
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_cajas_arqueos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id UUID REFERENCES hosix_cajas(id) NOT NULL,
  
  fecha_arqueo TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario_responsable_id UUID REFERENCES hosix_usuarios(id) NOT NULL,
  
  -- Efectivo
  billetes_100 DECIMAL(10,2) DEFAULT 0,
  billetes_50 DECIMAL(10,2) DEFAULT 0,
  billetes_20 DECIMAL(10,2) DEFAULT 0,
  billetes_10 DECIMAL(10,2) DEFAULT 0,
  billetes_5 DECIMAL(10,2) DEFAULT 0,
  billetes_1 DECIMAL(10,2) DEFAULT 0,
  
  monedas_1 DECIMAL(10,2) DEFAULT 0,
  monedas_otros DECIMAL(10,2) DEFAULT 0,
  
  total_efectivo DECIMAL(12,2),
  
  -- Documentos
  cheques_cantidad INT DEFAULT 0,
  cheques_monto DECIMAL(12,2) DEFAULT 0,
  
  -- Formas electrónicas
  tarjetas_cantidad INT DEFAULT 0,
  tarjetas_monto DECIMAL(12,2) DEFAULT 0,
  
  -- Totales
  total_arqueo DECIMAL(12,2),
  saldo_esperado DECIMAL(12,2),
  diferencia DECIMAL(12,2),
  
  observaciones TEXT,
  aprobado_por UUID REFERENCES hosix_usuarios(id),
  estado VARCHAR(50) DEFAULT 'borrador', -- borrador, presentado, aprobado, rechazado
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_cajas_codigo ON hosix_cajas(codigo);
CREATE INDEX IF NOT EXISTS idx_cajas_estado ON hosix_cajas(estado);
CREATE INDEX IF NOT EXISTS idx_cajas_responsable ON hosix_cajas(responsable_id);

CREATE INDEX IF NOT EXISTS idx_turnos_caja ON hosix_cajas_turnos(caja_id);
CREATE INDEX IF NOT EXISTS idx_turnos_usuario ON hosix_cajas_turnos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON hosix_cajas_turnos(estado);
CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON hosix_cajas_turnos(fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_formas_pago_codigo ON hosix_cajas_formas_pago(codigo);

CREATE INDEX IF NOT EXISTS idx_cierres_caja ON hosix_cajas_cierres(caja_id);
CREATE INDEX IF NOT EXISTS idx_cierres_turno ON hosix_cajas_cierres(turno_id);
CREATE INDEX IF NOT EXISTS idx_cierres_fecha ON hosix_cajas_cierres(fecha_cierre);

CREATE INDEX IF NOT EXISTS idx_arqueos_caja ON hosix_cajas_arqueos(caja_id);
CREATE INDEX IF NOT EXISTS idx_arqueos_fecha ON hosix_cajas_arqueos(fecha_arqueo);
CREATE INDEX IF NOT EXISTS idx_arqueos_estado ON hosix_cajas_arqueos(estado);

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================

ALTER TABLE hosix_cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cajas_turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cajas_formas_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cajas_cierres ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cajas_arqueos ENABLE ROW LEVEL SECURITY;

-- Cajas - Lectura y escritura
CREATE POLICY "cajas_read_policy" ON hosix_cajas FOR SELECT USING (true);
CREATE POLICY "cajas_insert_policy" ON hosix_cajas FOR INSERT WITH CHECK (true);
CREATE POLICY "cajas_update_policy" ON hosix_cajas FOR UPDATE USING (true) WITH CHECK (true);

-- Turnos - Lectura y escritura
CREATE POLICY "turnos_read_policy" ON hosix_cajas_turnos FOR SELECT USING (true);
CREATE POLICY "turnos_insert_policy" ON hosix_cajas_turnos FOR INSERT WITH CHECK (true);
CREATE POLICY "turnos_update_policy" ON hosix_cajas_turnos FOR UPDATE USING (true) WITH CHECK (true);

-- Formas de pago
CREATE POLICY "formas_pago_read_policy" ON hosix_cajas_formas_pago FOR SELECT USING (true);
CREATE POLICY "formas_pago_insert_policy" ON hosix_cajas_formas_pago FOR INSERT WITH CHECK (true);

-- Cierres
CREATE POLICY "cierres_read_policy" ON hosix_cajas_cierres FOR SELECT USING (true);
CREATE POLICY "cierres_insert_policy" ON hosix_cajas_cierres FOR INSERT WITH CHECK (true);
CREATE POLICY "cierres_update_policy" ON hosix_cajas_cierres FOR UPDATE USING (true) WITH CHECK (true);

-- Arqueos
CREATE POLICY "arqueos_read_policy" ON hosix_cajas_arqueos FOR SELECT USING (true);
CREATE POLICY "arqueos_insert_policy" ON hosix_cajas_arqueos FOR INSERT WITH CHECK (true);
CREATE POLICY "arqueos_update_policy" ON hosix_cajas_arqueos FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- 4. DATOS DE PRUEBA
-- ============================================================

-- Insertar formas de pago
INSERT INTO hosix_cajas_formas_pago (codigo, nombre, descripcion, requiere_referencia) VALUES
('EFECTIVO', 'Efectivo', 'Pago en efectivo', false),
('TARJETA_CREDITO', 'Tarjeta de Crédito', 'Pago con tarjeta de crédito', true),
('TARJETA_DEBITO', 'Tarjeta de Débito', 'Pago con tarjeta de débito', true),
('CHEQUE', 'Cheque', 'Pago con cheque bancario', true),
('TRANSFERENCIA', 'Transferencia Bancaria', 'Pago por transferencia bancaria', true),
('MIXTO', 'Pago Mixto', 'Combinación de formas de pago', false)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar cajas de prueba
INSERT INTO hosix_cajas (codigo, nombre, descripcion, ubicacion, estado, activo) VALUES
('CAJA_001', 'Caja Principal', 'Caja principal del hospital', 'Recepción Principal', 'abierta', true),
('CAJA_002', 'Caja Farmacia', 'Caja de farmacia', 'Farmacia', 'abierta', true),
('CAJA_003', 'Caja Urgencias', 'Caja de urgencias', 'Departamento de Urgencias', 'abierta', true)
ON CONFLICT (codigo) DO NOTHING;
