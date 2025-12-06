# 📜 Scripts para Migraciones HOSIX

> Directorio de scripts para aplicar migraciones SQL a Supabase

---

## 📋 Scripts Disponibles

### `apply-migrations.js` ⭐ RECOMENDADO

Script interactivo que guía al usuario paso a paso.

```bash
npm run apply-migrations
node scripts/apply-migrations.js
```

**Características**:
- ✅ Menú interactivo
- ✅ Valida prerequisitos
- ✅ Ofrece 4 opciones
- ✅ Guía completa paso a paso

---

### `apply-migrations-psql.sh`

Aplica migraciones directamente a PostgreSQL via `psql`.

```bash
npm run apply-migrations:psql
bash scripts/apply-migrations-psql.sh
```

**Requisitos**:
- `psql` instalado
- `SUPABASE_CONNECTION_STRING` o `SUPABASE_DB_*` en .env

**Ventajas**:
- Ejecución directa en BD
- Muy rápido
- Ideal para CI/CD

---

### `apply-migrations-mcp.js`

Aplica migraciones via Model Context Protocol (Node.js).

```bash
npm run apply-migrations:mcp
node scripts/apply-migrations-mcp.js
```

**Requisitos**:
- `SUPABASE_SERVICE_ROLE_KEY` en .env

**Ventajas**:
- Automatizado
- No requiere CLI instalado
- Fácil integración

---

### `setup-mcp.js`

Configura el Model Context Protocol (original).

```bash
npm run setup-mcp
node scripts/setup-mcp.js
```

---

## 🚀 FLUJO RÁPIDO

```bash
# 1. Opción más fácil: Script interactivo
npm run apply-migrations

# 2. O elige tu método:
npm run apply-migrations:cli    # Supabase CLI
npm run apply-migrations:psql   # PostgreSQL psql
npm run apply-migrations:mcp    # Node.js MCP

# 3. Verifica en dashboard
# 4. Inicia desarrollo
npm run dev
```

---

## 📁 Archivos de Configuración

- `.env.example` - Template de variables de entorno
- `.env.local` - TU configuración (NO COMMITEAR)

---

## 🔧 Configuración de Variables

Copia `.env.example` a `.env.local` y edita:

```bash
cp .env.example .env.local
```

Configura según tu método:

**Para psql**:
```env
SUPABASE_CONNECTION_STRING=postgresql://postgres:PASSWORD@db.wdieynendfjbkbhfovrx.supabase.co:5432/postgres
```

**Para MCP**:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Para CLI**:
```bash
supabase login
supabase link --project-ref wdieynendfjbkbhfovrx
```

---

## ❓ ¿Cuál script usar?

| Situación | Script | Comando |
|-----------|--------|---------|
| No sé qué hacer | apply-migrations.js | `npm run apply-migrations` |
| Tengo Supabase CLI | apply-migrations.js | `npm run apply-migrations:cli` |
| Tengo psql instalado | apply-migrations-psql.sh | `npm run apply-migrations:psql` |
| Solo Node.js | apply-migrations-mcp.js | `npm run apply-migrations:mcp` |

---

## 📚 Documentación Completa

- `GUIA_APLICAR_MIGRACIONES.md` - Guía detallada
- `SETUP_MIGRACIONES_RAPIDO.md` - Versión rápida
- `MIGRACIONES_INTERCONSULTAS_APLICACION.md` - Detalles técnicos

---

## 💡 Tips

- **Primer desarrollador?** Usa `npm run apply-migrations`
- **DevOps?** Usa `bash scripts/apply-migrations-psql.sh`
- **CI/CD?** Usa `node scripts/apply-migrations-mcp.js`
- **Manual?** Usa Supabase Dashboard

---

## ✅ Checklist

- [ ] He leído la guía correspondiente
- [ ] He configurado .env.local
- [ ] He ejecutado el script
- [ ] He verificado en Supabase Dashboard
- [ ] He iniciado npm run dev

---

**¡Listo para aplicar migraciones!** 🚀
