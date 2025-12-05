# HOSIX - Sistema de Gestión Hospitalaria Nacional
## Documento de Arquitectura e Implementación Completa

> **Versión**: 1.2
> **Fecha Última Actualización**: 2025-01-22 (Sesión 10)
> **Proyecto**: Dashboard de Gestión Hospitalaria - GEPROSTEC

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura General del Sistema](#2-arquitectura-general-del-sistema)
3. [Módulos de Configuración y Parametrización](#3-módulos-de-configuración-y-parametrización)
4. [Módulos Administrativos](#4-módulos-administrativos)
5. [Módulos Asistenciales](#5-módulos-asistenciales)
6. [Módulos Complementarios](#6-módulos-complementarios)
7. [Sistema BI - Business Intelligence](#7-sistema-bi---business-intelligence)
8. [Diseño de Base de Datos](#8-diseño-de-base-de-datos)
9. [Plan de Implementación](#9-plan-de-implementación)
10. [Integración con Sistema Actual](#10-integración-con-sistema-actual)

---

## 1. RESUMEN EJECUTIVO

### 1.1 Visión del Sistema
Sistema integral de gestión hospitalaria nacional que centraliza:
- Gestión de pacientes e historia clínica electrónica
- Administración hospitalaria completa
- Módulos asistenciales especializados
- Business Intelligence y reportería avanzada

### 1.2 Grupos de Módulos

| Grupo | Cantidad | Descripción |
|-------|----------|-------------|
| Configuración y Parametrización | 7 | Maestros, seguridad, MPI, HCE, Portal Web, BI |
| Administrativos | 12 | Pacientes, urgencias, citas, hospitalización, facturación |
| Asistenciales | 11 | Médicos, enfermería, quirófanos, obstetricia, farmacia |
| Complementarios | 4 | Laboratorio, PACS, telemedicina |

---

## 2. ARQUITECTURA GENERAL DEL SISTEMA

### 2.1 Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PÁGINA PRINCIPAL (Index)                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐        ┌─────────────────────────────────┐ │
│  │  LOGIN DASHBOARD    │        │  LOGIN DASHBOARD                │ │
│  │  PROFESIONALES      │        │  GESTIÓN HOSPITALARIA           │ │
│  │  SANITARIOS         │        │  (HOSIX)                        │ │
│  └─────────┬───────────┘        └───────────────┬─────────────────┘ │
│            │                                     │                   │
│            ▼                                     ▼                   │
│  ┌─────────────────────┐        ┌─────────────────────────────────┐ │
│  │ Sistema Actual      │        │ NUEVO SISTEMA HOSIX              │ │
│  │ (Profesionales/     │        │ ┌─────────────────────────────┐ │ │
│  │  Centros)           │        │ │ Módulos Configuración       │ │ │
│  └─────────────────────┘        │ │ Módulos Administrativos     │ │ │
│                                 │ │ Módulos Asistenciales       │ │ │
│                                 │ │ Módulos Complementarios     │ │ │
│                                 │ │ Business Intelligence       │ │ │
│                                 │ └─────────────────────────────┘ │ │
│                                 └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Estructura de Rutas

```typescript
// Rutas del Sistema HOSIX
/hosix                           // Dashboard principal HOSIX
/hosix/configuracion             // Configuración y parametrización
/hosix/configuracion/maestros    // Maestros generales/locales
/hosix/configuracion/usuarios    // Usuarios/Perfiles/Seguridad
/hosix/configuracion/mpi         // Master Patient Index
/hosix/pacientes                 // Gestión de pacientes
/hosix/pacientes/:id             // Detalle de paciente
/hosix/pacientes/:id/hce         // Historia Clínica Electrónica
/hosix/urgencias                 // Módulo de urgencias
/hosix/citas                     // Sistema de citas y agendas
/hosix/hospitalizacion           // Hospitalización
/hosix/quirofanos                // Quirófanos
/hosix/farmacia                  // Farmacia
/hosix/laboratorio               // Laboratorio
/hosix/facturacion               // Facturación
/hosix/bi                        // Business Intelligence
```

---

## 3. MÓDULOS DE CONFIGURACIÓN Y PARAMETRIZACIÓN

### 3.1 Configuración de Maestros Generales (Módulo 1.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| 1.0.1 | Configuración de estructura hospitalaria (departamentos, servicios) | ALTA |
| 1.0.2 | Configuración de recursos humanos (equipos médicos, grupos de usuarios) | ALTA |
| 1.0.3 | Configuración de categorías de episodios clínicos (agendas, actividades) | ALTA |
| 1.0.4 | Listados estándar de codificación médica (diagnósticos CIE10/CIM10, procedimientos) | ALTA |
| 1.0.5 | Plantillas estándar de informes médicos y administrativos | MEDIA |
| 1.0.6 | Configuración de material médico/fungible (familias, principios activos, medicamentos) | ALTA |
| 1.0.7 | Definición de proveedores de abastecimiento | MEDIA |

#### Tablas de Base de Datos:
```sql
-- Maestros Generales
hosix_departamentos
hosix_servicios
hosix_equipos_medicos
hosix_grupos_usuarios
hosix_categorias_episodios
hosix_codificacion_cie10
hosix_plantillas_informes
hosix_familias_articulos
hosix_principios_activos
hosix_medicamentos
hosix_proveedores
```

### 3.2 Configuración de Maestros Locales (Módulo 2.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| 2.0.1 | Importación selectiva de elementos del repositorio central | ALTA |
| 2.0.2 | Definición de elementos propios por centro sin interferir con otros | ALTA |

### 3.3 Usuarios / Perfiles / Seguridad (Módulo 3.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| 3.0.1 | Creación, modificación y baja de usuarios | ALTA |
| 3.0.2 | Asignación de privilegios de acceso a módulos | ALTA |
| 3.0.3 | Autenticación por usuario/contraseña | ALTA |
| 3.0.4 | Inicio de sesión alternativo (biométricos, certificados digitales) | MEDIA |
| 3.0.5 | Caducidad de sesión por inactividad (tiempo configurable) | ALTA |
| 3.0.6 | Control de acceso por Captcha anti-robots | MEDIA |
| 3.0.7 | Validación de complejidad de contraseña | ALTA |
| 3.0.8 | Expiración periódica de contraseña (configurable) | ALTA |
| 3.0.9 | Creación de grupos de usuarios/perfiles | ALTA |
| 3.0.10 | Ajuste detallado de permisos por usuario/grupo | ALTA |
| 3.0.11 | Registro de auditoría de accesos y modificaciones críticas | ALTA |
| 3.0.12 | Interfaz de consulta del registro de actividad | MEDIA |

#### Tablas de Base de Datos:
```sql
hosix_usuarios
hosix_perfiles
hosix_permisos
hosix_permisos_modulos
hosix_auditoria_accesos
hosix_sesiones
```

### 3.4 MPI - Master Patient Index e Historial Médico Centralizado (Módulo 4.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| 4.0.1 | Búsqueda automática en MPI al crear paciente | ALTA |
| 4.0.2 | Importación de datos demográficos desde MPI | ALTA |
| 4.0.3 | Sincronización de modificaciones de paciente entre centros | ALTA |
| 4.0.4 | Sincronización asíncrona con planificación autónoma por centro | MEDIA |
| 4.0.5 | Cola de cambios pendientes cuando centro está offline | ALTA |
| 4.0.6 | Tablero de mandos para consulta de historial clínico centralizado | ALTA |
| 4.0.7 | Visualización cronológica de datos de paciente | ALTA |
| 4.0.8 | Configuración de elementos visibles por centro/grupo/usuario | MEDIA |
| 4.0.9 | Diagrama visual de relaciones entre episodios y eventos | MEDIA |

### 3.5 Historia Clínica Electrónica (Módulo 5.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| 5.0.1 | Asignación de identificador único (PPI) invariable por paciente | CRÍTICA |
| 5.0.2 | Búsqueda de historias clínicas por múltiples criterios | ALTA |
| 5.0.3 | Detección de duplicados al registrar nuevo paciente | ALTA |
| 5.0.4 | Fusión de historias clínicas duplicadas | ALTA |
| 5.0.5 | Vista cronológica de episodios y visitas | ALTA |
| 5.0.6 | Listado agrupado de informes, pruebas diagnósticas, intervenciones | ALTA |
| 5.0.7 | Asociación de informes de diferentes tipos | ALTA |
| 5.0.8 | Sistema de avisos asociados a pacientes | MEDIA |
| 5.0.9 | Impresión de elementos identificativos (etiquetas, pulseras) | ALTA |
| 5.0.10 | Adjuntar documentos externos a la historia clínica | ALTA |

### 3.6 Portal WEB (Módulo 6.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| 6.0.1 | Portal Web nacional para personal sanitario | ALTA |
| 6.0.2 | Portal Web para pacientes (consulta y gestión de información) | MEDIA |

### 3.7 BI - Business Intelligence (Módulo 7.0)

> Ver sección 7 para detalle completo de reportes

---

## 4. MÓDULOS ADMINISTRATIVOS

### 4.1 Gestión de Pacientes (Módulo 1.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ADM.1.1 | Identificación y registro con número único PPI | CRÍTICA |
| ADM.1.2 | Historial médico-administrativo con filtros personalizados | ALTA |
| ADM.1.3 | Fusión de historias clínicas duplicadas | ALTA |
| ADM.1.4 | Gestión de avisos administrativos personalizados | MEDIA |
| ADM.1.5 | Exportación de historia clínica en PDF | ALTA |
| ADM.1.6 | Impresión de pulseras identificativas | ALTA |
| ADM.1.7 | Incorporación de documentos externos al expediente | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_pacientes                    -- Datos demográficos del paciente
hosix_pacientes_identificadores    -- PPI y otros identificadores
hosix_pacientes_contactos          -- Contactos de emergencia
hosix_pacientes_seguros            -- Aseguradoras asociadas
hosix_pacientes_avisos             -- Avisos administrativos
hosix_pacientes_documentos         -- Documentos adjuntos
hosix_historia_clinica             -- Entradas de historia clínica
```

### 4.2 Urgencias (Módulo 2.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ADM.2.1 | Registro de hora de entrada con lugar, procedencia, box, clasificación | CRÍTICA |
| ADM.2.2 | Impresión de pulsera identificativa al inicio | ALTA |
| ADM.2.3 | Sistema de triage para clasificación por gravedad | CRÍTICA |
| ADM.2.4 | Registro de atenciones y profesionales involucrados | ALTA |
| ADM.2.5 | Solicitud y gestión de pruebas diagnósticas | ALTA |
| ADM.2.6 | Sistema de consultas a especialistas | ALTA |
| ADM.2.7 | Registro de pertenencias del paciente | MEDIA |
| ADM.2.8 | Identificador temporal para pacientes no identificados | ALTA |
| ADM.2.9 | Documentos justificativos (asistencia, partes judiciales) | MEDIA |
| ADM.2.10 | Generación automática de informe de alta | ALTA |
| ADM.2.11 | Traslado directo a hospitalización con datos automáticos | ALTA |
| ADM.2.12 | Asociación automática a historia clínica electrónica | CRÍTICA |
| ADM.2.13 | Facturación inmediata al finalizar | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_urgencias_episodios
hosix_urgencias_triage
hosix_urgencias_atenciones
hosix_urgencias_pruebas
hosix_urgencias_pertenencias
hosix_urgencias_documentos
```

### 4.3 Sistema de Citas y Agendas (Módulo 3.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ADM.3.1 | Definición de agendas por servicio, médico y sala | CRÍTICA |
| ADM.3.2 | Definición de períodos hábiles (días, horarios) | ALTA |
| ADM.3.3 | Duración estimada por actividad para evitar saturación | ALTA |
| ADM.3.4 | Consideración de festividades del territorio | ALTA |
| ADM.3.5 | Asignación múltiple de citas en una operación | MEDIA |
| ADM.3.6 | Excepciones para citas de urgencia | ALTA |
| ADM.3.7 | Estados de cita con motivos de cancelación | ALTA |
| ADM.3.8 | Plantillas de preparación imprimibles por actividad | MEDIA |
| ADM.3.9 | Generación de listados de trabajo diarios | ALTA |
| ADM.3.10 | Avisos y recordatorios (email/SMS) | MEDIA |
| ADM.3.11 | Sistema de listas de espera con eliminación automática | ALTA |
| ADM.3.12 | Impresión de justificante de cita | ALTA |
| ADM.3.13 | Bloqueo temporal de agenda con reprogramación asistida | ALTA |
| ADM.3.14 | Facturación automática al finalizar consulta | ALTA |
| ADM.3.15 | Informes de consulta con modelos predefinidos | ALTA |
| ADM.3.16 | Listados estadísticos (solicitadas, pendientes, completadas, canceladas) | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_agendas
hosix_agendas_horarios
hosix_agendas_festividades
hosix_citas
hosix_citas_estados
hosix_citas_actividades
hosix_citas_plantillas_preparacion
hosix_lista_espera_citas
```

### 4.4 Lista de Espera (Módulo 4.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ADM.4.1 | Administración de solicitudes de inclusión/salida | ALTA |
| ADM.4.2 | Tipos: Hospitalización, Consultas ambulatorias, Exámenes diagnóstico, Cirugía con hospitalización, Cirugía mayor ambulatoria, Cirugía menor ambulatoria | ALTA |
| ADM.4.3 | Gestión por tipo, prioridad, tiempos de espera, motivos | ALTA |
| ADM.4.4 | Procesos automáticos de salida de lista | ALTA |
| ADM.4.5 | Gestión centralizada integrada (citas, quirófanos, preingresos) | ALTA |
| ADM.4.6 | Definición de tipos, prioridades y motivos | ALTA |
| ADM.4.7 | Mantenimiento de lista quirúrgica por prioridades | ALTA |
| ADM.4.8 | Histórico de pacientes en lista de espera | ALTA |
| ADM.4.9 | Estadísticas de evolución y estado | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_lista_espera
hosix_lista_espera_tipos
hosix_lista_espera_prioridades
hosix_lista_espera_motivos
hosix_lista_espera_historico
```

### 4.5 Hospitalización (Módulo 5.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ADM.5.1 | Registro de prehospitalización con reserva de cama | ALTA |
| ADM.5.2 | Registro de inicio de episodio (médico, ubicación, servicio, diagnóstico, duración prevista) | CRÍTICA |
| ADM.5.3 | Impresión de pulsera identificativa | ALTA |
| ADM.5.4 | Gestión eficiente de camas (disponibilidad, bloqueos, reservas) | CRÍTICA |
| ADM.5.5 | Reserva de cama para acompañante | MEDIA |
| ADM.5.6 | Traslados (cama, servicio, cambio de médico) | ALTA |
| ADM.5.7 | Solicitud y gestión de pruebas diagnósticas | ALTA |
| ADM.5.8 | Consultas a especialistas | ALTA |
| ADM.5.9 | Documentos justificativos (presencia, partes acompañante) | MEDIA |
| ADM.5.10 | Asociación automática a HCE | CRÍTICA |
| ADM.5.11 | Generación automática de informe de alta | ALTA |
| ADM.5.12 | Facturación inmediata al alta (estancias, análisis, equipos, medicamentos, exámenes) | ALTA |
| ADM.5.13 | Listados estadísticos (hospitalizaciones, altas, traslados, ocupación, estancia media) | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_hospitalizacion_episodios
hosix_hospitalizacion_prehospitalizacion
hosix_camas
hosix_camas_ubicaciones
hosix_camas_estados
hosix_hospitalizacion_traslados
hosix_hospitalizacion_pruebas
hosix_hospitalizacion_acompanantes
```

### 4.6 Teleconsulta (Módulo 6.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ADM.6.1 | Programación de consultas en modalidad videoconferencia | ALTA |
| ADM.6.2 | Envío de aviso email/SMS con enlace URL | ALTA |
| ADM.6.3 | Indicador de teleconsulta en lista de trabajo | ALTA |
| ADM.6.4 | Indicador de paciente en sala de espera virtual | ALTA |
| ADM.6.5 | Inicio de videollamada desde lista de trabajo | ALTA |
| ADM.6.6 | Acceso de terceras personas (equipo médico, familiares) | MEDIA |
| ADM.6.7 | Capacidad de videoconsultas simultáneas (configurable) | ALTA |
| ADM.6.8 | Calidad de video/audio 720p con ajuste automático | ALTA |
| ADM.6.9 | Aplicación cliente multiplataforma | ALTA |
| ADM.6.10 | Chat y envío de documentos en videoconsulta | MEDIA |

#### Tablas de Base de Datos:
```sql
hosix_teleconsultas
hosix_teleconsultas_salas
hosix_teleconsultas_participantes
hosix_teleconsultas_chat
hosix_teleconsultas_documentos
```

### 4.7 Facturación (Módulo 7.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ADM.7.1 | Facturación por línea o paquete | ALTA |
| ADM.7.2 | Definición de tarifas personalizadas por aseguradora | ALTA |
| ADM.7.3 | Asociación automática de conceptos a cuenta (estancias, exámenes, medicamentos, materiales) | ALTA |
| ADM.7.4 | Creación y mantenimiento de cuenta de facturación | ALTA |
| ADM.7.5 | Generación de facturas e impresión | ALTA |
| ADM.7.6 | Facturación a diferentes compañías/responsables de pago | ALTA |
| ADM.7.7 | Gestión de honorarios médicos (generación, liquidación, retención) | ALTA |
| ADM.7.8 | Generación de remesas de facturación | ALTA |
| ADM.7.9 | Listados estadísticos | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_facturacion_tarifas
hosix_facturacion_cuentas
hosix_facturacion_conceptos
hosix_facturas
hosix_facturas_lineas
hosix_honorarios_medicos
hosix_remesas
```

### 4.8 Cajas (Módulo 8.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ADM.8.1 | Registro de cobros y pagos | ALTA |
| ADM.8.2 | Gestión de turnos de caja | ALTA |
| ADM.8.3 | Múltiples formas de pago | ALTA |
| ADM.8.4 | Emisión de recibos | ALTA |
| ADM.8.5 | Proceso de cierre diario y cuadre | ALTA |
| ADM.8.6 | Arqueo de caja | ALTA |
| ADM.8.7 | Listados estadísticos | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_cajas
hosix_cajas_turnos
hosix_cajas_movimientos
hosix_cajas_formas_pago
hosix_cajas_cierres
hosix_cajas_arqueos
```

### 4.9 Gestión de Recobros (Módulo 9.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ADM.9.1 | Denegación de factura emitida | ALTA |
| ADM.9.2 | Notas de cargo adicional y notas de crédito | ALTA |
| ADM.9.3 | Solicitar servicio por partidas o líneas | ALTA |
| ADM.9.4 | Procesar devoluciones o solicitudes del asegurador | ALTA |
| ADM.9.5 | Proceso de recobro automático (email, portal web) | MEDIA |
| ADM.9.6 | Análisis de morosidad | ALTA |
| ADM.9.7 | Saldos deudores y acreedores | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_recobros
hosix_recobros_notas_cargo
hosix_recobros_notas_credito
hosix_recobros_solicitudes
hosix_recobros_morosidad
```

### 4.10 Suministros (Módulo 10.0) ✅ COMPLETADO

#### Funcionalidades Implementadas ✅:
| ID | Funcionalidad | Prioridad | Estado |
|----|--------------|-----------|--------|
| ADM.10.1 | Registro de artículos con código de barras | ALTA | ✅ |
| ADM.10.2 | Control de unidades por tipo de envase | ALTA | ✅ |
| ADM.10.3 | Definición de familias, grupos y subgrupos | ALTA | ✅ |
| ADM.10.4 | Definición de unidades de dosis | ALTA | ✅ |
| ADM.10.5 | Definición de ubicaciones de almacenamiento | ALTA | ✅ |
| ADM.10.6 | Definición de unidades de compra, unidades de dispensación | ALTA | ✅ |
| ADM.10.7 | Definición de categorías de conceptos facturables | ALTA | ✅ |
| ADM.10.8 | Asociación entre artículo y proveedor | MEDIA | ⏳ |

#### Tablas de Base de Datos Implementadas ✅:
```sql
hosix_articulos                      -- Tabla principal de artículos
hosix_articulos_familias             -- Clasificación: Familias (ej. Medicamentos)
hosix_articulos_grupos               -- Clasificación: Grupos dentro de familia
hosix_articulos_unidades_dosis       -- Unidades de dosificación
hosix_articulos_unidades_compra      -- Unidades para compra (cajas, paquetes)
hosix_articulos_unidades_dispensacion-- Unidades para dispensación
hosix_articulos_ubicaciones          -- Ubicaciones de almacenamiento
hosix_articulos_tipos_envase         -- Tipos de empaque
hosix_articulos_control_envase       -- Control de unidades por envase
```

#### Componentes Implementados ✅:
- `ArticulosManager.tsx` - Gestión CRUD de artículos
- `FamiliasManager.tsx` - Gestión de familias de medicamentos
- `GruposManager.tsx` - Gestión de grupos por familia
- `UnidadesManager.tsx` - Gestión de unidades (dosis, compra, dispensación)
- `UbicacionesManager.tsx` - Gestión de ubicaciones

#### Hook Implementado ✅:
- `useHosixSuministros.ts` - Gestión completa de datos y operaciones CRUD

### 4.11 Gestión de Depósitos/Almacenes (Módulo 11.0) ✅ COMPLETADO

#### Funcionalidades Implementadas ✅:
| ID | Funcionalidad | Prioridad | Estado |
|----|--------------|-----------|--------|
| ADM.11.1 | Gestión de almacenes con depósitos diferenciados | ALTA | ✅ |
| ADM.11.2 | Entradas por órdenes de compra | ALTA | ✅ |
| ADM.11.3 | Entradas por devolución a proveedor | ALTA | ✅ |
| ADM.11.4 | Salidas por devolución a proveedor | ALTA | ✅ |
| ADM.11.5 | Entrada de movimientos entre almacenes | ALTA | ✅ |
| ADM.11.6 | Salidas de movimientos entre almacenes | ALTA | ✅ |
| ADM.11.7 | Salidas directas a centro de coste | ALTA | ✅ |
| ADM.11.8 | Consumo de artículos desde cuenta de paciente | ALTA | ✅ |
| ADM.11.9 | Ajustes de inventario (salidas/entradas) | ALTA | ✅ |
| ADM.11.10 | Operaciones FIFO para caducidad | ALTA | ✅ |
| ADM.11.11 | Generación de órdenes de compra desde necesidades | ALTA | ✅ |
| ADM.11.12 | Cálculo de stock mínimo automático | MEDIA | ✅ |
| ADM.11.13 | Inventario físico con regularización | ALTA | ✅ |

#### Tablas de Base de Datos Implementadas ✅:
```sql
hosix_almacenes                    -- Almacenes principales
hosix_almacenes_depositos          -- Sub-depósitos dentro de almacenes
hosix_stock                        -- Control de stock actual
hosix_stock_lotes                  -- Lotes con caducidad (FIFO)
hosix_stock_movimientos            -- Historial de movimientos
hosix_ordenes_compra               -- Órdenes de compra
hosix_ordenes_compra_lineas        -- Líneas de órdenes
hosix_inventarios                  -- Inventarios físicos
hosix_inventarios_lineas           -- Líneas de inventarios
hosix_centros_coste                -- Centros de coste
```

#### Componentes Implementados ✅:
- `AlmacenesManager.tsx` - Gestión CRUD de almacenes con control de temperatura
- `DepositosManager.tsx` - Gestión de sub-depósitos por almacén
- `StockManager.tsx` - Visualización y monitoreo de stock con alertas
- `MovimientosManager.tsx` - Registro de 8 tipos de movimientos
- `InventarioManager.tsx` - Gestión de inventarios físicos

#### Hook Implementado ✅:
- `useHosixAlmacenes.ts` - Gestión completa de almacenes, stock y movimientos

### 4.12 Compras/Licitaciones (Módulo 12.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ADM.12.1 | Gestión de presupuestos por centro de coste | ALTA |
| ADM.12.2 | Creación de licitaciones con presupuesto y partidas | ALTA |
| ADM.12.3 | Registro de ofertas de proveedores | ALTA |
| ADM.12.4 | Registro de resultado de adjudicación | ALTA |
| ADM.12.5 | Pedidos, órdenes de compra, presupuestos | ALTA |
| ADM.12.6 | Control de límites presupuestarios | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_presupuestos
hosix_licitaciones
hosix_licitaciones_partidas
hosix_licitaciones_ofertas
hosix_adjudicaciones
hosix_pedidos
```

---

## 5. MÓDULOS ASISTENCIALES

### 5.1 Médicos (Módulo 1.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ASIS.1.1 | Asociación de pacientes con médicos (lista de trabajo) | CRÍTICA |
| ASIS.1.2 | Listado de pacientes por tipo de episodio con indicadores visuales | ALTA |
| ASIS.1.3 | Desde lista: citas especialista, pruebas, anotaciones, diagnósticos, tratamientos | ALTA |
| ASIS.1.4 | Diagnósticos y tratamientos estándar CIM10/CIE9 | ALTA |
| ASIS.1.5 | Sistema de asistencia para órdenes médicas | ALTA |
| ASIS.1.6 | Prescripción electrónica (nombre comercial, principio activo, protocolos) | CRÍTICA |
| ASIS.1.7 | Diario clínico de evolución con anotaciones e informes | ALTA |
| ASIS.1.8 | Plantillas de informes con datos precargados | ALTA |
| ASIS.1.9 | Ventana resumen por paciente (antecedentes, alergias, tratamientos, constantes) | ALTA |
| ASIS.1.10 | Sistema de mensajería/interconsultas médicas | ALTA |
| ASIS.1.11 | Asociación automática a HCE | CRÍTICA |
| ASIS.1.12 | Cuestionarios y escalas clínicas (ver lista completa) | ALTA |
| ASIS.1.13 | Gestión de interconsultas hospitalarias | ALTA |
| ASIS.1.14 | Interconexión con módulo de enfermería | ALTA |
| ASIS.1.15 | Mapas dentales pediátricos y adultos | MEDIA |

#### Cuestionarios/Escalas Clínicas Requeridas:
```
- Aldrete - Recuperación tras tratamiento
- Braden Bergstrom - Riesgo úlceras por presión
- CBS - Escala de carga del cuidador
- Duke UNC 11 - Apoyo social percibido
- STAS - Calidad de atención autoevaluada
- Emina - Riesgo úlceras por presión
- Norton - Evaluación riesgo úlcera
- Barthel - Grado de dependencia
- Lawton (hombres/mujeres) - Nivel de dependencia
- Katz - Nivel de dependencia
- SPMSQ-Pfeifer - Evaluación cognitiva
- TIN - Índice de estrés del cuidador
- Zarit - Inventario de cargas
- MNA - Mini Evaluación Nutricional
- MMSE Folstein - Deterioro cognitivo
- GDS Reisberg - Escala de Deterioro Global
- Riesgo social
- PET Wells - Tromboembolismo pulmonar
- TVP Wells - Trombosis venosa profunda
- CGI - Impresión clínica global
- Ramsay - Escala de sedación
- Wong Baker - Dolor pediátrico
- CURB-65 - Mortalidad neumonía
- FINE/PSI - Mortalidad neumonía
- ESR Epworth - Somnolencia
- CAT - Impacto EPOC
- Apgar - Estado salud neonatal
- Tinetti - Marcha y equilibrio
- GCS Glasgow - Nivel de conciencia
- Glasgow pediátrico - Nivel de conciencia
- NIHSS - Gravedad ictus
- NSI - Riesgo nutricional
- Ballard - Maduración neonatal
- CHADS2 - Prevención ACV fibrilación auricular
- CHAD2S2-VASc - Prevención ACV fibrilación auricular
- Apache II - Gravedad pancreatitis aguda
- MEWS - Alerta Temprana Modificado
- VAS - Independencia cuidados personales
- COVID19 - Informe de caso COVID
```

#### Tablas de Base de Datos:
```sql
hosix_medicos_worklist
hosix_diagnosticos
hosix_tratamientos
hosix_prescripciones
hosix_diario_clinico
hosix_interconsultas
hosix_cuestionarios
hosix_cuestionarios_respuestas
hosix_mapas_dentales
```

### 5.2 Enfermería (Módulo 2.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ASIS.2.1 | Worklist: pacientes por área, agrupados por tipo episodio | ALTA |
| ASIS.2.2 | Diario clínico con anotaciones de cuidados | ALTA |
| ASIS.2.3 | Modelos de evolución predefinidos por tipo episodio/departamento | ALTA |
| ASIS.2.4 | Evaluación inicial del paciente | ALTA |
| ASIS.2.5 | Toma de constantes vitales | CRÍTICA |
| ASIS.2.6 | Planificación de cuidados estandarizados | ALTA |
| ASIS.2.7 | Kardex: dispensaciones y cuidados con registro fecha/hora | ALTA |
| ASIS.2.8 | Control del trabajo de unidades de enfermería | ALTA |
| ASIS.2.9 | Informes y listados | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_enfermeria_worklist
hosix_enfermeria_constantes
hosix_enfermeria_cuidados
hosix_enfermeria_planes
hosix_enfermeria_kardex
hosix_enfermeria_evaluaciones
```

### 5.3 Quirófanos (Módulo 3.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ASIS.3.1 | Configuración de quirófanos (asignación, departamento, procedimiento, médico, horario) | ALTA |
| ASIS.3.2 | Programación de quirófano (período, departamento, médico, disponibilidad) | ALTA |
| ASIS.3.3 | Planificación completa de procedimientos técnicos | ALTA |
| ASIS.3.4 | Vinculación de procedimiento a kit quirúrgico | ALTA |
| ASIS.3.5 | Gestión de depósito de kits (dispositivos, medicamentos, instrumentación) | ALTA |
| ASIS.3.6 | Bloqueo de programación si no se cumplen procedimientos previos | ALTA |
| ASIS.3.7 | Registro de actividad durante ejecución | ALTA |
| ASIS.3.8 | Seguimiento del personal participante | ALTA |
| ASIS.3.9 | Inclusión en expediente de toda actividad/informes | ALTA |
| ASIS.3.10 | Gestión de traslados inter/intra servicios | ALTA |
| ASIS.3.11 | Gestión de intervenciones urgentes | ALTA |
| ASIS.3.12 | Reanimación: solicitud procedimientos, prescripción, plan de cuidados | ALTA |
| ASIS.3.13 | Visualización de programaciones (día/semana) | ALTA |
| ASIS.3.14 | Estadísticas y listados | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_quirofanos
hosix_quirofanos_programacion
hosix_quirofanos_intervenciones
hosix_quirofanos_kits
hosix_quirofanos_personal
hosix_quirofanos_recursos
hosix_quirofanos_reanimacion
```

### 5.4 Obstetricia (Módulo 4.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ASIS.4.1 | Seguimiento completo del embarazo (primera consulta hasta parto) | ALTA |
| ASIS.4.2 | Perfiles de usuario por tipo: Ginecólogos, Parteras, Enfermeras, Anestesistas, Pediatras | ALTA |
| ASIS.4.3 | Control gestacional (embarazos previos, estado serológico, antecedentes, exámenes) | ALTA |
| ASIS.4.4 | Registro de auscultaciones y exploración vaginal | ALTA |
| ASIS.4.5 | Bloque funcional de anestesiólogo (antes/después del parto) | ALTA |
| ASIS.4.6 | Partograma gráfico según OMS | CRÍTICA |
| ASIS.4.7 | Registro de: frecuencia fetal, líquido amniótico, dilatación, contracciones, oxitocina, medicamentos, pulso/PA, temperatura, proteína/acetona/volumen | ALTA |
| ASIS.4.8 | Funcionalidades: terapia de fluidos, antes del parto, condiciones de salida, toque vaginal, bienestar fetal, personal involucrado, parto, postparto | ALTA |
| ASIS.4.9 | Creación automática de datos del recién nacido | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_obstetricia_embarazos
hosix_obstetricia_controles
hosix_obstetricia_partogramas
hosix_obstetricia_partos
hosix_obstetricia_recien_nacidos
hosix_obstetricia_anestesia
```

### 5.5 CRED - Crecimiento y Desarrollo (Módulo 5.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ASIS.5.1 | Gestión de visitas del bebé al pediatra y evolución | ALTA |
| ASIS.5.2 | Registro de peso, altura, circunferencia de cabeza | ALTA |
| ASIS.5.3 | Diagnóstico nutricional (Peso/Edad, Altura/Edad, Peso/Altura, IMC/Edad) | ALTA |
| ASIS.5.4 | Gráficas de crecimiento SCORES y OMS | ALTA |
| ASIS.5.5 | Cuestionarios evaluación psicomotora por edad | ALTA |
| ASIS.5.6 | Enlace con datos de parto/nacimiento de Obstetricia | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_cred_visitas
hosix_cred_mediciones
hosix_cred_evaluaciones
hosix_cred_graficas
```

### 5.6 Vacunas (Módulo 6.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ASIS.6.1 | Configuración de calendario vacunal estándar | ALTA |
| ASIS.6.2 | Consulta y registro de administración de vacunas | ALTA |
| ASIS.6.3 | Registro de vacunas fuera del calendario | ALTA |
| ASIS.6.4 | Estado inmune: dosis, edad teórica vs real, cumplimiento de inmunidad | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_vacunas_calendario
hosix_vacunas_administradas
hosix_vacunas_estado_inmune
```

### 5.7 Dietética (Módulo 7.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ASIS.7.1 | Gestión de planes (tipo, configuración menús, asignación a pacientes/acompañantes) | ALTA |
| ASIS.7.2 | Control integral de comidas según prescripción médica | ALTA |
| ASIS.7.3 | Identificación de dietas, suplementos, volúmenes (normales, entéricos) | ALTA |
| ASIS.7.4 | Menús suplementarios para pacientes no hospitalizados | MEDIA |
| ASIS.7.5 | Organización de áreas de distribución | MEDIA |
| ASIS.7.6 | Planificación de dietas por edificio, planta, departamento | ALTA |
| ASIS.7.7 | Estadísticas y listados | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_dietetica_planes
hosix_dietetica_menus
hosix_dietetica_asignaciones
hosix_dietetica_comidas
```

### 5.8 RIS - Sistema de Información Radiológica (Módulo 8.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ASIS.8.1 | Gestión completa de informes con hoja de trabajo | ALTA |
| ASIS.8.2 | Modelos predefinidos de informes | ALTA |
| ASIS.8.3 | Modelos automáticos al confirmar ejecución de examen | ALTA |
| ASIS.8.4 | Control de firma (solo autor puede modificar, firma para publicar) | ALTA |
| ASIS.8.5 | Informe firmado pasa a HCE | ALTA |
| ASIS.8.6 | Editor con inserciones automáticas | ALTA |
| ASIS.8.7 | Plantillas predefinidas por tipo de examen | ALTA |
| ASIS.8.8 | Asociación de modelos con agenda | ALTA |
| ASIS.8.9 | Firma de informes | ALTA |
| ASIS.8.10 | Acceso a informes por servicios | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_ris_informes
hosix_ris_plantillas
hosix_ris_examenes
hosix_ris_firmas
```

### 5.9 Farmacia (Módulo 9.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ASIS.9.1 | Gestión completa de medicamentos y fungibles con control de stock | CRÍTICA |
| ASIS.9.2 | Identificación por código de barras | ALTA |
| ASIS.9.3 | Lectura de código de barras de dispensación | ALTA |
| ASIS.9.4 | Recepción de prescripciones de módulo médico | ALTA |
| ASIS.9.5 | Dispensación de medicamentos en base a prescripciones | ALTA |
| ASIS.9.6 | Sistema de unidosis con preparación y dispensación por paciente | ALTA |
| ASIS.9.7 | Envío de orden de preparación y aviso de disponibilidad | ALTA |
| ASIS.9.8 | Interacción con módulo de suministros | ALTA |
| ASIS.9.9 | Control de caducidades | ALTA |
| ASIS.9.10 | Gestión de stocks | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_farmacia_medicamentos
hosix_farmacia_prescripciones
hosix_farmacia_dispensaciones
hosix_farmacia_unidosis
hosix_farmacia_stock
hosix_farmacia_caducidades
```

### 5.10 Diabetes e Hipertensión Arterial (Módulo 10.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ASIS.10.1 | Consulta: toma de constantes, indicadores, controles adicionales | ALTA |
| ASIS.10.2 | Diabetes: toma de glucemias, visualización histórico de gráficas | ALTA |
| ASIS.10.3 | Diabetes: evaluación de riesgo según protocolo FINDRISC | ALTA |
| ASIS.10.4 | HTA: registro constantes y evaluación de riesgo cardiovascular ASCVD | ALTA |
| ASIS.10.5 | Alarmas por valores anormales | ALTA |
| ASIS.10.6 | Módulo de pie diabético con historia visual | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_diabetes_consultas
hosix_diabetes_glucemias
hosix_diabetes_findrisc
hosix_hta_consultas
hosix_hta_ascvd
hosix_pie_diabetico
```

### 5.11 Informes Dinámicos Departamentales (Módulo 11.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| ASIS.11.1 | Plantillas personalizadas por servicio | ALTA |
| ASIS.11.2 | Listas, textos predefinidos, imágenes con anotaciones | ALTA |
| ASIS.11.3 | Información almacenada individualmente en BBDD para IA/ML | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_informes_plantillas
hosix_informes_campos
hosix_informes_generados
```

---

## 6. MÓDULOS COMPLEMENTARIOS

### 6.1 Laboratorios - Integración (Módulo 1.0)

#### Funcionalidades Requeridas:
| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| COMP.1.1 | Solicitudes de exámenes desde HIS al sistema de laboratorio | ALTA |
| COMP.1.2 | Referencias compartidas para servicios y pacientes | ALTA |
| COMP.1.3 | Vista específica para biólogos con acceso a expediente | ALTA |
| COMP.1.4 | Recepción de resultados en formato estructurado | ALTA |
| COMP.1.5 | Inserción automática en expediente y facturación | ALTA |
| COMP.1.6 | Sistema de notificación de disponibilidad de resultados | ALTA |

#### Tablas de Base de Datos:
```sql
hosix_laboratorio_solicitudes
hosix_laboratorio_examenes
hosix_laboratorio_resultados
hosix_laboratorio_notificaciones
```

### 6.2 PACS - Integración con BINARIOS (Módulo 2.0)

> Integración con sistemas externos de almacenamiento de imágenes médicas

### 6.3 PACS - Integración con HOSIX (Módulo 3.0)

> Integración interna de imágenes médicas con el sistema HIS

### 6.4 Comunicación Equipos Monitorización Telemática - Integración JITSI (Módulo 4.0)

> Integración para teleconsulta y monitorización remota

---

## 7. SISTEMA BI - BUSINESS INTELLIGENCE

### 7.1 Reportes de Portada

| Reporte | Descripción |
|---------|-------------|
| TotalIngresos | Número total de hospitalizaciones y traslados por año |
| TotalUrgencias | Número total de episodios de emergencia por año |
| PresionUrgencias | Episodios de emergencia que conducen a hospitalización |
| ConsultasExternas | Total de citas con origen externo |
| Exams | Número total de citas programadas por año para consultas seleccionadas |
| TotalCitasRealizadas | Número total de citas realizadas en los últimos 3 años |
| ExamenesTotal | Número total de citas programadas por año |
| TotalEjecuciones | Número de ejecuciones realizadas por año |

### 7.2 Reportes de Actividad Global

| Reporte | Descripción |
|---------|-------------|
| TotalActividadGlobal | Actos clínicos por año/mes, clasificados por tipo de episodio |
| NumPacientes | Pacientes distintos por año, mes y tipo de episodio |
| PorcentajeTipoEpisodio | Porcentaje de actividades por tipo sobre el total |

### 7.3 Reportes de Citas

| Reporte | Descripción |
|---------|-------------|
| TotalCitas | Número total de citas realizadas por mes y año |
| ConsultasPorProcedencia | Citas por origen de solicitud y consulta |
| ListaEspera | Promedio de días de retraso por tipo de origen |
| ConsultasPorAseguradora | Citas por seguro, año y mes |
| CitasExternas | Citas programadas por año, trimestre, mes, departamento |
| CitasResumenTiempos | Relación entre citas, días de retraso solicitud-asignación |

### 7.4 Reportes de Cobros

| Reporte | Descripción |
|---------|-------------|
| FactPorFormaPago | Importes facturados por año, forma/medio de pago, aseguradora |
| EstadoPorAseg | Importe total de cobros por año, aseguradora y estado |

### 7.5 Reportes de Estancias

| Reporte | Descripción |
|---------|-------------|
| NumEstancias | Número y total de horas de hospitalización |
| EstanciaMedia | Promedio de días de estancia por episodio |
| EstanciaMediaPorServicio | Promedio de días por servicio |
| TasaDeOcupacion | Tasa de ocupación de camas activas |
| EstanciaPorDisciplina | Tasa de ocupación por tipo de cama |
| EstanciaTasaRotacion | Camas activas, episodios, traslados y tasa de rotación |
| NumEstanciasServicioDia | Pacientes admitidos diariamente por departamento |
| CamasActivas | Número de camas activas por día |

### 7.6 Reportes de Facturación

| Reporte | Descripción |
|---------|-------------|
| TotalFacturadoCia | Importe total facturado por seguros |
| FacturacionPorCentroCoste | Importe total por centro de coste |
| FacturacionAgrupadoresConceptos | Importe total por grupo y centro de coste |
| TotalFacturadoServicioEpisodio | Monto total por servicio y tipo de episodio |

### 7.7 Reportes de Honorarios Médicos

| Reporte | Descripción |
|---------|-------------|
| TotalHonorarios | Cantidad total de honorarios y retenciones |
| EstadoHonorarios | Honorarios generados por mes y año |
| HonorariosLiquidados | Tarifas liquidadas por mes y año |
| HonorariosPorProfesional | Honorarios brutos por profesional |
| HonorariosPorAseguradora | Honorarios por compañía de seguros |
| HonorariosPendLiquidar | Tarifas pendientes de pago por médico |
| HonorariosPorEstado | Comisiones cobradas, liquidadas y suma |

### 7.8 Reportes de Ingresos

| Reporte | Descripción |
|---------|-------------|
| TotalIngresos | Episodios de ingreso y transferencia |
| IngresosPorProcedencia | Hospitalizaciones por tipo de origen |
| PresionUrgencias | Porcentaje hospitalizaciones desde urgencias |
| IngresosPorDiagnostico | Hospitalizaciones por diagnóstico |
| Traslados | Transferencias de servicios |
| NumAltasPorTipoSalida | Egresos por tipo de alta |
| IngresosPorAseguradora | Hospitalizaciones por compañía de seguros |
| TiempoEsperaIngresos | Diferencia prehospitalario-hospitalización |
| TasaMortalidad | Muertes y tasa de mortalidad |

### 7.9 Reportes de Laboratorio

| Reporte | Descripción |
|---------|-------------|
| TotalPeticiones | Solicitudes de laboratorio recibidas |
| PruebasLab | Pruebas por grupo y tipo de solicitud |
| NumGermenesDetectados | Gérmenes detectados por familia |
| OrigenPeticionesLab | Solicitudes por origen |
| DemoraPruebas | Horas de diferencia recepción-validación |
| NumPerfilesAntibAplicados | Gérmenes y perfiles antibióticos aplicados |
| SensibilidadAntibioticos | Porcentaje de sensibilidad por antibiótico |

### 7.10 Reportes de Consumo

| Reporte | Descripción |
|---------|-------------|
| TotalConsumos | Cantidad total de artículos en cuentas de pacientes |
| ConsumosPorArticulo | Cantidad por familias, grupos y artículos |
| ConsumosPorAseguradora | Cantidad por aseguradora |

### 7.11 Reportes de Partos

| Reporte | Descripción |
|---------|-------------|
| TotalPartos | Número de partos por año y mes |
| PartosPorTipo | Partos por tipo |
| MortalidadFetal | Nacimientos, muertes neonatales y tasa |
| MortalidadMaternal | Muertes maternas y tasa |

### 7.12 Reportes de Compras

| Reporte | Descripción |
|---------|-------------|
| ComprasTotal | Unidades y cantidad en órdenes de compra |
| PedidosAProv | Material por proveedor, familia, grupo, artículo |

### 7.13 Reportes de Prescripción

| Reporte | Descripción |
|---------|-------------|
| TotalPrescripcion | Episodios con prescripción y total prescripciones |
| PrescripDispen | Prescripciones vs dispensaciones |
| PrescripEpisodio | Prescripciones por tipo de episodio |
| ArtDispensados | Artículos dispensados |

### 7.14 Reportes de Quirófanos

| Reporte | Descripción |
|---------|-------------|
| TotalEjecuciones | Cirugías realizadas incluyendo canceladas |
| EjecProgUrg | Años a mostrar en informe |
| IntervenTipo | Procedimientos por tipo de intervención |
| IntervenProc | Procedimientos más frecuentes |
| IntervenAnes | Cirugías por tipo de anestesia |
| IntervenSDP | Cirugías por departamento, servicio, diagnóstico |
| IntervenCancel | Cirugías canceladas por motivo |

### 7.15 Reportes de Rendimiento en Quirófano

| Reporte | Descripción |
|---------|-------------|
| AsignacionQuirofanos | Horas disponibles vs programadas |
| UtilizacionQuirofanos | Horas utilizadas y porcentaje |
| RendimientoQuir | Horas de trabajo y porcentaje de uso |
| IntervProg | Procedimientos programados |
| IntervProgCan | Intervenciones canceladas |

### 7.16 Reportes de Urgencias

| Reporte | Descripción |
|---------|-------------|
| TotalUrgencias | Episodios de emergencia cerrados |
| UrgenciasPorSexo | Urgencias por sexo del paciente |
| UrgenciasPorTipo | Urgencias por tipo |
| UrgenciasPorServDiag | Urgencias por servicio de alta y diagnóstico |

---

## 8. DISEÑO DE BASE DE DATOS

### 8.1 Esquema de Tablas Principal

```sql
-- ====================================
-- HOSIX - SISTEMA DE GESTIÓN HOSPITALARIA
-- Diseño de Base de Datos Completo
-- ====================================

-- ===========================================
-- SECCIÓN 1: CONFIGURACIÓN Y PARAMETRIZACIÓN
-- ===========================================

-- Maestros Generales
CREATE TABLE hosix_departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  centro_salud_id UUID REFERENCES centros_salud(id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  departamento_id UUID REFERENCES hosix_departamentos(id),
  tipo_servicio VARCHAR(50),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Usuarios y Seguridad
CREATE TABLE hosix_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  perfil_id UUID REFERENCES hosix_perfiles(id),
  centro_salud_id UUID REFERENCES centros_salud(id),
  activo BOOLEAN DEFAULT true,
  ultimo_acceso TIMESTAMPTZ,
  intentos_fallidos INT DEFAULT 0,
  bloqueado_hasta TIMESTAMPTZ,
  cambio_password_requerido BOOLEAN DEFAULT false,
  password_expira TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_perfiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  nivel_acceso INT DEFAULT 1,
  permisos JSONB DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES hosix_usuarios(id),
  accion VARCHAR(100) NOT NULL,
  tabla_afectada VARCHAR(100),
  registro_id UUID,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- SECCIÓN 2: PACIENTES Y HISTORIA CLÍNICA
-- ===========================================

CREATE TABLE hosix_pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ppi VARCHAR(20) UNIQUE NOT NULL,  -- Identificador único del paciente
  
  -- Datos personales
  primer_nombre VARCHAR(100) NOT NULL,
  segundo_nombre VARCHAR(100),
  primer_apellido VARCHAR(100) NOT NULL,
  segundo_apellido VARCHAR(100),
  fecha_nacimiento DATE NOT NULL,
  sexo VARCHAR(10) NOT NULL,
  
  -- Documentos de identidad
  tipo_documento VARCHAR(50),
  numero_documento VARCHAR(50),
  pais_documento VARCHAR(100),
  
  -- Contacto
  direccion TEXT,
  ciudad VARCHAR(100),
  provincia VARCHAR(100),
  codigo_postal VARCHAR(20),
  telefono_fijo VARCHAR(20),
  telefono_movil VARCHAR(20),
  email VARCHAR(255),
  
  -- Datos médicos básicos
  grupo_sanguineo VARCHAR(5),
  alergias JSONB DEFAULT '[]',
  antecedentes_familiares JSONB DEFAULT '[]',
  antecedentes_personales JSONB DEFAULT '[]',
  
  -- Aseguradora
  aseguradora_principal_id UUID,
  numero_poliza VARCHAR(50),
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  fallecido BOOLEAN DEFAULT false,
  fecha_fallecimiento DATE,
  
  -- Metadatos
  centro_registro_id UUID REFERENCES centros_salud(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_historia_clinica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  tipo_entrada VARCHAR(50) NOT NULL, -- consulta, urgencia, hospitalizacion, etc.
  episodio_id UUID,
  fecha_entrada TIMESTAMPTZ NOT NULL,
  
  -- Contenido
  titulo VARCHAR(255),
  contenido TEXT,
  datos_estructurados JSONB DEFAULT '{}',
  
  -- Profesional
  profesional_id UUID REFERENCES profesionales_sanitarios(id),
  servicio_id UUID REFERENCES hosix_servicios(id),
  
  -- Archivos adjuntos
  adjuntos JSONB DEFAULT '[]',
  
  -- Estado
  firmado BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  confidencial BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- SECCIÓN 3: URGENCIAS
-- ===========================================

CREATE TABLE hosix_urgencias_episodios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  
  -- Entrada
  fecha_entrada TIMESTAMPTZ NOT NULL,
  lugar_entrada VARCHAR(100),
  procedencia VARCHAR(100),
  box_asignado VARCHAR(50),
  
  -- Triage
  nivel_triage INT, -- 1-5
  clasificacion_inicial TEXT,
  observaciones_triage TEXT,
  
  -- Atención
  medico_responsable_id UUID REFERENCES profesionales_sanitarios(id),
  diagnostico_inicial TEXT,
  diagnostico_final TEXT,
  
  -- Salida
  fecha_salida TIMESTAMPTZ,
  tipo_salida VARCHAR(50), -- alta, ingreso, traslado, defuncion
  destino_salida VARCHAR(255),
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'en_proceso', -- en_proceso, cerrado
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_urgencias_triage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episodio_id UUID REFERENCES hosix_urgencias_episodios(id) NOT NULL,
  fecha_evaluacion TIMESTAMPTZ NOT NULL,
  evaluador_id UUID REFERENCES profesionales_sanitarios(id),
  
  nivel_urgencia INT NOT NULL, -- 1-5
  motivo_consulta TEXT,
  signos_vitales JSONB,
  sintomas JSONB,
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- SECCIÓN 4: CITAS Y AGENDAS
-- ===========================================

CREATE TABLE hosix_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  
  servicio_id UUID REFERENCES hosix_servicios(id),
  profesional_id UUID REFERENCES profesionales_sanitarios(id),
  sala VARCHAR(100),
  
  tipo_agenda VARCHAR(50), -- consulta, procedimiento, teleconsulta
  duracion_default_minutos INT DEFAULT 15,
  capacidad_maxima_dia INT,
  
  permite_teleconsulta BOOLEAN DEFAULT false,
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_agendas_horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id UUID REFERENCES hosix_agendas(id) NOT NULL,
  dia_semana INT NOT NULL, -- 0-6 (Domingo-Sábado)
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  activo BOOLEAN DEFAULT true
);

CREATE TABLE hosix_citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id UUID REFERENCES hosix_agendas(id) NOT NULL,
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  
  fecha_hora TIMESTAMPTZ NOT NULL,
  duracion_minutos INT NOT NULL,
  
  actividad_id UUID,
  motivo TEXT,
  
  estado VARCHAR(50) DEFAULT 'programada', -- programada, confirmada, en_proceso, completada, cancelada, no_asistio
  motivo_cancelacion TEXT,
  
  es_teleconsulta BOOLEAN DEFAULT false,
  url_teleconsulta TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- SECCIÓN 5: HOSPITALIZACIÓN
-- ===========================================

CREATE TABLE hosix_camas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100),
  
  servicio_id UUID REFERENCES hosix_servicios(id),
  ubicacion VARCHAR(255), -- edificio, planta, habitación
  tipo_cama VARCHAR(50),
  
  estado VARCHAR(50) DEFAULT 'disponible', -- disponible, ocupada, mantenimiento, reservada
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_hospitalizacion_episodios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  
  -- Ingreso
  fecha_ingreso TIMESTAMPTZ NOT NULL,
  origen_ingreso VARCHAR(100), -- urgencias, programado, traslado
  diagnostico_ingreso TEXT,
  medico_responsable_id UUID REFERENCES profesionales_sanitarios(id),
  servicio_id UUID REFERENCES hosix_servicios(id),
  cama_id UUID REFERENCES hosix_camas(id),
  
  -- Duración estimada
  duracion_prevista_dias INT,
  
  -- Alta
  fecha_alta TIMESTAMPTZ,
  tipo_alta VARCHAR(50), -- domicilio, traslado, defuncion, voluntaria
  diagnostico_alta TEXT,
  informe_alta TEXT,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'activo', -- prehospitalizacion, activo, alta
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- SECCIÓN 6: QUIRÓFANOS
-- ===========================================

CREATE TABLE hosix_quirofanos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  
  area_quirurgica VARCHAR(100),
  tipo_quirofano VARCHAR(50),
  especialidades JSONB DEFAULT '[]',
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_quirofanos_intervenciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quirofano_id UUID REFERENCES hosix_quirofanos(id) NOT NULL,
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  
  -- Programación
  fecha_programada TIMESTAMPTZ NOT NULL,
  hora_inicio_estimada TIME,
  duracion_estimada_minutos INT,
  
  -- Procedimiento
  procedimiento_principal TEXT NOT NULL,
  procedimientos_secundarios JSONB DEFAULT '[]',
  tipo_intervencion VARCHAR(50), -- programada, urgente
  tipo_anestesia VARCHAR(50),
  
  -- Equipo
  cirujano_principal_id UUID REFERENCES profesionales_sanitarios(id),
  equipo_medico JSONB DEFAULT '[]', -- [{profesional_id, rol}]
  
  -- Ejecución
  fecha_inicio_real TIMESTAMPTZ,
  fecha_fin_real TIMESTAMPTZ,
  
  -- Resultado
  estado VARCHAR(50) DEFAULT 'programada', -- programada, en_proceso, completada, cancelada
  motivo_cancelacion TEXT,
  complicaciones JSONB DEFAULT '[]',
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- SECCIÓN 7: FARMACIA Y PRESCRIPCIÓN
-- ===========================================

CREATE TABLE hosix_medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  codigo_barras VARCHAR(100),
  
  nombre_comercial VARCHAR(255) NOT NULL,
  principio_activo VARCHAR(255),
  presentacion VARCHAR(255),
  concentracion VARCHAR(100),
  forma_farmaceutica VARCHAR(100),
  via_administracion VARCHAR(100),
  
  familia VARCHAR(100),
  grupo VARCHAR(100),
  
  requiere_receta BOOLEAN DEFAULT true,
  controlado BOOLEAN DEFAULT false,
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_prescripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  
  medicamento_id UUID REFERENCES hosix_medicamentos(id),
  medicamento_texto VARCHAR(255), -- por si no está en catálogo
  
  dosis VARCHAR(100),
  frecuencia VARCHAR(100),
  via_administracion VARCHAR(100),
  duracion_dias INT,
  instrucciones TEXT,
  
  prescriptor_id UUID REFERENCES profesionales_sanitarios(id) NOT NULL,
  fecha_prescripcion TIMESTAMPTZ NOT NULL,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  
  estado VARCHAR(50) DEFAULT 'activa', -- activa, suspendida, completada
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_dispensaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescripcion_id UUID REFERENCES hosix_prescripciones(id) NOT NULL,
  
  cantidad_dispensada DECIMAL(10,2),
  unidad VARCHAR(50),
  lote VARCHAR(100),
  fecha_caducidad DATE,
  
  dispensador_id UUID REFERENCES profesionales_sanitarios(id),
  fecha_dispensacion TIMESTAMPTZ NOT NULL,
  
  confirmado_por UUID REFERENCES profesionales_sanitarios(id),
  fecha_confirmacion TIMESTAMPTZ,
  
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- SECCIÓN 8: FACTURACIÓN
-- ===========================================

CREATE TABLE hosix_aseguradoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50), -- publica, privada
  direccion TEXT,
  telefono VARCHAR(50),
  email VARCHAR(255),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_tarifas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aseguradora_id UUID REFERENCES hosix_aseguradoras(id),
  codigo_concepto VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  vigente_desde DATE NOT NULL,
  vigente_hasta DATE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_factura VARCHAR(50) UNIQUE NOT NULL,
  
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  aseguradora_id UUID REFERENCES hosix_aseguradoras(id),
  
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE,
  
  subtotal DECIMAL(12,2) NOT NULL,
  descuentos DECIMAL(12,2) DEFAULT 0,
  impuestos DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  
  estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, pagada, parcial, anulada
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_facturas_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID REFERENCES hosix_facturas(id) NOT NULL,
  
  concepto VARCHAR(255) NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  descuento DECIMAL(12,2) DEFAULT 0,
  total_linea DECIMAL(12,2) NOT NULL,
  
  episodio_id UUID,
  referencia_origen VARCHAR(255), -- id del servicio/medicamento/etc que genera la línea
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para optimización
CREATE INDEX idx_hosix_pacientes_ppi ON hosix_pacientes(ppi);
CREATE INDEX idx_hosix_pacientes_documento ON hosix_pacientes(tipo_documento, numero_documento);
CREATE INDEX idx_hosix_historia_paciente ON hosix_historia_clinica(paciente_id, fecha_entrada DESC);
CREATE INDEX idx_hosix_citas_agenda_fecha ON hosix_citas(agenda_id, fecha_hora);
CREATE INDEX idx_hosix_citas_paciente ON hosix_citas(paciente_id);
CREATE INDEX idx_hosix_hospitalizacion_paciente ON hosix_hospitalizacion_episodios(paciente_id);
CREATE INDEX idx_hosix_prescripciones_paciente ON hosix_prescripciones(paciente_id);
```

---

## 9. PLAN DE IMPLEMENTACIÓN

### 9.1 Fases de Desarrollo

| Fase | Módulos | Duración Estimada | Prioridad |
|------|---------|-------------------|-----------|
| **Fase 1** | Configuración base, Usuarios/Seguridad, Pacientes, HCE | 4-6 semanas | CRÍTICA |
| **Fase 2** | Urgencias, Citas/Agendas, Lista de espera | 4-6 semanas | ALTA |
| **Fase 3** | Hospitalización, Quirófanos | 4-6 semanas | ALTA |
| **Fase 4** | Médicos, Enfermería | 4-6 semanas | ALTA |
| **Fase 5** | Farmacia, Prescripción | 3-4 semanas | ALTA |
| **Fase 6** | Facturación, Cajas, Recobros | 4-6 semanas | ALTA |
| **Fase 7** | Obstetricia, CRED, Vacunas | 3-4 semanas | MEDIA |
| **Fase 8** | Suministros, Almacenes, Compras | 3-4 semanas | MEDIA |
| **Fase 9** | Dietética, RIS, Diabetes/HTA | 3-4 semanas | MEDIA |
| **Fase 10** | Teleconsulta, Portal Web | 3-4 semanas | MEDIA |
| **Fase 11** | Integraciones (Laboratorio, PACS) | 4-6 semanas | MEDIA |
| **Fase 12** | BI y Reportería | 4-6 semanas | MEDIA |

### 9.2 Estructura de Componentes React

```
src/
├── hosix/
│   ├── components/
│   │   ├── configuracion/
│   │   │   ├── MaestrosGenerales.tsx
│   │   │   ├── MaestrosLocales.tsx
│   │   │   ├── UsuariosPerfiles.tsx
│   │   │   └── Seguridad.tsx
│   │   ├── pacientes/
│   │   │   ├── PacientesList.tsx
│   │   │   ├── PacienteForm.tsx
│   │   │   ├── PacienteDetail.tsx
│   │   │   ├── HistoriaClinica.tsx
│   │   │   └── FusionHistorias.tsx
│   │   ├── urgencias/
│   │   │   ├── UrgenciasDashboard.tsx
│   │   │   ├── Triage.tsx
│   │   │   ├── AtencionUrgencia.tsx
│   │   │   └── AltaUrgencia.tsx
│   │   ├── citas/
│   │   │   ├── Agendas.tsx
│   │   │   ├── CitasCalendario.tsx
│   │   │   ├── NuevaCita.tsx
│   │   │   └── ListaEspera.tsx
│   │   ├── hospitalizacion/
│   │   │   ├── HospitalizacionDashboard.tsx
│   │   │   ├── GestionCamas.tsx
│   │   │   ├── IngresoEpisodio.tsx
│   │   │   └── AltaEpisodio.tsx
│   │   ├── quirofanos/
│   │   │   ├── QuirofanosDashboard.tsx
│   │   │   ├── ProgramacionQuirofano.tsx
│   │   │   ├── EjecucionIntervencion.tsx
│   │   │   └── KitsQuirurgicos.tsx
│   │   ├── medicos/
│   │   │   ├── WorklistMedico.tsx
│   │   │   ├── ConsultaMedica.tsx
│   │   │   ├── Prescripcion.tsx
│   │   │   ├── DiarioClinico.tsx
│   │   │   └── Interconsultas.tsx
│   │   ├── enfermeria/
│   │   │   ├── WorklistEnfermeria.tsx
│   │   │   ├── ConstantesVitales.tsx
│   │   │   ├── Kardex.tsx
│   │   │   └── PlanesCuidado.tsx
│   │   ├── farmacia/
│   │   │   ├── FarmaciaDashboard.tsx
│   │   │   ├── Dispensacion.tsx
│   │   │   ├── Unidosis.tsx
│   │   │   └── GestionStock.tsx
│   │   ├── facturacion/
│   │   │   ├── FacturacionDashboard.tsx
│   │   │   ├── CuentaPaciente.tsx
│   │   │   ├── GenerarFactura.tsx
│   │   │   └── Honorarios.tsx
│   │   ├── bi/
│   │   │   ├── BIDashboard.tsx
│   │   │   ├── ReportesPortada.tsx
│   │   │   ├── ReportesActividad.tsx
│   │   │   └── ... (más reportes)
│   │   └── shared/
│   │       ├── PacienteSelector.tsx
│   │       ├── DiagnosticoSelector.tsx
│   │       ├── MedicamentoSelector.tsx
│   │       └── ImpresionPulsera.tsx
│   ├── hooks/
│   │   ├── usePacientes.ts
│   │   ├── useHistoriaClinica.ts
│   │   ├── useUrgencias.ts
│   │   ├── useCitas.ts
│   │   ├── useHospitalizacion.ts
│   │   ├── useQuirofanos.ts
│   │   ├── usePrescripciones.ts
│   │   ├── useFacturacion.ts
│   │   └── useBI.ts
│   ├── stores/
│   │   ├── hosixStore.ts
│   │   ├── pacientesStore.ts
│   │   └── sesionClnicaStore.ts
│   ├── types/
│   │   ├── pacientes.ts
│   │   ├── episodios.ts
│   │   ├── citas.ts
│   │   └── facturacion.ts
│   └── pages/
│       ├── HosixDashboard.tsx
│       ├── ConfiguracionPage.tsx
│       ├── PacientesPage.tsx
│       ├── UrgenciasPage.tsx
│       ├── CitasPage.tsx
│       ├── HospitalizacionPage.tsx
│       ├── QuirofanosPage.tsx
│       ├── MedicosPage.tsx
│       ├── EnfermeriaPage.tsx
│       ├── FarmaciaPage.tsx
│       ├── FacturacionPage.tsx
│       └── BIPage.tsx
```

---

## 10. INTEGRACIÓN CON SISTEMA ACTUAL

### 10.1 Puntos de Integración

```typescript
// Integración con el sistema actual de profesionales/centros

// 1. Compartir autenticación (Supabase Auth)
// El sistema HOSIX utilizará el mismo sistema de autenticación

// 2. Compartir datos de centros de salud
// La tabla centros_salud existente se reutiliza

// 3. Compartir datos de profesionales
// La tabla profesionales_sanitarios existente se reutiliza

// 4. Nuevos roles específicos HOSIX
const HOSIX_ROLES = [
  'HOSIX_ADMIN',           // Administrador del sistema HOSIX
  'HOSIX_MEDICO',          // Médico
  'HOSIX_ENFERMERA',       // Enfermera
  'HOSIX_ADMINISTRATIVO',  // Personal administrativo
  'HOSIX_FARMACIA',        // Farmacéutico
  'HOSIX_LABORATORIO',     // Personal de laboratorio
  'HOSIX_FACTURACION',     // Personal de facturación
  'HOSIX_RECEPCION',       // Recepcionista
];
```

### 10.2 Modificación de Página Principal

```tsx
// Index.tsx - Añadir botón de acceso a HOSIX
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <Card className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => navigate('/admin')}>
    <CardHeader>
      <CardTitle>Dashboard Profesionales Sanitarios</CardTitle>
      <CardDescription>
        Gestión de profesionales y centros sanitarios
      </CardDescription>
    </CardHeader>
  </Card>
  
  <Card className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => navigate('/hosix')}>
    <CardHeader>
      <CardTitle>Dashboard Gestión Hospitalaria (HOSIX)</CardTitle>
      <CardDescription>
        Sistema integral de gestión hospitalaria nacional
      </CardDescription>
    </CardHeader>
  </Card>
</div>
```

---

## 📊 RESUMEN DE CONTEO

| Categoría | Cantidad |
|-----------|----------|
| **Módulos Totales** | 34 |
| **Funcionalidades Totales** | ~250+ |
| **Tablas de Base de Datos** | ~80+ |
| **Reportes BI** | ~60 |
| **Cuestionarios/Escalas Clínicas** | 40+ |

---

## ✅ CHECKLIST DE COMPLETITUD

- [x] Módulos de Configuración y Parametrización (7/7)
- [x] Módulos Administrativos (12/12)
- [x] Módulos Asistenciales (11/11)
- [x] Módulos Complementarios (4/4)
- [x] Sistema BI completo con todos los reportes
- [x] Diseño de base de datos
- [x] Plan de implementación por fases
- [x] Estructura de componentes React
- [x] Integración con sistema actual

---

**Documento generado para el proyecto HOSIX - GEPROSTEC**  
**Todas las funcionalidades del Excel han sido incluidas sin omisiones**
