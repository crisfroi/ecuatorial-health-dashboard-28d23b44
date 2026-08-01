# 🚀 Guía Paso a Paso: Aplicar Migraciones Tarifación Dinámica

## ⚠️ ANTES DE EMPEZAR

1. **BACKUP** - Hacer backup completo de ambas bases de datos
2. **Ambiente de Testing** - Aplicar primero en dev/staging
3. **Revisar Migraciones** - Leer `MIGRACIONES_RENAPROSA_HOSIX_TARIFACION_DINAMICA.md` completo
4. **Ventana de Mantenimiento** - Hacerlo fuera de horario de pico

---

## 📋 PASO 1: Crear Archivos de Migración en RENAPROSA (SERMED2)

### 1.1 Crear archivo: `supabase/migrations/20260625_001_renaprosa_conceptos_maestro.sql`

Copiar desde: `MIGRACIONES_RENAPROSA_HOSIX_TARIFACION_DINAMICA.md` → Sección "Migración 1.1"

```bash
# Ubicación:
SERMED2/supabase/migrations/20260625_001_renaprosa_conceptos_maestro.sql
```

**Contenido:** 
- CREATE TABLE `renaprosa_conceptos_maestro`
- Índices
- RLS policies
- Seed data (5 conceptos)
- ~90 líneas

---

### 1.2 Crear archivo: `supabase/migrations/20260625_002_renaprosa_reglas_tarifacion.sql`

Copiar desde: `MIGRACIONES_RENAPROSA_HOSIX_TARIFACION_DINAMICA.md` → Sección "Migración 1.2"

```bash
# Ubicación:
SERMED2/supabase/migrations/20260625_002_renaprosa_reglas_tarifacion.sql
```

**Contenido:**
- CREATE TABLE `renaprosa_reglas_tarifacion`
- Índices
- CREATE VIEW `vw_reglas_tarifacion_por_concepto`
- RLS policies
- Seed data (1 regla ejemplo)
- ~95 líneas

---

### 1.3 Crear archivo: `supabase/migrations/20260625_003_renaprosa_sync_log.sql`

Copiar desde: `MIGRACIONES_RENAPROSA_HOSIX_TARIFACION_DINAMICA.md` → Sección "Migración 1.3"

```bash
# Ubicación:
SERMED2/supabase/migrations/20260625_003_renaprosa_sync_log.sql
```

**Contenido:**
- CREATE TABLE `renaprosa_sync_log`
- Índices
- RLS policies
- ~40 líneas

---

## 🔧 PASO 2: Aplicar Migraciones en RENAPROSA

### 2.1 Verificar estado de migraciones

```bash
cd SERMED2

# Ver migraciones aplicadas
supabase migration list

# Debería mostrar las migraciones recientes
```

### 2.2 Aplicar migraciones localmente (si usas Supabase local)

```bash
# Aplicar todas las migraciones pendientes
supabase migration up

# O específicamente:
supabase db push
```

### 2.3 Aplicar en Supabase Cloud (PRODUCCIÓN)

```bash
# Opción A: Via Supabase Dashboard
# 1. Ir a: project.supabase.co
# 2. SQL Editor
# 3. Crear new query
# 4. Copiar contenido de cada migración
# 5. Ejecutar secuencialmente

# Opción B: Via CLI (si tienes acceso)
supabase db push --linked
```

### 2.4 Verificar tablas creadas

```sql
-- En Supabase SQL Editor, ejecutar:

SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'renaprosa%'
ORDER BY tablename;

-- Debería retornar:
-- renaprosa_conceptos_maestro
-- renaprosa_reglas_tarifacion
-- renaprosa_sync_log
```

### 2.5 Verificar datos de seed

```sql
SELECT COUNT(*) FROM public.renaprosa_conceptos_maestro;
-- Debería retornar: 5 (conceptos de ejemplo)

SELECT COUNT(*) FROM public.renaprosa_reglas_tarifacion;
-- Debería retornar: 1 (regla de ejemplo)
```

---

## 📦 PASO 3: Crear Archivos de Migración en HOSIX (HOSIX-GEPROSALUD)

### 3.1 Crear archivo: `supabase/migrations/20260625_001_hosix_replica_conceptos_maestro.sql`

Copiar desde: `MIGRACIONES_RENAPROSA_HOSIX_TARIFACION_DINAMICA.md` → Sección "Migración 2.1"

```bash
# Ubicación:
HOSIX-GEPROSALUD/supabase/migrations/20260625_001_hosix_replica_conceptos_maestro.sql
```

---

### 3.2 Crear archivo: `supabase/migrations/20260625_002_hosix_replica_reglas_tarifacion.sql`

Copiar desde: `MIGRACIONES_RENAPROSA_HOSIX_TARIFACION_DINAMICA.md` → Sección "Migración 2.2"

```bash
# Ubicación:
HOSIX-GEPROSALUD/supabase/migrations/20260625_002_hosix_replica_reglas_tarifacion.sql
```

---

### 3.3 Crear archivo: `supabase/migrations/20260625_003_hosix_pacientes_variables_facturacion.sql`

Copiar desde: `MIGRACIONES_RENAPROSA_HOSIX_TARIFACION_DINAMICA.md` → Sección "Migración 2.3"

```bash
# Ubicación:
HOSIX-GEPROSALUD/supabase/migrations/20260625_003_hosix_pacientes_variables_facturacion.sql
```

---

### 3.4 Crear archivo: `supabase/migrations/20260625_004_hosix_funcion_calcular_precio_dinamico.sql`

Copiar desde: `MIGRACIONES_RENAPROSA_HOSIX_TARIFACION_DINAMICA.md` → Sección "Migración 2.4"

```bash
# Ubicación:
HOSIX-GEPROSALUD/supabase/migrations/20260625_004_hosix_funcion_calcular_precio_dinamico.sql
```

---

## 🔧 PASO 4: Aplicar Migraciones en HOSIX

### 4.1 Repetir proceso de RENAPROSA

```bash
cd HOSIX-GEPROSALUD

# Ver migraciones
supabase migration list

# Aplicar (local)
supabase migration up

# O en cloud
supabase db push --linked
```

### 4.2 Verificar tablas en HOSIX

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'hosix_%'
AND tablename IN (
  'hosix_conceptos_maestro',
  'hosix_reglas_tarifacion',
  'hosix_pacientes_variables_facturacion'
)
ORDER BY tablename;

-- Debería retornar 3 tablas
```

### 4.3 Verificar función creada

```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_type = 'FUNCTION' 
AND routine_name = 'hosix_calcular_precio_dinamico';

-- Debería retornar: hosix_calcular_precio_dinamico
```

---

## 📊 PASO 5: Sincronización Inicial

### 5.1 Copiar conceptos desde RENAPROSA a HOSIX

```sql
-- Ejecutar en HOSIX:

INSERT INTO public.hosix_conceptos_maestro 
SELECT * FROM 
  -- AQUÍ Iría la query a RENAPROSA
  -- Por ahora, hacer manual o vía API

-- Alternativa: API/Edge Function
-- (Será implementado en fase posterior)
```

### 5.2 Copiar reglas desde RENAPROSA a HOSIX

```sql
-- Similar a arriba
-- Ejecutar después de conceptos
```

---

## ✅ PASO 6: Validación

### Checklist de Validación

```sql
-- En RENAPROSA:
[ ] SELECT COUNT(*) FROM renaprosa_conceptos_maestro; -- 5+
[ ] SELECT COUNT(*) FROM renaprosa_reglas_tarifacion; -- 1+
[ ] SELECT * FROM vw_reglas_tarifacion_por_concepto LIMIT 1;

-- En HOSIX:
[ ] SELECT COUNT(*) FROM hosix_conceptos_maestro; -- 5+
[ ] SELECT COUNT(*) FROM hosix_reglas_tarifacion; -- 1+
[ ] SELECT COUNT(*) FROM hosix_pacientes_variables_facturacion; -- 0 (vacía)

-- Función:
[ ] SELECT hosix_calcular_precio_dinamico(uuid, uuid, NULL); -- Test

-- RLS:
[ ] Como usuario normal, no debería poder INSERT en renaprosa_*
[ ] Como usuario facturación, debería poder INSERT en hosix_pacientes_variables_facturacion
```

---

## 🔄 PASO 7: Testing

### 7.1 Test de Cálculo de Precio

```sql
-- Asume que tienes conceptos y pacientes:
SELECT hosix_calcular_precio_dinamico(
  (SELECT id FROM hosix_conceptos_maestro LIMIT 1),
  (SELECT id FROM hosix_pacientes LIMIT 1),
  NULL
) AS resultado_calculo;

-- Debería retornar JSON con:
-- {
--   "precio_base": X,
--   "precio_final": Y,
--   "reglas_aplicadas": N,
--   "desglose": [...]
-- }
```

### 7.2 Test de RLS

```sql
-- Como usuario no-admin:
SELECT * FROM renaprosa_conceptos_maestro; -- Debería retornar datos (lectura ok)
INSERT INTO renaprosa_conceptos_maestro (...) VALUES (...); -- Debería fallar (escritura prohibida)

-- Como admin_renaprosa:
INSERT INTO renaprosa_conceptos_maestro (...) VALUES (...); -- Debería funcionar
```

---

## 🚨 Troubleshooting

### Error: "function already exists"
```sql
-- Solución: El archivo ya fue ejecutado, ignorar o hacer DROP:
DROP FUNCTION IF EXISTS public.hosix_calcular_precio_dinamico(UUID, UUID, UUID);
-- Luego re-ejecutar migración
```

### Error: "permission denied for schema public"
```sql
-- Asegurarse que el usuario tiene permisos:
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
```

### Error: "uuid_column references non-existent table"
```sql
-- Verificar que hosix_pacientes y hosix_aseguradoras existen:
SELECT COUNT(*) FROM hosix_pacientes;
SELECT COUNT(*) FROM hosix_aseguradoras;
```

---

## 📝 Checklist Final

RENAPROSA (SERMED2):
- [ ] Archivo 20260625_001_renaprosa_conceptos_maestro.sql creado
- [ ] Archivo 20260625_002_renaprosa_reglas_tarifacion.sql creado
- [ ] Archivo 20260625_003_renaprosa_sync_log.sql creado
- [ ] Migraciones aplicadas exitosamente
- [ ] Tablas creadas y visibles
- [ ] Seed data insertado
- [ ] RLS policies verificadas
- [ ] UI en Facturación.tsx renderiza sin errores

HOSIX (HOSIX-GEPROSALUD):
- [ ] Archivo 20260625_001_hosix_replica_conceptos_maestro.sql creado
- [ ] Archivo 20260625_002_hosix_replica_reglas_tarifacion.sql creado
- [ ] Archivo 20260625_003_hosix_pacientes_variables_facturacion.sql creado
- [ ] Archivo 20260625_004_hosix_funcion_calcular_precio_dinamico.sql creado
- [ ] Migraciones aplicadas exitosamente
- [ ] Tablas creadas
- [ ] Función creada y ejecutable
- [ ] RLS policies correctas

Integración:
- [ ] Conceptos replicados de RENAPROSA a HOSIX
- [ ] Reglas replicadas de RENAPROSA a HOSIX
- [ ] Test de cálculo de precio exitoso
- [ ] Test de RLS exitoso

---

## 📞 Soporte

Si encuentras errores:
1. Revisar logs: `supabase functions get <function-name>`
2. Verificar RLS: `SELECT * FROM pg_policies;`
3. Consultar con DBA
4. Revisar commits en Git para ver cambios

**Contacto:** Tu arquitecto de BD

