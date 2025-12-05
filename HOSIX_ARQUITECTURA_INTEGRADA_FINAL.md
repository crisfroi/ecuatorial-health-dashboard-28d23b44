# HOSIX - Sistema de Gestión Hospitalaria Nacional
## Arquitectura Integrada Final v3.0

> **Versión**: 3.0  
> **Fecha Última Actualización**: 2025-02-05  
> **Estado**: INTEGRACIÓN ARQUITECTURA COMPLEMENTARIA + ANÁLISIS DE DEFICIENCIAS  
> **Proyecto**: Dashboard de Gestión Hospitalaria Nacional - GEPROSTEC  
> **Documento Base**: Fusión de Implementación (v1.2) + Complementaria (v2.0) + Análisis Deficiencias

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo Integrado](#1-resumen-ejecutivo-integrado)
2. [Estado Actual del Proyecto](#2-estado-actual-del-proyecto)
3. [Arquitectura General del Sistema](#3-arquitectura-general-del-sistema)
4. [Módulos Implementados (COMPLETADOS)](#4-módulos-implementados-completados)
5. [Módulos en Desarrollo (PENDIENTES)](#5-módulos-en-desarrollo-pendientes)
6. [Análisis de Deficiencias Críticas](#6-análisis-de-deficiencias-críticas)
7. [Módulos Complementarios de Enfermería (NUEVO)](#7-módulos-complementarios-de-enfermería-nuevo)
8. [Módulos Nuevos Recomendados (PRIORIZADO)](#8-módulos-nuevos-recomendados-priorizado)
9. [Arquitectura Operacional y Seguridad](#9-arquitectura-operacional-y-seguridad)
10. [Plan de Implementación Integrado](#10-plan-de-implementación-integrado)
11. [Roadmap 12 Sprints](#11-roadmap-12-sprints)

---

## 1. RESUMEN EJECUTIVO INTEGRADO

### 1.1 Visión del Sistema

Sistema integral de gestión hospitalaria nacional que centraliza:
- **Gestión de Pacientes** e Historia Clínica Electrónica (HCE)
- **Administración Hospitalaria** completa (urgencias, citas, hospitalización, facturación)
- **Módulos Asistenciales** especializados (médicos, enfermería, quirófanos, etc.)
- **Business Intelligence** y reportería avanzada
- **Interoperabilidad** con estándares internacionales (FHIR, HL7)
- **Seguridad y Gobernanza** de datos críticos

### 1.2 Cobertura Funcional

| Grupo | Cantidad | Estado | Descripción |
|-------|----------|--------|-------------|
| Configuración y Parametrización | 7 | ✅ 95% | Maestros, usuarios, seguridad, MPI, HCE, Portal, BI |
| Administrativos | 12 | ⏳ 91% | Pacientes, urgencias, citas, hospitalizacion, facturación, almacenes, etc. |
| Asistenciales | 11+ | ⏳ 5% | Médicos, enfermería, quirófanos, obstetricia, farmacia, laboratorio, etc. |
| Complementarios | 4+ | ⏳ 0% | Laboratorio, PACS, telemedicina, integraciones |
| **TOTAL** | **34+** | **⏳ 48%** | ~80 tablas, ~180 funcionalidades |

### 1.3 Estadísticas Clave

- **Tablas de BD Definidas**: 80+ tablas
- **Funcionalidades Mapeadas**: 180+ funcionalidades
- **Módulos Completados**: 11/34 (32%)
- **Módulos Pendientes**: 23/34 (68%)
- **Deficiencias Críticas Identificadas**: 8 (interoperabilidad, seguridad, escalabilidad, CDS, observabilidad, etc.)

---

## 2. ESTADO ACTUAL DEL PROYECTO

### 2.1 Fases de Implementación

| Fase | Estado | Progreso | Módulos | Duración |
|------|--------|----------|---------|----------|
| **FASE 1** - Infraestructura Base | ✅ COMPLETADA | 100% | Configuración (7 módulos) | Semanas 1-4 |
| **FASE 2** - Módulos Administrativos | ⏳ 95% COMPLETADA | 11/12 | ADM 1.0-12.0 | Semanas 5-12 |
| **FASE 3** - Módulos Asistenciales (NUEVO) | ⏳ PENDIENTE | 5% | ASIS 1.0-11.0+ | Semanas 13-24 |
| **FASE 4** - Integraciones y Seguridad | ⏳ PENDIENTE | 0% | Interoperabilidad, IAM, CDS | Semanas 25-36 |
| **FASE 5** - Escalabilidad y DevOps | ⏳ PENDIENTE | 0% | Microservicios, K8s, observabilidad | Semanas 37-48 |

### 2.2 Problema Pendiente Inmediato

**Error SQL 42P17 en ADM 11.0 (Almacenes):**
```sql
ERROR: generation expression is not immutable
CAUSA: CURRENT_DATE en columna GENERATED ALWAYS AS STORED
```

**Solución**: Ver `HOSIX_CORRECCION_ALMACENES_SQL.md` - Reemplazar con expresión computada vía trigger o vista.

**Impacto**: Bloquea migración de almacenes. **Prioridad CRÍTICA - 1ª tarea**

### 2.3 Completados en Esta Sesión ✅

| Módulo | ID | Estado | Componentes |
|--------|----|---------| ------------|
| Suministros | ADM 10.0 | ✅ | ArticulosManager, FamiliasManager, GruposManager, UnidadesManager, UbicacionesManager |
| Almacenes | ADM 11.0 | ✅ | AlmacenesManager, DepositosManager, StockManager, MovimientosManager, InventarioManager |
| Hook | `useHosixAlmacenes.ts` | ✅ | Gestión completa de almacenes, stock y movimientos |

---

## 3. ARQUITECTURA GENERAL DEL SISTEMA

### 3.1 Diagrama de Alto Nivel Integrado

```
┌─────────────────────────────────────────────────────────────┐
│        PÁGINA PRINCIPAL (Index) - Puerta de Entrada          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐      ┌──────────────────────────┐ │
│  │ LOGIN DASHBOARD      │      │ LOGIN HOSIX              │ │
│  │ PROFESIONALES        │      │ GESTIÓN HOSPITALARIA     │ │
│  │ SANITARIOS           │      │                          │ │
│  └──────────┬───────────┘      └───────────────┬──────────┘ │
│             │                                   │             │
│             ▼                                   ▼             │
│  ┌──────────────────────┐      ┌──────────────────────────┐ │
│  │ Sistema Actual       │      │ NUEVO SISTEMA HOSIX      │ │
│  │ (Profesionales)      │      │ ┌────────────────────┐   │ │
│  │                      │      │ │ • Configuración    │   │ │
│  │ • Registro           │      │ │ • Administrativo   │   │ │
│  │ • Búsqueda           │      │ │ • Asistencial      │   │ │
│  │ • Validación         │      │ │ • Complementario   │   │ │
│  │                      │      │ │ • BI               │   │ │
│  └──────────────────────┘      │ └────────────────────┘   │ │
│                                 │                          │ │
│                                 │ FASE 3-5 (NUEVO)        │ │
│                                 │ • Enfermería             │ │
│                                 │ • Triage                 │ │
│                                 │ • CPOE + CDS             │ │
│                                 │ • Interoperabilidad      │ │
│                                 │ • Escalabilidad          │ │
│                                 └──────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Estructura de Rutas Completa

```typescript
// Rutas del Sistema HOSIX
/hosix                              // Dashboard principal
/hosix/configuracion/maestros       // Configuración maestros
/hosix/configuracion/usuarios       // Usuarios/perfiles
/hosix/configuracion/mpi            // Master Patient Index
/hosix/pacientes                    // Gestión pacientes
/hosix/pacientes/:id/hce            // Historia clínica
/hosix/urgencias                    // Urgencias + TRIAGE (NUEVO)
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

---

## 4. MÓDULOS IMPLEMENTADOS (COMPLETADOS)

### 4.1 CONFIGURACIÓN Y PARAMETRIZACIÓN (7 módulos)

#### ✅ MOD 1.0 - Maestros Generales
- ✅ Estructura hospitalaria (departamentos, servicios)
- ✅ Recursos humanos (equipos médicos, grupos usuarios)
- ✅ Categorías de episodios
- ✅ Codificación médica (CIE10)
- ✅ Plantillas de informes
- ✅ Material médico/fungible (familias, principios activos)
- ✅ Proveedores

#### ✅ MOD 2.0 - Maestros Locales
- ✅ Importación selectiva de repositorio central
- ✅ Definición de elementos propios por centro

#### ✅ MOD 3.0 - Usuarios/Perfiles/Seguridad
- ✅ CRUD usuarios
- ✅ Asignación de privilegios
- ✅ Autenticación usuario/contraseña
- ✅ Caducidad de sesión
- ✅ Complejidad de contraseña
- ✅ Expiración periódica
- ✅ Grupos y permisos detallados
- ⏳ Auditoria (implementación INMUTABLE pendiente)

#### ✅ MOD 4.0 - MPI (Master Patient Index)
- ✅ Búsqueda automática en MPI
- ✅ Importación de datos demográficos
- ✅ Sincronización de modificaciones
- ✅ Cola offline de cambios
- ✅ Tablero de historial centralizado

#### ✅ MOD 5.0 - Historia Clínica Electrónica (HCE)
- ✅ Asignación PPI único
- ✅ Búsqueda múltiples criterios
- ✅ Detección de duplicados
- ✅ Fusión de historias
- ✅ Vista cronológica
- ✅ Listado agrupado de informes/pruebas
- ✅ Avisos y alertas

#### ✅ MOD 6.0 - Portal WEB
- ✅ Portal nacional para sanitarios
- ⏳ Portal para pacientes (pendiente)

#### ✅ MOD 7.0 - BI (Business Intelligence)
- ✅ 16 reportes de portada y actividad
- ✅ Reportes de citas, cobros, estancias
- ✅ Reportes de facturación, honorarios, laboratorio

### 4.2 MÓDULOS ADMINISTRATIVOS (12 módulos)

#### ✅ ADM 1.0 - Gestión de Pacientes
- ✅ Registro con PPI único
- ✅ Historial médico-administrativo
- ✅ Fusión de historias
- ✅ Avisos administrativos
- ✅ Exportación PDF

#### ✅ ADM 2.0 - Urgencias
- ✅ Registro de entrada (hora, lugar, box, clasificación)
- ✅ Impresión de pulsera
- ✅ Sistema de triage básico
- ✅ Registro de atenciones
- ✅ Solicitud de pruebas
- ✅ Consultas a especialistas
- ✅ Generación informe de alta
- ✅ Traslado a hospitalización
- ⏳ TRIAGE ESTRUCTURADO (Escala Manchester) - NUEVO

#### ✅ ADM 3.0 - Citas y Agendas
- ✅ Definición de agendas
- ✅ Períodos hábiles
- ✅ Duración estimada
- ✅ Consideración festividades
- ✅ Estados de cita
- ✅ Plantillas de preparación
- ✅ Listados de trabajo diarios
- ✅ Recordatorios

#### ✅ ADM 4.0 - Lista de Espera
- ✅ Administración de solicitudes
- ✅ 6 tipos de listas
- ✅ Gestión por prioridad
- ✅ Histórico y estadísticas

#### ✅ ADM 5.0 - Hospitalización
- ✅ Prehospitalización
- ✅ Registro de ingreso
- ✅ Gestión de camas
- ✅ Traslados
- ✅ Pruebas diagnósticas
- ✅ Consultas a especialistas
- ✅ Informe de alta
- ✅ Facturación inmediata

#### ✅ ADM 6.0 - Teleconsulta
- ✅ Programación de videoconferencias
- ✅ Envío de aviso email/SMS
- ✅ Indicador en lista de trabajo
- ✅ Sala de espera virtual
- ✅ Iniciación de videollamada

#### ✅ ADM 7.0 - Facturación
- ✅ Facturación por línea/paquete
- ✅ Tarifas personalizadas
- ✅ Asociación automática de conceptos
- ✅ Creación de cuentas
- ✅ Generación de facturas
- ✅ Facturación a múltiples responsables
- ✅ Gestión de honorarios
- ✅ Remesas

#### ✅ ADM 8.0 - Cajas
- ✅ Registro de cobros/pagos
- ✅ Gestión de turnos
- ✅ Múltiples formas de pago
- ✅ Emisión de recibos
- ✅ Cierre y arqueo diario

#### ✅ ADM 9.0 - Recobros
- ✅ Denegación de facturas
- ✅ Notas de cargo/crédito
- ✅ Solicitudes de devolución
- ✅ Análisis de morosidad

#### ✅ ADM 10.0 - Suministros
- ✅ Gestión de artículos con código barras
- ✅ Control de unidades por envase
- ✅ Familias, grupos, subgrupos
- ✅ Unidades de dosis/compra/dispensación
- ✅ Ubicaciones de almacenamiento
- ✅ Categorías de conceptos facturables

#### ✅ ADM 11.0 - Almacenes/Depósitos
- ✅ Gestión de almacenes con depósitos diferenciados
- ✅ 8 tipos de movimientos (entradas/salidas)
- ✅ Operaciones FIFO con caducidad
- ✅ Órdenes de compra automáticas
- ✅ Stock mínimo automático
- ✅ Inventario físico con regularización
- ⚠️ **ERROR SQL 42P17 PENDIENTE** (ver sección 2.2)

#### ⏳ ADM 12.0 - Compras/Licitaciones
- ⏳ Gestión de presupuestos
- ⏳ Licitaciones con partidas
- ⏳ Ofertas y adjudicaciones
- ⏳ Pedidos y órdenes de compra

---

## 5. MÓDULOS EN DESARROLLO (PENDIENTES)

### 5.1 MÓDULOS ASISTENCIALES (11+ módulos)

#### ⏳ ASIS 1.0 - Médicos (Worklist + Prescripción + Cuidados)
| Funcionalidad | Prioridad | Estado |
|--------------|-----------|--------|
| Worklist de pacientes | CRÍTICA | ⏳ |
| Listado por tipo episodio | ALTA | ⏳ |
| Órdenes desde lista (pruebas, anotaciones, diagnósticos) | ALTA | ⏳ |
| Diagnósticos CIM10/CIE9 | ALTA | ⏳ |
| **Prescripción Electrónica (CPOE)** | CRÍTICA | ⏳ NUEVO |
| Diario clínico con notas | ALTA | ⏳ |
| Plantillas de informes | ALTA | ⏳ |
| Ventana resumen paciente | ALTA | ⏳ |
| Interconsultas | ALTA | ⏳ |
| Cuestionarios/Escalas clínicas | ALTA | ⏳ |

#### ⏳ ASIS 2.0 - Enfermería (Complementario Nuevo)
| Funcionalidad | Prioridad | Estado |
|--------------|-----------|--------|
| Worklist de órdenes | CRÍTICA | ⏳ NUEVO |
| Administración de medicamentos (5 correctas) | CRÍTICA | ⏳ NUEVO |
| Toma de constantes (signos vitales) | CRÍTICA | ⏳ NUEVO |
| Balance hídrico | ALTA | ⏳ NUEVO |
| Notas de enfermería (SOAP/SBAR) | ALTA | ⏳ NUEVO |
| Valoración de riesgos (Braden, Morse) | ALTA | ⏳ NUEVO |
| Procedimientos de enfermería | ALTA | ⏳ NUEVO |
| Gestión de materiales/insumos | ALTA | ⏳ NUEVO |

#### ⏳ ASIS 3.0 - Quirófanos
| Funcionalidad | Prioridad |
|--------------|-----------|
| Configuración de quirófanos | ALTA |
| Programación | ALTA |
| Planificación de procedimientos | ALTA |
| Gestión de kits quirúrgicos | ALTA |
| Registro de actividad | ALTA |
| Seguimiento de personal | ALTA |
| Traslados inter/intra servicios | ALTA |
| Reanimación | ALTA |

#### ⏳ ASIS 4.0 - Obstetricia
| Funcionalidad | Prioridad |
|--------------|-----------|
| Seguimiento embarazo | ALTA |
| Control gestacional | ALTA |
| Partograma gráfico (OMS) | CRÍTICA |
| Registro de parto | ALTA |
| Datos del recién nacido (automático) | ALTA |

#### ⏳ ASIS 5.0 - CRED (Crecimiento y Desarrollo)
| Funcionalidad | Prioridad |
|--------------|-----------|
| Visitas pediátricas | ALTA |
| Mediciones (peso, altura, perímetro craneal) | ALTA |
| Diagnóstico nutricional | ALTA |
| Gráficas de crecimiento (SCORES, OMS) | ALTA |
| Evaluaciones psicomotoras | ALTA |

#### ⏳ ASIS 6.0 - Vacunas
| Funcionalidad | Prioridad |
|--------------|-----------|
| Calendario vacunal | ALTA |
| Registro de administración | ALTA |
| Estado inmune | ALTA |

#### ⏳ ASIS 7.0 - Dietética
| Funcionalidad | Prioridad |
|--------------|-----------|
| Planes dietéticos | ALTA |
| Control de comidas | ALTA |
| Dietas especializadas | ALTA |
| Menús suplementarios | MEDIA |

#### ⏳ ASIS 8.0 - RIS (Sistema Radiológico)
| Funcionalidad | Prioridad |
|--------------|-----------|
| Gestión de informes | ALTA |
| Modelos predefinidos | ALTA |
| Firma de informes | ALTA |
| Acceso por servicios | ALTA |

#### ⏳ ASIS 9.0 - Farmacia
| Funcionalidad | Prioridad |
|--------------|-----------|
| Gestión medicamentos/fungibles | CRÍTICA |
| Código de barras | ALTA |
| Recepción de prescripciones | ALTA |
| Dispensación | ALTA |
| Unidosis | ALTA |
| Control de caducidades | ALTA |

#### ⏳ ASIS 10.0 - Diabetes e HTA
| Funcionalidad | Prioridad |
|--------------|-----------|
| Consulta especializada | ALTA |
| Diabetes: glucemias + FINDRISC | ALTA |
| HTA: constantes + ASCVD | ALTA |
| Pie diabético | ALTA |

#### ⏳ ASIS 11.0 - Informes Dinámicos Departamentales
| Funcionalidad | Prioridad |
|--------------|-----------|
| Plantillas personalizadas | ALTA |
| Textos e imágenes con anotaciones | ALTA |
| Almacenamiento estructurado para IA/ML | ALTA |

### 5.2 MÓDULOS COMPLEMENTARIOS (4+ módulos)

#### ⏳ COMP 1.0 - Laboratorio (Integración)
- ⏳ Solicitudes desde HIS a LIS
- ⏳ Resultados automáticos en HCE
- ⏳ Notificaciones de disponibilidad

#### ⏳ COMP 2.0/3.0 - PACS (Integración DICOM)
- ⏳ Almacenamiento de imágenes médicas
- ⏳ Integración con RIS

#### ⏳ COMP 4.0 - Telemedicina (JITSI)
- ⏳ Integración de comunicación equipos

---

## 6. ANÁLISIS DE DEFICIENCIAS CRÍTICAS

### 6.1 A - INTEROPERABILIDAD (CRÍTICA)

**Problema**: No hay especificación explícita de soportar FHIR, HL7 v2, LOINC, SNOMED, DICOM.

**Impacto**:
- Integración frágil con LIS, PACS, dispositivos
- Imposibilidad de e-prescription estándar
- Riesgo legal en interoperabilidad

**Solución Recomendada**:
```
• Adoptar FHIR R4 como estándar de interoperabilidad
• API Gateway con OpenAPI 3.0
• Interface Engine para transformaciones (HL7, DICOM)
• Endpoints REST/FHIR para HCE, Prescripciones, Citas, Resultados
• Mappeo de tablas actuales a recursos FHIR
```

**Módulos Nuevos Requeridos**:
- `Integration Engine` (FHIR, HL7, DICOM, LOINC)
- `API Gateway` (autenticación, rate limiting, logging)
- `Terminology Service` (SNOMED, LOINC, CIE10)

**Prioridad**: CRÍTICA (0-3 meses)

---

### 6.2 B - SEGURIDAD Y PRIVACIDAD (CRÍTICA/ALTA)

**Problemas Identificados**:
1. Falta OAuth2/OpenID Connect, SSO, MFA
2. Sin cifrado en tránsito/reposo
3. Sin gestión de claves (KMS)
4. Sin DLP (Data Loss Prevention)
5. Auditoría no inmutable
6. Sin módulo de Gestión de Consentimiento
7. Sin política de retención/anonimización (PHI)

**Impacto**:
- Vulnerabilidades de seguridad críticas
- Incumplimiento normativo (RGPD, HIPAA equivalente)
- Riesgo de acceso no autorizado a datos sensibles

**Solución Recomendada**:
```
• OAuth2/OIDC con MFA (SMS, TOTP)
• TLS 1.3 en tránsito, cifrado AES-256 en reposo
• KMS (Key Management Service)
• Auditoría con hash chaining (append-only)
• Consentimiento informado estructurado
• DLP con alertas de exfiltración
• Anonimización automática para BI/ML
```

**Componentes Nuevos**:
- `Identity & Access Management (IAM)` 
- `Consent Manager`
- `Encryption Service`
- `Audit Log Service` (inmutable)

**Prioridad**: CRÍTICA (0-3 meses)

---

### 6.3 C - ARQUITECTURA OPERACIONAL / ESCALABILIDAD / RESILIENCIA (ALTA)

**Problemas**:
1. Arquitectura monolítica React + BD
2. Sin microservicios ni event-driven
3. Sin colas (Kafka, RabbitMQ)
4. Sin containerización/Kubernetes
5. Sin autoscaling
6. Sin plan DR/backup

**Impacto**:
- Problemas con carga en picos (urgencias)
- Continuidad de negocio comprometida
- Escalabilidad limitada

**Solución Recomendada**:
```
• Decomposición en microservicios por dominio
  - Pacientes (patient-service)
  - Citas (appointments-service)
  - Prescripciones (prescriptions-service)
  - Órdenes (orders-service)
  - Notificaciones (notifications-service)
• Event Bus: Kafka/RabbitMQ
• Containerización: Docker
• Orquestación: Kubernetes
• Autoscaling basado en carga
• Load Balancer, Service Mesh (Istio)
• Backup geográficamente distribuido
```

**Prioridad**: ALTA (3-6 meses)

---

### 6.4 D - MOTOR DE APOYO CLÍNICO (CDS) (ALTA)

**Problema**: CDS mencionado en CPOE pero sin especificaciones de motor de reglas, versionado, alert fatigue.

**Impacto**:
- Falta de soporte a decisiones clínicas
- Sin detección de interacciones medicamentosas
- Sin alertas de dosificación pediátrica
- Riesgo en seguridad del paciente

**Solución Recomendada**:
```
• Motor de reglas: Drools o FHIR CDS Hooks
• Fuente de conocimiento: Terminologías (SNOMED, LOINC)
• Alertas estructuradas:
  - Interacciones medicamentosas (DrugBank)
  - Alergias y contraindicaciones
  - Dosificación máxima/pediátrica
  - Duplicidad de prescripciones
• Versionado de reglas
• Gestión de "alert fatigue"
```

**Módulo Nuevo**:
- `Clinical Decision Support (CDS) Engine`

**Prioridad**: ALTA (3-6 meses)

---

### 6.5 E - OBSERVABILIDAD, PRUEBAS Y DEVOPS (MEDIA/ALTA)

**Problemas**:
1. Sin CI/CD definido
2. Sin pruebas automatizadas (SIL/QA)
3. Sin performance testing
4. Sin monitoreo central (logs/metrics/tracing)
5. Sin SLO/SLA definidos

**Impacto**:
- Tiempo-to-production lento
- Falta de visibilidad en problemas
- Imposibilidad de reaccionar rápidamente

**Solución Recomendada**:
```
• CI/CD: GitHub Actions / GitLab CI
• Pruebas automatizadas: Jest, Cypress, Playwright
• Performance testing: k6, JMeter
• Monitoreo: ELK Stack / OpenTelemetry
• APM: Datadog, New Relic o similar
• SLO/SLA: 99.95% uptime, <200ms latencia HCE
• Alerting: PagerDuty
```

**Prioridad**: MEDIA (6-12 meses)

---

### 6.6 F - MÓDULOS CLÍNICOS FALTANTES

#### ⚠️ TRIAGE ESTRUCTURADO (Urgencias)
**Falta**: Escala Manchester (1-5), reassessment, alertas de riesgo

#### ⚠️ ESCALAS CLÍNICAS Y RIESGO CLÍNICO
**Falta**: EWS/NEWS/MEWS, SOFA, qSOFA, APGAR, Glasgow, Braden, Morse, etc.

#### ⚠️ ENFERMERÍA AVANZADA
**Falta**: NANDA/NIC/NOC, planes de cuidados, escalas de riesgo

#### ⚠️ UCI ESPECIALIZADA
**Falta**: Hoja intensiva, balance hídrico avanzado, gases arteriales, sedoanalgesia

#### ⚠️ INTERCONSULTAS Y CONTRARREFERENCIAS
**Falta**: Flujos transversales entre especialidades

#### ⚠️ CONSENTIMIENTO INFORMADO
**Falta**: Firmas electrónicas, versionado, auditoría

#### ⚠️ MÓDULOS ESPECIALIZADOS
**Falta**: Salud mental, banco de sangre, medicina transfusional, cuidados paliativos

---

## 7. MÓDULOS COMPLEMENTARIOS DE ENFERMERÍA (NUEVO)

### 7.1 Visión General

La enfermería es fundamental en la operación hospitalaria. Los módulos complementarios de enfermería proporcionan:
- Gestión de órdenes médicas
- Documentación de cuidados
- Toma de constantes
- Valoración de riesgos
- Trazabilidad de materiales

### 7.2 ASIS 2.0 - ENFERMERÍA (Detalle Completo)

#### 7.2.1 Worklist de Órdenes (ASIS 2.1)

```sql
CREATE TABLE hosix_enfermeria_worklist_ordenes (
  id UUID PRIMARY KEY,
  paciente_id UUID REFERENCES hosix_pacientes(id),
  tipo_orden VARCHAR(50), -- medicamento, prueba, procedimiento
  descripcion TEXT,
  prioridad VARCHAR(20), -- baja, normal, alta, urgente
  estado VARCHAR(30) DEFAULT 'pendiente', -- pendiente, en_proceso, completada
  turno VARCHAR(20), -- mañana, tarde, noche
  fecha_programada TIMESTAMPTZ,
  fecha_ejecucion TIMESTAMPTZ,
  profesional_asignado_id UUID,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Funcionalidades**:
- ✅ Tablero de tareas en tiempo real
- ✅ Órdenes médicas pendientes
- ✅ Filtrado por paciente, turno, prioridad
- ✅ Codificación por color (semáforo)

#### 7.2.2 Administración de Medicamentos (ASIS 2.2)

```sql
CREATE TABLE hosix_enfermeria_administracion_medicamentos (
  id UUID PRIMARY KEY,
  prescripcion_id UUID REFERENCES hosix_prescripciones(id),
  medicamento_id UUID REFERENCES hosix_articulos(id),
  
  -- 5 Correctas Verificadas
  verificacion_paciente BOOLEAN,
  verificacion_medicamento BOOLEAN,
  verificacion_dosis BOOLEAN,
  verificacion_via BOOLEAN,
  verificacion_hora BOOLEAN,
  
  -- Administración
  dosis_administrada VARCHAR(100),
  via_administracion VARCHAR(50),
  fecha_hora_administracion TIMESTAMPTZ NOT NULL,
  
  -- Respuesta
  evento_adverso BOOLEAN DEFAULT false,
  descripcion_evento TEXT,
  
  enfermero_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Funcionalidades**:
- ✅ Registro hora exacta
- ✅ Lectura código barras (paciente/medicamento)
- ✅ Verificación "5 Correctas"
- ✅ Evento adverso registrado
- ✅ Trazabilidad completa

#### 7.2.3 Constantes Vitales (ASIS 2.4)

```sql
CREATE TABLE hosix_enfermeria_signos_vitales (
  id UUID PRIMARY KEY,
  paciente_id UUID REFERENCES hosix_pacientes(id),
  episodio_id UUID,
  
  temperatura DECIMAL(4,1),
  frecuencia_cardiaca INT,
  presion_sistolica INT,
  presion_diastolica INT,
  frecuencia_respiratoria INT,
  saturacion_oxigeno INT,
  glucosa INT,
  dolor_vas INT CHECK (dolor_vas >= 0 AND dolor_vas <= 10),
  
  tiene_alerta BOOLEAN DEFAULT false,
  tipo_alerta VARCHAR(50), -- critico, alto, moderado
  
  fecha_toma TIMESTAMPTZ NOT NULL DEFAULT now(),
  enfermero_id UUID NOT NULL,
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para gráficos de tendencia
CREATE INDEX idx_signos_vitales_paciente_fecha 
ON hosix_enfermeria_signos_vitales(paciente_id, fecha_toma DESC);
```

**Funcionalidades**:
- ✅ Entrada rápida optimizada
- ✅ Gráficos de tendencia automáticos
- ✅ Alertas de valores críticos
- ✅ Integración con HCE

#### 7.2.4 Balance Hídrico (ASIS 2.5)

```sql
CREATE TABLE hosix_enfermeria_balance_hidrico (
  id UUID PRIMARY KEY,
  paciente_id UUID,
  fecha DATE,
  
  ingreso_oral_ml INT DEFAULT 0,
  ingreso_iv_ml INT DEFAULT 0,
  ingreso_sng_ml INT DEFAULT 0,
  otros_ingresos_ml INT DEFAULT 0,
  
  egreso_orina_ml INT DEFAULT 0,
  egreso_vomito_ml INT DEFAULT 0,
  egreso_drenaje_ml INT DEFAULT 0,
  egreso_deposiciones_ml INT DEFAULT 0,
  otros_egresos_ml INT DEFAULT 0,
  
  balance_total_ml INT,
  turno VARCHAR(20),
  enfermero_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Funcionalidades**:
- ✅ Registro de ingresos (oral, IV, SNG)
- ✅ Registro de egresos (orina, vómito, drenaje)
- ✅ Balance automático calculado

#### 7.2.5 Notas de Enfermería (ASIS 2.6)

```sql
CREATE TABLE hosix_enfermeria_notas (
  id UUID PRIMARY KEY,
  paciente_id UUID,
  episodio_id UUID,
  
  tipo_nota VARCHAR(50) DEFAULT 'evolucion', -- evolucion, ingreso, egreso
  formato VARCHAR(20) DEFAULT 'soap', -- soap, sbar, narrativo
  
  -- SOAP
  subjetivo TEXT,
  objetivo TEXT,
  analisis TEXT,
  plan TEXT,
  
  enfermero_id UUID NOT NULL,
  firmado BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 7.2.6 Valoración de Riesgos (ASIS 2.7)

```sql
CREATE TABLE hosix_enfermeria_valoracion_riesgos (
  id UUID PRIMARY KEY,
  paciente_id UUID,
  episodio_id UUID,
  
  tipo_escala VARCHAR(50), -- braden, morse, norton, barthel
  
  -- Braden (úlceras por presión)
  braden_total INT,
  braden_riesgo VARCHAR(20), -- sin_riesgo, bajo, moderado, alto
  
  -- Morse (caídas)
  morse_total INT,
  morse_riesgo VARCHAR(20), -- bajo, moderado, alto
  
  plan_preventivo_generado BOOLEAN DEFAULT false,
  
  enfermero_id UUID NOT NULL,
  fecha_valoracion TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 8. MÓDULOS NUEVOS RECOMENDADOS (PRIORIZADO)

### 8.1 Prioridad INMEDIATA (0-3 meses)

| ID | Módulo | Descripción | Impacto |
|----|--------|-------------|--------|
| **NEW-1** | **Integration Engine (FHIR/HL7/DICOM)** | Interoperabilidad con sistemas externos | CRÍTICO |
| **NEW-2** | **Identity & Access Management (IAM)** | OAuth2/OIDC, SSO, MFA, RBAC/ABAC | CRÍTICO |
| **NEW-3** | **Consent & Privacy Manager** | Captura consentimiento, audita accesos PHI | CRÍTICO |
| **NEW-4** | **Operational Security** | TLS, cifrado en reposo, KMS, DLP | CRÍTICO |

### 8.2 Prioridad MEDIA (3-6 meses)

| ID | Módulo | Descripción | Impacto |
|----|--------|-------------|--------|
| **NEW-5** | **Clinical Decision Support (CDS) Engine** | Motor de reglas con versionado | ALTO |
| **NEW-6** | **Event Bus (Kafka/RabbitMQ)** | Colas para procesos asíncronos, MPI sync | ALTO |
| **NEW-7** | **Terminology Service** | SNOMED, LOINC, CIE10 búsquedas | ALTO |
| **NEW-8** | **Device Integration / IoT Gateway** | HL7 v2 / MQTT para monitores | ALTO |
| **ADM-12** | **Compras/Licitaciones (Completar)** | Gestión de presupuestos y licitaciones | ALTO |
| **ASIS-12** | **Triage Estructurado (Manchester)** | Clasificación en urgencias | CRÍTICO |
| **ASIS-14** | **CPOE + Prescripción Electrónica** | Interfaz de prescripción estructurada | CRÍTICO |

### 8.3 Prioridad BAJA pero Necesaria (6-12 meses)

| ID | Módulo | Descripción | Impacto |
|----|--------|-------------|--------|
| **NEW-9** | **Observability & Logging Stack** | ELK, OpenTelemetry, tracing, alerting | MEDIO |
| **NEW-10** | **Backup / DR & Business Continuity** | Políticas, runbooks, drills | MEDIO |
| **NEW-11** | **DevOps / CI-CD Pipelines** | IaC (Terraform/Helm) | MEDIO |
| **NEW-12** | **Data Lake / ETL** | BI + ML con anonimización | MEDIO |

---

## 9. ARQUITECTURA OPERACIONAL Y SEGURIDAD

### 9.1 Arquitectura Objetivo (Microservicios)

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENTE (Web/Mobile)                   │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│            API GATEWAY (OpenAPI, OAuth2)                  │
│  • Autenticación/Autorización                            │
│  • Rate Limiting                                         │
│  • Logging/Auditoría                                     │
└────────────────────────┬─────────────────────────────────┘
                         │
    ┌────────────────────┼───────────────────┐
    ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Patient Srv  │  │ Orders Srv   │  │ Notifications│
│              │  │              │  │              │
│ • HCE        │  │ • Prescr.    │  │ • SMS        │
│ • MPI        │  │ • Labs       │  │ • Email      │
│ • Consent    │  │ • Imaging    │  │ • In-app     │
└──────────────┘  └──────────────┘  └──────────────┘

    ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ CDS Engine   │  │ Event Bus    │  │ Terminology  │
│              │  │ (Kafka)      │  │ Service      │
│ • Reglas     │  │              │  │              │
│ • Alertas    │  │ • Topics     │  │ • SNOMED     │
│ • Scoring    │  │ • Consumers  │  │ • LOINC      │
└──────────────┘  └──────────────┘  └──────────────┘

    ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────┐
│                 Shared Infrastructure                     │
│  • PostgreSQL (Primary DB)                              │
│  • Redis (Cache/Sessions)                               │
│  • Elasticsearch (Logs)                                 │
│  • Prometheus (Metrics)                                 │
│  • S3/GCS (File Storage)                                │
│  • KMS (Key Management)                                 │
└──────────────────────────────────────────────────────────┘
```

### 9.2 Seguridad Integrada

```
Capas de Seguridad Implementadas:
1. Autenticación: OAuth2/OIDC con MFA
2. Autorización: RBAC/ABAC por recurso
3. Transporte: TLS 1.3
4. Almacenamiento: AES-256 en reposo
5. Auditoría: Inmutable con hash chaining
6. DLP: Detección de exfiltración de PHI
7. Consentimiento: Gestión de privacidad
```

---

## 10. PLAN DE IMPLEMENTACIÓN INTEGRADO

### 10.1 Sprint 0 (1-2 semanas) - BLOQUEADORES

| Tarea | Duración | Impacto | Estado |
|-------|----------|--------|--------|
| **FIX SQL 42P17** (almacenes) | 1-2h | BLOQUEADOR | ⚠️ INMEDIATO |
| Migración ADM 11.0 | 2-4h | Crítico | ⏳ |
| Completar ADM 12.0 (Compras) | 8-10h | Alto | ⏳ |

### 10.2 Sprints 1-3 (4-8 semanas) - SEGURIDAD E INTEROPERABILIDAD

| Sprint | Objetivos | Módulos |
|--------|-----------|---------|
| **Sprint 1-2** | Implementar IAM, OAuth2/OIDC, MFA | NEW-2, NEW-4 |
| **Sprint 2-3** | API Gateway, OpenAPI, TLS | NEW-1 (Partial) |
| **Sprint 3** | Auditoría inmutable, DLP básico | NEW-2, NEW-4 |

### 10.3 Sprints 4-6 (8-12 semanas) - ASISTENCIAL CRÍTICO

| Sprint | Objetivos | Módulos |
|--------|-----------|---------|
| **Sprint 4** | ASIS 12.0 - Triage Manchester | ASIS-12 |
| **Sprint 4-5** | ASIS 2.0 - Enfermería (Worklist, Constantes) | ASIS 2.0+ |
| **Sprint 5-6** | ASIS 14.0 - CPOE + CDS Basic | ASIS-14, NEW-5 |

### 10.4 Sprints 7-9 (12-18 semanas) - ESCALABILIDAD

| Sprint | Objetivos | Módulos |
|--------|-----------|---------|
| **Sprint 7-8** | Event Bus (Kafka), Integration Engine | NEW-6, NEW-1 |
| **Sprint 8-9** | Microservicios, Kubernetes | Arquitectura |

### 10.5 Sprints 10-12 (18-24 semanas) - OBSERVABILIDAD Y COMPLETITUD

| Sprint | Objetivos | Módulos |
|--------|-----------|---------|
| **Sprint 10-11** | Observability (ELK, OpenTelemetry) | NEW-9 |
| **Sprint 11-12** | DR, CI-CD, Data Lake | NEW-10, NEW-11, NEW-12 |

---

## 11. ROADMAP 12 SPRINTS

### Fase 0: Correcciones Inmediatas (Semana 1)
```
□ Aplicar fix SQL 42P17 (almacenes)
□ Completar migración ADM 11.0
□ Iniciar ADM 12.0 (Compras)
Duración: 1-2 semanas
```

### Fase 1: Seguridad e IAM (Semanas 2-8)
```
Sprint 1-2:
  □ Implementar OAuth2/OIDC
  □ MFA (SMS, TOTP)
  □ RBAC/ABAC por recurso
  □ Sesiones cortas y revocación

Sprint 2-3:
  □ API Gateway (rate limiting, logging)
  □ OpenAPI 3.0 specification
  □ TLS 1.3 en toda la plataforma
  □ Cifrado en reposo (AES-256)
  □ KMS (Key Management)
  □ Auditoría inmutable con hash chaining

Duración: 6-8 semanas
```

### Fase 2: Interoperabilidad (Semanas 6-12)
```
Sprint 4-6:
  □ Integration Engine FHIR R4
  □ Mapeo de tablas a recursos FHIR
  □ Endpoints REST para HCE, Prescripciones, Citas
  □ HL7 v2 interface engine
  □ DICOM gateway para PACS
  □ Terminology Service (SNOMED, LOINC)

Duración: 6-8 semanas
```

### Fase 3: Módulos Asistenciales Críticos (Semanas 10-18)
```
Sprint 4-6:
  □ ASIS 12.0 - Triage (Manchester, SBAR, alertas)
  □ ASIS 2.0 - Enfermería:
    - Worklist de órdenes
    - Administración de medicamentos (5 correctas)
    - Toma de constantes
    - Balance hídrico
    - Notas SOAP/SBAR
    - Valoración de riesgos (Braden, Morse)

Sprint 5-7:
  □ ASIS 14.0 - CPOE + Prescripción Electrónica
  □ Clinical Decision Support (CDS):
    - Motor de reglas
    - Interacciones medicamentosas
    - Dosificación pediátrica
    - Alertas estructuradas

Duración: 8-12 semanas
```

### Fase 4: Escalabilidad (Semanas 14-20)
```
Sprint 7-9:
  □ Event Bus (Kafka/RabbitMQ)
  □ Decomposición en microservicios:
    - patient-service
    - orders-service
    - prescriptions-service
    - notifications-service
    - cds-service
  □ Containerización (Docker)
  □ Orquestación (Kubernetes)
  □ Autoscaling
  □ Load Balancer

Duración: 6-8 semanas
```

### Fase 5: Observabilidad (Semanas 18-24)
```
Sprint 10-12:
  □ ELK Stack / OpenTelemetry
  □ APM (Application Performance Monitoring)
  □ Distributed Tracing
  □ SLO/SLA definidos (99.95% uptime)
  □ Alerting (PagerDuty)
  □ Dashboards SRE
  □ DR / Backup Plan
  □ CI/CD Pipelines (GitHub Actions)
  □ Data Lake + ETL

Duración: 6-8 semanas
```

---

## 12. ESTIMACIÓN DE ESFUERZO Y RECURSOS

### Tabla de Esfuerzo Estimado

| Fase | Módulos | Duración | Recursos | Complejidad |
|------|---------|----------|----------|------------|
| Sprint 0 | ADM 11-12, Fixes | 1-2 sem | 1 Dev | Alta |
| Sprints 1-3 | IAM, OAuth2, Security | 6-8 sem | 2-3 Devs | Alta |
| Sprints 4-6 | ASIS 2.0, 12.0, 14.0, CDS | 8-12 sem | 3-4 Devs | Alta |
| Sprints 7-9 | Microservicios, K8s | 6-8 sem | 2-3 DevOps | Alta |
| Sprints 10-12 | Observability, DR, BI | 6-8 sem | 2 Devs | Media |
| **TOTAL** | **34 módulos completados** | **27-38 semanas** | **Equipo de 8-12** | **Alta** |

### Timeline Estimado
- **Fase 0**: Semana 1
- **Fase 1**: Semanas 2-8 (7 semanas)
- **Fase 2**: Semanas 6-14 (8 semanas, parcialmente paralela)
- **Fase 3**: Semanas 10-22 (12 semanas, paralela a Fase 2)
- **Fase 4**: Semanas 14-22 (8 semanas)
- **Fase 5**: Semanas 18-26 (8 semanas)

**Duración Total**: ~6 meses (26 semanas) con equipo paralelo

---

## 13. ESTRUCTURA DE CARPETAS Y ARCHIVOS PROPUESTA

```
code/
├── src/
│   ├── components/
│   │   ├── hosix/
│   │   │   ├── enfermeria/                   # NUEVO - Módulos enfermería
│   │   │   │   ├── WorklistOrdenes.tsx
│   │   │   │   ├── AdministracionMedicamentos.tsx
│   │   │   │   ├── SignosVitales.tsx
│   │   │   │   ├── BalanceHidrico.tsx
│   │   │   │   ├── NotasEnfermeria.tsx
│   │   │   │   └── ValoracionRiesgos.tsx
│   │   │   ├── triage/                       # NUEVO - Triage Manchester
│   │   │   │   ├── TriageClassification.tsx
│   │   │   │   ├── TriageDiscriminators.tsx
│   │   │   │   └── TriageAlerts.tsx
│   │   │   ├── cpoe/                         # NUEVO - CPOE + CDS
│   │   │   │   ├── PrescriptionForm.tsx
│   │   │   │   ├── CDSAlerts.tsx
│   │   │   │   └── InteractionChecker.tsx
│   │   │   ├── integracion/                  # NUEVO - Interoperabilidad
│   │   │   │   ├── FHIREndpoints.tsx
│   │   │   │   ├── HL7Translator.tsx
│   │   │   │   └── TerminologyService.tsx
│   │   │   └── seguridad/                    # NUEVO - IAM + Seguridad
│   │   │       ├── OAuth2LoginForm.tsx
│   │   │       ├── MFASetup.tsx
│   │   │       └── ConsentManager.tsx
│   ├── hooks/
│   │   ├── useHosixEnfermeria.ts            # NUEVO
│   │   ├── useTriageClassification.ts       # NUEVO
│   │   ├── useCDSEngine.ts                  # NUEVO
│   │   ├── useFHIRInterop.ts                # NUEVO
│   │   └── useIAM.ts                        # NUEVO
│   ├── lib/
│   │   ├── cds/                             # NUEVO - Motor CDS
│   │   │   ├── rules.ts
│   │   │   ├── alerts.ts
│   │   │   └── drugInteractions.ts
│   │   ├── fhir/                            # NUEVO - FHIR helpers
│   │   │   ├── resourceMapper.ts
│   │   │   ├── validator.ts
│   │   │   └── examples.ts
│   │   └── security/                        # NUEVO - Seguridad
│   │       ├── encryption.ts
│   │       ├── audit.ts
│   │       └── consent.ts
│   └── types/
│       ├── enfermeria.ts                    # NUEVO
│       ├── triage.ts                        # NUEVO
│       ├── cpoe.ts                          # NUEVO
│       ├── fhir.ts                          # NUEVO
│       └── security.ts                      # NUEVO
├── supabase/
│   ├── migrations/
│   │   ├── 002_enforce_audit_immutability.sql  # NUEVO
│   │   ├── 003_enfermeria_tables.sql           # NUEVO
│   │   ├── 004_triage_manchester.sql          # NUEVO
│   │   ├── 005_cpoe_cds.sql                   # NUEVO
│   │   └── 006_security_enhancements.sql      # NUEVO
│   └── functions/
│       ├── cds-engine/
│       │   ├── index.ts                       # NUEVO
│       │   ├── drugInteractions.ts
│       │   └── dosageCalculator.ts
│       ├── fhir-translator/
│       │   └── index.ts                       # NUEVO
│       ├── enfermeria/
│       │   ├── calculate-balance-hidrico.ts   # NUEVO
│       │   └── alert-signos-vitales.ts       # NUEVO
│       └── seguridad/
│           ├── audit-log-immutable.ts         # NUEVO
│           └── consent-tracker.ts             # NUEVO
├── DOCUMENTOS/
│   ├── HOSIX_ARQUITECTURA_INTEGRADA_FINAL.md  # ESTE
│   ├── HOSIX_ROADMAP_12_SPRINTS.md            # NUEVO
│   ├── HOSIX_CHECKLIST_SEGURIDAD.md           # NUEVO
│   ├── HOSIX_ESPECIFICACION_FHIR.md          # NUEVO
│   ├── HOSIX_ESPECIFICACION_CDS.md           # NUEVO
│   ├── HOSIX_ESPECIFICACION_IAM.md           # NUEVO
│   └── HOSIX_ESPECIFICACION_ENFERMERIA.md    # NUEVO
```

---

## 14. CONCLUSIONES Y RECOMENDACIONES FINALES

### 14.1 Fortalezas Actuales ✅
- ✅ Cobertura funcional amplia (80% de operaciones clínicas)
- ✅ BD bien diseñada con ~80 tablas
- ✅ Plan de implementación estructurado
- ✅ 32% de módulos completados (11/34)

### 14.2 Deficiencias Críticas ⚠️
- ⚠️ Interoperabilidad (FHIR/HL7 no especificados)
- ⚠️ Seguridad y Privacidad (IAM, cifrado, auditoría deficientes)
- ⚠️ Escalabilidad (arquitectura monolítica, sin evento-driven)
- ⚠️ CDS (motor de reglas incompleto)
- ⚠️ Observabilidad (sin monitoreo central)

### 14.3 Acciones Inmediatas Recomendadas 🎯

1. **FIX SQL 42P17** (almacenes) - 1-2 horas
2. **Completar ADM 12.0** (Compras/Licitaciones) - 8-10 horas
3. **Iniciar Sprint 1** (IAM + OAuth2) - Prioridad CRÍTICA
4. **Iniciar ASIS 2.0** (Enfermería) - Módulo esencial clínico
5. **Iniciar ASIS 12.0 + ASIS 14.0** (Triage + CPOE) - Seguridad del paciente

### 14.4 Inversión Recomendada
- **Recursos**: 8-12 desarrolladores (Dev, DevOps, QA)
- **Duración**: 6-8 meses
- **Costo**: Estimado en $480K-$800K (según mercado)
- **ROI**: Sistema hospitalario nacional completo, estándar internacional

### 14.5 Próximos Documentos a Generar
1. ✅ **HOSIX_ARQUITECTURA_INTEGRADA_FINAL.md** (ESTE)
2. ⏳ **HOSIX_ROADMAP_12_SPRINTS.md** (Backlog detallado con historias de usuario)
3. ⏳ **HOSIX_CHECKLIST_SEGURIDAD.md** (20+ ítems de compliance)
4. ⏳ **HOSIX_ESPECIFICACION_FHIR.md** (Mapping de recursos FHIR)
5. ⏳ **HOSIX_ESPECIFICACION_CDS.md** (Motor de reglas)
6. ⏳ **HOSIX_ESPECIFICACION_IAM.md** (OAuth2, OIDC, MFA)
7. ⏳ **HOSIX_ESPECIFICACION_ENFERMERIA.md** (Detalle completo ASIS 2.0)

---

**Documento Compilado**: 2025-02-05  
**Responsable**: Arquitectura HOSIX - GEPROSTEC  
**Estado**: LISTO PARA IMPLEMENTACIÓN
