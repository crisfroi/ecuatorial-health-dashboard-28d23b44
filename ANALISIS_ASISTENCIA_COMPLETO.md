# 📋 Análisis Completo del Sistema de Asistencia Biométrica

**Fecha:** 2025-01-XX  
**Estado:** En Análisis y Documentación  
**Autor:** Sistema de IA (Fusion)

---

## 📌 RESUMEN EJECUTIVO

El proyecto tiene **DOS MÉTODOS** de ingreso de datos de asistencia que actualmente funcionan de forma **PARALELA pero DESINTEGRADA**:

1. **Importación Manual (.TXT/.XLS)** → Inserta en `attendance_logs`
2. **Biométrico Online (WebSocket/HTTP)** → Inserta en `records` + otras tablas

**Problema:** Los datos se guardan en tablas diferentes, con mapeos incompletos, causando:
- ✗ Reportes y métricas contradictorias
- ✗ Duplicación de lógica
- ✗ Dificultad para unificar análisis
- ✗ UI/UX subóptima que requiere llamadas múltiples a Render

**Solución Propuesta:** Crear una capa unificada que:
- ✅ Use una sola tabla principal (`asistencia_fichajes` o `attendance_consolidated`)
- ✅ Integre ambos métodos con fuente de datos clara
- ✅ Ofrezca APIs eficientes en Supabase
- ✅ Mejore UI/UX con datos directos de la BD

---

## 🏗️ ARQUITECTURA ACTUAL

### 1. FLUJO DE IMPORTACIÓN MANUAL (.TXT)

```
Usuario selecciona Centro → Dispositivo → Archivo .TXT/XLS
                              ↓
                    ImportarFichajesPanel.tsx
                    (src/components/asistencia/)
                              ↓
              parseTxtPreview() / parseXlsPreview()
              Busca mapeos en: empleado_dispositivo_map
              Valida: EnNo (mapeo a profesional)
                              ↓
              useAsistencia.importFile()
                              ↓
              Inserta en BD: attendance_logs
              (tabla: attendance_logs con campos específicos)
```

**Tablas Implicadas:**
- `attendance_logs` - Registro principal de importación
- `empleado_dispositivo_map` - Mapeo EnNo → profesional
- `dispositivos` - Dispositivos (mapeos manuales)
- `profesionales_sanitarios` - Datos de profesionales

**Formato de datos:**
```json
{
  "id_profesional": "uuid",
  "id_dispositivo": "uuid",
  "en_no": "12345",           // Clave de mapeo
  "inout": "IN|OUT|null",
  "mode": "string",
  "fecha_hora": "timestamp",
  "raw_line": "string",       // Línea original del archivo
  "source_file": "filename"
}
```

---

### 2. FLUJO BIOMÉTRICO ONLINE (WebSocket/HTTP)

```
Dispositivo Biométrico (Render / Cloud)
                ↓
    WebSocket: /pub/chat  OR  HTTP: POST /pub/api
    (FlaskProject/app.py)
                ↓
    Procesa comando JSON:
    - cmd='reg' → Registra dispositivo
    - cmd='sendlog' → Envía registros de asistencia
    - cmd='senduser' → Envía datos de usuario (enroll_info)
                ↓
    Mapeo de datos en Python:
    - enrollid → enroll_id
    - time → records_time (ISO format)
    - inout → intOut
    - mode → mode
    - event → event
    - temp → temperature (conversión: /10 o /100, INCONSISTENTE)
    - image → fichero guardado + referencias
                ↓
    Inserta en BD:
    - records (tabla principal de asistencia)
    - enroll_info (datos biométricos)
    - person (usuario básico)
    - device (dispositivo)
    - machine_command (cola de comandos)
```

**Tablas Implicadas (Python/Flask LOCAL):**
- `records` - Registro principal de asistencia (BD local)
- `enroll_info` - Datos biométricos de usuario
- `person` - Usuario
- `device` - Dispositivo
- `machine_command` - Cola de comandos

**Tabla en Supabase (SYNC):**
- `asistencia_fichajes` - Registros sincronizados desde Render
- `turnos_biometricos` - Turnos/horarios
- `cuadrantes_biometricos` - Cuadrantes del sistema
- `horarios_base_profesional` - Horarios base

---

### 3. SINCRONIZACIÓN CON SUPABASE

```
FlaskProject (Render)
    ↓
sync_with_supabase.py:
- push_new_records_to_supabase()
  → Inserta registros locales en Supabase.records
  
- pull_new_records_from_supabase()
  → Trae registros desde Supabase a BD local
  
- sync_devices()
  → Sincroniza dispositivos
                ↓
        Supabase PostgreSQL
        (Dashboard Lee desde aquí)
```

**Tablas Supabase Principales:**
| Tabla | Origen | Propósito |
|-------|--------|----------|
| `records` | Python/Flask | Registros biométricos sincronizados |
| `attendance_logs` | Dashboard UI | Registros de importación manual |
| `asistencia_fichajes` | Render+Dashboard | Registros combinados (NUEVO PLAN) |
| `asistencia_dispositivos` | Dashboard | Dispositivos de asistencia |
| `empleado_dispositivo_map` | Dashboard | Mapeos EnNo→Profesional |
| `turnos_biometricos` | Dashboard | Turnos/horarios |
| `cuadrantes_biometricos` | Dashboard | Cuadrantes |
| `horarios_base_profesional` | Dashboard | Horarios base |
| `profesionales_sanitarios` | Dashboard | Profesionales (referencia) |

---

## 🔗 RELACIONES Y MAPEOS ACTUALES

### Mapeo por Fuente de Datos

```
┌─────────────────────────────────┬──────────────────┬─────────────────┐
│ Método                          │ Tabla Principal  │ Centro de Salud │
├─────────────────────────────────┼──────────────────┼─────────────────┤
│ Importación .TXT                │ attendance_logs  │ profesional →   │
│                                 │                  │ centro via      │
│                                 │                  │ relación        │
├─────────────────────────────────┼──────────────────┼─────────────────┤
│ Biométrico Online (WebSocket)   │ asistencia_      │ Via dispositivo →│
│                                 │ fichajes         │ centro_salud_id │
├─────────────────────────────────┼──────────────────┼─────────────────┤
│ Reporte XLS (procesado por UI)  │ attendance_logs  │ Mismo que .TXT  │
│                                 │                  │                 │
└─────────────────────────────────┴──────────────────┴─────────────────┘
```

### Mapeos Clave (EnNo)

```
Dispositivo Biométrico (enrollid)
    ↓
asistencia_enroll_map.enroll_id (o empleado_dispositivo_map.en_no)
    ↓
profesionales_sanitarios.id
    ↓
nombre_completo + centro_salud_id
```

**Problema:** EnNo puede venir de:
- Importación manual: `attendance_logs.en_no`
- Biométrico: `asistencia_fichajes.enroll_id`
- Mapeos: `empleado_dispositivo_map.en_no`

**Inconsistencia:** No siempre están sincronizados.

---

## 🚨 PROBLEMAS IDENTIFICADOS

### P1: Tablas Separadas
- **Impacto:** ALTO
- **Síntoma:** Reportes muestran datos incompletos/contradictorios
- **Causa:** `attendance_logs` ≠ `asistencia_fichajes`
- **Ejemplo:** 
  ```
  SELECT COUNT(*) FROM attendance_logs  -- 150
  SELECT COUNT(*) FROM asistencia_fichajes  -- 200
  Pero sum(horas) no coincide en reportes
  ```

### P2: Conversión de Temperatura Inconsistente
- **Impacto:** BAJO pero técnico
- **Síntoma:** get_attendance() usa /10, get_all_log() usa /100
- **Ubicación:** FlaskProject/app.py líneas ~1011-1014 vs ~1260-1266
- **Solución:** Estandarizar a un factor único

### P3: Formato de DateTime Inconsistente
- **Impacto:** MEDIO
- **Síntoma:** algunos timestamps ISO, otros no
- **Ubicación:** insert_record2(**record) espera formato específico
- **Solución:** Normalizar a ISO 8601 en todos lados

### P4: Mapeo Incompleto de Dispositivos
- **Impacto:** ALTO
- **Síntoma:** Un dispositivo puede no estar asignado a un centro, o EnNo no mapeado
- **Causa:** Validaciones insuficientes al crear mapeos
- **Solución:** Validar en BD con constraints

### P5: UI Hace Llamadas a Render Innecesarias
- **Impacto:** MEDIO (performance)
- **Síntoma:** BiometricSyncPanel intenta conectar a Render cada vez
- **Causa:** Datos no están sincronizados en Supabase
- **Solución:** Priorizar datos en Supabase, Render es secondary

### P6: Falta Auditoría de Cambios
- **Impacto:** BAJO pero importante
- **Síntoma:** No hay tracking de quién importó qué, cuándo
- **Solución:** Adicionar tabla de auditoría

---

## 📊 DATOS ACTUALES EN SUPABASE

### Tabla `asistencia_fichajes` (Ejemplo de registros esperados)
```
id: uuid
device_sn: "ABC123"
enroll_id: 12345
profesional_id: uuid
time_local: 2025-01-15T09:30:00Z
inout: 1 (0=IN, 1=OUT)
mode: 2
event: 0
temperature: 36.5
image_url: "uploads/..."
raw_index: 123
created_at: 2025-01-15T09:30:00Z
```

### Tabla `attendance_logs` (Ejemplo de registros esperados)
```
id: uuid
id_profesional: uuid
id_dispositivo: uuid
en_no: "12345"
inout: "IN"|"OUT"|null
mode: string
fecha_hora: timestamp
raw_line: string (línea original del .TXT)
source_file: filename
created_at: timestamp
```

### Tabla `empleado_dispositivo_map`
```
id: uuid
id_profesional: uuid
en_no: "12345"  ← CLAVE DE MAPEO
id_dispositivo: uuid
created_at: timestamp
updated_at: timestamp
```

---

## 🎯 PLAN DE SOLUCIÓN (Roadmap)

### FASE 1: Análisis y Documentación (✅ EN PROGRESO)
- [x] Documentar flujos actuales
- [x] Identificar problemas
- [x] Mapear tablas y relaciones
- [ ] Crear vistas SQL que unifiquen datos

### FASE 2: Unificación de Datos (📅 PRÓXIMO)
**Crear View o Tabla Consolidada:**
```sql
CREATE VIEW asistencia_consolidada AS
SELECT 
  af.id,
  af.profesional_id,
  af.centro_salud_id,
  af.enroll_id,
  af.time_local,
  af.inout,
  'biometrico'::text as source_type,
  af.created_at
FROM asistencia_fichajes af
UNION ALL
SELECT 
  al.id,
  al.id_profesional,
  (SELECT centro_salud_id FROM profesionales_sanitarios WHERE id = al.id_profesional),
  CAST(al.en_no AS INTEGER),
  al.fecha_hora,
  CASE WHEN al.inout = 'IN' THEN 0 ELSE 1 END,
  'manual'::text as source_type,
  al.created_at
FROM attendance_logs al;
```

**Beneficios:**
- ✅ Query única para reportes
- ✅ Filtros por fuente de datos
- ✅ Análisis unificado

### FASE 3: Optimización de Frontend (📅)
**Cambios en AsistenciaDashboard.tsx:**
- [ ] Usar `asistencia_consolidada` en lugar de múltiples queries
- [ ] Eliminar llamadas innecesarias a Render
- [ ] Caché mejorada con React Query
- [ ] Vistas específicas por método (si es necesario)

### FASE 4: Mejora de UI/UX (📅)
- [ ] Panel resumen que muestre ambos métodos
- [ ] Filtros avanzados (fecha rango, profesional, centro, método)
- [ ] Reportes unificados
- [ ] Visualizaciones (gráficos de asistencia)
- [ ] Alertas de inconsistencias

### FASE 5: Validaciones y Constraints (📅)
- [ ] Agregar RLS policies si es necesario
- [ ] Foreign key constraints en mapeos
- [ ] Trigger para auditoría automática
- [ ] Validación de duplicados

---

## 🔧 TABLAS CLAVE A REVISAR/ACTUALIZAR

### 1. `asistencia_fichajes` 
**Estado:** Existe, recibe datos de Render  
**Necesario:** 
- Confirmar que sync_with_supabase.py pusha datos correctamente
- Validar campos obligatorios
- Agregar índices en profesional_id, centro_salud_id

### 2. `attendance_logs`
**Estado:** Existe, recibe datos de importación manual  
**Necesario:**
- Revisar si es redundante con asistencia_fichajes
- Mantener para histórico de importación (source tracking)

### 3. `empleado_dispositivo_map`
**Estado:** Existe, es el corazón del mapeo  
**Necesario:**
- Validar que todos los dispositivos tengan al menos un mapeo
- Confirmar relación con profesionales_sanitarios
- Revisar que en_no sea único por dispositivo (si es necesario)

### 4. `asistencia_dispositivos`
**Estado:** Existe, información de dispositivos  
**Necesario:**
- Validar que cada dispositivo esté asignado a un centro
- Mantener sincronización con Render

### 5. **NUEVA:** `asistencia_auditoria` (CREAR)
```sql
CREATE TABLE asistencia_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fichaje_id uuid REFERENCES asistencia_fichajes(id),
  accion text,
  usuario_id uuid REFERENCES auth.users(id),
  datos_antes jsonb,
  datos_despues jsonb,
  created_at timestamptz DEFAULT now()
);
```

---

## 📈 MÉTRICAS Y REPORTES AFECTADOS

### Reportes Actuales Que Pueden Fallar

1. **Asistencia Mensual por Centro**
   - Combina: `asistencia_fichajes` + `attendance_logs`
   - Problema: Puede contar duplicados o perder registros

2. **Puntualidad por Profesional**
   - Depende: `asistencia_fichajes` + `turnos_biometricos`
   - Problema: Si mapeo EnNo incompleto, no calcula correctamente

3. **Reportes de Guardia**
   - Combina: `guardias` + `asistencia_fichajes`
   - Problema: Inconsistencias de timestamp

---

## 🔍 COMPONENTES FRONTEND AFECTADOS

**Archivo:** `src/components/asistencia/`

| Componente | Estado | Problema | Solución |
|------------|--------|---------|----------|
| `AsistenciaDashboard.tsx` | Actual | Coordina múltiples queries | Usar view unificada |
| `ImportarFichajesPanel.tsx` | Actual | Solo importación manual | OK, mantener |
| `BiometricSyncPanel.tsx` | Conexión a Render | Innecesaria si datos en Supabase | Cambiar a mostrar datos de BD |
| `MetricasPanel.tsx` | Calcula métricas | Puede usar datos inconsistentes | Usar vista unificada |
| `ReportesPanel.tsx` | Genera reportes | Mismo problema que métricas | Usar vista unificada |

---

## 💾 DATOS DISPONIBLES PARA ANÁLISIS

**Registros en Supabase (actualmente):**
- `asistencia_fichajes`: ~830 registros
- `attendance_logs`: ~7 registros
- `empleado_dispositivo_map`: ~1 registro
- `turnos_biometricos`: ~3 registros
- `cuadrantes_biometricos`: ~830 registros

**Registros en FlaskProject BD local:**
- `records`: ~4 registros
- `device`: ~1 registro
- `person`: ~0 registros

**Observación:** Datos biométricos online están principalmente en Supabase `asistencia_fichajes`, pero la sincronización desde Render parece parcial.

---

## 🚀 PRÓXIMOS PASOS (Por Orden de Prioridad)

1. **Crear Vista SQL Unificada** (1-2 horas)
   - Consolidar ambas fuentes en una sola vista
   - Agregar campo `source_type` para tracking

2. **Validar Sincronización Render→Supabase** (1-2 horas)
   - Revisar que sync_with_supabase.py funcione correctamente
   - Confirmar que `asistencia_fichajes` reciba datos completos
   - Revisar logs de Render

3. **Refactorizar Queries en Frontend** (2-3 horas)
   - Actualizar componentes para usar vista unificada
   - Eliminar lógica de combinación en frontend
   - Mejorar performance con índices

4. **Mejora UI/UX** (4-6 horas)
   - Dashboard mejorado con ambos métodos visibles
   - Filtros avanzados
   - Visualizaciones (charts)

5. **Agregar Auditoría** (1-2 horas)
   - Tabla de auditoría
   - Triggers para registro automático

6. **Testing e Iteración** (2-3 horas)
   - Validar reportes
   - Revisar inconsistencias
   - Ajustes finales

---

## 📝 NOTAS IMPORTANTES

- **Render está en uso:** El servicio Python en Render (FlaskProject) es CRÍTICO para recibir datos biométricos online
- **Sincronización es opcional:** sync_with_supabase.py NO está activado por defecto en app.py
- **Ambos métodos son válidos:** Importación manual sigue siendo necesaria para centros sin dispositivos
- **Datos Obsoletos:** Hay muy pocos registros en BD local de Flask, casi todo está en Supabase
- **Performance:** Con vista unificada, los reportes serán más rápidos

---

## 📞 PREGUNTAS CLAVE A RESPONDER

1. ¿Cuál es la cadencia de sincronización esperada desde Render?
2. ¿Todos los dispositivos biométricos están en Render o hay otros orígenes?
3. ¿Se espera que importación manual continúe indefinidamente?
4. ¿Hay restricciones de permisos (RLS) que deba considerar?
5. ¿Cuál es el volumen esperado de registros por día?

---

## 📌 RESUMEN TÉCNICO

**Tabla de Componentes:**

```
┌──────────────────────┐
│  DISPOSITIVOS        │
│  Biométricos Online  │
└──────────┬───────────┘
           │
    ┌──────▼──────────────┐
    │  Python/Flask       │
    │  (FlaskProject)     │
    │  - WebSocket        │
    │  - HTTP /pub/api    │
    │  - sync handler     │
    └──────┬──────────────┘
           │
    ┌──────▼──────────────┐
    │  SUPABASE           │
    │  PostgreSQL         │
    │                     │
    │ ┌─────────────────┐ │
    │ │ asistencia_     │ │
    │ │ fichajes (830)  │ │
    │ │                 │ │
    │ │ attendance_logs │ │
    │ │ (7)             │ │
    │ │                 │ │
    │ │ VISTA           │ │
    │ │ asistencia_     │ │
    │ │ consolidada     │ │
    │ └────────┬────────┘ │
    └──────────┼──────────┘
               │
    ┌──────────▼──────────┐
    │  REACT DASHBOARD    │
    │  AsistenciaDashboard│
    │  + Componentes      │
    │  + Reportes         │
    │  + Métricas         │
    └─────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear y validar vista `asistencia_consolidada`
- [ ] Revisar sincronización Python→Supabase
- [ ] Actualizar queries en frontend
- [ ] Implementar auditoría
- [ ] Mejorar UI/UX
- [ ] Testing completo
- [ ] Documentar APIs
- [ ] Capacitar usuarios
- [ ] Monitor en producción
- [ ] Optimizar índices según uso real

---

**Documento generado:** 2025-01-XX  
**Estado:** Análisis Completo  
**Próximo:** Implementación de Soluciones
