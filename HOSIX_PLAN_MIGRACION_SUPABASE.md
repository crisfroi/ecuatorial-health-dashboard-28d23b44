# HOSIX - Plan de Migración Detallado a Arquitectura Supabase
## Guía Paso a Paso para Implementación 100%

> **Versión**: 1.0  
> **Fecha**: 2025-02-05  
> **Objetivo**: Migrar arquitectura objetivo a arquitectura Supabase adaptada  
> **Estado**: PLAN DE EJECUCIÓN

---

## 📋 ÍNDICE

1. [Análisis de Gaps](#1-análisis-de-gaps)
2. [Plan de Migración por Componente](#2-plan-de-migración-por-componente)
3. [Ejemplos de Código Completos](#3-ejemplos-de-código-completos)
4. [Testing y Validación](#4-testing-y-validación)
5. [Rollback Plan](#5-rollback-plan)

---

## 1. ANÁLISIS DE GAPS

### 1.1 Componentes que Requieren Adaptación

| Componente Objetivo | Gap Actual | Solución Supabase | Esfuerzo |
|---------------------|------------|-------------------|----------|
| **Kafka Event Bus** | No existe | Realtime Channels | 2-3 días |
| **API Gateway (Kong)** | No existe | Edge Function | 1-2 días |
| **CDS Engine** | No existe | Edge Function + DB Functions | 3-4 días |
| **FHIR Server** | No existe | Edge Function | 2-3 días |
| **HL7 Processor** | No existe | Edge Function | 1-2 días |
| **Microservicios** | Monolito actual | Edge Functions separadas | 1 semana |
| **Observabilidad** | Logs básicos | Sentry + Logtail | 1 día |

**Total Estimado**: 2-3 semanas de desarrollo

---

## 2. PLAN DE MIGRACIÓN POR COMPONENTE

### 2.1 FASE 1: Event Bus (Kafka → Realtime)

#### Paso 1: Identificar Eventos Críticos

```typescript
// Eventos que necesitan ser procesados
const CRITICAL_EVENTS = [
  'PrescriptionCreated',
  'PrescriptionSigned',
  'LabResultReceived',
  'PatientAdmitted',
  'VitalSignCritical',
  'OrderCompleted'
]
```

#### Paso 2: Crear Tabla de Eventos

```sql
-- Tabla para eventos (opcional, para auditoría)
CREATE TABLE hosix_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed BOOLEAN DEFAULT false
);

-- Índice para eventos no procesados
CREATE INDEX idx_events_unprocessed 
ON hosix_events(processed, created_at) 
WHERE processed = false;
```

#### Paso 3: Implementar Event Emitter

```typescript
// src/lib/events/eventEmitter.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export class EventEmitter {
  async emit(eventType: string, payload: any) {
    // 1. Guardar evento en BD (opcional, para auditoría)
    await supabase.from('hosix_events').insert({
      event_type: eventType,
      payload
    })
    
    // 2. Broadcast via Realtime
    await supabase.channel('hosix-events').send({
      type: 'broadcast',
      event: eventType,
      payload
    })
  }
  
  subscribe(eventType: string, handler: (payload: any) => void) {
    const channel = supabase.channel(`event-${eventType}`)
      .on('broadcast', { event: eventType }, (payload) => {
        handler(payload.payload)
      })
      .subscribe()
    
    return () => channel.unsubscribe()
  }
}

// Uso
const emitter = new EventEmitter()

// Emitir evento
await emitter.emit('PrescriptionCreated', {
  prescriptionId: '...',
  patientId: '...',
  medicamentoId: '...'
})

// Suscribirse a evento
emitter.subscribe('PrescriptionCreated', (payload) => {
  console.log('Nueva prescripción:', payload)
  // Notificar a farmacia, etc.
})
```

#### Paso 4: Migrar Consumidores de Kafka

**Antes (Kafka)**:
```typescript
const consumer = kafka.consumer({ groupId: 'notification-service' })
await consumer.subscribe({ topic: 'prescription-events' })
await consumer.run({
  eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value.toString())
    if (event.type === 'PrescriptionCreated') {
      await sendNotification(event)
    }
  }
})
```

**Después (Realtime)**:
```typescript
// Edge Function: supabase/functions/notification-handler/index.ts
serve(async (req) => {
  const supabase = createClient(...)
  
  // Suscribirse a eventos de prescripciones
  const channel = supabase.channel('prescription-events')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'hosix_cpoe_prescripciones'
    }, async (payload) => {
      const prescription = payload.new
      
      // Enviar notificación
      await sendNotification({
        type: 'prescription_created',
        prescriptionId: prescription.id,
        patientId: prescription.paciente_id
      })
    })
    .subscribe()
  
  return new Response(JSON.stringify({ subscribed: true }))
})
```

---

### 2.2 FASE 2: API Gateway (Kong → Edge Function)

#### Paso 1: Crear Edge Function Base

```typescript
// supabase/functions/api-gateway/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RATE_LIMIT_WINDOW_MS = 60000 // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 100

serve(async (req) => {
  const startTime = Date.now()
  const url = new URL(req.url)
  
  // 1. Autenticación
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }
  
  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return jsonResponse({ error: 'Invalid token' }, 401)
  }
  
  // 2. Rate Limiting
  const rateLimitKey = `rate_limit:${user.id}:${Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS)}`
  const { data: rateLimit } = await supabase
    .from('hosix_rate_limits')
    .select('count')
    .eq('user_id', user.id)
    .gte('window_start', new Date(Date.now() - RATE_LIMIT_WINDOW_MS))
    .single()
  
  if (rateLimit && rateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429)
  }
  
  // Incrementar contador
  await supabase.rpc('increment_rate_limit', {
    p_user_id: user.id,
    p_window_start: new Date(Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS)
  })
  
  // 3. Routing
  const path = url.pathname
  let response: Response
  
  if (path.startsWith('/fhir/r4/')) {
    // Forward to FHIR translator
    response = await forwardToFHIR(req, user)
  } else if (path.startsWith('/api/v1/patients')) {
    // Forward to patient service
    response = await forwardToPatientService(req, user)
  } else if (path.startsWith('/api/v1/prescriptions')) {
    // Forward to prescriptions service
    response = await forwardToPrescriptionsService(req, user)
  } else {
    response = jsonResponse({ error: 'Not found' }, 404)
  }
  
  // 4. Logging
  const responseTime = Date.now() - startTime
  await supabase.from('hosix_api_logs').insert({
    user_id: user.id,
    method: req.method,
    path: path,
    ip_address: req.headers.get('x-forwarded-for'),
    status_code: response.status,
    response_time_ms: responseTime
  })
  
  // 5. CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  
  return response
})

// Helper: Forward to FHIR translator
async function forwardToFHIR(req: Request, user: any): Promise<Response> {
  const fhirFunctionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/fhir-translator`
  
  const fhirReq = new Request(fhirFunctionUrl, {
    method: req.method,
    headers: {
      'Authorization': req.headers.get('Authorization')!,
      'Content-Type': req.headers.get('Content-Type') || 'application/json'
    },
    body: req.body
  })
  
  return await fetch(fhirReq)
}

// Helper: Forward to patient service
async function forwardToPatientService(req: Request, user: any): Promise<Response> {
  const patientFunctionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/patient-service`
  
  const patientReq = new Request(patientFunctionUrl, {
    method: req.method,
    headers: {
      'Authorization': req.headers.get('Authorization')!,
      'Content-Type': req.headers.get('Content-Type') || 'application/json'
    },
    body: req.body
  })
  
  return await fetch(patientReq)
}

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

#### Paso 2: Crear Database Function para Rate Limiting

```sql
-- Función para incrementar rate limit
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_user_id UUID,
  p_window_start TIMESTAMPTZ
) RETURNS void AS $$
BEGIN
  INSERT INTO hosix_rate_limits (user_id, window_start, count)
  VALUES (p_user_id, p_window_start, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET count = hosix_rate_limits.count + 1;
END;
$$ LANGUAGE plpgsql;
```

---

### 2.3 FASE 3: CDS Engine

#### Paso 1: Crear Tabla de Reglas CDS

```sql
CREATE TABLE hosix_cds_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- interaccion, alergia, dosis, duplicidad
  condicion_sql TEXT NOT NULL, -- SQL para evaluar condición
  severidad VARCHAR(20) NOT NULL, -- info, advertencia, critica
  mensaje TEXT NOT NULL,
  accion_recomendada TEXT,
  activa BOOLEAN DEFAULT true,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ejemplo de regla: Interacción Warfarina + Aspirina
INSERT INTO hosix_cds_rules (nombre, tipo, condicion_sql, severidad, mensaje, accion_recomendada)
VALUES (
  'Interacción Warfarina + Aspirina',
  'interaccion',
  'EXISTS (
    SELECT 1 FROM hosix_cpoe_prescripciones p1
    JOIN hosix_cpoe_prescripciones p2 ON p1.paciente_id = p2.paciente_id
    WHERE p1.medicamento_id = $1 AND p2.medicamento_id = $2
    AND p1.estado = ''activa'' AND p2.estado = ''activa''
  )',
  'critica',
  'Interacción mayor detectada: Warfarina + Aspirina aumenta riesgo de hemorragia',
  'Revisar necesidad de ambos medicamentos. Considerar suspender uno o ajustar dosis.'
);
```

#### Paso 2: Implementar CDS Engine Edge Function

```typescript
// supabase/functions/cds-engine/index.ts
serve(async (req) => {
  const { prescription, patientId } = await req.json()
  const supabase = createClient(...)
  
  const alerts = []
  
  // 1. Obtener reglas activas
  const { data: rules } = await supabase
    .from('hosix_cds_rules')
    .select('*')
    .eq('activa', true)
    .eq('tipo', 'interaccion')
  
  // 2. Evaluar cada regla
  for (const rule of rules) {
    // Ejecutar condición SQL
    const { data: matches } = await supabase.rpc('evaluate_cds_rule', {
      p_rule_id: rule.id,
      p_prescription_id: prescription.id,
      p_patient_id: patientId
    })
    
    if (matches && matches.length > 0) {
      alerts.push({
        tipo: rule.tipo,
        severidad: rule.severidad,
        mensaje: rule.mensaje,
        accion_recomendada: rule.accion_recomendada,
        regla_id: rule.id
      })
    }
  }
  
  // 3. Verificar alergias (consulta directa)
  const { data: alergias } = await supabase
    .from('hosix_pacientes')
    .select('alergias')
    .eq('id', patientId)
    .single()
  
  if (alergias?.alergias?.some((a: any) => 
    a.medicamento_id === prescription.medicamento_id
  )) {
    alerts.push({
      tipo: 'alergia',
      severidad: 'critica',
      mensaje: 'Paciente tiene alergia conocida a este medicamento',
      accion_recomendada: 'NO ADMINISTRAR. Buscar alternativa.'
    })
  }
  
  // 4. Verificar dosificación pediátrica
  const { data: paciente } = await supabase
    .from('hosix_pacientes')
    .select('fecha_nacimiento, peso_kg')
    .eq('id', patientId)
    .single()
  
  if (paciente && calcularEdad(paciente.fecha_nacimiento) < 18) {
    const dosageAlert = await verificarDosificacionPediatrica(
      prescription,
      paciente.peso_kg,
      calcularEdad(paciente.fecha_nacimiento)
    )
    if (dosageAlert) alerts.push(dosageAlert)
  }
  
  return new Response(JSON.stringify({ alerts }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

// Database Function para evaluar reglas
CREATE OR REPLACE FUNCTION evaluate_cds_rule(
  p_rule_id UUID,
  p_prescription_id UUID,
  p_patient_id UUID
) RETURNS TABLE(result BOOLEAN) AS $$
DECLARE
  v_rule RECORD;
  v_sql TEXT;
BEGIN
  -- Obtener regla
  SELECT * INTO v_rule FROM hosix_cds_rules WHERE id = p_rule_id;
  
  -- Reemplazar placeholders en SQL
  v_sql := REPLACE(v_rule.condicion_sql, '$1', p_prescription_id::TEXT);
  v_sql := REPLACE(v_sql, '$2', p_patient_id::TEXT);
  
  -- Ejecutar SQL dinámico (CUIDADO: validar SQL antes en producción)
  EXECUTE v_sql INTO result;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
```

---

### 2.4 FASE 4: FHIR Server

#### Paso 1: Instalar Librerías FHIR

```typescript
// supabase/functions/fhir-translator/import_map.json
{
  "imports": {
    "fhir": "https://esm.sh/fhir-types@4.0.0"
  }
}
```

#### Paso 2: Implementar Mappers

```typescript
// supabase/functions/fhir-translator/mappers/patient-mapper.ts
import { Patient } from 'fhir-types'

export function mapDBPatientToFHIR(dbPatient: any): Patient {
  return {
    resourceType: 'Patient',
    id: dbPatient.ppi,
    identifier: [
      {
        system: 'http://hosix.health/ppi',
        value: dbPatient.ppi
      },
      ...(dbPatient.numero_documento ? [{
        system: 'http://hosix.health/cedula',
        value: dbPatient.numero_documento
      }] : [])
    ],
    name: [{
      use: 'official',
      family: `${dbPatient.primer_apellido} ${dbPatient.segundo_apellido || ''}`.trim(),
      given: [
        dbPatient.primer_nombre,
        dbPatient.segundo_nombre
      ].filter(Boolean)
    }],
    gender: mapGender(dbPatient.sexo),
    birthDate: dbPatient.fecha_nacimiento,
    telecom: [
      ...(dbPatient.telefono_movil ? [{
        system: 'phone',
        value: dbPatient.telefono_movil,
        use: 'mobile'
      }] : []),
      ...(dbPatient.email ? [{
        system: 'email',
        value: dbPatient.email
      }] : [])
    ],
    address: [{
      use: 'home',
      line: [dbPatient.direccion].filter(Boolean),
      city: dbPatient.ciudad,
      state: dbPatient.provincia,
      postalCode: dbPatient.codigo_postal,
      country: dbPatient.pais || 'EC'
    }],
    active: dbPatient.activo,
    meta: {
      lastUpdated: dbPatient.updated_at,
      source: '#hosix-patient-service'
    }
  }
}

function mapGender(sexo: string): 'male' | 'female' | 'other' | 'unknown' {
  const mapping: Record<string, 'male' | 'female' | 'other' | 'unknown'> = {
    'M': 'male',
    'F': 'female',
    'O': 'other'
  }
  return mapping[sexo] || 'unknown'
}
```

#### Paso 3: Implementar Endpoints FHIR

```typescript
// supabase/functions/fhir-translator/index.ts
serve(async (req) => {
  const url = new URL(req.url)
  const path = url.pathname
  
  // GET /fhir/r4/Patient?identifier=ppi|2500123456
  if (path === '/fhir/r4/Patient' && req.method === 'GET') {
    const identifier = url.searchParams.get('identifier')
    if (!identifier) {
      return fhirError('Missing identifier parameter', 400)
    }
    
    const [system, value] = identifier.split('|')
    
    if (system === 'http://hosix.health/ppi') {
      const { data: patient, error } = await supabase
        .from('hosix_pacientes')
        .select('*')
        .eq('ppi', value)
        .single()
      
      if (error || !patient) {
        return fhirError('Patient not found', 404)
      }
      
      const fhirPatient = mapDBPatientToFHIR(patient)
      return fhirResponse(fhirPatient)
    }
  }
  
  // POST /fhir/r4/MedicationRequest
  if (path === '/fhir/r4/MedicationRequest' && req.method === 'POST') {
    const fhirRx = await req.json()
    
    // Validar FHIR
    if (!fhirRx.resourceType || fhirRx.resourceType !== 'MedicationRequest') {
      return fhirError('Invalid resource type', 400)
    }
    
    // Mapear a BD
    const dbRx = mapFHIRMedicationRequestToDB(fhirRx)
    
    // Guardar
    const { data: prescription, error } = await supabase
      .from('hosix_cpoe_prescripciones')
      .insert(dbRx)
      .select()
      .single()
    
    if (error) {
      return fhirError(error.message, 500)
    }
    
    // Retornar FHIR con ID
    fhirRx.id = prescription.id
    return fhirResponse(fhirRx, 201)
  }
  
  return fhirError('Not found', 404)
})

function fhirResponse(resource: any, status: number = 200): Response {
  return new Response(JSON.stringify(resource), {
    status,
    headers: {
      'Content-Type': 'application/fhir+json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

function fhirError(message: string, status: number): Response {
  return fhirResponse({
    resourceType: 'OperationOutcome',
    issue: [{
      severity: 'error',
      code: status === 404 ? 'not-found' : 'invalid',
      details: { text: message }
    }]
  }, status)
}
```

---

## 3. EJEMPLOS DE CÓDIGO COMPLETOS

### 3.1 Sistema de Notificaciones Completo

```typescript
// supabase/functions/notifications/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Twilio client (usar Deno compatible)
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_PHONE = Deno.env.get('TWILIO_PHONE')!

serve(async (req) => {
  const { type, recipient, message, template, context } = await req.json()
  const supabase = createClient(...)
  
  if (type === 'sms') {
    // Enviar SMS via Twilio
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE,
          To: recipient,
          Body: message || renderTemplate(template, context)
        })
      }
    )
    
    const result = await response.json()
    
    // Guardar en BD
    await supabase.from('hosix_notificaciones').insert({
      tipo: 'sms',
      destinatario: recipient,
      mensaje: message,
      estado: result.status === 'queued' ? 'enviada' : 'error',
      proveedor: 'twilio',
      proveedor_id: result.sid
    })
    
    return new Response(JSON.stringify({ success: true, sid: result.sid }))
  }
  
  if (type === 'email') {
    // Enviar Email via SendGrid
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!
    
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: recipient }],
          subject: context.subject || 'Notificación HOSIX'
        }],
        from: { email: 'noreply@hosix.health' },
        content: [{
          type: 'text/html',
          value: message || renderTemplate(template, context)
        }]
      })
    })
    
    await supabase.from('hosix_notificaciones').insert({
      tipo: 'email',
      destinatario: recipient,
      mensaje: message,
      estado: emailResponse.ok ? 'enviada' : 'error',
      proveedor: 'sendgrid'
    })
    
    return new Response(JSON.stringify({ success: emailResponse.ok }))
  }
  
  return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 })
})

function renderTemplate(template: string, context: Record<string, any>): string {
  const templates: Record<string, string> = {
    'prescription_ready': `
      Hola ${context.patientName},
      
      Su prescripción está lista para retirar en farmacia.
      Medicamento: ${context.medicationName}
      
      Hospital HOSIX
    `,
    'lab_result_available': `
      Hola ${context.patientName},
      
      Sus resultados de laboratorio están disponibles.
      Acceda a su portal para verlos.
      
      Hospital HOSIX
    `
  }
  
  let message = templates[template] || ''
  for (const [key, value] of Object.entries(context)) {
    message = message.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value)
  }
  
  return message
}
```

---

## 4. TESTING Y VALIDACIÓN

### 4.1 Tests de Edge Functions

```typescript
// tests/fhir-translator.test.ts
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { mapDBPatientToFHIR } from '../supabase/functions/fhir-translator/mappers/patient-mapper.ts'

Deno.test('mapDBPatientToFHIR - Basic mapping', () => {
  const dbPatient = {
    ppi: '2500123456',
    primer_nombre: 'Juan',
    segundo_nombre: 'Carlos',
    primer_apellido: 'Pérez',
    segundo_apellido: 'García',
    fecha_nacimiento: '1985-04-15',
    sexo: 'M',
    telefono_movil: '+593999123456',
    email: 'juan@example.com',
    activo: true
  }
  
  const fhirPatient = mapDBPatientToFHIR(dbPatient)
  
  assertEquals(fhirPatient.resourceType, 'Patient')
  assertEquals(fhirPatient.id, '2500123456')
  assertEquals(fhirPatient.name[0].given, ['Juan', 'Carlos'])
  assertEquals(fhirPatient.name[0].family, 'Pérez García')
  assertEquals(fhirPatient.gender, 'male')
})
```

### 4.2 Tests de Integración

```typescript
// tests/integration/cds-engine.test.ts
Deno.test('CDS Engine - Drug Interaction Detection', async () => {
  const response = await fetch('http://localhost:54321/functions/v1/cds-engine', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prescription: {
        medicamento_id: 'warfarin-id',
        dosis: '5mg',
        paciente_id: 'test-patient-id'
      },
      patientId: 'test-patient-id'
    })
  })
  
  const result = await response.json()
  
  assertEquals(result.alerts.length > 0, true)
  assertEquals(result.alerts[0].tipo, 'interaccion')
})
```

---

## 5. ROLLBACK PLAN

### 5.1 Estrategia de Rollback

1. **Mantener código anterior** en branch `legacy`
2. **Feature flags** para activar/desactivar nuevas funciones
3. **Database migrations reversibles**
4. **Monitoring** para detectar problemas temprano

### 5.2 Feature Flags

```typescript
// src/lib/featureFlags.ts
export const FEATURE_FLAGS = {
  USE_FHIR_ENDPOINTS: import.meta.env.VITE_USE_FHIR === 'true',
  USE_CDS_ENGINE: import.meta.env.VITE_USE_CDS === 'true',
  USE_REALTIME_EVENTS: import.meta.env.VITE_USE_REALTIME === 'true'
}

// Uso
if (FEATURE_FLAGS.USE_CDS_ENGINE) {
  const alerts = await checkCDS(prescription)
} else {
  // Lógica antigua
}
```

---

## 6. CHECKLIST DE MIGRACIÓN

### Pre-Migración
- [ ] Backup completo de BD
- [ ] Documentar arquitectura actual
- [ ] Identificar dependencias críticas
- [ ] Crear plan de rollback

### Durante Migración
- [ ] Implementar Edge Functions una por una
- [ ] Testing exhaustivo de cada función
- [ ] Monitoreo de performance
- [ ] Documentación actualizada

### Post-Migración
- [ ] Validar todas las funcionalidades
- [ ] Performance testing
- [ ] Security audit
- [ ] User acceptance testing

---

**Documento Compilado**: 2025-02-05  
**Estado**: LISTO PARA EJECUCIÓN  
**Próximo Paso**: Implementar Sprint 1 (API Gateway)

