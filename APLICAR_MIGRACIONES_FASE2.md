# 🚀 GUÍA RÁPIDA - Aplicar Migraciones FASE 2

## ✅ Archivos SQL Creados

### EN SERMED2 (RENAPROSA) - 3 migraciones

```
supabase/migrations/
├─ 20260625_001_renaprosa_conceptos_maestro.sql (45 líneas)
├─ 20260625_002_renaprosa_reglas_tarifacion.sql (74 líneas)
└─ 20260625_003_renaprosa_sync_log.sql (26 líneas)
```

### EN HOSIX-GEPROSALUD - 4 migraciones

```
supabase/migrations/
├─ 20260625_001_hosix_replica_conceptos_maestro.sql (33 líneas)
├─ 20260625_002_hosix_replica_reglas_tarifacion.sql (37 líneas)
├─ 20260625_003_hosix_pacientes_variables_facturacion.sql (38 líneas)
└─ 20260625_004_hosix_funcion_calcular_precio_dinamico.sql (104 líneas)
```

---

## 🔧 OPCIÓN 1: Supabase CLI (Recomendado)

### 1. APLICAR EN RENAPROSA (SERMED2)

```bash
cd SERMED2

# Ver estado
supabase migration list

# Aplicar migraciones
supabase db push

# Verificar que se crearon las tablas
supabase db pull  # Para descargar schema actualizado
```

### 2. APLICAR EN HOSIX (HOSIX-GEPROSALUD)

```bash
cd HOSIX-GEPROSALUD

# Ver estado
supabase migration list

# Aplicar migraciones
supabase db push

# Verificar
supabase db pull
```

---

## 🔧 OPCIÓN 2: Supabase Dashboard (SQL Editor)

### EN RENAPROSA

1. Ir a: https://app.supabase.com → Proyecto RENAPROSA
2. SQL Editor → "New Query"
3. Copiar contenido de:
   - `20260625_001_renaprosa_conceptos_maestro.sql`
   - Ejecutar ✓
4. Copiar contenido de:
   - `20260625_002_renaprosa_reglas_tarifacion.sql`
   - Ejecutar ✓
5. Copiar contenido de:
   - `20260625_003_renaprosa_sync_log.sql`
   - Ejecutar ✓

### EN HOSIX

1. Ir a: https://app.supabase.com → Proyecto HOSIX
2. Repetir pasos 2-5 para:
   - `20260625_001_hosix_replica_conceptos_maestro.sql`
   - `20260625_002_hosix_replica_reglas_tarifacion.sql`
   - `20260625_003_hosix_pacientes_variables_facturacion.sql`
   - `20260625_004_hosix_funcion_calcular_precio_dinamico.sql`

---

## ✅ VERIFICACIÓN

### EN RENAPROSA - Ejecutar en SQL Editor:

```sql
-- Verificar tablas
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'renaprosa%'
ORDER BY tablename;

-- Debería retornar:
-- renaprosa_conceptos_maestro
-- renaprosa_reglas_tarifacion
-- renaprosa_sync_log

-- Verificar datos de seed
SELECT COUNT(*) as cantidad FROM public.renaprosa_conceptos_maestro;
-- Debería retornar: 5

SELECT COUNT(*) as cantidad FROM public.renaprosa_reglas_tarifacion;
-- Debería retornar: 1

-- Verificar vista
SELECT * FROM public.vw_reglas_tarifacion_por_concepto LIMIT 1;
-- Debería retornar datos
```

### EN HOSIX - Ejecutar en SQL Editor:

```sql
-- Verificar tablas
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'hosix_conceptos%' OR tablename LIKE 'hosix_reglas%' OR tablename LIKE 'hosix_pacientes_variables%'
ORDER BY tablename;

-- Debería retornar:
-- hosix_conceptos_maestro
-- hosix_reglas_tarifacion
-- hosix_pacientes_variables_facturacion

-- Verificar función
SELECT routine_name FROM information_schema.routines 
WHERE routine_type = 'FUNCTION' 
AND routine_name = 'hosix_calcular_precio_dinamico';
-- Debería retornar: hosix_calcular_precio_dinamico
```

---

## 🎯 PRÓXIMO PASO

Una vez aplicadas las 7 migraciones:

1. ✅ Crear hook `useRenaprosaConceptos.ts`
2. ✅ Crear hook `useRenaprosaReglas.ts`
3. ✅ Conectar UI con Supabase
4. ✅ Testing

---

## ⚠️ Si hay errores

### Error: "Table already exists"
- Las migraciones usan `IF NOT EXISTS`, puedes ejecutar de nuevo sin problema
- Si necesitas limpiar, hacer backup y luego DROP:
```sql
DROP TABLE IF EXISTS public.renaprosa_conceptos_maestro CASCADE;
DROP TABLE IF EXISTS public.renaprosa_reglas_tarifacion CASCADE;
DROP TABLE IF EXISTS public.renaprosa_sync_log CASCADE;
```

### Error: "Permission denied"
- Verificar que tienes rol `admin_renaprosa` o superior
- RLS puede estar bloqueando, verificar policies en SQL Editor

### Error: "Foreign key constraint"
- Asegúrate de crear tablas en orden (conceptos antes que reglas)
- Las migraciones están en orden correcto

---

## 📝 Checklist

RENAPROSA (SERMED2):
- [ ] Archivo 20260625_001_renaprosa_conceptos_maestro.sql ✓
- [ ] Archivo 20260625_002_renaprosa_reglas_tarifacion.sql ✓
- [ ] Archivo 20260625_003_renaprosa_sync_log.sql ✓
- [ ] Migraciones aplicadas exitosamente
- [ ] Tablas creadas
- [ ] Seed data insertado (5 conceptos)
- [ ] Verificación SQL exitosa

HOSIX (HOSIX-GEPROSALUD):
- [ ] Archivo 20260625_001_hosix_replica_conceptos_maestro.sql ✓
- [ ] Archivo 20260625_002_hosix_replica_reglas_tarifacion.sql ✓
- [ ] Archivo 20260625_003_hosix_pacientes_variables_facturacion.sql ✓
- [ ] Archivo 20260625_004_hosix_funcion_calcular_precio_dinamico.sql ✓
- [ ] Migraciones aplicadas exitosamente
- [ ] Tablas creadas
- [ ] Función creada
- [ ] Verificación SQL exitosa

---

**Tiempo estimado:** 30 minutos  
**Contacto:** Si hay problemas, revisar RLS policies o permisos de rol
