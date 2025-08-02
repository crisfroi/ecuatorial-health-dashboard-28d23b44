# Configuración MCP para Supabase

Este directorio contiene la configuración del Model Context Protocol (MCP) para conectar con tu base de datos de Supabase.

## Archivos de configuración

- `config.json`: Configuración principal del servidor MCP de Supabase
- `servers/supabase.json`: Configuración específica del servidor

## Variables de entorno necesarias

Para que el MCP funcione correctamente, necesitas configurar las siguientes variables:

1. **SUPABASE_URL**: URL de tu proyecto (ya configurada)
2. **SUPABASE_ANON_KEY**: Clave anónima (ya configurada)
3. **SUPABASE_SERVICE_ROLE_KEY**: Clave de servicio (necesaria para operaciones administrativas)

## Obtener la Service Role Key

Para obtener tu Service Role Key:

1. Ve al dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto: `wdieynendfjbkbhfovrx`
3. Ve a Settings > API
4. Copia la "service_role" key
5. Reemplaza `YOUR_SERVICE_ROLE_KEY_HERE` en el archivo de configuración

## Instalación del servidor MCP

El servidor MCP se instalará automáticamente cuando se ejecute por primera vez usando:

```bash
npx -y @modelcontextprotocol/server-supabase
```

## Uso

Una vez configurado, podrás:
- Consultar la estructura de tu base de datos
- Ejecutar queries SQL
- Modificar esquemas
- Gestionar datos
- Crear y modificar funciones de Supabase

## Seguridad

⚠️ **Importante**: Nunca commits la Service Role Key en tu repositorio. Usa variables de entorno locales o un gestor de secretos. 