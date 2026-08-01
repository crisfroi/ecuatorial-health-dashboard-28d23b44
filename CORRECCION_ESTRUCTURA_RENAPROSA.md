# ⚠️ CORRECCIÓN DE ESTRUCTURA - RENAPROSA vs HOSIX

## El Problema

❌ **Incorrecto:**
```
SERMED2/src/components/hosix/facturacion/
├─ ConceptosManager.tsx
├─ ReglasEditor.tsx
├─ IntegracionHosix.tsx
```

**Razón:** La carpeta `hosix/` en SERMED2 es RESIDUAL de cuando ambas aplicaciones estaban unidas. RENAPROSA y HOSIX son aplicaciones SEPARADAS con:
- ✅ Bases de datos propias
- ✅ Auth propios
- ✅ Types propios
- ✅ Dashboard propio

---

## La Solución Correcta

✅ **Correcto:**
```
SERMED2/src/modules/facturacion/
├─ components/
│  ├─ ConceptosManager.tsx (450 líneas)
│  ├─ ReglasEditor.tsx (572 líneas)
│  └─ IntegracionHosix.tsx (86 líneas)
├─ pages/
│  └─ Facturacion.tsx (29 líneas)
└─ hooks/
   ├─ useRenaprosaConceptos.ts (próxima sesión)
   └─ useRenaprosaReglas.ts (próxima sesión)
```

**Razón:** 
- RENAPROSA es una aplicación INDEPENDIENTE
- El módulo de Facturación gestiona CONCEPTOS MAESTROS y REGLAS
- Estos datos se REPLICAN a HOSIX nodos
- No son componentes de HOSIX, son componentes de RENAPROSA

---

## Estructura Correcta de Carpetas

### SERMED2 (RENAPROSA)

```
SERMED2/
├─ src/
│  ├─ components/        ← Componentes genéricos/reutilizables
│  │  ├─ ui/
│  │  ├─ dashboard/
│  │  ├─ forms/
│  │  └─ ...
│  │
│  ├─ modules/           ← Módulos funcionales (NUEVO)
│  │  └─ facturacion/    ← MÓDULO DE FACTURACIÓN DE RENAPROSA
│  │     ├─ components/
│  │     │  ├─ ConceptosManager.tsx
│  │     │  ├─ ReglasEditor.tsx
│  │     │  └─ IntegracionHosix.tsx
│  │     ├─ pages/
│  │     │  └─ Facturacion.tsx
│  │     ├─ hooks/
│  │     │  ├─ useRenaprosaConceptos.ts
│  │     │  └─ useRenaprosaReglas.ts
│  │     └─ types.ts
│  │
│  ├─ pages/             ← Páginas principales de RENAPROSA
│  │  ├─ Dashboard.tsx
│  │  ├─ Auth.tsx
│  │  └─ ...
│  │
│  ├─ hosix/             ← CARPETA RESIDUAL (NO USAR)
│  │  └─ [contiene código de HOSIX que debe eliminarse]
│  │
│  └─ ...
│
└─ supabase/
   ├─ migrations/        ← Migraciones RENAPROSA
   │  ├─ 20260625_001_renaprosa_conceptos_maestro.sql
   │  ├─ 20260625_002_renaprosa_reglas_tarifacion.sql
   │  └─ 20260625_003_renaprosa_sync_log.sql
   └─ ...
```

### HOSIX-GEPROSALUD (APLICACIÓN SEPARADA)

```
HOSIX-GEPROSALUD/
├─ src/
│  ├─ components/
│  │  ├─ hosix/          ← Componentes específicos de HOSIX
│  │  │  ├─ facturacion/ ← Usa las RÉPLICAS de conceptos/reglas
│  │  │  ├─ admision/
│  │  │  └─ ...
│  │
│  ├─ pages/
│  │  └─ Facturacion.tsx ← Lee de réplicas, NO edita conceptos
│  │
│  └─ ...
│
└─ supabase/
   ├─ migrations/        ← Migraciones HOSIX
   │  ├─ 20260625_001_hosix_replica_conceptos_maestro.sql
   │  ├─ 20260625_002_hosix_replica_reglas_tarifacion.sql
   │  ├─ 20260625_003_hosix_pacientes_variables_facturacion.sql
   │  └─ 20260625_004_hosix_funcion_calcular_precio_dinamico.sql
   └─ ...
```

---

## Diferencia Clave

| Aspecto | RENAPROSA | HOSIX |
|---------|-----------|-------|
| **Rol** | Administra | Consume |
| **Conceptos** | ✅ Crea/Edita | 🔒 Lee (replica) |
| **Reglas** | ✅ Crea/Edita | 🔒 Lee (replica) |
| **Facturación** | ❌ No factura | ✅ Factura con precios dinámicos |
| **Estructura** | `src/modules/facturacion/` | `src/components/hosix/facturacion/` |
| **BD** | Propia (RENAPROSA) | Propia (HOSIX) |
| **Auth** | Propia | Propia |

---

## Archivos Creados en la Ubicación CORRECTA

```
✅ SERMED2/src/modules/facturacion/components/ConceptosManager.tsx (450 líneas)
✅ SERMED2/src/modules/facturacion/components/ReglasEditor.tsx (572 líneas)
✅ SERMED2/src/modules/facturacion/components/IntegracionHosix.tsx (86 líneas)
✅ SERMED2/src/modules/facturacion/pages/Facturacion.tsx (29 líneas)
```

**Total:** 1,137 líneas de código React en RENAPROSA

---

## ¿Qué hacer con la carpeta hosix/?

La carpeta `SERMED2/src/components/hosix/` es RESIDUAL.

**No debería haber nada de RENAPROSA dentro de ella.**

Si contiene código de HOSIX (que no es el caso), debería:
1. Ser movida a un repositorio separado HOSIX-GEPROSALUD
2. O ser eliminada de SERMED2

**En esta sesión:**
- ✅ Creamos componentes en la ubicación CORRECTA (`src/modules/facturacion/`)
- ⚠️ La carpeta `src/components/hosix/` se deja intacta (por si contiene código heredado importante)

**Próxima sesión:**
- Revisaremos qué hay en `src/components/hosix/` y lo eliminaremos si es efectivamente RESIDUAL

---

## Flujo Correcto de Datos

```
RENAPROSA (SERMED2)
│
├─ Dashboard Admin
├─ src/modules/facturacion/
│  └─ Administra Conceptos + Reglas
│
└─ Supabase RENAPROSA
   ├─ renaprosa_conceptos_maestro
   ├─ renaprosa_reglas_tarifacion
   └─ renaprosa_sync_log
        ↓ Sincronización Automática
        ↓ (Edge Function / Trigger)
        ↓
HOSIX Nodos (HOSIX-GEPROSALUD)
│
├─ Dashboard Médico
├─ src/components/hosix/facturacion/
│  └─ Lee conceptos/reglas, factura con precios dinámicos
│
└─ Supabase HOSIX
   ├─ hosix_conceptos_maestro (REPLICA read-only)
   ├─ hosix_reglas_tarifacion (REPLICA read-only)
   ├─ hosix_pacientes_variables_facturacion (local)
   └─ hosix_calcular_precio_dinamico() (función)
```

---

## Resumen de la Corrección

### ❌ LO QUE NO HACEMOS
```
SERMED2/src/components/hosix/facturacion/ConceptosManager.tsx
SERMED2/src/components/hosix/facturacion/ReglasEditor.tsx
```
(Incorrecto porque confunde RENAPROSA con HOSIX)

### ✅ LO QUE HACEMOS
```
SERMED2/src/modules/facturacion/components/ConceptosManager.tsx
SERMED2/src/modules/facturacion/components/ReglasEditor.tsx
```
(Correcto porque es el módulo de RENAPROSA)

---

## Próxima Sesión

Cuando hagamos las migraciones:

**En RENAPROSA (SERMED2):**
- Aplicar 3 migraciones (conceptos, reglas, sync_log)
- Crear hooks en `src/modules/facturacion/hooks/`
- Conectar componentes con Supabase RENAPROSA

**En HOSIX (HOSIX-GEPROSALUD):**
- Aplicar 4 migraciones (replicas + variables + función)
- Usar tablas réplica como READ-ONLY
- Usar función de cálculo dinámico en facturación

---

**Estado:** ✅ ESTRUCTURA CORREGIDA

Gracias por señalar esto. Ahora está correctamente:
- RENAPROSA como aplicación independiente
- HOSIX como aplicación separada
- Módulos lógicamente separados
