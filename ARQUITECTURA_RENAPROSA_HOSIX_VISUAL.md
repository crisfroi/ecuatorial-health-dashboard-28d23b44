# 🏗️ Arquitectura de Tarifación Dinámica - Diagrama Visual

## 📐 Diagrama General

```
┌──────────────────────────────────────────────────────────────┐
│                    RENAPROSA (SERMED2)                       │
│                   NODO CENTRAL/MAESTRO                        │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ UI: Módulo "Integración HOSIX" (Facturación.tsx)      │  │
│  │ - Pestaña: Conceptos Maestros (ConceptosManager)      │  │
│  │ - Pestaña: Reglas de Tarifación (ReglasEditor)        │  │
│  └────────────────────────────────────────────────────────┘  │
│                           ↓                                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ SUPABASE - RENAPROSA                                   │  │
│  │                                                          │  │
│  │  Tablas Maestro:                                        │  │
│  │  ├─ renaprosa_conceptos_maestro (5 conceptos)          │  │
│  │  │  └─ RLS: ADMIN ONLY (write), PUBLIC (read)          │  │
│  │  │  └─ Campos: código, descripción, tipo, precio_base  │  │
│  │  │  └─ Flags: usa_tarifacion_dinamica, visible_aseg    │  │
│  │  │                                                       │  │
│  │  ├─ renaprosa_reglas_tarifacion (1+ regla)             │  │
│  │  │  └─ RLS: ADMIN ONLY (write), PUBLIC (read)          │  │
│  │  │  └─ Campos: tipo_regla, condicion_json, aplicacion  │  │
│  │  │  └─ Tipos: edad, embarazo, beneficio, urgencia...   │  │
│  │  │  └─ Aplicación: %, $, multiplicador, precio_directo │  │
│  │  │                                                       │  │
│  │  └─ renaprosa_sync_log (auditoría)                     │  │
│  │     └─ Registro de cambios, nodos, sincronización      │  │
│  │                                                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                           ↓                                    │
│           API/Trigger de Sincronización                       │
│           (por implementar en Fase 4)                         │
│                           ↓                                    │
└──────────────────────────────────────────────────────────────┘
  │
  │ REPLICACIÓN AUTOMÁTICA
  │ (Edge Function / Trigger)
  │
  ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
  │
  ├──────────────────────────────────────────────────────────────┐
  │                                                                │
  │  ┌─────────────────────────────┐   ┌─────────────────────┐  │
  │  │ HOSIX-QUITO (Nodo 1)        │   │ HOSIX-CUENCA (N-2) │  │
  │  │ (HOSIX-GEPROSALUD)          │   │                     │  │
  │  │                              │   └─────────────────────┘  │
  │  │ ┌─────────────────────────┐ │                             │
  │  │ │ Replica Local           │ │                             │
  │  │ │                          │ │                             │
  │  │ │ • hosix_conceptos_      │ │                             │
  │  │ │   maestro (READ-ONLY)   │ │   (Misma estructura)       │
  │  │ │ • hosix_reglas_         │ │                             │
  │  │ │   tarifacion (READ-ONLY)│ │                             │
  │  │ │ • hosix_pacientes_      │ │                             │
  │  │ │   variables_facturacion │ │                             │
  │  │ │   (READ/WRITE local)    │ │                             │
  │  │ │                          │ │                             │
  │  │ └─────────────────────────┘ │                             │
  │  │              ↓               │                             │
  │  │ ┌─────────────────────────┐ │                             │
  │  │ │ Función PL/pgSQL:       │ │                             │
  │  │ │                          │ │                             │
  │  │ │ hosix_calcular_          │ │                             │
  │  │ │ precio_dinamico(         │ │                             │
  │  │ │   concepto_id,           │ │                             │
  │  │ │   paciente_id,           │ │                             │
  │  │ │   aseguradora_id         │ │                             │
  │  │ │ )                        │ │                             │
  │  │ │                          │ │                             │
  │  │ │ Retorna: {               │ │                             │
  │  │ │   precio_base,           │ │                             │
  │  │ │   precio_final,          │ │                             │
  │  │ │   reglas_aplicadas,      │ │                             │
  │  │ │   desglose               │ │                             │
  │  │ │ }                        │ │                             │
  │  │ │                          │ │                             │
  │  │ └─────────────────────────┘ │                             │
  │  │              ↓               │                             │
  │  │ ┌─────────────────────────┐ │                             │
  │  │ │ UI: Facturación         │ │                             │
  │  │ │ (TarifasManager,        │ │                             │
  │  │ │  FacturasGenerator)     │ │                             │
  │  │ │                          │ │                             │
  │  │ │ ✓ Lee conceptos maestros│ │                             │
  │  │ │ ✓ Aplica reglas         │ │                             │
  │  │ │ ✓ Calcula precios       │ │                             │
  │  │ │ ✓ Emite facturas        │ │                             │
  │  │ └─────────────────────────┘ │                             │
  │  │                              │                             │
  │  └──────────────────────────────┘                             │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos

### 1️⃣ Administración (RENAPROSA)

```
Admin RENAPROSA
     ↓
Accede: /facturacion → Integración HOSIX
     ↓
┌─────────────────────────┐
│ ConceptosManager        │
│                         │
│ 1. Busca concepto       │
│ 2. Crea/Edita/Borra    │
│ 3. Valida campos       │
│ 4. Guarda en BD        │
└─────────────────────────┘
     ↓
┌─────────────────────────┐
│ ReglasEditor            │
│                         │
│ 1. Selecciona concepto  │
│ 2. Configura regla      │
│    - tipo_regla         │
│    - condicion_json     │
│    - tipo_aplicacion    │
│    - valor              │
│ 3. Define orden         │
│ 4. Guarda en BD        │
└─────────────────────────┘
     ↓
RENAPROSA BD
└─ renaprosa_conceptos_maestro
└─ renaprosa_reglas_tarifacion
     ↓
[Trigger/Edge Function]
     ↓
HOSIX BD
└─ hosix_conceptos_maestro (replica)
└─ hosix_reglas_tarifacion (replica)
```

### 2️⃣ Cálculo de Precio (HOSIX)

```
Usuario HOSIX (Médico/Facturación)
     ↓
Accede: /facturacion → Generar Facturas
     ↓
┌─────────────────────────────────────┐
│ FacturasGenerator                   │
│                                     │
│ 1. Selecciona paciente              │
│    └─ Lee hosix_pacientes           │
│       └─ Obtiene variables locales  │
│ 2. Selecciona concepto              │
│    └─ Lee hosix_conceptos_maestro   │
│ 3. Selecciona aseguradora           │
│ 4. Calcula precio:                  │
│    hosix_calcular_precio_dinamico(  │
│      concepto_id,                   │
│      paciente_id,                   │
│      aseguradora_id                 │
│    )                                │
└─────────────────────────────────────┘
     ↓
┌─────────────────────────────────────┐
│ Función: calcular_precio_dinamico() │
│                                     │
│ 1. Obtener precio_base              │
│    SELECT precio_base FROM          │
│    hosix_conceptos_maestro          │
│ 2. Obtener variables paciente       │
│    SELECT * FROM                    │
│    hosix_pacientes_variables_fac    │
│ 3. Obtener reglas (ordenadas)       │
│    SELECT * FROM                    │
│    hosix_reglas_tarifacion          │
│    ORDER BY orden_aplicacion        │
│ 4. Aplicar reglas secuencialmente   │
│    FOR EACH regla:                  │
│      - Evaluar condición            │
│      - Aplicar: %, $, *, precio     │
│      - Respetar min/max             │
│      - Acumular si aplica           │
│ 5. Retornar resultado JSON          │
└─────────────────────────────────────┘
     ↓
Respuesta:
{
  "precio_base": 50.00,
  "precio_final": 40.00,
  "reglas_aplicadas": 1,
  "desglose": [
    {
      "nombre_regla": "Descuento Menores 5 años",
      "tipo_aplicacion": "porcentaje",
      "valor": -10.00,
      "precio_despues": 40.00
    }
  ]
}
     ↓
UI Actualiza precio en formulario
     ↓
Usuario confirma y crea factura
     ↓
Factura se emite con precio calculado dinámicamente
```

---

## 📊 Tabla Comparativa: RENAPROSA vs HOSIX

| Aspecto | RENAPROSA | HOSIX |
|---------|-----------|-------|
| **Rol** | Fuente de verdad | Consumidor |
| **Conceptos** | ✅ CRUD completo | 🔒 Lectura (replica) |
| **Reglas** | ✅ CRUD completo | 🔒 Lectura (replica) |
| **Variables Paciente** | ❌ No | ✅ CRUD (local) |
| **Cálculo Precios** | ❌ No | ✅ Sí (función) |
| **Sincronización** | 🚀 Origen | 📥 Destino |
| **RLS (write)** | `admin_renaprosa` | `service_role` (sync) |
| **Facturación** | ❌ No local | ✅ Sí |

---

## 🔐 RLS por Tabla

### RENAPROSA

```
renaprosa_conceptos_maestro:
├─ SELECT: Público (todos leen)
├─ INSERT: admin_renaprosa
├─ UPDATE: admin_renaprosa
└─ DELETE: admin_renaprosa

renaprosa_reglas_tarifacion:
├─ SELECT: Público (todos leen)
├─ INSERT: admin_renaprosa
├─ UPDATE: admin_renaprosa
└─ DELETE: admin_renaprosa

renaprosa_sync_log:
├─ SELECT: admin_renaprosa (auditoría)
├─ INSERT: service_role (sync)
└─ UPDATE: service_role
```

### HOSIX

```
hosix_conceptos_maestro:
├─ SELECT: Público (todos leen)
├─ INSERT: service_role (sync only)
├─ UPDATE: service_role (sync only)
└─ DELETE: ❌ Bloqueado

hosix_reglas_tarifacion:
├─ SELECT: Público (todos leen)
├─ INSERT: service_role (sync only)
├─ UPDATE: service_role (sync only)
└─ DELETE: ❌ Bloqueado

hosix_pacientes_variables_facturacion:
├─ SELECT: facturacion, admin, medico
├─ INSERT: facturacion, admin
├─ UPDATE: facturacion, admin
└─ DELETE: facturacion, admin
```

---

## 🎯 Casos de Uso

### Caso 1: Crear Nuevo Concepto

```
Admin RENAPROSA
    ↓
Abre: Facturación → Integración HOSIX → Conceptos Maestros
    ↓
Click "Nuevo Concepto"
    ↓
Llena formulario:
├─ Código: CONS-CARRILLO
├─ Descripción: Consulta Médico Carrillólogo
├─ Tipo: servicio
├─ Precio Base: $75.00
├─ Usa Tarifación Dinámica: ✓
├─ Visible Aseguradoras: ✓
└─ Activo: ✓
    ↓
Click "Crear"
    ↓
INSERT INTO renaprosa_conceptos_maestro (...)
    ↓
Trigger/API → Replica a HOSIX nodos
    ↓
sync_log:
├─ nodo_destino: HOSIX-QUITO, HOSIX-CUENCA, HOSIX-AMAZONÍA
├─ tabla_origen: renaprosa_conceptos_maestro
├─ registros_afectados: 1
├─ tipo_sincronizacion: INSERT
└─ estado: completado
    ↓
Ahora médicos en HOSIX pueden facturar con este concepto
```

### Caso 2: Crear Regla de Descuento

```
Admin RENAPROSA
    ↓
Abre: Facturación → Integración HOSIX → Reglas de Tarifación
    ↓
Click "Nueva Regla"
    ↓
Llena formulario:
├─ Concepto: "Consulta Médica"
├─ Nombre: "Descuento Embarazadas"
├─ Tipo: embarazo
├─ Aplicación: Porcentaje
├─ Valor: -15
├─ Orden: 2
├─ Permite Acumulación: ✓
├─ Es Descuento: ✓
├─ Precio Mínimo: $40.00
└─ Activo: ✓
    ↓
Click "Crear"
    ↓
INSERT INTO renaprosa_reglas_tarifacion (...)
    ↓
Replica automática a HOSIX
    ↓
Ahora cuando se facture a embarazada:
precio = precio_base × (1 - 0.15) = $50 × 0.85 = $42.50
(Si está por encima del mínimo de $40)
```

### Caso 3: Calcular Precio en HOSIX

```
Médico HOSIX
    ↓
Paciente: "María García" (edad 35, embarazada)
Concepto: "Consulta Médica" (precio_base $50)
Aseguradora: "Seguros Pichincha"
    ↓
Sistema calcula:
hosix_calcular_precio_dinamico(
  concepto_id = CONS-MED,
  paciente_id = pac_maria,
  aseguradora_id = seguros_pichincha
)
    ↓
Evalúa reglas en orden:
1. Regla "Descuento Menores 5 años"
   └─ Condición: edad 0-5? NO → skip
2. Regla "Descuento Embarazadas" (orden 2)
   └─ Condición: es_embarazada = true? SÍ
   └─ Aplicación: -15%
   └─ Cálculo: $50 × (1 - 0.15) = $42.50
   └─ Verifica min: $42.50 > $40.00 ✓
    ↓
Resultado:
{
  "precio_base": 50.00,
  "precio_final": 42.50,
  "reglas_aplicadas": 1,
  "desglose": [{
    "nombre_regla": "Descuento Embarazadas",
    "tipo_aplicacion": "porcentaje",
    "valor": -7.50,
    "precio_despues": 42.50
  }]
}
    ↓
Factura emitida por $42.50
```

---

## 🚀 Timeline de Implementación

```
Hoy (Sesión Actual):
├─ ✅ Diseño UI completado
├─ ✅ ConceptosManager.tsx creado
├─ ✅ ReglasEditor.tsx creado
├─ ✅ IntegracionHosix.tsx creado
├─ ✅ Migraciones documentadas
└─ ✅ Guías creadas

Próxima Sesión (Fase 2):
├─ [ ] Aplicar migraciones en RENAPROSA
├─ [ ] Aplicar migraciones en HOSIX
├─ [ ] Crear hooks useRenaprosaConceptos
├─ [ ] Crear hooks useRenaprosaReglas
└─ [ ] Testing básico

Sesión 3 (Fase 3):
├─ [ ] Implementar sincronización
├─ [ ] Edge Function para replicación
├─ [ ] Triggers en RENAPROSA
└─ [ ] Testing de sincronización

Sesión 4+ (Fase 4):
├─ [ ] Testing exhaustivo
├─ [ ] Rollout a producción
├─ [ ] Documentación final
└─ [ ] Capacitación
```

---

## 📋 Resumen Arquitectura

```
┌──────────────────────────────────────────────────┐
│        SISTEMA CENTRALIZADO DE TARIFACIÓN        │
├──────────────────────────────────────────────────┤
│                                                  │
│  TIER 1: ADMINISTRACIÓN (RENAPROSA)             │
│  ├─ Gestión de Conceptos Maestros              │
│  ├─ Definición de Reglas Dinámicas             │
│  └─ Auditoría de Cambios                       │
│                                                  │
│  TIER 2: SINCRONIZACIÓN (Edge Function)        │
│  ├─ Replicar Conceptos                         │
│  ├─ Replicar Reglas                            │
│  └─ Registrar en Log                           │
│                                                  │
│  TIER 3: CONSUMO (HOSIX Nodos)                 │
│  ├─ Lectura de Conceptos/Reglas                │
│  ├─ Variables Locales de Pacientes             │
│  └─ Cálculo Dinámico de Precios                │
│                                                  │
│  TIER 4: FACTURACIÓN (UI)                      │
│  ├─ Selección de Concepto                      │
│  ├─ Aplicación de Cálculo                      │
│  └─ Emisión de Facturas                        │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

**Esta arquitectura garantiza:**
✅ Consistencia de precios entre nodos
✅ Actualizaciones centralizadas
✅ Cálculos dinámicos por múltiples parámetros
✅ Sin discrepancias de precios
✅ Auditoría completa de cambios
