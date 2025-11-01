# Referencia de Comandos - SDK Qiandao

Comandos para desarrollo, testing y despliegue.

## 🛠️ Desarrollo Local

### Restaurar dependencias
```bash
cd rena/Qiandao.Web
dotnet restore
```

### Compilar
```bash
cd rena/Qiandao.Web
dotnet build -c Release
```

### Ejecutar localmente
```bash
cd rena/Qiandao.Web
dotnet run --launch-profile https
# ó
dotnet run --launch-profile http
```

### Probar en local
```bash
# Health check
curl http://localhost:5000/health

# Dispositivos
curl http://localhost:5000/api/device

# Registros
curl http://localhost:5000/api/records?page=1&limit=10
```

## 🗄️ Base de Datos

### Configurar variables de entorno

```bash
# Linux/Mac
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_USER="postgres"
export DB_PASSWORD="your_password"
export DB_NAME="postgres"

# Windows PowerShell
$env:DB_HOST = "localhost"
$env:DB_PORT = "5432"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "your_password"
$env:DB_NAME = "postgres"

# Windows CMD
set DB_HOST=localhost
set DB_PORT=5432
set DB_USER=postgres
set DB_PASSWORD=your_password
set DB_NAME=postgres
```

### Ejecutar migraciones

```bash
# Linux/Mac
cd rena/scripts
chmod +x run-migrations.sh
./run-migrations.sh

# Windows PowerShell
cd rena\scripts
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\run-migrations.ps1

# Manualmente (cualquier SO)
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT \
  -f ../migrations/001_initial_schema.sql
```

### Conectar a base de datos

```bash
# Conexión directa
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT

# Comandos útiles una vez conectado:
\dt                          # Listar tablas
\d device                   # Describir tabla
SELECT * FROM device;       # Ver contenido
\du                         # Listar usuarios
\q                          # Salir
```

### Verificar tablas

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT \
  -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
```

### Ver logs de aplicación

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT \
  -c "SELECT timestamp, level, message FROM application_logs ORDER BY timestamp DESC LIMIT 20;"
```

### Limpiar logs (mantener últimos 90 días)

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT \
  -c "DELETE FROM application_logs WHERE timestamp < NOW() - INTERVAL '90 days';"
```

## 🐳 Docker

### Build local
```bash
docker build -f rena/Dockerfile -t qiandao-sdk:local .
```

### Run local con BD local
```bash
docker run -d \
  -p 8080:8080 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  -e DB_NAME=postgres \
  --name qiandao-local \
  qiandao-sdk:local
```

### Run local con Supabase
```bash
docker run -d \
  -p 8080:8080 \
  -e DB_HOST="your-project.pooler.supabase.com" \
  -e DB_PORT=6543 \
  -e DB_USER="postgres.YOUR_PROJECT_ID" \
  -e DB_PASSWORD="your_password" \
  -e DB_NAME=postgres \
  --name qiandao-render-test \
  qiandao-sdk:local
```

### Ver logs del contenedor
```bash
docker logs qiandao-local
docker logs -f qiandao-local    # Follow mode
```

### Detener contenedor
```bash
docker stop qiandao-local
docker rm qiandao-local
```

### Test de health desde contenedor
```bash
curl http://localhost:8080/health
```

## 🚀 Render

### Setup de variables en Render

```bash
# Configure these in Render Dashboard → Environment

DB_HOST=your-project.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.YOUR_PROJECT_ID
DB_PASSWORD=your_password
DB_NAME=postgres
ASPNETCORE_ENVIRONMENT=Production
```

### Test después del deployment

```bash
# Reemplaza YOUR-SERVICE con tu URL de Render
curl https://YOUR-SERVICE.onrender.com/health

curl https://YOUR-SERVICE.onrender.com/api/device

curl https://YOUR-SERVICE.onrender.com/api/records
```

### Ver logs en Render

En Render Dashboard:
1. Selecciona `qiandao-sdk`
2. Abre pestaña **Logs**
3. Scroll para ver logs en tiempo real

### Redeploy desde Render

En Render Dashboard:
1. Abre `qiandao-sdk`
2. Scroll hasta **Deployment History**
3. Click **Redeploy**

### Rollback a deployment anterior

En Render Dashboard:
1. **Current Deployment** → selecciona deployment anterior
2. **Redeploy**

## 📊 Supabase

### Conectar a Supabase desde terminal

```bash
psql -h your-project.pooler.supabase.com \
     -p 6543 \
     -U postgres.YOUR_PROJECT_ID \
     -d postgres
```

### Ver aplicación logs
```sql
SELECT * FROM application_logs 
ORDER BY timestamp DESC 
LIMIT 50;
```

### Ver sync logs
```sql
SELECT * FROM biometric_sync_logs 
ORDER BY synced_at DESC 
LIMIT 20;
```

### Ver todo de un dispositivo
```sql
SELECT * FROM device WHERE serial_num = 'YOUR_DEVICE_SN';
SELECT * FROM record WHERE device_serial_num = 'YOUR_DEVICE_SN' LIMIT 10;
```

### Estadísticas
```sql
-- Registros por dispositivo
SELECT device_serial_num, COUNT(*) as total 
FROM record 
GROUP BY device_serial_num;

-- Tamaño de logs
SELECT pg_size_pretty(pg_total_relation_size('application_logs')) as size;

-- Últimas sincronizaciones
SELECT device_sn, status, COUNT(*) as count 
FROM biometric_sync_logs 
GROUP BY device_sn, status;
```

## 🔍 Debugging

### Enable detallado logging

Editar `rena/Qiandao.Web/appsettings.Development.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.EntityFrameworkCore": "Debug"
    }
  }
}
```

### Ver logs de aplicación en archivo
```bash
tail -f rena/Logs/app-log-*.txt
```

### Test database connection desde C#
```csharp
using Npgsql;

var connectionString = "Host=...;Port=...;Database=...;Username=...;Password=...";
using var connection = new NpgsqlConnection(connectionString);
try 
{
    connection.Open();
    Console.WriteLine("✓ Connected to PostgreSQL");
}
catch (Exception ex)
{
    Console.WriteLine($"✗ Connection failed: {ex.Message}");
}
```

## 📝 Otros Comandos Útiles

### Limpiar binarios compilados
```bash
cd rena/Qiandao.Web
dotnet clean
```

### Ver versión de .NET
```bash
dotnet --version
```

### Listar SDKs instalados
```bash
dotnet --list-sdks
```

### Restaurar NuGet packages
```bash
cd rena/Qiandao.Web
dotnet nuget locals all --clear
dotnet restore
```

### Generar report de dependencias
```bash
cd rena/Qiandao.Web
dotnet tree
```

## 🚨 Comandos de Emergencia

### Resetear todo (SQL)
```sql
DROP TABLE IF EXISTS biometric_sync_logs CASCADE;
DROP TABLE IF EXISTS application_logs CASCADE;
DROP TABLE IF EXISTS machine_command CASCADE;
DROP TABLE IF EXISTS record CASCADE;
DROP TABLE IF EXISTS access_week CASCADE;
DROP TABLE IF EXISTS access_day CASCADE;
DROP TABLE IF EXISTS enrollinfo CASCADE;
DROP TABLE IF EXISTS person CASCADE;
DROP TABLE IF EXISTS device CASCADE;
```

### Reiniciar Render service
En Render Dashboard → qiandao-sdk → Settings → **Restart Service**

### Limpiar caché de Docker
```bash
docker system prune -a
docker volume prune
```

## 📚 Resumen de Archivos Importantes

- `rena/Qiandao.Web/Program.cs` - Configuración principal
- `rena/Qiandao.Service/Db.cs` - DbContext
- `rena/migrations/001_initial_schema.sql` - Migraciones BD
- `rena/Dockerfile` - Build para producción
- `rena/appsettings.Production.json` - Config de producción
- `rena/POSTGRESQL_SETUP.md` - Guía completa PostgreSQL
- `rena/DEPLOYMENT_CHECKLIST.md` - Checklist de despliegue

## 🆘 Quick Help

**No puedo conectar a BD:**
```bash
# Test connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT -c "SELECT 1"
```

**Dockerfile no compila:**
```bash
# Rebuild sin cache
docker build -f rena/Dockerfile --no-cache -t qiandao-sdk:local .
```

**Render está lento:**
- Espera ~30s en primer cold start
- Upgrade a Starter Pro si es consistente
- Revisa logs por errores

**Migraciones fallaron:**
```bash
# Ejecuta de nuevo
./scripts/run-migrations.sh
# Revisa que tables existan
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT -c "\dt"
```

---

**Última actualización**: 2024
**Versión**: 1.0
