-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 007: Módulo de Recobros Completo
-- Fecha: 2025-01-21

-- ============================================================
-- 1. TABLAS DE RECOBROS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_recobros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_recobro VARCHAR(50) UNIQUE NOT NULL,
  factura_id UUID REFERENCES hosix_facturas(id) NOT NULL,
  
  motivo_recobro VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  monto_original DECIMAL(12,2) NOT NULL,
  monto_recobrado DECIMAL(12,2) DEFAULT 0,
  
  estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, en_proceso, parcial, completado, rechazado
  prioridad VARCHAR(50) DEFAULT 'media', -- baja, media, alta, urgente
  
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_cierre TIMESTAMPTZ,
  usuario_responsable_id UUID REFERENCES hosix_usuarios(id),
  
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_recobros_notas_cargo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_nota VARCHAR(50) UNIQUE NOT NULL,
  recobro_id UUID REFERENCES hosix_recobros(id),
  factura_id UUID REFERENCES hosix_facturas(id) NOT NULL,
  
  concepto VARCHAR(255) NOT NULL,
  descripcion TEXT,
  monto DECIMAL(12,2) NOT NULL,
  
  razon_cargo VARCHAR(255),
  documentos_adjuntos JSONB DEFAULT '[]',
  
  estado VARCHAR(50) DEFAULT 'emitida', -- emitida, aprobada, rechazada
  
  fecha_emision TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_aprovacion TIMESTAMPTZ,
  aprobado_por UUID REFERENCES hosix_usuarios(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_recobros_notas_credito (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_nota VARCHAR(50) UNIQUE NOT NULL,
  factura_id UUID REFERENCES hosix_facturas(id) NOT NULL,
  
  concepto VARCHAR(255) NOT NULL,
  descripcion TEXT,
  monto DECIMAL(12,2) NOT NULL,
  
  razon_credito VARCHAR(255),
  documentos_adjuntos JSONB DEFAULT '[]',
  
  estado VARCHAR(50) DEFAULT 'emitida', -- emitida, aprobada, rechazada, contabilizada
  
  fecha_emision TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_aprovacion TIMESTAMPTZ,
  aprobado_por UUID REFERENCES hosix_usuarios(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_recobros_solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_solicitud VARCHAR(50) UNIQUE NOT NULL,
  aseguradora_id UUID REFERENCES hosix_aseguradoras(id) NOT NULL,
  
  tipo_solicitud VARCHAR(50) NOT NULL, -- devolucion, aclaracion, denegacion
  descripcion TEXT NOT NULL,
  
  monto_solicitado DECIMAL(12,2),
  partidas JSONB DEFAULT '[]', -- [{factura_id, concepto, monto}]
  
  estado VARCHAR(50) DEFAULT 'abierta', -- abierta, en_respuesta, respondida, cerrada
  
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_vencimiento TIMESTAMPTZ,
  fecha_respuesta TIMESTAMPTZ,
  
  respuesta_aseguradora TEXT,
  documentos_respuesta JSONB DEFAULT '[]',
  
  usuario_responsable_id UUID REFERENCES hosix_usuarios(id),
  
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_recobros_morosidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id UUID REFERENCES hosix_facturacion_cuentas(id) NOT NULL,
  aseguradora_id UUID REFERENCES hosix_aseguradoras(id) NOT NULL,
  
  saldo_deudor DECIMAL(12,2) DEFAULT 0,
  dias_vencimiento INT DEFAULT 0,
  
  facturas_vencidas INT DEFAULT 0,
  total_facturas_vencidas DECIMAL(12,2) DEFAULT 0,
  
  historial_pagos JSONB DEFAULT '[]',
  
  status_cobranza VARCHAR(50) DEFAULT 'activo', -- activo, en_litigio, incobrable, pago_total
  
  acciones_cobranza JSONB DEFAULT '[]', -- [{tipo, fecha, resultado, usuario}]
  
  notas TEXT,
  
  fecha_ultimo_pago TIMESTAMPTZ,
  fecha_proximo_seguimiento TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cuenta_id)
);

-- ============================================================
-- 2. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_recobros_numero ON hosix_recobros(numero_recobro);
CREATE INDEX IF NOT EXISTS idx_recobros_factura ON hosix_recobros(factura_id);
CREATE INDEX IF NOT EXISTS idx_recobros_estado ON hosix_recobros(estado);
CREATE INDEX IF NOT EXISTS idx_recobros_prioridad ON hosix_recobros(prioridad);
CREATE INDEX IF NOT EXISTS idx_recobros_fecha ON hosix_recobros(fecha_solicitud);

CREATE INDEX IF NOT EXISTS idx_notas_cargo_numero ON hosix_recobros_notas_cargo(numero_nota);
CREATE INDEX IF NOT EXISTS idx_notas_cargo_recobro ON hosix_recobros_notas_cargo(recobro_id);
CREATE INDEX IF NOT EXISTS idx_notas_cargo_factura ON hosix_recobros_notas_cargo(factura_id);
CREATE INDEX IF NOT EXISTS idx_notas_cargo_estado ON hosix_recobros_notas_cargo(estado);

CREATE INDEX IF NOT EXISTS idx_notas_credito_numero ON hosix_recobros_notas_credito(numero_nota);
CREATE INDEX IF NOT EXISTS idx_notas_credito_factura ON hosix_recobros_notas_credito(factura_id);
CREATE INDEX IF NOT EXISTS idx_notas_credito_estado ON hosix_recobros_notas_credito(estado);

CREATE INDEX IF NOT EXISTS idx_solicitudes_numero ON hosix_recobros_solicitudes(numero_solicitud);
CREATE INDEX IF NOT EXISTS idx_solicitudes_aseguradora ON hosix_recobros_solicitudes(aseguradora_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON hosix_recobros_solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON hosix_recobros_solicitudes(fecha_solicitud);

CREATE INDEX IF NOT EXISTS idx_morosidad_cuenta ON hosix_recobros_morosidad(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_morosidad_aseguradora ON hosix_recobros_morosidad(aseguradora_id);
CREATE INDEX IF NOT EXISTS idx_morosidad_dias ON hosix_recobros_morosidad(dias_vencimiento);
CREATE INDEX IF NOT EXISTS idx_morosidad_status ON hosix_recobros_morosidad(status_cobranza);

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================

ALTER TABLE hosix_recobros ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_recobros_notas_cargo ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_recobros_notas_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_recobros_solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_recobros_morosidad ENABLE ROW LEVEL SECURITY;

-- Recobros - Lectura y escritura
CREATE POLICY "recobros_read_policy" ON hosix_recobros FOR SELECT USING (true);
CREATE POLICY "recobros_insert_policy" ON hosix_recobros FOR INSERT WITH CHECK (true);
CREATE POLICY "recobros_update_policy" ON hosix_recobros FOR UPDATE USING (true) WITH CHECK (true);

-- Notas de Cargo
CREATE POLICY "notas_cargo_read_policy" ON hosix_recobros_notas_cargo FOR SELECT USING (true);
CREATE POLICY "notas_cargo_insert_policy" ON hosix_recobros_notas_cargo FOR INSERT WITH CHECK (true);
CREATE POLICY "notas_cargo_update_policy" ON hosix_recobros_notas_cargo FOR UPDATE USING (true) WITH CHECK (true);

-- Notas de Crédito
CREATE POLICY "notas_credito_read_policy" ON hosix_recobros_notas_credito FOR SELECT USING (true);
CREATE POLICY "notas_credito_insert_policy" ON hosix_recobros_notas_credito FOR INSERT WITH CHECK (true);
CREATE POLICY "notas_credito_update_policy" ON hosix_recobros_notas_credito FOR UPDATE USING (true) WITH CHECK (true);

-- Solicitudes
CREATE POLICY "solicitudes_read_policy" ON hosix_recobros_solicitudes FOR SELECT USING (true);
CREATE POLICY "solicitudes_insert_policy" ON hosix_recobros_solicitudes FOR INSERT WITH CHECK (true);
CREATE POLICY "solicitudes_update_policy" ON hosix_recobros_solicitudes FOR UPDATE USING (true) WITH CHECK (true);

-- Morosidad
CREATE POLICY "morosidad_read_policy" ON hosix_recobros_morosidad FOR SELECT USING (true);
CREATE POLICY "morosidad_insert_policy" ON hosix_recobros_morosidad FOR INSERT WITH CHECK (true);
CREATE POLICY "morosidad_update_policy" ON hosix_recobros_morosidad FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- 4. DATOS DE PRUEBA
-- ============================================================

-- No hay datos de prueba iniciales para recobros (se generan dinámicamente)
