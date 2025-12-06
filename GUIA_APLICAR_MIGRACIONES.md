# 🚀 Guía: Aplicar Migraciones SQL a Supabase

> **Dirigido a**: Otros desarrolladores  
> **Dificultad**: Muy fácil ✅  
> **Tiempo**: 5-15 minutos  
> **Última actualización**: 2025-02-06

---

## 📋 OPCIÓN MÁS FÁCIL: Script Interactivo

Si eres desarrollador y no sabes qué opción usar, simplemente ejecuta:

```bash
npm run apply-migrations
```

Este script te guiará paso a paso y te permitirá elegir el método más adecuado. ✨

---

## 🔧 OPCIONES DISPONIBLES

### OPCIÓN 1: Supabase CLI (Recomendado para desarrollo)

**Requisitos**: Tener Supabase CLI instalado

**Pasos**:

```bash
# 1. Instalar Supabase CLI (una sola vez)
npm install -g supabase

# 2. Autenticarte
supabase login

# 3. Enlazar tu proyecto (una sola vez)
supabase link --project-ref wdieynendfjbkbhfovrx

# 4. Aplicar migraciones
supabase db push

# O usar el comando npm directo:
npm run apply-migrations:cli
```

**Ventajas**:
- ✅ Más simple
- ✅ Interfaz amigable
- ✅ Rastrea automáticamente qué migraciones están aplicadas

---

### OPCIÓN 2: Supabase Dashboard (Manual)

**Requisitos**: Navegador web y acceso a Supabase

**Pasos**:

1. Ir a: https://app.supabase.com
2. Seleccionar proyecto: `wdieynendfjbkbhfovrx`
3. Ir a **SQL Editor** → **New Query**
4. Copiar el contenido del archivo SQL más reciente:
   ```
   supabase/migrations/20250206_014_hosix_interconsultas_asis_11.sql
   ```
5. Pegar el SQL en el editor
6. Hacer clic en **"Run"**

**Ventajas**:
- ✅ No requiere instalación extra
- ✅ Visualización de errores en tiempo real
- ✅ Puedes ver los cambios inmediatamente

**Desventaja**:
- ❌ Manual y más lento

---

### OPCIÓN 3: psql (PostgreSQL CLI)

**Requisitos**: Tener `psql` instalado y conectado a Supabase

**Instalación de psql**:

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Descargar desde: https://www.postgresql.org/download/
```

**Configuración**:

1. Copia `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edita `.env.local` y configura:
   ```env
   SUPABASE_CONNECTION_STRING=postgresql://postgres:TU_CONTRASEÑA@db.wdieynendfjbkbhfovrx.supabase.co:5432/postgres
   ```

3. Ejecuta el script:
   ```bash
   npm run apply-migrations:psql
   ```

**Ventajas**:
- ✅ Ejecución directa en BD
- ✅ Muy rápido
- ✅ Bueno para CI/CD

**Desventaja**:
- ❌ Requiere credenciales de BD

---

### OPCIÓN 4: MCP (Node.js)

**Requisitos**: Node.js 16+ (ya tienes)

**Configuración**:

1. Copia `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edita `.env.local` y configura:
   ```env
   VITE_SUPABASE_URL=https://wdieynendfjbkbhfovrx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4MjkyMSwiZXhwIjoyMDY2MzU4OTIxfQ.X3Irl85Dy5HdZiPsMQUczySZgAT-dDyz7CZKjSn0X8Y
   ```

3. Ejecuta:
   ```bash
   npm run apply-migrations:mcp
   ```

**Ventajas**:
- ✅ Automatizado
- ✅ Bueno para scripts
- ✅ Integrado con Node.js

---

## 🎯 RECOMENDACIÓN POR PERFIL

| Perfil | Recomendación | Comando |
|--------|---------------|---------|
| **Desarrollador local** | CLI | `npm run apply-migrations` |
| **Sin CLI instalado** | Dashboard | Manual en web |
| **Sysadmin/DevOps** | psql | `npm run apply-migrations:psql` |
| **CI/CD pipelines** | MCP o psql | `npm run apply-migrations:mcp` |

---

## ✅ VERIFICACIÓN POST-APLICACIÓN

Después de aplicar las migraciones, verifica que todo está correcto:

### 1. En Supabase Dashboard

Ir a **SQL Editor** y ejecutar:

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'hosix_interconsultas%';
```

Deberías ver:
```
hosix_interconsultas_especialidades
hosix_interconsultas
hosix_interconsultas_respuestas
hosix_interconsultas_seguimiento
hosix_interconsultas_referrals
hosix_interconsultas_comunicaciones
```

### 2. Contar especialidades

```sql
SELECT COUNT(*) FROM hosix_interconsultas_especialidades;
```

Deberías ver: `20`

### 3. Verificar RLS

```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename LIKE 'hosix_interconsultas%';
```

Todos deben tener `rowsecurity = true`

---

## 🐛 TROUBLESHOOTING

### Error: "psql: command not found"

**Solución**: Instala PostgreSQL client
```bash
brew install postgresql  # macOS
sudo apt-get install postgresql-client  # Linux
```

### Error: "password authentication failed"

**Solución**: Verifica tu contraseña de Supabase
```bash
# Obtenla de: https://app.supabase.com → Settings → Database
# Actualiza en .env.local
```

### Error: "relation 'hosix_*' does not exist"

**Solución**: Las migraciones base no están aplicadas
- Asegúrate de aplicar TODAS las migraciones, no solo la última

### Error: "SUPABASE_SERVICE_ROLE_KEY no está configurada"

**Solución**: 
```bash
# En .env.local, agrega:
SUPABASE_SERVICE_ROLE_KEY=tu_key_aqui
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
scripts/
├── apply-migrations.js          ← Script interactivo (más fácil)
├── apply-migrations-mcp.js      ← Método MCP
├── apply-migrations-psql.sh     ← Método psql
├── setup-mcp.js                 ← Configuración MCP original
└── ...

supabase/
└── migrations/
    ├── 20250116_001_*.sql       ← Base (ya aplicada)
    ├── 20250116_002_*.sql       ← Pacientes (ya aplicada)
    ├── ...
    └── 20250206_014_*.sql       ← Interconsultas (última)

.env.example                      ← Template de variables
.env.local                        ← Tu configuración (NO COMMITEAR)
package.json                      ← Scripts npm
```

---

## 🚀 PASO A PASO RÁPIDO

**Si solo quieres hacerlo rápido**:

```bash
# 1. Script interactivo (recomendado)
npm run apply-migrations

# 2. O si tienes psql instalado
cp .env.example .env.local
# Edita .env.local con tu contraseña
npm run apply-migrations:psql

# 3. O si tienes Supabase CLI
npm run apply-migrations:cli

# 4. Inicia desarrollo
npm run dev
```

---

## 📚 DOCUMENTACIÓN RELACIONADA

- `MIGRACIONES_INTERCONSULTAS_APLICACION.md` - Detalles técnicos
- `ESTADO_HOSIX_CONSOLIDADO_2025-02-06.md` - Estado del proyecto
- `HOSIX_ARQUITECTURA_SUPABASE_COMPLETA.md` - Arquitectura completa

---

## ❓ PREGUNTAS FRECUENTES

### ¿Necesito aplicar todas las migraciones o solo la última?

**Respuesta**: Idealmente todas, pero si otras ya están aplicadas, solo necesitas la última.

### ¿Se pueden aplicar migraciones varias veces?

**Respuesta**: Sí, con `CREATE TABLE IF NOT EXISTS`, es seguro.

### ¿Cuánto tiempo toma?

**Respuesta**: 2-5 minutos dependiendo del método.

### ¿Puedo revertir las migraciones?

**Respuesta**: Sí, pero no hay script automático. Usa Supabase Dashboard.

---

## 📞 SOPORTE

Si tienes problemas:

1. Revisa los logs del script ejecutado
2. Verifica tu `.env.local`
3. Consulta Supabase Dashboard → Logs
4. Lee los documentos de troubleshooting

---

**¡Listo!** Ahora puedes aplicar las migraciones en 2 comandos. 🎉

```bash
npm run apply-migrations
npm run dev
```
