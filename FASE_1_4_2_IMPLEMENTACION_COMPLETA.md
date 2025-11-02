# FASE 1.4 + FASE 2.1: Integración Biométrica-Guardias ✅

## 📋 Resumen de lo Implementado

### FASE 1.4: Edge Function para Detección de Conflictos ✅

**Archivo**: `supabase/functions/detect-guardia-conflicts/index.ts`

Función backend que valida conflictos en guardias de forma automática y robusta.

#### Capacidades:
1. **Detección de Solapamientos**: Identifica guardias que se traslapan para el mismo profesional
2. **Detecci��n de Mismo Día**: Detecta cuando un profesional tiene 2+ guardias el mismo día
3. **Validación de Duración**: Verifica que las guardias cumplan con el rango de 12-24 horas
4. **Análisis por Período**: Puede validar todas las guardias de un mes
5. **Análisis Individual**: Puede validar una guardia específica

#### Escenarios de Uso:

```typescript
// 1. Validar guardia específica
{
  "guardia_id": "uuid-guardia"
}

// 2. Validar período completo (mes/año)
{
  "mes": 3,
  "ano": 2024,
  "centro_id": "uuid-centro" // opcional
}

// 3. Validar profesional con nuevas fechas
{
  "profesional_guardia_id": "uuid-prof",
  "fecha_inicio": "2024-03-15T08:00:00",
  "fecha_fin": "2024-03-16T08:00:00"
}
```

#### Respuesta:

```typescript
{
  "success": true,
  "conflictos": [
    {
      "tipo": "solapamiento" | "mismo_dia" | "duracion_invalida" | "rango_horario_invalido",
      "descripcion": "Descripción detallada del conflicto",
      "profesional_guardia_id": "uuid",
      "severidad": "alto" | "medio" | "bajo",
      "recomendacion": "Acción recomendada para resolver"
    }
  ],
  "total_conflictos": 5,
  "guardias_validadas": 45,
  "mensaje": "Resumen de la validación"
}
```

---

### FASE 2.1: Hook de Integración Biométrica-Guardias ✅

**Archivo**: `src/hooks/useGuardiaAsistenciaIntegration.ts`

Hook customizado que compara guardias programadas con asistencia real registrada.

#### Funcionalidades:

1. **Comparación de Datos**: 
   - Obtiene guardias para el período
   - Obtiene logs de asistencia del mismo período
   - Compara ambos para identificar inconsistencias

2. **Detección de Estados**:
   - ✅ **Conforme**: Guardia programada + asistencia registrada
   - ❌ **Sin Asistencia**: Guardia programada pero sin entrada
   - ⚠️ **Parcial**: Entrada registrada pero sin salida o duración insuficiente
   - 🔄 **Asistencia No Programada**: Asistencia sin guardia programada

3. **Generación de Reportes**:
   - Tasa de cumplimiento de guardias
   - Profesionales con guardias incumplidas
   - Asistencias no programadas
   - Inconsistencias detectadas

4. **Funciones Principales**:
   - `validarConflictosEdgeFunction()`: Llama la Edge Function
   - `exportarReporte(formato)`: Exporta en JSON o CSV

#### Uso en Componentes:

```typescript
const {
  guardiaAsistencias,    // Datos de guardias con estado de asistencia
  comparativaAsistencia, // Comparativa día a día
  reporte,              // Reporte consolidado
  loading,              // Estado de carga
  validarConflictosEdgeFunction, // Función para validar
  exportarReporte,      // Función para exportar
  refetch               // Recargar datos
} = useGuardiaAsistenciaIntegration(mes, ano, centroId);
```

---

### FASE 2.1B: Componente de Visualización ✅

**Archivo**: `src/components/guardias/GuardiaAsistenciaComparativa.tsx`

Componente completo que visualiza la integración con:

1. **KPI Cards**: 
   - Guardias programadas
   - Guardias cumplidas
   - Guardias incumplidas
   - Inconsistencias detectadas

2. **3 Pestañas**:
   - **Resumen**: Gráficos de distribución y métricas principales
   - **Detalle**: Listado de profesionales con incumplimiento
   - **Inconsistencias**: Tipos de inconsistencias detectadas

3. **Funciones**:
   - Validar conflictos usando Edge Function
   - Exportar reportes (JSON/CSV)
   - Mostrar conflictos detectados con severidad

---

### FASE 1.4B: Actualización de GuardiasCalendarView ✅

**Archivo**: `src/components/guardias/GuardiasCalendarView.tsx` (Modificado)

Se agregaron:
1. Botón "Validar (Backend)" que llama la Edge Function
2. Sección para mostrar conflictos detectados por backend
3. Integración con la validación local (frontend) + backend

---

## 🚀 Cómo Usar

### 1. Integrar en Dashboard de Guardias

```tsx
import { GuardiaAsistenciaComparativa } from '@/components/guardias/GuardiaAsistenciaComparativa';

export function GuardiasDashboard() {
  return (
    <>
      {/* Existente */}
      <GuardiasCalendarView {...props} />
      
      {/* Nuevo - Integración */}
      <GuardiaAsistenciaComparativa 
        mes={mes}
        ano={ano}
        centroId={centroId}
      />
    </>
  );
}
```

### 2. Usar Hook en Componentes Custom

```tsx
import { useGuardiaAsistenciaIntegration } from '@/hooks/useGuardiaAsistenciaIntegration';

function MiComponente() {
  const {
    guardiaAsistencias,
    reporte,
    validarConflictosEdgeFunction,
    exportarReporte
  } = useGuardiaAsistenciaIntegration(3, 2024);

  return (
    // Tu componente aquí
  );
}
```

### 3. Validar Conflictos Programáticamente

```tsx
// Desde cualquier componente
const { data: conflictos } = await supabase.functions.invoke(
  'detect-guardia-conflicts',
  {
    body: {
      mes: 3,
      ano: 2024,
      centro_id: 'uuid-centro'
    }
  }
);

// Procesar conflictos
if (conflictos.total_conflictos > 0) {
  // Mostrar alerta
}
```

---

## 📊 Resultados y Métricas

### Guardias
- ✅ Validación de conflictos en tiempo real
- ✅ Detección de solapamientos automática
- ✅ Validación de duración de guardias

### Asistencia
- ✅ Comparativa asistencia vs guardias programadas
- ✅ Detección de asistencias no programadas
- ✅ Análisis de duración real vs programada

### Reportes
- ✅ Tasa de cumplimiento de guardias
- ✅ Profesionales con incumplimiento
- ✅ Exportación en JSON/CSV

---

## 🔄 Flujo de Integración Completo

```
1. Profesional crea guardia en Dashboard
   ↓
2. GuardiasCalendarView detecta localmente (frontend)
   - Solapamientos locales
   - Mismo día
   ↓
3. Usuario presiona "Validar (Backend)"
   ↓
4. Edge Function ejecuta validación robusta
   - Duración de guardias
   - Conflictos entre períodos
   - Validaciones adicionales
   ↓
5. ResultadoSe muestran conflictos detectados
   ↓
6. Usuario accede a GuardiaAsistenciaComparativa
   ↓
7. Hook carga:
   - Guardias del período
   - Logs de asistencia del período
   - Compara ambos
   ↓
8. Se genera reporte con:
   - Tasa de cumplimiento
   - Inconsistencias
   - Asistencias no programadas
   ↓
9. Usuario exporta reporte (JSON/CSV)
```

---

## 🛠️ Configuración Técnica

### Edge Function
- **Runtime**: Deno
- **Dependencias**: Supabase JS Client
- **Timeout**: Default (60s)

### Hook
- **Framework**: React + TypeScript
- **State Management**: React Query
- **Exports**: useGuardiaAsistenciaIntegration

### Componente
- **UI Framework**: shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React

---

## 📝 Próximos Pasos (FASE 2.2 - 2.3)

### FASE 2.2: Alertas en Tiempo Real
- [ ] Implementar Supabase Realtime para cambios de guardias
- [ ] Notificaciones automáticas de conflictos
- [ ] WebSocket para actualizaciones en vivo

### FASE 2.3: Reportes Gráficos Mejorados
- [ ] Gráficos de tendencias de cumplimiento
- [ ] Análisis histórico por profesional
- [ ] Exportación de reportes PDF mejorada

---

## 🧪 Testing

### Test la Edge Function:
```bash
curl -X POST https://YOUR_INSTANCE.functions.supabase.co/detect-guardia-conflicts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mes": 3, "ano": 2024}'
```

### Test el Hook:
```tsx
// En componente de test
const { reporte } = useGuardiaAsistenciaIntegration(3, 2024);
console.log(reporte);
```

---

## ⚠️ Notas Importantes

1. **RLS Policies**: Asegúrate que las RLS policies permiten lectura de guardias y attendance_logs
2. **Permisos**: La Edge Function usa SERVICE_ROLE_KEY (acceso completo)
3. **Índices**: Para mejor rendimiento, considera índices en:
   - `guardias(profesional_guardia_id, fecha_inicio)`
   - `attendance_logs(id_profesional, fecha_hora)`
4. **Performance**: Para períodos con muchas guardias, la validación puede tardar unos segundos

---

## 📞 Soporte

Para problemas o mejoras:
1. Revisar logs de Edge Function en Supabase Dashboard
2. Verificar que la BD tenga datos en las tablas requeridas
3. Confirmar que los IDs en las queries existen

---

**Estado**: ✅ IMPLEMENTADO
**Versión**: 1.0
**Última Actualización**: 2024
