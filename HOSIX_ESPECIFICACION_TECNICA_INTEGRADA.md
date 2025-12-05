# HOSIX - Especificación Técnica Integrada
## Arquitectura, APIs, Seguridad, Interoperabilidad

> **Versión**: 1.0  
> **Fecha**: 2025-02-05  
> **Scope**: Arquitectura completa de microservicios, APIs REST/FHIR, seguridad, observabilidad

---

## 📋 ÍNDICE

1. [Arquitectura General](#1-arquitectura-general)
2. [Microservicios](#2-microservicios)
3. [API Gateway](#3-api-gateway)
4. [Seguridad Integrada](#4-seguridad-integrada)
5. [Base de Datos](#5-base-de-datos)
6. [Interoperabilidad (FHIR/HL7)](#6-interoperabilidad-fhirhl7)
7. [Event-Driven Architecture](#7-event-driven-architecture)
8. [Observabilidad](#8-observabilidad)
9. [Infraestructura (K8s)](#9-infraestructura-k8s)
10. [CI/CD Pipeline](#10-cicd-pipeline)

---

## 1. ARQUITECTURA GENERAL

### 1.1 Diagrama de Arquitectura Objetivo

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTES                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐             │
│  │  Web App    │  │ Mobile App  │  │ Externos API │             │
│  │  (React)    │  │  (React-N)  │  │ (LIS, PACS)  │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘             │
└─────────┼──────────────────┼────────────────┼────────────────────┘
          │                  │                │
          ▼                  ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│              API GATEWAY (Kong / AWS API Gateway)               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • OAuth2/OIDC Authentication                           │   │
│  │ • Rate Limiting (100 req/min por usuario)              │   │
│  │ • Logging & Auditing                                   │   │
│  │ • CORS & Security Headers                              │   │
│  │ • Request/Response transformation                       │   │
│  │ • FHIR endpoint mapping                                │   │
│  │ • OpenAPI 3.0 spec generation                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────┬──────────────────────────────────────────────────┬─────┘
         │                                                   │
┌────────┴────────┐  ┌───────────────┐  ┌────────────────┐ │
│ REST Endpoints  │  │ FHIR Resources│  │ SOAP Gateway   │ │
│ /api/v1/*       │  │ /fhir/r4/*    │  │ (for legacy)   │ │
└─────────────────┘  └───────────────┘  └────────────────┘ │
                                                             │
         ┌───────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MICROSERVICIOS                               │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ PATIENT SERVICE │  │ ORDERS SERV  │  │ PRESCR SERVICE │   │
│  │ • HCE           │  │ • Labs       │  │ • CPOE        │   │
│  │ • MPI           │  │ • Imaging    │  │ • Pharmacy    │   │
│  │ • Patients      │  │ • Procedures │  │ • CDS         │   │
│  └─────────────────┘  └──────────────┘  └────────────────┘   │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ APPTS SERVICE   │  │ IAM SERVICE  │  │ NOTIF SERVICE  │   │
│  │ • Agendas       │  │ • OAuth2     │  │ • SMS          │   │
│  │ • Citas         │  │ • MFA        │  │ • Email        │   │
│  │ • Listas espera │  │ • RBAC/ABAC  │  │ • Push         │   │
│  └─────────────────┘  └──────────────┘  └────────────────┘   │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ AUDIT SERVICE   │  │ INTEGRATION  │  │ ADMIN SERVICE  │   │
│  │ • Immutable log │  │ • FHIR       │  │ • Config       │   │
│  │ • Hash chain    │  │ • HL7        │  │ • BI           │   │
│  │ • Compliance    │  │ • DICOM      │  │ • Reports      │   │
│  └─────────────────┘  └──────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                                            │
         └────────────────┬─────────────────────────┬─┘
                          │                         │
                 ┌────────▼──────────┐   ┌─────────▼──────┐
                 │  MESSAGE BROKER   │   │  SERVICE MESH  │
                 │  (Kafka/RabbitMQ) │   │  (Istio)       │
                 │  • Events         │   │  • Load Bal    │
                 │  • Async tasks    │   │  • Circuit Br  │
                 │  • Dead letter Q   │   │  • Distributed │
                 │  • Retries        │   │    tracing     │
                 └────────┬──────────┘   └────────────────┘
                          │
         ┌────────────────┼────────────────────┐
         │                │                    │
         ▼                ▼                    ▼
┌────────────────┐ ┌────────────────┐ ┌──────────────────┐
│ PostgreSQL DB  │ │ Redis Cache    │ │ S3/Cloud Storage │
│ (Primary)      │ │ (Sessions)     │ │ (Files)          │
│ • RLS enabled  │ │ • Rate limit   │ │ • Backup         │
│ • Immut audit  │ │ • Replication  │ │ • DR             │
│ • Encryption   │ │                │ │ • DICOM images   │
└────────────────┘ └────────────────┘ └──────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────┐
│           OBSERVABILITY STACK                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ ELK Stack: Elasticsearch + Logstash + Kibana │  │
│  │ Prometheus + Grafana (métricas)              │  │
│  │ Jaeger (distributed tracing)                 │  │
│  │ PagerDuty (alerting)                         │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### 1.2 Principios de Diseño

1. **Microservicios por Dominio**: Cada dominio clínico es un servicio
2. **Event-Driven**: Eventos asíncronos para desacoplamiento
3. **API-First**: OpenAPI/FHIR como contratos
4. **Security by Design**: Encriptación, auditoría, MFA
5. **Scalability**: Horizontal scaling en Kubernetes
6. **Observabilidad**: Distributed tracing, logs centralizados

---

## 2. MICROSERVICIOS

### 2.1 Patient Service

**Responsabilidad**: Gestión de pacientes, HCE, MPI

```typescript
// src/services/patient-service/src/index.ts

interface PatientService {
  // Pacientes
  createPatient(data: CreatePatientDTO): Promise<Patient>
  getPatient(ppi: string): Promise<Patient>
  updatePatient(ppi: string, data: UpdatePatientDTO): Promise<Patient>
  searchPatients(query: SearchPatientQuery): Promise<Patient[]>
  detectDuplicates(patient: Patient): Promise<Duplicate[]>
  mergeDuplicates(primaryId: UUID, secondaryId: UUID): Promise<void>

  // HCE
  addToHCE(ppi: string, entry: HCEEntry): Promise<HCEEntry>
  getHCE(ppi: string, filters?: HCEFilter): Promise<HCEEntry[]>
  getHCEByEpisode(episodeId: UUID): Promise<HCEEntry[]>

  // MPI
  syncMPI(changes: MPI Changes): Promise<void>
  getMPIStatus(): Promise<MPIStatus>
  getConsolidatedHistory(ppi: string): Promise<ConsolidatedHistory>
}
```

**Database**:
```sql
-- Tablas principales
hosix_pacientes
hosix_historia_clinica
hosix_mpi_sync_queue
hosix_pacientes_duplicados
```

**API Endpoints**:
```
POST /api/v1/patients (crear)
GET /api/v1/patients/:ppi (obtener)
PUT /api/v1/patients/:ppi (actualizar)
GET /api/v1/patients/search?q=apellido (buscar)
GET /api/v1/patients/:ppi/hce (historia clínica)
POST /api/v1/patients/:ppi/merge (fusionar duplicados)
```

**FHIR Endpoints**:
```
GET /fhir/r4/Patient?identifier=ppi|abc123
GET /fhir/r4/Patient/abc123
POST /fhir/r4/Patient
GET /fhir/r4/Encounter?patient=abc123
```

---

### 2.2 Orders Service

**Responsabilidad**: Órdenes, laboratorio, imagenología

```typescript
interface OrdersService {
  createOrder(order: CreateOrderDTO): Promise<Order>
  getOrder(orderId: UUID): Promise<Order>
  listOrders(filters: OrderFilters): Promise<Order[]>
  updateOrderStatus(orderId: UUID, status: OrderStatus): Promise<void>
  cancelOrder(orderId: UUID, reason: string): Promise<void>

  // Laboratorio
  submitLabRequest(request: LabRequestDTO): Promise<LabOrder>
  receiveLabResult(result: LabResultDTO): Promise<void>
  getLabResults(patientId: UUID): Promise<LabResult[]>

  // Imagenología
  submitImagingRequest(request: ImagingRequestDTO): Promise<ImagingOrder>
  receiveImagingStudy(study: DicomStudyDTO): Promise<void>
}
```

**Integración con FHIR**:
```typescript
// Mapeo automático
Order → FHIR ServiceRequest
LabResult → FHIR Observation
ImagingStudy → FHIR ImagingStudy
```

---

### 2.3 Prescriptions Service

**Responsabilidad**: CPOE, farmacia, CDS

```typescript
interface PrescriptionsService {
  createPrescription(rx: CreateRxDTO): Promise<Prescription>
  validatePrescription(rx: Prescription): Promise<ValidationResult>
  checkCDS(rx: Prescription): Promise<CDSAlert[]>
  signPrescription(rxId: UUID, signature: DigitalSignature): Promise<void>
  dispenseMedicine(rxId: UUID, dispensing: DispensingDTO): Promise<void>

  // CDS
  checkInteractions(medicamentos: Medicamento[]): Promise<Interaction[]>
  checkAllergies(patientId: UUID, medicamento: Medicamento): Promise<Allergy[]>
  calculateDosage(medId: UUID, patient: PatientContext): Promise<DosageRecommendation>
}
```

**CDS Rules** (integradas):
```typescript
// src/services/prescriptions-service/src/cds/rules/
├── interaction-checker.ts (DrugBank API)
├── allergy-checker.ts (SNOMED CT)
├── dosage-calculator.ts (pediátrica, renal)
├── protocol-validator.ts (guías clínicas)
└── rule-engine.ts (motor principal)
```

---

### 2.4 Appointments Service

**Responsabilidad**: Citas, agendas, lista de espera

```typescript
interface AppointmentsService {
  createSchedule(schedule: CreateScheduleDTO): Promise<Schedule>
  getAvailableSlots(scheduleId: UUID, date: Date): Promise<Slot[]>
  bookAppointment(appt: BookAppointmentDTO): Promise<Appointment>
  cancelAppointment(apptId: UUID): Promise<void>
  rescheduleAppointment(apptId: UUID, newDate: Date): Promise<Appointment>
  
  // Listas de espera
  addToWaitlist(request: WaitlistRequestDTO): Promise<void>
  removeFromWaitlist(waitlistId: UUID): Promise<void>
  getWaitlistStats(): Promise<WaitlistStats>
}
```

---

### 2.5 IAM Service

**Responsabilidad**: Autenticación, autorización, MFA

```typescript
interface IAMService {
  // OAuth2/OIDC
  authenticate(credentials: Credentials): Promise<AuthResult>
  refreshToken(refreshToken: string): Promise<AuthResult>
  revokeToken(token: string): Promise<void>

  // MFA
  setupMFA(userId: UUID, method: MFAMethod): Promise<MFASetup>
  verifyMFA(userId: UUID, code: string): Promise<boolean>

  // RBAC/ABAC
  hasPermission(userId: UUID, resource: string, action: string): Promise<boolean>
  listPermissions(userId: UUID): Promise<Permission[]>
  grantPermission(userId: UUID, permission: Permission): Promise<void>
}
```

**Tokens**:
```typescript
// Access Token (JWT 15 min)
{
  sub: userId,
  iat: now,
  exp: now + 15min,
  scope: ['read:patients', 'write:prescriptions'],
  role: 'physician',
  departamento: 'cardiology'
}

// Refresh Token (opaco, 30 días)
```

---

### 2.6 Audit Service

**Responsabilidad**: Auditoría inmutable, cumplimiento

```typescript
interface AuditService {
  log(event: AuditEvent): Promise<void>
  getAuditLog(filters: AuditFilter): Promise<AuditEvent[]>
  verifyIntegrity(fromId: number, toId: number): Promise<IntegrityResult>
  exportForCompliance(): Promise<ComplianceReport>
}

interface AuditEvent {
  id: bigint
  userId: UUID
  action: string
  resource: string
  resourceId: UUID
  dataNew: object
  dataOld: object
  timestamp: DateTime
  ipAddress: string
  
  // Hash chaining
  hashActual: string
  hashAnterior: string
}
```

**Garantías**:
- ✅ Append-only (no se puede modificar registros anteriores)
- ✅ Hash chaining (detección de alteraciones)
- ✅ Inmutable (RLS policy en BD)
- ✅ Distribuida (logs replicados)

---

### 2.7 Notification Service

**Responsabilidad**: SMS, email, notificaciones in-app

```typescript
interface NotificationService {
  sendSMS(phone: string, message: string): Promise<void>
  sendEmail(email: string, subject: string, body: string): Promise<void>
  sendInApp(userId: UUID, notification: Notification): Promise<void>
  
  // Templates
  sendFromTemplate(userId: UUID, template: string, context: object): Promise<void>
}

// Evento trigger
event "PrescriptionCreated" → emit 'send notification to patient & pharmacy'
```

---

## 3. API GATEWAY

### 3.1 Kong Configuration

```yaml
# kong.yml
_format_version: '2.1'

services:
  - name: patient-api
    url: http://patient-service:3000
    routes:
      - name: patient-get
        paths:
          - /api/v1/patients
          - /fhir/r4/Patient
    plugins:
      - name: oauth2
        config:
          scopes:
            - read:patients
            - write:patients
      - name: rate-limiting
        config:
          minute: 100
      - name: request-size-limiting
        config:
          limits:
            application/json: 10485760
      - name: cors
      - name: request-transformer
        config:
          add:
            headers:
              - X-Service-Version:v1

  - name: prescriptions-api
    url: http://prescriptions-service:3000
    routes:
      - name: rx-create
        paths: [/api/v1/prescriptions]
        methods: [POST]
    plugins:
      - name: jwt
        config:
          key_claim_name: sub
      - name: rate-limiting
        config:
          minute: 50  # más restrictivo para prescripciones

consumers:
  - username: external-lis
    acl_groups:
      - name: lis-group
    oauth2_credentials:
      - name: lis-app
        client_id: lis-12345
        client_secret: ${LIS_SECRET}
```

### 3.2 OpenAPI 3.0 Specification

```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: HOSIX API
  version: 1.0.0
  description: Hospital Information System API

servers:
  - url: https://api.hosix.com/api/v1
    description: Production

security:
  - oauth2:
      - read:patients
      - write:patients
      - read:prescriptions
      - write:prescriptions

paths:
  /patients/{ppi}:
    get:
      summary: Obtener paciente por PPI
      parameters:
        - name: ppi
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Paciente encontrado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Patient'
        '401':
          description: No autorizado
        '404':
          description: Paciente no encontrado

    put:
      summary: Actualizar paciente
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdatePatientRequest'
      responses:
        '200':
          description: Actualizado exitosamente

  /prescriptions:
    post:
      summary: Crear prescripción
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePrescriptionRequest'
      responses:
        '201':
          description: Prescripción creada
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Prescription'
        '400':
          description: Validación falló
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CDSAlert'

components:
  schemas:
    Patient:
      type: object
      properties:
        ppi:
          type: string
          pattern: '^[0-9]{10}$'
        nombre:
          type: string
        apellido:
          type: string
        fechaNacimiento:
          type: string
          format: date
        alergias:
          type: array
          items:
            type: object

    CreatePrescriptionRequest:
      type: object
      required: [medicamentoId, dosis, via, frecuencia]
      properties:
        medicamentoId:
          type: string
          format: uuid
        dosis:
          type: string
          example: '500mg'
        via:
          type: string
          enum: [oral, iv, im, sc]
        frecuencia:
          type: string
          example: 'cada 8 horas'
        duracion:
          type: integer
          example: 7

  securitySchemes:
    oauth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://auth.hosix.com/authorize
          tokenUrl: https://auth.hosix.com/token
          refreshUrl: https://auth.hosix.com/refresh
          scopes:
            read:patients: 'Leer datos de pacientes'
            write:patients: 'Crear/actualizar pacientes'
            read:prescriptions: 'Leer prescripciones'
            write:prescriptions: 'Crear/firmar prescripciones'
```

---

## 4. SEGURIDAD INTEGRADA

### 4.1 OAuth2/OIDC Flow

```
┌────────────┐                                    ┌──────────────┐
│   Cliente  │                                    │ Auth Server  │
│            │                                    │ (Supabase)   │
└─────┬──────┘                                    └──────┬───────┘
      │                                                   │
      │─── 1. GET /authorize?client_id=...&redirect_uri  │
      │        &scope=openid%20profile&state=abc123      │
      ├──────────────────────────────────────────────────>│
      │                                                   │
      │                        2. Usuario autenticado     │
      │                           (login form)            │
      │                                                   │
      │                        3. Código de autorización  │
      │<────────────────────────────────────────────────ack123
      │      redirect_uri?code=authcode&state=abc123     │
      │                                                   │
      │─── 4. POST /token                                 │
      │        grant_type=authorization_code&             │
      │        code=authcode&                             │
      │        client_id=xxx&client_secret=yyy            │
      ├──────────────────────────────────────────────────>│
      │                                                   │
      │    5. Access Token + Refresh Token + ID Token    │
      │<──────────────────────────────────────────────────│
      │       {                                            │
      │         "access_token": "eyJhbGc...",            │
      │         "token_type": "Bearer",                  │
      │         "expires_in": 900,                       │
      │         "refresh_token": "opaque_token",         │
      │         "id_token": "eyJhbGc..."                 │
      │       }                                           │
      │                                                   │
      │─── 6. GET /api/v1/patients/:id                    │
      │        Authorization: Bearer eyJhbGc...           │
      ├─────────────────> (API Gateway valida JWT)────>  │
      │                                                   │
      │                    7. Response JSON              │
      │<──────────────────────────────────────────────────│
```

### 4.2 Encryption Strategy

```typescript
// src/lib/security/encryption.ts

import crypto from 'crypto'

class EncryptionService {
  private masterKey: Buffer // KMS
  private algorithm = 'aes-256-gcm'

  encrypt(plaintext: string): EncryptedData {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.masterKey,
      iv
    )
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()
    
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag: authTag.toString('hex'),
      algorithm: this.algorithm,
      keyId: this.getKeyId()
    }
  }

  decrypt(data: EncryptedData): string {
    const decipher = crypto.createDecipheriv(
      data.algorithm,
      this.masterKey,
      Buffer.from(data.iv, 'hex')
    )
    
    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'))
    
    let decrypted = decipher.update(data.encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}

// Uso en BD
const patientData = {
  nombre: 'Juan Pérez',
  email: 'juan@example.com',
  ssn: '1234567890'
}

// En TRIGGER de PostgreSQL
CREATE FUNCTION encrypt_sensitive_data()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ssn IS NOT NULL THEN
    NEW.ssn_encrypted := pgcrypto.pgp_sym_encrypt(
      NEW.ssn,
      current_setting('app.encryption_key')
    )
    NEW.ssn := NULL
  END IF
  RETURN NEW
END;
$$ LANGUAGE plpgsql;
```

### 4.3 Field-Level Encryption Columns

```sql
-- hosix_pacientes con encriptación de campos sensibles
CREATE TABLE hosix_pacientes (
  id UUID PRIMARY KEY,
  ppi VARCHAR(20),
  nombre VARCHAR(255),
  
  -- Campos encriptados
  numero_documento_enc BYTEA,
  email_enc BYTEA,
  telefono_enc BYTEA,
  
  -- Campos de control
  documento_enc_key_id VARCHAR(255),
  documento_enc_algorithm VARCHAR(20),
  
  -- Para búsqueda sin desencriptar (hash one-way)
  email_hash VARCHAR(64) GENERATED ALWAYS AS (
    encode(digest(email_enc, 'sha256'), 'hex')
  ) STORED
);

-- RLS Policy para datos encriptados
CREATE POLICY hosix_pacientes_sensible_access ON hosix_pacientes
  USING (
    -- Solo el dueño o personal médico autorizado
    auth.uid() = paciente_usuario_id OR
    has_role(auth.uid(), 'medico') OR
    has_role(auth.uid(), 'enfermero')
  );
```

### 4.4 Certificate Management (PKI)

```typescript
// src/lib/security/pki.ts

interface DigitalCertificate {
  certId: string
  subject: {
    commonName: string
    organization: string
    country: string
  }
  issuer: string
  validFrom: Date
  validUntil: Date
  publicKey: string
  privateKeyRef: string // solo ref, no guarda private
  serialNumber: string
  thumbprint: string
}

class PKIService {
  // Para firmas digitales de prescripciones
  signPrescription(
    prescription: Prescription,
    certificate: DigitalCertificate
  ): SignedPrescription {
    const data = JSON.stringify(prescription)
    const signature = crypto.sign(
      'sha256',
      Buffer.from(data),
      {
        key: this.getPrivateKeyFromKMS(certificate.privateKeyRef),
        format: 'pem'
      }
    )
    
    return {
      prescription,
      signature: signature.toString('hex'),
      certificate: certificate.certId,
      timestamp: new Date(),
      algorithm: 'SHA256withRSA'
    }
  }

  // Validar firma
  verifySignature(signed: SignedPrescription): boolean {
    const cert = this.getCertificate(signed.certificate)
    const isValid = crypto.verify(
      'sha256',
      Buffer.from(JSON.stringify(signed.prescription)),
      {
        key: cert.publicKey,
        format: 'pem'
      },
      Buffer.from(signed.signature, 'hex')
    )
    
    return isValid && !this.isCertificateExpired(cert)
  }
}
```

---

## 5. BASE DE DATOS

### 5.1 Estrategia de Base de Datos

```
PostgreSQL (primary)
├── Replicación síncrona a standby (HA)
├── WAL archiving para backup
├── Row-Level Security (RLS) habilitado
└── Encriptación en reposo (pgcrypto)
```

### 5.2 RLS Policies

```sql
-- Ejemplo: Usuario no puede ver pacientes sin autorización
CREATE POLICY pacientes_access ON hosix_pacientes
  USING (
    -- Médico: puede ver pacientes asignados
    EXISTS (
      SELECT 1 FROM hosix_medicos_worklist m
      WHERE m.medico_id = auth.uid()
      AND m.paciente_id = hosix_pacientes.id
    )
    OR
    -- Enfermero: puede ver pacientes en su piso
    EXISTS (
      SELECT 1 FROM hosix_hospitalizacion_episodios h
      JOIN hosix_camas c ON h.cama_id = c.id
      WHERE h.paciente_id = hosix_pacientes.id
      AND c.ubicacion_piso = (
        SELECT piso FROM hospitales.empleados
        WHERE user_id = auth.uid()
      )
    )
    OR
    -- Administrador
    has_role(auth.uid(), 'admin')
  );

-- Trigger para auditoría automática
CREATE TRIGGER audit_pacientes_update
AFTER UPDATE ON hosix_pacientes
FOR EACH ROW
EXECUTE FUNCTION audit_log_immutable(
  'hosix_pacientes',
  NEW.id,
  row_to_json(NEW),
  row_to_json(OLD)
);
```

### 5.3 Performance Indexes

```sql
-- Índices clave para lecturas rápidas
CREATE INDEX idx_pacientes_ppi ON hosix_pacientes(ppi);
CREATE INDEX idx_historia_paciente_fecha 
  ON hosix_historia_clinica(paciente_id, created_at DESC);
CREATE INDEX idx_prescripciones_paciente_activas 
  ON hosix_cpoe_prescripciones(paciente_id) 
  WHERE estado = 'activa';
CREATE INDEX idx_signos_vitales_alerta 
  ON hosix_enfermeria_signos_vitales(paciente_id, fecha_toma DESC)
  WHERE tiene_alerta = true;

-- Índice BRIN para logs grandes
CREATE INDEX idx_auditoria_timestamp 
  ON hosix_auditoria_immutable USING BRIN (timestamp DESC);
```

---

## 6. INTEROPERABILIDAD (FHIR/HL7)

### 6.1 FHIR Resources Mapping

```typescript
// src/lib/fhir/mappers/patient-mapper.ts

export function mapPatientToFHIR(dbPatient: DBPatient): FHIR.Patient {
  return {
    resourceType: 'Patient',
    id: dbPatient.ppi,
    identifier: [
      {
        system: 'http://hosix.health/ppi',
        value: dbPatient.ppi
      },
      {
        system: 'http://example.com/documento',
        value: dbPatient.numero_documento
      }
    ],
    name: [
      {
        use: 'official',
        family: dbPatient.primer_apellido,
        given: [dbPatient.primer_nombre, dbPatient.segundo_nombre]
      }
    ],
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
    gender: dbPatient.sexo?.toLowerCase() as 'male' | 'female' | 'other',
    birthDate: dbPatient.fecha_nacimiento.toISOString().split('T')[0],
    address: [
      {
        line: [dbPatient.direccion],
        city: dbPatient.ciudad,
        state: dbPatient.provincia,
        postalCode: dbPatient.codigo_postal,
        country: 'EC'
      }
    ],
    maritalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
          code: dbPatient.estado_civil
        }
      ]
    },
    contact: dbPatient.contactos.map(c => ({
      relationship: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
              code: c.tipo  // 'N' = Next-of-Kin, 'C' = Emergency Contact
            }
          ]
        }
      ],
      name: {
        text: c.nombre
      },
      telecom: [
        {
          system: 'phone',
          value: c.telefono
        }
      ]
    }))
  }
}

// Mapeo inverso (FHIR → BD)
export function mapFHIRPatientToDb(fhirPatient: FHIR.Patient): Partial<DBPatient> {
  const name = fhirPatient.name?.[0]
  return {
    ppi: fhirPatient.id,
    primer_nombre: name?.given?.[0],
    segundo_nombre: name?.given?.[1],
    primer_apellido: name?.family,
    fecha_nacimiento: new Date(fhirPatient.birthDate!),
    sexo: fhirPatient.gender?.charAt(0).toUpperCase(),
    email: fhirPatient.telecom?.find(t => t.system === 'email')?.value,
    telefono_movil: fhirPatient.telecom?.find(t => t.system === 'phone')?.value,
    numero_documento: fhirPatient.identifier?.find(
      i => i.system === 'http://example.com/documento'
    )?.value
  }
}
```

### 6.2 HL7 v2 Interface

```typescript
// src/services/integration-service/src/hl7/processor.ts

import hl7 from 'hl7'

export function parseHL7Message(rawMessage: string): ParsedHL7 {
  const parsed = hl7.parse(rawMessage)
  
  // MSH: Message Header
  const messageType = parsed[0][9][0] // MSH-09
  const messageControl = parsed[0][10][0] // MSH-10
  
  switch (messageType) {
    case 'ORU^R01': // Laboratorio resultado
      return parseLabResult(parsed)
    case 'RGV^O15': // Farmacia
      return parsePharmacyResult(parsed)
    case 'ADT^A01': // Admisión
      return parseAdmission(parsed)
    default:
      throw new Error(`Message type ${messageType} not supported`)
  }
}

function parseLabResult(parsed: any[]): LabResultMessage {
  const obrSegment = parsed.find((seg) => seg[0][0] === 'OBR')
  const obxSegments = parsed.filter((seg) => seg[0][0] === 'OBX')
  
  return {
    messageId: parsed[0][10][0],
    laboratoryId: obrSegment?.[2][0],
    patientId: parsed[1][1][0][0], // PID-03
    results: obxSegments.map((obx) => ({
      testCode: obx[3][0],
      testName: obx[3][1],
      value: obx[5][0],
      unit: obx[6][0],
      referenceRange: obx[7][0],
      abnormalFlag: obx[8][0]
    }))
  }
}

// Generar respuesta HL7
function generateHL7ACK(
  originalMessage: ParsedHL7,
  status: 'AA' | 'AE' | 'AR'
): string {
  const msgControl = originalMessage[0][10][0]
  return [
    ['MSH', '^~\\&', 'HOSIX', 'HOSPITAL', 'LIS', 'LAB', new Date(), msgControl],
    ['MSA', status, msgControl]
  ]
    .map((seg) => seg.join('^'))
    .join('\r')
}
```

### 6.3 DICOM Gateway (PACS Integration)

```typescript
// src/services/integration-service/src/dicom/pacs-gateway.ts

interface PACSGateway {
  // C-STORE: Recibir imágenes DICOM
  receiveStudy(study: DicomStudy): Promise<void>
  
  // C-FIND: Buscar estudios
  findStudies(query: DicomQuery): Promise<DicomStudy[]>
  
  // C-GET: Obtener imágenes
  getStudy(studyInstanceUID: string): Promise<DicomInstance[]>
  
  // C-MOVE: Mover estudios
  moveStudy(studyInstanceUID: string, destination: string): Promise<void>
}

// Mapeo automático a FHIR ImagingStudy
function mapDicomToFHIR(dicomStudy: DicomStudy): FHIR.ImagingStudy {
  return {
    resourceType: 'ImagingStudy',
    id: dicomStudy.studyInstanceUID,
    identifier: [
      {
        system: 'urn:dicom:uid',
        value: `urn:oid:${dicomStudy.studyInstanceUID}`
      }
    ],
    status: 'available',
    modality: dicomStudy.modalities,
    subject: {
      reference: `Patient/${dicomStudy.patientId}`
    },
    started: dicomStudy.studyDate,
    series: dicomStudy.series.map(s => ({
      uid: s.seriesInstanceUID,
      modality: s.modality,
      instance: s.instances.map(i => ({
        uid: i.sopInstanceUID,
        number: i.instanceNumber,
        title: i.title,
        sopclass: i.sopClassUID,
        url: `dicom-web://pacs.hosix.com/studies/${dicomStudy.studyInstanceUID}/series/${s.seriesInstanceUID}/instances/${i.sopInstanceUID}`
      }))
    }))
  }
}
```

---

## 7. EVENT-DRIVEN ARCHITECTURE

### 7.1 Kafka Topic Design

```yaml
# Topics principales
topics:
  - name: patient-events
    partitions: 3
    replication-factor: 2
    events:
      - PatientCreated
      - PatientUpdated
      - PatientMerged
      - PatientDuplicated

  - name: prescription-events
    partitions: 5
    replication-factor: 2
    events:
      - PrescriptionCreated
      - PrescriptionValidated
      - PrescriptionSigned
      - PrescriptionDispensed
      - PrescriptionCompleted

  - name: order-events
    events:
      - OrderCreated
      - OrderUpdated
      - OrderCompleted
      - OrderCancelled

  - name: lab-events
    events:
      - LabRequestCreated
      - LabResultReceived
      - LabResultValidated

  - name: notification-events
    events:
      - NotificationRequested
      - NotificationSent
      - NotificationFailed
```

### 7.2 Event Consumer Implementation

```typescript
// src/services/notification-service/src/consumers/prescription-consumer.ts

import { Kafka } from 'kafkajs'

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: ['kafka:9092']
})

const consumer = kafka.consumer({ groupId: 'notification-service' })

await consumer.subscribe({ topic: 'prescription-events' })

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const event = JSON.parse(message.value.toString())
    
    switch (event.type) {
      case 'PrescriptionCreated':
        // Enviar SMS/Email a paciente y farmacia
        await notificationService.sendPrescriptionNotifications(event)
        break
        
      case 'PrescriptionSigned':
        // Notificar que prescripción está lista en farmacia
        await notificationService.notifyPharmacy(event)
        break
    }
  }
})

// Dead letter queue para retry
const deadLetterTopic = 'prescription-events-dlq'
consumer.on('consumer.crash', ({ error, groupId }) => {
  console.error(`Consumer crash in ${groupId}:`, error)
  // Enviar evento fallido a DLQ con retry logic
})
```

---

## 8. OBSERVABILIDAD

### 8.1 Distributed Tracing (Jaeger)

```typescript
// src/lib/tracing.ts
import { initTracer } from 'jaeger-client'

const initJaeger = (serviceName: string) => {
  const config = {
    serviceName,
    sampler: {
      type: 'const',
      param: 1 // 1 = 100% tracing (cambiar a probabilístico en prod)
    },
    reporter: {
      logSpans: true,
      agentHost: process.env.JAEGER_AGENT_HOST,
      agentPort: process.env.JAEGER_AGENT_PORT
    }
  }
  
  return initTracer(config)
}

// Uso
const tracer = initJaeger('patient-service')

async function getPatient(ppi: string) {
  const span = tracer.startSpan('getPatient')
  span.setTag('patient.ppi', ppi)
  
  try {
    const span2 = tracer.startSpan('db.query', {
      childOf: span
    })
    const result = await db.query('SELECT * FROM patients WHERE ppi=$1', [ppi])
    span2.finish()
    
    return result
  } catch (error) {
    span.setTag('error', true)
    span.log({ event: 'error', message: error.message })
    throw error
  } finally {
    span.finish()
  }
}
```

### 8.2 Prometheus Metrics

```typescript
// src/lib/metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client'

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
})

const prescriptionsCreated = new Counter({
  name: 'prescriptions_created_total',
  help: 'Total prescriptions created',
  labelNames: ['department', 'status']
})

const labResultsProcessingTime = new Histogram({
  name: 'lab_results_processing_seconds',
  help: 'Time to process lab result',
  labelNames: ['test_code']
})

const activePrescriptions = new Gauge({
  name: 'active_prescriptions',
  help: 'Number of active prescriptions',
  labelNames: ['department']
})

// Exportar métricas a /metrics
app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(register.metrics())
})
```

### 8.3 Kibana Dashboard Queries

```json
{
  "dashboard": "HOSIX-Clinical-Insights",
  "panels": [
    {
      "title": "Prescriptions by CDS Alert",
      "query": "type:prescription AND cds_alert_type:*",
      "visualization": "pie"
    },
    {
      "title": "Lab Results Processing Time",
      "query": "type:lab_result AND @timestamp:[now-24h TO now]",
      "metric": "avg(processing_time_ms)"
    },
    {
      "title": "Audit Events - Unauthorized Access Attempts",
      "query": "type:audit AND action:unauthorized AND @timestamp:[now-7d TO now]",
      "visualization": "timeline"
    }
  ]
}
```

---

## 9. INFRAESTRUCTURA (K8s)

### 9.1 Helm Values

```yaml
# helm/hosix/values.yaml

replicaCount: 3

image:
  repository: registry.hosix.com/patient-service
  tag: "1.0.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
  targetPort: 3000

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: api.hosix.com
      paths:
        - path: /api/v1
          pathType: Prefix
  tls:
    - secretName: hosix-api-tls
      hosts:
        - api.hosix.com

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
  targetMemoryUtilizationPercentage: 80

livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5

env:
  - name: NODE_ENV
    value: "production"
  - name: LOG_LEVEL
    value: "info"
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: postgres-credentials
        key: url
  - name: KAFKA_BROKERS
    value: "kafka:9092"
```

---

## 10. CI/CD PIPELINE

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/patient-service.yml

name: Patient Service CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'services/patient-service/**'
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: cd services/patient-service && npm ci
      
      - name: Run linter
        run: cd services/patient-service && npm run lint
      
      - name: Run tests
        run: cd services/patient-service && npm run test -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./services/patient-service/coverage/coverage-final.json

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          docker build -t registry.hosix.com/patient-service:${{ github.sha }} \
            -f services/patient-service/Dockerfile \
            services/patient-service/
      
      - name: Push to registry
        run: |
          echo ${{ secrets.REGISTRY_PASSWORD }} | docker login -u ${{ secrets.REGISTRY_USER }} --password-stdin registry.hosix.com
          docker push registry.hosix.com/patient-service:${{ github.sha }}
          docker tag registry.hosix.com/patient-service:${{ github.sha }} registry.hosix.com/patient-service:latest
          docker push registry.hosix.com/patient-service:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to K8s
        run: |
          helm upgrade --install patient-service ./helm/patient-service \
            --namespace hosix \
            --set image.tag=${{ github.sha }} \
            --kubeconfig=${{ secrets.KUBECONFIG }}
      
      - name: Verify deployment
        run: |
          kubectl rollout status deployment/patient-service -n hosix --timeout=5m
```

---

**Documento Compilado**: 2025-02-05  
**Próximo**: C) Checklist Seguridad + D) Especificación FHIR
