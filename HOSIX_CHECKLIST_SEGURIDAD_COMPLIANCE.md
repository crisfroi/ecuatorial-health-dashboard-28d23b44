# HOSIX - Checklist de Seguridad + Cumplimiento
## 20+ Items Accionables para Protección de Datos Clínicos

> **Versión**: 1.0  
> **Fecha**: 2025-02-05  
> **Scope**: GDPR, HIPAA equivalente, seguridad de datos médicos críticos  
> **Status**: REQUERIDO para Sprint 1-3

---

## 📋 ÍNDICE

1. [Autenticación y Acceso](#1-autenticación-y-acceso)
2. [Encriptación y Criptografía](#2-encriptación-y-criptografía)
3. [Auditoría e Inmutabilidad](#3-auditoría-e-inmutabilidad)
4. [Privacidad de Datos (GDPR)](#4-privacidad-de-datos-gdpr)
5. [Consentimiento Informado](#5-consentimiento-informado)
6. [Seguridad de Infraestructura](#6-seguridad-de-infraestructura)
7. [Firma Digital y PKI](#7-firma-digital-y-pki)
8. [DLP y Prevención de Filtraciones](#8-dlp-y-prevención-de-filtraciones)
9. [Cumplimiento Clínico](#9-cumplimiento-clínico)
10. [Recuperación de Desastres](#10-recuperación-de-desastres)
11. [Matriz de Responsabilidades](#11-matriz-de-responsabilidades)

---

## 1. AUTENTICACIÓN Y ACCESO

### ✅ ITEM 1: OAuth2/OIDC Implementado

**Descripción**: Sistema de autenticación OAuth2/OpenID Connect completamente implementado.

**Criterios de Aceptación**:
- [ ] Endpoint `/authorize` implementado
- [ ] Endpoint `/token` devuelve JWT + refresh token
- [ ] Tokens con expiración (access: 15 min, refresh: 30 días)
- [ ] Refresh token rotativo (nuevo refresh token en cada uso)
- [ ] Revocación inmediata de tokens en logout
- [ ] HTTPS obligatorio para todos los endpoints OAuth2
- [ ] Pruebas de penetración: Sin token = 401, Token expirado = 401
- [ ] Documentación: OpenAPI spec incluye seguridad

**Implementación**:
```typescript
// OAuth2 configuration
POST /oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=<AUTH_CODE>&
client_id=<CLIENT_ID>&
client_secret=<CLIENT_SECRET>

Response:
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "rt_...",
  "scope": "openid profile email read:patients"
}
```

**Responsable**: DevSecOps  
**Sprint**: 1-2  
**Evidencia**: Logs de Supabase Auth, tests pasando

---

### ✅ ITEM 2: Multi-Factor Authentication (MFA)

**Descripción**: MFA obligatorio para usuarios con acceso a datos sensibles.

**Criterios de Aceptación**:
- [ ] SMS OTP implementado (código 6 dígitos, TTL 5 min)
- [ ] TOTP (Time-based OTP) para Google Authenticator/Authy
- [ ] Backup codes generados y almacenados de forma segura
- [ ] MFA obligatorio para roles: médico, farmacéutico, enfermero
- [ ] MFA opcional para pacientes
- [ ] Sin acceso a datos clínicos sin MFA completado
- [ ] Pruebas: Login con MFA incorrecto = reintento, max 3 intentos = bloqueo 15 min
- [ ] Session con MFA tiene flag "mfa_verified": true

**Implementación**:
```typescript
// MFA Setup
POST /mfa/setup
{ "method": "sms", "phone": "+593999999999" }

Response:
{ "mfa_id": "mfa_...", "pending_verification": true }

// Verify MFA
POST /mfa/verify
{ "mfa_id": "mfa_...", "code": "123456" }

Response:
{ "verified": true, "backup_codes": [...] }

// Login con MFA
POST /login
{ "username": "...","password": "..." }
→ { "requires_mfa": true, "mfa_session_id": "..." }

POST /login/mfa-verify
{ "mfa_session_id": "...", "code": "123456" }
→ { "access_token": "...", "mfa_verified": true }
```

**Responsable**: Security Engineer  
**Sprint**: 1-2  
**Evidencia**: MFA logs, test de SMS enviados, backup codes bajo custodía

---

### ✅ ITEM 3: RBAC/ABAC Por Recurso

**Descripción**: Control de acceso granular basado en rol y atributos.

**Criterios de Aceptación**:
- [ ] Tabla `hosix_permisos` mapea usuarios a acciones en recursos
- [ ] Roles predefinidos: admin, médico, enfermero, farmacéutico, paciente, auditador
- [ ] Atributos dinámicos: departamento, servicio, pacientes_asignados
- [ ] Policy enforcement en API Gateway (Kong)
- [ ] RLS (Row-Level Security) en PostgreSQL para datos
- [ ] Médico NO puede ver pacientes de otros departamentos (sin autorización)
- [ ] Enfermero NO puede acceder a prescripciones (solo lectura)
- [ ] Prueba de penetración: Cambio de userId en JWT = 401
- [ ] Audit log de cada acceso denegado

**Implementación**:
```sql
-- RBAC en BD
CREATE TABLE hosix_permisos (
  id UUID PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id),
  recurso VARCHAR(100), -- 'paciente', 'prescripcion', 'auditoria'
  accion VARCHAR(50), -- 'read', 'write', 'delete', 'audit'
  condiciones JSONB, -- {departamento_id: '...', min_role: 'medico'}
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- RLS Policy
CREATE POLICY pacientes_see_own_data ON hosix_pacientes
  USING (
    paciente_user_id = auth.uid() OR
    has_permission(auth.uid(), 'paciente', 'read')
  )
  WITH CHECK (
    paciente_user_id = auth.uid() OR
    has_permission(auth.uid(), 'paciente', 'write')
  );
```

**Responsable**: Backend Lead  
**Sprint**: 3  
**Evidencia**: Matriz de permisos, tests de acceso denegado

---

### ✅ ITEM 4: Timeout de Sesión Automático

**Descripción**: Sesiones se cierran automáticamente después de inactividad.

**Criterios de Aceptación**:
- [ ] Timeout configurable por rol (médico: 30 min, admin: 60 min)
- [ ] Backend valida último acceso cada 5 minutos
- [ ] Frontend envía heartbeat cada 2 minutos
- [ ] Si inactivo > timeout, session.invalidate()
- [ ] Logout automático sin advertencia (política de seguridad)
- [ ] Cookies con HttpOnly, Secure, SameSite=Strict
- [ ] Verificación: Deja tab abierta 35 min → login requerido

**Implementación**:
```typescript
// src/lib/session-timeout.ts
const SESSION_TIMEOUT_MS = {
  'medico': 30 * 60 * 1000,
  'admin': 60 * 60 * 1000,
  'paciente': 120 * 60 * 1000
}

// Middleware
app.use((req, res, next) => {
  const lastActivity = req.session?.lastActivity || Date.now()
  const role = req.user?.role || 'paciente'
  const timeout = SESSION_TIMEOUT_MS[role]
  
  if (Date.now() - lastActivity > timeout) {
    req.session?.destroy()
    return res.status(401).json({ error: 'Session expired' })
  }
  
  req.session.lastActivity = Date.now()
  next()
})
```

**Responsable**: Backend Lead  
**Sprint**: 1-2  
**Evidencia**: Session logs, timeout enforcement tests

---

## 2. ENCRIPTACIÓN Y CRIPTOGRAFÍA

### ✅ ITEM 5: TLS 1.3 Obligatorio

**Descripción**: Toda comunicación en tránsito protegida con TLS 1.3.

**Criterios de Aceptación**:
- [ ] HTTPS en todos los endpoints (no HTTP)
- [ ] Certificado TLS válido (Let's Encrypt o enterprise CA)
- [ ] TLS 1.3 como mínimo (TLS 1.2 si es necesario, pero no TLS 1.1)
- [ ] Ciphers fuertes: ECDHE, AES-256-GCM
- [ ] HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] Certificado renovado antes de expiración
- [ ] SSL Labs report: A+ rating
- [ ] Verificación: curl -I https://api.hosix.com → 200 (no warnings)

**Configuración NGINX**:
```nginx
# nginx.conf
server {
  listen 443 ssl http2;
  ssl_protocols TLSv1.3 TLSv1.2;
  ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;
  
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "no-referrer" always;
  add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
}
```

**Responsable**: DevOps/Security  
**Sprint**: 3  
**Evidencia**: SSL Labs report, HSTS header check, certificate info

---

### ✅ ITEM 6: Encriptación en Reposo (AES-256-GCM)

**Descripción**: Datos sensibles encriptados a nivel de BD.

**Criterios de Aceptación**:
- [ ] Tablas identificadas con datos sensibles: numero_documento, email, ssn, etc.
- [ ] Encriptación con AES-256-GCM (NIST SP 800-38D)
- [ ] IV (Initialization Vector) único por cada encriptación
- [ ] Auth Tag incluido para detección de tampering
- [ ] Claves maestras almacenadas en KMS (Key Management Service)
- [ ] Rotación de claves cada 90 días
- [ ] Campos encriptados no buscables directamente (usar hash one-way para búsqueda)
- [ ] Desencriptación transparente para aplicación (triggers en BD)
- [ ] Verificación: SELECT email FROM pacientes → devuelve valor encriptado (no legible)

**Implementación PostgreSQL**:
```sql
-- Extension para encriptación
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla de claves
CREATE TABLE hosix_encryption_keys (
  key_id VARCHAR(36) PRIMARY KEY,
  algorithm VARCHAR(50), -- 'AES-256-GCM'
  key_material BYTEA NOT NULL,
  created_at TIMESTAMPTZ,
  rotated_at TIMESTAMPTZ,
  next_rotation TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days'),
  active BOOLEAN DEFAULT true
);

-- Tabla de pacientes con campos encriptados
CREATE TABLE hosix_pacientes (
  id UUID PRIMARY KEY,
  ppi VARCHAR(20),
  nombre VARCHAR(255),
  
  -- Campos encriptados
  numero_documento_enc BYTEA,
  email_enc BYTEA,
  telefono_enc BYTEA,
  
  -- Metadatos de encriptación
  email_enc_key_id VARCHAR(36),
  email_enc_algorithm VARCHAR(50),
  email_enc_iv BYTEA,
  email_enc_auth_tag BYTEA,
  
  -- Hash one-way para búsqueda (no reversible)
  email_search_hash VARCHAR(64) GENERATED ALWAYS AS (
    encode(digest(email_enc, 'sha256'), 'hex')
  ) STORED
);

-- Trigger para encriptación automática
CREATE FUNCTION encrypt_paciente_data()
RETURNS TRIGGER AS $$
DECLARE
  master_key BYTEA;
  iv BYTEA;
  auth_tag BYTEA;
BEGIN
  -- Obtener clave maestra
  SELECT key_material INTO master_key
  FROM hosix_encryption_keys
  WHERE active = true AND algorithm = 'AES-256-GCM'
  LIMIT 1;
  
  IF NEW.email IS NOT NULL THEN
    -- Generar IV aleatorio
    iv := gen_random_bytes(16);
    
    -- Encriptar (pgcrypto no soporta GCM nativamente, usar librería)
    -- En producción usar pgcrypto_openssl o función custom en C
    
    NEW.email_enc := pgp_sym_encrypt(NEW.email, master_key);
    NEW.email_search_hash := encode(digest(NEW.email, 'sha256'), 'hex');
    NEW.email := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER encrypt_paciente_insert
BEFORE INSERT ON hosix_pacientes
FOR EACH ROW
EXECUTE FUNCTION encrypt_paciente_data();

-- Función para desencriptación (solo para lectura autorizada)
CREATE FUNCTION decrypt_email(email_enc BYTEA)
RETURNS VARCHAR AS $$
DECLARE
  master_key BYTEA;
  decrypted VARCHAR;
BEGIN
  -- Verificar autorización (auditar)
  INSERT INTO hosix_auditoria_immutable (
    usuario_id, accion, tabla_afectada, timestamp
  ) VALUES (
    current_setting('auth.uid')::UUID, 'decrypt_email', 'pacientes', now()
  );
  
  SELECT key_material INTO master_key
  FROM hosix_encryption_keys
  WHERE active = true LIMIT 1;
  
  decrypted := pgp_sym_decrypt(email_enc::bytea, master_key);
  RETURN decrypted;
END;
$$ LANGUAGE plpgsql;
```

**Responsable**: Database DBA + Security  
**Sprint**: 3  
**Evidencia**: Key rotation logs, encryption verification tests

---

### ✅ ITEM 7: Key Management System (KMS)

**Descripción**: Gestión centralizada de claves criptográficas.

**Criterios de Aceptación**:
- [ ] KMS externo (AWS KMS, Azure Key Vault, o HashiCorp Vault)
- [ ] Claves nunca almacenadas en código o .env
- [ ] Acceso a claves controlado por RBAC
- [ ] Audit log de cada acceso a claves
- [ ] Rotación automática de claves cada 90 días
- [ ] Claves antiguas mantenidas para desencriptación de datos históricos
- [ ] Backup de claves en bóveda segura (offline)
- [ ] Verificación: Intento de acceso a KMS sin credenciales válidas = 403

**Configuración**:
```typescript
// src/lib/kms.ts
import AWS from 'aws-sdk'

const kms = new AWS.KMS()

export async function encryptData(plaintext: string, keyId: string): Promise<string> {
  const result = await kms.encrypt({
    KeyId: keyId,
    Plaintext: plaintext
  }).promise()
  
  return result.CiphertextBlob.toString('base64')
}

export async function decryptData(ciphertext: string): Promise<string> {
  const result = await kms.decrypt({
    CiphertextBlob: Buffer.from(ciphertext, 'base64')
  }).promise()
  
  return result.Plaintext.toString('utf-8')
}

// Audit automático
kms.on('request', (request) => {
  logger.info('KMS Access', {
    operation: request.operation,
    user: getCurrentUserId(),
    timestamp: new Date(),
    keyId: request.params.KeyId
  })
})
```

**Responsable**: DevOps/Security  
**Sprint**: 3  
**Evidencia**: KMS logs, key rotation records, backup verification

---

## 3. AUDITORÍA E INMUTABILIDAD

### ✅ ITEM 8: Auditoría Inmutable con Hash Chaining

**Descripción**: Log de auditoría que no puede ser alterado ni borrado.

**Criterios de Aceptación**:
- [ ] Tabla `hosix_auditoria_immutable` con PRIMARY KEY bigserial (append-only)
- [ ] Hash SHA-256 de cada registro + hash del registro anterior (chain)
- [ ] RLS Policy que NIEGA UPDATE/DELETE en auditoría
- [ ] Validación de integridad: detecta si se modificó algún registro
- [ ] Prueba: Intento de UPDATE en auditoría = Policy violation error
- [ ] Auditoría de ACCESOS (lectura de pacientes, prescripciones)
- [ ] Auditoría de CAMBIOS (creación, actualización, eliminación)
- [ ] Reporte de integridad generado semanalmente (hash chain validated)

**Implementación**:
```sql
-- Tabla inmutable
CREATE TABLE hosix_auditoria_immutable (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  accion VARCHAR(100) NOT NULL,
  tabla_afectada VARCHAR(100),
  registro_id UUID,
  
  -- Datos
  datos_nuevos JSONB,
  datos_anteriores JSONB,
  
  -- Hash chaining
  hash_contenido VARCHAR(64) NOT NULL,
  hash_anterior VARCHAR(64),
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint: hash_anterior must match previous row's hash_contenido
  CONSTRAINT hash_chain_valid CHECK (
    hash_anterior IS NULL OR 
    (SELECT hash_contenido FROM hosix_auditoria_immutable ORDER BY id DESC LIMIT 1 OFFSET 1) = hash_anterior
  )
);

-- RLS: Prevenir modificación
CREATE POLICY auditoria_immutable_no_modify ON hosix_auditoria_immutable
  USING (false) WITH CHECK (false);

ALTER TABLE hosix_auditoria_immutable ENABLE ROW LEVEL SECURITY;

-- Trigger para auditoría automática
CREATE FUNCTION audit_log_immutable()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash VARCHAR(64);
  new_hash VARCHAR(64);
BEGIN
  -- Obtener hash anterior
  SELECT hash_contenido INTO prev_hash
  FROM hosix_auditoria_immutable
  ORDER BY id DESC
  LIMIT 1;
  
  -- Calcular hash nuevo
  new_hash := encode(
    digest(
      NEW.id || NEW.user_id || NEW.accion || NEW.datos_nuevos || now(),
      'sha256'
    ),
    'hex'
  );
  
  -- Insertar en auditoría
  INSERT INTO hosix_auditoria_immutable (
    user_id, accion, tabla_afectada, registro_id,
    datos_nuevos, datos_anteriores,
    hash_contenido, hash_anterior,
    ip_address, user_agent, timestamp
  ) VALUES (
    TG_ARGV[0]::UUID,
    TG_ARGV[1],
    TG_RELNAME,
    NEW.id,
    row_to_json(NEW),
    row_to_json(OLD),
    new_hash,
    prev_hash,
    inet_client_addr(),
    current_setting('request.headers')::json->>'user-agent',
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas críticas
CREATE TRIGGER audit_pacientes
AFTER INSERT OR UPDATE OR DELETE ON hosix_pacientes
FOR EACH ROW
EXECUTE FUNCTION audit_log_immutable(current_setting('auth.uid'), 'PATIENT_CHANGE');

CREATE TRIGGER audit_prescripciones
AFTER INSERT OR UPDATE OR DELETE ON hosix_cpoe_prescripciones
FOR EACH ROW
EXECUTE FUNCTION audit_log_immutable(current_setting('auth.uid'), 'PRESCRIPTION_CHANGE');

-- Función de validación de integridad
CREATE FUNCTION validate_audit_chain()
RETURNS TABLE(valid BOOLEAN, first_invalid_id BIGINT) AS $$
DECLARE
  rec RECORD;
  prev_hash VARCHAR(64);
BEGIN
  prev_hash := NULL;
  
  FOR rec IN
    SELECT id, hash_contenido, hash_anterior
    FROM hosix_auditoria_immutable
    ORDER BY id ASC
  LOOP
    IF rec.hash_anterior != prev_hash THEN
      RETURN QUERY SELECT false, rec.id;
      RETURN;
    END IF;
    prev_hash := rec.hash_contenido;
  END LOOP;
  
  RETURN QUERY SELECT true, NULL;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar validación
SELECT * FROM validate_audit_chain();
```

**Responsable**: Database DBA + Auditor  
**Sprint**: 3  
**Evidencia**: Audit logs, chain validation report, tampering detection tests

---

### ✅ ITEM 9: Auditoría de Acceso a Datos Sensibles

**Descripción**: Registro de quién accedió a qué datos clínicos y cuándo.

**Criterios de Aceptación**:
- [ ] Cada lectura de HCE registrada con usuario, timestamp, IP
- [ ] Cada lectura de prescripciones registrada
- [ ] Cada lectura de resultados de laboratorio registrada
- [ ] Justificación requerida para accesos excepcionales (fuera de asignación)
- [ ] Reporte mensual de accesos: quién accedió a qué
- [ ] Alerta si usuario accede a datos de múltiples pacientes sin justificación
- [ ] Auditoría NO se puede borrar (RLS policy de solo lectura)

**Implementación**:
```typescript
// src/lib/access-audit.ts
import { createClient } from '@supabase/supabase-js'

export async function auditAccessToClinicalData(
  userId: UUID,
  action: 'read' | 'write',
  dataType: 'hce' | 'prescription' | 'labresult',
  resourceId: UUID,
  justification?: string
) {
  await supabase.from('audit_clinical_access').insert({
    user_id: userId,
    action,
    data_type: dataType,
    resource_id: resourceId,
    justification,
    ip_address: getClientIP(),
    user_agent: getUserAgent(),
    timestamp: new Date()
  })
}

// Middleware para auditar acceso a HCE
app.get('/api/v1/patients/:ppi/hce', async (req, res) => {
  const userId = req.user.id
  const patientPPI = req.params.ppi
  
  // Auditar acceso
  await auditAccessToClinicalData(
    userId,
    'read',
    'hce',
    patientPPI,
    null // sin justificación = acceso normal
  )
  
  // Lógica normal
  const hce = await getPatientHCE(patientPPI)
  res.json(hce)
})
```

**Responsable**: Backend Lead + Auditor  
**Sprint**: 3  
**Evidencia**: Access logs, monthly audit report, anomaly detection alerts

---

## 4. PRIVACIDAD DE DATOS (GDPR)

### ✅ ITEM 10: Consentimiento Documentado

**Descripción**: Consentimiento informado registrado y auditable.

**Criterios de Aceptación**:
- [ ] Tabla `hosix_consentimiento` registra cada consentimiento dado
- [ ] Consentimiento versiona: qué tipo, cuándo, por quién, durante cuánto
- [ ] Tipos: procesamiento de datos, investigación, compartir con terceros
- [ ] Firma electrónica requerida (X.509 certificate o biométrica)
- [ ] Consentimiento puede ser revocado en cualquier momento
- [ ] Revocar consentimiento → datos no procesables de esa forma
- [ ] Reporte de consentimientos activos por paciente

**Implementación**:
```sql
CREATE TABLE hosix_consentimiento (
  id UUID PRIMARY KEY,
  paciente_id UUID REFERENCES hosix_pacientes(id),
  
  tipo VARCHAR(100),
  descripcion TEXT,
  
  estado VARCHAR(20), -- 'active', 'revoked'
  fecha_consentimiento TIMESTAMPTZ,
  fecha_revocacion TIMESTAMPTZ,
  
  -- Firma
  firma_electronica VARCHAR(255),
  certificado_x509_id VARCHAR(255),
  
  -- Duración
  valido_hasta TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_consentimiento_paciente_tipo 
ON hosix_consentimiento(paciente_id, tipo, estado);
```

---

### ✅ ITEM 11: Derecho al Olvido (Right to be Forgotten)

**Descripción**: Capacidad de eliminar datos de un paciente (GDPR Art. 17).

**Criterios de Aceptación**:
- [ ] Paciente puede solicitar eliminación de sus datos
- [ ] Solicitud registrada y auditada
- [ ] Revisión por autoridad competente (abogado/DPO)
- [ ] Si aprobada: anonimización (no eliminación total, para BI)
- [ ] Eliminación: en BD principal, backups rotados después de 90 días
- [ ] Datos anonimizados: remove PPI, nombre, contacto; mantener datos clínicos para estadísticas
- [ ] Verificación: Búsqueda de anonimizado → no retorna resultados

**Implementación**:
```sql
-- Función de anonimización
CREATE FUNCTION anonymize_patient(patient_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE hosix_pacientes SET
    ppi = concat('ANON-', substring(md5(ppi), 1, 8)),
    nombre = 'ANON',
    apellido = 'ANON',
    numero_documento = NULL,
    email = NULL,
    telefono = NULL,
    direccion = NULL
  WHERE id = patient_id;
  
  UPDATE hosix_historia_clinica SET
    datos_estructurados = datos_estructurados - 'nombre' - 'contacto'
  WHERE paciente_id = patient_id;
  
  -- Registrar solicitud de RTBF
  INSERT INTO hosix_rtbf_requests (patient_id, action, status, approved_by, timestamp)
  VALUES (patient_id, 'anonymize', 'completed', current_user, now());
END;
$$ LANGUAGE plpgsql;
```

---

## 5. CONSENTIMIENTO INFORMADO

### ✅ ITEM 12: Plantilla de Consentimiento Versionada

**Descripción**: Consentimientos con versionado de términos.

**Criterios de Aceptación**:
- [ ] Cada versión de consentimiento tiene número único (v1.0, v1.1, v2.0)
- [ ] Cambios entre versiones documentados
- [ ] Pacientes firmando v1.0 no vinculados a v2.0
- [ ] Histórico completo de qué versión firmó cada paciente
- [ ] Firma con timestamp y hash SHA-256 del documento

**Implementación**:
```sql
CREATE TABLE hosix_consentimiento_plantillas (
  id UUID PRIMARY KEY,
  nombre VARCHAR(255),
  version VARCHAR(20), -- '1.0', '1.1', '2.0'
  contenido TEXT,
  cambios TEXT, -- describir cambios vs versión anterior
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ
);

CREATE TABLE hosix_consentimiento_firma (
  id UUID PRIMARY KEY,
  paciente_id UUID REFERENCES hosix_pacientes(id),
  plantilla_id UUID REFERENCES hosix_consentimiento_plantillas(id),
  
  firma_electronica BYTEA,
  hash_documento VARCHAR(64),
  timestamp_firma TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_paciente_plantilla_version
ON hosix_consentimiento_firma(paciente_id, plantilla_id);
```

---

## 6. SEGURIDAD DE INFRAESTRUCTURA

### ✅ ITEM 13: Network Segmentation (Firewall)

**Descripción**: Redes segregadas para diferentes componentes.

**Criterios de Aceptación**:
- [ ] API Gateway en DMZ (expuesto a internet)
- [ ] Microservicios en red privada (no accesibles desde internet)
- [ ] BD en red privada aislada (solo conexiones desde microservicios)
- [ ] Firewall rules: solo tráfico necesario permitido
- [ ] WAF (Web Application Firewall) protege API Gateway
- [ ] DDoS protection activado
- [ ] VPN requerida para acceso administrativo

**Diagrama de Red**:
```
Internet → [WAF/DDoS] → [API Gateway - DMZ]
                           ↓
                   [Firewall - permitir solo puertos específicos]
                           ↓
          [Internal Network - Microservicios]
                           ↓
          [Database Network - PostgreSQL]
                           ↓
              [Backup Network - S3/Cold Storage]
```

---

### ✅ ITEM 14: Scanning de Vulnerabilidades

**Descripción**: Escaneo automático de vulnerabilidades.

**Criterios de Aceptación**:
- [ ] Scanning de dependencies (`npm audit`, Snyk)
- [ ] SAST (Static Application Security Testing): SonarQube
- [ ] DAST (Dynamic Application Security Testing): OWASP ZAP
- [ ] Container scanning: Trivy para imágenes Docker
- [ ] Vulnerabilidades críticas/altas = bloquean deploy
- [ ] Reporte semanal de vulnerabilidades
- [ ] Pen testing anual por tercero

**CI/CD Integration**:
```yaml
# .github/workflows/security-scan.yml
jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run SonarQube
        run: sonar-scanner -Dsonar.projectKey=hosix
      - name: Npm audit
        run: npm audit --audit-level=moderate && npm ci

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Run Trivy scan
        run: trivy image registry.hosix.com/service:latest
```

---

## 7. FIRMA DIGITAL Y PKI

### ✅ ITEM 15: Firma Digital de Prescripciones

**Descripción**: Prescripciones firmadas digitalmente con validez legal.

**Criterios de Aceptación**:
- [ ] Médico firma prescripción con certificado X.509
- [ ] Certificado válido (no expirado, emitido por CA confiable)
- [ ] Firma incluye: ID médico, timestamp, hash de documento
- [ ] Verificación de firma: cualquiera puede validar sin clave privada
- [ ] Prescripción firmada NO puede ser modificada
- [ ] Si se intenta modificar, firma se invalida
- [ ] Histórico de todas las firmas

**Implementación**:
```typescript
// src/lib/digital-signature.ts
import { sign, verify } from 'crypto'
import * as fs from 'fs'

export async function signPrescription(
  prescription: Prescription,
  privateKey: string,
  certificate: Certificate
): Promise<SignedPrescription> {
  const data = JSON.stringify({
    prescriptionId: prescription.id,
    patientId: prescription.patientId,
    medicamentos: prescription.medicamentos,
    timestamp: new Date().toISOString()
  })
  
  const signature = sign('sha256', Buffer.from(data), {
    key: privateKey,
    format: 'pem'
  })
  
  return {
    prescription,
    signature: signature.toString('hex'),
    certificateId: certificate.id,
    signedAt: new Date(),
    algorithm: 'SHA256withRSA'
  }
}

export async function verifySignature(
  signed: SignedPrescription,
  publicKey: string
): Promise<boolean> {
  const data = JSON.stringify({
    prescriptionId: signed.prescription.id,
    patientId: signed.prescription.patientId,
    medicamentos: signed.prescription.medicamentos,
    timestamp: signed.signedAt.toISOString()
  })
  
  return verify('sha256', Buffer.from(data), {
    key: publicKey,
    format: 'pem'
  }, Buffer.from(signed.signature, 'hex'))
}
```

---

## 8. DLP Y PREVENCIÓN DE FILTRACIONES

### ✅ ITEM 16: Data Loss Prevention (DLP)

**Descripción**: Prevención de salida no autorizada de datos clínicos.

**Criterios de Aceptación**:
- [ ] Detección de patrones de datos sensibles (SSN, teléfono, email)
- [ ] Alerta si usuario descarga > 100 registros de pacientes
- [ ] Alerta si usuario accede a pacientes no asignados
- [ ] Bloqueo de copy-paste de datos sensibles (frontend)
- [ ] Impresión de historias clínicas solo con autenticación
- [ ] Endpoint para export de datos: auditar y requerir aprobación

**Implementación**:
```typescript
// src/lib/dlp-engine.ts
const SENSITIVE_PATTERNS = {
  ssn: /^\d{3}-\d{2}-\d{4}$/,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^\+?[\d\-\(\)]{10,}$/,
  creditCard: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/
}

export function scanForSensitiveData(text: string): SensitiveDataFound[] {
  const found: SensitiveDataFound[] = []
  
  for (const [type, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
    const matches = text.match(pattern)
    if (matches) {
      found.push({ type, count: matches.length })
    }
  }
  
  return found
}

export async function auditBulkDataAccess(userId: UUID, recordCount: number) {
  if (recordCount > 100) {
    await supabase.from('dlp_alerts').insert({
      user_id: userId,
      alert_type: 'bulk_data_access',
      record_count: recordCount,
      severity: 'high',
      action_taken: 'logged_and_reviewed',
      timestamp: new Date()
    })
    
    // Notificar a seguridad
    await notifySecurityTeam(`Bulk access: ${recordCount} records by ${userId}`)
  }
}
```

---

## 9. CUMPLIMIENTO CLÍNICO

### ✅ ITEM 17: Validación de Datos Clínicos

**Descripción**: Validación de valores clínicos dentro de rangos permitidos.

**Criterios de Aceptación**:
- [ ] Temperatura: 36°C - 40°C
- [ ] FC: 40 - 180 lpm
- [ ] PA sistólica: 60 - 250 mmHg
- [ ] SpO2: 70% - 100%
- [ ] Valores fuera de rango: alerta automática y log
- [ ] Médico puede sobrescribir con justificación

**Implementación**:
```typescript
// src/lib/clinical-validation.ts
const VITAL_RANGES = {
  temperature: { min: 35, max: 42, unit: '°C' },
  heart_rate: { min: 30, max: 200, unit: 'lpm' },
  systolic_bp: { min: 50, max: 270, unit: 'mmHg' },
  diastolic_bp: { min: 30, max: 150, unit: 'mmHg' },
  respiratory_rate: { min: 8, max: 40, unit: 'rpm' },
  oxygen_saturation: { min: 70, max: 100, unit: '%' }
}

export function validateVitalSigns(vitals: VitalSigns): ValidationResult {
  const errors: string[] = []
  
  for (const [field, value] of Object.entries(vitals)) {
    const range = VITAL_RANGES[field]
    if (value < range.min || value > range.max) {
      errors.push(`${field}: ${value}${range.unit} fuera de rango (${range.min}-${range.max})`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: vitals.oxygen_saturation < 94 ? ['Low SpO2, consider oxygen'] : []
  }
}
```

---

## 10. RECUPERACIÓN DE DESASTRES

### ✅ ITEM 18: Backup Automático

**Descripción**: Backups automáticos con recuperación verificada.

**Criterios de Aceptación**:
- [ ] Backup cada 6 horas a S3 (zona diferente)
- [ ] Backups retenidos por 90 días
- [ ] Verificación de integridad de backups (checksums)
- [ ] Prueba de recuperación mensual (restore test)
- [ ] RTO (Recovery Time Objective): < 4 horas
- [ ] RPO (Recovery Point Objective): < 6 horas
- [ ] Compresión y encriptación de backups

**Script**:
```bash
#!/bin/bash
# daily-backup.sh

DB_NAME=hosix_prod
BACKUP_PATH=/backups/daily
S3_BUCKET=s3://hosix-backups

# Crear backup
pg_dump -Fc $DB_NAME > $BACKUP_PATH/hosix-$(date +%Y%m%d-%H%M%S).dump

# Encriptar
gpg --symmetric --cipher-algo AES256 $BACKUP_PATH/hosix-*.dump

# Subir a S3
aws s3 cp $BACKUP_PATH/hosix-*.dump.gpg $S3_BUCKET/daily/

# Limpiar locales > 30 días
find $BACKUP_PATH -name "hosix-*.dump.gpg" -mtime +30 -delete

# Verificar
aws s3 ls $S3_BUCKET/daily/ | tail -5
```

---

### ✅ ITEM 19: Disaster Recovery Plan

**Descripción**: Plan documentado de recuperación ante desastres.

**Criterios de Aceptación**:
- [ ] Documento de DR con paso-a-paso
- [ ] Roles asignados (DR Lead, DB Lead, Network Lead)
- [ ] Runbooks para: pérdida de BD, pérdida de datos, corte de energía
- [ ] Simulacro de DR trimestral
- [ ] Sitio secundario en región diferente (cold standby)
- [ ] Failover automático para DNS

**Ejemplo Runbook**:
```markdown
# DR RUNBOOK: Base de Datos Corrupta

## DETECCIÓN (5 min)
1. Alerta automática de validación de integridad de BD
2. Verificar: SELECT COUNT(*) FROM hosix_auditoria_immutable
3. Si error, confirmar con DBA

## ESCALACIÓN (10 min)
1. Notificar a DR Lead
2. Iniciar llamada de bridge: #dr-incident
3. Pausar escrituras en BD (poner en readonly)

## RECUPERACIÓN (30-60 min)
1. Identificar último backup válido
2. Provisionar nueva BD en standby
3. pg_restore < latest-good-backup.dump
4. Validar integridad: validate_audit_chain()
5. Failover: cambiar DNS a standby
6. Monitoreo: 24h de logs antes de desactivar original
```

---

### ✅ ITEM 20: Monitoring y Alerting

**Descripción**: Monitoreo 24/7 de seguridad y disponibilidad.

**Criterios de Aceptación**:
- [ ] PagerDuty configurado para alertas críticas
- [ ] Alertas: DB down, API error rate > 5%, unauthorized access attempts
- [ ] Response time SLA: < 5 min para críticas, < 30 min para altas
- [ ] Oncall rotation con 2 personas mínimo
- [ ] Post-mortem para cada incidente

**Alertas**:
```yaml
alerts:
  - name: DatabaseDown
    condition: down_for_2_min
    severity: critical
    action: page_on_call_dba
    
  - name: UnauthorizedAccessAttempts
    condition: failed_logins > 5_in_5_min
    severity: high
    action: page_security_lead_and_block_ip
    
  - name: DataExfiltration
    condition: bulk_download_from_patient_service
    severity: critical
    action: page_ciso_and_sec_ops
    
  - name: AuditChainBroken
    condition: hash_validation_fails
    severity: critical
    action: page_compliance_officer_and_freeze_access
```

---

## 11. MATRIZ DE RESPONSABILIDADES

| Item | Descripción | Owner | Sprint | Evidencia |
|------|-------------|-------|--------|-----------|
| 1 | OAuth2/OIDC | DevSecOps | 1-2 | Logs Supabase Auth |
| 2 | MFA | Security | 1-2 | MFA verification tests |
| 3 | RBAC/ABAC | Backend | 3 | Permission matrix |
| 4 | Session timeout | Backend | 1-2 | Session logs |
| 5 | TLS 1.3 | DevOps | 3 | SSL Labs report |
| 6 | Encriptación | DBA | 3 | Encryption tests |
| 7 | KMS | DevOps | 3 | KMS access logs |
| 8 | Auditoría inmutable | DBA | 3 | Audit chain validation |
| 9 | Auditoría de acceso | Backend | 3 | Access logs |
| 10 | Consentimiento | Legal+Dev | 5 | Signed consents |
| 11 | Right to forget | Legal+DBA | 5 | Anonymization tests |
| 12 | Versionado consentimiento | Backend | 5 | Version history |
| 13 | Network segmentation | DevOps | 3 | Firewall rules |
| 14 | Vulnerability scanning | DevSecOps | 2 | Scan reports |
| 15 | Firma digital | Security | 4-5 | Signed prescriptions |
| 16 | DLP | Backend | 4 | DLP alerts |
| 17 | Validación clínica | Clinical+Dev | 4 | Validation tests |
| 18 | Backup automático | DevOps | 2 | Backup logs |
| 19 | DR Plan | DevOps | 3 | DR doc + drills |
| 20 | Monitoring | DevOps | 12 | PagerDuty config |

---

**Total Items**: 20  
**Sprint Crítico**: 1-3 (OAuth2, MFA, encryption, auditoría)  
**Responsable General**: CISO / Security Lead  
**Review Frequency**: Mensual + Audit Anual por Tercero Independiente

**Documento Compilado**: 2025-02-05  
**Próximo**: D) Especificación FHIR + HL7
