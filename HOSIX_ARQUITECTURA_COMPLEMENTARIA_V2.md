# HOSIX - Arquitectura Complementaria v2.0
## Módulos de Enfermería y Admisión Central

> **Versión**: 2.0
> **Fecha**: 2025-02-05
> **Estado**: PENDIENTE DE IMPLEMENTACIÓN
> **Prioridad**: ALTA (Módulos críticos para flujo clínico completo)

---

## 📊 ESTADO ACTUAL DEL PROYECTO

### Fases Completadas
| Fase | Estado | Progreso |
|------|--------|----------|
| FASE 1 - Infraestructura Base | ✅ COMPLETADA | 100% |
| FASE 2 - Módulos Administrativos (ADM 1.0-12.0) | ⏳ 95% | 11/12 módulos |

### Problema Pendiente: Migración ADM 11.0 (Almacenes)
```
ERROR: 42P17: generation expression is not immutable
```
**Causa**: `CURRENT_DATE` en columna `GENERATED ALWAYS AS STORED`
**Solución**: Ver `HOSIX_CORRECCION_ALMACENES_SQL.md`

---

## 🩺 MÓDULOS COMPLEMENTARIOS DE ENFERMERÍA (ASIS. 2.0)

### 1. ARQUITECTURA GENERAL

| ID | Nombre | Descripción |
|----|--------|-------------|
| ASIS. 2.0 | Enfermería: Gestión de Cuidados y Documentación | Plataforma centralizada para ejecución de órdenes médicas, registro de signos vitales, planificación de cuidados y trazabilidad de insumos/medicamentos |

---

### 2. GESTIÓN DE ÓRDENES Y TAREAS

#### ASIS. 2.1 - Worklist de Órdenes
| Funcionalidad | Prioridad | Estado |
|--------------|-----------|--------|
| Tablero de tareas en tiempo real | CRÍTICA | ⏳ |
| Órdenes médicas pendientes (medicamentos, pruebas, procedimientos) | CRÍTICA | ⏳ |
| Filtrado por paciente, turno y prioridad | ALTA | ⏳ |
| Codificación por color según urgencia | ALTA | ⏳ |

```sql
-- Tablas propuestas
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
```

#### ASIS. 2.2 - Administración de Medicamentos (Dispensario)
| Funcionalidad | Prioridad | Estado |
|--------------|-----------|--------|
| Registro de hora exacta de dispensación | CRÍTICA | ⏳ |
| Lectura código de barras paciente/medicamento | ALTA | ⏳ |
| Verificación "5 Correctas" (Paciente, Medicamento, Dosis, Vía, Hora) | CRÍTICA | ⏳ |
| Trazabilidad y observaciones | ALTA | ⏳ |
| Registro de eventos adversos | ALTA | ⏳ |

```sql
CREATE TABLE hosix_enfermeria_administracion_medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescripcion_id UUID REFERENCES hosix_prescripciones(id) NOT NULL,
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
```

#### ASIS. 2.3 - Ejecución de Órdenes No Farmacológicas
| Funcionalidad | Prioridad | Estado |
|--------------|-----------|--------|
| Cambio de vendajes | ALTA | ⏳ |
| Traslados | ALTA | ⏳ |
| Preparación pre-quirúrgica | ALTA | ⏳ |
| Procedimientos de enfermería (sondas, catéteres) | ALTA | ⏳ |

```sql
CREATE TABLE hosix_enfermeria_procedimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  orden_id UUID REFERENCES hosix_enfermeria_worklist_ordenes(id),
  
  tipo_procedimiento VARCHAR(100) NOT NULL,
  descripcion TEXT,
  
  -- Ejecución
  fecha_ejecucion TIMESTAMPTZ NOT NULL,
  enfermero_id UUID REFERENCES profesionales_sanitarios(id) NOT NULL,
  duracion_minutos INT,
  
  -- Materiales utilizados
  materiales_utilizados JSONB DEFAULT '[]',
  
  -- Resultados
  resultado TEXT,
  complicaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 3. DOCUMENTACIÓN DE CUIDADOS CLÍNICOS

#### ASIS. 2.4 - Registro de Constantes (Signos Vitales)
| Funcionalidad | Prioridad | Estado |
|--------------|-----------|--------|
| Entrada rápida optimizada | CRÍTICA | ⏳ |
| Temperatura, Pulso, PA, SpO2, Dolor (VAS) | CRÍTICA | ⏳ |
| Gráficos de tendencia automáticos | ALTA | ⏳ |
| Alertas de valores críticos | CRÍTICA | ⏳ |

```sql
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

-- Índices para gráficos de tendencia
CREATE INDEX idx_signos_vitales_paciente_fecha 
ON hosix_enfermeria_signos_vitales(paciente_id, fecha_toma DESC);
```

#### ASIS. 2.5 - Balance Hídrico (Ingresos/Egresos)
| Funcionalidad | Prioridad | Estado |
|--------------|-----------|--------|
| Líquidos administrados (IV, orales) | ALTA | ⏳ |
| Líquidos eliminados (orina, drenajes) | ALTA | ⏳ |
| Balance automático | ALTA | ⏳ |

```sql
CREATE TABLE hosix_enfermeria_balance_hidrico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  fecha DATE NOT NULL,
  
  -- Ingresos
  ingreso_oral_ml INT DEFAULT 0,
  ingreso_iv_ml INT DEFAULT 0,
  ingreso_sng_ml INT DEFAULT 0, -- Sonda nasogástrica
  otros_ingresos_ml INT DEFAULT 0,
  
  -- Egresos
  egreso_orina_ml INT DEFAULT 0,
  egreso_vomito_ml INT DEFAULT 0,
  egreso_drenaje_ml INT DEFAULT 0,
  egreso_deposiciones_ml INT DEFAULT 0,
  otros_egresos_ml INT DEFAULT 0,
  
  -- Balance calculado (trigger o view)
  balance_total_ml INT,
  
  turno VARCHAR(20), -- mañana, tarde, noche
  enfermero_id UUID REFERENCES profesionales_sanitarios(id),
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### ASIS. 2.6 - Notas de Enfermería
| Funcionalidad | Prioridad | Estado |
|--------------|-----------|--------|
| Plantillas SOAP/SBAR | ALTA | ⏳ |
| Registro de evolución | ALTA | ⏳ |
| Integración NANDA/NIC/NOC | MEDIA | ⏳ |

```sql
CREATE TABLE hosix_enfermeria_notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  
  tipo_nota VARCHAR(50) DEFAULT 'evolucion', -- evolucion, ingreso, egreso, interconsulta
  formato VARCHAR(20) DEFAULT 'soap', -- soap, sbar, narrativo
  
  -- Formato SOAP
  subjetivo TEXT,
  objetivo TEXT,
  analisis TEXT,
  plan TEXT,
  
  -- Formato SBAR (alternativo)
  situacion TEXT,
  antecedentes TEXT,
  evaluacion TEXT,
  recomendacion TEXT,
  
  -- Contenido libre (si narrativo)
  contenido TEXT,
  
  -- Firma
  enfermero_id UUID REFERENCES profesionales_sanitarios(id) NOT NULL,
  firmado BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### ASIS. 2.7 - Valoración de Riesgos
| Funcionalidad | Prioridad | Estado |
|--------------|-----------|--------|
| Escala de Braden (úlceras por presión) | ALTA | ⏳ |
| Escala de Morse (riesgo de caídas) | ALTA | ⏳ |
| Plan de cuidados preventivos automático | ALTA | ⏳ |

```sql
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

### 4. GESTIÓN DE MATERIALES Y LOGÍSTICA

#### ASIS. 2.8 - Solicitud de Insumos y Materiales
| Funcionalidad | Prioridad | Estado |
|--------------|-----------|--------|
| Solicitud desde almacén/farmacia | ALTA | ⏳ |
| Registro a cuenta del paciente | ALTA | ⏳ |
| Registro a centro de costo | ALTA | ⏳ |

#### ASIS. 2.9 - Gestión de Descartables
| Funcionalidad | Prioridad | Estado |
|--------------|-----------|--------|
| Trazabilidad de implantables | ALTA | ⏳ |
| Materiales de alto costo | ALTA | ⏳ |
| Auditoría y facturación | ALTA | ⏳ |

---

## 🏥 MÓDULO ADM. 11.0 - ADMISIÓN CENTRAL Y TRAZABILIDAD

### 1. DESCRIPCIÓN GENERAL

| ID | Nombre | Descripción |
|----|--------|-------------|
| ADM. 11.0 | Admisión Central y Trazabilidad | Punto de entrada unificado para todos los pacientes, gestionando registro, validación, clasificación y asignación inicial de recursos |

---

### 2. FUNCIONALIDADES

| ID | Nombre | Detalle | Integración |
|----|--------|---------|-------------|
| ADM. 11.1 | Admisión Unificada | Única interfaz para registrar/validar paciente para Consulta Externa, Urgencias u Hospitalización | ADM.1.1 (Datos Paciente) |
| ADM. 11.2 | Clasificación de Servicio | Asignación automática del flujo (Urgencias → Triage; Externa → Agenda) | ADM.3.0 (Agendas) |
| ADM. 11.3 | Alerta de Sala de Espera | Sistema visual de monitorización de tiempo de espera | ADM.12.0 (Triage), ASIS.12.0 (Alertas) |
| ADM. 11.4 | Asignación de Recursos | Asignación de primer contacto basada en disponibilidad, especialidad y carga de trabajo | ADM.5.4 (Camas), ASIS.1.2 (Worklist) |
| ADM. 11.5 | Registro de Ingreso/Egreso | Formalización del proceso de ingreso a Hospitalización y alta administrativa | ADM.5.0 (Hospitalización) |

```sql
CREATE TABLE hosix_admision_central (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  
  -- Tipo de admisión
  tipo_admision VARCHAR(30) NOT NULL, -- urgencias, consulta_externa, hospitalizacion
  
  -- Clasificación
  clasificacion_automatica VARCHAR(50),
  flujo_asignado VARCHAR(50), -- triage, agenda, camas
  
  -- Tiempos
  fecha_hora_llegada TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_hora_atencion TIMESTAMPTZ,
  tiempo_espera_minutos INT,
  
  -- Asignación inicial
  profesional_asignado_id UUID REFERENCES profesionales_sanitarios(id),
  servicio_asignado_id UUID REFERENCES hosix_servicios(id),
  recurso_asignado VARCHAR(100), -- box, cama, consultorio
  
  -- Estado
  estado VARCHAR(30) DEFAULT 'registrado', -- registrado, en_espera, en_atencion, derivado, egresado
  
  -- Egreso
  tipo_egreso VARCHAR(30), -- alta, ingreso, traslado, defuncion
  fecha_hora_egreso TIMESTAMPTZ,
  
  usuario_registro_id UUID REFERENCES auth.users(id),
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para monitorización de sala de espera
CREATE INDEX idx_admision_estado_espera 
ON hosix_admision_central(estado, fecha_hora_llegada) 
WHERE estado IN ('registrado', 'en_espera');
```

---

## 🚨 MÓDULO ASIS. 12.0 - TRIAGE Y ALERTAS DE SEGURIDAD

### 2.1 Funcionalidades

| ID | Nombre | Detalle | UX/UI |
|----|--------|---------|-------|
| ASIS. 12.1 | Módulo Triage | Clasificación rápida (Escala de Manchester) para Urgencias | Tablero con codificación de color (Semáforo) |
| ASIS. 12.2 | Sistema de Alertas Vitales | Activación de alertas para parámetros críticos | Alerta persistente sticky header |

```sql
CREATE TABLE hosix_triage_clasificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  urgencia_episodio_id UUID REFERENCES hosix_urgencias_episodios(id) NOT NULL,
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  
  -- Escala Manchester
  nivel_manchester INT CHECK (nivel_manchester BETWEEN 1 AND 5),
  -- 1=Rojo (Emergencia), 2=Naranja (Muy Urgente), 3=Amarillo (Urgente)
  -- 4=Verde (Normal), 5=Azul (No Urgente)
  
  color_triage VARCHAR(20), -- rojo, naranja, amarillo, verde, azul
  tiempo_objetivo_minutos INT, -- 0, 10, 60, 120, 240
  
  -- Motivo de consulta estructurado
  motivo_principal TEXT NOT NULL,
  discriminadores JSONB, -- Array de discriminadores seleccionados
  
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

## 📋 MÓDULO ASIS. 13.0 - DIAGNÓSTICO, NOTAS Y ÓRDENES

| ID | Nombre | Detalle | Implementación |
|----|--------|---------|----------------|
| ASIS. 13.1 | Diagnóstico Sistemático (CIE-10) | Campo con búsqueda predictiva y autocompletado | BD: Lista oficial CIE-10 |
| ASIS. 13.2 | Notas Evolutivas | Notas estructuradas (SOAP/SBAR) con plantillas | Smart Forms dinámicos |
| ASIS. 13.3 | Órdenes de Laboratorio/Rx | Solicitud electrónica que se envía a LIS/PACS | Integración con Módulo 6.0/7.0 |

---

## 💊 MÓDULO ASIS. 14.0 - PRESCRIPCIÓN Y RECETA ELECTRÓNICA

| ID | Nombre | Detalle | Implementación |
|----|--------|---------|----------------|
| ASIS. 14.1 | Prescripción Electrónica (CPOE) | Interfaz para prescribir medicamentos, dosis, vías, frecuencia | BD: Listado medicamentos |
| ASIS. 14.2 | Soporte a Dosificación | Cálculo automático basado en peso/edad (pediátricas) | Algoritmos de dosificación |
| ASIS. 14.3 | Alertas de Seguridad (CDS) | Interacciones, duplicidad, contraindicaciones por alergias | Alerta modal forzosa |
| ASIS. 14.4 | Receta Electrónica (e-Receta) | Generación digital con códigos de verificación | Firma electrónica legal |

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
  frecuencia VARCHAR(100) NOT NULL, -- cada 8h, cada 12h, etc.
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

-- Alertas CDS (Clinical Decision Support)
CREATE TABLE hosix_cpoe_alertas_cds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescripcion_id UUID REFERENCES hosix_cpoe_prescripciones(id) NOT NULL,
  
  tipo_alerta VARCHAR(50) NOT NULL, -- interaccion, alergia, dosis_maxima, duplicidad, contraindicacion
  severidad VARCHAR(20) NOT NULL, -- info, advertencia, critica
  
  mensaje TEXT NOT NULL,
  detalle JSONB,
  
  -- Acción del médico
  accion VARCHAR(30), -- aceptada, ignorada, modificada
  justificacion_ignorar TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔬 MÓDULO ASIS. 15.0 - LABORATORIO (Complemento)

| ID | Nombre | Detalle | Implementación |
|----|--------|---------|----------------|
| ASIS. 15.1 | Recepción de Órdenes (LIS) | Laboratorio recibe órdenes de ASIS. 13.3 | Trazabilidad: Ordenado → Recibido → Procesado |
| ASIS. 15.2 | Emisión de Resultados en Tiempo Real | Resultados visibles en HCE inmediatamente | Notificación al médico + alertas críticas |

---

## 🎨 IMPACTO EN UX/UI

### Principios de Diseño para Enfermería

| Recomendación | Detalle |
|---------------|---------|
| **Diseño Móvil/Tablet Primero** | Interfaz funcional en dispositivos móviles para rondas |
| **Entrada Táctil Optimizada** | Botones grandes, listas de selección cortas, mínima tipografía |
| **Vista en Bloque/Resumen** | Worklist con estado de signos vitales y alertas resumido |
| **Notificaciones de Críticos** | Pop-up o sonoras para resultados/constantes críticas |

### Codificación de Color (Semáforo)

```typescript
// Urgencias - Triage Manchester
const coloresTriage = {
  1: { color: 'red', nombre: 'Emergencia', tiempo: 0 },
  2: { color: 'orange', nombre: 'Muy Urgente', tiempo: 10 },
  3: { color: 'yellow', nombre: 'Urgente', tiempo: 60 },
  4: { color: 'green', nombre: 'Normal', tiempo: 120 },
  5: { color: 'blue', nombre: 'No Urgente', tiempo: 240 }
};

// Camas - Estado
const coloresCamas = {
  ocupada_sucia: 'red',
  limpieza_pendiente: 'yellow',
  disponible: 'green',
  reservada: 'blue'
};
```

---

## 📈 DIAGRAMA DE FLUJO DE ADMISIÓN

```
┌─────────────────────────────────────────────────────────────┐
│                 ADMISIÓN CENTRAL (ADM. 11.1)                │
│                                                             │
│  Registro/Validación de Paciente                            │
│  ┌─────────────────────────────────────────────┐            │
│  │ PPI | Nombre | Documento | Aseguradora     │            │
│  └─────────────────────────────────────────────┘            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              CLASIFICACIÓN (ADM. 11.2)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│   URGENCIAS    │ │ CONSULTA EXT.  │ │HOSPITALIZACIÓN │
│                │ │                │ │                │
│  ┌──────────┐  │ │  ┌──────────┐  │ │  ┌──────────┐  │
│  │ TRIAGE   │  │ │  │  AGENDA  │  │ │  │  CAMAS   │  │
│  │(ASIS.12) │  │ │  │ (ADM.3)  │  │ │  │ (ADM.5)  │  │
│  └────┬─────┘  │ │  └────┬─────┘  │ │  └────┬─────┘  │
│       │        │ │       │        │ │       │        │
│       ▼        │ │       ▼        │ │       ▼        │
│  Sala Espera   │ │  Sala Espera   │ │  Ingreso       │
│       │        │ │       │        │ │  Formal        │
│       ▼        │ │       ▼        │ │                │
│    MÉDICO      │ │    MÉDICO      │ │                │
└────────────────┘ └────────────────┘ └────────────────┘
```

---

## 📊 ESTADÍSTICAS Y PROGRESO PENDIENTE

### FASE 3 - Módulos Asistenciales (PENDIENTE)

| Módulo | Estado | Prioridad |
|--------|--------|-----------|
| ASIS. 1.0 - Médicos | ⏳ Pendiente | ALTA |
| ASIS. 2.0 - Enfermería (Complementario) | ⏳ NUEVO | CRÍTICA |
| ASIS. 3.0 - Quirófanos | ⏳ Pendiente | ALTA |
| ASIS. 12.0 - Triage y Alertas | ⏳ NUEVO | CRÍTICA |
| ASIS. 13.0 - Diagnóstico y Órdenes | ⏳ NUEVO | CRÍTICA |
| ASIS. 14.0 - Prescripción CPOE | ⏳ NUEVO | CRÍTICA |
| ASIS. 15.0 - Laboratorio Complemento | ⏳ NUEVO | ALTA |

### Módulos Nuevos Requeridos

| ID | Nombre | Estimado |
|----|--------|----------|
| ADM. 11.0 | Admisión Central | 8-10 horas |
| ASIS. 2.0+ | Enfermería Complementario | 16-20 horas |
| ASIS. 12.0 | Triage y Alertas | 6-8 horas |
| ASIS. 13.0 | Diagnóstico y Órdenes | 8-10 horas |
| ASIS. 14.0 | Prescripción CPOE + CDS | 12-16 horas |
| ASIS. 15.0 | Laboratorio Complemento | 4-6 horas |

**Total estimado nuevos módulos**: 54-70 horas adicionales

---

## 🔧 PRÓXIMOS PASOS

1. **INMEDIATO**: Aplicar corrección SQL para error 42P17 (ver `HOSIX_CORRECCION_ALMACENES_SQL.md`)
2. **CORTO PLAZO**: Completar ADM 12.0 (Compras/Licitaciones)
3. **MEDIANO PLAZO**: Iniciar FASE 3 con prioridad en:
   - ADM. 11.0 - Admisión Central
   - ASIS. 12.0 - Triage
   - ASIS. 14.0 - Prescripción CPOE (Seguridad del paciente)
4. **LARGO PLAZO**: Completar módulos complementarios de enfermería
