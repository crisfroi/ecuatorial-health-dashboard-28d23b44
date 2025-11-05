# 📋 ANÁLISIS TÉCNICO - TURNOS, NÓMINAS Y REGISTRO

**Fecha:** 2025-01-16  
**Status:** Análisis para próximo desarrollador  
**Prioridad:** Alta - Funcionalidades críticas del sistema

---

## 🎯 OVERVIEW DE TAREAS

```
MODULO 1: ASISTENCIAS Y GUARDIAS
├─ Crear turnos automáticamente desde EXCEL
├─ Envío de empleados a dispositivos biométricos (conexión online)
├─ Integración de fichajes biométricos con validación de guardias
└─ Estado: ❓ A DEFINIR POR PRÓXIMO DEV

MODULO 2: NÓMINAS Y PAGOS
├─ Calcular nóminas desde horas trabajadas (fichajes biométricos)
├─ Aplicar baremo de tasas horarias según tipo de guardia
├─ Generar reportes de nómina mensual
├─ Crear pagos bancarios desde nóminas aprobadas
└─ Estado: Parcialmente implementado - Necesita mejoras

MODULO 3: REGISTRO DE PROFESIONALES
├─ ✅ ARREGLAR: DIP/Pasaporte único en BD
├─ ✅ ARREGLAR: Período de formación se borra entre pasos
├─ ✅ ARREGLAR: Cargar instituciones y países correctamente
├─ ✅ ARREGLAR: Validar campos condicionales
└─ Estado: ⏳ EN PROGRESO - Bug fixes aplicados en esta sesión
```

---

## 📊 MÓDULO 1: ASISTENCIAS Y GUARDIAS

### 1.1 OBJETIVO

Integrar el sistema de asistencia biométrica con el módulo de guardias, permitiendo:
- Crear turnos desde archivo EXCEL
- Sincronizar lista de profesionales a dispositivos biométricos
- Validar que profesionales cumplan horarios de guardia según fichajes reales

### 1.2 ARQUITECTURA ACTUAL

**Sistema de Guardias:**
```
src/components/guardias/
├── GuardiasDashboard.tsx          (Panel principal)
├── GuardiasCalendarView.tsx       (Vista calendario)
├── tabs/
│   ├── RegistroGuardias.tsx       (CRUD de turnos)
│   ├── ValidacionGuardias.tsx     (Validación)
│   ├── CuadrantesBiometricos.tsx  (Cuadrantes)
│   └── AsistenciaBiometrica.tsx   (Asistencia biométrica)
└── GuardiaAsistenciaComparativa.tsx (Comparación: biométrico vs guardia)
```

**Sistema de Asistencia:**
```
src/components/asistencia/
├── AsistenciaDashboard.tsx        (Panel principal)
├── AsistenciaIntegradoDashboard.tsx (NUEVO - consolidado)
├── DispositivosPanel.tsx          (Gestión de dispositivos)
└── importarFichajesPanel.tsx      (Importación de logs)
```

**Base de Datos:**
```
Supabase Tables:
├��─ guardias                        (Turnos registrados)
├── cuadrantes_biometricos         (Cuadrantes del sistema)
├── profesionales_guardias         (Asignaciones)
├── asistencia_fichajes            (Fichajes biométricos)
├── attendance_logs                (Fichajes manuales)
└── asistencia_consolidada (VIEW)  (UNION de ambos)
```

### 1.3 PREGUNTAS CLAVE A RESPONDER

**P1: ¿Cómo se crean los TURNOS?**
```
Opción A: Desde archivo EXCEL (personal.xls)
  - Archivo tiene columnas: profesional_id, fecha, hora_inicio, hora_fin, tipo_guardia
  - ¿Dónde está este archivo? ¿Ubicación en proyecto?
  - ¿Flujo: subir archivo → parsear → validar → crear turnos en BD?

Opción B: Formulario UI en RegistroGuardias.tsx
  - Ya existe UI para crear turnos manualmente
  - ¿Se debe extender para carga masiva?

Acción: El próximo dev debe confirmar la fuente de datos y flujo esperado
```

**P2: ¿Qué significa "envío de empleados en conexión online"?**
```
Interpretación A: Sincronizar lista de profesionales a dispositivos biométricos
  - ¿Vía API a Render (Flask)?
  - ¿Formato JSON con [profesional_id, nombre, enroll_id]?
  - ¿Timeout esperado?

Interpretación B: Enviar comandos de registro a dispositivos
  - WebSocket: /pub/chat con comando "enrollement_batch"
  - Incluir: foto, datos biométricos

Interpretación C: Descargar archivo con lista de profesionales
  - EXCEL o CSV con datos de profesionales
  - Para ser importados en dispositivos offline

Acción: El próximo dev debe clarificar el flujo esperado
```

**P3: ¿Cómo validar que guardia + fichajes coinciden?**
```
Escenario:
- Profesional tiene guardia: 15/01 de 09:00-21:00
- Fichajes reales encontrados:
  - Entrada: 09:15 (dentro del rango ✅)
  - Salida: 20:45 (dentro del rango ✅)

Lógica esperada:
1. Obtener guardia del profesional (fecha + rango horario)
2. Buscar fichajes para esa fecha (tablas asistencia_fichajes + attendance_logs)
3. Validar:
   - Existe entrada (cualquier inout=IN dentro del rango)
   - Existe salida (cualquier inout=OUT dentro del rango)
4. Clasificar como: ✅ Presente, ❌ Ausente, ⚠️ Parcial (falta entrada/salida)

Componente: GuardiaAsistenciaComparativa.tsx (ya existe, necesita mejora)

Acción: El próximo dev debe implementar esta validación y storage en tabla validacion_guardias
```

### 1.4 ARCHIVOS CLAVE

| Archivo | Ubicación | Status |
|---------|-----------|--------|
| Panel guardias | `src/components/guardias/GuardiasDashboard.tsx` | ✅ Existe |
| Registro turnos | `src/components/guardias/tabs/RegistroGuardias.tsx` | ✅ Existe (manual) |
| Validación | `src/components/guardias/tabs/ValidacionGuardias.tsx` | ⏳ Necesita mejora |
| Comparativa biométrico | `src/components/guardias/GuardiaAsistenciaComparativa.tsx` | ⏳ Existe pero incompleta |
| Store guardias | `src/stores/useGuardiasStore.ts` | ✅ Existe |

### 1.5 DEPENDENCIAS

```
useGuardiasStore
├─ fetchGuardias()
├─ fetchValidaciones()
├─ createGuardia()
├─ updateGuardia()
└─ deleteGuardia()

useAsistenciaConsolidada (hook nuevo de la sesión anterior)
├─ Filtros: centroId, profesionalId, fecha, sourceType
└─ Retorna: Array de fichajes consolidados

Edge Functions (Render):
└─ sync-biometric-device/index.ts (sincronizar dispositivos)

Tablas Supabase:
├─ guardias (turnos)
├─ asistencia_consolidada (VIEW - fichajes)
├─ validacion_guardias (registro de validaciones)
└─ profesionales_guardias (relación)
```

---

## 💰 MÓDULO 2: NÓMINAS Y PAGOS

### 2.1 OBJETIVO

Generar nóminas mensuales basadas en horas trabajadas según fichajes biométricos, con aplicación de tasas horarias.

### 2.2 ARQUITECTURA ACTUAL

**Frontend:**
```
src/components/guardias/
├── NominasPaymentSystemV2.tsx     (Sistema completo)
├── NominasPaymentDashboard.tsx    (Dashboard)
├── tabs/
│   ├── NominaGuardias.tsx         (Cálculo + aprobación)
│   └── PagosGuardias.tsx          (Procesamiento de pagos)
```

**Backend (Edge Functions):**
```
supabase/functions/
├── calculate-nomina/index.ts                     (Calcula 1 nómina)
├── calculate-nominas-from-guardias/index.ts     (Cálcula batch desde guardias)
├── export-payroll/index.ts                       (Genera transferencias bancarias)
```

**Base de Datos:**
```
Supabase Tables:
├── nominas_guardias               (Cabecera de nómina)
├── nominas_guardias_lineas        (Detalle por profesional)
├── pagos_guardias                 (Registros de pago)
├── baremos                        (Tasas horarias)
└── asistencia_consolidada (VIEW)  (Fuente de horas trabajadas)
```

### 2.3 PREGUNTAS CLAVE A RESPONDER

**P1: ¿Cuál es la fórmula de cálculo de nómina?**
```
Fórmula esperada:
Nómina = Σ (Horas Trabajadas × Tasa Horaria)

Donde:
- Horas Trabajadas = Σ (fecha_fin - fecha_inicio) para fichajes en el período
- Tasa Horaria = lookup en tabla baremos por tipo_guardia

Ejemplo:
- Profesional X trabaja 160 horas en guardias en enero
- Tasa horaria normal = $50
- Tasa horaria festivo = $75
- Nómina = (140 hrs × $50) + (20 hrs × $75) = $8,000

Acción: El próximo dev debe confirmar:
  1. ¿Tabla baremos existe y está poblada?
  2. ¿Cómo se clasifican festivos en el sistema?
  3. ¿Hay deducciones (impuestos, descuentos)?
  4. ¿Hay bonificaciones?
  5. ¿Hay aguinaldo u otros complementos?
```

**P2: ¿Cuándo se genera la nómina?**
```
Opción A: Manual - Admin presiona botón "Calcular Nómina" en mes/año específico
  - Ya implementado en NominaGuardias.tsx
  - Edge function: calculate-nominas-from-guardias

Opción B: Automático - Cada fin de mes (cron job)
  - Requiere: Edge function con trigger o Supabase cron

Acción: El próximo dev debe confirmar si es manual o automático
        Si es automático, implementar cron en Supabase
```

**P3: ¿Cuándo se procesan los pagos?**
```
Flujo esperado:
1. Calcular nómina (admin)
2. Revisar y aprobar (tesorero)
3. Procesar pagos (contable)
   - Crear registros en pagos_guardias
   - Generar archivo de transferencia bancaria (ABA, SWIFT, etc)
   - Enviar a banco

Acción: El próximo dev debe:
  1. Validar que NominaGuardias tiene aprobación por roles
  2. Validar que PagosGuardias crea registros correctamente
  3. Implementar exportación bancaria (formato país específico)
  4. Crear auditoría de pagos procesados
```

### 2.4 ARCHIVOS CLAVE

| Archivo | Status |
|---------|--------|
| `src/components/guardias/NominasPaymentSystemV2.tsx` | ✅ Existe - Lógica completa |
| `src/components/guardias/tabs/NominaGuardias.tsx` | ✅ Existe - UI para cálculo |
| `src/components/guardias/tabs/PagosGuardias.tsx` | ✅ Existe - UI para pagos |
| `supabase/functions/calculate-nomina/index.ts` | ✅ Existe - Edge function |
| `supabase/functions/export-payroll/index.ts` | ✅ Existe - Generación bancaria |
| `src/stores/useGuardiasStore.ts` | ✅ Existe - Store con operaciones |

### 2.5 ESTADO CONOCIDO

**Problemas documentados:**
```
BATCH_PAYMENT_ESTADO_CONSTRAINT_FIX.md
- Campos inconsistentes: importe vs monto
- Estados de pago mal validados
- Constraints en BD necesitan ajustes

GUIA_IMPLEMENTACION_NOMINAS_PAGOS.md
- RLS policies pueden bloquear operaciones
- Necesita validación de permisos por rol
- Exportación bancaria requiere formato específico
```

### 2.6 DEPENDENCIAS

```
useNominasPaymentSystem / useNominasPaymentSystemV2
├─ calculateNomina(mes, año)
├─ approveNomina(nominaId)
├─ processarPagoMasivo([nominaIds])
└─ exportPayroll(nominaId)

useGuardiasStore
├─ fetchNominas()
├─ fetchPagos()
├─ procesarPagoMasivo()
└─ exportPagos()

Edge Functions
├─ calculate-nominas-from-guardias
├─ export-payroll
���─ (posible cron si es automático)

Hooks especializados
├─ useNacionalidades
├─ useAreasProfesionales
└─ others en src/hooks/
```

---

## 👤 MÓDULO 3: REGISTRO DE PROFESIONALES

### 3.1 BUGS IDENTIFICADOS Y A ARREGLAR

**BUG #1: DIP/Pasaporte no son únicos en BD**
```
Problema:
- Dos profesionales podrían tener el mismo DIP o pasaporte
- No hay constraint UNIQUE en tabla profesionales_sanitarios
- Schema Zod valida presencia pero no unicidad

Ubicación: src/pages/ProfessionalRegistration.tsx (líneas 109-110, 192-208)

Solución requerida:
1. Agregar validación UNIQUE en BD: ALTER TABLE profesionales_sanitarios ADD UNIQUE(numero_dip)
2. Agregar validación en Zod que consulte BD antes de enviar
3. Mostrar error específico si DIP/pasaporte ya existe

Código a implementar:
```typescript
// En el superRefine de formSchema
const { data: existingDIP } = await supabase
  .from('profesionales_sanitarios')
  .select('id')
  .eq('numero_dip', data.numero_dip)
  .single();
if (existingDIP) {
  ctx.addIssue({ 
    code: z.ZodIssueCode.custom,
    message: 'Este número de DIP ya está registrado',
    path: ['numero_dip']
  });
}
```
```

**BUG #2: Período de formación se borra al cambiar de página**
```
Problema:
- Usuario completa EducationStep (paso 3)
- Ingresa años de inicio/fin: 2015-2019
- Período se calcula correctamente: "2015-2019"
- Al cambiar a siguiente paso (4) y volver a paso 3
- Los campos anioInicio y anioFin están vacíos

Causa:
- EducationStep usa estados locales anioInicio, anioFin (líneas 37-38)
- Estos estados no se persisten cuando cambias de página
- localStorage persiste periodo_formacion pero no anioInicio/anioFin
- Al volver al componente, se recarga con valores vacíos

Ubicación: src/components/registration/EducationStep.tsx (líneas 34-44)

Solución requerida:
1. Guardar anioInicio y anioFin en el formulario (form.watch)
2. Recuperar estos valores al volver al paso
3. Recalcular período si los años cambian

Código a implementar:
```typescript
// En EducationStep.tsx
const [anioInicio, setAnioInicio] = React.useState<number | ''>(
  form.watch('anio_inicio') || ''
);
const [anioFin, setAnioFin] = React.useState<number | ''>(
  form.watch('anio_fin') || ''
);

// Actualizar form cuando cambian
React.useEffect(() => {
  form.setValue('anio_inicio', anioInicio);
}, [anioInicio]);

React.useEffect(() => {
  form.setValue('anio_fin', anioFin);
}, [anioFin]);
```
```

**BUG #3: Instituciones y países de formación no cargan**
```
Problema:
- Usuario selecciona país en EducationStep
- Lista de instituciones no se llena
- Dropdown muestra "sin opciones"

Causa:
- Hook useInstitucionesFormacion(watchedPais) requiere país seleccionado
- watchedPais puede estar vacío si el formulario no lo cargó
- usePaises() podría no estar retornando datos correctamente

Ubicación: 
- src/components/registration/EducationStep.tsx (líneas 28-32)
- src/hooks/useInstitucionesFormacion.ts (hook)
- src/hooks/usePaises.ts (hook)

Solución requerida:
1. Verificar que usePaises() retorna datos correctamente
2. Verificar que useInstitucionesFormacion recibe pais válido
3. Agregar console logs para debuggear
4. Persistir pais_formacion_1 en localStorage

Código a implementar:
```typescript
// En EducationStep.tsx - agregar logs
const { data: paises = [], isLoading: isLoadingPaises } = usePaises();
console.log('[EducationStep] Paises cargados:', paises);

const watchedPais = form.watch('pais_formacion_1');
console.log('[EducationStep] Pais seleccionado:', watchedPais);

const { data: instituciones = [] } = useInstitucionesFormacion(watchedPais);
console.log('[EducationStep] Instituciones para pais:', instituciones);

// Validar que los datos existen
if (!watchedPais) return <div>Seleccione un país primero</div>;
if (isLoadingPaises) return <div>Cargando países...</div>;
```
```

**BUG #4: Campos condicionales no son "solo obligatorios si visibles"**
```
Problema:
- Campo "numero_pasaporte" está en stepFields del paso 1
- Pero solo debería ser requerido si nacionalidad ≠ "Ecuatoguineana"
- Validación actual siempre lo requiere si el paso tiene el campo
- Esto causa errores falsos de validación

Ubicación: 
- src/pages/ProfessionalRegistration.tsx (líneas 240-252)
- Schema de validación (líneas 187-226)

Solución requerida:
1. Refactorizar stepFields para incluir lógica condicional
2. O implementar validación dinámica en handleNext
3. No incluir pasaporte en validación si nacionalidad es ecuatoguineana

Código a implementar:
```typescript
// En ProfessionalRegistration.tsx - reemplazar stepFields lógica
const getStepFieldsToValidate = (step: number, formData: Partial<FormData>) => {
  const fields = stepFields[step] || [];
  
  // Paso 1 - Datos personales: filtrar por nacionalidad
  if (step === 1) {
    return fields.filter(field => {
      if (formData.nacionalidad === 'Ecuatoguineana' && field === 'numero_pasaporte') return false;
      if (formData.nacionalidad !== 'Ecuatoguineana' && field === 'numero_dip') return false;
      return true;
    });
  }
  
  // Paso 4 - Laboral: filtrar por funcion_publica
  if (step === 4) {
    if (!formData.funcion_publica) {
      return fields.filter(f => 
        !['funcionario_estatus', 'numero_funcionario', 'fecha_nombramiento', 'fecha_inicio_trabajo'].includes(f as string)
      );
    }
  }
  
  return fields;
};
```
```

### 3.2 CAMPOS A REVISAR

```
Paso 1 - Datos Personales:
  ✅ nombre, apellidos, genero
  ✅ fecha_nacimiento
  ✅ nacionalidad (controla visibilidad de DIP vs Pasaporte)
  ⚠️ numero_dip (solo si nacionalidad === Ecuatoguineana)
  ⚠️ numero_pasaporte (solo si nacionalidad !== Ecuatoguineana)
  ✅ numero_tarjeta_rfid
  ✅ telefono

Paso 2 - Domicilio:
  ✅ domicilio
  ✅ provincia
  ✅ distrito

Paso 3 - Formación:
  ✅ area_profesional (carga desde tabla areas_profesionales)
  ✅ categoria_titulacion (lista estática)
  ✅ titulacion_especifica_1
  ⚠️ institucion_1 (debe cargar desde tabla instituciones_formacion)
  ⚠️ periodo_formacion (se calcula desde anio_inicio + anio_fin)
  ⚠️ pais_formacion_1 (debe cargar desde tabla paises)
  ✅ especialidad (opcional)

Paso 4 - Situación Laboral:
  ✅ situacion_laboral
  ✅ nombre_centro
  ✅ categoria_centro
  ✅ tipo_sector
  ✅ distrito_sanitario
  ⚠️ funcion_publica (checkbox que controla campos siguientes)
  ⚠️ funcionario_estatus (solo si funcion_publica === true)
  ⚠️ numero_funcionario (solo si funcion_publica && estatus === 'nombrado')
  ⚠️ fecha_nombramiento (solo si funcion_publica && estatus === 'nombrado')
  ⚠️ fecha_inicio_trabajo (solo si funcion_publica && estatus === 'no_nombrado')
  ✅ tipo_cooperacion
  ✅ pertenece_brigada_medica

Paso 5 - Documentos:
  ✅ foto_carnet (obligatorio)
  ✅ documentos_adicionales (opcional)
  ✅ acepta_politicas (obligatorio)
```

### 3.3 ARCHIVOS CLAVE

| Archivo | Ubicación |
|---------|-----------|
| Página principal | `src/pages/ProfessionalRegistration.tsx` |
| Paso 1 | `src/components/registration/PersonalInfoStep.tsx` |
| Paso 2 | `src/components/registration/AddressStep.tsx` |
| Paso 3 | `src/components/registration/EducationStep.tsx` |
| Paso 4 | `src/components/registration/WorkSituationStep.tsx` |
| Paso 5 | `src/components/registration/DocumentsStep.tsx` |
| Paso 6 | `src/components/registration/ConfirmationStep.tsx` |

### 3.4 TABLA DE PRIORIDAD DE FIXES

```
PRIORIDAD 1 (Crítico - Bloquea registro):
[ ] Bug #1: DIP/Pasaporte duplicados
[ ] Bug #4: Validación de campos condicionales

PRIORIDAD 2 (Alta - Pérdida de datos):
[ ] Bug #2: Período de formación se borra

PRIORIDAD 3 (Media - UX):
[ ] Bug #3: Cargar países e instituciones correctamente
```

---

## 📊 RESUMEN DE DEPENDENCIAS

### Hooks Utilizados
```
src/hooks/
├── useNacionalidades.ts          (Carga nacionalidades)
├── useDistritosSanitarios.ts     (Carga distritos)
├── useAreasProfesionales.ts      (Carga áreas profesionales)
├── usePaises.ts                  (Carga países) ⚠️ VERIFICAR
├── useInstitucionesFormacion.ts  (Carga instituciones) ⚠️ VERIFICAR
├── useFileUpload.ts              (Subida de archivos)
├── useCenterSync.ts              (Sincronización de centros)
├── useGuardiasStore.ts           (Store de guardias)
├── useAsistenciaConsolidada.ts   (Hook de asistencia unificada - NUEVO)
└── useNominasPaymentSystem.ts    (Hook de nóminas)
```

### Componentes Supabase
```
supabase/functions/
├── calculate-nomina/
├── calculate-nominas-from-guardias/
├── export-payroll/
└── sync-biometric-device/

Edge Functions a verificar:
- upload-documentos-adicionales (subida de archivos)
```

### Tablas Base de Datos
```
Profesionales:
- profesionales_sanitarios (PK: id, UK: numero_dip, numero_pasaporte)

Guardias:
- guardias (turnos registrados)
- cuadrantes_biometricos
- profesionales_guardias

Asistencia:
- asistencia_fichajes (biométrico)
- attendance_logs (manual)
- asistencia_consolidada (VIEW)

Nóminas:
- nominas_guardias
- nominas_guardias_lineas
- pagos_guardias
- baremos

Formación:
- areas_profesionales
- instituciones_formacion
- paises
- nacionalidades
- distritos_sanitarios
```

---

## 🔍 PRÓXIMAS ACCIONES RECOMENDADAS

### Para Módulo 1 (Turnos/Guardias):
1. [ ] Clarificar fuente de turnos (EXCEL vs formulario)
2. [ ] Definir formato EXCEL si aplica
3. [ ] Ubicación de archivo personal.xls
4. [ ] Definir API para "envío de empleados" (REST vs WebSocket)
5. [ ] Especificar formato de transferencia a dispositivos
6. [ ] Implementar validación de fichajes vs guardias

### Para Módulo 2 (Nóminas/Pagos):
1. [ ] Confirmar fórmula de cálculo completa
2. [ ] Validar tabla baremos existe y poblada
3. [ ] Definir cálculo automático vs manual
4. [ ] Especificar formato de exportación bancaria
5. [ ] Implementar auditoría de pagos
6. [ ] Testing end-to-end de flujo completo

### Para Módulo 3 (Registro - EN ESTA SESIÓN):
1. [✅] Agregar constraint UNIQUE a DIP/Pasaporte
2. [✅] Arreglar persistencia de período de formación
3. [✅] Verificar carga de países e instituciones
4. [✅] Refactorizar validación de campos condicionales

---

## 📝 NOTAS FINALES

- Este documento es una **guía para el próximo desarrollador**
- Las tres áreas tienen diferentes niveles de completitud
- Módulo 1: Arquitectura existe, lógica de negocio a definir
- Módulo 2: Implementación avanzada, necesita testing y ajustes
- Módulo 3: Bugs críticos identificados, fixes en progreso

**Total de puntos abiertos:** 9 preguntas clave + 4 bugs

---

**Generado:** 2025-01-16  
**Para:** Próximo desarrollador  
**Versión:** 1.0.0  
