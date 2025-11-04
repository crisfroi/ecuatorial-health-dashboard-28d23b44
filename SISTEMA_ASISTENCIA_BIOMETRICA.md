# SISTEMA DE ASISTENCIA BIOMÉTRICA - ESTADO ACTUAL E IMPLEMENTACIÓN

## 📋 RESUMEN EJECUTIVO
Sistema completo de control de asistencia mediante dispositivos biométricos (huella, rostro, RFID) con gestión de turnos, fichajes y reportes para centros sanitarios.

Estado: Implementación funcional disponible en producción del dashboard (pestaña “Asistencia”) con componentes, hooks y flujos principales operativos.

---

## 🗄️ ANÁLISIS DE BASE DE DATOS EXISTENTE

Tablas confirmadas:
1. dispositivos
2. turnos_biometricos
3. cuadrantes_biometricos
4. attendance_logs
5. empleado_dispositivo_map
6. horarios_profesionales

RLS pendiente de validar a nivel DB (fuera del alcance de este commit).

---

## 🔌 HOOKS Y UTILIDADES DISPONIBLES

- useAsistencia.ts
  - Importar GLG/TXT/DAT y Reporte XLS/XLSX (múltiples hojas) ⇒ implementado
  - Importar Personal.xls con validación de columnas requeridas ⇒ implementado
  - Consolidación diaria y generación de estadísticas ⇒ implementado
  - Exportación DAT simple ⇒ implementado
- useDispositivosFichaje (incluido en useAsistencia.ts) ⇒ implementado
  - CRUD de dispositivos, mapeos EnNo ↔ profesional ⇒ implementado
- useTurnosBio.ts
  - CRUD de turnos y exportación/importe Turno.xls simplificado ⇒ implementado
  - Nota: formato de 3 secciones AT/LV no requerido actualmente; si el hardware lo exige, ampliar exportación.
- useCuadrantesBio.ts
  - Listado y asignación de cuadrantes ⇒ implementado
  - Export Personal.xls incluye número de tarjeta RFID ⇒ implementado
  - Export Cuadrantes.xls ⇒ implementado
- useReportesAsistencia.ts ⇒ implementado
  - Enriquecimiento con metadatos de dispositivo/centro/profesional y resúmenes diario/semanal/mensual/centro/profesional

---

## 🎨 INTERFAZ DE USUARIO DISPONIBLE

- AsistenciaDashboard.tsx ⇒ implementado e integrado en src/pages/Dashboard.tsx (tab "asistencia")
  - Pestañas:
    - Dispositivos: src/components/asistencia/DispositivosPanel.tsx ⇒ implementado
    - Turnos: src/components/guardias/tabs/TurnosBiometricos.tsx ⇒ implementado
    - Cuadrantes: src/components/asistencia/CuadrantesPanel.tsx ⇒ implementado
    - Importar Fichajes: src/components/asistencia/ImportarFichajesPanel.tsx ⇒ implementado
    - Reportes: src/components/asistencia/ReportesPanel.tsx ⇒ implementado (vistas diario, semanal, mensual, por profesional y por centro)
    - Métricas: src/components/asistencia/MetricasPanel.tsx ⇒ implementado (KPIs y tablas)

- Componentes de soporte:
  - DispositivoForm.tsx ⇒ implementado
  - MapeosProfesionalesDialog.tsx ⇒ implementado (importa Personal.xls y upsert mapeos)
  - FichajesList.tsx ⇒ implementado (vista previa)
  - CenterAttendancePanel.tsx ⇒ implementado (básico; se mantiene como referencia)

---

## 📊 FORMATOS DE ARCHIVOS SOPORTADOS

- GLG/TXT/DAT (ZKTeco-like): No | TMNo | EnNo | Name | INOUT | Mode | DateTime ⇒ implementado (detección de separadores/cabecera)
- Reporte XLS/XLSX: múltiples variantes de columnas ⇒ implementado
- Personal.xls: validación de columnas (ID/EmpNo, Name, Turno) ⇒ implementado; actualiza número_tarjeta_rfid si procede
- Turno.xls: export/import simplificado ⇒ implementado (ver nota sobre 3 secciones AT/LV si el hardware lo requiere)

---

## 🔐 CONSIDERACIONES DE SEGURIDAD

- Validaciones en UI aplicadas (ej. selección de centro antes de exportar, límites de lote). RLS en base de datos debe revisarse/ajustarse directamente en Supabase según políticas del proyecto.

---

## 📦 RESUMEN DE IMPLEMENTACIONES (ANTES → AHORA)

- Campo RFID en profesionales: YA IMPLEMENTADO (editable en src/components/dashboard/professional-detail/PersonalInfoCard.tsx; usado en exportaciones)
- Relación dispositivo-centro: YA IMPLEMENTADA (columna centro_salud_id; UI exige asignación)
- Validación Personal.xls al importar mapeos: YA IMPLEMENTADA (useAsistencia.importPersonalXls)
- Exportación Personal.xls incluyendo RFID: YA IMPLEMENTADA (useCuadrantesBio.exportPersonalXls)
- Dashboard, Dispositivos, Cuadrantes, Importación, Reportes, Métricas: YA IMPLEMENTADOS y operativos

Pendientes conocidos (baja prioridad):
- Ampliar exportación de Turno.xls a 3 secciones AT/LV si el dispositivo lo demanda.
- Revisión/fortalecimiento de RLS en tablas asociadas.

---

## 🔄 FLUJO DE TRABAJO SOPORTADO

1) Crear turnos (Turnos) → Exportar Turno.xls (simplificado)
2) Asignar cuadrantes
3) Exportar Personal.xls (incluye RFID y turno del día seleccionado)
4) Cargar archivos al dispositivo (manual)
5) Descargar fichajes del dispositivo
6) Importar fichajes (Importar Fichajes)
7) Consultar Reportes y Métricas

---

## 📝 NOTAS

- El sistema cubre el 100% del alcance para Fases 2 y 3 del documento original.
- Las funcionalidades avanzadas (validación automática de retrasos/horas extra) son evolutivos planificados.
- **PROTOCOLO COMPLETO:** Ver `WEBSOCKET_JSON_PROTOCOL.md` para detalles de comunicación dispositivo-servidor.

---

## 🔄 SINCRONIZACIÓN BIOMÉTRICA (WebSocket + APScheduler)

### Flujo Completo Dispositivo → Supabase

```
Dispositivo Biométrico
    ↓ (WebSocket persistente)
Flask /pub/chat (Render)
    ↓ (Guarda en BD local)
tabla "record" (PostgreSQL Flask)
    ↓ (APScheduler cada 5 min)
sync_with_supabase.py
    ↓ (Push enriquecido)
tabla "asistencia_fichajes" (Supabase)
    ↓ (Vista SQL)
asistencia_consolidada
    ↓
Dashboard React (useAsistenciaConsolidada)
```

### Características de Sincronización

- ✅ **WebSocket persistente:** Conexión permanente, no se cierra entre mensajes
- ✅ **Offline storage:** Dispositivo almacena hasta 100,000 registros en flash si no hay red
- ✅ **Sincronización automática:** APScheduler cada 5 minutos push_new_records_to_supabase()
- ✅ **Enriquecimiento:** Mapeo automático de enroll_id → profesional_id + centro_salud_id
- ✅ **Heartbeat:** Dispositivo envía "checklive" cada 60 segundos
- ✅ **Comandos bidireccionales:** Servidor puede solicitar logs via SendOrderJob

### Manejo Offline/Online

**Cuando el dispositivo NO tiene red:**
1. Guarda fichajes en memoria flash persistente (no volátil)
2. Acumula hasta 100,000 registros
3. Al recuperar conexión: reconecta WebSocket y envía TODO el backlog
4. Los timestamps son los originales del momento del fichaje

**Línea de tiempo correcta:**
- Cada registro usa timestamp local del dispositivo
- El servidor guarda con el timestamp ORIGINAL (no el de recepción)
- La vista `asistencia_consolidada` ordena por `fecha_hora` (timestamp del fichaje)
- Importaciones manuales .TXT también usan timestamp del archivo
- **NO HAY contradicciones:** todos los registros se ordenan cronológicamente independiente de cuándo lleguen al servidor

### Envío Cada 5 Minutos

**Método implementado:**
```python
# En app.py (líneas 52-62)
@app.before_request
def start_thread_once():
    if not _sync_started:
        start_sync_scheduler(supabase_client, sync_interval=5)
        # Sincroniza cada 5 minutos:
        # 1. push_new_records_to_supabase() 
        # 2. pull_new_records_from_supabase()
        # 3. sync_devices()
```

**Alternativa (comando periódico):**
```python
# Servidor puede solicitar logs cada 5 min:
SendOrderJob inserta comando "getnewlog"
   → Dispositivo responde con registros nuevos
   → Se guardan en tabla record
   → APScheduler los sincroniza a Supabase
```

**NO es necesario cerrar/abrir WebSocket:** La conexión permanece abierta todo el tiempo. Solo se reconecta si hay timeout o error de red.

---

## 🗄️ TABLAS Y VISTAS

### Vista Consolidada (IMPLEMENTADA)

```sql
-- asistencia_consolidada unifica ambos métodos
SELECT 
  id, profesional_id, centro_salud_id,
  fecha_hora, inout, mode, event,
  'biometrico' as source_type
FROM asistencia_fichajes

UNION ALL

SELECT
  id, id_profesional, centro_salud_id,
  fecha_hora, inout, NULL, NULL,
  'manual' as source_type  
FROM attendance_logs

ORDER BY fecha_hora DESC;
```

### Hook React

```typescript
// src/hooks/useAsistenciaConsolidada.ts
const { data } = useAsistenciaConsolidada({
  centroId: 'uuid',
  fechaDesde: '2025-01-01',
  fechaHasta: '2025-01-31',
  sourceType: 'biometrico' | 'manual' | null
});

// Retorna TODOS los fichajes unificados
// con campo source_type para distinguir origen
```

---

Última verificación: 2025-01-16
