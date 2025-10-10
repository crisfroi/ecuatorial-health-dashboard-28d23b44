# SISTEMA DE ASISTENCIA BIOMÉTRICA - GUÍA DE IMPLEMENTACIÓN

## 📋 RESUMEN EJECUTIVO
Sistema completo de control de asistencia mediante dispositivos biométricos (huella, rostro, RFID) con gestión de turnos, fichajes y reportes para centros sanitarios.

---

## 🗄️ ANÁLISIS DE BASE DE DATOS EXISTENTE

### Tablas Encontradas (YA CREADAS):
1. **dispositivos** - Registro de dispositivos biométricos por centro
2. **turnos_biometricos** - Definición de turnos (horarios, tolerancias)
3. **cuadrantes_biometricos** - Asignación profesional-turno-fecha
4. **attendance_logs** - Registros de fichajes importados
5. **empleado_dispositivo_map** - Mapeo EnNo → profesional_id
6. **horarios_profesionales** - Horarios semanales asignados

### Hooks Existentes (YA IMPLEMENTADOS):
- **useAsistencia.ts** - Importación de archivos DAT/Excel, consolidación
- **useTurnosBio.ts** - CRUD turnos, export/import Turno.xls
- **useCuadrantesBio.ts** - Asignación turnos, export/import Personal.xls

### Componentes Existentes:
- **TurnosBiometricos.tsx** - Gestión de turnos
- **CenterAttendancePanel.tsx** - Panel básico de asistencia

---

## 📊 FORMATOS DE ARCHIVOS IDENTIFICADOS

### 1. **Turno.xls** (Exportación → Dispositivo)
```
Columnas: NO | Nombre | Sección1(AT,LV,Tipo) | Sección2 | Sección3 | Tiempo cruzado
Ejemplo: 1 | shift1 | 08:30 | 12:00 | 0 | 13:00 | 17:00 | 0 | 18:00 | 21:00 | 1 | 00:00
```
- **AT**: Hora entrada
- **LV**: Hora salida  
- **Tipo_sec**: 0=normal, 1=horas extras
- Hasta 3 secciones por turno

### 2. **Personal.xls** (Exportación → Dispositivo)
```
Columnas: ID | Nombre | Depto | Turno | Admin | Registro Huella | Rostro | Contraseña | ID/Tarjeta | Zona horaria | Grupo | Modo Verificar | Cumpleaños | Inicio | Fin | Perfil
```
- **ID**: EmpNo/EnNo del profesional (número único)
- **ID/Tarjeta**: Número de tarjeta RFID (hasta 10 dígitos)
- **Turno**: Número de turno asignado (0-8)

### 3. **AFP.DAT** (Multi-dispositivo)
- Formato binario propietario
- Relaciona profesionales entre múltiples dispositivos en un centro

### 4. **GLG.TXT** (Importación ← Dispositivo) ✅ ARCHIVO MATRIZ PRINCIPAL
**Formato identificado del archivo real:**
```
Columnas: No | TMNo | EnNo | Name | INOUT | Mode | DateTime
Ejemplo: 0 | 12 | 3 |  | 0 | 8 | 2025/09/10 12:35:45
```
- **No**: Número secuencial de registro
- **TMNo**: ID del dispositivo biométrico (ej: 12)
- **EnNo**: ID del empleado/profesional (1, 2, 3, etc. | 99999999 = Visitante)
- **Name**: Nombre del profesional (puede estar vacío)
- **INOUT**: Tipo de fichaje (0, 1, IN, OUT)
- **Mode**: Método de verificación
  - 1 = Huella digital
  - 3 = Contraseña/PIN
  - 8 = Tarjeta RFID
- **DateTime**: Fecha y hora en formato `YYYY/MM/DD HH:mm:ss`

**Soporte actual:** El hook `useAsistencia.ts` ya procesa este formato automáticamente:
- Detecta separadores (tabs, comas, espacios múltiples)
- Reconoce cabecera automáticamente
- Normaliza fechas YYYY/MM/DD → ISO
- Mapea EnNo → profesional_id vía tabla `empleado_dispositivo_map`

### 5. **Logs de Fichajes - Otros formatos** (Importación ← Dispositivo)
El hook `useAsistencia.ts` también soporta:
- Archivos TXT/DAT con columnas: EnNo, DateTime, INOUT, Mode
- Archivos Excel multi-hoja (Reporte.xls)

---

## 🎯 IMPLEMENTACIONES REQUERIDAS

### ✅ FASE 1: CORRECCIONES URGENTES (PRIORIDAD MÁXIMA)
**Estado: PENDIENTE**

1. **Arreglar errores de build actuales**
   - Corregir tipos en MultiSelect
   - Corregir errores TypeScript en componentes dashboard
   - Validar tipos de filtros en navegación

---

### 🔧 FASE 2: MEJORAS A INFRAESTRUCTURA EXISTENTE (CORTO PLAZO)

#### 2.1 **Campo RFID en Profesionales** ✅ CRÍTICO
**Estado: IMPLEMENTADO**
**Archivos**: 
- ✅ Migration: Columna `numero_tarjeta_rfid` YA EXISTE en `profesionales_sanitarios`
- ✅ UI: Campo editable agregado en `PersonalInfoCard.tsx` (vista detallada del profesional)
- ✅ Eliminado del formulario de registro inicial

**Implementación:**
- El número RFID se gestiona DESPUÉS del registro
- Se edita desde la vista detallada del profesional
- Validación: Solo números, máximo 10 dígitos
- Actualización directa a Supabase con feedback visual

#### 2.2 **Relación Dispositivo-Centro** ✅ CRÍTICO
**Estado: YA EXISTE** (columna `centro_salud_id` en tabla `dispositivos`)
**Acción**: Validar en UI que siempre se asigne centro

#### 2.3 **Mejoras a Hooks Existentes**
**Estado: PENDIENTE**

**useAsistencia.ts**:
- ✅ Ya tiene: `importFile()`, `importReporteXls()`, `importPersonalXls()`
- ✅ Ya tiene: `consolidateDaily()`, `generateAttendanceStats()`
- ⚠️ Falta: Validar formato Personal.xls al importar mapeos

**useTurnosBio.ts**:
- ✅ Ya tiene: `exportTurnosXls()`, `importTurnosXls()`
- ⚠️ Verificar: Formato exacto de exportación (3 secciones AT/LV)

**useCuadrantesBio.ts**:
- ✅ Ya tiene: `exportPersonalXls()` con fecha
- ⚠️ Mejorar: Incluir número de tarjeta RFID en exportación

---

### 🎨 FASE 3: INTERFAZ DE USUARIO (MEDIANO PLAZO)

#### 3.1 **Dashboard Principal de Asistencia**
**Estado: PENDIENTE**
**Ubicación**: `src/components/asistencia/AsistenciaDashboard.tsx`

Estructura de pestañas:
1. **Dispositivos** - Gestión de dispositivos biométricos
2. **Turnos** - Creación/edición de turnos (YA EXISTE: TurnosBiometricos.tsx)
3. **Cuadrantes** - Asignación profesional-turno
4. **Importar Fichajes** - Carga de archivos desde dispositivo
5. **Reportes** - Visualización de asistencia
6. **Métricas** - KPIs y analytics avanzados

#### 3.2 **Gestión de Dispositivos**
**Estado: PENDIENTE**
**Archivo**: `src/components/asistencia/DispositivosPanel.tsx`

Funcionalidades:
- Listado de dispositivos por centro
- Agregar/editar/eliminar dispositivo
- Ver profesionales mapeados (EnNo → profesional_id)
- Botón: "Mapear Profesionales desde Personal.xls"

#### 3.3 **Gestión de Cuadrantes**
**Estado: PENDIENTE**
**Archivo**: `src/components/asistencia/CuadrantesPanel.tsx`

Funcionalidades:
- Vista calendario mensual
- Asignación múltiple (drag & drop ideal)
- Filtros: centro, profesional, fecha
- Exportar Personal.xls + Turno.xls

#### 3.4 **Importación de Fichajes**
**Estado: PENDIENTE**
**Archivo**: `src/components/asistencia/ImportarFichajesPanel.tsx`

Funcionalidades:
- Upload de archivos TXT/DAT/Excel
- Preview de datos antes de importar
- Validación: EnNo debe existir en mapeos
- Logs de importación

#### 3.5 **Reportes de Asistencia**
**Estado: PARCIAL** (existe CenterAttendancePanel básico)
**Archivo**: `src/components/asistencia/ReportesPanel.tsx`

Vistas requeridas:
- **Diario**: Lista de fichajes del día
- **Semanal**: Resumen horas por día
- **Mensual**: Totales, faltas, retrasos
- **Por profesional**: Historial individual
- **Por centro**: Consolidado del centro

Filtros:
- Rango de fechas
- Centro
- Profesional
- Turno asignado

#### 3.6 **Métricas y Analytics**
**Estado: PENDIENTE**
**Archivo**: `src/components/asistencia/MetricasPanel.tsx`

KPIs a mostrar:
- % Asistencia promedio
- Retrasos totales/promedio
- Horas extras acumuladas
- Faltas sin justificar
- Cumplimiento de turnos
- Top profesionales puntuales
- Gráficos: líneas, barras, heat map

---

### 📈 FASE 4: FUNCIONALIDADES AVANZADAS (LARGO PLAZO)

#### 4.1 **Validación de Fichajes**
**Estado: FUTURO**
- Comparar fichaje vs turno asignado
- Detectar retrasos automáticamente
- Calcular horas extras vs normales
- Alertas de anomalías

#### 4.2 **Gestión de Permisos/Vacaciones**
**Estado: FUTURO**
- Tabla: `permisos_ausencias`
- Tipos: vacaciones, permiso, enfermedad, etc.
- Integración con fichajes (justificar faltas)

#### 4.3 **Sistema de Nóminas**
**Estado: FUTURO**
- Calcular salario base + horas extras
- Descuentos por retrasos/faltas
- Generación de recibos de pago
- Integración con módulo guardias existente

#### 4.4 **Sincronización AFP.DAT**
**Estado: FUTURO**
- Parse de formato binario
- Sincronizar EnNo entre dispositivos
- Backup/restore de configuraciones

---

## 🔐 CONSIDERACIONES DE SEGURIDAD

### RLS Policies Necesarias
- **dispositivos**: Solo admin centro + super admin
- **attendance_logs**: Solo lectura por centro asignado
- **cuadrantes_biometricos**: Gestión por centro
- **horarios_profesionales**: Gestión por centro

### Validaciones
- ✅ EnNo único por dispositivo
- ✅ Tarjeta RFID única en todo el sistema
- ✅ Dispositivo asignado a un solo centro
- ✅ Fichajes solo si existe mapeo EnNo → profesional

---

## 📦 ARCHIVOS A CREAR/MODIFICAR

### Nuevos Componentes (8):
1. `src/components/asistencia/DispositivosPanel.tsx`
2. `src/components/asistencia/CuadrantesPanel.tsx`
3. `src/components/asistencia/ImportarFichajesPanel.tsx`
4. `src/components/asistencia/ReportesPanel.tsx`
5. `src/components/asistencia/MetricasPanel.tsx`
6. `src/components/asistencia/DispositivoForm.tsx`
7. `src/components/asistencia/MapeosProfesionalesDialog.tsx`
8. `src/components/asistencia/FichajesList.tsx`

### Hooks a Crear (2):
1. `src/hooks/useDispositivosFichaje.ts` - Ya existe en useAsistencia.ts
2. `src/hooks/useReportesAsistencia.ts` - Nuevo

### Migraciones SQL (1):
1. Agregar campo `numero_tarjeta_rfid`

### Modificar Existentes (3):
1. `src/components/asistencia/AsistenciaDashboard.tsx` - Integrar todas las pestañas
2. `src/hooks/useCuadrantesBio.ts` - Incluir RFID en export
3. ✅ `src/components/dashboard/professional-detail/PersonalInfoCard.tsx` - Campo RFID editable (IMPLEMENTADO)

---

## ⏱️ ESTIMACIÓN DE TIEMPOS

| Fase | Tareas | Estimación |
|------|--------|------------|
| Fase 1 | Correcciones build | 30 min |
| Fase 2.1 | Campo RFID | 15 min |
| Fase 2.3 | Mejoras hooks | 30 min |
| Fase 3.1 | Dashboard principal | 1h |
| Fase 3.2 | Gestión dispositivos | 1.5h |
| Fase 3.3 | Cuadrantes | 2h |
| Fase 3.4 | Importar fichajes | 1h |
| Fase 3.5 | Reportes | 2h |
| Fase 3.6 | Métricas | 1.5h |
| **TOTAL** | **Fases 1-3** | **~10h** |

---

## 🚀 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Bloque 1 (Crítico - Hoy):
1. ✅ Arreglar errores build
2. ✅ Agregar campo RFID a profesionales
3. ✅ Mejorar exportación Personal.xls con RFID

### Bloque 2 (Alta prioridad):
4. ✅ Panel de dispositivos
5. ✅ Panel de cuadrantes (con calendario)
6. ✅ Integrar en AsistenciaDashboard

### Bloque 3 (Media prioridad):
7. ✅ Panel importar fichajes
8. ✅ Reportes básicos (diario/semanal/mensual)

### Bloque 4 (Baja prioridad):
9. ✅ Métricas y KPIs avanzados
10. ✅ Validaciones automáticas

---

## 📝 NOTAS IMPORTANTES

### ✅ Ventajas de la Implementación Actual:
- **Base de datos ya lista**: Tablas bien diseñadas
- **Hooks funcionales**: useAsistencia ya hace el 70% del trabajo
- **Formatos soportados**: TXT, DAT, Excel multi-hoja
- **Consolidación implementada**: Ya calcula horas, totales, etc.

### ⚠️ Puntos de Atención:
- **AFP.DAT**: Formato binario - requiere ingeniería inversa adicional
- **Validaciones**: Turno vs fichaje real - requiere lógica compleja
- **Performance**: Con miles de fichajes, optimizar queries
- **UI/UX**: Calendario drag&drop puede ser complejo

### 🎯 Beneficios Post-Implementación:
- Control total de asistencia por centro
- Exportación directa a dispositivos biométricos
- Importación automática de fichajes
- Reportes personalizables
- Base para nóminas y gestión de personal

---

## 🔄 FLUJO DE TRABAJO TÍPICO

```
1. Admin crea turnos en "Turnos" → Exporta Turno.xls
2. Admin asigna turnos a profesionales en "Cuadrantes"
3. Admin exporta Personal.xls con profesionales + RFID + turnos
4. [MANUAL] Cargar Turno.xls y Personal.xls en dispositivo USB
5. [MANUAL] Insertar USB en dispositivo biométrico
6. [DISPOSITIVO] Profesionales fichan durante el mes
7. [MANUAL] Descargar fichajes del dispositivo (TXT/Excel)
8. Admin importa fichajes en "Importar Fichajes"
9. Sistema consolida y genera reportes automáticamente
10. Admin revisa en "Reportes" y "Métricas"
```

---

## 📞 CONTACTO Y SOPORTE

**Documentación dispositivos**: Consultar manual del fabricante
**Formatos**: Ver archivos de ejemplo subidos por usuario
**Dudas implementación**: Revisar este documento

---

**Última actualización**: 2025-10-09
**Versión**: 1.0
**Estado**: 🟡 En desarrollo
