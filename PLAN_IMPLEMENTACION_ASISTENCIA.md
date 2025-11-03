# 🚀 PLAN DE IMPLEMENTACIÓN - SISTEMA DE ASISTENCIA

**Estado:** Listo para Implementación  
**Prioridad:** ALTA  
**Estimado:** 8-12 horas de desarrollo

---

## FASE 1: CREAR VISTA UNIFICADA (1-2 horas)

### Paso 1.1: Crear Vista SQL

**Archivo:** Nueva migración en `supabase/migrations/`  
**Nombre:** `20250115_create_asistencia_consolidada_view.sql`

```sql
-- Vista que unifica attendance_logs y asistencia_fichajes
CREATE OR REPLACE VIEW asistencia_consolidada AS
SELECT 
  -- Identificador único
  gen_random_uuid() as id,
  
  -- Datos principales
  COALESCE(af.id_profesional, al.id_profesional) as profesional_id,
  COALESCE(af.centro_salud_id, p.centro_salud_id) as centro_salud_id,
  COALESCE(af.enroll_id, CAST(al.en_no AS INTEGER)) as enroll_id,
  al.en_no as numero_enno,
  
  -- Timestamp
  COALESCE(af.time_local, al.fecha_hora) as fecha_hora,
  
  -- Entrada/Salida
  CASE 
    WHEN af.inout IS NOT NULL THEN 
      CASE WHEN af.inout = 0 THEN 'IN' ELSE 'OUT' END
    WHEN al.inout IS NOT NULL THEN al.inout
    ELSE NULL
  END as inout,
  
  -- Modo y evento
  af.mode,
  af.event,
  al.raw_line,
  
  -- Temperatura
  af.temperature,
  
  -- Imagen
  af.image_url,
  
  -- Tracking
  'biometrico'::text as source_type  -- Marcar origen
    FROM asistencia_fichajes af
    
UNION ALL

SELECT 
  al.id,
  al.id_profesional,
  (SELECT centro_salud_id FROM profesionales_sanitarios WHERE id = al.id_profesional LIMIT 1),
  CAST(al.en_no AS INTEGER),
  al.en_no,
  al.fecha_hora,
  al.inout,
  NULL,  -- mode
  NULL,  -- event
  al.raw_line,
  NULL,  -- temperature
  NULL,  -- image_url
  'manual'::text  -- Fuente manual
FROM attendance_logs al;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_asistencia_consolidada_profesional 
  ON asistencia_fichajes(id_profesional);

CREATE INDEX IF NOT EXISTS idx_asistencia_consolidada_centro 
  ON asistencia_fichajes(centro_salud_id);

CREATE INDEX IF NOT EXISTS idx_asistencia_consolidada_fecha 
  ON asistencia_fichajes(time_local DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_fecha 
  ON attendance_logs(fecha_hora DESC);
```

**Alternativa si no se quiere usar VIEW:** Crear tabla `asistencia_consolidada` e insertar con TRIGGER.

### Paso 1.2: Crear RLS Policy (si es necesario)

```sql
-- Permitir lectores ver su propio centro
ALTER TABLE asistencia_consolidada ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven su propio centro"
  ON asistencia_consolidada FOR SELECT
  USING (
    centro_salud_id IN (
      SELECT assigned_center_id FROM user_profiles WHERE id = auth.uid()
    )
  );
```

---

## FASE 2: VALIDAR SINCRONIZACIÓN (1-2 horas)

### Paso 2.1: Revisar FlaskProject/sync_with_supabase.py

**Checklist:**
- [ ] Activar scheduler en app.py (descomentar líneas)
- [ ] Validar que `push_new_records_to_supabase()` funcione
- [ ] Confirmar que campos sean mapeados correctamente
- [ ] Revisar logs de Render en últimas 24 horas
- [ ] Validar que `asistencia_fichajes` reciba registros

**Código para habilitar:**
```python
# En app.py, descomentar o agregar:
from sync_with_supabase import start_sync_scheduler

@app.before_request
def init_sync():
    if not hasattr(g, 'sync_initialized'):
        # Iniciar sync con intervalo de 5 minutos
        start_sync_scheduler(supabase_client=None, sync_interval=5)
        g.sync_initialized = True
```

### Paso 2.2: Verificar Mapeos de Campos

**En `sync_with_supabase.py`, línea ~68-86, verificar:**
```python
data = {
    'enroll_id': record.enroll_id,              # ✓ Correcto
    'records_time': record.records_time.isoformat(),  # ✓ ISO formato
    'mode': record.mode,                        # ✓
    'int_out': record.intOut,                   # REVISAR: nombre
    'event': record.event,                      # ✓
    'device_serial_num': record.device_serial_num,  # ✓
    'temperature': record.temperature,          # ✓ (pero revisar factor /10 vs /100)
    'image': record.image,                      # ✓
    # Falta: profesional_id, centro_salud_id, device_sn
}
```

**Mejora sugerida:** Enriquecer con datos de mapeo
```python
# Buscar profesional y centro en el mapeo
mapping = get_mapping_for_enrollid(record.enroll_id)
data['id_profesional'] = mapping.get('profesional_id')
data['centro_salud_id'] = mapping.get('centro_salud_id')
data['id_dispositivo'] = mapping.get('dispositivo_id')
data['source_type'] = 'biometrico'
```

### Paso 2.3: Test Manual

```bash
# En Render logs:
# 1. Generar un fichaje desde dispositivo
# 2. Revisar que aparezca en asistencia_fichajes (Supabase)
# 3. Validar timestamp es ISO 8601
# 4. Confirmar mapeado a profesional correctamente
```

---

## FASE 3: REFACTORIZAR FRONTEND (2-3 horas)

### Paso 3.1: Crear Hook Unificado `useAsistenciaConsolidada.ts`

**Archivo:** `src/hooks/useAsistenciaConsolidada.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AsistenciaConsolidada {
  id: string;
  profesional_id: string;
  centro_salud_id: string;
  enroll_id: number;
  numero_enno: string;
  fecha_hora: string;
  inout: 'IN' | 'OUT' | null;
  mode: string | null;
  event: number | null;
  raw_line: string | null;
  temperature: number | null;
  image_url: string | null;
  source_type: 'biometrico' | 'manual';
}

interface FiltrosAsistencia {
  centroId?: string;
  profesionalId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  sourceType?: 'biometrico' | 'manual' | null;
  enNo?: string;
}

export function useAsistenciaConsolidada(filtros?: FiltrosAsistencia) {
  return useQuery<AsistenciaConsolidada[]>({
    queryKey: ['asistencia-consolidada', filtros],
    queryFn: async () => {
      let query = supabase.from('asistencia_consolidada').select('*');

      // Aplicar filtros
      if (filtros?.centroId) {
        query = query.eq('centro_salud_id', filtros.centroId);
      }
      if (filtros?.profesionalId) {
        query = query.eq('profesional_id', filtros.profesionalId);
      }
      if (filtros?.sourceType) {
        query = query.eq('source_type', filtros.sourceType);
      }
      if (filtros?.enNo) {
        query = query.eq('numero_enno', filtros.enNo);
      }
      if (filtros?.fechaDesde && filtros?.fechaHasta) {
        query = query
          .gte('fecha_hora', filtros.fechaDesde)
          .lte('fecha_hora', filtros.fechaHasta);
      }

      // Ordenar por fecha descendente
      query = query.order('fecha_hora', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 60_000, // 1 minuto
  });
}
```

### Paso 3.2: Actualizar `AsistenciaOverviewDashboard.tsx`

**Cambios principales:**
```typescript
// ANTES: Múltiples queries
const { data: fichajesBiometrico } = useAsistencia();
const { data: fichajeslogs } = useQuery(...attendance_logs...);

// DESPUÉS: Una sola query
const { data: todosFichajes } = useAsistenciaConsolidada({
  centroId: selectedCentroId,
  fechaDesde: fecha_inicio,
  fechaHasta: fecha_fin,
});

// Separar por fuente si es necesario
const fichajeBiometrico = todosFichajes.filter(f => f.source_type === 'biometrico');
const fichajManual = todosFichajes.filter(f => f.source_type === 'manual');
```

### Paso 3.3: Eliminar Llamadas a Render

**En BiometricSyncPanel.tsx:**
```typescript
// ANTES: Conecta a Render para traer datos
const syncing = await fetchFromRender('/biometric/logs');

// DESPUÉS: Lee desde Supabase
const { data } = useAsistenciaConsolidada({ sourceType: 'biometrico' });
```

---

## FASE 4: MEJORAR UI/UX (4-6 horas)

### Paso 4.1: Dashboard Mejorado

**Crear:** `src/components/asistencia/AsistenciaIntegradoDashboard.tsx`

```typescript
export function AsistenciaIntegradoDashboard() {
  const [activeTab, setActiveTab] = useState<'consolidado' | 'biometrico' | 'manual'>('consolidado');
  const [filtros, setFiltros] = useState<FiltrosAsistencia>();

  const { data: todosLosFichajes } = useAsistenciaConsolidada(filtros);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="consolidado">
          Todo ({todosLosFichajes?.length || 0})
        </TabsTrigger>
        <TabsTrigger value="biometrico">
          Biométrico ({todosLosFichajes?.filter(f => f.source_type === 'biometrico').length || 0})
        </TabsTrigger>
        <TabsTrigger value="manual">
          Manual ({todosLosFichajes?.filter(f => f.source_type === 'manual').length || 0})
        </TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab}>
        <FiltrosAsistencia onFiltrosChange={setFiltros} />
        <AsistenciaTable datos={todosLosFichajes} sourceFilter={activeTab === 'consolidado' ? null : activeTab} />
      </TabsContent>
    </Tabs>
  );
}
```

### Paso 4.2: Tabla Unificada con Columnas

| Columna | Origen | Descripción |
|---------|--------|-------------|
| Fecha/Hora | Ambos | fecha_hora |
| EnNo | Ambos | numero_enno |
| Profesional | Ambos | nombre_completo (JOIN) |
| Centro | Ambos | nombre_centro (JOIN) |
| IN/OUT | Ambos | inout |
| Temperatura | Biométrico | temperature |
| Imagen | Biométrico | image_url (thumbnail) |
| Fuente | Ambos | source_type (badge) |

### Paso 4.3: Filtros Avanzados

```typescript
<FilterGroup>
  <FilterDate label="Desde" value={filtros.fechaDesde} onChange={...} />
  <FilterDate label="Hasta" value={filtros.fechaHasta} onChange={...} />
  <FilterSelect label="Centro" options={centros} value={filtros.centroId} />
  <FilterSelect label="Profesional" options={profesionales} value={filtros.profesionalId} />
  <FilterSelect label="Fuente" options={[
    { value: 'biometrico', label: 'Biométrico' },
    { value: 'manual', label: 'Manual' },
  ]} />
</FilterGroup>
```

### Paso 4.4: Visualizaciones (Charts)

```typescript
<Card>
  <CardTitle>Asistencia Diaria</CardTitle>
  <LineChart 
    data={todosFichajes}
    groupBy="fecha"
    metrics={['total', 'biometrico', 'manual']}
  />
</Card>
```

---

## FASE 5: AUDITORÍA (1-2 horas)

### Paso 5.1: Crear Tabla de Auditoría

```sql
CREATE TABLE asistencia_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fichaje_id uuid,
  accion text NOT NULL,
  usuario_id uuid REFERENCES auth.users(id),
  datos_antes jsonb,
  datos_despues jsonb,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE asistencia_auditoria ENABLE ROW LEVEL SECURITY;
```

### Paso 5.2: Crear Trigger para Auditoría Auto

```sql
CREATE OR REPLACE FUNCTION audit_asistencia_fichajes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO asistencia_auditoria (fichaje_id, accion, usuario_id, datos_antes, datos_despues)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    row_to_json(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_asistencia_fichajes
  AFTER INSERT OR UPDATE ON asistencia_fichajes
  FOR EACH ROW
  EXECUTE FUNCTION audit_asistencia_fichajes();
```

---

## FASE 6: TESTING (2-3 horas)

### Paso 6.1: Test de Vista SQL

```sql
-- Verificar conteo
SELECT source_type, COUNT(*) FROM asistencia_consolidada GROUP BY source_type;

-- Esperar: biometrico ~830, manual ~7

-- Verificar mapeos
SELECT * FROM asistencia_consolidada LIMIT 1;

-- Verificar que profesional_id no sea null
SELECT COUNT(*) FROM asistencia_consolidada WHERE profesional_id IS NULL;
```

### Paso 6.2: Test de Hook

```typescript
// En test file
const { result } = renderHook(() => useAsistenciaConsolidada({
  centroId: 'test-uuid',
}));

expect(result.current.data).toBeDefined();
expect(result.current.data?.length).toBeGreaterThan(0);
```

### Paso 6.3: Test de Reportes

```typescript
// Validar que reportes mensuales sean consistentes
const todosFichajes = useAsistenciaConsolidada({ });
const total = todosFichajes.length;
const biometrico = todosFichajes.filter(f => f.source_type === 'biometrico').length;
const manual = todosFichajes.filter(f => f.source_type === 'manual').length;

expect(total).toBe(biometrico + manual);
```

---

## ISSUES A RESOLVER DURANTE IMPLEMENTACIÓN

### Issue 1: Temperatura /10 vs /100
**Ubicación:** FlaskProject/app.py
- get_attendance (línea ~1011): `/10`
- get_all_log (línea ~1260): `/100`

**Solución:** Estandarizar a `/100` (escala Celsius × 100)

**Código:**
```python
# get_attendance
if record.get("temp"):
    temperature = round(record["temp"] / 100, 1)  # CAMBIAR DE /10 A /100

# get_all_log
if record.get("temp") is not None:
    temperature = record["temp"] / 100  # YA ESTÁ BIEN
    temperature = round(temperature, 1)
```

### Issue 2: DateTime Format
**Ubicación:** insert_record2() en Models/Records.py

**Validar que:** `records_time` sea siempre ISO 8601

```python
def insert_record2(**kwargs):
    # Normalizar records_time
    if 'records_time' in kwargs and isinstance(kwargs['records_time'], str):
        try:
            kwargs['records_time'] = datetime.fromisoformat(kwargs['records_time'].replace('Z', '+00:00'))
        except:
            kwargs['records_time'] = datetime.now(timezone.utc)
```

### Issue 3: Mapeo Incompleto
**Ubicación:** Validación al guardar attendance_logs o asistencia_fichajes

**Agregar validación:**
```sql
ALTER TABLE attendance_logs
ADD CONSTRAINT check_en_no_mapped
CHECK (
  en_no IS NOT NULL AND
  en_no IN (SELECT DISTINCT en_no FROM empleado_dispositivo_map)
);
```

---

## DEPLOYMENT CHECKLIST

- [ ] Crear y ejecutar migración (vista + índices)
- [ ] Habilitar sync_with_supabase en Render (app.py)
- [ ] Crear hook `useAsistenciaConsolidada.ts`
- [ ] Actualizar componentes frontend
- [ ] Crear tabla de auditoría
- [ ] Ejecutar tests
- [ ] Validar reportes
- [ ] Documentar en WIKI
- [ ] Capacitar usuarios
- [ ] Monitor en producción 24h
- [ ] Optimizar índices si es necesario

---

## ROLLBACK PLAN

Si hay problemas críticos:

```sql
-- Desactivar vista
DROP VIEW asistencia_consolidada;

-- Volver a queries separadas en frontend
-- (componentes todavía funcionarán con fallback)
```

---

## ESTIMACIÓN FINAL

| Fase | Horas | Status |
|------|-------|--------|
| 1. Vista SQL | 1 | 🔄 |
| 2. Sincronización | 2 | ⏳ |
| 3. Frontend | 3 | ⏳ |
| 4. UI/UX | 5 | ⏳ |
| 5. Auditoría | 2 | ⏳ |
| 6. Testing | 3 | ⏳ |
| **TOTAL** | **16** | ⏳ |

**Con optimizaciones:** 8-12 horas realistas

---

**Documento:** Pronto para implementación  
**Próximo:** Comenzar Fase 1 (Vista SQL)
