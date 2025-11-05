# 🧪 GUÍA TESTING: TURNOS BIOMÉTRICOS OPTIMIZADOS

**Fecha:** 2025-01-16  
**Estado:** Listo para testing end-to-end  
**Objective:** Validar flujo completo Dashboard → Python → Dispositivo

---

## 📋 CHECKLIST DE TESTING

### PASO 1: Verificación de Base de Datos

- [ ] Tabla `turnos_maestros` existe en Supabase
  ```sql
  SELECT * FROM turnos_maestros LIMIT 1;
  ```

- [ ] Tabla `horarios_base_profesional` existe y tiene estructura correcta
  ```sql
  SELECT * FROM horarios_base_profesional LIMIT 1;
  ```

- [ ] Índices están creados
  ```sql
  SELECT indexname FROM pg_indexes WHERE tablename='turnos_maestros';
  ```

---

### PASO 2: Verificación de Código React

**Ubicación:** `src/components/turnos/GestorTurnosOptimizado.tsx`

- [ ] Componente se importa correctamente
  ```typescript
  import { GestorTurnosOptimizado } from '@/components/turnos/GestorTurnosOptimizado';
  ```

- [ ] Hook se importa correctamente
  ```typescript
  import { useTurnosOptimizados } from '@/hooks/useTurnosOptimizados';
  ```

- [ ] No hay errores de TypeScript
  ```bash
  npm run lint
  ```

**Test manual en Dashboard:**

1. Abrir dashboard en navegador
2. Navegar a sección de Gestión de Turnos
3. Verificar que lista de turnos carga

---

### PASO 3: Pruebas Funcionales (React)

#### 3.1 Crear nuevo turno

**Pasos:**
1. Click en botón "Nuevo Turno"
2. Llenar:
   - Nombre: "Mañana 08-16"
   - Hora inicio: 08:00
   - Hora fin: 16:00
   - Tipo: Diurno
   - Tolerancia entrada: 5 min
3. Click en "Crear Turno"

**Resultado esperado:** ✅
- Toast: "Turno creado"
- Turno aparece en lista
- Dialog se cierra

**Validar en BD:**
```sql
SELECT * FROM turnos_maestros WHERE nombre_turno = 'Mañana 08-16';
```

---

#### 3.2 Editar turno

**Pasos:**
1. Click en icono ✏️ (Edit) en un turno
2. Cambiar: Tolerancia entrada → 10 min
3. Click en "Actualizar Turno"

**Resultado esperado:** ✅
- Toast: "Turno actualizado correctamente"
- Cambio visible inmediatamente
- BD actualizada

---

#### 3.3 Eliminar turno

**Pasos:**
1. Click en icono 🗑️ (Delete) en un turno
2. Confirmar en dialog

**Resultado esperado:** ✅
- Toast: "Turno eliminado"
- Turno desaparece de lista (soft delete, marked as inactive)

---

#### 3.4 Asignar turno a profesional

**Prerequisitos:**
- Estar en página de profesional específico
- Mostrar GestorTurnosOptimizado con `profesionalId` prop

**Pasos:**
1. En lista de turnos, click en "Asignar"
2. Observar aparece en "Horario Base del Profesional"

**Resultado esperado:** ✅
- Turno aparece con día de la semana
- Se insertó en `horarios_base_profesional`

**Validar en BD:**
```sql
SELECT * FROM horarios_base_profesional 
WHERE profesional_id = 'UUID-DEL-PROF'
ORDER BY dia_semana;
```

---

### PASO 4: Verificación de Python/Flask

#### 4.1 Verificar archivo sync_turnos_to_device.py

```bash
# Verificar que el archivo existe
ls -la FlaskProject/sync_turnos_to_device.py

# Verificar sintaxis Python
python -m py_compile FlaskProject/sync_turnos_to_device.py
```

**Resultado esperado:** ✅ Sin errores de sintaxis

---

#### 4.2 Verificar inicialización en app.py

```bash
# Buscar imports
grep "sync_turnos_to_device" FlaskProject/app.py

# Buscar inicialización de scheduler
grep "sync_turnos_biometricos" FlaskProject/app.py
```

**Resultado esperado:** ✅
- Import presente
- Job registrado en scheduler

---

#### 4.3 Testing manual: Verificar logs en Render

**Cuando el app.py se ejecuta:**

```
✅ Turnos sync scheduler initialized (interval: 10 minutes)
```

Debe aparecer en logs.

**Cada 10 minutos, debe ver:**

```
============================================================
🔄 SYNC PERIÓDICO DE TURNOS INICIADO
============================================================
Iniciando sync de turnos para dispositivo: ZK001
...
📊 RESUMEN SYNC:
   Total dispositivos: 1
   ✅ Sincronizados: 1
   ❌ Errores: 0
   ⏰ Timestamp: 2025-01-16T10:30:00.123456
============================================================
```

---

### PASO 5: Testing WebSocket → Dispositivo

#### 5.1 Verificar que comando se construye correctamente

**En Python (para debugging):**

```python
from sync_turnos_to_device import construir_comando_setdevlock

turnos = [
    {
        'nombre_turno': 'Mañana 08-16',
        'hora_inicio': '08:00:00',
        'hora_fin': '16:00:00',
    }
]

comando = construir_comando_setdevlock(turnos)
print(json.dumps(comando, indent=2))

# Output esperado:
# {
#   "cmd": "setdevlock",
#   "dayzone": [
#     {"day": [{"section": "08:00~16:00"}]}
#   ],
#   "weekzone": [
#     {"week": [
#       {"day": 1}, {"day": 1}, {"day": 1},
#       {"day": 1}, {"day": 1}, {"day": 1},
#       {"day": 1}
#     ]}
#   ]
# }
```

---

#### 5.2 Verificar que dispositivo recibe comando

**En logs del dispositivo o WebSocket:**

Debe aparecer que el dispositivo recibió y procesó:

```
cmd: "setdevlock"
dayzone: [...]
weekzone: [...]
```

---

### PASO 6: Test End-to-End Completo

**Escenario:** Crear turno → Sincronizar → Dispositivo recibe

**Precondiciones:**
- Dashboard conectado a Supabase ✅
- Python/Flask en Render corriendo ✅
- Dispositivo conectado vía WebSocket ✅

**Procedimiento:**

1. **En Dashboard:**
   ```
   GestorTurnosOptimizado
   └─ Crear turno: "Noche 22-06"
      └─ Hora: 22:00 - 06:00
      └─ Tipo: Nocturno
   ```

2. **En Python (automático cada 10 min):**
   ```
   APScheduler detecta nuevo turno
   └─ Construye setdevlock
   └─ Envía vía WebSocket a dispositivo
   ```

3. **En Dispositivo:**
   ```
   Recibe setdevlock
   └─ Parsea turnos
   └─ Almacena 22:00~06:00
   └─ Lo usa para comparar asistencia
   ```

4. **Validación:**
   - ✅ Turno en BD: `turnos_maestros`
   - ✅ Logs en Render: Sync completado
   - ✅ Dispositivo: Almacenó turno (verificar en pantalla del dispositivo)

---

## 🐛 DEBUGGING

### Error: "Tabla turnos_maestros no existe"

**Solución:**
```bash
# Verificar migración fue aplicada
mcp supabase list-migrations

# Si no está, re-ejecutar migración
mcp supabase apply-migration create_turnos_maestros_table
```

---

### Error: "APScheduler not installed"

**Solución en Render:**
```bash
pip install apscheduler
```

O en `requirements.txt`:
```
apscheduler>=3.10.0
```

---

### Error: "Supabase client not available"

**Verificar:**
```bash
# En FlaskProject, check database.py
cat database.py | grep supabase_client

# Debe haber:
# supabase_client = supabase.create_client(url, key)
```

---

### Turno creado pero no se sincroniza

**Checklist:**
1. ¿`sync_a_dispositivo = true`? ✅
2. ¿`activo = true`? ✅
3. ¿Dispositivo conectado? ✅
4. ¿APScheduler corriendo? ✅ (Ver logs Render)
5. ¿SendOrderJob funciona? ✅ (Probar con comando simple)

---

## 📊 MÉTRICAS DE ÉXITO

| Métrica | Esperado | Estado |
|---------|----------|--------|
| Tiempo creación turno | < 2 seg | ⏳ |
| Tiempo asignación prof | < 2 seg | ⏳ |
| Latencia sync → dispositivo | < 30 seg | ⏳ |
| Turnos sincronizados/día | 100% | ⏳ |
| Errores de sync | 0 | ⏳ |

---

## 🚀 DEPLOYMENT

Una vez todo funciona localmente:

1. **Push a Git:**
   ```bash
   git add .
   git commit -m "feat: Sistema de turnos biométricos optimizado"
   git push origin main
   ```

2. **Redeploy en Render:**
   ```
   Dashboard Render → Trigger deploy
   ```

3. **Verificar logs en Render:**
   ```
   Ver que sync_turnos se inicializa correctamente
   ```

---

## 📝 CHECKLIST FINAL

- [ ] Tabla `turnos_maestros` creada
- [ ] Hook `useTurnosOptimizados` funciona
- [ ] Componente `GestorTurnosOptimizado` sin errores
- [ ] Crear turno funciona
- [ ] Editar turno funciona
- [ ] Eliminar turno funciona
- [ ] Asignar turno a profesional funciona
- [ ] `sync_turnos_to_device.py` cargado
- [ ] APScheduler inicializado en app.py
- [ ] Logs muestran sync periódico
- [ ] Dispositivo recibe comando setdevlock
- [ ] End-to-end completo validado

---

## ✅ COMPLETADO

Una vez todos los checkboxes estén marcados, el sistema está listo para producción.

**Créditos gastados aproximadamente: ~120 tokens**

**Próximos pasos:**
1. Deploy a producción
2. Monitorear logs en Render
3. Solicitar feedback del usuario
4. Ajustes según feedback
