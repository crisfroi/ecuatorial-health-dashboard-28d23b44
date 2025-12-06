# Aplicación de Migraciones - Interconsultas (ASIS 11.0)

> **Fecha**: 2025-02-06  
> **Migración**: `20250206_014_hosix_interconsultas_asis_11.sql`  
> **Estado**: ✅ CREADA | ⏳ PENDIENTE APLICAR  
> **Líneas de Código**: 416 líneas de SQL puro

---

## 📋 RESUMEN DE MIGRACIONES PENDIENTES

### Migración Principal: Interconsultas (ASIS 11.0)

**Archivo**: `supabase/migrations/20250206_014_hosix_interconsultas_asis_11.sql`

**Tablas Creadas**:
1. `hosix_interconsultas_especialidades` - Catálogo de especialidades (20 registros semilla)
2. `hosix_interconsultas` - Solicitudes de interconsulta (con número automático INTC-YYYY-00001)
3. `hosix_interconsultas_respuestas` - Respuestas de especialistas
4. `hosix_interconsultas_seguimiento` - Seguimiento clínico
5. `hosix_interconsultas_referrals` - Derivaciones entre instituciones
6. `hosix_interconsultas_comunicaciones` - Comunicación entre profesionales

**Características**:
- ✅ 6 tablas con 17 índices optimizados
- ✅ RLS policies habilitadas
- ✅ Triggers automáticos (generación de números, actualización de estado)
- ✅ 2 vistas útiles (pendientes, respondidas)
- ✅ Funciones SQL para lógica de negocio
- ✅ 20 especialidades precargadas
- ✅ Documentación completa con COMMENT ON

---

## 🚀 MÉTODOS DE APLICACIÓN

### OPCIÓN 1: Supabase CLI (Recomendado)

```bash
# 1. Instalar Supabase CLI si no está instalado
npm install -g supabase

# 2. Autenticarse en Supabase
supabase login

# 3. Enlazar proyecto
supabase link --project-ref wdieynendfjbkbhfovrx

# 4. Ejecutar la migración
supabase db push

# 5. Verificar (opcional)
supabase db list
```

### OPCIÓN 2: Supabase Dashboard (Web)

1. Ir a: https://app.supabase.com/project/wdieynendfjbkbhfovrx/sql/new
2. Copiar todo el contenido de `supabase/migrations/20250206_014_hosix_interconsultas_asis_11.sql`
3. Pegar en el editor SQL del dashboard
4. Hacer clic en "Run"
5. Verificar que no hay errores

### OPCIÓN 3: psql (PostgreSQL CLI)

```bash
# 1. Obtener CONNECTION STRING de Supabase Dashboard
# Settings → Database → Connection String → psql

# 2. Ejecutar migración
psql "postgresql://..." < supabase/migrations/20250206_014_hosix_interconsultas_asis_11.sql

# 3. Verificar tablas creadas
psql "postgresql://..." -c "\dt hosix_interconsultas*"
```

### OPCIÓN 4: MCP (Model Context Protocol)

```javascript
// Usando Node.js con MCP de Supabase
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  'https://wdieynendfjbkbhfovrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4MjkyMSwiZXhwIjoyMDY2MzU4OTIxfQ.X3Irl85Dy5HdZiPsMQUczySZgAT-dDyz7CZKjSn0X8Y'
)

const sql = fs.readFileSync('supabase/migrations/20250206_014_hosix_interconsultas_asis_11.sql', 'utf8')
const { error } = await supabase.rpc('exec', { sql })

if (error) console.error('Error:', error)
else console.log('✅ Migraciones aplicadas')
```

---

## ✅ VERIFICACIÓN POST-APLICACIÓN

### 1. Verificar Tablas Creadas

```sql
-- Ejecutar en SQL Editor de Supabase
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'hosix_interconsultas%';
```

**Resultado esperado**:
```
hosix_interconsultas_especialidades
hosix_interconsultas
hosix_interconsultas_respuestas
hosix_interconsultas_seguimiento
hosix_interconsultas_referrals
hosix_interconsultas_comunicaciones
```

### 2. Verificar Especialidades Precargadas

```sql
SELECT COUNT(*) as total_especialidades FROM hosix_interconsultas_especialidades;
```

**Resultado esperado**: `20`

### 3. Verificar Vistas Creadas

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'hosix_interconsultas_%view%';
```

**Resultado esperado**:
```
hosix_interconsultas_pendientes
hosix_interconsultas_respondidas
```

### 4. Verificar RLS Habilitado

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'hosix_interconsultas%';
```

**Resultado esperado**: Todas con `rowsecurity = true`

### 5. Verificar Índices Creados

```sql
SELECT indexname FROM pg_indexes 
WHERE tablename LIKE 'hosix_interconsultas%';
```

**Resultado esperado**: 17 índices

---

## 🔗 INTEGRACIÓN CON COMPONENTES REACT

### Componentes Existentes

1. **`src/components/hosix/interconsultas/SolicitudesManager.tsx`**
   - ✅ YA EXISTE (155 líneas)
   - Estado: Espera migración SQL
   - Acciones: Listar solicitudes, filtrar por especialidad, búsqueda

2. **Hook**: `src/hooks/useHosixInterconsultas.ts`
   - ✅ YA EXISTE
   - Funciones: Queries y mutations para solicitudes

### Componentes Pendientes

1. **`RespuestasManager.tsx`** - Pendiente
   - Responder solicitudes
   - Hallazgos clínicos
   - Recomendaciones

2. **`SeguimientoManager.tsx`** - Pendiente
   - Seguimiento de recomendaciones
   - Observaciones clínicas
   - Resultados

3. **`ComunicacionesManager.tsx`** - Pendiente
   - Chat/mensajes entre profesionales
   - Aclaraciones y urgencias
   - Adjuntos

---

## ⚠️ TROUBLESHOOTING

### Error: "relation 'hosix_pacientes' does not exist"

**Causa**: Las tablas base no están creadas
**Solución**: Asegurar que se hayan aplicado primero las migraciones base:
- `20250116_001_hosix_base_schema.sql`
- `20250116_002_hosix_pacientes_historia_clinica.sql`

### Error: "function hosix_usuarios does not exist"

**Causa**: Tabla de usuarios no existe
**Solución**: Verificar que `hosix_usuarios` esté en la migración base

### Error: "syntax error near ON DELETE CASCADE"

**Causa**: Sintaxis no soportada en algunas versiones de PostgreSQL
**Solución**: Ya está corregida en esta migración (usar referencias simples)

### Error: "RLS policy not enforced"

**Causa**: RLS no está habilitado por defecto
**Solución**: Las políticas RLS se crean en la migración (manual de ser necesario)

---

## 📊 ESTADÍSTICAS DE MIGRACIÓN

| Métrica | Valor |
|---------|-------|
| Tablas | 6 |
| Índices | 17 |
| Vistas | 2 |
| Funciones SQL | 2 |
| Triggers | 2 |
| Políticas RLS | 4 |
| Datos Semilla | 20 especialidades |
| Líneas de SQL | 416 |
| Tamaño Estimado | ~50 KB |

---

## 📅 PRÓXIMOS PASOS

### Inmediatos (Después de aplicar migración):

1. **Verificar aplicación correcta** ✓ (usar verificación post-aplicación)
2. **Crear componentes pendientes** (RespuestasManager, SeguimientoManager, ComunicacionesManager)
3. **Crear página ASIS 11.0** (`src/pages/Hosix/Interconsultas.tsx`)
4. **Actualizar sidebar** (`src/components/hosix/HosixSidebar.tsx`)
5. **Agregar ruta** (`src/App.tsx`)

### Corto plazo:

1. Testing manual de funcionalidades
2. Validación de RLS policies
3. Optimización de índices si es necesario

### Mediano plazo:

1. ASIS 9.0 Farmacia (completar página y componentes)
2. ASIS 4.0 Obstetricia
3. ASIS 5.0 CRED
4. Testing end-to-end

---

## 📝 NOTAS IMPORTANTES

- **Versión PostgreSQL**: Supabase usa 14+, compatible con todas las características
- **Zona horaria**: TIMESTAMPTZ asume UTC
- **Auditoría**: Todas las tablas tienen `created_at` y campos de auditoría
- **Seguridad**: RLS habilitado en todas las tablas
- **Performance**: 17 índices optimizados para búsquedas frecuentes

---

**Última actualización**: 2025-02-06  
**Estado**: ✅ DOCUMENTO ACTUALIZADO | ⏳ MIGRACIÓN PENDIENTE APLICAR  
**Próximo paso**: Aplicar migración usando uno de los 4 métodos anteriores
