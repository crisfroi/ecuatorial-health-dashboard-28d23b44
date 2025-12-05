# HOSIX - Roadmap 12 Sprints Detallado
## Historias de Usuario, Criterios de Aceptación y Plan de Ejecución

> **Versión**: 1.0  
> **Fecha**: 2025-02-05  
> **Duración Total**: 6-8 meses (27-38 semanas)  
> **Equipo Recomendado**: 8-12 desarrolladores  

---

## 📋 ÍNDICE

1. [Estructura de Sprints](#1-estructura-de-sprints)
2. [Sprint 0 (Semana 1) - Correcciones Inmediatas](#2-sprint-0-semana-1---correcciones-inmediatas)
3. [Sprint 1-2 (Semanas 2-4) - IAM Phase 1](#3-sprint-1-2-semanas-2-4---iam-phase-1)
4. [Sprint 3 (Semanas 5-6) - IAM Phase 2 + Security](#4-sprint-3-semanas-5-6---iam-phase-2--security)
5. [Sprint 4 (Semanas 7-8) - Triage + Enfermería Básica](#5-sprint-4-semanas-7-8---triage--enfermería-básica)
6. [Sprint 5-6 (Semanas 9-12) - Enfermería Completa + CPOE](#6-sprint-5-6-semanas-9-12---enfermería-completa--cpoe)
7. [Sprint 7-8 (Semanas 13-16) - CDS + Integration Engine](#7-sprint-7-8-semanas-13-16---cds--integration-engine)
8. [Sprint 9 (Semanas 17-18) - Event Bus + Kafka](#8-sprint-9-semanas-17-18---event-bus--kafka)
9. [Sprint 10 (Semanas 19-20) - Microservicios](#9-sprint-10-semanas-19-20---microservicios)
10. [Sprint 11 (Semanas 21-22) - Kubernetes + DevOps](#10-sprint-11-semanas-21-22---kubernetes--devops)
11. [Sprint 12 (Semanas 23-24) - Observabilidad + DR](#11-sprint-12-semanas-23-24---observabilidad--dr)
12. [Matriz de Dependencias](#12-matriz-de-dependencias)

---

## 1. ESTRUCTURA DE SPRINTS

### 1.1 Overview

| Sprint | Semanas | Fase | Objetivos | Story Points |
|--------|---------|------|-----------|--------------|
| **0** | 1 | Fixes | Correcciones SQL, completar ADM 12.0 | 20 |
| **1-2** | 2-4 | Security | OAuth2, MFA, RBAC | 40 |
| **3** | 5-6 | Security | API Gateway, TLS, Auditoría | 35 |
| **4** | 7-8 | Clinical | Triage, Enfermería básica | 45 |
| **5-6** | 9-12 | Clinical | Enfermería completa, CPOE | 60 |
| **7-8** | 13-16 | Integration | CDS, FHIR, HL7 | 50 |
| **9** | 17-18 | Infra | Event Bus, Kafka | 35 |
| **10** | 19-20 | Infra | Microservicios | 50 |
| **11** | 21-22 | Infra | Kubernetes, autoscaling | 40 |
| **12** | 23-24 | Ops | Observabilidad, DR, BI | 35 |
| **TOTAL** | **27-38 semanas** | - | **34 módulos completos** | **410 SP** |

### 1.2 Velocidad de Equipo

```
Equipo recomendado: 8-12 desarrolladores
Velocidad estimada: 40-50 story points/semana
Duración total: 410 SP / 45 SP/semana = ~9 semanas
Duración real (con integración): 27-38 semanas
```

---

## 2. SPRINT 0 (Semana 1) - Correcciones Inmediatas

### 🎯 Objetivo
Resolver bloqueadores SQL y completar módulo de Compras pendiente.

### 📋 User Stories

#### US-0001: Corregir Error SQL 42P17 en Almacenes

**Descripción**:  
Como **DBA/Developer**, quiero **corregir el error SQL 42P17 en la tabla hosix_stock** para que **la migración de almacenes se ejecute correctamente**.

**Criterios de Aceptación**:
```gherkin
Given: La migración ADM 11.0 genera error "generation expression is not immutable"
When: Aplico la solución de reemplazar CURRENT_DATE con trigger
Then: La tabla hosix_stock se crea sin errores
And: Los triggers generan correctamente la columna calculada
And: Todas las operaciones CRUD funcionan en la tabla
```

**Estimación**: 2 Story Points (1-2 horas)

**Checklist**:
- [ ] Leer error completo en `HOSIX_CORRECCION_ALMACENES_SQL.md`
- [ ] Crear migration SQL con trigger para fecha_entrada_actual
- [ ] Probar inserción, actualización, lectura
- [ ] Ejecutar migración en entorno dev
- [ ] Documentar cambio en CHANGELOG

**Archivos Afectados**:
```
supabase/migrations/000_fix_almacenes_sql.sql (NUEVO)
code/HOSIX_CORRECCION_ALMACENES_SQL.md (referencia)
```

**Dependencias**:
- Ninguna (bloqueador crítico)

---

#### US-0002: Completar Módulo ADM 12.0 (Compras/Licitaciones)

**Descripción**:  
Como **gerente de compras**, quiero **gestionar presupuestos, licitaciones y órdenes de compra** para que **el proceso de adquisición sea eficiente y auditable**.

**Criterios de Aceptación**:
```gherkin
Scenario: Crear presupuesto anual por departamento
Given: Soy gerente de compras
When: Accedo a /hosix/compras/presupuestos
And: Completo formulario (departamento, monto, año)
Then: Se crea registro en hosix_presupuestos
And: Se registra en auditoría

Scenario: Crear licitación
Given: Presupuesto aprobado
When: Creo licitación con partidas
Then: Se genera número de licitación único
And: Se envía a proveedores seleccionados
And: Se registran ofertas en BD

Scenario: Adjudicación y OC
Given: Ofertas recibidas y evaluadas
When: Adjudico a proveedor ganador
Then: Se genera orden de compra automática
And: Se vincula a stock esperado
```

**Estimación**: 13 Story Points (8-10 horas)

**Componentes a Crear**:
```
src/components/hosix/compras/
├── PresupuestosManager.tsx
├── LicitacionesManager.tsx
├── OfertasManager.tsx
├── AdjudicacionManager.tsx
└── OrdenesCompraManager.tsx
```

**Hooks**:
```
src/hooks/useHosixCompras.ts (CRUD + lógica)
```

**Migraciones SQL**:
```sql
-- hosix_presupuestos
-- hosix_licitaciones
-- hosix_licitaciones_partidas
-- hosix_licitaciones_ofertas
-- hosix_adjudicaciones
-- hosix_ordenes_compra
```

**Dependencias**:
- US-0001 (FIX SQL)

---

### 📊 Sprint 0 Summary

| Story | Estimación | Prioridad | DRI |
|-------|-----------|-----------|-----|
| US-0001 | 2 SP | CRÍTICA | DBA |
| US-0002 | 13 SP | ALTA | Dev Backend |
| **Total** | **15 SP** | - | - |

**Duración**: 1-2 semanas  
**Recursos**: 1 Dev Backend + 1 DBA  
**Definición de Hecho**:
- ✅ Error SQL corregido y migración ejecutada
- ✅ Módulo ADM 12.0 completado con 100% funcionalidad
- ✅ Tests de CRUD pasando
- ✅ Documentación actualizada

---

## 3. SPRINT 1-2 (Semanas 2-4) - IAM Phase 1

### 🎯 Objetivo
Implementar autenticación OAuth2/OIDC y MFA básico.

### 📋 User Stories

#### US-1001: Implementar OAuth2/OpenID Connect

**Descripción**:  
Como **administrador de seguridad**, quiero **reemplazar autenticación básica con OAuth2/OIDC** para que **los usuarios tengan sesiones seguras con revocación inmediata**.

**Criterios de Aceptación**:
```gherkin
Scenario: Login con OAuth2
Given: Un usuario sin sesión
When: Hace clic en "Login HOSIX"
Then: Se redirige a proveedor OAuth2 (ej. Supabase Auth)
And: Autentica con usuario/contraseña
And: Se genera código de autorización
And: Se obtiene JWT access token + refresh token
And: Se redirige a dashboard
And: JWT se almacena en httpOnly cookie

Scenario: Refresh token
Given: Usuario con JWT expirado
When: Hace request a API
Then: Se detecta JWT expirado
And: Se usa refresh token para obtener nuevo JWT
And: Si refresh token inválido, redirige a login

Scenario: Logout
Given: Usuario autenticado
When: Hace clic en "Logout"
Then: Se revoca access token
And: Se revoca refresh token
And: Se limpia sessionStorage
And: Se redirige a login
```

**Estimación**: 13 Story Points (8-10 horas)

**Componentes a Crear**:
```
src/components/hosix/seguridad/
├── OAuth2LoginForm.tsx (login con Google/Azure/Supabase)
├── TokenManager.tsx (display token info)
└── LogoutButton.tsx
```

**Hooks**:
```
src/hooks/useOAuth2.ts (login, logout, token refresh)
src/hooks/useAuthToken.ts (getToken, isExpired, refresh)
```

**Configuración**:
```
src/config/oauth2.config.ts
- clientId, clientSecret, redirectUri
- tokenEndpoint, authEndpoint
- scopes: ['openid', 'profile', 'email', 'offline_access']
```

**Migraciones**:
```sql
ALTER TABLE auth.users ADD COLUMN oauth2_provider VARCHAR(50);
ALTER TABLE auth.users ADD COLUMN oauth2_subject VARCHAR(255) UNIQUE;
ALTER TABLE hosix_usuarios ADD COLUMN ultimo_refresh_token_usage TIMESTAMPTZ;
```

**Dependencias**:
- Sprint 0 completado

**Criterios de Éxito**:
- ✅ Usuario puede hacer login con OAuth2
- ✅ JWT válido generado
- ✅ Refresh token funciona
- ✅ Logout revoca tokens
- ✅ Tests de integración pasando

---

#### US-1002: Implementar MFA (SMS + TOTP)

**Descripción**:  
Como **usuario**, quiero **habilitar autenticación multifactor** para que **mi cuenta tenga protección adicional contra accesos no autorizados**.

**Criterios de Aceptación**:
```gherkin
Scenario: Configurar MFA - SMS
Given: Usuario autenticado con OAuth2
When: Accede a /hosix/configuracion/seguridad/mfa
And: Selecciona "SMS"
And: Ingresa número de teléfono
And: Recibe SMS con código
And: Ingresa código
Then: MFA SMS habilitado
And: En siguiente login, se requiere código SMS

Scenario: Configurar MFA - TOTP
Given: Usuario en seguridad/mfa
When: Selecciona "TOTP"
And: Se genera QR code
And: Escanea con Google Authenticator/Authy
And: Ingresa código generado
Then: MFA TOTP habilitado

Scenario: Login con MFA SMS
Given: Usuario con MFA SMS habilitado
When: Se autentica con OAuth2
Then: Se redirige a /login/mfa
And: Se envía SMS con código
And: Ingresa código
And: Se obtiene JWT final
```

**Estimación**: 13 Story Points (8-10 horas)

**Componentes a Crear**:
```
src/components/hosix/seguridad/
├── MFASetup.tsx
│   ├── SMSSetup.tsx
│   └── TOTPSetup.tsx
├── MFAVerification.tsx
│   ├── SMSVerification.tsx
│   └── TOTPVerification.tsx
└── MFAManagement.tsx (listar, deshabilitar métodos)
```

**Hooks**:
```
src/hooks/useMFA.ts (setup, verify, list, disable)
src/hooks/useTOTP.ts (generate QR, validate code)
```

**Supabase Functions** (NUEVA):
```typescript
supabase/functions/send-mfa-sms/index.ts
- Recibe: userId, phoneNumber
- Genera código 6 dígitos
- Envía SMS
- Almacena en Redis con TTL 5 min

supabase/functions/verify-mfa-code/index.ts
- Recibe: userId, code, method (sms/totp)
- Valida código
- Genera sesión MFA verified
```

**Migraciones**:
```sql
CREATE TABLE hosix_mfa_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  method VARCHAR(50) NOT NULL, -- sms, totp
  config JSONB, -- {phoneNumber, secret, backupCodes}
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_mfa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  oauth_token_id VARCHAR(255),
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Dependencias**:
- US-1001 (OAuth2)

---

### 📊 Sprint 1-2 Summary

| Story | Estimación | Prioridad | DRI |
|-------|-----------|-----------|-----|
| US-1001 | 13 SP | CRÍTICA | Dev Auth |
| US-1002 | 13 SP | CRÍTICA | Dev Auth |
| **Total** | **26 SP** | - | - |

**Duración**: 2-3 semanas  
**Recursos**: 2 Dev Backend (Auth specialists)

---

## 4. SPRINT 3 (Semanas 5-6) - IAM Phase 2 + Security

### 🎯 Objetivo
API Gateway, TLS, auditoría inmutable.

### 📋 User Stories

#### US-3001: Implementar API Gateway con OpenAPI

**Descripción**:  
Como **DevOps**, quiero **implementar API Gateway** para que **todas las peticiones pasen por autenticación, rate limiting y logging centralizado**.

**Criterios de Aceptación**:
```gherkin
Scenario: Request mediante API Gateway
Given: Cliente quiere acceder a /api/pacientes
When: Envía request con Authorization header
Then: API Gateway valida JWT
And: Verifica permisos (RBAC/ABAC)
And: Aplica rate limiting (100 req/min por usuario)
And: Registra en log centralizado
And: Reenvía a backend si válido
And: Retorna 401 si token inválido
And: Retorna 429 si rate limit excedido

Scenario: OpenAPI spec generado
Given: API Gateway implementado
When: Accedo a /api-docs
Then: Se muestra OpenAPI 3.0 spec
And: Incluye todos los endpoints
And: Incluye parámetros, responses, security
```

**Estimación**: 13 Story Points (8-10 horas)

**Stack**:
- Kong, AWS API Gateway o NGINX Plus
- OpenAPI Generator para docs

**Archivos**:
```
src/lib/api/openapi-spec.ts (generador de spec)
.github/workflows/api-docs.yml (auto-gen docs)
```

**Dependencias**:
- US-1001 (OAuth2)

---

#### US-3002: TLS 1.3 + Cifrado en Reposo

**Descripción**:  
Como **CISO**, quiero **implementar TLS 1.3 en tránsito y AES-256 en reposo** para que **los datos de pacientes estén protegidos contra eavesdropping**.

**Criterios de Aceptación**:
```gherkin
Scenario: Todas las conexiones en HTTPS
Given: HOSIX en producción
When: Cliente intenta conectar por HTTP
Then: Se redirige automáticamente a HTTPS
And: Certificado TLS 1.3 válido
And: No hay advertencias de seguridad

Scenario: Datos encriptados en reposo
Given: Datos sensibles en BD (SSN, tarjeta, etc)
When: Se consultan desde BD
Then: Se desencriptan automáticamente con KMS
And: El cifrado es AES-256-GCM
And: Las claves se rotan cada 90 días
```

**Estimación**: 16 Story Points (10-12 horas)

**Configuración**:
```
.env:
ENCRYPTION_KEY_ID=uuid-of-master-key
TLS_CERT_PATH=/etc/ssl/certs/hosix.pem
TLS_KEY_PATH=/etc/ssl/private/hosix-key.pem
```

**Migraciones**:
```sql
CREATE TABLE hosix_kms_keys (
  id UUID PRIMARY KEY,
  key_version INT NOT NULL,
  master_key BYTEA NOT NULL,
  created_at TIMESTAMPTZ,
  rotated_at TIMESTAMPTZ,
  next_rotation TIMESTAMPTZ
);

-- Columnas a encriptar:
ALTER TABLE hosix_pacientes ADD COLUMN numero_documento_encriptado BYTEA;
ALTER TABLE hosix_pacientes ADD COLUMN email_encriptado BYTEA;
```

**Dependencias**:
- Infraestructura de KMS

---

#### US-3003: Auditoría Inmutable con Hash Chaining

**Descripción**:  
Como **auditor**, quiero **auditoría inmutable con hash chaining** para que **no pueda alterarse el historial de accesos sin ser detectado**.

**Criterios de Aceptación**:
```gherkin
Scenario: Registro de acceso a HCE
Given: Usuario accede a historia de paciente
When: Lee datos sensibles
Then: Se registra en hosix_auditoria_immutable
And: Se calcula SHA256(previous_hash + action + timestamp)
And: Hash se almacena junto con registro
And: No es posible modificar registro sin romper cadena

Scenario: Validar integridad de auditoría
Given: Auditoría con 1000 registros
When: Ejecuto validación de integridad
Then: Se verifica cada hash vs siguiente
And: Si encuentra alteración, alerta crítica
And: Reporte de integridad generado
```

**Estimación**: 16 Story Points (10-12 horas)

**Migraciones**:
```sql
CREATE TABLE hosix_auditoria_immutable (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100),
  tabla VARCHAR(100),
  registro_id UUID,
  datos_nuevos JSONB,
  datos_anteriores JSONB,
  
  -- Hash chaining
  hash_actual VARCHAR(64) NOT NULL,
  hash_anterior VARCHAR(64),
  
  timestamp TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT hash_chain_integrity 
    CHECK (hash_anterior IS NULL OR length(hash_anterior) = 64)
);

CREATE INDEX idx_auditoria_user_timestamp 
ON hosix_auditoria_immutable(user_id, timestamp DESC);

-- IMMUTABLE: prevenir UPDATE/DELETE
CREATE POLICY auditoria_no_modify ON hosix_auditoria_immutable
  USING (false) WITH CHECK (false);
```

**Función Supabase**:
```typescript
supabase/functions/audit-log-immutable/index.ts
- Calcula SHA256(previous_hash + action + data)
- Inserta registro con hash inmutable
- No permite actualización posterior
```

**Dependencias**:
- US-3001 (API Gateway)

---

### 📊 Sprint 3 Summary

| Story | Estimación | Prioridad | DRI |
|-------|-----------|-----------|-----|
| US-3001 | 13 SP | ALTA | DevOps |
| US-3002 | 16 SP | CRÍTICA | Security Engineer |
| US-3003 | 16 SP | CRÍTICA | Database DBA |
| **Total** | **45 SP** | - | - |

**Duración**: 3-4 semanas

---

## 5. SPRINT 4 (Semanas 7-8) - Triage + Enfermería Básica

### 🎯 Objetivo
Implementar Triage Manchester y primeros módulos de enfermería.

### 📋 User Stories

#### US-4001: Módulo Triage Manchester (ASIS 12.0)

**Descripción**:  
Como **enfermero/a**, quiero **clasificar pacientes en urgencias con escala Manchester** para que **priorice atención según gravedad**.

**Criterios de Aceptación**:
```gherkin
Scenario: Triaje a paciente en urgencias
Given: Paciente en admisión central
When: Enfermero accede a /hosix/urgencias/:id/triage
And: Selecciona discriminador (ej: dolor torácico)
Then: Se presenta árbol de Manchester
And: Responde preguntas (ej: ¿Sudoración? ¿Disnea?)
And: Sistema calcula nivel (1=Rojo, 5=Azul)
And: Se asigna color en tablero
And: Se calcula tiempo meta (0, 10, 60, 120, 240 min)

Scenario: Reassessment de triaje
Given: Paciente triado hace 30 minutos
When: Enfermero hace reassessment
Then: Se evalúa cambio de nivel
And: Si cambio, se actualiza prioridad
And: Se registra razón del cambio
And: Se notifica a médico si sube de nivel
```

**Estimación**: 21 Story Points (13-16 horas)

**Componentes a Crear**:
```
src/components/hosix/triage/
├── TriageClassification.tsx
├── ManchesterTree.tsx (árbol de decisión)
├── TriageDiscriminators.tsx (lista de discriminadores)
├── TriageAlerts.tsx (alertas críticas)
├── ReassessmentPanel.tsx
└── TriageHistoryChart.tsx
```

**Hooks**:
```
src/hooks/useTriageClassification.ts
src/hooks/useManchesterLogic.ts
src/hooks/useTriageReassessment.ts
```

**Migraciones**:
```sql
CREATE TABLE hosix_triage_manchester (
  id UUID PRIMARY KEY,
  urgencia_episodio_id UUID REFERENCES hosix_urgencias_episodios(id),
  paciente_id UUID REFERENCES hosix_pacientes(id),
  
  nivel INT CHECK (nivel BETWEEN 1 AND 5),
  color VARCHAR(20), -- rojo, naranja, amarillo, verde, azul
  tiempo_objetivo_min INT,
  
  discriminadores JSONB,
  signos_vitales JSONB,
  
  enfermero_id UUID,
  fecha_triage TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_triage_reassessment (
  id UUID PRIMARY KEY,
  triage_id UUID REFERENCES hosix_triage_manchester(id),
  nivel_anterior INT,
  nivel_nuevo INT,
  razon TEXT,
  enfermero_id UUID,
  fecha TIMESTAMPTZ DEFAULT now()
);
```

**Datos de Referencia**:
```typescript
// src/data/manchester-tree.ts
export const manchesterDiscriminators = [
  {
    id: 'dolor-toracico',
    nombre: 'Dolor Torácico',
    preguntas: [
      { id: 'sudoracion', text: '¿Sudoración?' },
      { id: 'disnea', text: '¿Disnea?' },
      { id: 'palpitaciones', text: '¿Palpitaciones?' }
    ],
    nivelDefecto: 2 // naranja
  },
  // ... más discriminadores
];
```

**Dependencias**:
- Sprint 3 completado (IAM)

---

#### US-4002: Worklist de Enfermería + Signos Vitales

**Descripción**:  
Como **enfermero/a**, quiero **gestionar worklist de órdenes y tomar signos vitales** para que **documente cuidados de forma rápida**.

**Criterios de Aceptación**:
```gherkin
Scenario: Ver worklist de pacientes
Given: Enfermero inicia turno
When: Accede a /hosix/enfermeria/worklist
Then: Ve lista de pacientes asignados
And: Agrupa por estado (hospitalizados, urgencias)
And: Muestra órdenes pendientes por paciente
And: Codifica por color según urgencia (semáforo)

Scenario: Tomar signos vitales
Given: Paciente en worklist
When: Hace clic en "Tomar constantes"
Then: Se abre formulario rápido
And: Campos: Temperatura, FC, PA, FR, SpO2, Dolor VAS
And: Auto-guarda en tiempo real
And: Alerta si valor fuera de rango crítico
And: Genera gráfico de tendencia (últimas 24h)

Scenario: Alertas de valores críticos
Given: SpO2 < 90%
When: Enfermero ingresa valor
Then: Alerta roja inmediata
And: Se notifica a médico responsable
And: Se registra en auditoría
```

**Estimación**: 21 Story Points (13-16 horas)

**Componentes a Crear**:
```
src/components/hosix/enfermeria/
├── WorklistOrdenes.tsx
├── SignosVitales.tsx
│   ├── SignosVitalesForm.tsx (entrada rápida)
│   ├── SignosVitalesChart.tsx (gráfico tendencia)
│   └── SignosVitalesAlerts.tsx (alertas críticas)
└── OrderStatusPanel.tsx
```

**Hooks**:
```
src/hooks/useEnfermeriWorklist.ts
src/hooks/useSignosVitales.ts
src/hooks/useVitalsAlerts.ts
```

**Migraciones**:
```sql
CREATE TABLE hosix_enfermeria_worklist (
  id UUID PRIMARY KEY,
  episodio_id UUID,
  paciente_id UUID,
  turno VARCHAR(20), -- mañana, tarde, noche
  
  -- Órdenes
  ordenes JSONB, -- [{id, tipo, descripcion, prioridad, estado}]
  
  enfermero_asignado_id UUID,
  estado VARCHAR(30) DEFAULT 'activo',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_enfermeria_signos_vitales (
  id UUID PRIMARY KEY,
  episodio_id UUID,
  paciente_id UUID,
  
  temperatura DECIMAL(4,1),
  frecuencia_cardiaca INT,
  presion_sistolica INT,
  presion_diastolica INT,
  frecuencia_respiratoria INT,
  saturacion_oxigeno INT,
  dolor_vas INT CHECK (dolor_vas >= 0 AND dolor_vas <= 10),
  
  -- Alertas
  tiene_alerta BOOLEAN DEFAULT false,
  tipo_alerta VARCHAR(50),
  
  enfermero_id UUID,
  fecha_toma TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_signos_vitales_paciente_fecha 
ON hosix_enfermeria_signos_vitales(paciente_id, fecha_toma DESC);
```

**Dependencias**:
- US-4001 (Triage)

---

### 📊 Sprint 4 Summary

| Story | Estimación | Prioridad | DRI |
|-------|-----------|-----------|-----|
| US-4001 | 21 SP | CRÍTICA | Clinical Lead |
| US-4002 | 21 SP | CRÍTICA | Frontend Dev |
| **Total** | **42 SP** | - | - |

**Duración**: 2-3 semanas

---

## 6. SPRINT 5-6 (Semanas 9-12) - Enfermería Completa + CPOE

### 🎯 Objetivo
Completar módulos de enfermería y comenzar CPOE.

### 📋 User Stories

#### US-5001: Balance Hídrico + Notas de Enfermería

**Descripción**:  
Como **enfermero/a**, quiero **registrar balance hídrico y notas estructuradas** para que **documente evolución del paciente**.

**Criterios de Aceptación**:
```gherkin
Scenario: Registrar balance hídrico
Given: Enfermero en turno de mañana
When: Accede a /hosix/enfermeria/balance-hidrico/:patientId
And: Ingresa ingresos (oral, IV, SNG) y egresos (orina, vómito, drenaje)
Then: Sistema calcula balance total automáticamente
And: Se almacena por turno (mañana, tarde, noche)
And: Gráfico de tendencia de 7 días visible

Scenario: Registrar nota SOAP
Given: Fin de turno
When: Hace clic en "Nueva nota"
And: Selecciona "SOAP" como formato
Then: Abre formulario con secciones:
  - Subjetivo: ¿Qué dice el paciente?
  - Objetivo: Signos vitales, observaciones
  - Análisis: Interpretación de datos
  - Plan: Plan de cuidados
And: Se guarda automáticamente
And: Opción de firmar digitalmente
```

**Estimación**: 16 Story Points (10-12 horas)

**Componentes a Crear**:
```
src/components/hosix/enfermeria/
├── BalanceHidrico.tsx
│   ├── BalanceHidricoForm.tsx
│   └── BalanceHidricoChart.tsx
└── NotasEnfermeria.tsx
    ├── NotaSOAP.tsx
    ├── NotaSBAR.tsx
    └── NotaNarrativa.tsx
```

**Migraciones**:
```sql
CREATE TABLE hosix_enfermeria_balance_hidrico (
  id UUID PRIMARY KEY,
  paciente_id UUID,
  fecha DATE,
  
  ingreso_oral INT,
  ingreso_iv INT,
  ingreso_sng INT,
  otros_ingresos INT,
  
  egreso_orina INT,
  egreso_vomito INT,
  egreso_drenaje INT,
  egreso_deposiciones INT,
  otros_egresos INT,
  
  balance_total INT GENERATED ALWAYS AS (
    COALESCE(ingreso_oral,0) + COALESCE(ingreso_iv,0) + COALESCE(ingreso_sng,0) +
    COALESCE(otros_ingresos,0) -
    COALESCE(egreso_orina,0) - COALESCE(egreso_vomito,0) - COALESCE(egreso_drenaje,0) -
    COALESCE(egreso_deposiciones,0) - COALESCE(otros_egresos,0)
  ) STORED,
  
  turno VARCHAR(20),
  enfermero_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_enfermeria_notas (
  id UUID PRIMARY KEY,
  paciente_id UUID,
  episodio_id UUID,
  
  tipo VARCHAR(50), -- evolucion, ingreso, egreso
  formato VARCHAR(20), -- soap, sbar, narrativo
  
  subjetivo TEXT,
  objetivo TEXT,
  analisis TEXT,
  plan TEXT,
  
  enfermero_id UUID,
  firmado BOOLEAN DEFAULT false,
  hash_firma VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Dependencias**:
- US-4002 (Worklist)

---

#### US-6001: CPOE + Prescripción Electrónica (ASIS 14.0)

**Descripción**:  
Como **médico**, quiero **prescribir medicamentos electrónicamente con validaciones de seguridad** para que **las prescripciones sean seguras y trazables**.

**Criterios de Aceptación**:
```gherkin
Scenario: Crear prescripción
Given: Médico en worklist de paciente
When: Hace clic en "Nueva prescripción"
And: Selecciona medicamento (búsqueda predictiva)
And: Ingresa dosis, vía, frecuencia, duración
Then: Se valida contra BD de medicamentos
And: Se genera prescripción electrónica
And: Se firma digitalmente con certificado
And: Se envía a farmacia automáticamente

Scenario: Validaciones CDS (Clinical Decision Support)
Given: Médico prescribe Warfarina
When: Sistema detecta que paciente toma Aspirina
Then: Alerta CRÍTICA: "Interacción mayor - Sangrado aumentado"
And: Alerta es FORZOSA (modal)
And: Médico debe seleccionar "Aceptar riesgo" con justificación
And: Justificación se registra en auditoría

Scenario: Dosificación pediátrica
Given: Paciente pediátrico (peso en BD)
When: Médico intenta prescribir dosis de adulto
Then: Alerta: "Dosis máxima para peso: 250mg"
And: Sugiere dosis correcta
And: Permite sobrescribir con justificación
```

**Estimación**: 28 Story Points (17-20 horas)

**Componentes a Crear**:
```
src/components/hosix/cpoe/
├── PrescriptionForm.tsx
│   ├── MedicamentoSearch.tsx
│   ├── DosageCalculator.tsx
│   └── RouteSelector.tsx
├── CDSAlerts.tsx
│   ├── InteractionAlert.tsx
│   ├── AllergiesAlert.tsx
│   ├── DosageAlert.tsx
│   └── DuplicityAlert.tsx
├── PrescriptionReview.tsx
├── ElectronicSignature.tsx
└── PrescriptionHistory.tsx
```

**Hooks**:
```
src/hooks/useCPOE.ts
src/hooks/useCDSEngine.ts
src/hooks/useMedicationValidation.ts
```

**Supabase Functions** (NUEVA):
```typescript
supabase/functions/cds-check-interactions/index.ts
- Recibe: medicamentoid, paciente_id
- Consulta medicamentos actuales del paciente
- Chequea BD de interacciones (DrugBank)
- Retorna alertas con severidad (INFO, WARN, CRÍTICA)

supabase/functions/cds-calculate-dosage/index.ts
- Recibe: medicamento_id, peso, edad, función_renal
- Calcula dosis recomendada
- Retorna rangos min/máx
```

**Migraciones**:
```sql
CREATE TABLE hosix_cpoe_prescripciones (
  id UUID PRIMARY KEY,
  paciente_id UUID,
  medico_id UUID,
  
  medicamento_id UUID,
  dosis VARCHAR(100),
  via VARCHAR(50),
  frecuencia VARCHAR(100),
  duracion_dias INT,
  
  estado VARCHAR(30) DEFAULT 'activa',
  
  -- Firma electrónica
  firmada BOOLEAN DEFAULT false,
  certificado_x509 TEXT,
  hash_firma VARCHAR(255),
  timestamp_firma TIMESTAMPTZ,
  
  -- CDS
  alertas_encontradas JSONB,
  alertas_aceptadas JSONB,
  justificacion TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hosix_cpoe_alertas_cds (
  id UUID PRIMARY KEY,
  prescripcion_id UUID,
  tipo VARCHAR(50), -- interaccion, alergia, dosis, duplicidad
  severidad VARCHAR(20), -- info, warn, critica
  mensaje TEXT,
  accion VARCHAR(30), -- aceptada, ignorada, modificada
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**BD Referencia**:
```typescript
// src/lib/data/drug-interactions.ts
// Exportada de DrugBank API o base de datos local
export const drugInteractions = [
  {
    drug1: 'warfarin',
    drug2: 'aspirin',
    severity: 'CRITICAL',
    description: 'Aumenta riesgo de hemorragia'
  },
  // ... más interacciones
];
```

**Dependencias**:
- US-5001 (Notas de enfermería)
- US-1001 (OAuth2)
- Sprint 3 (Auditoría)

---

### 📊 Sprint 5-6 Summary

| Story | Estimación | Prioridad | DRI |
|-------|-----------|-----------|-----|
| US-5001 | 16 SP | ALTA | Clinical Dev |
| US-6001 | 28 SP | CRÍTICA | Senior Dev |
| **Total** | **44 SP** | - | - |

**Duración**: 3-4 semanas

---

## 7. SPRINT 7-8 (Semanas 13-16) - CDS + Integration Engine

### 🎯 Objetivo
Completar CDS y comenzar FHIR/HL7.

### 📋 Key User Stories

#### US-7001: Clinical Decision Support Engine Completo

**Descripción**:  
Como **farmacéutico/médico**, quiero **motor de reglas clínicas versionado** para que **las decisiones se basen en protocolos actualizados**.

**Criterios de Aceptación**:
```gherkin
Scenario: Ejecutar regla de anticoagulación
Given: Paciente con fibrilación auricular
When: Médico inicia prescripción
Then: CDS Engine carga protocolo "Anticoagulación FA v3.2"
And: Calcula CHADS2-VASc score
And: Recomienda warfarina vs DOAC según score
And: Dosificación automática por edad/peso/función renal

Scenario: Versionado de reglas
Given: CDS Engine con regla v3.1
When: Se libera protocolo v3.2
Then: Regla v3.1 se marca deprecated
And: Nuevos pacientes usan v3.2
And: Pacientes existentes mantienen v3.1 (no se rompe)
And: Historial de versiones auditable
```

**Estimación**: 24 Story Points (15-18 horas)

**Componentes**:
```
src/lib/cds/
├── RuleEngine.ts (motor)
├── ProtocolLibrary.ts (catálogo de protocolos)
├── ScoringCalculators.ts (CHADS2, CURB-65, etc)
└── RuleVersioning.ts (control de versiones)
```

**Dependencias**:
- US-6001 (CPOE)

---

#### US-7002: Integration Engine FHIR R4 + HL7 v2

**Descripción**:  
Como **integrador de sistemas**, quiero **API Gateway que traduzca a FHIR** para que **sea compatible con sistemas externos**.

**Criterios de Aceptación**:
```gherkin
Scenario: Exponer HCE como FHIR
Given: Paciente con historia clínica
When: Sistema externo consulta GET /fhir/Patient/abc123
Then: Retorna recurso FHIR Patient en JSON-LD
And: Incluye: id, name, birthDate, gender, contact
And: Autenticación OAuth2 requerida
And: Logging de acceso en auditoría

Scenario: Recibir resultado de laboratorio vía HL7
Given: LIS envía resultado por HL7 v2.5
When: Recibe ORU^R01 (resultado de laboratorio)
Then: Integration Engine parsea mensaje
And: Extrae: patientId, resultCode, value, reference_range
And: Mapea a BD hosix_laboratorio_resultados
And: Notifica a médico responsable
And: Retorna ACK

Scenario: PACS: Consultar imágenes DICOM
Given: Sistema RIS quiere ver imágenes
When: Consulta GET /fhir/ImagingStudy?patient=abc
Then: Retorna lista de ImagingStudy FHIR
And: Incluye links a imágenes (DICOM via HTTP)
```

**Estimación**: 26 Story Points (16-20 horas)

**Stack**:
- Kong API Gateway + FHIR plugins
- O AWS API Gateway con Lambda transformers

**Componentes**:
```
supabase/functions/
├── fhir-patient-get/index.ts
├── fhir-observation-post/index.ts
├── fhir-medicationrequest-post/index.ts
├── hl7-receive-message/index.ts
└── hl7-oru-processor/index.ts (resultado lab)

src/lib/fhir/
├── PatientMapper.ts
├── ObservationMapper.ts
├── MedicationRequestMapper.ts
├── MedicationDispenseMapper.ts
└── EncounterMapper.ts
```

**Migraciones**:
```sql
CREATE TABLE hosix_integration_log (
  id UUID PRIMARY KEY,
  tipo_integracion VARCHAR(50), -- fhir, hl7v2, dicom
  direccion VARCHAR(10), -- inbound, outbound
  
  mensaje_original TEXT,
  mensaje_procesado JSONB,
  
  resultado VARCHAR(30), -- success, error, warning
  error_message TEXT,
  
  timestamp TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(id, timestamp)
);
```

**Dependencias**:
- Sprint 3 (API Gateway)

---

### 📊 Sprint 7-8 Summary

| Story | Estimación | Prioridad | DRI |
|-------|-----------|-----------|-----|
| US-7001 | 24 SP | ALTA | Clinical Informatics |
| US-7002 | 26 SP | CRÍTICA | Integration Engineer |
| **Total** | **50 SP** | - | - |

---

## 8. SPRINT 9 (Semanas 17-18) - Event Bus + Kafka

### 🎯 Objetivo
Implementar event-driven architecture con Kafka.

### 📋 Key User Stories

#### US-9001: Event Bus (Kafka/RabbitMQ)

**Descripción**:  
Como **DevOps**, quiero **event bus para desacoplar servicios** para que **prescripciones, resultados y notificaciones sean asíncronas**.

**Criterios de Aceptación**:
```gherkin
Scenario: Prescripción generada
Given: Médico crea prescripción
When: Se guarda en BD
Then: Evento "PrescriptionCreated" se publica a Kafka
And: Topic: "prescriptions"
And: Payload: {prescriptionId, patientId, medicamentos[], firmadaPor, timestamp}
And: Farmacia se subscribe y recibe automáticamente
And: Notificación SMS generada automáticamente

Scenario: Resultado de laboratorio recibido
Given: LIS envía resultado
When: Integration Engine parsea ORU
Then: Evento "LabResultReceived" publicado
And: Múltiples consumidores:
  - Actualiza hosix_laboratorio_resultados
  - Genera notificación a médico
  - Actualiza dashboard de resultados pendientes
  - Log en sistema de alertas
```

**Estimación**: 18 Story Points (11-14 horas)

**Stack**:
- Kafka (escalable) o RabbitMQ (más simple)
- Docker Compose para desarrollo

**Archivos**:
```
docker-compose.kafka.yml
src/lib/events/
├── EventBus.ts (wrapper)
├── EventTypes.ts (definitions)
├── EventPublisher.ts
└── EventConsumer.ts

supabase/functions/
├── event-consumer-farmacia/index.ts
├── event-consumer-notifications/index.ts
└── event-consumer-auditoria/index.ts
```

**Dependencias**:
- Sprint 7 (Integration Engine)

---

## 9. SPRINT 10 (Semanas 19-20) - Microservicios

### 🎯 Objetivo
Decomposición en microservicios por dominio.

### 📋 Arquitectura

```
Monolito → Microservicios:
├── patient-service (HCE, MPI, Pacientes)
├── orders-service (Órdenes, Laboratorio, Imaging)
├── prescriptions-service (CPOE, Farmacia)
├── appointments-service (Citas, Agendas)
├── notifications-service (SMS, Email, In-app)
├── cds-service (CDS Engine)
├── iam-service (OAuth2, MFA, RBAC)
└── audit-service (Auditoría inmutable)
```

**Estimación**: 30 Story Points (18-24 horas)

**Duración**: 1-2 semanas

---

## 10. SPRINT 11 (Semanas 21-22) - Kubernetes + DevOps

### 🎯 Objetivo
Containerización y orquestación Kubernetes.

### 📋 Entregables

- ✅ Dockerfile para cada microservicio
- ✅ Helm charts para despliegue
- ✅ Ingress + Service Mesh (Istio)
- ✅ Autoscaling basado en CPU/memoria
- ✅ ConfigMaps para environments

**Estimación**: 25 Story Points (15-20 horas)

---

## 11. SPRINT 12 (Semanas 23-24) - Observabilidad + DR

### 🎯 Objetivo
Monitoreo centralizado, alerting y DR.

### 📋 Entregables

- ✅ ELK Stack (Elasticsearch, Logstash, Kibana)
- ✅ Prometheus + Grafana (métricas)
- ✅ Jaeger (distributed tracing)
- ✅ PagerDuty integraciones
- ✅ SLO/SLA: 99.95% uptime, <200ms latencia HCE
- ✅ Backup diarios, DR plan

**Estimación**: 30 Story Points (18-24 horas)

---

## 12. MATRIZ DE DEPENDENCIAS

```
Sprint 0 (Fixes)
    ↓
Sprint 1-2 (OAuth2, MFA)
    ↓
Sprint 3 (API Gateway, TLS, Audit)
    ↓
┌─────────────────────────────────────────┐
│  Sprint 4 (Triage + Enfermería básica)  │
│  Sprint 7-8 (CDS + FHIR)                │
│  (paralelos, comparten Sprint 3 base)   │
└─────────────────────────────────────────┘
    ↓
Sprint 5-6 (Enfermería completa + CPOE)
    ↓
Sprint 9 (Kafka Event Bus)
    ↓
Sprint 10 (Microservicios)
    ↓
Sprint 11 (Kubernetes)
    ↓
Sprint 12 (Observabilidad + DR)
```

---

## 13. RESUMEN FINAL

### 13.1 Total Story Points: 410 SP

| Sprint | SP | Semanas | Paralelo |
|--------|----|---------| ---------|
| 0 | 20 | 1 | No |
| 1-2 | 40 | 2-3 | No |
| 3 | 45 | 5-6 | No |
| 4 | 42 | 7-8 | Sí (con 7-8) |
| 5-6 | 44 | 9-12 | Sí (con 7-8) |
| 7-8 | 50 | 13-16 | Sí (con 4, 5-6) |
| 9 | 35 | 17-18 | No |
| 10 | 50 | 19-20 | No |
| 11 | 40 | 21-22 | No |
| 12 | 35 | 23-24 | No |
| **TOTAL** | **410** | **27-38 sem** | - |

### 13.2 Equipo Recomendado

- **2-3 Frontend Developers** (React/TypeScript)
- **3-4 Backend Developers** (Node.js/TypeScript, Supabase)
- **1-2 DevOps Engineers** (Docker, K8s, Terraform)
- **1 Database DBA** (PostgreSQL optimization)
- **1 Security Engineer** (IAM, encryption, auditing)
- **1 Clinical Informaticist** (CDS, FHIR mapping)
- **1 QA Lead** (testing, performance)

**Total**: 8-12 personas

### 13.3 Definición de Hecho (DoD)

Para cada sprint:
- ✅ Todas las user stories completadas
- ✅ Tests unitarios ≥80% coverage
- ✅ Tests de integración pasando
- ✅ Code review aprobado
- ✅ Documentación actualizada
- ✅ Migraciones DB ejecutadas en dev
- ✅ Sin deuda técnica crítica

### 13.4 Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|--------|-----------|
| Delay en Sprint 0 (SQL error complejo) | Media | Alto | DBA dedicado, plan B |
| Scope creep en CPOE | Alta | Crítico | Product Owner riguroso |
| Performance en K8s | Media | Medio | Load testing temprano (Sprint 8) |
| Integración FHIR con LIS | Media | Alto | Alianza temprana con LIS vendor |
| Adopción de CDS por médicos | Alta | Medio | Capacitación y change mgmt |

---

**Documento Compilado**: 2025-02-05  
**Listo para Jira/Kanban**: Sí  
**Próximo paso**: Generar B) Especificación Técnica Integrada
