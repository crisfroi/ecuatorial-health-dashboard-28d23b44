# 🏥 HOSIX - Plan Completo de Separación a Nuevo Repositorio

**Documento Técnico de Arquitectura**  
**Autor**: GitHub Copilot  
**Fecha**: May 26, 2026  
**Estado**: ANÁLISIS COMPLETADO - LISTO PARA IMPLEMENTACIÓN  

---

## 📑 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estado Actual del Acoplamiento](#estado-actual)
3. [Impacto de la Separación](#impacto)
4. [Plan Detallado de Migración](#plan-detallado)
5. [Estimación de Esfuerzo](#estimación)
6. [Riesgos y Mitigación](#riesgos)

---

## RESUMEN EJECUTIVO

### El Problema
HOSIX (Sistema de Gestión Hospitalaria) y RENAPROSA (Registro Nacional de Profesionales Sanitarios) actualmente **comparten la misma base de datos PostgreSQL en Supabase**, creando un acoplamiento fuerte que:

- ❌ Viola el principio de separación de responsabilidades
- ❌ Complica deployments independientes
- ❌ Crea riesgos de integridad de datos (sin separación clara)
- ❌ Dificulta escalabilidad independiente
- ❌ Imposibilita versionado independiente de BD

### La Solución
Crear **HOSIX en su propio repositorio Git con su propia BD PostgreSQL de Supabase**, duplicando los maestros necesarios y estableciendo sincronización controlada si es necesario.

### Beneficios de la Separación
✅ **Infraestructura**: Escalabilidad, backup y recovery independientes  
✅ **Desarrollo**: Equipos independientes, deployments sin bloqueos  
✅ **Negocio**: HOSIX puede venderse/licensiarse como producto separado  
✅ **Riesgo**: Falla de HOSIX no afecta RENAPROSA (y viceversa)  
✅ **Datos**: RLS policies y auditoría más granular  

---

## ESTADO ACTUAL DEL ACOPLAMIENTO

### 1. Datos Compartidos (Maestros)

#### Tabla: `profesionales_sanitarios` (RENAPROSA)
**Proporción de Acoplamiento**: ⚠️ **CRÍTICA** (40+ referencias)

```sql
-- HOSIX usa profesionales_sanitarios en 40+ lugares:

hosix_medicos.medico_asignado_id          → profesionales_sanitarios(id)
hosix_quirofanos_programaciones           → profesionales_sanitarios(id) [4 FK]
hosix_cpoe_prescripciones.medico_id       → profesionales_sanitarios(id)
hosix_enfermeria_*.enfermero_id           → profesionales_sanitarios(id)
hosix_urgencias_*.triage_nurse_id         → profesionales_sanitarios(id)
asistencia_fichajes.profesional_id        → profesionales_sanitarios(id)
hosix_asignacion_turnos                   → profesionales_sanitarios(id)
... y 20+ más
```

**Volumen de Datos**: ~500-1000 profesionales (la mayoría médicos activos)

#### Tabla: `centros_salud` (RENAPROSA)
**Proporción de Acoplamiento**: 🟡 **MEDIA** (25+ referencias)

```sql
-- HOSIX usa centros_salud para:
asistencia_turnos.centro_salud_id       → centros_salud(id)
asistencia_cuadrantes.centro_salud_id   → centros_salud(id)
hosix_departamentos.centro_salud_id     → centros_salud(id)
... más referencias
```

**Volumen de Datos**: ~3-5 centros de salud

#### Tabla: `especialidades` (RENAPROSA)
**Proporción de Acoplamiento**: 🟢 **BAJA** (5+ referencias)

```sql
-- HOSIX crea su propia tabla de especialidades por módulo:
hosix_interconsultas_especialidades (catálogo de 20 especialidades)
hosix_servicios (similar a especialidades)
```

### 2. Código Compartido

**Ubicación del Código HOSIX**:
```
/src/pages/Hosix/                    (10 páginas principales)
/src/components/hosix/               (180+ componentes React)
/src/hooks/useHosix*.ts              (15+ custom hooks)
/src/stores/hosix*.ts                (3 Zustand stores)
```

**Tipos de Acoplamiento**:
- ✅ **Débil**: Componentes React (fácil de mover)
- ⚠️ **Medio**: Hooks que llaman supabase.from('profesionales_sanitarios')
- ❌ **Fuerte**: Edge Functions que requieren acceso a RENAPROSA

### 3. Autenticación

**Estado**: SEPARADA pero en mismo schema

```
RENAPROSA:
  - auth.users (Supabase nativo)
  - public.users (tabla personalizada de RENAPROSA)
  
HOSIX:
  - auth.users (mismo Supabase, pero con diferente RLS)
  - hosix_usuarios (tabla propia)
  - hosix_sesiones (sesiones HOSIX)
```

**Implicación**: Necesitará migración de credenciales a nuevo Supabase

---

## IMPACTO DE LA SEPARACIÓN

### Funcionalidades que FUNCIONARÁN Independientemente
✅ **Todo HOSIX** excepto:
- Búsqueda de profesionales (necesita sincronización)
- Búsqueda de centros de salud (necesita sincronización)

### Funcionalidades que REQUIEREN Integración
⚠️ **Operaciones que usan RENAPROSA desde HOSIX**:

1. **Módulo de Asistencia Biométrica**: Lee profesionales_sanitarios para validar código de barras
2. **Nóminas y Pagos**: Accede a profesionales_sanitarios para datos de empleado
3. **Búsqueda Global**: Busca en especialidades de RENAPROSA

### Soluciones para Integración Post-Separación
```
OPCIÓN A: Sincronización Nocturna (Recomendada)
├─ Cron job (via Supabase Crons)
├─ Copia datos profesionales_sanitarios → hosix_profesionales_sanitarios
├─ Ejecuta nightly (1:00 AM UTC)
└─ Latencia: ~24 horas

OPCIÓN B: API REST Gateway (Enterprise)
├─ RENAPROSA expone REST API: GET /api/profesionales
├─ HOSIX llama API con retry + cache local
├─ Latencia: Real-time pero con costo de red
└─ Complejidad: Media (requiere autenticación OAuth2)

OPCIÓN C: Foreign Data Wrapper (FDW) PostgreSQL
├─ Supabase DB A (RENAPROSA) se conecta a DB B (HOSIX)
├─ Crea vista externa: CREATE FOREIGN TABLE...
├─ Latencia: 50-200ms + carga DB
└─ Complejidad: Alta (requiere configuración DevOps)
```

---

## PLAN DETALLADO DE MIGRACIÓN

### FASE 1: PREPARACIÓN (1 semana)

#### 1.1 Auditoría Completa de Referencias
```bash
# Paso 1: Listar todas las referencias a profesionales_sanitarios
grep -r "profesionales_sanitarios" supabase/migrations/ src/

# Paso 2: Crear mapeo de tablas
# Resultado esperado: 40+ referencias encontradas
```

#### 1.2 Crear Schema de Maestros HOSIX
```sql
-- En la BD NUEVA de Supabase (hosix-db):

-- 1. PROFESIONALES SANITARIOS (COPIA ESTRUCTURA + DATOS)
CREATE TABLE hosix_profesionales_sanitarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Copiar exactamente estructura de RENAPROSA
  numero_profesional VARCHAR(50) UNIQUE NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  especialidades JSONB DEFAULT '[]',
  activo BOOLEAN DEFAULT true,
  
  -- Campos de auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  sync_from_renaprosa TIMESTAMP DEFAULT now() -- marca de cuándo se sincronizó
);

-- 2. CENTROS DE SALUD (COPIA ESTRUCTURA + DATOS)
CREATE TABLE hosix_centros_salud (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  tipo_centro VARCHAR(50),
  provincia VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ESPECIALIDADES (COPIA TABLA PROPIA)
CREATE TABLE hosix_especialidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar datos iniciales (será reemplazado por sincronización)
INSERT INTO hosix_profesionales_sanitarios (numero_profesional, nombre_completo)
SELECT numero_profesional, nombre_completo FROM ... -- SEED DATA
```

#### 1.3 Crear Función de Sincronización
```sql
-- Edge Function en Supabase: sync-profesionales-from-renaprosa
-- Endpoint: POST /functions/v1/sync-profesionales-from-renaprosa

export async function handler(req: Request) {
  // 1. Conectar a API de RENAPROSA (o BD remota vía Superbase CLI)
  // 2. Ejecutar SELECT * FROM profesionales_sanitarios WHERE updated_at > last_sync
  // 3. UPSERT en hosix_profesionales_sanitarios
  // 4. Retornar resumen: {synced: 42, skipped: 0, errors: 0}
}
```

### FASE 2: REFACTORIZACIÓN SQL (2 semanas)

#### 2.1 Actualizar Migraciones SQL

**Archivo**: `supabase/migrations/20250116_001_hosix_base_schema.sql`

```diff
-- ANTES (acoplado a RENAPROSA):
CREATE TABLE hosix_medicos_asignacion (
  medico_id UUID REFERENCES profesionales_sanitarios(id) NOT NULL,
  ...
)

-- DESPUÉS (independiente):
CREATE TABLE hosix_medicos_asignacion (
  medico_id UUID REFERENCES hosix_profesionales_sanitarios(id) NOT NULL,
  ...
)
```

**Cambios requeridos**: ~40 archivos SQL, ~70+ líneas REFERENCES

#### 2.2 Script de Conversión
```bash
#!/bin/bash
# scripts/refactor-sql-references.sh

# Reemplazar en ALL migrations
for file in supabase/migrations/*.sql; do
  sed -i 's/REFERENCES profesionales_sanitarios/REFERENCES hosix_profesionales_sanitarios/g' "$file"
  sed -i 's/REFERENCES centros_salud/REFERENCES hosix_centros_salud/g' "$file"
  sed -i 's/public\.profesionales_sanitarios/hosix_profesionales_sanitarios/g' "$file"
  sed -i 's/public\.centros_salud/hosix_centros_salud/g' "$file"
done

echo "✅ Referencias actualizadas"
```

### FASE 3: REFACTORIZACIÓN REACT (2-3 semanas)

#### 3.1 Actualizar Hooks

**Archivo**: `src/hooks/useHosixMedicos.ts`

```diff
-- ANTES:
const [profesionales] = useState([])
useEffect(() => {
  supabase
    .from('profesionales_sanitarios')  // ← ACOPLADO
    .select('*')
    .then(...)
}, [])

-- DESPUÉS:
const [profesionales] = useState([])
useEffect(() => {
  supabase
    .from('hosix_profesionales_sanitarios')  // ← INDEPENDIENTE
    .select('*')
    .then(...)
}, [])
```

**Archivos Afectados**:
- `src/hooks/useHosix*.ts` (15 archivos)
- `src/stores/useGuardiasStore.ts` (1 archivo)
- `src/components/hosix/**/*.tsx` (30+ componentes)

#### 3.2 Crear Wrapper (Opcional)
```typescript
// src/hosix/utils/profesionalesAdapter.ts
// Abstrae la tabla de profesionales (fácil cambiar en futuro)

export async function getProfesionales() {
  return supabase.from('hosix_profesionales_sanitarios').select('*')
}

export async function getProfesionalById(id: UUID) {
  return supabase.from('hosix_profesionales_sanitarios').eq('id', id).single()
}
```

### FASE 4: INFRAESTRUCTURA (1 semana)

#### 4.1 Crear Nuevo Proyecto Supabase

```bash
# 1. Ir a https://supabase.com/
# 2. Create new project: "HOSIX" (Región: us-east-1 o más cercana)
# 3. Copiar credenciales:
#    - Project URL
#    - Anon Key
#    - Service Role Key

# 4. Crear .env.local para HOSIX:
VITE_SUPABASE_URL=https://[HOSIX-PROJECT-ID].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

#### 4.2 Crear Nuevo Repositorio Git

```bash
# 1. Crear repo nuevo en GitHub
mkdir hosix-repo && cd hosix-repo
git init

# 2. Copiar solo archivos HOSIX
cp -r ../SERMED2/src/pages/Hosix ./src/
cp -r ../SERMED2/src/components/hosix ./src/
cp -r ../SERMED2/src/hooks/useHosix* ./src/
cp -r ../SERMED2/supabase/migrations/ ./supabase/
cp -r ../SERMED2/.env.example ./

# 3. Eliminar referencias a RENAPROSA
rm -f src/**/*renaprosa*
rm -f src/**/*profesionales-renaprosa*

# 4. Instalar deps y aplicar migraciones
npm install
npm run apply-migrations
```

#### 4.3 Configurar CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy HOSIX

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - run: npm install
      - run: npm run build
      - run: supabase db push  # Aplicar migraciones
      - run: npm run deploy    # Deploy a Vercel/Railway/Render
```

### FASE 5: SINCRONIZACIÓN (1 semana)

#### 5.1 Crear Cron Job

```sql
-- En Supabase: SQL Editor > Cron Jobs

-- Sincronizar profesionales cada día a las 1 AM UTC
select
  cron.schedule(
    'sync-profesionales-diario',
    '0 1 * * *',  -- 1 AM UTC cada día
    $$
      select sync_profesionales_from_api();
    $$
  );
```

#### 5.2 Edge Function para Sincronización

```typescript
// supabase/functions/sync-profesionales/index.ts

import { serve } from "https://deno.land/std@0.132.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

serve(async (req) => {
  try {
    // 1. Obtener últimum sincronización
    const { data: lastSync } = await supabase
      .from('hosix_sync_log')
      .select('last_sync')
      .order('created_at', { ascending: false })
      .limit(1)

    const since = lastSync?.[0]?.last_sync || new Date('2025-01-01')

    // 2. Obtener profesionales actualizados desde RENAPROSA
    // OPCIÓN A: Si acceso directo a BD RENAPROSA
    const { data: profesionales } = await supabase
      .from('profesionales_sanitarios')  // Solo si está disponible en este proyecto
      .select('*')
      .gte('updated_at', since)

    // OPCIÓN B: Si REST API de RENAPROSA
    // const response = await fetch('https://renaprosa-api.geprostec.ec/api/profesionales')

    // 3. Sincronizar en hosix_profesionales_sanitarios
    for (const prof of profesionales) {
      await supabase
        .from('hosix_profesionales_sanitarios')
        .upsert({
          id: prof.id,
          numero_profesional: prof.numero_profesional,
          nombre_completo: prof.nombre_completo,
          // ... más campos
          sync_from_renaprosa: new Date()
        })
    }

    // 4. Guardar log de sincronización
    await supabase
      .from('hosix_sync_log')
      .insert({
        synced_count: profesionales.length,
        last_sync: new Date(),
        status: 'success'
      })

    return new Response(JSON.stringify({
      success: true,
      synced: profesionales.length
    }), { status: 200 })

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

---

## ESTIMACIÓN DE ESFUERZO

| Fase | Tarea | Horas | Desarrolladores |
|------|-------|-------|-----------------|
| **1: Preparación** | Auditoría SQL | 8 | 1 |
| | Schema de maestros | 8 | 1 |
| | Edge Function de sync | 12 | 1 |
| **2: SQL** | Refactorizar 40+ referencias | 16 | 1-2 |
| | Testing migrations | 12 | 1 |
| **3: React** | Actualizar hooks (15 archivos) | 20 | 2 |
| | Actualizar componentes (30+) | 24 | 2 |
| | Testing e2e | 16 | 1 |
| **4: Infraestructura** | Nuevo proyecto Supabase | 4 | 1 |
| | Nuevo repo Git + CI/CD | 8 | 1 |
| **5: Sincronización** | Cron job + Función | 8 | 1 |
| | Testing de sincronización | 8 | 1 |
| **Documentación** | Guías, runbooks | 12 | 1 |
| **TOTAL** | | **176 horas** | **2-3 devs** |

**Duración Real**: 4-6 semanas (asumiendo 40 horas/semana, parallelización)

---

## RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|----------|---------|-----------|
| Referencias SQL no encontradas | Media | Alto | Audit completo + test en staging |
| Inconsistencia de datos en sincronización | Media | Medio | Implementar checksums, auditoría |
| Downtime de HOSIX durante migración | Baja | Crítico | Migración en horario bajo (noche) |
| Componentes React no actualizan tabla | Alta | Medio | Test unitario para cada hook |
| Pérdida de histórico de datos | Baja | Crítico | Backup Pre-migración + restore plan |
| FKs cascada incorrecta (perder datos) | Baja | Crítico | Validar DROP/DELETE en BD staging |

---

## CHECKLIST DE IMPLEMENTACIÓN

### FASE 1: Preparación
- [ ] Auditoría SQL: Listar TODAS las referencias cruzadas
- [ ] Documentar flujos de datos críticos
- [ ] Crear BD de staging para testing
- [ ] Backup completo pre-migración
- [ ] Crear schema de maestros HOSIX

### FASE 2: Refactorización SQL
- [ ] Actualizar 40+ referencias REFERENCES
- [ ] Ejecutar script de refactor-sql
- [ ] Validar sintaxis SQL (eslint)
- [ ] Test de migraciones en staging
- [ ] Verificar integridad de datos

### FASE 3: React
- [ ] Actualizar 15 hooks
- [ ] Refactorizar 30+ componentes
- [ ] Unit tests para cambios
- [ ] E2E tests (Cypress/Playwright)
- [ ] Testing en QA environment

### FASE 4: Infraestructura
- [ ] Crear nuevo proyecto Supabase
- [ ] Configurar credenciales en CI/CD
- [ ] Crear repositorio GitHub
- [ ] Setup automatización (GitHub Actions)
- [ ] Documentar runbooks

### FASE 5: Sincronización
- [ ] Crear Edge Function
- [ ] Implementar Cron job
- [ ] Testing de sincronización
- [ ] Alerts en caso de error
- [ ] Documentación operacional

### PRODUCCIÓN
- [ ] Deploy a staging 1 semana antes
- [ ] Smoke tests (checar todos módulos)
- [ ] Entrenamiento al equipo
- [ ] Plan de rollback (si es necesario)
- [ ] Monitoreo 24/7 primera semana

---

## PRÓXIMAS ACCIONES

1. **Hoy**: Compartir este documento con el equipo
2. **Mañana**: Junta de planificación (estimación final)
3. **Semana 1**: Iniciar FASE 1 (preparación)
4. **Semana 2-6**: Ejecutar FASE 2-5 en paralelo

---

## REFERENCIAS Y DOCUMENTACIÓN

- 📄 **Documentación SQL**: `/supabase/migrations/20250116_*.sql`
- 📄 **Arquitectura HOSIX**: `HOSIX_ARQUITECTURA_SUPABASE_COMPLETA.md`
- 📄 **Componentes React**: `src/components/hosix/`
- 🔗 **Supabase Docs**: https://supabase.com/docs/guides/database/migrations
- 🔗 **GitHub Actions**: https://github.com/features/actions
