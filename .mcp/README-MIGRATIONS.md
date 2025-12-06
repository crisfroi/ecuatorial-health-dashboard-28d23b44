# 🚀 MCP Migrations - Supabase

MCP server para gestionar migraciones SQL en Supabase desde CLI.

## Instalación

### Opción 1: Desde proyecto local
```bash
npm install -g file:./.mcp
```

### Opción 2: Directamente
```bash
cd .mcp
npm install
npm link
```

## Uso

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

### Ver políticas RLS
```bash
mcp exec migrations view_policies --table hosix_usuarios
```

### Leer migración
```bash
mcp exec migrations read_migration --file 20250116_001_hosix_base_schema.sql
```

### Aplicar migración
```bash
mcp exec migrations apply_migration --file 20250116_001_hosix_base_schema.sql
```

## Configuración

Las credenciales se leen de:
- `SUPABASE_URL` - URL del proyecto
- `SUPABASE_SERVICE_ROLE_KEY` - Clave de acceso

Están pre-configuradas en `.mcp/config.json`

## Herramientas disponibles

| Herramienta | Descripción |
|-------------|------------|
| `list_migrations` | Listar archivos de migración |
| `list_tables` | Listar tablas públicas |
| `view_table` | Ver columnas de tabla |
| `view_policies` | Ver políticas RLS |
| `read_migration` | Leer contenido SQL |
| `apply_migration` | Aplicar migración |

## Ejemplo completo

```bash
# 1. Ver migraciones disponibles
mcp exec migrations list_migrations

# 2. Leer antes de aplicar
mcp exec migrations read_migration --file 20250116_001_hosix_base_schema.sql

# 3. Aplicar migración
mcp exec migrations apply_migration --file 20250116_001_hosix_base_schema.sql

# 4. Verificar tablas creadas
mcp exec migrations list_tables

# 5. Ver estructura de tabla específica
mcp exec migrations view_table --table hosix_usuarios
```

## Notas

- El servidor se conecta con Service Role Key (permisos totales)
- Las migraciones se buscan en `supabase/migrations/`
- Las operaciones están organizadas por tabla
- Usa JSON para output (parseable por herramientas)
