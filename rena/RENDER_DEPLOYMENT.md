# Despliegue del SDK Qiandao en Render

Guía paso a paso para desplegar el SDK .NET en Render.com y conectarlo con el Dashboard de Salud.

## 📋 Requisitos Previos

- Cuenta en [Render.com](https://render.com)
- Proyecto en GitHub con la carpeta `rena/` incluida
- Credenciales de Supabase (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD)

## 🚀 Paso 1: Preparar Variables de Entorno

Obtén las credenciales de Supabase:

1. Ve a **Supabase Dashboard** → **Project Settings** → **Database**
2. Busca "Connection pooler" o "Direct connection"
3. Extrae los siguientes valores:
   - **DB_HOST**: `your-project.pooler.supabase.com`
   - **DB_PORT**: `6543` (pooler) o `5432` (direct)
   - **DB_USER**: `postgres.YOUR_PROJECT_ID`
   - **DB_PASSWORD**: Tu contraseña PostgreSQL
   - **DB_NAME**: `postgres`

## 🌐 Paso 2: Desplegar en Render

### Opción A: Usando Render Dashboard (UI)

1. **Accede a Render Dashboard**
   - Ve a https://dashboard.render.com
   - Inicia sesión con tu cuenta

2. **Crea un nuevo Web Service**
   - Haz clic en **"+ New"** → **"Web Service"**
   - Selecciona tu repositorio de GitHub (donde está la carpeta `rena/`)

3. **Configura el Servicio**
   ```
   Name: qiandao-sdk
   Environment: Docker
   Docker Context: ./
   Dockerfile Path: rena/Dockerfile
   Build Command: (dejar en blanco)
   Start Command: (dejar en blanco)
   Instance Type: Starter ($7/month)
   ```

4. **Agrega Variables de Entorno**
   - Click en **"Advanced"** → **"Add Environment Variable"**
   
   Variables a agregar:
   ```
   DB_HOST = your-project.pooler.supabase.com
   DB_PORT = 6543
   DB_USER = postgres.YOUR_PROJECT_ID
   DB_PASSWORD = your_password_here
   DB_NAME = postgres
   ASPNETCORE_ENVIRONMENT = Production
   ```

5. **Inicia el Deployment**
   - Haz clic en **"Create Web Service"**
   - Espera 5-10 minutos a que se construya e inicie
   - Verifica que el estado sea **"Live"**

### Opción B: Usando CLI de Render (Avanzado)

```bash
# Instala Render CLI
npm install -g @render/cli

# Inicia sesión
render login

# Despliega desde render.yaml
render deploy --config ./rena/.render/render.yaml
```

## 🔗 Paso 3: Verificar el Despliegue

1. **Obtén la URL del servicio**
   - En Render Dashboard, ve a tu servicio "qiandao-sdk"
   - Copia la URL (algo como `https://qiandao-sdk.onrender.com`)

2. **Prueba la conexión**
   - Abre en tu navegador: `https://qiandao-sdk.onrender.com/api/device`
   - Deberías ver una respuesta JSON (vacía si no hay dispositivos)

3. **Verifica los logs**
   - En Render Dashboard → "qiandao-sdk" → "Logs"
   - Busca errores de conexión a BD

## 📱 Paso 4: Conectar con el Dashboard

1. **Abre el Dashboard de Salud**
   - Navega a la sección **Asistencia**
   - Abre el tab **"⚡ Biométrico"** (nuevo)

2. **Configura la URL del SDK**
   - En el campo "URL del SDK", ingresa: `https://qiandao-sdk.onrender.com`
   - Haz clic en **"Cargar Dispositivos"**

3. **Prueba la Sincronización**
   - Si ves dispositivos listados → ✅ conexión exitosa
   - Haz clic en **"Sincronizar Ahora"**
   - Los registros aparecerán en la tabla de historial

## ⚙️ Paso 5: Configurar Sincronización Automática (Opcional)

Para sincronizar automáticamente cada 30 minutos:

### Opción A: Manual (Recomendado)

Los usuarios hacen clic en "Sincronizar Ahora" cuando lo necesiten. No requiere configuración adicional.

### Opción B: Automática cada 30 minutos

Edita el Dashboard para usar auto-sync:

```tsx
// En src/pages/Dashboard.tsx o donde uses AsistenciaDashboard
<AsistenciaDashboard autoSyncInterval={30 * 60 * 1000} />
```

## 🔍 Solución de Problemas

### "Connection refused" / "SDK no responde"

**Causa**: El servicio no está activo o la URL es incorrecta.

**Solución**:
1. Verifica en Render Dashboard que el estado sea "Live"
2. Revisa los logs por errores
3. Confirma que usaste la URL correcta (sin `/api` al final en el Dashboard)

### "Database connection error"

**Causa**: Variables de entorno incorrectas.

**Solución**:
1. En Render Dashboard, ve a tu servicio
2. Click en "Environment" (o "Env Vars")
3. Verifica cada variable de BD
4. Prueba la conexión con `psql`:
   ```bash
   psql -h your-host -U postgres.project_id -d postgres -p 6543
   ```

### "No devices found" / "No records"

**Causa**: El dispositivo biométrico no está conectado o sincronizado.

**Solución**:
1. Verifica que el dispositivo esté encendido y en la red
2. Asegúrate de que los datos ya existan en el dispositivo
3. Revisa los logs del SDK en Render

### "El servicio se detiene después de poco tiempo"

**Causa**: Plan Starter de Render tiene límites. Render suspende servicios inactivos.

**Solución**:
1. Upgrade a **Starter Pro** ($12/mes) o superior
2. O usa otra plataforma: Railway, Fly.io, DigitalOcean

## 📊 Monitoreo Continuo

### En Render

1. Ve a Dashboard → tu servicio "qiandao-sdk"
2. Abre **"Logs"** para ver eventos en tiempo real
3. Busca errores o avisos de conexión

### En Supabase

Verifica que los datos se guardan correctamente:

```sql
-- Historial de sincronización
SELECT * FROM biometric_sync_logs 
ORDER BY synced_at DESC 
LIMIT 20;

-- Registros de asistencia desde biométrico
SELECT * FROM attendance_logs 
WHERE source_file = 'biometric_sdk'
ORDER BY fecha_hora DESC 
LIMIT 20;
```

## 🎯 Próximos Pasos

1. **Automatizar sincronización periódica**
   - Configura un cron job en Supabase para sincronizar cada hora
   - O usa Render's "Cron Jobs" (plan Pro+)

2. **Notificaciones de errores**
   - Agrega notificaciones SMS cuando falle una sincronización
   - Usa Supabase Edge Functions

3. **Dashboard de monitoreo**
   - Crea gráficos con el historial de sincronizaciones
   - Monitorea la salud del SDK

4. **Escalabilidad**
   - Si hay muchos dispositivos, considera:
     - Usar una cola de procesamiento (Bull, RabbitMQ)
     - Optimizar la BD con más índices
     - Replicar a múltiples instancias en Render

## 📚 Recursos Útiles

- [Documentación de Render](https://render.com/docs)
- [Documentación de Qiandao SDK](./README.md)
- [Documentación de Supabase](https://supabase.com/docs)

## ✅ Checklist Final

Antes de considerar el despliegue completado:

- [ ] Dockerfile compila sin errores
- [ ] Render muestra estado "Live"
- [ ] URL del SDK es accesible desde el navegador
- [ ] Dashboard puede conectarse al SDK
- [ ] Se sincronizaron registros exitosamente
- [ ] Historial aparece en biometric_sync_logs
- [ ] Logs no muestran errores de BD

---

**¿Problemas?** Revisa los logs de Render y Supabase, o contacta al soporte técnico.
