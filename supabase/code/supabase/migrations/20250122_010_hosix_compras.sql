-- =========================================
-- HOSIX - ADM 12.0: COMPRAS Y LICITACIONES
-- Fecha: 22 Enero 2025
-- Descripción: Gestión de presupuestos, licitaciones, ofertas y adjudicaciones
-- =========================================

-- ===========================================
-- 1. TABLA: PRESUPUESTOS
-- ===========================================

CREATE TABLE IF NOT EXISTS hosix_presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_presupuesto VARCHAR(50) UNIQUE NOT NULL,
  centro_coste_id UUID NOT NULL REFERENCES hosix_centros_coste(id),
  
  -- Período
  anio_presupuestario INT NOT NULL,
  
  -- Montos
  monto_total DECIMAL(14,2) NOT NULL,
  monto_utilizado DECIMAL(14,2) DEFAULT 0,
  monto_disponible DECIMAL(14,2) GENERATED ALWAYS AS (monto_total - monto_utilizado) STORED,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'activo', -- activo, suspendido, agotado
  
  -- Responsables
  responsable_id UUID REFERENCES profesionales_sanitarios(id),
  aprobado_por UUID REFERENCES auth.users(id),
  
  observaciones TEXT,
  
  -- Auditoría
  centro_salud_id UUID REFERENCES centros_salud(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hosix_presupuestos_centro ON hosix_presupuestos(centro_coste_id);
CREATE INDEX idx_hosix_presupuestos_anio ON hosix_presupuestos(anio_presupuestario);
CREATE INDEX idx_hosix_presupuestos_estado ON hosix_presupuestos(estado);

-- ===========================================
-- 2. TABLA: LICITACIONES
-- ===========================================

CREATE TABLE IF NOT EXISTS hosix_licitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_licitacion VARCHAR(50) UNIQUE NOT NULL,
  
  presupuesto_id UUID REFERENCES hosix_presupuestos(id),
  
  -- Descripción
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  -- Fechas
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_apertura DATE NOT NULL,
  fecha_cierre DATE NOT NULL,
  
  -- Montos
  presupuesto_estimado DECIMAL(14,2),
  presupuesto_maximo DECIMAL(14,2),
  
  -- Responsables
  responsable_licitacion_id UUID REFERENCES profesionales_sanitarios(id),
  comision_evaluadora JSONB DEFAULT '[]', -- Array de user_ids
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'borrador', -- borrador, publicada, evaluacion, adjudicada, cancelada
  
  observaciones TEXT,
  
  -- Auditoría
  centro_salud_id UUID REFERENCES centros_salud(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hosix_licitaciones_presupuesto ON hosix_licitaciones(presupuesto_id);
CREATE INDEX idx_hosix_licitaciones_estado ON hosix_licitaciones(estado);
CREATE INDEX idx_hosix_licitaciones_fecha_cierre ON hosix_licitaciones(fecha_cierre);

-- ===========================================
-- 3. TABLA: PARTIDAS DE LICITACIÓN
-- ===========================================

CREATE TABLE IF NOT EXISTS hosix_licitaciones_partidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  licitacion_id UUID NOT NULL REFERENCES hosix_licitaciones(id),
  
  numero_partida INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  -- Artículos
  articulo_id UUID REFERENCES hosix_articulos(id),
  
  -- Cantidad
  cantidad_solicitada DECIMAL(12,3) NOT NULL,
  unidad_medida VARCHAR(50),
  
  -- Presupuesto
  precio_unitario_estimado DECIMAL(12,4),
  presupuesto_partida DECIMAL(14,2) GENERATED ALWAYS AS (cantidad_solicitada * precio_unitario_estimado) STORED,
  
  -- Especificaciones técnicas
  especificaciones_tecnicas TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hosix_partidas_licitacion ON hosix_licitaciones_partidas(licitacion_id);
CREATE INDEX idx_hosix_partidas_articulo ON hosix_licitaciones_partidas(articulo_id);

-- ===========================================
-- 4. TABLA: OFERTAS DE PROVEEDORES
-- ===========================================

CREATE TABLE IF NOT EXISTS hosix_licitaciones_ofertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  licitacion_id UUID NOT NULL REFERENCES hosix_licitaciones(id),
  proveedor_id UUID NOT NULL REFERENCES hosix_proveedores(id),
  
  -- Información de la oferta
  numero_oferta VARCHAR(50) UNIQUE NOT NULL,
  fecha_presentacion TIMESTAMPTZ NOT NULL,
  
  -- Montos
  monto_total DECIMAL(14,2) NOT NULL,
  tiene_descuento BOOLEAN DEFAULT false,
  descuento_porcentaje DECIMAL(5,2),
  monto_final DECIMAL(14,2),
  
  -- Documentación
  archivo_oferta VARCHAR(255), -- path en storage
  certificaciones JSONB DEFAULT '[]', -- Array de certificaciones
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'presentada', -- presentada, evaluada, aceptada, rechazada
  
  -- Evaluación
  puntuacion_tecnica DECIMAL(5,2),
  puntuacion_precio DECIMAL(5,2),
  puntuacion_total DECIMAL(5,2) GENERATED ALWAYS AS (puntuacion_tecnica + puntuacion_precio) STORED,
  
  observaciones_evaluacion TEXT,
  evaluado_por UUID REFERENCES auth.users(id),
  fecha_evaluacion TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hosix_ofertas_licitacion ON hosix_licitaciones_ofertas(licitacion_id);
CREATE INDEX idx_hosix_ofertas_proveedor ON hosix_licitaciones_ofertas(proveedor_id);
CREATE INDEX idx_hosix_ofertas_estado ON hosix_licitaciones_ofertas(estado);
CREATE INDEX idx_hosix_ofertas_puntuacion ON hosix_licitaciones_ofertas(puntuacion_total);

-- ===========================================
-- 5. TABLA: ADJUDICACIONES
-- ===========================================

CREATE TABLE IF NOT EXISTS hosix_adjudicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_adjudicacion VARCHAR(50) UNIQUE NOT NULL,
  licitacion_id UUID NOT NULL REFERENCES hosix_licitaciones(id),
  oferta_adjudicada_id UUID NOT NULL REFERENCES hosix_licitaciones_ofertas(id),
  proveedor_adjudicado_id UUID NOT NULL REFERENCES hosix_proveedores(id),
  
  -- Fechas
  fecha_adjudicacion TIMESTAMPTZ DEFAULT now(),
  fecha_notificacion DATE,
  
  -- Montos
  monto_adjudicado DECIMAL(14,2) NOT NULL,
  
  -- Detalles
  plazo_entrega_dias INT,
  forma_pago VARCHAR(100),
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'adjudicada', -- adjudicada, cancelada, en_ejecucion, completada
  
  -- Responsables
  aprobado_por UUID REFERENCES auth.users(id),
  supervisor_id UUID REFERENCES profesionales_sanitarios(id),
  
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hosix_adjudicaciones_licitacion ON hosix_adjudicaciones(licitacion_id);
CREATE INDEX idx_hosix_adjudicaciones_proveedor ON hosix_adjudicaciones(proveedor_adjudicado_id);
CREATE INDEX idx_hosix_adjudicaciones_estado ON hosix_adjudicaciones(estado);

-- ===========================================
-- 6. POLÍTICAS DE SEGURIDAD (RLS)
-- ===========================================

ALTER TABLE hosix_presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_licitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_licitaciones_partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_licitaciones_ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_adjudicaciones ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Presupuestos
CREATE POLICY "hosix_presupuestos_select" ON hosix_presupuestos
  FOR SELECT USING (
    centro_salud_id = (SELECT centro_salud_id FROM profesionales_sanitarios WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "hosix_presupuestos_insert" ON hosix_presupuestos
  FOR INSERT WITH CHECK (
    centro_salud_id = (SELECT centro_salud_id FROM profesionales_sanitarios WHERE auth_user_id = auth.uid())
  );

-- RLS Policy: Licitaciones
CREATE POLICY "hosix_licitaciones_select" ON hosix_licitaciones
  FOR SELECT USING (
    centro_salud_id = (SELECT centro_salud_id FROM profesionales_sanitarios WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "hosix_licitaciones_insert" ON hosix_licitaciones
  FOR INSERT WITH CHECK (
    centro_salud_id = (SELECT centro_salud_id FROM profesionales_sanitarios WHERE auth_user_id = auth.uid())
  );

-- RLS Policy: Partidas
CREATE POLICY "hosix_partidas_select" ON hosix_licitaciones_partidas
  FOR SELECT USING (
    licitacion_id IN (
      SELECT id FROM hosix_licitaciones 
      WHERE centro_salud_id = (SELECT centro_salud_id FROM profesionales_sanitarios WHERE auth_user_id = auth.uid())
    )
  );

-- RLS Policy: Ofertas
CREATE POLICY "hosix_ofertas_select" ON hosix_licitaciones_ofertas
  FOR SELECT USING (
    licitacion_id IN (
      SELECT id FROM hosix_licitaciones 
      WHERE centro_salud_id = (SELECT centro_salud_id FROM profesionales_sanitarios WHERE auth_user_id = auth.uid())
    )
  );

-- RLS Policy: Adjudicaciones
CREATE POLICY "hosix_adjudicaciones_select" ON hosix_adjudicaciones
  FOR SELECT USING (
    licitacion_id IN (
      SELECT id FROM hosix_licitaciones 
      WHERE centro_salud_id = (SELECT centro_salud_id FROM profesionales_sanitarios WHERE auth_user_id = auth.uid())
    )
  );

-- ===========================================
-- 7. DATOS SEMILLA
-- ===========================================

-- Presupuestos por centro de coste
INSERT INTO hosix_presupuestos (numero_presupuesto, centro_coste_id, anio_presupuestario, monto_total, estado)
SELECT 
  'PRES-2025-' || ROW_NUMBER() OVER (ORDER BY cc.id),
  cc.id,
  2025,
  CASE 
    WHEN cc.codigo = 'CC-001' THEN 50000.00  -- Quirófanos
    WHEN cc.codigo = 'CC-002' THEN 30000.00  -- Farmacia
    WHEN cc.codigo = 'CC-003' THEN 20000.00  -- Urgencias
    WHEN cc.codigo = 'CC-004' THEN 40000.00  -- Hospitalización
    ELSE 25000.00
  END,
  'activo'
FROM hosix_centros_coste cc
WHERE NOT EXISTS (
  SELECT 1 FROM hosix_presupuestos p 
  WHERE p.centro_coste_id = cc.id AND p.anio_presupuestario = 2025
);

-- ===========================================
-- FIN DE LA MIGRACIÓN
-- =========================================
