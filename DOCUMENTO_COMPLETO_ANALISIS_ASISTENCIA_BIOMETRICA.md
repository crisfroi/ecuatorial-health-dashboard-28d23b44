# 📊 DOCUMENTO COMPLETO: SISTEMA ASISTENCIA BIOMÉTRICA

**Fecha:** 2025-01-16  
**Usuario:** JUAN FROILAN RAMOS NABAMA  
**Estado:** Análisis + Plan de Implementación  
**Objetivo:** Entender flujos de datos, mapeo de dispositivos y turnos | Implementar mejoras  

---

## 📋 TABLA DE CONTENIDOS

1. [Diferencia entre tablas](#1-diferencia-entre-tablas)
2. [Cómo llegan los datos al dashboard](#2-cómo-llegan-los-datos-al-dashboard)
3. [Mapeo de dispositivos SN → Nombre](#3-mapeo-de-dispositivos)
4. [Problema del botón actualizar](#4-problema-del-botón-actualizar)
5. [Turnos: Render vs Sistema Actual](#5-turnos-render-vs-sistema-actual)
6. [WebSocket Protocol](#6-websocket-protocol)
7. [Manejo eficiente de créditos](#7-manejo-de-créditos)
8. [Plan de implementación](#8-plan-de-implementación)

---

## 1. DIFERENCIA ENTRE TABLAS

### Tabla: `asistencia_fichajes`

**Propósito:** Almacenar registros de asistencia biométrica online (en tiempo real)

**Origen:** Python/Flask en Render (WebSocket)

**Registro:** 13 actualmente

**Estructura:**
```sql
asistencia_fichajes {
  id: UUID                    -- PK, identificador único
  device_sn: text            -- Serial number del dispositivo
  enroll_id: bigint          -- ID de enrolamiento del empleado (en el dispositivo)
  profesional_id: UUID       -- FK a profesionales_sanitarios (mapeado)
  time_local: timestamptz    -- Fecha/hora del fichaje
  inout: smallint            -- 0=IN (entrada), 1=OUT (salida)
  mode: smallint             -- 1=Huella, 2=Rostro, 4=RFID
  event: smallint            -- 0=Normal, 1=Forzado
  temperature: numeric       -- Temperatura corporal (36.5 = 3650)
  image_url: text            -- URL de foto capturada
  raw_index: integer         -- Índice en dispositivo
  centro_salud_id: UUID      -- FK a centros_salud (para filtros)
  created_at: timestamptz    -- Timestamp de creación
}
```

**Características:**
- ✅ Datos en tiempo real
- ✅ Incluye datos biométricos (temperatura, foto)
- ✅ Timestamp original del dispositivo (NO de recepción)
- ⚠️ Requiere mapeo manual: enroll_id → profesional_id
- ❌ Campo `device_sn` no está mapeado a nombre del dispositivo

---

### Tabla: `attendance_logs`

**Propósito:** Almacenar registros de importación manual (.TXT/.XLS)

**Origen:** Dashboard UI (ImportarFichajesPanel.tsx)

**Registros:** 7 actualmente

**Estructura:**
```sql
attendance_logs {
  id: UUID                   -- PK
  id_profesional: UUID       -- FK a profesionales_sanitarios (directo)
  id_dispositivo: UUID       -- FK a dispositivos
  en_no: varchar             -- EnNo del empleado (string)
  inout: inout_type          -- 'IN' o 'OUT'
  mode: varchar              -- Modo de registro
  fecha_hora: timestamptz    -- Fecha/hora de la importación
  raw_line: text             -- Línea original del archivo
  source_file: varchar       -- Nombre del archivo importado
  tm_no: varchar             -- Número del dispositivo (opcional)
  created_at: timestamptz    -- Timestamp de creación
}
```

**Características:**
- ✅ Mapeo directo a profesional (id_profesional)
- ✅ Vinculado a dispositivo específico
- ✅ Traceabilidad del archivo origen
- ❌ NO tiene datos biométricos (temp, foto)
- ⚠️ EnNo es string, no número

---

### Tabla: `asistencia_consolidada` (VISTA)

**Propósito:** Vista unificada de AMBAS fuentes

**Creada:** Ya existe (migración anterior)

**Estructura (simplificada):**
```sql
asistencia_consolidada {
  -- De asistencia_fichajes
  id: UUID
  profesional_id: UUID
  centro_salud_id: UUID
  enroll_id: bigint
  numero_enno: varchar
  fecha_hora: timestamptz
  inout: text               -- 'IN' o 'OUT' normalizado
  mode: smallint
  event: smallint
  temperature: numeric
  image_url: text
  raw_line: text
  source_type: text         -- *** 'biometrico' o 'manual' ***
  created_at: timestamptz
}
```

**Beneficio:**
- ✅ Una sola query para ambas fuentes
- ✅ Campo `source_type` para filtrar por origen
- ✅ Ordena cronológicamente sin importar fuente

---

### COMPARATIVA VISUAL

```
┌──────────────────────────────────────────────────────────────┐
│                     FLUJO DE DATOS                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ MÉTODO 1: BIOMÉTRICO ONLINE                                  │
│ ───────────────────────────────                              │
│ Dispositivo → Python/Flask (Render)                          │
│      ↓                                                        │
│ WebSocket: /pub/chat                                         │
│      ↓                                                        │
│ Registro en: records (BD local)                              │
│      ↓                                                        │
│ APScheduler (cada 5 min):                                    │
│   sync_with_supabase.py →  asistencia_fichajes              │
│      ↓                                                        │
│ Dashboard lee: asistencia_fichajes                           │
│      ↓                                                        │
│ VISTA: asistencia_consolidada (fuente='biometrico')         │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ MÉTODO 2: IMPORTACIÓN MANUAL (.TXT)                          │
│ ────────────────────────────────                             │
│ Usuario carga archivo → ImportarFichajesPanel.tsx            │
│      ↓                                                        │
│ Parser (CSV/TXT) → Extrae: EnNo, IN/OUT, Dispositivo        │
│      ↓                                                        │
│ Mapeo: empleado_dispositivo_map (EnNo → profesional)        │
│      ↓                                                        │
│ Inserta en: attendance_logs                                  │
│      ↓                                                        │
│ VISTA: asistencia_consolidada (fuente='manual')             │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ CONSUMO EN DASHBOARD                                         │
│ ──────────────────                                           │
│ AsistenciaDashboard.tsx                                      │
│      ↓                                                        │
│ Query: asistencia_consolidada (con filtros)                 │
│      ↓                                                        │
│ Muestra:  TODOS los fichajes sin importar origen             │
│           + Campo source_type para distinguir                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. CÓMO LLEGAN LOS DATOS AL DASHBOARD

### PASO A PASO: Registro Biométrico Online

```
[09:15:30] Empleado ficha entrada en dispositivo (huella)
    ↓
[09:15:30] Dispositivo detecta y almacena en memoria
    ↓
[09:15:31] Dispositivo envía vía WebSocket:
    {
      "cmd": "sendlog",
      "sn": "ZK001",
      "count": 1,
      "record": [{
        "enrollid": 12345,
        "time": "2025-01-16 09:15:30",
        "inout": 0,
        "mode": 2,
        "temp": 3650
      }]
    }
    ↓
[09:15:31] Python/Flask recibe en: /pub/chat (WebSocket)
    ↓
[09:15:32] Procesa en: app.py → insert_record2()
    ↓
[09:15:32] Inserta en BD local: records table
    ↓
[09:15:35] APScheduler (cada 5 min) → sync_with_supabase.py
    ↓
[09:16:00] Verifica datos en: records
    ↓
[09:16:01] Busca mapeo: empleado_dispositivo_map
    enroll_id (12345) → profesional_id (UUID)
    ↓
[09:16:01] Enriquece registro:
    {
      device_sn: "ZK001",
      enroll_id: 12345,
      profesional_id: "uuid-del-profesional",
      time_local: "2025-01-16 09:15:30Z",
      inout: 0,
      mode: 2,
      temperature: 36.5,
      centro_salud_id: "uuid-del-centro"  ← De profesional
    }
    ↓
[09:16:02] Inserta en Supabase: asistencia_fichajes
    ↓
[09:16:03] Dashboard hace query a: asistencia_consolidada
    ↓
[09:16:03] Muestra en tabla con:
    - Nombre del profesional (JOIN a profesionales_sanitarios)
    - Nombre del centro (JOIN a centros_salud)
    - Nombre del dispositivo (JOIN a dispositivos por SN) ← FALTA
    - Source_type: 'biometrico'
    - Temperatura: 36.5°C
    - Foto: enlace a imagen

[TOTAL: ~45 segundos desde fichaje a visualización]
```

### PASO A PASO: Importación Manual (.TXT)

```
[Usuario en Dashboard]
    ↓
ImportarFichajesPanel.tsx → Selecciona:
    - Centro de salud
    - Dispositivo
    - Archivo .TXT
    ↓
[parseTxtPreview()]
    ↓
Parsea líneas:
    "12345,IN,2025-01-16 10:00:00,..."
    ↓
Busca en: empleado_dispositivo_map
    en_no=12345 → profesional_id, id_dispositivo
    ↓
Valida mapeo (si no existe = ERROR)
    ↓
Crea registro:
    {
      id_profesional: "uuid-profesional",
      id_dispositivo: "uuid-dispositivo",
      en_no: "12345",
      inout: "IN",
      fecha_hora: "2025-01-16 10:00:00Z",
      raw_line: "línea original"
    }
    ↓
[useAsistencia.importFile()]
    ↓
Inserta en: attendance_logs
    ↓
Dashboard query: asistencia_consolidada
    ↓
Muestra fichaje con:
    - Source_type: 'manual'
    - NO tiene temperatura/foto (NULL)
    - Nombre profesional: si está mapeado
    - Nombre dispositivo: si está mapeado

[TOTAL: ~2-3 segundos desde carga a visualización]
```

---

## 3. MAPEO DE DISPOSITIVOS

### PROBLEMA ACTUAL

**Tabla `dispositivos`:**
```
id: UUID
nombre: text           ← ✅ Existe (Ej: "Dispositivo Principal Piso 2")
tm_no: integer        ← Identificador en sistema
centro_salud_id: UUID
activo: boolean
```

**Tabla `asistencia_fichajes`:**
```
device_sn: text       ← Serial number del dispositivo (Ej: "ZK001")
```

**Problema:** No hay relación directa entre `device_sn` (en asistencia_fichajes) y `nombre` (en dispositivos)

**Por qué importa:**
1. Dashboard muestra "ZK001" (SN) en lugar de "Dispositivo Principal Piso 2" (nombre)
2. Usuarios no saben qué dispositivo es cuál
3. Dificultad para mapear nuevos dispositivos

---

### SOLUCIÓN: Agregar campo a `dispositivos`

**Migración:**
```sql
ALTER TABLE dispositivos 
ADD COLUMN device_sn VARCHAR(50) UNIQUE;

-- Actualizar el registro existente:
UPDATE dispositivos 
SET device_sn = 'ZK001' 
WHERE nombre = 'Dispositivo Principal Piso 2';
```

**Luego, en asistencia_fichajes, crear índice:**
```sql
CREATE INDEX idx_asistencia_fichajes_device_sn 
ON asistencia_fichajes(device_sn);
```

**En componente, hacer JOIN:**
```typescript
const fichajeConDispositivo = await supabase
  .from('asistencia_fichajes')
  .select(`
    *,
    dispositivos!inner(nombre)  -- JOIN para obtener nombre
  `)
  .eq('device_sn', dispositivos.device_sn);

// Resultado: 
// {
//   device_sn: "ZK001",
//   dispositivos: { nombre: "Dispositivo Principal Piso 2" }
// }
```

---

### MAPEO MANUAL vs AUTOMÁTICO

#### OPCIÓN A: Mapeo Manual (Actualmente)

**En DispositivosPanel.tsx:**

```typescript
function handleAddDevice(values) {
  // Usuario ingresa:
  // - Nombre: "Terminales Acceso Urgencias"
  // - SN: "ZK002" ← SE INGRESA MANUALMENTE
  // - Centro: "Hospital Central"

  const newDevice = {
    nombre: values.nombre,
    device_sn: values.sn,          // ← Manual
    centro_salud_id: values.centroId,
    activo: true
  };

  await supabase.from('dispositivos').insert(newDevice);
}
```

**Ventajas:**
- ✅ Control total
- ✅ Se puede renombrar en cualquier momento

**Desventajas:**
- ❌ Error humano (tipear SN incorrecto)
- ❌ Dispositivo no registra se queda sin mapeo

---

#### OPCIÓN B: Mapeo Automático desde Render (RECOMENDADO)

**Flujo:**
```
1. Dispositivo conecta a Render:
   {
     "cmd": "reg",
     "sn": "ZK002",
     "pushver": "3.1.8"
   }

2. Python/Flask (app.py):
   - Detecta nuevo SN
   - Crea automáticamente en: dispositivos
   - Con nombre genérico: "Dispositivo ZK002 (Pendiente Asignación)"

3. Usuario en Dashboard:
   - Ve dispositivo pendiente
   - Click: Editar
   - Cambia nombre a: "Terminales Acceso Urgencias"
   - Asigna centro
   - Guarda
```

**Implementación (Python):**
```python
# En app.py - función que procesa "reg"
def handle_registration(sn):
    # Buscar en Supabase
    existing = supabase.table('dispositivos').select('*').eq('device_sn', sn).execute()
    
    if not existing.data:
        # No existe → crear automáticamente
        new_device = {
            'device_sn': sn,
            'nombre': f'Dispositivo {sn} (Pendiente Asignación)',
            'activo': True
        }
        supabase.table('dispositivos').insert(new_device).execute()
        log(f"Nuevo dispositivo registrado: {sn}")
```

**Ventajas:**
- ✅ Sin errores de tipeo
- ✅ Sincronización automática
- ✅ Dispositivos descubiertos al conectar

**Desventajas:**
- ❌ Requiere lógica extra en Python
- ❌ BD puede llenarse de dispositivos sin usar

---

### RECOMENDACIÓN

**Usar OPCIÓN B (Automática) + Manual:**

1. **Primera ejecución:** Dispositivo conecta → Se crea automáticamente en Supabase
2. **Personalización:** Usuario renombra y asigna centro en el dashboard
3. **Mantener actualizado:** Si dispositivo desconecta > 7 días → marcar como inactivo

---

## 4. PROBLEMA DEL BOTÓN "ACTUALIZAR"

### Síntoma

Usuario hace clic en botón "Actualizar" en AsistenciaDashboard → No muestra todos los fichajes consolidados

### Causa

**Problema 1: Cache de React Query**
```typescript
// En useAsistenciaConsolidada.ts
const query = useQuery({
  queryKey: ['asistencia-consolidada', filtros],
  queryFn: async () => {
    // Query a asistencia_consolidada
  },
  staleTime: 60_000,  // ← Mantiene datos 1 minuto sin refetch
});
```

**Solución:**
```typescript
// Agregar función de refetch manual
const { refetch } = useAsistenciaConsolidada(filtros);

// En botón:
<Button onClick={() => refetch()}>
  Actualizar
</Button>
```

**Problema 2: Vista no se refresca con inserciones**
```sql
-- La vista asistencia_consolidada depende de:
-- - asistencia_fichajes (actualizada cada 5 min)
-- - attendance_logs (actualizada inmediatamente)

-- Si la vista tiene timestamp incorrecto, no mostrará datos nuevos
```

**Solución:** Verificar que APScheduler esté activo en Render

---

## 5. TURNOS: RENDER VS SISTEMA ACTUAL

### SISTEMA ACTUAL (Supabase)

**Tablas:**

1. **turnos_biometricos** (5 registros)
```sql
turnos_biometricos {
  id: UUID
  nombre_turno: text          -- Ej: "Mañana 08-16"
  hora_inicio: time           -- 08:00:00
  hora_fin: time              -- 16:00:00
  tolerancia_minutos: int     -- 5 min antes/después
  tipo: text                  -- 'diurno', 'nocturno', 'festivo'
  centro_salud_id: UUID       -- Qué centro lo usa
  activo: boolean
}
```

2. **cuadrantes_biometricos** (830 registros)
```sql
cuadrantes_biometricos {
  id: UUID
  id_profesional: UUID        -- Quién
  turno_id: UUID              -- Qué turno
  fecha: date                 -- Cuándo (diario)
  centro_salud_id: UUID
}
```

3. **horarios_base_profesional** (3 registros)
```sql
horarios_base_profesional {
  id: UUID
  id_profesional: UUID        -- Quién
  turno_id: UUID              -- Qué turno (planilla)
  dia_semana: int             -- 1-7 (lunes-domingo)
  vigencia_desde: date        -- Desde cuándo
  vigencia_hasta: date        -- Hasta cuándo
  centro_salud_id: UUID
}
```

**Jerarquía:**
```
┌─────────────────────────────┐
│ ¿Cuál es el turno del prof? │
└──────────┬──────────────────┘
           │
           ▼
    ┌─────────────┐
    │ CUADRANTE   │  ← Más específico (diario)
    │ DIARIO      │
    │ (830 rec)   │
    └─────────────┘
           │
        NO EXISTE
           │
           ▼
    ┌──────────────┐
    │ HORARIO BASE │  ← General (semanal)
    │ (3 rec)      │
    └──────────────┘
           │
        NO EXISTE
           │
           ▼
        ERROR
     (Sin turno)
```

**Ventajas:**
- ✅ Control granular (día a día)
- ✅ Permite cambios ad-hoc
- ✅ Flexible para permisos/incapacidades

**Desventajas:**
- ❌ Requiere actualizar 830 registros si cambia horario base
- ❌ Complejidad en cálculos de asistencia

---

### SISTEMA RENDER (Python/Flask)

**Tablas locales (no en Supabase):**

1. **turnos** (no mapeado a Supabase)
```python
# En FlaskProject/Models/Turnos.py
class Turnos(Base):
    __tablename__ = 'turnos'
    
    id: int PK
    nombre: str           -- Ej: "T01"
    hora_inicio: time
    hora_fin: time
    ...
```

2. **cuadrantes** (no mapeado a Supabase)
```python
class Cuadrantes(Base):
    __tablename__ = 'cuadrantes'
    
    id: int PK
    enroll_id: int        -- EnNo del empleado (NO UUID)
    turno_id: int
    fecha: date
    ...
```

3. **Comunicación con dispositivo** (via WebSocket)
```
Dashboard (Supabase) 
    ↓
Python/Flask (Render)
    ↓
insert_command()
    ↓
machine_command table
    ↓
SendOrderJob
    ↓
WebSocket → Dispositivo
```

**Problema:**
- ❌ Turnos duplicados en 2 sistemas (inconsistencia)
- ❌ Enroll_id (int) vs profesional_id (UUID)
- ❌ Cambios en Render NO se sincronizan a Supabase

---

### FLUJO ACTUAL DE TURNOS EN RENDER

```
Dispositivo almacena:
├─ Turnos → turnos table (local)
├─ Cuadrante diario → cuadrantes table (local)
└─ Asistencia → records table (local)

Sync cada 5 min:
└─ records → Supabase.asistencia_fichajes
   (Pero NO syncs turnos ni cuadrantes)

Dashboard intenta:
├─ Leer turnos desde Supabase
├─ Comparar con asistencia_fichajes
└─ Calcular puntualidad/faltas
```

---

### COMUNICACIÓN WEBSOCKET PARA TURNOS

**Comando: Enviar turno al dispositivo**

```
Dashboard crea turno en Supabase:
{
  nombre_turno: "Mañana 08-16",
  hora_inicio: "08:00",
  hora_fin: "16:00"
}

Python/Flask detecta (cada 5 min):
├─ Lee desde Supabase: turnos_biometricos
├─ Compara con BD local: turnos
├─ Si es nuevo:
│  └─ Inserta localmente
│  └─ Crea comando en machine_command:
│     {
│       "cmd": "setturno",
│       "turno_id": "AUTO_ID",
│       "nombre": "Mañana 08-16",
│       "hora_inicio": "08:00",
│       "hora_fin": "16:00"
│     }

SendOrderJob (cada 30s):
├─ Lee machine_command
├─ Busca dispositivo conectado (WebSocket)
└─ Envía comando:
   {
     "cmd": "setturno",
     ...
   }

Dispositivo recibe:
├─ Parsea comando
├─ Almacena en memoria
├─ Responde OK
└─ Usa para comparar asistencia
```

---

### RECOMENDACIÓN: Unificar Turnos

**Crear tabla única en Supabase:**

```sql
CREATE TABLE turnos_maestros (
  id UUID PRIMARY KEY,
  nombre_turno TEXT,
  hora_inicio TIME,
  hora_fin TIME,
  tolerancia_minutos INT DEFAULT 5,
  tipo TEXT CHECK (tipo IN ('diurno', 'nocturno', 'festivo')),
  centro_salud_id UUID REFERENCES centros_salud(id),
  dispositivo_id UUID REFERENCES dispositivos(id),  -- Opcional
  sync_a_dispositivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Flujo:**
1. Usuario crea turno en Supabase (Dashboard)
2. APScheduler detecta
3. Python inserta en BD local (opcional)
4. Python envía comando al dispositivo vía WebSocket
5. Dispositivo almacena
6. Al leer asistencia, dispositivo usa turno

---

## 6. WEBSOCKET PROTOCOL

### Resumen de Protocolo

**Endpoint:**
```
ws://render-url:puerto/pub/chat
```

**Conexión Persistente:**
- Se abre al encender dispositivo
- Permanece abierta TODO EL DÍA
- NO se cierra entre mensajes

**Heartbeat (cada 60s):**
```json
{
  "cmd": "checklive",
  "sn": "ZK001"
}
```

**Envío de Fichajes (inmediato):**
```json
{
  "cmd": "sendlog",
  "sn": "ZK001",
  "count": 1,
  "record": [{
    "enrollid": 12345,
    "time": "2025-01-16 09:15:30",
    "inout": 0,
    "mode": 2,
    "event": 0,
    "temp": 3650
  }]
}
```

**Respuesta servidor:**
```json
{
  "ret": "sendlog",
  "result": true,
  "count": 1,
  "cloudtime": "2025-01-16 09:15:31"
}
```

---

### Almacenamiento Offline

**Si dispositivo SIN red:**
```
Fichaje → Memoria flash (hasta 100,000)
           ↓
        ESPERA red
           ↓
        Reconecta WebSocket
           ↓
        Envía TODO el backlog
```

**NO se pierden datos** incluso con cortes de energía.

---

### Sincronización Eficiente (cada 5 min)

**En lugar de automático:**
```
Dashboard pide sync cada 5 min:
└─ INSERT en machine_command:
   {
     "cmd": "getnewlog",  -- Solo registros nuevos
     "sn": "ZK001"
   }

SendOrderJob:
└─ Lee y envía vía WebSocket

Dispositivo responde:
└─ Envía solo registros desde última consulta
```

**Ventajas:**
- ✅ No sobrecarga dispositivo
- ✅ Control desde servidor
- ✅ Menor consumo de batería

---

## 7. MANEJO DE CRÉDITOS

### ¿Por qué es importante?

En Builder.io, cada acción del LLM consume créditos. Para esta implementación:

**Acciones que consumen créditos:**
1. Leer/analizar archivos MD existentes ✅ HECHO
2. Escribir nuevo código (componentes, hooks, migraciones)
3. Revisar y debuggear
4. Testing
5. Optimizaciones

**Acciones que NO consumen:**
- Lectura de código (grep, glob)
- Consultas a BD
- Análisis de documentación
- Planning

---

### ESTRATEGIA DE CRÉDITOS

**Fase 1: Análisis (COMPLETO - 2% créditos)**
- [✅] Leer documentos existentes
- [✅] Entender arquitectura
- [✅] Analizar DB
- [✅] Este documento

**Fase 2: Implementación (Según usuario)**
- [ ] Agregar campo `device_sn` a `dispositivos`
- [ ] Crear mapeo automático en Python
- [ ] Actualizar vista consolidada
- [ ] Corregir JOIN para dispositivos
- [ ] Actualizar componentes
- [ ] Testing

**Estimado Total:**
- Análisis: ✅ Completado (0 créditos restantes)
- Implementación: ~100-150 créditos (si hacer todo)
- **Recomendación:** Empezar por mapeo de dispositivos (30 créditos)

---

### PRIORIDAD POR IMPACTO/ESFUERZO

| Tarea | Créditos | Impacto | Riesgo | Prioridad |
|-------|----------|---------|--------|-----------|
| Mapeo dispositivos (SN → nombre) | 30 | ALTO | BAJO | 🔴 P0 |
| Botón actualizar (staleTime) | 10 | ALTO | BAJO | 🔴 P0 |
| Unificar turnos en Supabase | 50 | MEDIO | MEDIO | 🟡 P1 |
| Sync automático de turnos a dispositivo | 60 | MEDIO | ALTO | 🟡 P1 |
| Mostrar nombre centro (no ID) | 10 | ALTO | BAJO | 🔴 P0 |
| Auditoría completa de turnos | 40 | BAJO | BAJO | 🟢 P2 |

---

## 8. PLAN DE IMPLEMENTACIÓN

### FASE 1: Mapeo de Dispositivos (30 créditos)

**Cambios:**

1. **Migración SQL:**
```sql
ALTER TABLE dispositivos 
ADD COLUMN device_sn VARCHAR(50) UNIQUE;

CREATE INDEX idx_dispositivos_device_sn ON dispositivos(device_sn);
```

2. **Python (Render):**
```python
# En app.py - función handle_registration()
def register_device(sn):
    # Actualizar last_seen_at
    # Si no existe device_sn en Supabase:
    #   - Crear automáticamente
    # Si existe:
    #   - Actualizar last_seen_at
```

3. **React Hook:**
```typescript
// Actualizar useAsistenciaConsolidada.ts
const { data } = useQuery({
  queryFn: async () => {
    const { data } = await supabase
      .from('asistencia_consolidada')
      .select(`
        *,
        dispositivos!inner(nombre, device_sn)
      `)
      .eq('device_sn', filtros.deviceSn);
    return data;
  }
});
```

4. **Componente:**
```typescript
// En tabla de asistencia:
{
  header: 'Dispositivo',
  cell: (row) => row.dispositivos?.nombre || row.device_sn
}
```

---

### FASE 2: Botón Actualizar (10 créditos)

**Cambios:**

```typescript
// En AsistenciaDashboard.tsx
const { data, refetch } = useAsistenciaConsolidada(filtros);

// Agregar función refresh
const handleRefresh = async () => {
  setLoading(true);
  await refetch();
  setLoading(false);
  toast({ title: 'Datos actualizados' });
};

// Botón
<Button onClick={handleRefresh} loading={loading}>
  <RefreshCw /> Actualizar
</Button>
```

---

### FASE 3: Mostrar nombre Centro (10 créditos)

**Cambios:**

```typescript
// En vista consolidada o componente
const { data } = await supabase
  .from('asistencia_consolidada')
  .select(`
    *,
    centros_salud!inner(nombre)
  `);

// Tabla
{
  header: 'Centro',
  cell: (row) => row.centros_salud?.nombre || 'N/A'
}
```

---

### FASE 4: Unificar Turnos (50 créditos)

**Cambios:**
- Crear tabla `turnos_maestros`
- Migrar datos de `turnos_biometricos`
- Actualizar Python para sync
- Actualizar componentes

---

### FASE 5: Testing y Deploy (30 créditos)

- Test unitario
- Test integración
- Validar en staging
- Deploy a producción

---

## RESUMEN EJECUTIVO

### Problemas Identificados

1. **Mapeo dispositivos incompleto** → Muestra "ZK001" en lugar de nombre
2. **Botón actualizar con cache** → No recarga datos
3. **Centro_salud_id como UUID** → Debe mostrar nombre
4. **Turnos duplicados** → En Render y Supabase sin sincronización
5. **Falta automatización** → Dispositivos nuevos requieren crear manual

### Soluciones Propuestas

| Problema | Solución | Impacto | Créditos |
|----------|----------|---------|----------|
| Dispositivos | Agregar device_sn + mapeo automático | ALTO | 30 |
| Botón actualizar | Cambiar staleTime a 0 + refetch manual | ALTO | 10 |
| Centros (nombres) | JOIN en query | ALTO | 10 |
| Turnos | Crear turnos_maestros + sync automático | MEDIO | 50 |
| WebSocket | Implementar getnewlog periódico | BAJO | 20 |

**TOTAL ESTIMADO: 120 créditos**

---

## PRÓXIMOS PASOS

1. **Confirmar:** ¿Cuál es la prioridad?
   - ¿Empezamos por mapeo de dispositivos (P0)?
   - ¿O primero unificar turnos (P1)?

2. **Testing:** ¿Hay ambiente staging para validar cambios?

3. **Creditos:** ¿Presupuesto disponible para implementación?

4. **Comunicación:**  ¿Necesitas que explique algo más?

---

**Documento preparado para implementación**

**Usuario:** JUAN FROILAN RAMOS NABAMA  
**Fecha:** 2025-01-16  
**Estado:** Listo para implementar Fase 1
