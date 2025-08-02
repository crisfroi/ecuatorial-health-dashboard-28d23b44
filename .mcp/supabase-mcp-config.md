# Configuración MCP para Supabase - Dashboard de Salud Ecuatorial

## Información del Proyecto

- **Project ID**: `wdieynendfjbkbhfovrx`
- **URL**: `https://wdieynendfjbkbhfovrx.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8`

## Estructura de la Base de Datos

### Tablas Principales
- `profesionales`: Información de profesionales de la salud
- `centros_salud`: Centros de salud y hospitales
- `distritos_sanitarios`: Distritos sanitarios de Guinea Ecuatorial
- `solicitudes`: Solicitudes de carnet profesional
- `documentos`: Documentos adjuntos
- `usuarios`: Usuarios del sistema
- `roles`: Roles y permisos

### Funciones de Supabase
- `generar_carnet_profesional`: Genera carnets profesionales
- `enviar_notificacion_sms`: Envía notificaciones SMS
- `actualizar_estado_acreditacion`: Actualiza estados de acreditación
- `procesar_cola_carnets`: Procesa la cola de generación de carnets

## Configuración MCP

### Archivos de Configuración
1. `.mcp/config.json` - Configuración principal
2. `.mcp/servers/supabase.json` - Configuración del servidor
3. `.mcp/config.example.json` - Archivo de ejemplo

### Variables de Entorno Requeridas
```json
{
  "SUPABASE_URL": "https://wdieynendfjbkbhfovrx.supabase.co",
  "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8",
  "SUPABASE_SERVICE_ROLE_KEY": "[OBTENER DESDE DASHBOARD]"
}
```

## Pasos para Completar la Configuración

1. **Obtener Service Role Key**:
   - Ve a https://supabase.com/dashboard
   - Selecciona el proyecto `wdieynendfjbkbhfovrx`
   - Ve a Settings > API
   - Copia la "service_role" key

2. **Actualizar Configuración**:
   - Edita `.mcp/config.json`
   - Reemplaza `"YOUR_SERVICE_ROLE_KEY_HERE"` con tu clave real

3. **Verificar Conexión**:
   - Ejecuta `npm run setup-mcp` para verificar la configuración

## Funcionalidades Disponibles

Una vez configurado, podrás:
- ✅ Consultar estructura de la base de datos
- ✅ Ejecutar queries SQL
- ✅ Modificar esquemas y tablas
- ✅ Gestionar datos de profesionales
- ✅ Crear y modificar funciones de Supabase
- ✅ Administrar políticas RLS
- ✅ Gestionar autenticación y usuarios
- ✅ Crear y modificar triggers
- ✅ Administrar storage y archivos

## Seguridad

⚠️ **IMPORTANTE**: 
- Nunca commits la Service Role Key en el repositorio
- Los archivos de configuración están en `.gitignore`
- Usa variables de entorno para producción

## Comandos Útiles

```bash
# Verificar configuración
npm run setup-mcp

# Instalar servidor MCP
npx -y @modelcontextprotocol/server-supabase

# Conectar a Supabase CLI
npx supabase login
npx supabase link --project-ref wdieynendfjbkbhfovrx
```

## Contexto del Proyecto

Este es un dashboard de salud para Guinea Ecuatorial que incluye:
- Gestión de profesionales de la salud
- Generación de carnets profesionales
- Análisis de estadísticas sanitarias
- Gestión de centros de salud
- Sistema de notificaciones SMS
- Panel administrativo completo 