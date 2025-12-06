# HOSIX - Sistema de Gestión Hospitalaria Nacional
## Arquitectura Completa Adaptada a Supabase

> **Versión**: 4.0  
> **Fecha Última Actualización**: 2025-02-05  
> **Estado**: ✅ FASE 1 COMPLETADA | ✅ FASE 2 (95%) | ⏳ FASE 3 EN PROGRESO  
> **Proyecto**: Dashboard de Gestión Hospitalaria - GEPROSTEC  
> **Backend**: Supabase (PostgreSQL + Edge Functions + Realtime + Storage)

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Estado Actual del Proyecto](#2-estado-actual-del-proyecto)
3. [Arquitectura Supabase](#3-arquitectura-supabase)
4. [Módulos Implementados](#4-módulos-implementados)
5. [Módulos Pendientes](#5-módulos-pendientes)
6. [Módulo de Enfermería (ASIS. 2.0)](#6-módulo-de-enfermería-asis-20)
7. [Admisión Central (ADM. 11.0)](#7-admisión-central-adm-110)
8. [Triage y Alertas (ASIS. 12.0)](#8-triage-y-alertas-asis-120)
9. [Prescripción CPOE + CDS (ASIS. 14.0)](#9-prescripción-cpoe--cds-asis-140)
10. [Interoperabilidad FHIR/HL7](#10-interoperabilidad-fhirhl7)
11. [Seguridad y Cumplimiento](#11-seguridad-y-cumplimiento)
12. [Edge Functions](#12-edge-functions)
13. [Plan de Implementación](#13-plan-de-implementación)
14. [Guía Rápida Desarrolladores](#14-guía-rápida-desarrolladores)

---

## 1. RESUMEN EJECUTIVO

### 1.1 Visión del Sistema

Sistema integral de gestión hospitalaria nacional implementado **100% con Supabase**, que centraliza:

- **Gestión de Pacientes** e Historia Clínica Electrónica (HCE)
- **Administración Hospitalaria** completa (urgencias, citas, hospitalización, facturación)
- **Módulos Asistenciales** especializados (médicos, enfermería, quirófanos)
- **Business Intelligence** y reportería avanzada
- **Interoperabilidad** con estándares internacionales (FHIR R4, HL7 v2.5)

### 1.2 Cobertura Funcional

| Grupo | Cantidad | Estado | Descripción |
|-------|----------|--------|-------------|
| Configuración | 7 | ✅ 100% | Maestros, usuarios, seguridad, MPI, HCE, Portal, BI |
| Administrativos | 12 | ✅ 95% | Pacientes, urgencias, citas, hospitalización, facturación, almacenes |
| Asistenciales | 11+ | ⏳ 9% | Médicos, enfermería, quirófanos, obstetricia, farmacia |
| Complementarios | 4+ | ⏳ 0% | Laboratorio, PACS, telemedicina |
| **TOTAL** | **34+** | **~50%** | 80+ tablas, 180+ funcionalidades |

### 1.3 Ventajas de Supabase vs Arquitectura Tradicional

| Componente | Arquitectura Tradicional | Supabase | Ahorro |
|------------|-------------------------|----------|--------|
| Message Bus | Kafka/RabbitMQ ($100-300/mes) | ✅ Realtime Channels | 100% |
| API Gateway | Kong/AWS ($50-150/mes) | ✅ Edge Functions | 100% |
| Microservicios | Kubernetes ($200-500/mes) | ✅ Edge Functions (serverless) | 100% |
| Base de Datos | PostgreSQL manual | ✅ Supabase PostgreSQL con RLS | Incluido |
| Autenticación | OAuth2 manual | ✅ Supabase Auth | Incluido |
| Storage | S3 manual | ✅ Supabase Storage | Incluido |
| **Total Mensual** | **$450-1150** | **$55-95** | **80-90%** |

---

## 2. ESTADO ACTUAL DEL PROYECTO

### 2.1 Fases de Implementación

| Fase | Estado | Progreso | Módulos | Semanas |
|------|--------|----------|---------|---------|
| **FASE 1** | ✅ COMPLETADA | 100% | Infraestructura Base + Configuración | 1-4 |
| **FASE 2** | ✅ 95% | 11/12 módulos | Administrativos (ADM 1.0-12.0) | 5-12 |
| **FASE 3** | ⏳ EN PROGRESO | 9% | Asistenciales (ASIS 1.0-11.0+) | 13-24 |
| **FASE 4** | ⏳ PENDIENTE | 0% | Interoperabilidad, CDS, Observabilidad | 25-36 |

### 2.2 Completado en FASE 1 ✅

- ✅ 5 Migrations SQL (1,113 líneas, 100+ tablas)
- ✅ RLS policies en todas las tablas
- ✅ Índices de performance
- ✅ 10 Páginas HOSIX funcionales
- ✅ Autenticación y control de permisos
- ✅ 7 Hooks React
- ✅ 3 Edge Functions Supabase
- ✅ Master Patient Index (MPI)
- ✅ Búsqueda global
- ✅ Auditoría de eventos

### 2.3 Completado en FASE 2 ✅

| Módulo | Estado | Componentes |
|--------|--------|-------------|
| ADM 1.0 - Pacientes | ✅ 100% | PacientesList, PacienteForm, HCE, Documentos, Avisos |
| ADM 2.0 - Urgencias | ✅ 100% | UrgenciasWorklist, TriageForm, AtencionForm |
| ADM 3.0 - Citas | ✅ 100% | AgendasList, CitasForm, CitasList, ListaEsperaManager |
| ADM 4.0 - Lista Espera | ✅ 100% | Integrada en ADM 3.0 |
| ADM 5.0 - Hospitalización | ✅ 100% | IngresoPacienteForm, AltaForm, TrasladosManager |
| ADM 6.0 - Teleconsulta | 🚫 OMITIDA | Por decisión de usuario |
| ADM 7.0 - Facturación | ✅ 100% | AseguradorasList, TarifasManager, CuentasManager, FacturasGenerator |
| ADM 8.0 - Cajas | ✅ 100% | CajasManager, TurnosCajaManager, MovimientosCajaForm, CierresCajaManager |
| ADM 9.0 - Recobros | ✅ 100% | RecobrosManager, NotasCargoCredito, MorosidadAnalytics |
| ADM 10.0 - Suministros | ✅ 100% | ArticulosManager, FamiliasManager, GruposManager, UnidadesManager |
| ADM 11.0 - Almacenes | ✅ 100% | AlmacenesManager, DepositosManager, StockManager, MovimientosManager |
| ADM 12.0 - Compras | ⏳ 50% | SQL completado, Dashboard pendiente |

---

## 3. ARQUITECTURA SUPABASE

### 3.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTES (React Web/Mobile)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              VERCEL / RAILWAY (Frontend Hosting)                │
│  • React App (SSR/SSG)                                          │
│  • CDN Global                                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              SUPABASE EDGE FUNCTIONS (API Layer)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • OAuth2/OIDC Authentication (Supabase Auth)             │  │
│  │ • Rate Limiting (middleware)                             │  │
│  │ • Request Logging                                        │  │
│  │ • FHIR Endpoints (/fhir/r4/*)                           │  │
│  │ • HL7 v2.5 Translator                                    │  │
│  │ • CDS Engine (reglas clínicas)                          │  │
│  │ • Integration Engine (LIS, PACS)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ SUPABASE       │ │ SUPABASE       │ │ SUPABASE       │
│ PostgreSQL     │ │ Realtime       │ │ Storage        │
│                │ │                │ │                │
│ • 80+ tablas   │ │ • WebSockets   │ │ • DICOM images │
│ • RLS enabled  │ │ • Channels     │ │ • Documentos   │
│ • Functions    │ │ • Broadcast    │ │ • Backups      │
│ • Triggers     │ │                │ │                │
└────────────────┘ └────────────────┘ └────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              SERVICIOS EXTERNOS MÍNIMOS                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Sentry (Error Tracking) - Gratis                       │  │
│  │ • Logtail (Logs centralizados) - Gratis                 │  │
│  │ • Twilio (SMS para MFA/Notificaciones) - $10-50/mes     │  │
│  │ • SendGrid (Email) - Gratis tier                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Estructura de Rutas

```typescript
// Rutas del Sistema HOSIX
/hosix                              // Dashboard principal
/hosix/configuracion/maestros       // Configuración maestros
/hosix/configuracion/usuarios       // Usuarios/perfiles
/hosix/configuracion/mpi            // Master Patient Index
/hosix/pacientes                    // Gestión pacientes
/hosix/pacientes/:id/hce            // Historia clínica
/hosix/urgencias                    // Urgencias + TRIAGE
/hosix/citas                        // Citas y agendas
/hosix/hospitalizacion              // Hospitalización
/hosix/quirofanos                   // Quirófanos
/hosix/farmacia                     // Farmacia + Prescripción
/hosix/laboratorio                  // Laboratorio
/hosix/facturacion                  // Facturación
/hosix/enfermeria                   // Enfermería (NUEVO)
/hosix/enfermeria/worklist          // Worklist de órdenes
/hosix/enfermeria/signos            // Registro constantes
/hosix/enfermeria/balance           // Balance hídrico
/hosix/bi                           // Business Intelligence
```

### 3.3 Mapeo de Componentes: Objetivo → Supabase

| Componente Objetivo | Implementación Supabase | Estado |
|---------------------|------------------------|--------|
| API Gateway | Edge Function `api-gateway` | ⏳ |
| Patient Service | Edge Function `patient-service` | ⏳ |
| Orders Service | Edge Function `orders-service` | ⏳ |
| Prescriptions Service | Edge Function `prescriptions-service` | ⏳ |
| CDS Engine | Edge Function `cds-engine` + DB Functions | ⏳ |
| FHIR Translator | Edge Function `fhir-translator` | ⏳ |
| HL7 Processor | Edge Function `hl7-processor` | ⏳ |
| Notification Service | Edge Function `notifications` | ⏳ |
| Event Bus (Kafka) | Supabase Realtime Channels | ✅ |
| Audit Service | Database Triggers + Table Inmutable | ✅ |
| IAM Service | Supabase Auth + Edge Functions | ⏳ |
| Storage (DICOM) | Supabase Storage | ✅ |

---

## 4. MÓDULOS IMPLEMENTADOS

### 4.1 Configuración y Parametrización (7 módulos) ✅

#### MOD 1.0 - Maestros Generales
- ✅ Estructura hospitalaria (departamentos, servicios)
- ✅ Recursos humanos (equipos médicos, grupos usuarios)
- ✅ Categorías de episodios
- ✅ Codificación médica (CIE10)
- ✅ Plantillas de informes
- ✅ Material médico/fungible (familias, principios activos)
- ✅ Proveedores

#### MOD 3.0 - Usuarios/Perfiles/Seguridad
- ✅ CRUD usuarios
- ✅ Asignación de privilegios
- ✅ Autenticación usuario/contraseña
- ✅ Caducidad de sesión
- ✅ Grupos y permisos detallados
- ✅ RLS Policies en PostgreSQL

#### MOD 4.0 - MPI (Master Patient Index)
- ✅ Búsqueda automática en MPI
- ✅ Importación de datos demográficos
- ✅ Sincronización de modificaciones
- ✅ Tablero de historial centralizado

#### MOD 5.0 - Historia Clínica Electrónica (HCE)
- ✅ Asignación PPI único
- ✅ Búsqueda múltiples criterios
- ✅ Detección de duplicados
- ✅ Fusión de historias
- ✅ Vista cronológica
- ✅ Avisos y alertas

### 4.2 Módulos Administrativos (12 módulos) ✅ 95%

Ver sección 2.3 para detalle completo de cada módulo.

---

## 5. MÓDULOS PENDIENTES

### 5.1 Módulos Asistenciales (11+ módulos) ⏳

| ID | Módulo | Prioridad | Estado |
|----|--------|-----------|--------|
| ASIS 1.0 | Médicos (Worklist + Prescripción) | CRÍTICA | ⏳ |
| ASIS 2.0 | Enfermería (Gestión de Cuidados) | CRÍTICA | ⏳ |
| ASIS 3.0 | Quirófanos | ALTA | ⏳ |
| ASIS 4.0 | Obstetricia | ALTA | ⏳ |
| ASIS 5.0 | CRED (Crecimiento y Desarrollo) | ALTA | ⏳ |
| ASIS 6.0 | Vacunas | MEDIA | ⏳ |
| ASIS 7.0 | Dietética | MEDIA | ⏳ |
| ASIS 8.0 | RIS (Sistema Radiológico) | ALTA | ⏳ |
| ASIS 9.0 | Farmacia | CRÍTICA | ⏳ |
| ASIS 10.0 | Diabetes e HTA | MEDIA | ⏳ |
| ASIS 11.0 | Informes Dinámicos | MEDIA | ⏳ |
| ASIS 12.0 | Triage y Alertas | CRÍTICA | ⏳ |
| ASIS 13.0 | Diagnóstico y Notas | ALTA | ⏳ |
| ASIS 14.0 | Prescripción CPOE + CDS | CRÍTICA | ⏳ |
| ASIS 15.0 | Laboratorio | ALTA | ⏳ |

---

## 6. MÓDULO DE ENFERMERÍA (ASIS. 2.0)

### 6.1 Descripción General

| ID | Nombre | Descripción |
|----|--------|-------------|
| ASIS. 2.0 | Enfermería: Gestión de Cuidados y Documentación | Plataforma centralizada para ejecución de órdenes médicas, registro de signos vitales, planificación de cuidados y trazabilidad de insumos/medicamentos |

### 6.2 Funcionalidades

#### ASIS. 2.1 - Worklist de Órdenes
| Funcionalidad | Prioridad | Estado |
|--------------|-----------|--------|
| Tablero de tareas en tiempo real | CRÍTICA | ⏳ |
| Órdenes médicas pendientes (medicamentos, pruebas, procedimientos) | CRÍTICA | ⏳ |
| Filtrado por paciente, turno y prioridad | ALTA | ⏳ |
| Codificación por color según urgencia | ALTA | ⏳ |

#### ASIS. 2.2 - Administración de Medicamentos (Dispensario)
| Funcionalidad | Prioridad | Estado |
|--------------|-----------|--------|
| Registro de hora exacta de dispensación | CRÍTICA | ⏳ |
| Lectura código de barras paciente/medicamento | ALTA | ⏳ |
| Verificación "5 Correctas" (Paciente, Medicamento, Dosis, Vía, Hora) | CRÍTICA | ⏳ |
| Trazabilidad y observaciones | ALTA | ⏳ |
| Registro de eventos adversos | ALTA | ⏳ |

#### ASIS. 2.4 - Registro de Constantes (Signos Vitales)
| Funcionalidad | Prioridad | Estado |
|--------------|-----------|--------|
| Entrada rápida optimizada | CRÍTICA | ⏳ |
| Temperatura, Pulso, PA, SpO2, Dolor (VAS) | CRÍTICA | ⏳ |
| Gráficos de tendencia automáticos | ALTA | ⏳ |
| Alertas de valores críticos | CRÍTICA | ⏳ |

#### ASIS. 2.5 - Balance Hídrico
| Funcionalidad | Prioridad | Estado |
|--------------|-----------|--------|
| Líquidos administrados (IV, orales) | ALTA | ⏳ |
| Líquidos eliminados (orina, drenajes) | ALTA | ⏳ |
| Balance automático | ALTA | ⏳ |

#### ASIS. 2.7 - Valoración de Riesgos
| Funcionalidad | Prioridad | Estado |
|--------------|-----------|--------|
| Escala de Braden (úlceras por presión) | ALTA | ⏳ |
| Escala de Morse (riesgo de caídas) | ALTA | ⏳ |
| Plan de cuidados preventivos automático | ALTA | ⏳ |

### 6.3 Tablas SQL para Enfermería

```sql
-- Worklist de órdenes
CREATE TABLE hosix_enfermeria_worklist_ordenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_orden VARCHAR(50) NOT NULL, -- medicamento, prueba, procedimiento
  descripcion TEXT NOT NULL,
  prioridad VARCHAR(20) DEFAULT 'normal', -- baja, normal, alta, urgente
  estado VARCHAR(30) DEFAULT 'pendiente', -- pendiente, en_proceso, completada, cancelada
  turno VARCHAR(20), -- mañana, tarde, noche
  fecha_programada TIMESTAMPTZ,
  fecha_ejecucion TIMESTAMPTZ,
  profesional_asignado_id UUID REFERENCES profesionales_sanitarios(id),
  profesional_ejecutor_id UUID REFERENCES profesionales_sanitarios(id),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Administración de medicamentos
CREATE TABLE hosix_enfermeria_administracion_medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescripcion_id UUID REFERENCES hosix_cpoe_prescripciones(id) NOT NULL,
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  medicamento_id UUID REFERENCES hosix_articulos(id) NOT NULL,
  
  -- 5 Correctas verificadas
  verificacion_paciente BOOLEAN DEFAULT false,
  verificacion_medicamento BOOLEAN DEFAULT false,
  verificacion_dosis BOOLEAN DEFAULT false,
  verificacion_via BOOLEAN DEFAULT false,
  verificacion_hora BOOLEAN DEFAULT false,
  
  -- Administración
  dosis_administrada VARCHAR(100),
  via_administracion VARCHAR(50),
  fecha_hora_administracion TIMESTAMPTZ NOT NULL,
  codigo_barras_escaneado VARCHAR(100),
  
  -- Respuesta del paciente
  respuesta_paciente TEXT,
  evento_adverso BOOLEAN DEFAULT false,
  descripcion_evento_adverso TEXT,
  
  -- Responsable
  enfermero_id UUID REFERENCES profesionales_sanitarios(id) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Signos vitales
CREATE TABLE hosix_enfermeria_signos_vitales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  
  -- Signos vitales
  temperatura DECIMAL(4,1), -- °C
  frecuencia_cardiaca INT, -- lpm
  presion_sistolica INT, -- mmHg
  presion_diastolica INT, -- mmHg
  frecuencia_respiratoria INT, -- rpm
  saturacion_oxigeno INT, -- %
  glucosa INT, -- mg/dL
  dolor_vas INT CHECK (dolor_vas >= 0 AND dolor_vas <= 10), -- Escala VAS 0-10
  
  -- Alertas
  tiene_alerta BOOLEAN DEFAULT false,
  tipo_alerta VARCHAR(50), -- critico, alto, moderado
  
  -- Registro
  fecha_toma TIMESTAMPTZ NOT NULL DEFAULT now(),
  enfermero_id UUID REFERENCES profesionales_sanitarios(id) NOT NULL,
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para gráficos de tendencia
CREATE INDEX idx_signos_vitales_paciente_fecha 
ON hosix_enfermeria_signos_vitales(paciente_id, fecha_toma DESC);

-- Balance hídrico
CREATE TABLE hosix_enfermeria_balance_hidrico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  fecha DATE NOT NULL,
  
  -- Ingresos
  ingreso_oral_ml INT DEFAULT 0,
  ingreso_iv_ml INT DEFAULT 0,
  ingreso_sng_ml INT DEFAULT 0,
  otros_ingresos_ml INT DEFAULT 0,
  
  -- Egresos
  egreso_orina_ml INT DEFAULT 0,
  egreso_vomito_ml INT DEFAULT 0,
  egreso_drenaje_ml INT DEFAULT 0,
  egreso_deposiciones_ml INT DEFAULT 0,
  otros_egresos_ml INT DEFAULT 0,
  
  -- Balance calculado
  balance_total_ml INT GENERATED ALWAYS AS (
    (ingreso_oral_ml + ingreso_iv_ml + ingreso_sng_ml + otros_ingresos_ml) -
    (egreso_orina_ml + egreso_vomito_ml + egreso_drenaje_ml + egreso_deposiciones_ml + otros_egresos_ml)
  ) STORED,
  
  turno VARCHAR(20),
  enfermero_id UUID REFERENCES profesionales_sanitarios(id),
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Valoración de riesgos
CREATE TABLE hosix_enfermeria_valoracion_riesgos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  
  tipo_escala VARCHAR(50) NOT NULL, -- braden, morse, norton, barthel
  
  -- Braden (úlceras)
  braden_percepcion_sensorial INT,
  braden_humedad INT,
  braden_actividad INT,
  braden_movilidad INT,
  braden_nutricion INT,
  braden_friccion INT,
  braden_total INT,
  braden_riesgo VARCHAR(20), -- sin_riesgo, bajo, moderado, alto
  
  -- Morse (caídas)
  morse_caidas_previas INT,
  morse_diagnostico_secundario INT,
  morse_ayuda_deambulacion INT,
  morse_via_iv INT,
  morse_marcha INT,
  morse_estado_mental INT,
  morse_total INT,
  morse_riesgo VARCHAR(20), -- bajo, moderado, alto
  
  -- Plan preventivo generado
  plan_preventivo_generado BOOLEAN DEFAULT false,
  
  enfermero_id UUID REFERENCES profesionales_sanitarios(id) NOT NULL,
  fecha_valoracion TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 7. ADMISIÓN CENTRAL (ADM. 11.0)

### 7.1 Descripción

| ID | Nombre | Descripción |
|----|--------|-------------|
| ADM. 11.0 | Admisión Central y Trazabilidad | Punto de entrada unificado para todos los pacientes, gestionando registro, validación, clasificación y asignación inicial de recursos |

### 7.2 Funcionalidades

| ID | Nombre | Detalle | Integración |
|----|--------|---------|-------------|
| ADM. 11.1 | Admisión Unificada | Única interfaz para registrar/validar paciente para Consulta Externa, Urgencias u Hospitalización | ADM.1.1 (Datos Paciente) |
| ADM. 11.2 | Clasificación de Servicio | Asignación automática del flujo (Urgencias → Triage; Externa → Agenda) | ADM.3.0 (Agendas) |
| ADM. 11.3 | Alerta de Sala de Espera | Sistema visual de monitorización de tiempo de espera | ASIS.12.0 (Alertas) |
| ADM. 11.4 | Asignación de Recursos | Asignación de primer contacto basada en disponibilidad | ADM.5.4 (Camas) |
| ADM. 11.5 | Registro de Ingreso/Egreso | Formalización del proceso de ingreso a Hospitalización y alta | ADM.5.0 (Hospitalización) |

### 7.3 Flujo de Admisión

```
Admisión Central (ADM. 11.1) → Clasificación (ADM. 11.2)
  ↓
  Si Urgencias → Triage (ASIS. 12.1) → Alerta (ASIS. 12.2) → Sala de Espera → Médico
  ↓
  Si Externa/Programada → Agenda (ADM. 3.0) → Sala de Espera → Médico
  ↓
  Si Hospitalización → Asignación de Camas (ADM. 5.4) → Ingreso Formal
```

---

## 8. TRIAGE Y ALERTAS (ASIS. 12.0)

### 8.1 Funcionalidades

| ID | Nombre | Detalle | UX/UI |
|----|--------|---------|-------|
| ASIS. 12.1 | Módulo Triage | Clasificación rápida (Escala de Manchester) | Tablero con codificación de color (Semáforo) |
| ASIS. 12.2 | Sistema de Alertas Vitales | Activación de alertas para parámetros críticos | Alerta persistente sticky header |

### 8.2 Escala de Manchester

| Nivel | Color | Nombre | Tiempo Objetivo |
|-------|-------|--------|-----------------|
| 1 | 🔴 Rojo | Emergencia | 0 minutos |
| 2 | 🟠 Naranja | Muy Urgente | 10 minutos |
| 3 | 🟡 Amarillo | Urgente | 60 minutos |
| 4 | 🟢 Verde | Normal | 120 minutos |
| 5 | 🔵 Azul | No Urgente | 240 minutos |

### 8.3 Tabla SQL

```sql
CREATE TABLE hosix_triage_clasificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  urgencia_episodio_id UUID REFERENCES hosix_urgencias_episodios(id) NOT NULL,
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  
  -- Escala Manchester
  nivel_manchester INT CHECK (nivel_manchester BETWEEN 1 AND 5),
  color_triage VARCHAR(20), -- rojo, naranja, amarillo, verde, azul
  tiempo_objetivo_minutos INT, -- 0, 10, 60, 120, 240
  
  -- Motivo de consulta estructurado
  motivo_principal TEXT NOT NULL,
  discriminadores JSONB,
  
  -- Signos vitales en triage
  signos_vitales JSONB,
  
  -- Alertas críticas
  tiene_alerta_critica BOOLEAN DEFAULT false,
  tipo_alerta_critica VARCHAR(50), -- shock, paro, trauma_grave
  
  -- Responsable
  enfermero_triage_id UUID REFERENCES profesionales_sanitarios(id) NOT NULL,
  fecha_triage TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 9. PRESCRIPCIÓN CPOE + CDS (ASIS. 14.0)

### 9.1 Funcionalidades

| ID | Nombre | Detalle | Implementación |
|----|--------|---------|----------------|
| ASIS. 14.1 | Prescripción Electrónica (CPOE) | Interfaz para prescribir medicamentos, dosis, vías, frecuencia | BD: Listado medicamentos |
| ASIS. 14.2 | Soporte a Dosificación | Cálculo automático basado en peso/edad (pediátricas) | Algoritmos de dosificación |
| ASIS. 14.3 | Alertas de Seguridad (CDS) | Interacciones, duplicidad, contraindicaciones por alergias | **Alerta modal forzosa** |
| ASIS. 14.4 | Receta Electrónica (e-Receta) | Generación digital con códigos de verificación | Firma electrónica legal |

### 9.2 CDS - Clinical Decision Support

El CDS Engine evalúa en tiempo real:

1. **Interacciones Farmacológicas**: Warfarina + Aspirina → Alerta crítica
2. **Alergias Conocidas**: Paciente alérgico a Penicilina → Alerta crítica
3. **Dosis Máxima/Mínima**: Validación automática
4. **Duplicidad de Terapia**: Mismo principio activo prescrito 2 veces
5. **Dosificación Pediátrica**: Cálculo automático por peso

### 9.3 Tabla SQL

```sql
CREATE TABLE hosix_cpoe_prescripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  medico_id UUID REFERENCES profesionales_sanitarios(id) NOT NULL,
  
  -- Medicamento
  medicamento_id UUID REFERENCES hosix_articulos(id) NOT NULL,
  nombre_medicamento VARCHAR(255) NOT NULL,
  principio_activo VARCHAR(255),
  
  -- Posología
  dosis VARCHAR(100) NOT NULL,
  unidad_dosis VARCHAR(50),
  via_administracion VARCHAR(50) NOT NULL,
  frecuencia VARCHAR(100) NOT NULL,
  duracion_dias INT,
  
  -- Fechas
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  
  -- CDS - Alertas de seguridad
  tiene_alerta_interaccion BOOLEAN DEFAULT false,
  tiene_alerta_alergia BOOLEAN DEFAULT false,
  tiene_alerta_dosis BOOLEAN DEFAULT false,
  alertas_ignoradas JSONB, -- Si el médico ignora alertas, registrar justificación
  
  -- Estado
  estado VARCHAR(30) DEFAULT 'activa', -- activa, suspendida, completada, cancelada
  
  -- Firma electrónica
  firmada BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  hash_firma VARCHAR(255),
  
  instrucciones_paciente TEXT,
  observaciones_medicas TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reglas CDS
CREATE TABLE hosix_cds_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- interaccion, alergia, dosis, duplicidad
  condicion_sql TEXT NOT NULL,
  severidad VARCHAR(20) NOT NULL, -- info, advertencia, critica
  mensaje TEXT NOT NULL,
  accion_recomendada TEXT,
  activa BOOLEAN DEFAULT true,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 10. INTEROPERABILIDAD FHIR/HL7

### 10.1 Recursos FHIR Mapeados

| Recurso FHIR | Tabla HOSIX | API Endpoint |
|-------------|------------|-------------|
| Patient | hosix_pacientes | GET/POST /fhir/r4/Patient |
| Encounter | hosix_hospitalizacion_episodios | GET /fhir/r4/Encounter |
| Observation | hosix_enfermeria_signos_vitales | GET /fhir/r4/Observation |
| MedicationRequest | hosix_cpoe_prescripciones | POST /fhir/r4/MedicationRequest |
| DiagnosticReport | hosix_laboratorio_resultados | GET /fhir/r4/DiagnosticReport |
| ImagingStudy | PACS (externo) | GET /fhir/r4/ImagingStudy |
| ServiceRequest | hosix_ordenes_medicas | POST /fhir/r4/ServiceRequest |
| Condition | hosix_diagnosticos | GET /fhir/r4/Condition |
| AllergyIntolerance | hosix_pacientes.alergias | GET /fhir/r4/AllergyIntolerance |

### 10.2 Ejemplo: Patient FHIR

```json
{
  "resourceType": "Patient",
  "id": "ppi-abc123",
  "identifier": [
    {
      "system": "http://hosix.health/ppi",
      "value": "2500123456"
    }
  ],
  "name": [{
    "use": "official",
    "family": "Pérez García",
    "given": ["Juan", "Carlos"]
  }],
  "gender": "male",
  "birthDate": "1985-04-15",
  "telecom": [{
    "system": "phone",
    "value": "+593999123456",
    "use": "mobile"
  }],
  "address": [{
    "use": "home",
    "city": "Quito",
    "state": "Pichincha",
    "country": "EC"
  }],
  "active": true
}
```

### 10.3 HL7 v2.5 Messages

| Mensaje | Descripción | Uso |
|---------|-------------|-----|
| ADT^A01 | Admisión de paciente | Cuando se registra ingreso |
| ADT^A03 | Alta de paciente | Cuando se da de alta |
| ORU^R01 | Resultados de laboratorio | Recepción desde LIS |
| ORM^O01 | Órdenes médicas | Envío a laboratorio/imagen |

---

## 11. SEGURIDAD Y CUMPLIMIENTO

### 11.1 Checklist de Seguridad

| Item | Descripción | Estado |
|------|-------------|--------|
| ✅ | OAuth2/OIDC (Supabase Auth) | Implementado |
| ⏳ | MFA (SMS + TOTP) | Pendiente |
| ✅ | RBAC (RLS policies) | Implementado |
| ⏳ | Auditoría inmutable con hash chain | Pendiente |
| ✅ | TLS 1.3 (incluido Supabase) | Implementado |
| ✅ | Encriptación en reposo | Implementado |
| ⏳ | Timeout de sesión automático | Pendiente |
| ⏳ | DLP (Data Loss Prevention) | Pendiente |

### 11.2 RLS Policies (Row Level Security)

```sql
-- Ejemplo: Pacientes solo visibles por profesionales de su centro
CREATE POLICY "Profesionales ven pacientes de su centro"
ON hosix_pacientes
FOR SELECT
USING (
  centro_salud_id IN (
    SELECT centro_salud_id FROM profesionales_sanitarios 
    WHERE user_id = auth.uid()
  )
);

-- Auditoría inmutable: Solo INSERT
CREATE POLICY "Auditoria solo insertar"
ON hosix_auditoria_immutable
FOR INSERT WITH CHECK (true);

CREATE POLICY "Auditoria no modificar"
ON hosix_auditoria_immutable
FOR UPDATE USING (false);

CREATE POLICY "Auditoria no eliminar"
ON hosix_auditoria_immutable
FOR DELETE USING (false);
```

---

## 12. EDGE FUNCTIONS

### 12.1 Estructura Propuesta

```
supabase/functions/
├── api-gateway/
│   └── index.ts                    # Gateway principal con rate limiting
├── patient-service/
│   ├── index.ts                    # CRUD pacientes, HCE, MPI
│   └── fhir.ts                     # Endpoints FHIR Patient
├── orders-service/
│   ├── index.ts                    # Órdenes médicas
│   └── lab-integration.ts          # Integración LIS
├── prescriptions-service/
│   ├── index.ts                    # CPOE, prescripciones
│   └── cds-integration.ts          # Integración con CDS
├── cds-engine/
│   ├── index.ts                    # Motor de reglas
│   ├── drug-interactions.ts        # Interacciones medicamentosas
│   └── dosage-calculator.ts        # Cálculo de dosis
├── fhir-translator/
│   ├── index.ts                    # Endpoints FHIR genéricos
│   ├── patient-mapper.ts           # Mapeo Patient
│   └── observation-mapper.ts       # Mapeo Observation
├── hl7-processor/
│   ├── index.ts                    # Receptor HL7 v2.5
│   └── oru-parser.ts               # Parse ORU^R01 (lab results)
├── notifications/
│   ├── index.ts                    # Notificaciones SMS/Email
│   └── templates.ts                # Plantillas de mensajes
└── iam/
    ├── index.ts                    # Gestión de permisos
    └── mfa.ts                      # MFA setup/verify
```

### 12.2 Ejemplo: Edge Function CDS

```typescript
// supabase/functions/cds-engine/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { prescription, patientId } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const alerts = []
  
  // 1. Verificar alergias
  const { data: paciente } = await supabase
    .from('hosix_pacientes')
    .select('alergias')
    .eq('id', patientId)
    .single()
  
  if (paciente?.alergias?.some((a: any) => 
    a.medicamento_id === prescription.medicamento_id
  )) {
    alerts.push({
      tipo: 'alergia',
      severidad: 'critica',
      mensaje: 'Paciente tiene alergia conocida a este medicamento',
      accion_recomendada: 'NO ADMINISTRAR. Buscar alternativa.'
    })
  }
  
  // 2. Verificar interacciones
  const { data: prescripcionesActivas } = await supabase
    .from('hosix_cpoe_prescripciones')
    .select('medicamento_id, nombre_medicamento')
    .eq('paciente_id', patientId)
    .eq('estado', 'activa')
  
  // Lógica de verificación de interacciones...
  
  // 3. Verificar dosificación pediátrica
  const { data: pacienteInfo } = await supabase
    .from('hosix_pacientes')
    .select('fecha_nacimiento, peso_kg')
    .eq('id', patientId)
    .single()
  
  if (pacienteInfo && calcularEdad(pacienteInfo.fecha_nacimiento) < 18) {
    // Validar dosis pediátrica
  }
  
  return new Response(JSON.stringify({ alerts }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--
  }
  return edad
}
```

---

## 13. PLAN DE IMPLEMENTACIÓN

### 13.1 Roadmap por Fases

| Fase | Semanas | Objetivo | Entregables |
|------|---------|----------|-------------|
| **0** | 1 | Correcciones | Completar ADM 12.0 |
| **1** | 2-4 | Infraestructura | API Gateway, OAuth2, MFA, Rate Limiting |
| **2** | 5-12 | Asistenciales | Enfermería, Triage, CPOE básico |
| **3** | 13-16 | CDS + FHIR | CDS Engine, FHIR endpoints, HL7 processor |
| **4** | 17-20 | Integración | Event Bus (Realtime), LIS/PACS |
| **5** | 21-24 | Observabilidad | Sentry, Logtail, Performance optimization |

### 13.2 Próximos Pasos Inmediatos

1. ⏳ **Completar ADM 12.0** (Compras) - 8h
2. ⏳ **Implementar ASIS 2.0** (Enfermería) - Worklist, Signos Vitales - 16h
3. ⏳ **Implementar ASIS 12.0** (Triage Manchester) - 8h
4. ⏳ **Crear Edge Function CDS** - 16h
5. ⏳ **Crear Edge Function FHIR Translator** - 16h

---

## 14. GUÍA RÁPIDA DESARROLLADORES

### 14.1 Crear Edge Function

```bash
# Crear nueva Edge Function
supabase functions new mi-funcion

# Desplegar
supabase functions deploy mi-funcion

# Probar localmente
supabase functions serve mi-funcion
```

### 14.2 Estructura de Edge Function

```typescript
// supabase/functions/mi-funcion/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // 1. Autenticación
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  
  // 2. Lógica de negocio
  const { data } = await supabase.from('mi_tabla').select('*')
  
  // 3. Retornar respuesta
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 14.3 Patrón Event Emitter (Realtime)

```typescript
// Emitir evento
await supabase.channel('hosix-events').send({
  type: 'broadcast',
  event: 'prescripcion_creada',
  payload: { prescripcionId: '...', pacienteId: '...' }
})

// Suscribirse (Frontend)
const channel = supabase.channel('hosix-events')
  .on('broadcast', { event: 'prescripcion_creada' }, (payload) => {
    console.log('Nueva prescripción:', payload.payload)
    // Notificar a farmacia, etc.
  })
  .subscribe()
```

### 14.4 Database Function Útil

```sql
-- Función para verificar permisos
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_resource VARCHAR,
  p_action VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM hosix_permisos
    WHERE usuario_id = p_user_id
    AND recurso = p_resource
    AND accion = p_action
    AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 📚 DOCUMENTOS RELACIONADOS

Este documento consolida y reemplaza:
- ~~HOSIX_ARQUITECTURA_IMPLEMENTACION.md~~
- ~~HOSIX_ARQUITECTURA_COMPLEMENTARIA_V2.md~~
- ~~HOSIX_ARQUITECTURA_INTEGRADA_FINAL.md~~
- ~~HOSIX_ESPECIFICACION_TECNICA_INTEGRADA.md~~
- ~~HOSIX_ESTRATEGIA_SUPABASE_100_PORCIENTO.md~~
- ~~HOSIX_GUIA_RAPIDA_DESARROLLADOR.md~~
- ~~HOSIX_PLAN_MIGRACION_SUPABASE.md~~
- ~~HOSIX_RESUMEN_EJECUTIVO_SUPABASE.md~~
- ~~HOSIX_ROADMAP_12_SPRINTS_DETALLADO.md~~
- ~~HOSIX_ESPECIFICACION_FHIR_HL7_MAPPING.md~~
- ~~HOSIX_CHECKLIST_SEGURIDAD_COMPLIANCE.md~~

**Mantener activos**:
- ✅ `HOSIX_ARQUITECTURA_SUPABASE_COMPLETA.md` (este documento)
- ✅ `HOSIX_IMPLEMENTACION_SEGUIMIENTO.md` (seguimiento de tareas)

---

**Última Actualización**: 2025-02-05  
**Versión**: 4.0  
**Autor**: Equipo HOSIX - GEPROSTEC
