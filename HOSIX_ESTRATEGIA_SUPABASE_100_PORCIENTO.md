# HOSIX - Estrategia de Implementación 100% con Supabase
## Arquitectura Adaptada: Robusta y Escalable con Recursos Mínimos

> **Versión**: 1.0  
> **Fecha**: 2025-02-05  
> **Objetivo**: Implementar HOSIX al 100% usando Supabase como base + servicios externos mínimos  
> **Estado**: PLAN ESTRATÉGICO - LISTO PARA IMPLEMENTACIÓN

---

## 📋 ÍNDICE

1. [Análisis de Limitaciones de Supabase](#1-análisis-de-limitaciones-de-supabase)
2. [Arquitectura Adaptada con Supabase](#2-arquitectura-adaptada-con-supabase)
3. [Mapeo de Componentes: Objetivo → Supabase](#3-mapeo-de-componentes-objetivo--supabase)
4. [Servicios Externos Mínimos Requeridos](#4-servicios-externos-mínimos-requeridos)
5. [Plan de Implementación por Fases](#5-plan-de-implementación-por-fases)
6. [Estrategia de Escalabilidad](#6-estrategia-de-escalabilidad)
7. [Checklist de Robustez](#7-checklist-de-robustez)

---

## 1. ANÁLISIS DE LIMITACIONES DE SUPABASE

### 1.1 Limitaciones Identificadas vs Arquitectura Objetivo

| Componente Objetivo | Limitación Supabase | Impacto | Solución Propuesta |
|---------------------|---------------------|---------|-------------------|
| **Kafka/RabbitMQ** | No tiene message broker nativo | Event-driven architecture limitada | ✅ Supabase Realtime + Edge Functions |
| **Kubernetes** | No tiene orquestación de contenedores | Escalabilidad horizontal limitada | ✅ Supabase Edge Functions (serverless) + Vercel/Railway |
| **API Gateway (Kong)** | No tiene API Gateway nativo | Rate limiting, logging centralizado | ✅ Supabase Edge Functions + middleware |
| **CDS Engine** | No tiene motor de reglas clínicas | Sin soporte a decisiones clínicas | ✅ Edge Functions + base de datos de reglas |
| **FHIR Server** | No tiene servidor FHIR nativo | Sin interoperabilidad estándar | ✅ Edge Functions como endpoints FHIR |
| **Observabilidad (ELK)** | Logs básicos, sin tracing distribuido | Visibilidad limitada | ✅ Servicios externos mínimos (Sentry, Logtail) |
| **Microservicios** | Arquitectura monolítica sugerida | Desacoplamiento limitado | ✅ Edge Functions como microservicios lógicos |
| **TLS/SSL** | ✅ Incluido | - | ✅ Sin cambios |
| **Autenticación** | ✅ Supabase Auth (OAuth2/OIDC) | - | ✅ Sin cambios |
| **Base de Datos** | ✅ PostgreSQL con RLS | - | ✅ Sin cambios |
| **Storage** | ✅ Supabase Storage | - | ✅ Sin cambios |

### 1.2 Capacidades de Supabase que Aprovechamos

✅ **PostgreSQL Avanzado**: RLS, triggers, funciones, índices  
✅ **Realtime**: WebSockets para actualizaciones en tiempo real  
✅ **Edge Functions**: Serverless functions (Deno) para lógica backend  
✅ **Storage**: Almacenamiento de archivos (DICOM, documentos)  
✅ **Auth**: OAuth2/OIDC, MFA, sesiones  
✅ **Database Functions**: Lógica en BD (CDS, validaciones)  
✅ **Triggers**: Automatización de eventos  
✅ **Backups**: Automáticos diarios  

---

## 2. ARQUITECTURA ADAPTADA CON SUPABASE

### 2.1 Diagrama de Arquitectura Adaptada

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTES (React Web/Mobile)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              VERCEL / RAILWAY (Frontend Hosting)                │
│  • React App (SSR/SSG)                                          │
│  • Edge Functions (opcional)                                   │
│  • CDN Global                                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              SUPABASE EDGE FUNCTIONS (API Gateway)               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • OAuth2/OIDC Authentication                             │  │
│  │ • Rate Limiting (middleware)                             │  │
│  │ • Request Logging                                        │  │
│  │ • FHIR Endpoints (/fhir/r4/*)                           │  │
│  │ • HL7 v2 Translator                                      │  │
│  │ • CDS Engine (reglas clínicas)                          │  │
│  │ • Integration Engine (LIS, PACS)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ SUPABASE       │ │ SUPABASE        │ │ SUPABASE        │
│ PostgreSQL     │ │ Realtime        │ │ Storage         │
│                │ │                 │ │                 │
│ • 80+ tablas   │ │ • WebSockets    │ │ • DICOM images  │
│ • RLS enabled  │ │ • Channels      │ │ • Documents     │
│ • Functions    │ │ • Broadcast     │ │ • Backups       │
│ • Triggers     │ │                 │ │                 │
└────────────────┘ └────────────────┘ └────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              SERVICIOS EXTERNOS MÍNIMOS                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Sentry (Error Tracking)                               │  │
│  │ • Logtail (Logs centralizados)                         │  │
│  │ • Twilio (SMS para MFA/Notificaciones)                 │  │
│  │ • SendGrid (Email)                                      │  │
│  │ • DrugBank API (Interacciones medicamentosas)           │  │
│  │ • SNOMED/LOINC APIs (Terminología)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Principios de Diseño Adaptados

1. **Supabase-First**: Usar Supabase para todo lo posible
2. **Edge Functions como Microservicios**: Cada dominio = Edge Function
3. **Realtime para Event-Driven**: Realtime channels en lugar de Kafka
4. **Database Functions para Lógica**: CDS, validaciones en PostgreSQL
5. **Servicios Externos Solo Cuando Necesario**: SMS, Email, APIs externas

---

## 3. MAPEO DE COMPONENTES: OBJETIVO → SUPABASE

### 3.1 Tabla de Mapeo Completo

| Componente Objetivo | Implementación Supabase | Archivo/Ubicación | Estado |
|---------------------|------------------------|-------------------|--------|
| **API Gateway** | Edge Function `api-gateway` | `supabase/functions/api-gateway/` | ⏳ |
| **Patient Service** | Edge Function `patient-service` | `supabase/functions/patient-service/` | ⏳ |
| **Orders Service** | Edge Function `orders-service` | `supabase/functions/orders-service/` | ⏳ |
| **Prescriptions Service** | Edge Function `prescriptions-service` | `supabase/functions/prescriptions-service/` | ⏳ |
| **CDS Engine** | Edge Function `cds-engine` + DB Functions | `supabase/functions/cds-engine/` | ⏳ |
| **FHIR Translator** | Edge Function `fhir-translator` | `supabase/functions/fhir-translator/` | ⏳ |
| **HL7 Processor** | Edge Function `hl7-processor` | `supabase/functions/hl7-processor/` | ⏳ |
| **Notification Service** | Edge Function `notifications` | `supabase/functions/notifications/` | ⏳ |
| **Event Bus (Kafka)** | Supabase Realtime Channels | `supabase/realtime/` | ✅ |
| **Audit Service** | Database Triggers + Table | `hosix_auditoria_immutable` | ✅ |
| **IAM Service** | Supabase Auth + Edge Functions | `supabase/auth/` + `functions/iam/` | ⏳ |
| **Terminology Service** | Edge Function + External APIs | `supabase/functions/terminology/` | ⏳ |
| **Storage (DICOM)** | Supabase Storage | `supabase/storage/dicom-images/` | ✅ |
| **Observability** | Sentry + Logtail | External services | ⏳ |

### 3.2 Estructura de Edge Functions Propuesta

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
│   ├── observation-mapper.ts        # Mapeo Observation
│   └── medication-mapper.ts        # Mapeo MedicationRequest
├── hl7-processor/
│   ├── index.ts                    # Receptor HL7 v2.5
│   ├── oru-parser.ts               # Parse ORU^R01 (lab results)
│   └── adt-parser.ts               # Parse ADT^A01 (admissions)
├── notifications/
│   ├── index.ts                    # Notificaciones SMS/Email
│   └── templates.ts                # Plantillas de mensajes
├── iam/
│   ├── index.ts                    # Gestión de permisos
│   └── mfa.ts                      # MFA setup/verify
└── terminology/
    ├── index.ts                    # Búsqueda SNOMED/LOINC
    └── code-mapping.ts             # Mapeo de códigos
```

---

## 4. SERVICIOS EXTERNOS MÍNIMOS REQUERIDOS

### 4.1 Servicios Críticos (Requeridos)

| Servicio | Propósito | Costo Estimado | Alternativa Gratuita |
|----------|-----------|---------------|---------------------|
| **Twilio** | SMS para MFA y notificaciones | $0.0075/SMS | ⚠️ Sin alternativa robusta |
| **SendGrid** | Email transaccional | 100 emails/día gratis | ✅ Alternativa: Resend (gratis) |
| **Sentry** | Error tracking y monitoring | 5K eventos/mes gratis | ✅ Suficiente para inicio |
| **Logtail** | Logs centralizados | 1GB/mes gratis | ✅ Alternativa: Axiom (gratis) |

### 4.2 APIs Externas (Gratuitas/Open Source)

| API | Propósito | Costo | Endpoint |
|-----|-----------|-------|----------|
| **DrugBank API** | Interacciones medicamentosas | Gratis (académico) | `https://go.drugbank.com/` |
| **FHIR Terminology Server** | SNOMED, LOINC | Gratis | `https://tx.fhir.org/` |
| **HL7 FHIR Validator** | Validación FHIR | Gratis | `https://validator.fhir.org/` |

### 4.3 Servicios Opcionales (Para Escalabilidad Futura)

| Servicio | Cuándo Usar | Alternativa Supabase |
|----------|------------|---------------------|
| **Redis** | Cache distribuido | ⏳ Supabase no tiene Redis nativo → usar PostgreSQL cache |
| **Elasticsearch** | Búsqueda avanzada | ⏳ PostgreSQL full-text search |
| **Kubernetes** | Orquestación | ⏳ Edge Functions (serverless) |

---

## 5. PLAN DE IMPLEMENTACIÓN POR FASES

### 5.1 FASE 0: Correcciones Inmediatas (Semana 1)

**Objetivo**: Resolver bloqueadores y completar FASE 2

| Tarea | Duración | Prioridad |
|-------|----------|-----------|
| Corregir error SQL 42P17 (almacenes) | 2h | CRÍTICA |
| Completar ADM 12.0 (Compras) | 8h | ALTA |

**Entregables**:
- ✅ Migración SQL corregida
- ✅ Módulo Compras funcional

---

### 5.2 FASE 1: Infraestructura Base Adaptada (Semanas 2-4)

**Objetivo**: Implementar arquitectura base usando Supabase

#### Sprint 1.1: API Gateway con Edge Functions

```typescript
// supabase/functions/api-gateway/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // 1. Autenticación OAuth2
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // 2. Validar token con Supabase Auth
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 })
  }

  // 3. Rate limiting (usar tabla en PostgreSQL)
  const rateLimitKey = `rate_limit:${user.id}:${Date.now() / 60000}`
  const { data: rateLimit } = await supabase
    .from('hosix_rate_limits')
    .select('count')
    .eq('user_id', user.id)
    .gte('window_start', new Date(Date.now() - 60000))
    .single()

  if (rateLimit && rateLimit.count >= 100) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 })
  }

  // 4. Logging de request
  await supabase.from('hosix_api_logs').insert({
    user_id: user.id,
    method: req.method,
    path: new URL(req.url).pathname,
    ip_address: req.headers.get('x-forwarded-for'),
    timestamp: new Date()
  })

  // 5. Routing a servicios internos
  const url = new URL(req.url)
  const path = url.pathname

  if (path.startsWith('/fhir/r4/')) {
    // Forward to FHIR translator
    return await forwardToFHIR(req, user)
  } else if (path.startsWith('/api/v1/patients')) {
    // Forward to patient service
    return await forwardToPatientService(req, user)
  } else if (path.startsWith('/api/v1/prescriptions')) {
    // Forward to prescriptions service
    return await forwardToPrescriptionsService(req, user)
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
})
```

**Tablas Requeridas**:
```sql
-- Rate limiting
CREATE TABLE hosix_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  window_start TIMESTAMPTZ,
  count INT DEFAULT 1,
  UNIQUE(user_id, window_start)
);

-- API Logs
CREATE TABLE hosix_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  method VARCHAR(10),
  path TEXT,
  ip_address INET,
  status_code INT,
  response_time_ms INT,
  timestamp TIMESTAMPTZ DEFAULT now()
);
```

#### Sprint 1.2: OAuth2/OIDC con Supabase Auth

✅ **Ya incluido en Supabase Auth** - Solo configuración:
- Habilitar OAuth providers (Google, Azure, etc.)
- Configurar redirect URIs
- Implementar refresh tokens

#### Sprint 1.3: MFA con Edge Functions

```typescript
// supabase/functions/mfa-setup/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticator } from 'https://deno.land/x/otp/otp.ts'

serve(async (req) => {
  const { method } = req
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  if (method === 'POST' && req.url.includes('/setup')) {
    // Setup TOTP
    const { userId, method: mfaMethod } = await req.json()
    
    if (mfaMethod === 'totp') {
      const secret = authenticator.generateSecret()
      const qrCodeUrl = `otpauth://totp/HOSIX:${userId}?secret=${secret}&issuer=HOSIX`
      
      // Guardar secret en BD (encriptado)
      await supabase.from('hosix_mfa_methods').insert({
        user_id: userId,
        method: 'totp',
        secret_encrypted: encryptSecret(secret), // Usar KMS
        enabled: false // Hasta verificar
      })
      
      return new Response(JSON.stringify({ qrCodeUrl, secret }), {
        headers: { 'Content-Type': 'application/json' }
      })
    } else if (mfaMethod === 'sms') {
      // Enviar SMS con código (Twilio)
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      
      await sendSMS(phoneNumber, `Tu código HOSIX: ${code}`)
      
      // Guardar código temporalmente (TTL 5 min)
      await supabase.from('hosix_mfa_codes').insert({
        user_id: userId,
        code_hash: hashCode(code),
        expires_at: new Date(Date.now() + 5 * 60 * 1000)
      })
      
      return new Response(JSON.stringify({ sent: true }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  if (method === 'POST' && req.url.includes('/verify')) {
    // Verificar código MFA
    const { userId, code, method: mfaMethod } = await req.json()
    
    if (mfaMethod === 'totp') {
      const { data: mfaMethod } = await supabase
        .from('hosix_mfa_methods')
        .select('secret_encrypted')
        .eq('user_id', userId)
        .eq('method', 'totp')
        .single()
      
      const secret = decryptSecret(mfaMethod.secret_encrypted)
      const isValid = authenticator.check(code, secret)
      
      if (isValid) {
        // Habilitar MFA
        await supabase
          .from('hosix_mfa_methods')
          .update({ enabled: true })
          .eq('user_id', userId)
        
        return new Response(JSON.stringify({ verified: true }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
    
    return new Response(JSON.stringify({ error: 'Invalid code' }), { status: 401 })
  }
})
```

---

### 5.3 FASE 2: Módulos Asistenciales Críticos (Semanas 5-12)

#### Sprint 2.1: Enfermería (ASIS 2.0)

**Implementación con Supabase**:
- ✅ Tablas SQL ya definidas
- ✅ Edge Functions para lógica de negocio
- ✅ Realtime para worklist en tiempo real

```typescript
// supabase/functions/enfermeria-worklist/index.ts
serve(async (req) => {
  const supabase = createClient(...)
  
  // Obtener worklist de órdenes pendientes
  const { data: ordenes } = await supabase
    .from('hosix_enfermeria_worklist_ordenes')
    .select('*, paciente:hosix_pacientes(*), episodio(*)')
    .eq('estado', 'pendiente')
    .order('prioridad', { ascending: false })
  
  return new Response(JSON.stringify(ordenes), {
    headers: { 'Content-Type': 'application/json' }
  })
})

// Frontend: Suscribirse a cambios en tiempo real
const channel = supabase
  .channel('enfermeria-worklist')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'hosix_enfermeria_worklist_ordenes'
  }, (payload) => {
    // Actualizar worklist automáticamente
    updateWorklist(payload)
  })
  .subscribe()
```

#### Sprint 2.2: CPOE + Prescripción Electrónica (ASIS 14.0)

**CDS Engine en Edge Function**:

```typescript
// supabase/functions/cds-engine/index.ts
serve(async (req) => {
  const { prescription, patientId } = await req.json()
  
  const alerts = []
  
  // 1. Verificar interacciones medicamentosas
  const interactions = await checkDrugInteractions(
    prescription.medicamento_id,
    patientId
  )
  alerts.push(...interactions)
  
  // 2. Verificar alergias
  const allergies = await checkAllergies(
    prescription.medicamento_id,
    patientId
  )
  alerts.push(...allergies)
  
  // 3. Verificar dosificación
  const dosageAlert = await checkDosage(
    prescription,
    patientId
  )
  if (dosageAlert) alerts.push(dosageAlert)
  
  return new Response(JSON.stringify({ alerts }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

// Función helper: Interacciones medicamentosas
async function checkDrugInteractions(medId: UUID, patientId: UUID) {
  // 1. Obtener medicamentos actuales del paciente
  const { data: currentMeds } = await supabase
    .from('hosix_cpoe_prescripciones')
    .select('medicamento_id')
    .eq('paciente_id', patientId)
    .eq('estado', 'activa')
  
  // 2. Consultar base de datos de interacciones (DrugBank API o tabla local)
  const { data: interactions } = await supabase
    .from('hosix_drug_interactions')
    .select('*')
    .or(`medicamento1_id.eq.${medId},medicamento2_id.eq.${medId}`)
  
  // 3. Filtrar interacciones relevantes
  const relevantInteractions = interactions.filter(i => 
    currentMeds.some(m => 
      m.medicamento_id === i.medicamento1_id || 
      m.medicamento_id === i.medicamento2_id
    )
  )
  
  return relevantInteractions.map(i => ({
    tipo: 'interaccion',
    severidad: i.severidad,
    mensaje: i.descripcion,
    medicamentos: [i.medicamento1_id, i.medicamento2_id]
  }))
}
```

**Base de Datos de Interacciones**:
```sql
CREATE TABLE hosix_drug_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicamento1_id UUID REFERENCES hosix_articulos(id),
  medicamento2_id UUID REFERENCES hosix_articulos(id),
  severidad VARCHAR(20), -- leve, moderada, grave, critica
  descripcion TEXT,
  recomendacion TEXT,
  fuente VARCHAR(100), -- 'drugbank', 'manual'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para búsqueda rápida
CREATE INDEX idx_drug_interactions_meds 
ON hosix_drug_interactions(medicamento1_id, medicamento2_id);
```

#### Sprint 2.3: Triage Manchester (ASIS 12.0)

**Implementación con Database Functions**:

```sql
-- Función para calcular nivel Manchester
CREATE OR REPLACE FUNCTION calcular_nivel_manchester(
  discriminador_id VARCHAR,
  signos_vitales JSONB,
  sintomas JSONB
) RETURNS INT AS $$
DECLARE
  nivel INT := 5; -- Por defecto azul (no urgente)
BEGIN
  -- Lógica de árbol de decisión Manchester
  CASE discriminador_id
    WHEN 'dolor-toracico' THEN
      IF signos_vitales->>'presion_sistolica'::INT < 90 THEN
        nivel := 1; -- Rojo (emergencia)
      ELSIF signos_vitales->>'frecuencia_cardiaca'::INT > 120 THEN
        nivel := 2; -- Naranja (muy urgente)
      ELSE
        nivel := 3; -- Amarillo (urgente)
      END IF;
    
    WHEN 'dificultad-respiratoria' THEN
      IF signos_vitales->>'saturacion_oxigeno'::INT < 90 THEN
        nivel := 1; -- Rojo
      ELSIF signos_vitales->>'frecuencia_respiratoria'::INT > 30 THEN
        nivel := 2; -- Naranja
      ELSE
        nivel := 3; -- Amarillo
      END IF;
    
    -- Más discriminadores...
    
    ELSE
      nivel := 5; -- Azul (no urgente)
  END CASE;
  
  RETURN nivel;
END;
$$ LANGUAGE plpgsql;
```

---

### 5.4 FASE 3: Interoperabilidad FHIR/HL7 (Semanas 13-18)

#### Sprint 3.1: FHIR Endpoints

```typescript
// supabase/functions/fhir-translator/index.ts
serve(async (req) => {
  const url = new URL(req.url)
  const path = url.pathname
  
  // GET /fhir/r4/Patient?identifier=ppi|2500123456
  if (path.startsWith('/fhir/r4/Patient')) {
    const identifier = url.searchParams.get('identifier')
    const [system, value] = identifier?.split('|') || []
    
    if (system === 'http://hosix.health/ppi') {
      // Buscar paciente por PPI
      const { data: patient } = await supabase
        .from('hosix_pacientes')
        .select('*')
        .eq('ppi', value)
        .single()
      
      if (!patient) {
        return new Response(JSON.stringify({
          resourceType: 'OperationOutcome',
          issue: [{ severity: 'error', code: 'not-found' }]
        }), { status: 404 })
      }
      
      // Mapear a FHIR Patient
      const fhirPatient = mapPatientToFHIR(patient)
      
      return new Response(JSON.stringify(fhirPatient), {
        headers: {
          'Content-Type': 'application/fhir+json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
  }
  
  // POST /fhir/r4/MedicationRequest
  if (path.startsWith('/fhir/r4/MedicationRequest') && req.method === 'POST') {
    const fhirRx = await req.json()
    
    // Validar FHIR
    const isValid = await validateFHIRResource(fhirRx)
    if (!isValid) {
      return new Response(JSON.stringify({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'invalid' }]
      }), { status: 400 })
    }
    
    // Mapear a BD HOSIX
    const dbRx = mapFHIRMedicationRequestToDB(fhirRx)
    
    // Guardar en BD
    const { data: prescription } = await supabase
      .from('hosix_cpoe_prescripciones')
      .insert(dbRx)
      .select()
      .single()
    
    // Retornar FHIR con ID asignado
    fhirRx.id = prescription.id
    return new Response(JSON.stringify(fhirRx), {
      status: 201,
      headers: { 'Content-Type': 'application/fhir+json' }
    })
  }
  
  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
})

// Mapper: HOSIX → FHIR Patient
function mapPatientToFHIR(dbPatient: any): FHIR.Patient {
  return {
    resourceType: 'Patient',
    id: dbPatient.ppi,
    identifier: [
      {
        system: 'http://hosix.health/ppi',
        value: dbPatient.ppi
      }
    ],
    name: [{
      use: 'official',
      family: `${dbPatient.primer_apellido} ${dbPatient.segundo_apellido || ''}`.trim(),
      given: [dbPatient.primer_nombre, dbPatient.segundo_nombre].filter(Boolean)
    }],
    gender: dbPatient.sexo?.toLowerCase(),
    birthDate: dbPatient.fecha_nacimiento,
    telecom: [
      {
        system: 'phone',
        value: dbPatient.telefono_movil,
        use: 'mobile'
      },
      {
        system: 'email',
        value: dbPatient.email
      }
    ],
    address: [{
      line: [dbPatient.direccion],
      city: dbPatient.ciudad,
      state: dbPatient.provincia,
      postalCode: dbPatient.codigo_postal,
      country: 'EC'
    }],
    active: dbPatient.activo
  }
}
```

#### Sprint 3.2: HL7 v2.5 Processor

```typescript
// supabase/functions/hl7-processor/index.ts
serve(async (req) => {
  const hl7Message = await req.text()
  
  // Parsear HL7 v2.5
  const segments = hl7Message.split('\r').map(s => s.split('|'))
  const mshSegment = segments[0] // MSH|^~\&|...
  
  const messageType = mshSegment[9] // ORU^R01, ADT^A01, etc.
  const [messageCode, triggerEvent] = messageType.split('^')
  
  if (messageCode === 'ORU' && triggerEvent === 'R01') {
    // Resultado de laboratorio
    const labResult = parseORU_R01(segments)
    
    // Guardar en BD
    await supabase.from('hosix_laboratorio_resultados').insert({
      paciente_id: labResult.patientId,
      test_code: labResult.testCode,
      value: labResult.value,
      unit: labResult.unit,
      reference_range: labResult.referenceRange,
      abnormal_flag: labResult.abnormalFlag,
      fecha_resultado: new Date()
    })
    
    // Emitir evento Realtime
    await supabase.channel('lab-results').send({
      type: 'broadcast',
      event: 'lab_result_received',
      payload: labResult
    })
    
    // Generar ACK
    const ack = generateHL7ACK(mshSegment[10], 'AA')
    return new Response(ack, {
      headers: { 'Content-Type': 'text/plain' }
    })
  }
  
  return new Response('ACK|AE|Invalid message type', { status: 400 })
})

function parseORU_R01(segments: string[][]): LabResult {
  const pidSegment = segments.find(s => s[0] === 'PID')
  const obrSegment = segments.find(s => s[0] === 'OBR')
  const obxSegments = segments.filter(s => s[0] === 'OBX')
  
  return {
    patientId: pidSegment?.[3]?.[0] || '',
    testCode: obrSegment?.[4]?.[0] || '',
    testName: obrSegment?.[4]?.[1] || '',
    results: obxSegments.map(obx => ({
      code: obx[3]?.[0] || '',
      value: obx[5]?.[0] || '',
      unit: obx[6]?.[0] || '',
      referenceRange: obx[7]?.[0] || '',
      abnormalFlag: obx[8]?.[0] || ''
    }))
  }
}
```

---

### 5.5 FASE 4: Event-Driven con Realtime (Semanas 19-22)

#### Sprint 4.1: Realtime Channels para Eventos

**En lugar de Kafka, usar Supabase Realtime**:

```typescript
// Frontend: Suscribirse a eventos
const prescriptionChannel = supabase
  .channel('prescription-events')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'hosix_cpoe_prescripciones'
  }, (payload) => {
    // Nueva prescripción creada
    handleNewPrescription(payload.new)
    
    // Notificar a farmacia
    notifyPharmacy(payload.new)
  })
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'hosix_cpoe_prescripciones',
    filter: 'estado=eq.activa'
  }, (payload) => {
    // Prescripción actualizada
    handlePrescriptionUpdate(payload.new)
  })
  .subscribe()

// Backend: Emitir eventos personalizados
await supabase.channel('clinical-alerts').send({
  type: 'broadcast',
  event: 'critical_vital_sign',
  payload: {
    patientId: '...',
    vitalSign: 'SpO2',
    value: 85,
    timestamp: new Date()
  }
})
```

**Configuración Realtime en Supabase**:
```sql
-- Habilitar Realtime para tablas críticas
ALTER PUBLICATION supabase_realtime ADD TABLE hosix_cpoe_prescripciones;
ALTER PUBLICATION supabase_realtime ADD TABLE hosix_enfermeria_worklist_ordenes;
ALTER PUBLICATION supabase_realtime ADD TABLE hosix_laboratorio_resultados;
ALTER PUBLICATION supabase_realtime ADD TABLE hosix_urgencias_episodios;
```

---

### 5.6 FASE 5: Observabilidad y Monitoreo (Semanas 23-26)

#### Sprint 5.1: Error Tracking con Sentry

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
})

// En Edge Functions
import { init } from 'https://deno.land/x/sentry_deno@7.0.0/index.ts'

init({
  dsn: Deno.env.get('SENTRY_DSN'),
  environment: 'production'
})
```

#### Sprint 5.2: Logs Centralizados con Logtail

```typescript
// supabase/functions/logging/index.ts
import { Logtail } from 'https://esm.sh/@logtail/node@0.4.0'

const logtail = new Logtail(Deno.env.get('LOGTAIL_TOKEN')!)

export async function logEvent(
  level: 'info' | 'warn' | 'error',
  message: string,
  context: Record<string, any>
) {
  await logtail.log(message, level, {
    ...context,
    timestamp: new Date().toISOString(),
    service: 'hosix'
  })
}

// Uso en Edge Functions
await logEvent('info', 'Prescription created', {
  prescriptionId: prescription.id,
  patientId: prescription.paciente_id,
  medicamentoId: prescription.medicamento_id
})
```

---

## 6. ESTRATEGIA DE ESCALABILIDAD

### 6.1 Escalabilidad Horizontal con Edge Functions

**Ventajas de Edge Functions**:
- ✅ Auto-scaling automático
- ✅ Sin gestión de servidores
- ✅ Distribución global (CDN)
- ✅ Pago por uso

**Limitaciones**:
- ⚠️ Cold start (~100-500ms)
- ⚠️ Timeout máximo: 60 segundos
- ⚠️ Memoria limitada: 150MB

**Mitigación**:
- Usar Database Functions para lógica pesada
- Cache en PostgreSQL para consultas frecuentes
- Batch processing para operaciones largas

### 6.2 Escalabilidad de Base de Datos

**Supabase PostgreSQL**:
- ✅ Hasta 500MB RAM (Free) → 8GB (Pro)
- ✅ Connection pooling incluido
- ✅ Read replicas disponibles (Pro)

**Optimizaciones**:
```sql
-- Índices para performance
CREATE INDEX CONCURRENTLY idx_pacientes_ppi ON hosix_pacientes(ppi);
CREATE INDEX CONCURRENTLY idx_historia_paciente_fecha 
ON hosix_historia_clinica(paciente_id, fecha_entrada DESC);

-- Materialized views para reportes pesados
CREATE MATERIALIZED VIEW mv_estadisticas_diarias AS
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) as total_pacientes,
  COUNT(DISTINCT servicio_id) as servicios_activos
FROM hosix_historia_clinica
GROUP BY DATE(created_at);

-- Refresh cada hora
CREATE OR REPLACE FUNCTION refresh_mv_estadisticas()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_estadisticas_diarias;
END;
$$ LANGUAGE plpgsql;

-- Cron job (usar pg_cron extension)
SELECT cron.schedule('refresh-stats', '0 * * * *', 'SELECT refresh_mv_estadisticas()');
```

### 6.3 Escalabilidad de Realtime

**Supabase Realtime**:
- ✅ Hasta 200 conexiones simultáneas (Free) → 500K (Pro)
- ✅ WebSocket connections escalables
- ✅ Broadcasting eficiente

**Optimización**:
```typescript
// Usar canales específicos por departamento (no global)
const channel = supabase.channel(`enfermeria-piso-3`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'hosix_enfermeria_worklist_ordenes',
    filter: `piso=eq.3` // Filtrar en BD
  }, handleUpdate)
  .subscribe()
```

---

## 7. CHECKLIST DE ROBUSTEZ

### 7.1 Seguridad

- [x] ✅ OAuth2/OIDC con Supabase Auth
- [ ] ⏳ MFA (SMS + TOTP) con Edge Functions
- [ ] ⏳ RBAC/ABAC con RLS policies
- [ ] ⏳ Auditoría inmutable con hash chaining
- [ ] ⏳ TLS 1.3 (incluido en Supabase)
- [ ] ⏳ Encriptación en reposo (pgcrypto)
- [ ] ⏳ Rate limiting en API Gateway

### 7.2 Interoperabilidad

- [ ] ⏳ Endpoints FHIR R4 (Patient, Observation, MedicationRequest)
- [ ] ⏳ HL7 v2.5 processor (ORU^R01, ADT^A01)
- [ ] ⏳ DICOM integration (Storage + metadata)
- [ ] ⏳ Terminology service (SNOMED, LOINC)

### 7.3 Funcionalidad Clínica

- [ ] ⏳ CDS Engine (interacciones, alergias, dosificación)
- [ ] ⏳ Triage Manchester
- [ ] ⏳ CPOE + Prescripción electrónica
- [ ] ⏳ Enfermería (worklist, signos vitales, balance hídrico)
- [ ] ⏳ Laboratorio integration

### 7.4 Observabilidad

- [ ] ⏳ Error tracking (Sentry)
- [ ] ⏳ Logs centralizados (Logtail)
- [ ] ⏳ Métricas de performance (Supabase Dashboard)
- [ ] ⏳ Alertas críticas (PagerDuty o similar)

### 7.5 Escalabilidad

- [ ] ⏳ Edge Functions optimizadas
- [ ] ⏳ Database indexes estratégicos
- [ ] ⏳ Materialized views para BI
- [ ] ⏳ Connection pooling configurado
- [ ] ⏳ Cache strategy definida

---

## 8. COSTOS ESTIMADOS

### 8.1 Supabase (Base)

| Plan | Costo/Mes | Incluye |
|------|-----------|---------|
| **Free** | $0 | 500MB DB, 1GB Storage, 2GB Bandwidth |
| **Pro** | $25 | 8GB DB, 100GB Storage, 250GB Bandwidth |
| **Team** | $599 | 32GB DB, 1TB Storage, 1TB Bandwidth |

**Recomendación**: Empezar con **Pro** ($25/mes) para producción

### 8.2 Servicios Externos

| Servicio | Plan | Costo/Mes |
|----------|------|-----------|
| **Twilio** | Pay-as-you-go | ~$10-50 (según SMS) |
| **SendGrid** | Free | $0 (100 emails/día) |
| **Sentry** | Free | $0 (5K eventos/mes) |
| **Logtail** | Free | $0 (1GB/mes) |
| **Vercel** | Pro | $20/mes |

**Total Estimado**: **$55-95/mes** para producción inicial

### 8.3 Escalabilidad Futura

Cuando se necesite más:
- **Supabase Team**: $599/mes (más DB, storage, bandwidth)
- **Twilio**: Escala con uso
- **Vercel Enterprise**: Para mayor tráfico

---

## 9. ROADMAP DE IMPLEMENTACIÓN ADAPTADO

### Sprint 0 (Semana 1): Correcciones
- [x] Corregir SQL error 42P17
- [x] Completar ADM 12.0

### Sprint 1-2 (Semanas 2-4): Infraestructura Base
- [ ] API Gateway Edge Function
- [ ] OAuth2/OIDC configurado
- [ ] MFA Edge Function
- [ ] Rate limiting
- [ ] Logging centralizado

### Sprint 3-4 (Semanas 5-8): Módulos Asistenciales Críticos
- [ ] Enfermería (worklist, signos vitales)
- [ ] Triage Manchester
- [ ] CPOE básico

### Sprint 5-6 (Semanas 9-12): CPOE + CDS
- [ ] Prescripción electrónica completa
- [ ] CDS Engine (interacciones, alergias)
- [ ] Firma digital

### Sprint 7-8 (Semanas 13-16): Interoperabilidad
- [ ] FHIR endpoints (Patient, Observation, MedicationRequest)
- [ ] HL7 v2.5 processor
- [ ] Terminology service

### Sprint 9-10 (Semanas 17-20): Event-Driven
- [ ] Realtime channels configurados
- [ ] Event handlers para notificaciones
- [ ] Integración LIS/PACS

### Sprint 11-12 (Semanas 21-24): Observabilidad + Optimización
- [ ] Sentry integrado
- [ ] Logtail configurado
- [ ] Performance optimization
- [ ] Load testing

---

## 10. VENTAJAS DE ESTA ARQUITECTURA

### ✅ Ventajas vs Arquitectura Objetivo

1. **Menor Complejidad**: Sin Kubernetes, Kafka, etc.
2. **Menor Costo**: $55-95/mes vs $500-1000/mes
3. **Despliegue Rápido**: Sin configuración de infraestructura
4. **Mantenimiento Simplificado**: Menos componentes que gestionar
5. **Escalabilidad Automática**: Edge Functions escalan solas

### ⚠️ Trade-offs

1. **Cold Starts**: Edge Functions pueden tener latencia inicial
2. **Timeouts**: Máximo 60s por función (suficiente para la mayoría de casos)
3. **Memoria Limitada**: 150MB por función (optimizar código)
4. **Sin Microservicios Físicos**: Lógica separada pero mismo runtime

---

## 11. CONCLUSIÓN Y PRÓXIMOS PASOS

### Estado Actual
- ✅ FASE 1: 100% completada
- ✅ FASE 2: 91% completada (11/12 módulos)
- ⏳ FASE 3-5: Pendientes

### Estrategia Propuesta
1. **Usar Supabase como base** para todo lo posible
2. **Edge Functions como microservicios lógicos**
3. **Realtime en lugar de Kafka**
4. **Servicios externos mínimos** solo cuando necesario
5. **Escalar gradualmente** según necesidad

### Próximos Pasos Inmediatos

1. **Semana 1**: Corregir SQL error + completar ADM 12.0
2. **Semana 2**: Implementar API Gateway Edge Function
3. **Semana 3**: Configurar OAuth2/OIDC + MFA
4. **Semana 4**: Iniciar módulos asistenciales (Enfermería)

---

**Documento Compilado**: 2025-02-05  
**Estado**: LISTO PARA IMPLEMENTACIÓN  
**Responsable**: Arquitectura HOSIX - GEPROSTEC

