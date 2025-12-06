# 🚀 MCP Migrations - Guía Rápida

MCP server separado para gestionar migraciones SQL en Supabase desde CLI.

## Instalación (Una sola vez)

```bash
npm run install-mcp-migrations
```

Esto instala el servidor como npm global.

---

## Uso Rápido

### Listar migraciones disponibles
```bash
mcp exec migrations list_migrations
```

### Listar tablas en Supabase
```bash
mcp exec migrations list_tables
```

### Ver estructura de tabla
```bash
mcp exec migrations view_table --table hosix_usuarios
```

### Ver políticas RLS de una tabla
```bash
mcp exec migrations view_policies --table hosix_usuarios
```

### Leer migración antes de aplicar
```bash
mcp exec migrations read_migration --file 20250116_001_hosix_base_schema.sql
```

### Aplicar una migración
```bash
mcp exec migrations apply_migration --file 20250116_001_hosix_base_schema.sql
```

---

## Ejemplo: Aplicar todas las migraciones

```bash
# 1. Ver migraciones disponibles
mcp exec migrations list_migrations

# 2. Leer la primera migración crítica
mcp exec migrations read_migration --file 20250116_001_hosix_base_schema.sql

# 3. Aplicarla
mcp exec migrations apply_migration --file 20250116_001_hosix_base_schema.sql

# 4. Verificar que se crearon las tablas
mcp exec migrations list_tables

# 5. Ver estructura de tabla específica
mcp exec migrations view_table --table hosix_usuarios
```

---

## Comandos Disponibles

| Comando | Descripción |
|---------|------------|
| `list_migrations` | Listar archivos SQL |
| `list_tables` | Listar todas las tablas |
| `view_table --table NAME` | Ver columnas y tipos |
| `view_policies --table NAME` | Ver políticas RLS |
| `read_migration --file FILE.sql` | Leer contenido SQL |
| `apply_migration --file FILE.sql` | Ejecutar migración |

---

## Notas

- ✅ Se instala como npm global
- ✅ Usa credenciales pre-configuradas en `.mcp/config.json`
- ✅ Output en JSON (fácil de procesar)
- ✅ Conexión automática a Supabase
- ✅ Permisos totales (Service Role Key)

---

## Ubicación de archivos

- 📁 Servidor: `.mcp/server-migrations.js`
- 📁 Config: `.mcp/config.json`
- 📁 Package: `.mcp/package.json`
- 📁 Docs: `.mcp/README-MIGRATIONS.md`

---

Para más detalles: `.mcp/README-MIGRATIONS.md`
