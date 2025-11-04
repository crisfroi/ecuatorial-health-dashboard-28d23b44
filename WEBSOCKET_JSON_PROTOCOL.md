# 📡 PROTOCOLO WEBSOCKET+JSON - DISPOSITIVOS BIOMÉTRICOS

**Fecha:** 2025-01-16  
**Versión:** 1.0  
**Sistema:** ZKTeco / Qiandao Cloud  

---

## 🎯 RESUMEN EJECUTIVO

Este documento describe el protocolo de comunicación WebSocket+JSON utilizado entre los dispositivos biométricos (terminales de huella/rostro) y el servidor Flask en Render.

**Características principales:**
- ✅ Conexión WebSocket **persistente** (no se cierra entre mensajes)
- ✅ Formato JSON para comandos bidireccionales
- ✅ Almacenamiento local en dispositivo cuando no hay red
- ✅ Sincronización automática al recuperar conexión
- ✅ Heartbeat/keepalive cada 60 segundos
- ✅ Comandos del servidor via cola `machine_command`

---

## 🔌 ENDPOINTS DISPONIBLES

### 1. WebSocket Principal
```
ws://[render-url]/pub/chat
```
- **Propósito:** Comunicación bidireccional en tiempo real
- **Protocolo:** WebSocket permanente
- **Formato:** JSON
- **Timeout:** 300 segundos sin actividad → reconexión automática

### 2. HTTP REST API (Alternativa)
```
POST https://[render-url]/pub/api
```
- **Propósito:** Comunicación sin WebSocket (fallback)
- **Protocolo:** HTTP POST con JSON body
- **Uso:** Dispositivos que no soportan WebSocket o conexiones intermitentes

---

## 📨 FLUJO DE COMUNICACIÓN

### A) Conexión Inicial (Registro del Dispositivo)

```
┌──────────────┐                              ┌──────────────┐
│  Dispositivo │                              │    Servidor  │
│  Biométrico  │                              │    (Flask)   │
└──────┬───────┘                              └──────┬───────┘
       │                                             │
       │  1. Establece WebSocket                     │
       │ ──────────────────────────────────────────> │
       │                                             │
       │  2. Envía comando "reg"                     │
       │  {                                          │
       │    "cmd": "reg",                            │
       │    "sn": "ABC123456",                       │
       │    "pushver": "3.1.8"                       │
       │  }                                          │
       │ ──────────────────────────────────────────> │
       │                                             │
       │                                             │ 3. Valida/Registra
       │                                             │    en tabla device
       │                                             │
       │  4. Responde OK                             │
       │  {                                          │
       │    "ret": "reg",                            │
       │    "result": true,                          │
       │    "cloudtime": "2025-01-16 10:30:45"       │
       │  }                                          │
       │ <────────────────────────────────────────── │
       │                                             │
       │  5. Conexión establecida                    │
       │     (WebSocket permanece ABIERTO)           │
       │                                             │
```

### B) Envío de Fichajes (Registros de Asistencia)

**Caso 1: Dispositivo CON red (online)**
```
Dispositivo detecta fichaje (huella/rostro/tarjeta)
     ↓
Almacena temporalmente en memoria local
     ↓
Envía inmediatamente via WebSocket:
{
  "cmd": "sendlog",
  "count": 1,
  "record": [{
    "enrollid": 12345,
    "time": "2025-01-16 09:30:00",
    "inout": 0,           // 0=IN, 1=OUT
    "mode": 2,            // 2=Rostro, 1=Huella, 4=RFID
    "event": 0,
    "temp": 3650          // 36.50°C × 100
  }]
}
     ↓
Servidor responde:
{
  "ret": "sendlog",
  "result": true,
  "count": 1,
  "cloudtime": "2025-01-16 09:30:02"
}
     ↓
Dispositivo ELIMINA registro de memoria local
(ya está sincronizado)
```

**Caso 2: Dispositivo SIN red (offline)**
```
Dispositivo detecta fichaje
     ↓
Almacena en memoria flash interna (persistente)
     ↓
NO puede enviar → ESPERA
     ↓
Cuando recupera red:
  1. Reconecta WebSocket
  2. Registra con "reg"
  3. Envía TODOS los registros pendientes con "sendlog"
     (puede ser batch de múltiples registros)
  4. Servidor confirma recepción
  5. Dispositivo elimina de memoria local
```

**IMPORTANTE:** El dispositivo mantiene una cola persistente de hasta **100,000 registros** en memoria flash. No se pierden datos si hay cortes de red.

### C) Heartbeat / Keepalive

Para mantener la conexión activa y detectar desconexiones:

```
Cada 60 segundos:

Dispositivo envía:
{
  "cmd": "checklive",
  "sn": "ABC123456"
}

Servidor responde:
{
  "ret": "checklive",
  "result": true,
  "cloudtime": "2025-01-16 10:31:00"
}

Si no hay respuesta en 5 intentos:
  → Dispositivo cierra y RECONECTA WebSocket
  → Reenvía "reg" para re-registrarse
```

### D) Comandos del Servidor al Dispositivo

El servidor puede enviar comandos al dispositivo a través de la conexión WebSocket establecida:

```python
# Servidor inserta comando en tabla machine_command
comando = {
  "cmd": "getalllog",
  "stn": true
}

# Job SendOrderJob detecta comando pendiente
# y lo envía via WebSocket al dispositivo

Dispositivo recibe y ejecuta:
{
  "cmd": "getalllog",
  "stn": true
}

Dispositivo responde con:
{
  "ret": "getalllog",
  "result": true,
  "count": 150,
  "record": [
    { ... registros ... }
  ]
}
```

---

## 🔄 SINCRONIZACIÓN CADA 5 MINUTOS

### Pregunta: ¿Cómo enviar datos cada 5 minutos sin cerrar WebSocket?

**Respuesta:**

El dispositivo **NO envía automáticamente** cada 5 minutos. El flujo es:

1. **WebSocket permanece ABIERTO** todo el tiempo (conexión persistente)
2. Dispositivo envía datos **inmediatamente** cuando:
   - Hay un fichaje nuevo
   - El servidor solicita logs via comando
   - Hay registros pendientes en cola offline

3. Si queremos sincronización periódica cada 5 minutos:

**Opción A: Comando Periódico desde Servidor**
```python
# En SendOrderJob o scheduler:
cada 5 minutos:
  for dispositivo in dispositivos_activos:
    insertar_comando_en_db({
      "cmd": "getnewlog",   # Solo nuevos registros
      "sn": dispositivo.sn
    })

# El dispositivo responde automáticamente
# con los registros nuevos desde última consulta
```

**Opción B: Configurar Dispositivo**
```json
// Comando para configurar push automático
{
  "cmd": "setdevinfo",
  "autopush": 1,          // Activar push automático
  "pushinterval": 300     // Cada 300 segundos (5 min)
}

// Dispositivo enviará "sendlog" cada 5 min
// sin necesidad de solicitud del servidor
```

**Recomendación:** Usar **Opción A** porque:
- ✅ Más control desde el servidor
- ✅ No consume batería del dispositivo
- ✅ Solo pide datos cuando realmente hay cambios
- ✅ No sobrecarga el servidor con pushes vacíos

---

## 📦 ESTRUCTURA DE DATOS COMPLETA

### Registro de Asistencia (sendlog)

```json
{
  "cmd": "sendlog",
  "sn": "ABC123456",
  "count": 2,           // Número de registros en batch
  "logindex": 1500,     // Índice del último registro en dispositivo
  "record": [
    {
      "enrollid": 12345,              // ID del empleado
      "time": "2025-01-16 09:30:00",  // Fecha/hora local del dispositivo
      "inout": 0,                     // 0=Entrada, 1=Salida
      "mode": 2,                      // 1=Huella, 2=Rostro, 4=RFID, 10=Contraseña
      "event": 0,                     // 0=Normal, 1=Forzado, 2=Puerta abierta
      "temp": 3650,                   // Temperatura × 100 (36.50°C)
      "image": "base64..."            // Opcional: foto capturada
    },
    {
      "enrollid": 67890,
      "time": "2025-01-16 09:31:15",
      "inout": 1,
      "mode": 1,
      "event": 0,
      "temp": 3640
    }
  ]
}
```

### Respuesta del Servidor

```json
{
  "ret": "sendlog",
  "result": true,
  "count": 2,
  "logindex": 1500,
  "cloudtime": "2025-01-16 09:31:20"
}
```

---

## 🗄️ ALMACENAMIENTO Y PERSISTENCIA

### En el Dispositivo (Offline Storage)

```
┌──────────────────────────────────────┐
│  Dispositivo Biométrico              │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Memoria Flash (persistente)    │ │
│  │  - Capacidad: 100,000 registros │ │
│  │  - FIFO: elimina más antiguos   │ │
│  │  - Sobrevive a reinicio         │ │
│  └────────────────────────────────┘ │
│                                      │
│  Cuando hay red:                     │
│  1. Envía lote de registros          │
│  2. Espera confirmación del servidor │
│  3. Elimina de memoria local         │
└──────────────────────────────────────┘
```

### En el Servidor (Flask → PostgreSQL)

```
┌──────────────────────────────────────┐
│  Servidor Flask (Render)             │
│                                      │
│  1. Recibe via WebSocket/HTTP        │
│     ↓                                │
│  2. Valida datos                     │
│     ↓                                │
│  3. Guarda en BD local:              │
│     tabla "record"                   │
│     ↓                                │
│  4. APScheduler sync cada 5 min:     │
│     sync_with_supabase.py            │
│     ↓                                │
│  5. Push a Supabase:                 │
│     tabla "asistencia_fichajes"      │
│     + enriquecimiento con mapping    │
│     (profesional_id, centro_id)      │
└──────────────────────────────────────┘
```

### En Supabase (Vista Consolidada)

```sql
-- Vista que unifica TODOS los métodos
asistencia_consolidada
  = asistencia_fichajes (biométrico online)
  UNION ALL
  = attendance_logs (importación manual TXT/XLS)

-- Ambos métodos se ven como una sola tabla
-- con campo "source_type" para distinguir origen
```

---

## ⏱️ LÍNEA DE TIEMPO Y CONSISTENCIA

### Pregunta: ¿Cómo se mantiene correcta la línea de tiempo?

**Respuesta:**

1. **Timestamp de origen:**
   - Cada registro usa la hora **local del dispositivo** (`time` field)
   - El dispositivo sincroniza su reloj con el servidor al registrarse (`cloudtime`)
   - La diferencia de timezone se normaliza en el servidor

2. **Orden de procesamiento:**
```
Dispositivo:
  09:30:00 → Fichaje A (enrollid 123, IN)
  09:31:15 → Fichaje B (enrollid 456, IN)
  09:35:20 → Fichaje C (enrollid 123, OUT)

Servidor recibe (puede llegar desordenado si offline):
  09:35:25 → Lote 1: [A, B, C]
  09:35:26 → Guarda en BD con timestamp ORIGINAL del dispositivo

Supabase query (siempre ordenado):
  SELECT * FROM asistencia_consolidada
  ORDER BY fecha_hora ASC
  
  Resultado:
  09:30:00 | 123 | IN  | biometrico
  09:31:15 | 456 | IN  | biometrico
  09:35:20 | 123 | OUT | biometrico
```

3. **Manejo de duplicados:**
```python
# En insert_record2() - Models/Records.py
# Se usa timestamp + enrollid + device_sn como clave única
# Si ya existe, se descarta (no se duplica)

# En Supabase (asistencia_fichajes):
# Constraint único en (enroll_id, time_local, device_sn)
# Previene inserciones duplicadas
```

4. **Importación manual vs Online:**
```
┌─────────────────────────────────────┐
│  Ambos métodos se integran en       │
│  asistencia_consolidada             │
│                                     │
│  Caso común:                        │
│  - 09:00-17:00 → Online (biométrico)│
│  - Dispositivo falla                │
│  - Admin importa .TXT manual        │
│  - 17:00-18:00 → Online recuperado  │
│                                     │
│  Vista consolidada muestra:         │
│  09:00 IN  (biométrico)             │
│  09:15 OUT (biométrico)             │
│  14:00 IN  (manual) ← importación   │
│  14:30 OUT (manual) ← importación   │
│  17:05 IN  (biométrico)             │
│                                     │
│  TODO en orden cronológico          │
│  sin importar la fuente             │
└─────────────────────────────────────┘
```

---

## 🛡️ MANEJO DE ERRORES Y RECONEXIONES

### Escenarios Comunes

**1. Red intermitente**
```
Dispositivo:
  - Detecta pérdida de conexión (timeout heartbeat)
  - Acumula registros en memoria local
  - Reintenta conexión cada 30 segundos
  - Al reconectar: envía todo el backlog

Servidor:
  - No hace nada especial
  - Recibe y procesa normalmente
  - Los timestamps son los originales del dispositivo
```

**2. Servidor caído (Render reinicio)**
```
Dispositivo:
  - No puede conectar WebSocket
  - Acumula registros localmente
  - Reintenta indefinidamente

Cuando servidor vuelve:
  - Dispositivo reconecta
  - Envía todo el backlog acumulado
  - Servidor procesa y sincroniza a Supabase
```

**3. Dispositivo sin energía**
```
Dispositivo:
  - Registros persisten en flash
  - Al reiniciar: reconecta automáticamente
  - Envía registros pendientes

IMPORTANTE:
  - NO se pierden datos
  - La memoria flash es no volátil
  - Sobrevive a cortes de energía
```

**4. Base de datos Supabase no disponible**
```
Servidor Flask:
  - Continúa recibiendo registros
  - Guarda en BD local (PostgreSQL en Render)
  - APScheduler reintenta sync cada 5 min
  - Cuando Supabase vuelve: sincroniza backlog
```

---

## 🔧 COMANDOS DISPONIBLES

### Del Dispositivo al Servidor

| Comando | Propósito | Frecuencia |
|---------|-----------|------------|
| `reg` | Registrar dispositivo | Al conectar |
| `sendlog` | Enviar fichajes | Inmediato o batch |
| `senduser` | Enviar datos de usuario | Al crear/modificar usuario |
| `checklive` | Heartbeat | Cada 60s |

### Del Servidor al Dispositivo

| Comando | Propósito | Uso |
|---------|-----------|-----|
| `getalllog` | Obtener TODOS los registros | Sincronización inicial |
| `getnewlog` | Obtener registros nuevos | Sincronización periódica |
| `getuserlist` | Lista de usuarios en dispositivo | Auditoría |
| `setuserinfo` | Registrar/actualizar usuario | Gestión de personal |
| `deleteuser` | Eliminar usuario | Baja de personal |
| `setdevinfo` | Configurar dispositivo | Cambios de configuración |
| `opendoor` | Abrir puerta | Control de acceso |
| `reboot` | Reiniciar dispositivo | Mantenimiento |

---

## 📊 EJEMPLO COMPLETO DE SESIÓN

```
[09:00:00] Dispositivo conecta
→ WebSocket abierto a ws://render-url/pub/chat

[09:00:01] Dispositivo envía:
{
  "cmd": "reg",
  "sn": "ZK001",
  "pushver": "3.1.8"
}

[09:00:02] Servidor responde:
{
  "ret": "reg",
  "result": true,
  "cloudtime": "2025-01-16 09:00:02"
}

[09:00:02] Conexión establecida (WebSocket PERMANECE ABIERTO)

[09:15:30] Empleado 12345 ficha entrada (huella dactilar)
[09:15:30] Dispositivo envía inmediatamente:
{
  "cmd": "sendlog",
  "sn": "ZK001",
  "count": 1,
  "record": [{
    "enrollid": 12345,
    "time": "2025-01-16 09:15:30",
    "inout": 0,
    "mode": 1,
    "event": 0,
    "temp": 3650
  }]
}

[09:15:31] Servidor responde:
{
  "ret": "sendlog",
  "result": true,
  "count": 1,
  "cloudtime": "2025-01-16 09:15:31"
}

[09:15:31] Dispositivo elimina registro de memoria local

[09:16:30] Heartbeat automático
{
  "cmd": "checklive",
  "sn": "ZK001"
}

[09:16:31] Servidor:
{
  "ret": "checklive",
  "result": true
}

... (WebSocket sigue abierto todo el día) ...

[18:00:00] Dispositivo se desconecta (fin de jornada)
[18:00:01] Servidor detecta desconexión
[18:00:01] Device.status = 0 (offline)

[06:00:00] (Día siguiente) Dispositivo vuelve a conectar
[06:00:01] Envía "reg" nuevamente
[06:00:02] Ciclo se repite
```

---

## 🚀 MEJORAS IMPLEMENTADAS (2025-01-16)

1. ✅ **Sincronización automática Flask → Supabase**
   - APScheduler cada 5 minutos
   - Enriquecimiento con profesional_id y centro_salud_id
   - Temperatura estandarizada a /100

2. ✅ **Vista consolidada `asistencia_consolidada`**
   - Unifica biométrico + manual
   - Campo `source_type` para distinguir origen
   - Queries optimizadas con índices

3. ✅ **Hook React `useAsistenciaConsolidada`**
   - Filtros avanzados (centro, profesional, fecha, fuente)
   - Cache con React Query
   - Paginación y sorting

4. ✅ **Tabla de auditoría `asistencia_auditoria`**
   - Triggers automáticos
   - Tracking de cambios
   - IP y usuario

---

## 📝 PREGUNTAS FRECUENTES

**Q: ¿Se pierden datos si el dispositivo se queda sin red?**  
A: NO. El dispositivo almacena hasta 100,000 registros en memoria flash persistente. Al recuperar red, los envía automáticamente.

**Q: ¿Cómo sé si un registro es biométrico o manual?**  
A: Campo `source_type` en `asistencia_consolidada`: `'biometrico'` o `'manual'`.

**Q: ¿Puedo tener ambos métodos activos al mismo tiempo?**  
A: SÍ. El sistema está diseñado para trabajar con ambos simultáneamente. La vista consolidada los unifica.

**Q: ¿Qué pasa si importo un archivo .TXT con datos que ya están en biométrico?**  
A: El sistema detecta duplicados por (enroll_id, timestamp, dispositivo) y los descarta. No hay duplicación.

**Q: ¿Cómo hago que el dispositivo envíe datos cada 5 minutos?**  
A: Opción 1 (recomendada): El servidor envía comando `getnewlog` cada 5 min via SendOrderJob.  
   Opción 2: Configurar dispositivo con `autopush=1, pushinterval=300`.

---

## 🔗 DOCUMENTOS RELACIONADOS

- `ANALISIS_ASISTENCIA_COMPLETO.md` - Arquitectura detallada
- `PLAN_IMPLEMENTACION_ASISTENCIA.md` - Plan de implementación (6 fases)
- `ESTADO_FINAL_ASISTENCIA.md` - Resumen de estado actual
- `IMPLEMENTACION_ASISTENCIA_ESTADO.md` - Estado de implementación

---

**Última actualización:** 2025-01-16  
**Autor:** Sistema de Documentación  
**Versión:** 1.0
