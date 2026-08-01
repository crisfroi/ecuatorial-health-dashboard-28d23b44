# Migraciones SQL: Tarifación Dinámica Centralizada (RENAPROSA ↔ HOSIX)

## Resumen Ejecutivo

Este documento describe las migraciones SQL necesarias para implementar un sistema de tarifación dinámica centralizado donde:
- **RENAPROSA** (SERMED2) = Fuente única de verdad para conceptos maestros y reglas
- **HOSIX** (HOSIX-GEPROSALUD) = Consumidor de conceptos y reglas, productor de variables locales

---

## 🏗️ PARTE 1: MIGRACIONES EN RENAPROSA (SERMED2)

### Migración 1.1: Crear tabla `renaprosa_conceptos_maestro`

**Archivo:** `supabase/migrations/20260625_001_renaprosa_conceptos_maestro.sql`

```sql
-- Conceptos maestros: Servicios, procedimientos, materiales, etc.
-- Fuente única de verdad para todos los nodos HOSIX
CREATE TABLE IF NOT EXISTS public.renaprosa_conceptos_maestro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  tipo_concepto VARCHAR(50) NOT NULL, -- servicio, procedimiento, medicamento, material, transporte, otro
  precio_base DECIMAL(12, 2) NOT NULL,
  usa_tarifacion_dinamica BOOLEAN DEFAULT false,
  visible_aseguradoras BOOLEAN DEFAULT true,
  snomed_code VARCHAR(50), -- Código SNOMED CT para interoperabilidad
  cpt_code VARCHAR(50), -- Código CPT para facturación
  nota TEXT,
  activo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda y filtrado
CREATE INDEX IF NOT EXISTS idx_conceptos_maestro_codigo ON public.renaprosa_conceptos_maestro(codigo);
CREATE INDEX IF NOT EXISTS idx_conceptos_maestro_tipo ON public.renaprosa_conceptos_maestro(tipo_concepto);
CREATE INDEX IF NOT EXISTS idx_conceptos_maestro_activo ON public.renaprosa_conceptos_maestro(activo);
CREATE INDEX IF NOT EXISTS idx_conceptos_maestro_tarifacion_dinamica ON public.renaprosa_conceptos_maestro(usa_tarifacion_dinamica);

-- RLS: Solo admin_renaprosa puede crear/actualizar
ALTER TABLE public.renaprosa_conceptos_maestro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin RENAPROSA: Crud completo" ON public.renaprosa_conceptos_maestro
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin_renaprosa')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin_renaprosa');

CREATE POLICY "Lectura pública para HOSIX" ON public.renaprosa_conceptos_maestro
  FOR SELECT USING (true);

-- Seed de datos de ejemplo
INSERT INTO public.renaprosa_conceptos_maestro (codigo, descripcion, tipo_concepto, precio_base, usa_tarifacion_dinamica, visible_aseguradoras, activo) VALUES
  ('CONS-MED', 'Consulta Médica', 'servicio', 50.00, false, true, true),
  ('CIRUGIA-MAY', 'Cirugía Mayor', 'procedimiento', 500.00, true, true, true),
  ('ESTANCIA-DIA', 'Estancia Hospitalaria por Día', 'servicio', 100.00, true, true, true),
  ('LABORATORIO', 'Servicio de Laboratorio', 'servicio', 30.00, false, true, true),
  ('RADIOLOGIA', 'Servicio de Radiología', 'servicio', 75.00, true, true, true)
ON CONFLICT (codigo) DO NOTHING;
```

---

### Migración 1.2: Crear tabla `renaprosa_reglas_tarifacion`

**Archivo:** `supabase/migrations/20260625_002_renaprosa_reglas_tarifacion.sql`

```sql
-- Reglas de tarifación dinámica
-- Permiten calcular precios en función de múltiples parámetros
CREATE TABLE IF NOT EXISTS public.renaprosa_reglas_tarifacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concepto_id UUID NOT NULL REFERENCES public.renaprosa_conceptos_maestro(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL, -- Nombre descriptivo de la regla
  tipo_regla VARCHAR(50) NOT NULL, -- edad, embarazo, beneficio, urgencia, horario, complejidad, aseguradora, temporal, otra
  condicion_json JSONB NOT NULL, -- Condiciones en formato JSON
  tipo_aplicacion VARCHAR(50) NOT NULL, -- porcentaje, monto_fijo, multiplicador, precio_directo
  valor_aplicacion DECIMAL(12, 2) NOT NULL, -- El valor a aplicar
  orden_aplicacion INTEGER NOT NULL DEFAULT 1, -- Orden de ejecución
  permitir_acumulacion BOOLEAN DEFAULT true, -- Puede combinarse con otras reglas
  es_descuento BOOLEAN DEFAULT false, -- Es una reducción de precio
  precio_minimo DECIMAL(12, 2), -- Límite mínimo de precio después de la regla
  precio_maximo DECIMAL(12, 2), -- Límite máximo de precio después de la regla
  requiere_aprobacion BOOLEAN DEFAULT false, -- Requiere confirmación antes de aplicar
  activo BOOLEAN DEFAULT true,
  nota TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda y filtrado
CREATE INDEX IF NOT EXISTS idx_reglas_concepto ON public.renaprosa_reglas_tarifacion(concepto_id);
CREATE INDEX IF NOT EXISTS idx_reglas_tipo ON public.renaprosa_reglas_tarifacion(tipo_regla);
CREATE INDEX IF NOT EXISTS idx_reglas_orden ON public.renaprosa_reglas_tarifacion(orden_aplicacion);
CREATE INDEX IF NOT EXISTS idx_reglas_activo ON public.renaprosa_reglas_tarifacion(activo);

-- Vista: Reglas por concepto (útil para querys)
CREATE OR REPLACE VIEW public.vw_reglas_tarifacion_por_concepto AS
SELECT 
  rc.id as concepto_id,
  rc.codigo,
  rc.descripcion as concepto,
  rr.id as regla_id,
  rr.nombre,
  rr.tipo_regla,
  rr.tipo_aplicacion,
  rr.valor_aplicacion,
  rr.orden_aplicacion,
  rr.activo
FROM public.renaprosa_conceptos_maestro rc
LEFT JOIN public.renaprosa_reglas_tarifacion rr ON rc.id = rr.concepto_id
WHERE rc.activo = true AND (rr.activo = true OR rr.id IS NULL)
ORDER BY rc.codigo, rr.orden_aplicacion;

-- RLS: Solo admin_renaprosa puede crear/actualizar
ALTER TABLE public.renaprosa_reglas_tarifacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin RENAPROSA: Crud completo" ON public.renaprosa_reglas_tarifacion
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin_renaprosa')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin_renaprosa');

CREATE POLICY "Lectura pública para HOSIX" ON public.renaprosa_reglas_tarifacion
  FOR SELECT USING (true);

-- Seed de datos de ejemplo
INSERT INTO public.renaprosa_reglas_tarifacion (concepto_id, nombre, tipo_regla, condicion_json, tipo_aplicacion, valor_aplicacion, orden_aplicacion, es_descuento, activo) 
SELECT 
  id, 
  'Descuento Menores de 5 años', 
  'edad', 
  '{"edad_minima": 0, "edad_maxima": 5}'::jsonb,
  'porcentaje',
  -20,
  1,
  true,
  true
FROM public.renaprosa_conceptos_maestro 
WHERE codigo = 'CONS-MED'
LIMIT 1;
```

---

### Migración 1.3: Crear tabla de sincronización `renaprosa_sync_log`

**Archivo:** `supabase/migrations/20260625_003_renaprosa_sync_log.sql`

```sql
-- Registro de sincronización entre nodos
-- Útil para auditoría y control de cambios
CREATE TABLE IF NOT EXISTS public.renaprosa_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nodo_destino VARCHAR(50) NOT NULL, -- Nombre del nodo HOSIX (ej: HOSIX-QUITO, HOSIX-CUENCA)
  tabla_origen VARCHAR(100) NOT NULL, -- Tabla sincronizada (renaprosa_conceptos_maestro, renaprosa_reglas_tarifacion)
  registros_afectados INTEGER NOT NULL,
  tipo_sincronizacion VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE, FULL_SYNC
  estado VARCHAR(50) NOT NULL DEFAULT 'pendiente', -- pendiente, en_progreso, completado, error
  mensaje_error TEXT,
  fecha_sincronizacion TIMESTAMPTZ NOT NULL,
  fecha_completacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sync_log_nodo ON public.renaprosa_sync_log(nodo_destino);
CREATE INDEX IF NOT EXISTS idx_sync_log_estado ON public.renaprosa_sync_log(estado);
CREATE INDEX IF NOT EXISTS idx_sync_log_fecha ON public.renaprosa_sync_log(fecha_sincronizacion);

-- RLS: Solo admin puede ver
ALTER TABLE public.renaprosa_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: Lectura de logs" ON public.renaprosa_sync_log
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin_renaprosa', 'admin'));
```

---

## 🏥 PARTE 2: MIGRACIONES EN HOSIX (HOSIX-GEPROSALUD)

### Migración 2.1: Crear tabla de replicación `hosix_conceptos_maestro` (REPLICA)

**Archivo:** `supabase/migrations/20260625_001_hosix_replica_conceptos_maestro.sql`

```sql
-- Réplica local de conceptos maestros desde RENAPROSA
-- Se mantiene sincronizada automáticamente
CREATE TABLE IF NOT EXISTS public.hosix_conceptos_maestro (
  id UUID PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  tipo_concepto VARCHAR(50) NOT NULL,
  precio_base DECIMAL(12, 2) NOT NULL,
  usa_tarifacion_dinamica BOOLEAN DEFAULT false,
  visible_aseguradoras BOOLEAN DEFAULT true,
  snomed_code VARCHAR(50),
  cpt_code VARCHAR(50),
  nota TEXT,
  activo BOOLEAN DEFAULT true,
  sincronizado_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_hosix_conceptos_codigo ON public.hosix_conceptos_maestro(codigo);
CREATE INDEX IF NOT EXISTS idx_hosix_conceptos_tipo ON public.hosix_conceptos_maestro(tipo_concepto);
CREATE INDEX IF NOT EXISTS idx_hosix_conceptos_activo ON public.hosix_conceptos_maestro(activo);

-- RLS: Solo lectura para médicos/facturación, no es editable en HOSIX
ALTER TABLE public.hosix_conceptos_maestro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura para todos" ON public.hosix_conceptos_maestro
  FOR SELECT USING (true);

CREATE POLICY "Escritura solo para sincronización" ON public.hosix_conceptos_maestro
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('service_role', 'admin'));
```

---

### Migración 2.2: Crear tabla de replicación `hosix_reglas_tarifacion` (REPLICA)

**Archivo:** `supabase/migrations/20260625_002_hosix_replica_reglas_tarifacion.sql`

```sql
-- Réplica local de reglas desde RENAPROSA
-- Se utiliza para cálculos de precios en HOSIX
CREATE TABLE IF NOT EXISTS public.hosix_reglas_tarifacion (
  id UUID PRIMARY KEY,
  concepto_id UUID NOT NULL REFERENCES public.hosix_conceptos_maestro(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  tipo_regla VARCHAR(50) NOT NULL,
  condicion_json JSONB NOT NULL,
  tipo_aplicacion VARCHAR(50) NOT NULL,
  valor_aplicacion DECIMAL(12, 2) NOT NULL,
  orden_aplicacion INTEGER NOT NULL DEFAULT 1,
  permitir_acumulacion BOOLEAN DEFAULT true,
  es_descuento BOOLEAN DEFAULT false,
  precio_minimo DECIMAL(12, 2),
  precio_maximo DECIMAL(12, 2),
  requiere_aprobacion BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  nota TEXT,
  sincronizado_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_hosix_reglas_concepto ON public.hosix_reglas_tarifacion(concepto_id);
CREATE INDEX IF NOT EXISTS idx_hosix_reglas_tipo ON public.hosix_reglas_tarifacion(tipo_regla);
CREATE INDEX IF NOT EXISTS idx_hosix_reglas_orden ON public.hosix_reglas_tarifacion(orden_aplicacion);

-- RLS: Solo lectura
ALTER TABLE public.hosix_reglas_tarifacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura para todos" ON public.hosix_reglas_tarifacion
  FOR SELECT USING (true);

CREATE POLICY "Escritura solo para sincronización" ON public.hosix_reglas_tarifacion
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('service_role', 'admin'));
```

---

### Migración 2.3: Crear tabla `hosix_pacientes_variables_facturacion`

**Archivo:** `supabase/migrations/20260625_003_hosix_pacientes_variables_facturacion.sql`

```sql
-- Variables del paciente que afectan el cálculo dinámico de precios
-- Se usan para evaluar reglas de tarifación
CREATE TABLE IF NOT EXISTS public.hosix_pacientes_variables_facturacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.hosix_pacientes(id) ON DELETE CASCADE,
  evento_id UUID, -- ID del evento/consulta/procedimiento
  edad_evento INTEGER, -- Edad en el momento del evento
  es_embarazada BOOLEAN DEFAULT false,
  aseguradora_id UUID REFERENCES public.hosix_aseguradoras(id),
  tipo_beneficio VARCHAR(100), -- Beneficiario, contributivo, subsidiado, etc.
  es_caridad BOOLEAN DEFAULT false,
  descuento_especial DECIMAL(5, 2) DEFAULT 0, -- Porcentaje de descuento especial
  urgencia_nivel VARCHAR(20), -- Nivel de urgencia (normal, urgente, emergencia)
  es_beneficiario_empleado BOOLEAN DEFAULT false,
  aplica_copago BOOLEAN DEFAULT true,
  horario_especial VARCHAR(50), -- Horario nocturno, fin de semana, feriado
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_paciente_vars_paciente ON public.hosix_pacientes_variables_facturacion(paciente_id);
CREATE INDEX IF NOT EXISTS idx_paciente_vars_evento ON public.hosix_pacientes_variables_facturacion(evento_id);
CREATE INDEX IF NOT EXISTS idx_paciente_vars_aseguradora ON public.hosix_pacientes_variables_facturacion(aseguradora_id);

-- RLS: Lectura/escritura para roles de facturación
ALTER TABLE public.hosix_pacientes_variables_facturacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura para staff" ON public.hosix_pacientes_variables_facturacion
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('facturacion', 'admin', 'medico'));

CREATE POLICY "Escritura para facturación" ON public.hosix_pacientes_variables_facturacion
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('facturacion', 'admin'));

CREATE POLICY "Actualización para facturación" ON public.hosix_pacientes_variables_facturacion
  FOR UPDATE USING (auth.jwt() ->> 'role' IN ('facturacion', 'admin'));
```

---

### Migración 2.4: Crear función `hosix_calcular_precio_dinamico()`

**Archivo:** `supabase/migrations/20260625_004_hosix_funcion_calcular_precio_dinamico.sql`

```sql
-- Función para calcular precio dinámico aplicando reglas
-- Parámetros:
--   p_concepto_id: UUID del concepto
--   p_paciente_id: UUID del paciente
--   p_aseguradora_id: UUID de la aseguradora (opcional)
-- Retorna: JSONB con desglose de cálculo y precio final

CREATE OR REPLACE FUNCTION public.hosix_calcular_precio_dinamico(
  p_concepto_id UUID,
  p_paciente_id UUID,
  p_aseguradora_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_precio_base DECIMAL(12, 2);
  v_precio_actual DECIMAL(12, 2);
  v_precio_final DECIMAL(12, 2);
  v_variables_paciente RECORD;
  v_regla RECORD;
  v_desglose JSONB := '[]'::jsonb;
  v_condicion_cumple BOOLEAN;
  v_aplicacion DECIMAL(12, 2);
BEGIN
  -- 1. Obtener precio base del concepto
  SELECT precio_base INTO v_precio_base
  FROM public.hosix_conceptos_maestro
  WHERE id = p_concepto_id AND activo = true;
  
  IF v_precio_base IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Concepto no encontrado o inactivo',
      'precio_final', 0
    );
  END IF;
  
  v_precio_actual := v_precio_base;
  
  -- 2. Obtener variables del paciente
  SELECT * INTO v_variables_paciente
  FROM public.hosix_pacientes_variables_facturacion
  WHERE paciente_id = p_paciente_id
  LIMIT 1;
  
  -- 3. Aplicar reglas en orden
  FOR v_regla IN
    SELECT * FROM public.hosix_reglas_tarifacion
    WHERE concepto_id = p_concepto_id 
      AND activo = true
    ORDER BY orden_aplicacion ASC
  LOOP
    -- Evaluar condición (simplificado)
    v_condicion_cumple := true;
    
    -- Calcular aplicación según tipo
    CASE v_regla.tipo_aplicacion
      WHEN 'porcentaje' THEN
        v_aplicacion := v_precio_actual * (v_regla.valor_aplicacion / 100);
        v_precio_actual := v_precio_actual + v_aplicacion;
      WHEN 'monto_fijo' THEN
        v_aplicacion := v_regla.valor_aplicacion;
        v_precio_actual := v_precio_actual + v_aplicacion;
      WHEN 'multiplicador' THEN
        v_aplicacion := v_precio_actual * (v_regla.valor_aplicacion - 1);
        v_precio_actual := v_precio_actual * v_regla.valor_aplicacion;
      WHEN 'precio_directo' THEN
        v_precio_actual := v_regla.valor_aplicacion;
        v_aplicacion := v_regla.valor_aplicacion;
    END CASE;
    
    -- Aplicar límites
    IF v_regla.precio_minimo IS NOT NULL THEN
      v_precio_actual := GREATEST(v_precio_actual, v_regla.precio_minimo);
    END IF;
    IF v_regla.precio_maximo IS NOT NULL THEN
      v_precio_actual := LEAST(v_precio_actual, v_regla.precio_maximo);
    END IF;
    
    -- Agregar al desglose
    v_desglose := v_desglose || jsonb_build_object(
      'nombre_regla', v_regla.nombre,
      'tipo_aplicacion', v_regla.tipo_aplicacion,
      'valor', v_aplicacion,
      'precio_despues', v_precio_actual
    );
  END LOOP;
  
  v_precio_final := GREATEST(v_precio_actual, 0);
  
  -- 4. Retornar resultado
  RETURN jsonb_build_object(
    'precio_base', v_precio_base,
    'precio_final', v_precio_final,
    'reglas_aplicadas', jsonb_array_length(v_desglose),
    'desglose', v_desglose
  );
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.hosix_calcular_precio_dinamico(UUID, UUID, UUID) TO authenticated;
```

---

## 📋 Checklist de Implementación

### En RENAPROSA (SERMED2):

- [ ] Aplicar migración 1.1: `renaprosa_conceptos_maestro`
- [ ] Aplicar migración 1.2: `renaprosa_reglas_tarifacion`
- [ ] Aplicar migración 1.3: `renaprosa_sync_log`
- [ ] Crear hook `useRenaprosaConceptos` en frontend
- [ ] Crear hook `useRenaprosaReglas` en frontend
- [ ] Verificar RLS: solo admin_renaprosa puede escribir
- [ ] Seed: insertar conceptos de ejemplo

### En HOSIX (HOSIX-GEPROSALUD):

- [ ] Aplicar migración 2.1: `hosix_conceptos_maestro` (replica)
- [ ] Aplicar migración 2.2: `hosix_reglas_tarifacion` (replica)
- [ ] Aplicar migración 2.3: `hosix_pacientes_variables_facturacion`
- [ ] Aplicar migración 2.4: función `hosix_calcular_precio_dinamico()`
- [ ] Crear tabla de sincronización desde RENAPROSA
- [ ] Crear triggers para mantener réplicas actualizadas
- [ ] Actualizar `useHosixFacturacion` para usar nuevas tablas

---

## 🔄 Flujo de Sincronización

```
RENAPROSA (Cambios en conceptos/reglas)
    ↓
API de sincronización (Edge Function o trigger)
    ↓
HOSIX (Actualiza réplicas locales)
    ↓
Facturas se calculan con precios dinámicos
```

---

## 📝 Notas Importantes

1. **Auditoría:** Mantener `created_by` y `updated_by` para auditoría
2. **Versionado:** Considerar versionado de reglas para histórico
3. **Pruebas:** Antes de aplicar en producción, testing exhaustivo
4. **Rollback:** Guardar backups antes de cada migración
5. **Documentación:** Mantener actualizada durante cambios

