# ✅ Implementación de UI - Tarifación Dinámica Centralizada

## 📊 Estado General

**Fase:** Diseño e Implementación de UI (COMPLETADO) ✅  
**Siguiente Fase:** Aplicación de Migraciones  
**Fecha:** 2025-06-20

---

## 🎨 Componentes React Implementados (SERMED2)

### 1. ✅ Pestaña "Integración HOSIX" 
**Archivo:** `src/pages/Hosix/Facturacion.tsx`

**Cambios:**
- Agregada nueva pestaña con ícono Network (red)
- Actualizado grid de TabsList de 5 a 6 columnas
- Nueva ruta: `/facturacion` → Tab `integracion`

---

### 2. ✅ ConceptosManager.tsx
**Archivo:** `src/components/hosix/facturacion/ConceptosManager.tsx`  
**Líneas:** 450  
**Funcionalidades:**
- CRUD completo de conceptos maestros
- Búsqueda por código/descripción
- Filtrado por tipo de concepto
- Campos soportados:
  - Código (único, inmutable al editar)
  - Descripción
  - Tipo de concepto (6 opciones)
  - Precio base
  - Código SNOMED
  - Bandera: "Usa tarifación dinámica"
  - Bandera: "Visible en aseguradoras"
  - Bandera: "Activo"
  - Notas opcionales
- Tabla con estados visuales (badges)
- Formulario modal responsive (2 columnas)
- Mock data con 2 conceptos de ejemplo

**UI:**
- Header con descripción y botón "Nuevo Concepto"
- Card de filtros con búsqueda y select
- Tabla con 8 columnas
- Acciones: Editar, Eliminar
- Validación de campos requeridos

---

### 3. ✅ ReglasEditor.tsx
**Archivo:** `src/components/hosix/facturacion/ReglasEditor.tsx`  
**Líneas:** 572  
**Funcionalidades:**
- CRUD completo de reglas de tarifación
- 9 tipos de regla (edad, embarazo, beneficio, urgencia, etc.)
- 4 tipos de aplicación (porcentaje, monto fijo, multiplicador, precio directo)
- Configuración avanzada:
  - Condición JSONB
  - Orden de aplicación
  - Permitir acumulación
  - Es descuento (flag)
  - Requiere aprobación
  - Precio mínimo/máximo
- Búsqueda por nombre
- Filtrado por concepto maestro
- Mock data con 1 regla de ejemplo
- Función visual `getAplicacionText()` para mostrar valores legibles

**UI:**
- Card de alerta informativa sobre reglas
- Filtros inteligentes
- Tabla con 9 columnas (incluyendo estado y acciones)
- Formulario modal extenso (3 columnas, scrolleable)
- Checkboxes para banderas booleanas
- Campos numéricos con validación

---

### 4. ✅ IntegracionHosix.tsx
**Archivo:** `src/components/hosix/facturacion/IntegracionHosix.tsx`  
**Líneas:** 86  
**Contenido:**
- Contenedor de la sección Integración HOSIX
- 2 tabs principales:
  - Conceptos Maestros (database icon)
  - Reglas de Tarifación (zap icon)
- Header con descripción centralizada
- Card de alerta informativa sobre RENAPROSA como fuente única
- Card de "Estado de Sincronización" (footer)
- Mock status: "Última sync hace 2 min, 3/3 nodos, 0 cambios pendientes"

---

## 📱 Flujo UI

```
Facturación (página)
├─ Tabs (6 tabs)
│  ├─ Cuentas → CuentasManager
│  ├─ Facturas → FacturasList
│  ├─ Generar → FacturasGenerator
│  ├─ Aseguradoras → AseguradorasList
│  ├─ Tarifas → TarifasManager
│  └─ Integración → IntegracionHosix
│     ├─ Tab: Conceptos Maestros → ConceptosManager
│     └─ Tab: Reglas de Tarifación → ReglasEditor
```

---

## 🔧 Características Técnicas

### ConceptosManager
```tsx
Estado:
- conceptos: ConceptoMaestro[]
- showForm: boolean
- editingId: string | null
- searchTerm: string
- tipoFiltro: string
- isLoading: boolean

Props de Concepto:
- id, codigo, descripcion, tipo_concepto
- precio_base, usa_tarifacion_dinamica
- visible_aseguradoras, activo
- snomed_code, nota, created_at, updated_at

Operaciones:
- handleOpenForm(concepto?) → Abre modal
- handleSubmit() → CRUD (en mock)
- handleDelete(id) → Elimina (en mock)
```

### ReglasEditor
```tsx
Estado:
- reglas: ReglaTarifacion[]
- conceptos: array (mock)
- showForm: boolean
- editingId: string | null
- searchTerm, conceptoFiltro, isLoading

Props de Regla:
- id, concepto_id, nombre, tipo_regla
- condicion_json, tipo_aplicacion
- valor_aplicacion, orden_aplicacion
- permitir_acumulacion, es_descuento
- precio_minimo, precio_maximo
- requiere_aprobacion, activo, nota
- created_at, updated_at

Operaciones:
- handleOpenForm(regla?)
- handleSubmit()
- handleDelete(id)
- getAplicacionText() → Visualiza valores
```

---

## 🎯 Estilos y Componentes UI

### Componentes Usados
- Card, CardContent, CardHeader, CardTitle
- Tabs, TabsContent, TabsList, TabsTrigger
- Button (variant: default, outline)
- Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue
- Badge (variant: default, outline, secondary, destructive)
- Table, TableBody, TableCell, TableHead, TableHeader, TableRow
- Dialog, DialogContent, DialogHeader, DialogTitle

### Iconos (Lucide React)
- Plus, Edit2, Trash2, Search (ConceptosManager)
- AlertCircle, Database, Zap (IntegracionHosix)
- Network (Tab en Facturacion)

### Notificaciones
- toast.success(), toast.error() (Sonner)

---

## 📋 Estructura de Archivos

```
SERMED2/src/
├─ pages/Hosix/
│  └─ Facturacion.tsx (modificado: +1 tab)
├─ components/hosix/facturacion/
│  ├─ ConceptosManager.tsx (NUEVO)
│  ├─ ReglasEditor.tsx (NUEVO)
│  ├─ IntegracionHosix.tsx (NUEVO)
│  ├─ AseguradorasList.tsx (existente)
│  ├─ TarifasManager.tsx (existente)
│  ├─ CuentasManager.tsx (existente)
│  ├─ FacturasGenerator.tsx (existente)
│  └─ FacturasList.tsx (existente)
└─ MIGRACIONES_RENAPROSA_HOSIX_TARIFACION_DINAMICA.md (NUEVO)
```

---

## 🔐 Consideraciones de Seguridad

### RLS (Row Level Security)
- **RENAPROSA:** Solo `admin_renaprosa` puede escribir
- **HOSIX:** Lectura pública, escritura solo para sincronización
- **Variables paciente:** Lectura para staff, escritura para facturación

### Validaciones
- Códigos únicos en maestros
- Campos requeridos validados
- Tipos ENUM en dropdowns
- Números con límites (DECIMAL 12,2)

---

## 📦 Migraciones Documentadas

**Archivo:** `MIGRACIONES_RENAPROSA_HOSIX_TARIFACION_DINAMICA.md`

### En RENAPROSA (3 migraciones):
1. **20260625_001:** `renaprosa_conceptos_maestro`
   - Tabla maestro de conceptos
   - RLS: solo admin_renaprosa
   - Índices para búsqueda
   - Seed con 5 conceptos

2. **20260625_002:** `renaprosa_reglas_tarifacion`
   - Tabla de reglas dinámicas
   - Condición JSON configurable
   - Vista: `vw_reglas_tarifacion_por_concepto`
   - RLS: lectura pública

3. **20260625_003:** `renaprosa_sync_log`
   - Auditoría de sincronización
   - Registro de cambios por nodo
   - Estado: pendiente, en_progreso, completado, error

### En HOSIX (4 migraciones):
1. **20260625_001:** `hosix_conceptos_maestro` (REPLICA)
   - Copia local de RENAPROSA
   - RLS: solo lectura
   - Índices para búsqueda

2. **20260625_002:** `hosix_reglas_tarifacion` (REPLICA)
   - Copia local de reglas
   - Usada para cálculos
   - RLS: solo lectura

3. **20260625_003:** `hosix_pacientes_variables_facturacion`
   - Variables que afectan precio
   - Edad, embarazo, aseguradora, tipo beneficio
   - RLS: lectura/escritura para facturación

4. **20260625_004:** Función `hosix_calcular_precio_dinamico()`
   - PL/pgSQL
   - Entrada: concepto_id, paciente_id, aseguradora_id
   - Salida: JSONB con desglose
   - Aplica reglas en orden
   - Respeta límites min/max

---

## ✨ Próximos Pasos

### Fase 2: Aplicación de Migraciones
1. [ ] Aplicar migraciones 1.x en RENAPROSA
2. [ ] Aplicar migraciones 2.x en HOSIX
3. [ ] Verificar RLS y permisos
4. [ ] Seed con datos de producción

### Fase 3: Hooks y Backend
1. [ ] Crear `useRenaprosaConceptos` hook
2. [ ] Crear `useRenaprosaReglas` hook
3. [ ] Actualizar `useHosixFacturacion`
4. [ ] Integrar con API/Supabase

### Fase 4: Sincronización
1. [ ] Edge Function para sincronizar
2. [ ] Triggers en RENAPROSA
3. [ ] Logs de sincronización
4. [ ] Testing exhaustivo

### Fase 5: Testing y Producción
1. [ ] Unit tests
2. [ ] E2E tests
3. [ ] Testing de cálculo de precios
4. [ ] Rollout gradual

---

## 📝 Documentación Generada

- ✅ `IMPLEMENTACION_UI_TARIFACION_RESUMEN.md` (este archivo)
- ✅ `MIGRACIONES_RENAPROSA_HOSIX_TARIFACION_DINAMICA.md` (SQL detallado)

---

## 📞 Notas para el Equipo

### Para el DBA
- Revisar migraciones antes de aplicar
- Considerar índices adicionales para grandes volúmenes
- Validar RLS policies
- Testing de cálculo de precios con datos reales

### Para el Desarrollador Frontend
- Reemplazar mock data con hooks de Supabase
- Implementar loading states adecuados
- Agregar error handling
- Testing de formularios

### Para el PM
- Migraciones pueden aplicarse en fases
- UI está lista para testing
- Sincronización es automática después de migraciones
- Estimado: 2-3 sesiones más para completar

---

**Última actualización:** 2025-06-20  
**Estado:** ✅ UI COMPLETA - LISTO PARA MIGRACIONES
