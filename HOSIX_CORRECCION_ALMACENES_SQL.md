# CORRECCIÓN: Error 42P17 en Migración de Almacenes

## Problema
```
ERROR: 42P17: generation expression is not immutable
```

## Causa
En `supabase/migrations/20250122_009_hosix_almacenes.sql`, líneas 171-173:
```sql
dias_para_vencer INT GENERATED ALWAYS AS (
  EXTRACT(DAY FROM (fecha_vencimiento - CURRENT_DATE))::INT
) STORED,
```

`CURRENT_DATE` es una función **no inmutable** (cambia cada día), por lo que PostgreSQL no permite usarla en columnas `GENERATED ALWAYS AS ... STORED`.

## Solución

### Opción 1: Ejecutar corrección en Supabase SQL Editor

Ir a Supabase Dashboard → SQL Editor y ejecutar:

```sql
-- ============================================
-- CORRECCIÓN: ADM 11.0 - HOSIX ALMACENES
-- ============================================
-- Eliminar la tabla con la columna problemática
DROP TABLE IF EXISTS hosix_stock_lotes CASCADE;

-- Recrear tabla SIN columna generada
CREATE TABLE IF NOT EXISTS hosix_stock_lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID REFERENCES hosix_stock(id) NOT NULL,
  
  numero_lote VARCHAR(100) NOT NULL,
  cantidad_lote DECIMAL(15,2) NOT NULL,
  
  -- Caducidad (FIFO) - dias_para_vencer se calcula en consultas
  fecha_vencimiento DATE,
  
  -- Control
  activo BOOLEAN DEFAULT true,
  fecha_entrada TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(stock_id, numero_lote),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vista para calcular días para vencer dinámicamente
CREATE OR REPLACE VIEW hosix_stock_lotes_view AS
SELECT 
  id,
  stock_id,
  numero_lote,
  cantidad_lote,
  fecha_vencimiento,
  (fecha_vencimiento - CURRENT_DATE) AS dias_para_vencer,
  activo,
  fecha_entrada,
  created_at,
  updated_at
FROM hosix_stock_lotes;

-- RLS para la tabla
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

COMMENT ON VIEW hosix_stock_lotes_view IS 'Vista con cálculo dinámico de días para vencer. Usar esta vista para obtener dias_para_vencer actualizado.';
```

### Opción 2: Si la tabla original no existe todavía

Modificar el archivo de migración localmente antes de aplicar:

```sql
-- ANTES (INCORRECTO):
dias_para_vencer INT GENERATED ALWAYS AS (
  EXTRACT(DAY FROM (fecha_vencimiento - CURRENT_DATE))::INT
) STORED,

-- DESPUÉS (CORRECTO):
-- Eliminar la columna generada, calcular en queries
```

## Uso en el código

En lugar de acceder a `hosix_stock_lotes.dias_para_vencer`, usar:

```typescript
// En queries de Supabase
const { data } = await supabase
  .from('hosix_stock_lotes_view')  // Usar la vista
  .select('*')
  .order('dias_para_vencer', { ascending: true });

// O calcular en el frontend
const diasParaVencer = (lote) => {
  if (!lote.fecha_vencimiento) return null;
  const hoy = new Date();
  const vencimiento = new Date(lote.fecha_vencimiento);
  const diffTime = vencimiento.getTime() - hoy.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
```

## Estado
- [ ] Pendiente de aplicar corrección
- [ ] Verificar que las demás tablas de la migración se crearon correctamente
