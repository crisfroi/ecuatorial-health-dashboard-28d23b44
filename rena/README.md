# SDK Qiandao - Sistema de Asistencia Biométrica

SDK basado en ASP.NET Core 8.0 para integrar dispositivos biométricos de asistencia (Qiandao) con el Dashboard de Salud de Guinea Ecuatorial.

## 🎯 Descripción

Este SDK actúa como intermediario entre dispositivos biométricos (lectores de huella, reconocimiento facial, etc.) y la base de datos de asistencia. Proporciona una API REST que:

- Lista dispositivos conectados
- Obtiene registros de asistencia/fichajes
- Sincroniza datos automáticamente
- Maneja errores y reintentos
- Registra historial de sincronizaciones

## 🏗️ Arquitectura

```
┌──────────────────────┐
│  Dispositivos        │
│  Biométricos         │
└──────────┬───────────┘
           │ WebSocket/TCP
           ▼
┌──────────────────────┐
│  SDK Qiandao         │
│  (ASP.NET Core 8.0)  │
│  - Controllers       │
│  - Services          │
│  - DB Access         │
└──────────┬───────────┘
           │ REST API
           ▼
┌──────────────────────┐
│  Dashboard           │
│  (React)             │
│  + Edge Functions    │
└──────────┬────���──────┘
           │ SQL
           ▼
┌──────────────────────┐
│  Supabase Database   │
│  PostgreSQL          │
└──────────────────────┘
```

## 📦 Estructura del Proyecto

```
Qiandao.Model/
├── Entity/              # Entidades de BD
│   ├── Device.cs        # Información del dispositivo
│   ├── Person.cs        # Datos de persona/empleado
│   ├── Record.cs        # Registros de asistencia
│   └── ...
├── Request/             # DTOs de entrada
│   ├── Adddevice.cs
│   ├── Addperson.cs
│   └── Addrecord.cs
└── Response/            # DTOs de salida
    ├── DeviceModel.cs
    ├── PersonModel.cs
    └── RecordModel.cs

Qiandao.Service/
├── DeviceService.cs     # Gestión de dispositivos
├── PersonService.cs     # Gestión de personas
├── RecordService.cs     # Gestión de registros
├── Db.cs               # Acceso a BD (Entity Framework)
└── MappingProfile.cs   # AutoMapper configuration

Qiandao.Web/
├── Controllers/         # Endpoints de API
│   ├── DeviceController.cs
│   ├── PersonController.cs
│   └── HomeController.cs
├── Models/
├── Properties/
├── Views/
├── WebSocketHandler/    # Manejo de WebSocket
├── appsettings*.json   # Configuración
├── Program.cs          # Startup
└── Qiandao.Web.csproj  # Definición del proyecto
```

## 🚀 Quickstart

### Local

1. **Requisitos**
   ```bash
   # .NET 8.0 SDK
   dotnet --version  # debe ser 8.0 o superior
   
   # PostgreSQL/Supabase conectado
   ```

2. **Configurar BD**
   ```bash
   # Edita rena/Qiandao.Web/appsettings.Development.json
   # Actualiza ConnectionStrings
   ```

3. **Ejecutar**
   ```bash
   cd rena/Qiandao.Web
   dotnet run --launch-profile https
   ```

4. **Probar**
   ```bash
   curl http://localhost:5000/api/device
   ```

### Docker (Local)

```bash
docker build -f rena/Dockerfile -t qiandao-sdk:local .

docker run -d \
  -p 8080:8080 \
  -e DB_HOST=localhost \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=mypass \
  -e DB_NAME=postgres \
  qiandao-sdk:local
```

### Render (Producción)

Ver guía completa en [`RENDER_DEPLOYMENT.md`](./RENDER_DEPLOYMENT.md)

## 📡 API Endpoints

### Dispositivos

```bash
# Listar todos los dispositivos
GET /api/device

# Obtener info de dispositivo específico
GET /api/device/{id}

# Agregar dispositivo
POST /api/device
{
  "deviceName": "Terminal 1",
  "location": "Entrada",
  "status": "active"
}

# Actualizar dispositivo
PUT /api/device/{id}

# Eliminar dispositivo
DELETE /api/device/{id}
```

### Personas/Empleados

```bash
# Listar personas
GET /api/person

# Obtener persona
GET /api/person/{id}

# Crear persona
POST /api/person
{
  "fullName": "Juan Pérez",
  "enrollId": 12345,
  "documentId": "123456789"
}
```

### Registros de Asistencia

```bash
# Listar registros
GET /api/record

# Registros de dispositivo específico
GET /api/record?deviceSn=SN123456

# Registros de persona específica
GET /api/record?enrollId=12345

# Crear registro
POST /api/record
{
  "enrollId": 12345,
  "recordTime": "2024-01-15T08:30:00Z",
  "inOut": 0,
  "temperature": 36.5
}
```

### Estado

```bash
# Estado general del SDK
GET /api/status

# Health check
GET /health
```

## ⚙️ Configuración

### Variables de Entorno

```bash
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=mypassword
DB_NAME=postgres

# Aplicación
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080

# Logging
LOG_LEVEL=Information
```

### appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=postgres;..."
  },
  "SocketServer": {
    "Port": 8080
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning"
    }
  }
}
```

## 🔌 Integración con Dashboard

### 1. Conectar URL del SDK

En el Dashboard de Salud → Asistencia → Tab "Biométrico":

```
URL del SDK: https://qiandao-sdk.onrender.com
```

### 2. Sincronizar Registros

```javascript
// Desde el Dashboard (Edge Function)
const response = await supabase.functions.invoke('sync-biometric-device', {
  body: {
    deviceUrl: 'https://qiandao-sdk.onrender.com',
    action: 'sync',
    deviceSn: 'SN123456'
  }
});

// Los registros se guardan automáticamente en attendance_logs
```

### 3. Monitorear Sincronizaciones

```sql
SELECT * FROM biometric_sync_logs 
WHERE device_sn = 'SN123456'
ORDER BY synced_at DESC 
LIMIT 10;
```

## 📊 Base de Datos

### Tablas Principales

- **dispositivos** - Información de dispositivos biométricos
- **empleado_dispositivo_map** - Mapeo de empleado a dispositivo
- **attendance_logs** - Registros de asistencia/fichajes
- **biometric_sync_logs** - Historial de sincronizaciones
- **asistencia_fichajes** - Fichajes procesados

### Modelos

```csharp
// Dispositivo
public class Device
{
    public Guid Id { get; set; }
    public string Nombre { get; set; }
    public string Ubicacion { get; set; }
    public bool Activo { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Registró de asistencia
public class Record
{
    public Guid Id { get; set; }
    public long EnrollId { get; set; }
    public DateTime RecordsTime { get; set; }
    public int InOut { get; set; }  // 0=OUT, 1=IN
    public int Mode { get; set; }
    public decimal? Temperature { get; set; }
}
```

## 🐛 Troubleshooting

### "Cannot connect to database"

```bash
# Verifica conectividad
psql -h your-host -U postgres -d postgres
```

Actualiza `appsettings.json` con credenciales correctas.

### "SDK Port already in use"

```bash
# En Windows
netstat -ano | findstr :8080

# En Linux/Mac
lsof -i :8080

# Cambia el puerto en appsettings.json
```

### "No devices found"

- Verifica que hay dispositivos registrados en la BD
- Comprueba que el driver/firmware del dispositivo está actualizado

### "Logs missing"

Revisa `appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug"  // Cambiar a Debug
    }
  }
}
```

## 📚 Documentación Adicional

- [`SETUP_ENVIRONMENT.md`](./SETUP_ENVIRONMENT.md) - Configuración local
- [`RENDER_DEPLOYMENT.md`](./RENDER_DEPLOYMENT.md) - Despliegue en Render
- `.NET 8.0 Docs`: https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-8
- `Entity Framework Core`: https://learn.microsoft.com/en-us/ef/core/

## 🤝 Integración con Dashboard

La integración se realiza a través de:

1. **Edge Function** (`sync-biometric-device`)
   - Proxy que llama al SDK
   - Procesa respuestas
   - Guarda en BD

2. **Hook React** (`useBiometricSync`)
   - Sincronización manual/automática
   - Estado de conexión
   - Historial

3. **Componente UI** (`BiometricSyncPanel`)
   - Configuración de URL
   - Botones de sincronización
   - Tabs de dispositivos/registros/historial

## ✅ Checklist de Despliegue

- [ ] Dockerfile compila sin errores
- [ ] Variables de entorno están configuradas
- [ ] BD es accesible
- [ ] Endpoints responden correctamente
- [ ] Tests pasan
- [ ] Logs no muestran errores
- [ ] Dashboard puede conectarse
- [ ] Sincronización funciona

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en Render
2. Verifica conectividad a BD en Supabase
3. Consulta [`RENDER_DEPLOYMENT.md`](./RENDER_DEPLOYMENT.md) - Sección "Solución de Problemas"
4. Contacta al soporte técnico

---

**Versión**: 1.0  
**Última actualización**: 2024  
**Estado**: ✅ Production-ready
