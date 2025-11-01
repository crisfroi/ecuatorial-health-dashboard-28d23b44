# Guía de Configuración: Dispositivos Biométricos Qiandao con Render

Esta guía te ayudará a desplegar el SDK Qiandao en Render y conectarlo con tu dashboard.

## 📋 Requisitos Previos

- Cuenta en [Render.com](https://render.com)
- Credenciales de Supabase (Project ID, URL, API Keys)
- El SDK Qiandao clonado o disponible en tu repositorio

## 🚀 Paso 1: Preparar el SDK para Render

### 1.1 Estructura del Proyecto

Tu carpeta `rena/` contiene:
```
rena/
├── Dockerfile
├── Qiandao.Web/        # Aplicación ASP.NET Core
├── Qiandao.Service/    # Lógica de servicios
└── Qiandao.Model/      # Modelos de datos
```

### 1.2 Configurar Variables de Entorno

El SDK usa PostgreSQL. Necesitas configurar en `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=YOUR_DB_HOST;Port=6543;Database=postgres;Username=postgres.YOUR_PROJECT_ID;Password=YOUR_DB_PASSWORD"
  },
  "SocketServer": {
    "Port": 8080
  }
}
```

Para Render, estas variables se configuran en el dashboard (no en el repo).

### 1.3 Dockerfile Verification

Verifica que el Dockerfile esté correctamente configurado:

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /app

# Copy and restore
COPY ["rena/Qiandao.Web/Qiandao.Web.csproj", "Qiandao.Web/"]
COPY ["rena/Qiandao.Service/Qiandao.Service.csproj", "Qiandao.Service/"]
COPY ["rena/Qiandao.Model/Qiandao.Model.csproj", "Qiandao.Model/"]

RUN dotnet restore "Qiandao.Web/Qiandao.Web.csproj"

# Copy source
COPY rena/ .

# Build
RUN dotnet build "Qiandao.Web/Qiandao.Web.csproj" -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish "Qiandao.Web/Qiandao.Web.csproj" -c Release -o /app/publish

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:7.0
WORKDIR /app
COPY --from=publish /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Qiandao.Web.dll"]
```

## 🌐 Paso 2: Desplegar en Render

### 2.1 Crear un Nuevo Web Service en Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Haz clic en "New +" → "Web Service"
3. Selecciona "Deploy an existing repository"
4. Conecta tu repositorio GitHub/GitLab que contiene la carpeta `rena/`

### 2.2 Configurar el Servicio

**Configuración General:**
- **Name:** `qiandao-sdk` (o el nombre que prefieras)
- **Environment:** `Docker`
- **Build Command:** (dejar en blanco, Render usa Dockerfile)
- **Start Command:** (dejar en blanco)
- **Instance Type:** `Standard` (recomendado para producción)

**Configuración de Puerto:**
- **Expose Port:** `8080`

### 2.3 Configurar Variables de Entorno

En la sección "Environment", agrega las siguientes variables:

```
DB_HOST=your-db-host.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.YOUR_PROJECT_ID
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=postgres
ASPNETCORE_ENVIRONMENT=Production
```

**Cómo obtener estas credenciales:**

1. Ve a tu proyecto Supabase
2. Abre **Project Settings** → **Database**
3. Bajo **Connection string**, selecciona **URI** y copia los parámetros
4. Para obtener la contraseña, ve a **Auth** → **Users** o usa la que configuraste

### 2.4 Iniciar el Deploy

1. Haz clic en **"Create Web Service"**
2. Render comenzará a construir y desplegar (esto toma 5-10 minutos)
3. Espera a que el estado sea **"Live"**
4. Anota la URL del servicio (ej: `https://qiandao-sdk.onrender.com`)

## 🔗 Paso 3: Conectar con el Dashboard

### 3.1 Configurar la Conexión en el Dashboard

1. Ve al dashboard de tu aplicación
2. Abre el tab **"Dispositivos Biométricos"** (nuevo tab)
3. En el campo "URL del SDK", ingresa:
   ```
   https://qiandao-sdk.onrender.com
   ```

### 3.2 Probar la Conexión

1. Haz clic en **"Cargar Dispositivos"**
2. Si la conexión funciona, verás los dispositivos disponibles
3. Haz clic en **"Sincronizar Ahora"** para hacer una sincronización manual

### 3.3 Configurar Sincronización Automática

**Opción 1: Sincronización Manual (Recomendado)**

Los usuarios pueden sincronizar manualmente cuando lo necesiten. No requiere configuración adicional.

**Opción 2: Sincronización Cada 30 Minutos (Opcional)**

Para habilitar sincronización automática cada 30 minutos, actualiza el componente:

```tsx
// En Dashboard.tsx o donde uses BiometricSyncPanel
<BiometricSyncPanel 
  defaultDeviceUrl="https://qiandao-sdk.onrender.com"
  autoSyncInterval={30 * 60 * 1000}  // 30 minutos en milisegundos
/>
```

## 🗄️ Paso 4: Ejecutar Migraciones en Supabase

El sistema necesita una tabla para rastrear los eventos de sincronización.

### 4.1 Aplicar la Migración

```bash
# Usando Supabase CLI (si la tienes instalada)
supabase migration up

# O manualmente:
# 1. Ve a Supabase SQL Editor
# 2. Copia el contenido de: supabase/migrations/20240101000000_create_biometric_sync_logs.sql
# 3. Pega en el SQL Editor y ejecuta
```

### 4.2 Verificar la Tabla

En Supabase, deberías ver una nueva tabla `biometric_sync_logs` con columnas:
- `id` (bigint)
- `device_sn` (text)
- `status` (text: success/error)
- `records_synced` (integer)
- `error_message` (text)
- `synced_at` (timestamp)

## 🔄 Paso 5: Cómo Funciona el Flujo

```
┌─────────────┐
│  Dashboard  │ (React App)
└──────┬──────┘
       │ 1. Usuario hace clic en "Sincronizar"
       │
       ▼
┌──────────────────────┐
│ Edge Function        │ (Supabase)
│ sync-biometric-device│
└──────┬───────────────┘
       │ 2. Llama al SDK
       │
       ▼
┌──────────────────────┐
│ Qiandao SDK          │ (Render)
│ http://localhost:8080│
└──────┬───────────────┘
       │ 3. Obtiene registros de dispositivos
       │
       ▼
┌──────────────────────┐
│ Dispositivos         │
│ Biométricos          │
└──────────────────────┘
       │
       │ 4. Registros
       │
       ▼
┌────────────────────��─┐
│ Supabase Database    │
│ attendance_logs      │
└──────────────────────┘
       │
       │ 5. Historial registrado
       │
       ▼
┌──────────────────────┐
│ Dashboard            │
│ Muestra historial    │
└──────────────────────┘
```

## 🔧 Solución de Problemas

### Error: "Connection refused"
- **Causa:** El SDK no está corriendo o está en otra URL
- **Solución:** Verifica que Render muestre el servicio como "Live" y que hayas ingresado la URL correcta

### Error: "Database connection error"
- **Causa:** Variables de entorno incorrectas en Render
- **Solución:** Verifica las credenciales de BD en Render → Environment

### Error: "No records found"
- **Causa:** El dispositivo biométrico no tiene registros
- **Solución:** Asegúrate de que el dispositivo esté sincronizado y registrando datos

### El SDK se detiene después de poco tiempo
- **Causa:** Render pone en suspenso los servicios gratuitos
- **Solución:** Upgrade a un plan de pago o usa otra plataforma (Railway, Fly.io)

## 📊 Monitorear el Servicio

### En Render Dashboard:
1. Abre tu servicio "qiandao-sdk"
2. Ve a la pestaña **"Logs"** para ver logs en tiempo real
3. Busca errores de conexión a BD o issues de la API

### En Supabase:
1. Ve a **SQL Editor**
2. Ejecuta:
   ```sql
   SELECT * FROM biometric_sync_logs 
   ORDER BY synced_at DESC 
   LIMIT 10;
   ```
3. Deberías ver registros de sincronización exitosa/fallida

## 🎯 Próximos Pasos

1. **Automatizar Sincronización:** Configura un cron job en Render o usa Supabase's pg_cron
2. **Notificaciones:** Agrega SMS o email cuando haya errores de sincronización
3. **Análisis:** Crea reportes con los datos sincronizados
4. **Escalado:** Aumenta la capacidad de la BD si hay muchos registros

## 📚 Recursos Útiles

- [Documentación de Render](https://render.com/docs)
- [Documentación de Qiandao SDK](./rena/README.md)
- [Documentación de Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentación de Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

**¿Necesitas ayuda?** Revisa los logs en Render o Supabase, o contacta al soporte técnico.
