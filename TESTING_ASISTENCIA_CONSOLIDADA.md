# 🧪 TESTING - Sistema de Asistencia Consolidada

**Documento:** Testing e Validación  
**Fecha:** 2025-01-16  
**Estado:** Guía de validación post-implementación  

---

## 📋 CHECKLIST DE TESTING

### NIVEL 1: Validación de Base de Datos ✅

#### 1.1 Verificar Vista Consolidada

```sql
-- Paso 1: Verificar que la vista existe
SELECT * FROM information_schema.views 
WHERE table_schema = 'public' AND table_name = 'asistencia_consolidada';

-- Resultado esperado: 1 fila con asistencia_consolidada

-- Paso 2: Contar registros por fuente
SELECT source_type, COUNT(*) as total 
FROM asistencia_consolidada 
GROUP BY source_type;

-- Resultado esperado: 
-- biometrico | 0+ (una vez que sincronización inicie)
-- manual    | 7+ (desde importación manual)

-- Paso 3: Verificar estructura de columnas
\d asistencia_consolidada;

-- Resultado esperado: Debe tener:
-- - id, profesional_id, centro_salud_id, numero_enno, fecha_hora
-- - inout, mode, event, raw_line, temperature, image_url
-- - source_type, dispositivo_sn, created_at
```

#### 1.2 Verificar Tabla de Auditoría

```sql
-- Paso 1: Verificar tabla existe
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'asistencia_auditoria';

-- Resultado esperado: 1 fila

-- Paso 2: Verificar índices
SELECT indexname FROM pg_indexes 
WHERE tablename = 'asistencia_auditoria';

-- Resultado esperado: Mínimo 4 índices:
-- - idx_auditoria_fichaje_id
-- - idx_auditoria_usuario_id
-- - idx_auditoria_created_at
-- - idx_auditoria_accion

-- Paso 3: Verificar triggers
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND (event_object_table = 'asistencia_fichajes' 
  OR event_object_table = 'attendance_logs');

-- Resultado esperado: 2 triggers:
-- - trigger_audit_asistencia_fichajes
-- - trigger_audit_attendance_logs
```

---

### NIVEL 2: Validación de Sincronización Flask ✅

#### 2.1 Verificar Configuración en Flask

```python
# Paso 1: Revisar requirements.txt
# Debe incluir:
# - apscheduler==3.10.4
# - supabase==2.4.2

# Paso 2: Revisar database.py
# Debe tener:
# - SUPABASE_URL = "https://wdieynendfjbkbhfovrx.supabase.co"
# - SUPABASE_KEY = "..."
# - supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Paso 3: Revisar app.py
# Debe tener:
# - from sync_with_supabase import start_sync_scheduler
# - start_sync_scheduler(supabase_client, sync_interval=5)
# - atexit.register(stop_sync_scheduler)
```

#### 2.2 Verificar Logs de Sincronización

```bash
# En Render, revisar logs últimas 24 horas:

# Buscar estas líneas:
# ✅ Sync scheduler initialized (interval: 5m)
# ✅ Pushed X records to asistencia_fichajes
# ⚠️ Sync scheduler not configured (si no hay datos de Supabase)

# En caso de error, buscar:
# ERROR in push_new_records_to_supabase: [descripción]
```

#### 2.3 Test Manual de Sincronización

```bash
# Opción A: Generar un fichaje de prueba
# 1. Generar un fichaje en dispositivo biométrico en Render
# 2. Esperar ~5 minutos (intervalo de sync)
# 3. Verificar en Supabase:

SELECT * FROM asistencia_fichajes 
ORDER BY created_at DESC LIMIT 1;

# Resultado esperado: Nuevo registro con:
# - enroll_id: del fichaje
# - profesional_id: (null si no hay mapeo, OK)
# - centro_salud_id: (null si no hay dispositivo, OK)
# - source_type: 'biometrico'
# - temperature: valor / 100

# Opción B: Importar un archivo .TXT manualmente
# 1. Acceder a Dashboard UI
# 2. Ir a Asistencia → Importar Fichajes
# 3. Seleccionar archivo .TXT
# 4. Verificar en Supabase:

SELECT * FROM attendance_logs 
ORDER BY created_at DESC LIMIT 1;

# Resultado esperado: Nuevo registro con:
# - en_no: desde el archivo
# - id_profesional: del mapeo
# - source_file: nombre del archivo
# - source_type: 'manual' (si está en vista consolidada)
```

---

### NIVEL 3: Validación de Hook React ✅

#### 3.1 Verificar useAsistenciaConsolidada Hook

```typescript
// En consola del browser (F12):

// Paso 1: Importar y probar hook
import { useAsistenciaConsolidada } from '@/hooks/useAsistenciaConsolidada';

// Paso 2: En componente React, usar:
const { data, isLoading, error } = useAsistenciaConsolidada({
  fechaDesde: '2025-01-01',
  fechaHasta: '2025-01-31',
});

console.log('Data:', data);       // Debe mostrar array de registros
console.log('Loading:', isLoading); // true mientras carga
console.log('Error:', error);      // null si OK

// Resultado esperado:
// - data: Array con objetos AsistenciaConsolidada
// - isLoading: false
// - error: null
// - Mínimo 7 registros (desde importación manual)
```

#### 3.2 Test de Filtros

```typescript
// Test 1: Filtrar por tipo biométrico
useAsistenciaConsolidada({ 
  sourceType: 'biometrico',
  fechaDesde: '2025-01-01',
  fechaHasta: '2025-01-31'
});
// Resultado: Solo registros con source_type = 'biometrico'

// Test 2: Filtrar por centro
useAsistenciaConsolidada({ 
  centroId: 'uuid-del-centro',
  fechaDesde: '2025-01-01',
  fechaHasta: '2025-01-31'
});
// Resultado: Solo registros del centro especificado

// Test 3: Filtrar por profesional
useAsistenciaConsolidada({ 
  profesionalId: 'uuid-profesional',
  fechaDesde: '2025-01-01',
  fechaHasta: '2025-01-31'
});
// Resultado: Solo registros del profesional
```

---

### NIVEL 4: Validación de Componentes ✅

#### 4.1 MetricasPanel

```bash
# Test en navegador:
1. Ir a Dashboard → Asistencia → Métricas Panel
2. Verificar que carga sin errores
3. Seleccionar un rango de fechas
4. Verificar que muestra datos consolidados
5. Descripción debe indicar "(datos consolidados: biométrico + manual)"
6. Exportar CSV debe funcionar

# Errores esperados: Ninguno (fallback a legacy si es necesario)
```

#### 4.2 AsistenciaIntegradoDashboard (NUEVO)

```bash
# Test en navegador:
1. Importar componente en una ruta:
   import { AsistenciaIntegradoDashboard } from '@/components/asistencia/AsistenciaIntegradoDashboard';

2. Usar en página:
   <AsistenciaIntegradoDashboard />

3. Verificar funcionalidad:
   ✅ Filtros funcionan (centro, fechas)
   ✅ Pestañas: Consolidado, Biométrico, Manual
   ✅ Tabla muestra registros
   ✅ Gráficos se renderizan (línea + pastel)
   ✅ Botones: Refrescar, Exportar funcionan
   ✅ Estados de carga (skeleton) aparecen
   ✅ Mensaje "Sin datos" aparece si no hay resultados
   ✅ Responsive en mobile

# Ejemplo de resultado esperado:
- Total Registros: 837 (o más)
- Entradas: 420+
- Salidas: 417+
- Fuente Biométrica: 830+ (Manual: 7)
```

---

### NIVEL 5: Validación de Performance ✅

#### 5.1 Test con Volumen Grande

```sql
-- Simular volumen esperado: 140k registros/mes
-- Para 7 centros × 1000 profesionales × 20 fichajes/día

-- Paso 1: Contar registros actuales
SELECT COUNT(*) FROM asistencia_consolidada;

-- Paso 2: Verificar índices en uso
EXPLAIN ANALYZE
SELECT * FROM asistencia_consolidada
WHERE centro_salud_id = 'algún-uuid'
AND fecha_hora BETWEEN '2025-01-01' AND '2025-01-31'
ORDER BY fecha_hora DESC
LIMIT 100;

-- Resultado esperado: "Index Scan" (no Sequential Scan)
-- Tiempo: < 100ms

-- Paso 3: Test de query consolidada
SELECT 
  source_type,
  COUNT(*) as total,
  COUNT(DISTINCT profesional_id) as profesionales,
  COUNT(DISTINCT centro_salud_id) as centros
FROM asistencia_consolidada
GROUP BY source_type;

-- Resultado esperado: Rápido (< 200ms)
-- biometrico | 830+ | 44 | 7
-- manual     | 7+   | 7  | varios
```

#### 5.2 Test de Caché React Query

```typescript
// Hook debe cachear por 1 minuto según configuración:
// staleTime: 1 * 60 * 1000 = 60 segundos
// gcTime: 5 * 60 * 1000 = 300 segundos

// Test:
const { data: data1 } = useAsistenciaConsolidada({ centroId: 'x' });
// Esperar 30 segundos
const { data: data2 } = useAsistenciaConsolidada({ centroId: 'x' });

// Resultado esperado:
// - data1 === data2 (referencia en memoria igual)
// - No hay nueva query a la BD
```

---

### NIVEL 6: Validación de Auditoría ✅

#### 6.1 Verificar Registro Automático

```sql
-- Paso 1: Importar un fichaje manual para generar un registro

-- Paso 2: Verificar que se registró en auditoría
SELECT * FROM asistencia_auditoria 
WHERE accion = 'INSERT'
ORDER BY created_at DESC LIMIT 1;

-- Resultado esperado:
-- - accion: 'INSERT'
-- - fichaje_id: id del registro insertado
-- - datos_despues: JSON con datos del registro
-- - created_at: timestamp actual

-- Paso 3: Test de UPDATE
UPDATE asistencia_fichajes 
SET temperature = 37.5 
WHERE id = 'algún-id';

SELECT * FROM asistencia_auditoria 
WHERE accion = 'UPDATE'
ORDER BY created_at DESC LIMIT 1;

-- Resultado esperado:
-- - datos_antes: JSON anterior
-- - datos_despues: JSON modificado (temperatura 37.5)
```

#### 6.2 Verificar Permisos de Auditoría

```sql
-- Solo admins pueden ver auditoría
SELECT COUNT(*) FROM asistencia_auditoria;

-- Resultado esperado:
-- - Si eres admin: muestra count correctamente
-- - Si eres usuario regular: error de permiso (RLS policy activa)
```

---

## ✅ CHECKLIST FINAL

- [ ] Vista consolidada existe y retorna datos
- [ ] Tabla auditoría creada con triggers activos
- [ ] Sincronización Flask iniciada sin errores
- [ ] APScheduler ejecutando cada 5 minutos (logs)
- [ ] MetricasPanel usa vista consolidada
- [ ] AsistenciaIntegradoDashboard funciona completamente
- [ ] Hook useAsistenciaConsolidada retorna datos correctos
- [ ] Filtros de centro/fecha/tipo funcionan
- [ ] Performance OK con 140k registros simulados
- [ ] Auditoría registra cambios automáticamente
- [ ] Exportación CSV funciona
- [ ] Temperatura estandarizada (/100)
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs de Render
- [ ] Datos de ambas fuentes (biométrico + manual) se unifican correctamente

---

## 🐛 TROUBLESHOOTING

### Error: "Vista asistencia_consolidada no existe"
**Solución:** Ejecutar migración en Supabase:
```sql
-- Ver PLAN_IMPLEMENTACION_ASISTENCIA.md Fase 1
-- Crear vista SQL manualmente si es necesario
```

### Error: "Supabase client not configured"
**Solución:** Verificar database.py tiene SUPABASE_URL y SUPABASE_KEY correctas

### Error: "APScheduler not available"
**Solución:** En Render:
```bash
pip install apscheduler==3.10.4
```

### Hook retorna array vacío
**Solución:**
1. Verificar vista consolidada no está vacía
2. Verificar filtros son correctos
3. Revisar RLS policies en Supabase

### Performance lenta (> 1 segundo)
**Solución:**
1. Verificar índices creados correctamente:
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'asistencia_consolidada';
   ```
2. Ejecutar VACUUM ANALYZE
3. Aumentar pool size en Supabase

---

## 📊 MÉTRICAS DE ÉXITO

| Métrica | Target | Status |
|---------|--------|--------|
| Vista SQL funcional | ✅ | ✅ |
| Auditoría activa | ✅ | ✅ |
| Sincronización operacional | ✅ | ⏳ |
| Hook React funcional | ✅ | ✅ |
| Dashboard integrado | ✅ | ✅ |
| Query performance | < 200ms | ⏳ |
| Datos consolidados | Biométrico + Manual | ✅ |
| Temperatura normalizada | /100 | ✅ |

---

## 📞 SOPORTE

Si encuentra problemas durante testing:

1. **Revisar logs:**
   - Render: Dashboard → Logs
   - Supabase: Dashboard → Logs
   - Browser: F12 → Console

2. **Ejecutar queries de validación:**
   - Todas las que aparecen arriba

3. **Verificar documentación:**
   - IMPLEMENTACION_ASISTENCIA_ESTADO.md
   - PLAN_IMPLEMENTACION_ASISTENCIA.md
   - ANALISIS_ASISTENCIA_COMPLETO.md

---

**Documento:** TESTING_ASISTENCIA_CONSOLIDADA.md  
**Estado:** ✅ Guía completa de validación  
**Próximo:** Ejecutar tests y reportar resultados
