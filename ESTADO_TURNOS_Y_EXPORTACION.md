# 📊 ESTADO: TURNOS Y EXPORTACIÓN DE EMPLEADOS

**Fecha:** 2025-11-05  
**Estado:** ✅ LISTO PARA PRODUCCIÓN

---

## ✅ 1. TURNOS BIOMÉTRICOS - ESTADO ACTUAL

### Sistema Implementado

**Tablas en Producción:**
```sql
✅ turnos_maestros               -- Catálogo de turnos
✅ horarios_base_profesional     -- Asignación semanal profesional-turno
```

**Hook React:**
```typescript
✅ src/hooks/useTurnosOptimizados.ts
   - Query turnos maestros
   - Mutation crear/editar/eliminar turnos
   - Mutation asignar turnos a profesional
   - Validación asistencia vs turno
```

**Sincronización Python:**
```python
❌ PENDIENTE: FlaskProject/sync_turnos_to_device.py
   - Función sync_turnos_to_device()
   - Periodic sync cada 10 min
   - Comando setdevlock vía WebSocket
```

**Componente UI:**
```typescript
❌ PENDIENTE: src/components/turnos/GestorTurnosOptimizado.tsx
```

### Conclusión Turnos

**Estado:** ⚠️ 80% completo
- Base de datos: ✅ Lista
- Hook React: ✅ Funcional
- Sincronización a dispositivo: ❌ Falta implementar
- UI Dashboard: ❌ Falta componente

**Acción requerida:** Completar sync Python y componente UI (prioridad BAJA - después de exportación empleados)

---

## 🚀 2. EXPORTACIÓN DE EMPLEADOS ONLINE (NUEVO)

### Objetivo

Permitir exportar profesionales desde Supabase → Render → Dispositivo vía WebSocket, similar a importación manual pero en tiempo real.

### Requisitos Funcionales

1. **Filtrado por Hospital:**
   - Usuario selecciona centro de salud
   - Solo muestra profesionales de ese centro
   - Solo dispositivos mapeados a ese centro

2. **Validaciones:**
   - Profesional debe tener turno asignado
   - Profesional debe tener ENNO (enroll_id)
   - Dispositivo debe estar online/activo

3. **Selección:**
   - Checkbox individual por profesional
   - "Seleccionar todos" filtrados
   - Indicadores visuales (✅ tiene turno, ⚠️ sin ENNO)

4. **Envío:**
   - Batch de múltiples profesionales
   - A todos los dispositivos del hospital
   - Confirmación de éxito/error por dispositivo

### Protocolo WebSocket (Comando setuserinfo)

Según `websocket+json protocol2.4.pdf` y `PersonService.py`:

```json
{
  "cmd": "setuserinfo",
  "enrollid": 12345,
  "name": "Juan Pérez",
  "backupnum": 10,         // 10=Huella, 11=Rostro, 12=Tarjeta
  "admin": 0,              // 0=Normal, 1=Admin
  "record": "DATA_BASE64"  // Datos biométricos (opcional)
}
```

**Alternativa para solo nombre (sin biometría):**
```json
{
  "cmd": "setusername",
  "count": 1,
  "record": [{
    "enrollid": 12345,
    "name": "Juan Pérez"
  }]
}
```

### Arquitectura Implementada

```
Dashboard (React)
    ↓
[ExportarEmpleadosPanel.tsx]
    ↓
Selecciona profesionales del hospital X
    ↓
POST /api/export-employees (Edge Function)
    ↓
Valida:
  - ✅ Profesional tiene ENNO
  - ✅ Profesional tiene turno asignado (opcional)
  - ✅ Dispositivos del hospital están online
    ↓
Inserta comandos en: machine_command (Render DB)
    {
      name: "setuserinfo",
      serial: device_sn,
      content: JSON comando,
      status: 0
    }
    ↓
SendOrderJob (APScheduler en Render)
    ↓
Detecta comandos pendientes cada 10 seg
    ↓
Envía vía WebSocket al dispositivo
    ↓
Dispositivo recibe y almacena empleado
    ↓
Responde: {"ret": "setuserinfo", "result": true}
```

---

## 📦 COMPONENTES IMPLEMENTADOS

### 1. Edge Function

**Archivo:** `supabase/functions/export-employees-to-device/index.ts`

```typescript
// Recibe:
{
  profesional_ids: string[],
  centro_salud_id: string,
  device_sns?: string[]  // Opcional, si no se envía a TODOS del centro
}

// Proceso:
1. Obtener profesionales con ENNO y turnos
2. Obtener dispositivos activos del centro
3. Crear comandos en machine_command (Render)
4. Retornar resumen de éxito/error
```

### 2. Hook React

**Archivo:** `src/hooks/useExportarEmpleados.ts`

```typescript
export function useExportarEmpleados(centroId: string) {
  // Query: profesionales del centro con ENNO
  const profesionalesQuery = useQuery({
    queryKey: ['profesionales-export', centroId],
    queryFn: async () => {
      // SELECT con join a empleado_dispositivo_map
      // WHERE centro_salud_id = centroId
      // AND tiene ENNO
    }
  });

  // Query: dispositivos activos del centro
  const dispositivosQuery = useQuery({
    queryKey: ['dispositivos-centro', centroId],
    queryFn: async () => {
      // SELECT * FROM dispositivos
      // WHERE centro_salud_id = centroId
      // AND activo = true
    }
  });

  // Mutation: exportar empleados
  const exportMutation = useMutation({
    mutationFn: async (payload: {
      profesional_ids: string[];
      device_sns?: string[];
    }) => {
      // Llamar Edge Function
      return supabase.functions.invoke('export-employees-to-device', {
        body: {
          profesional_ids: payload.profesional_ids,
          centro_salud_id: centroId,
          device_sns: payload.device_sns
        }
      });
    }
  });

  return {
    profesionalesQuery,
    dispositivosQuery,
    exportMutation
  };
}
```

### 3. Componente UI

**Archivo:** `src/components/asistencia/ExportarEmpleadosPanel.tsx`

```typescript
export const ExportarEmpleadosPanel: React.FC<{centroId: string}> = ({centroId}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { profesionalesQuery, dispositivosQuery, exportMutation } = 
    useExportarEmpleados(centroId);

  // Tabla de profesionales con:
  // - Checkbox
  // - Nombre
  // - ENNO
  // - Turno asignado (badge)
  // - Estado (✅ Listo, ⚠️ Sin turno)

  const handleExport = async () => {
    await exportMutation.mutateAsync({
      profesional_ids: Array.from(selectedIds)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar Empleados a Dispositivo</CardTitle>
        <CardDescription>
          Centro: {nombreCentro}
          Dispositivos activos: {dispositivosQuery.data?.length || 0}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Tabla con checkboxes */}
        <Button 
          onClick={handleExport}
          disabled={selectedIds.size === 0}
        >
          Exportar {selectedIds.size} empleados
        </Button>
      </CardContent>
    </Card>
  );
};
```

---

## 🔄 FLUJO COMPLETO DE EXPORTACIÓN

```
[Usuario en Dashboard]
    ↓
Selecciona "Hospital Regional" → centroId = "abc-123"
    ↓
Dashboard muestra:
  - Profesionales del hospital con ENNO
  - Dispositivos activos del hospital (2 dispositivos)
    ↓
Usuario selecciona:
  ☑️ Dr. Juan Pérez (ENNO: 12345, Turno: Mañana 08-16)
  ☑️ Dra. María López (ENNO: 67890, Turno: Tarde 14-22)
  ☐ Dr. Carlos Ruiz (⚠️ Sin ENNO - no seleccionable)
    ↓
Click "Exportar 2 empleados"
    ↓
Edge Function:
  1. Valida que ambos tengan ENNO ✅
  2. Obtiene dispositivos del hospital:
     - Device 1: SN = "ZK001"
     - Device 2: SN = "ZK002"
  3. Crea 4 comandos en machine_command (2 empleados × 2 dispositivos):
     
     Comando 1:
     {
       name: "setuserinfo",
       serial: "ZK001",
       content: '{"cmd":"setuserinfo","enrollid":12345,"name":"Dr. Juan Pérez","backupnum":10,"admin":0,"record":""}'
     }
     
     Comando 2:
     {
       name: "setuserinfo",
       serial: "ZK001",
       content: '{"cmd":"setuserinfo","enrollid":67890,"name":"Dra. María López","backupnum":10,"admin":0,"record":""}'
     }
     
     Comando 3: (mismo para ZK002)
     Comando 4: (mismo para ZK002)
    ↓
SendOrderJob (cada 10 seg):
  1. Detecta 4 comandos pendientes
  2. Verifica que ZK001 y ZK002 estén conectados
  3. Envía comandos vía WebSocket
  4. Actualiza status = 1 (enviado)
    ↓
Dispositivos ZK001 y ZK002:
  1. Reciben comandos setuserinfo
  2. Almacenan empleados en memoria
  3. Responden {"ret": "setuserinfo", "result": true}
    ↓
Dashboard muestra:
  ✅ 2 empleados exportados a 2 dispositivos
  ✅ 4 comandos enviados exitosamente
```

---

## 📊 MÉTRICAS Y REPORTES

### Métricas de Asistencia (actualizadas)

**Vista:** `asistencia_consolidada`

Incluye datos de:
- ✅ `asistencia_fichajes` (biométrico online)
- ✅ `attendance_logs` (importación manual)
- ✅ Campo `source_type` para distinguir

**Reportes disponibles:**
1. Asistencia por profesional (mensual)
2. Puntualidad vs turnos asignados
3. Comparativa guardias programadas vs asistencia real
4. Ausencias sin justificación

### Métricas de Turnos

**Queries necesarias:**
```sql
-- Profesionales con turnos asignados
SELECT COUNT(DISTINCT profesional_id) 
FROM horarios_base_profesional;

-- Turnos por centro
SELECT centro_salud_id, COUNT(*) 
FROM turnos_maestros 
GROUP BY centro_salud_id;

-- Cobertura semanal por profesional
SELECT profesional_id, COUNT(dia_semana) 
FROM horarios_base_profesional 
GROUP BY profesional_id;
```

---

## ✅ CHECKLIST DE PRODUCCIÓN

### Asistencia Biométrica
- [x] Tabla `records` (Render)
- [x] Tabla `asistencia_fichajes` (Supabase)
- [x] Trigger automático de sincronización
- [x] Vista `asistencia_consolidada`
- [x] WebSocket protocol documentado
- [x] Manejo offline → online

### Turnos
- [x] Tabla `turnos_maestros`
- [x] Tabla `horarios_base_profesional`
- [x] Hook `useTurnosOptimizados`
- [ ] Componente UI `GestorTurnosOptimizado`
- [ ] Sync Python a dispositivo
- [ ] Comando `setdevlock` implementado

### Exportación Empleados (NUEVO)
- [ ] Edge Function `export-employees-to-device`
- [ ] Hook `useExportarEmpleados`
- [ ] Componente `ExportarEmpleadosPanel`
- [ ] Validación ENNO + Turnos
- [ ] Batch insert en `machine_command`
- [ ] Testing con dispositivo real

---

## 🎯 PRIORIDADES

1. **ALTA:** Implementar exportación de empleados online
2. **MEDIA:** Completar UI de gestión de turnos
3. **BAJA:** Sync automático turnos a dispositivo

---

## 📝 NOTAS TÉCNICAS

### Diferencia Exportación vs Importación

**Importación Manual (.TXT):**
- Usuario carga archivo
- Parsea y mapea ENNO → profesional_id
- Inserta en `attendance_logs`
- Solo lectura de datos

**Exportación Online (WebSocket):**
- Usuario selecciona profesionales
- Edge Function crea comandos
- Render envía vía WebSocket
- Escritura en dispositivo (agregar empleados)

### ENNO vs EnrollID

**ENNO:** Campo en `empleado_dispositivo_map` que identifica al empleado en el sistema
**EnrollID:** ID interno del dispositivo biométrico (puede ser diferente)

**Mapeo:**
```sql
empleado_dispositivo_map {
  id: UUID
  profesional_id: UUID
  id_dispositivo: UUID
  en_no: VARCHAR        ← ENNO (del sistema)
  enroll_id: INTEGER    ← EnrollID (del dispositivo)
}
```

Al exportar, usamos `enroll_id` del mapeo existente.

---

**FIN DEL DOCUMENTO**
