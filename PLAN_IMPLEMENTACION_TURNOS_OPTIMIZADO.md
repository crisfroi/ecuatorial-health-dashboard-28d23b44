# ��� PLAN IMPLEMENTACIÓN: TURNOS BIOMÉTRICOS OPTIMIZADOS

**Fecha:** 2025-01-16  
**Usuario:** JUAN FROILAN RAMOS NABAMA  
**Estado:** VERIFICADO Y LISTO PARA IMPLEMENTAR  

---

## ✅ VERIFICACIONES COMPLETADAS

### 1. Timestamps ✅
```
time_local:  2025-11-03 15:59:26  (Original del dispositivo - LO IMPORTANTE)
created_at:  2025-11-03 15:59:40  (Inserción en Supabase - Auditoría)
Diferencia:  ~14 segundos (NORMAL)
```

**Status:** ✅ Correctamente implementado. `created_at` se genera automáticamente en Supabase.

---

### 2. Estructura de asistencia_fichajes ✅
```sql
- id (UUID)
- device_sn (text)
- enroll_id (bigint)
- profesional_id (UUID, opcional)
- time_local (timestamptz) ← Timestamp del dispositivo
- inout (smallint: 0=IN, 1=OUT)
- mode (smallint: 0=Huella, 1=Tarjeta, 2=Contraseña, etc.)
- event (smallint: código de evento)
- temperature (numeric)
- image_url (text)
- raw_index (integer)
- centro_salud_id (UUID)
- created_at (timestamptz) ← Generado automáticamente
```

---

### 3. Protocolo WebSocket ✅

El dispositivo espera turnos en formato `setdevlock` (global):

```json
{
  "cmd": "setdevlock",
  "dayzone": [
    {
      "day": [
        {"section": "08:00~16:00"},
        {"section": "14:00~22:00"}
      ]
    }
  ],
  "weekzone": [
    {
      "week": [
        {"day": 1},  // lunes
        {"day": 1},  // martes
        {"day": 1},  // miércoles
        {"day": 1},  // jueves
        {"day": 1},  // viernes
        {"day": 2},  // sábado (código diferente)
        {"day": 2}   // domingo
      ]
    }
  ]
}
```

**Interpretación:**
- `dayzone[i]`: Define un conjunto de franjas horarias
- `weekzone[i]`: Mapea cada día de la semana a un dayzone

---

## 📋 MODELO ELEGIDO: HORARIOS BASE PROFESIONAL (SIN CUADRANTES DIARIOS)

**Ventaja:** 7 registros por profesional (semanal) vs 365+ (diario) = 98% menos registros.

### Tabla Principal: `horarios_base_profesional`

```sql
CREATE TABLE horarios_base_profesional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id UUID NOT NULL REFERENCES profesionales_sanitarios(id) ON DELETE CASCADE,
  turno_id UUID NOT NULL REFERENCES turnos_maestros(id) ON DELETE RESTRICT,
  dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),  -- 1=LUN, 7=DOM
  vigencia_desde DATE NOT NULL DEFAULT CURRENT_DATE,
  vigencia_hasta DATE DEFAULT NULL,  -- NULL = vigente indefinidamente
  centro_salud_id UUID REFERENCES centros_salud(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint: un turno por (profesional, día, período vigente)
  UNIQUE(profesional_id, dia_semana, vigencia_desde)
);
```

**Índices críticos:**
```sql
CREATE INDEX idx_horarios_profesional ON horarios_base_profesional(profesional_id, vigencia_desde);
CREATE INDEX idx_horarios_turno ON horarios_base_profesional(turno_id);
```

### Tabla: `turnos_maestros`

```sql
CREATE TABLE turnos_maestros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_turno TEXT NOT NULL,              -- "Mañana 08-16", "Noche 22-06", etc.
  hora_inicio TIME NOT NULL,                -- "08:00:00"
  hora_fin TIME NOT NULL,                   -- "16:00:00"
  tolerancia_entrada_min INT DEFAULT 5,     -- Minutos antes permitidos
  tolerancia_salida_min INT DEFAULT 5,      -- Minutos después permitidos
  tipo TEXT CHECK (tipo IN ('diurno', 'nocturno', 'festivo')),
  centro_salud_id UUID REFERENCES centros_salud(id),  -- Opcional: si es por centro
  dispositivo_id UUID REFERENCES dispositivos(id),     -- Opcional: si es por dispositivo
  sync_a_dispositivo BOOLEAN DEFAULT true,  -- Flag para sincronizar
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔄 FLUJO DE SINCRONIZACIÓN TURNOS → DISPOSITIVO

### Fase 1: Dashboard crea turno

```
Usuario en Dashboard:
├─ Nombre: "Mañana 08-16"
├─ Hora inicio: 08:00
├─ Hora fin: 16:00
├─ Tolerancia: 5 min
└─ Inserta en: turnos_maestros
```

### Fase 2: APScheduler detecta cambio (cada 5 min)

**Python en Render (sync_with_supabase.py):**

```python
def sync_turnos_to_device(supabase_client, device_sn):
    """
    Sincroniza turnos desde Supabase al dispositivo vía WebSocket.
    
    Obtiene:
    1. Todos los turnos_maestros activos para el dispositivo
    2. Genera estructura setdevlock
    3. Envía vía WebSocket
    """
    
    # Obtener turnos maestros
    turnos = supabase_client.table('turnos_maestros') \
        .select('*') \
        .eq('dispositivo_id', dispositivo_id) \
        .eq('sync_a_dispositivo', True) \
        .execute()
    
    # Generar estructura para dispositivo
    dayzone = []
    for turno in turnos.data:
        day_zones.append({
            "day": [
                {
                    "section": f"{turno['hora_inicio'][:5]}~{turno['hora_fin'][:5]}"
                }
            ]
        })
    
    weekzone = [{"week": [{"day": 1} for _ in range(7)]}]  # Lunes-domingo
    
    # Crear comando
    command = {
        "cmd": "setdevlock",
        "dayzone": dayzone,
        "weekzone": weekzone
    }
    
    # Enviar vía WebSocket
    send_websocket_command(device_sn, command)
```

### Fase 3: Dispositivo recibe y almacena

```
Dispositivo:
├─ Recibe: setdevlock
├─ Parsea turnos
├─ Almacena en memoria
└─ Usa para comparar asistencia
```

### Fase 4: Dashboard ve cambios (auto-sync)

```
React Query invalidates cache
    ↓
Hook refetch
    ↓
Muestra turnos actualizados
```

---

## 🛠️ IMPLEMENTACIÓN TÉCNICA

### PASO 1: Hook React para Turnos (30 créditos)

**Ubicación:** `src/hooks/useTurnosOptimizados.ts`

```typescript
interface TurnoMaestro {
  id: string;
  nombre_turno: string;
  hora_inicio: string;  // "08:00:00"
  hora_fin: string;
  tolerancia_entrada_min: number;
  tipo: 'diurno' | 'nocturno' | 'festivo';
  sync_a_dispositivo: boolean;
}

interface HorarioBaseProfesional {
  id: string;
  profesional_id: string;
  turno_id: string;
  dia_semana: number;  // 1-7
  turno?: TurnoMaestro;  // Join
}

export function useTurnosOptimizados(centroId?: string) {
  // Query: Obtener todos los turnos maestros
  const turnosQuery = useQuery({
    queryKey: ['turnos-maestros', centroId],
    queryFn: async () => {
      let qb = supabase
        .from('turnos_maestros')
        .select('*');
      if (centroId) qb = qb.eq('centro_salud_id', centroId);
      const { data, error } = await qb;
      if (error) throw error;
      return data as TurnoMaestro[];
    }
  });

  // Mutation: Crear nuevo turno
  const createTurnoMutation = useMutation({
    mutationFn: async (payload: Partial<TurnoMaestro>) => {
      const { data, error } = await supabase
        .from('turnos_maestros')
        .insert({
          nombre_turno: payload.nombre_turno,
          hora_inicio: payload.hora_inicio,
          hora_fin: payload.hora_fin,
          tipo: payload.tipo,
          sync_a_dispositivo: payload.sync_a_dispositivo ?? true
        })
        .select()
        .single();
      if (error) throw error;
      return data as TurnoMaestro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos-maestros'] });
    }
  });

  // Mutation: Asignar turno a profesional
  const asignarTurnoMutation = useMutation({
    mutationFn: async (payload: {
      profesional_id: string;
      turno_id: string;
      dia_semana: number;
    }) => {
      const { data, error } = await supabase
        .from('horarios_base_profesional')
        .upsert({
          profesional_id: payload.profesional_id,
          turno_id: payload.turno_id,
          dia_semana: payload.dia_semana,
          vigencia_desde: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();
      if (error) throw error;
      return data as HorarioBaseProfesional;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios-profesional'] });
    }
  });

  return {
    turnosQuery,
    createTurnoMutation,
    asignarTurnoMutation
  };
}
```

---

### PASO 2: Función Python para sincronizar (40 créditos)

**Ubicación:** `FlaskProject/sync_turnos_to_device.py`

```python
"""
Sincronización de turnos desde Supabase al dispositivo biométrico.
"""

import json
from datetime import time as dt_time
from Helpers.log_conf import Logger
from job.SendOrderJob import SendOrderJob

logger = Logger()

def sync_turnos_to_device(supabase_client, device_sn: str):
    """
    Sincroniza turnos maestros al dispositivo vía WebSocket setdevlock.
    
    Args:
        supabase_client: Cliente de Supabase
        device_sn: Serial number del dispositivo
    """
    try:
        # 1. Obtener dispositivo por SN
        device_response = supabase_client.table('dispositivos') \
            .select('id') \
            .eq('device_sn', device_sn) \
            .limit(1) \
            .execute()
        
        if not device_response.data:
            logger.warning(f"Dispositivo no encontrado: {device_sn}")
            return False
        
        dispositivo_id = device_response.data[0]['id']
        
        # 2. Obtener turnos maestros para este dispositivo
        turnos_response = supabase_client.table('turnos_maestros') \
            .select('*') \
            .eq('dispositivo_id', dispositivo_id) \
            .eq('sync_a_dispositivo', True) \
            .eq('activo', True) \
            .execute()
        
        if not turnos_response.data:
            logger.info(f"No hay turnos para sincronizar: {device_sn}")
            return True
        
        turnos = turnos_response.data
        
        # 3. Construir estructura dayzone
        dayzone = []
        for idx, turno in enumerate(turnos):
            hora_inicio = turno['hora_inicio'][:5]  # HH:MM
            hora_fin = turno['hora_fin'][:5]
            
            dayzone.append({
                "day": [
                    {"section": f"{hora_inicio}~{hora_fin}"}
                ]
            })
        
        # 4. Construir estructura weekzone
        # Mapear todas los días a dayzone[0] (mismo turno todos los días)
        weekzone = [{
            "week": [
                {"day": 1} for _ in range(7)  # 1=dayzone[0]
            ]
        }]
        
        # 5. Crear comando setdevlock
        command = {
            "cmd": "setdevlock",
            "dayzone": dayzone,
            "weekzone": weekzone
        }
        
        # 6. Enviar vía WebSocket
        send_order_job = SendOrderJob()
        success = send_order_job.send_command_to_device(device_sn, command)
        
        if success:
            logger.info(f"✅ Turnos sincronizados a dispositivo: {device_sn}")
            return True
        else:
            logger.error(f"❌ Error al sincronizar turnos a: {device_sn}")
            return False
            
    except Exception as e:
        logger.error(f"Error en sync_turnos_to_device: {e}")
        return False


def periodic_sync_turnos(supabase_client):
    """
    Sincroniza turnos a TODOS los dispositivos conectados.
    Se ejecuta cada 5-10 minutos vía APScheduler.
    """
    try:
        # Obtener todos los dispositivos activos
        devices_response = supabase_client.table('dispositivos') \
            .select('device_sn') \
            .eq('activo', True) \
            .execute()
        
        synced = 0
        for device in devices_response.data:
            if sync_turnos_to_device(supabase_client, device['device_sn']):
                synced += 1
        
        logger.info(f"✅ Sync periódico: {synced}/{len(devices_response.data)} dispositivos")
        
    except Exception as e:
        logger.error(f"Error en periodic_sync_turnos: {e}")
```

---

### PASO 3: Inicializar sync en app.py (20 créditos)

**Modificar:** `FlaskProject/app.py`

```python
# En app.py, después de start_sync_scheduler:

from sync_turnos_to_device import periodic_sync_turnos

@app.before_request
def start_turnos_sync():
    global _turnos_sync_started
    
    if not _turnos_sync_started:
        try:
            from database import supabase_client
            if supabase_client:
                # Agregar tarea de sync de turnos cada 10 minutos
                scheduler.add_job(
                    func=periodic_sync_turnos,
                    args=[supabase_client],
                    trigger="interval",
                    minutes=10,
                    id='sync_turnos_biometricos',
                    replace_existing=True
                )
                logger.info("✅ Turnos sync scheduler iniciado")
                _turnos_sync_started = True
        except Exception as e:
            logger.error(f"⚠️  Error iniciando turnos sync: {e}")
```

---

### PASO 4: Componente React (35 créditos)

**Ubicación:** `src/components/turnos/GestorTurnosOptimizado.tsx`

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useTurnosOptimizados } from '@/hooks/useTurnosOptimizados';
import { useToast } from '@/hooks/use-toast';

interface GestorTurnosProps {
  centroId?: string;
  profesionalId?: string;
}

export const GestorTurnosOptimizado: React.FC<GestorTurnosProps> = ({
  centroId,
  profesionalId
}) => {
  const { toast } = useToast();
  const { turnosQuery, createTurnoMutation, asignarTurnoMutation } = 
    useTurnosOptimizados(centroId);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [nuevoTurno, setNuevoTurno] = useState({
    nombre_turno: '',
    hora_inicio: '08:00',
    hora_fin: '16:00',
    tipo: 'diurno' as const
  });

  const handleCreateTurno = async () => {
    try {
      await createTurnoMutation.mutateAsync(nuevoTurno);
      setShowCreateDialog(false);
      toast({ title: 'Turno creado exitosamente' });
    } catch (error: any) {
      toast({
        title: 'Error al crear turno',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleAsignarTurno = async (turnoId: string, diaSemana: number) => {
    if (!profesionalId) return;
    
    try {
      await asignarTurnoMutation.mutateAsync({
        profesional_id: profesionalId,
        turno_id: turnoId,
        dia_semana: diaSemana
      });
      toast({ title: 'Turno asignado correctamente' });
    } catch (error: any) {
      toast({
        title: 'Error al asignar turno',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Lista de turnos maestros */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Turnos Maestros</h3>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            size="sm"
          >
            + Nuevo Turno
          </Button>
        </div>

        {turnosQuery.isLoading ? (
          <p>Cargando...</p>
        ) : turnosQuery.data?.length === 0 ? (
          <p className="text-gray-500">No hay turnos creados</p>
        ) : (
          <div className="grid gap-2">
            {turnosQuery.data?.map((turno) => (
              <div key={turno.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{turno.nombre_turno}</p>
                  <p className="text-sm text-gray-600">
                    {turno.hora_inicio} - {turno.hora_fin}
                  </p>
                </div>
                {profesionalId && (
                  <Button
                    onClick={() => handleAsignarTurno(turno.id, 1)} // lunes
                    variant="outline"
                    size="sm"
                  >
                    Asignar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog crear nuevo turno */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Crear Nuevo Turno</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                value={nuevoTurno.nombre_turno}
                onChange={(e) => setNuevoTurno({...nuevoTurno, nombre_turno: e.target.value})}
                className="w-full border rounded px-3 py-2"
                placeholder="Ej: Mañana 08-16"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Hora Inicio</label>
                <input
                  type="time"
                  value={nuevoTurno.hora_inicio}
                  onChange={(e) => setNuevoTurno({...nuevoTurno, hora_inicio: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hora Fin</label>
                <input
                  type="time"
                  value={nuevoTurno.hora_fin}
                  onChange={(e) => setNuevoTurno({...nuevoTurno, hora_fin: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                value={nuevoTurno.tipo}
                onChange={(e) => setNuevoTurno({...nuevoTurno, tipo: e.target.value as any})}
                className="w-full border rounded px-3 py-2"
              >
                <option value="diurno">Diurno</option>
                <option value="nocturno">Nocturno</option>
                <option value="festivo">Festivo</option>
              </select>
            </div>

            <Button 
              onClick={handleCreateTurno}
              disabled={createTurnoMutation.isPending}
              className="w-full"
            >
              {createTurnoMutation.isPending ? 'Creando...' : 'Crear Turno'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
```

---

## 📊 RESUMEN DE CAMBIOS

| Componente | Cambio | Estado |
|-----------|--------|--------|
| BD: `turnos_maestros` | Nueva tabla | Migración requerida |
| BD: `horarios_base_profesional` | Mantener actual | Sin cambios |
| Python: sync_turnos_to_device.py | Nuevo archivo | 40 créditos |
| Python: app.py | Agregar sync | 20 créditos |
| React: useTurnosOptimizados.ts | Nuevo hook | 30 créditos |
| React: GestorTurnosOptimizado.tsx | Nuevo componente | 35 créditos |
| **TOTAL ESTIMADO** | | **~125 créditos** |

---

## 🚀 SECUENCIA DE IMPLEMENTACIÓN

```
1. [20 min] Crear tabla turnos_maestros (migración SQL)
2. [30 min] Implementar hook useTurnosOptimizados
3. [40 min] Implementar sync_turnos_to_device.py
4. [20 min] Inicializar sync en app.py
5. [35 min] Crear componente GestorTurnosOptimizado
6. [30 min] Testing y ajustes
```

**TOTAL: ~3 horas**

---

## ⚠️ NOTAS CRÍTICAS

1. **Timestamps:** `time_local` vs `created_at` ya está bien ✅
2. **Modelo:** Horarios base semanal (sin cuadrantes diarios) ✅
3. **WebSocket:** Protocolo setdevlock (global del dispositivo) ✅
4. **Créditos:** Se controlará estrictamente por tarea

---

**Listo para implementar.** ¿Comenzamos?
