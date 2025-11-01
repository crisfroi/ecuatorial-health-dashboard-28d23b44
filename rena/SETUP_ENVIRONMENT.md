# Configuración de Entorno Local para Desarrollo

Guía para configurar y ejecutar el SDK Qiandao localmente antes de desplegar a Render.

## 🖥️ Requisitos

- **.NET SDK 8.0** o superior
- **PostgreSQL 13+** (o conexión a Supabase)
- **Git**
- Editor: Visual Studio Code o Visual Studio

## 📥 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/your-repo.git
cd your-repo
```

### 2. Restaurar Dependencias

```bash
cd rena/Qiandao.Web
dotnet restore
cd ../..
```

### 3. Configurar appsettings.json

Edita `rena/Qiandao.Web/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=your_password"
  },
  "SocketServer": {
    "Port": 8080
  }
}
```

Para Supabase:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=your-project.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.YOUR_PROJECT_ID;Password=YOUR_PASSWORD;Timeout=30;"
  }
}
```

## 🚀 Ejecutar Localmente

### Opción A: Con Visual Studio

1. Abre `rena/Qiandao.Web/Qiandao.Web.sln`
2. Click derecho en "Qiandao.Web" → "Set as Startup Project"
3. Presiona `F5` o "Debug"

### Opción B: Con línea de comandos

```bash
cd rena/Qiandao.Web
dotnet run --launch-profile https
```

El servidor estará disponible en:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`

## 🔌 API Endpoints

Una vez en ejecución, prueba los endpoints:

```bash
# Listar dispositivos
curl http://localhost:5000/api/device

# Obtener registros
curl http://localhost:5000/api/record

# Estado del SDK
curl http://localhost:5000/api/status
```

## 🐳 Ejecutar con Docker (Local)

```bash
# Build imagen
docker build -f rena/Dockerfile -t qiandao-sdk:local .

# Run contenedor
docker run -d \
  -p 8080:8080 \
  -e DB_HOST=localhost \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  -e DB_NAME=postgres \
  --name qiandao-local \
  qiandao-sdk:local

# Ver logs
docker logs -f qiandao-local

# Detener
docker stop qiandao-local
docker rm qiandao-local
```

## 🧪 Testing

### Test de Conexión BD

```bash
cd rena/Qiandao.Web
dotnet test
```

### Test Manual del API

```bash
# Compilar
dotnet build -c Release

# Ejecutar
dotnet bin/Release/net8.0/Qiandao.Web.dll

# En otra terminal
curl http://localhost:8080/api/device -H "Content-Type: application/json"
```

## 📝 Estructura del Código

```
rena/
├── Qiandao.Model/          # Modelos de datos
│   ├── Entity/             # Entidades de BD
│   ├── Request/            # Modelos de solicitud
│   └── Response/           # Modelos de respuesta
├── Qiandao.Service/        # Lógica de negocio
│   ├── DeviceService.cs    # Gestión de dispositivos
│   ├── PersonService.cs    # Gestión de personas
│   ├── RecordService.cs    # Gestión de registros
│   └── Db.cs              # Acceso a BD
├── Qiandao.Web/            # Aplicación ASP.NET Core
│   ├── Controllers/        # Endpoints de API
│   ├── Program.cs         # Configuración
│   ├── appsettings.json   # Settings
│   └── wwwroot/           # Archivos estáticos
└── Dockerfile             # Configuración para Docker
```

## 🔧 Configuración Avanzada

### Usar Variable de Entorno para BD

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=mypassword
export DB_NAME=postgres

dotnet run
```

### Logging Detallado

Edita `appsettings.Development.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft": "Information"
    }
  }
}
```

### Pool de Conexiones

Para optimizar en producción, ajusta en `appsettings.Production.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=...;Pool Size=20;Min Pool Size=5;..."
  }
}
```

## 🐛 Troubleshooting

### "Connection refused"

Verifica que PostgreSQL/Supabase está accesible:

```bash
psql -h your-host -U your-user -d postgres
```

### "Cannot connect to SDK from Dashboard"

Asegúrate que:
1. El SDK está corriendo en `http://localhost:8080` o tu URL
2. CORS está habilitado (check `Program.cs`)
3. El firewall permite la conexión

### "Logs not showing"

Activa logging detallado en `appsettings.Development.json`

## ✅ Checklist Antes de Desplegar

- [ ] BD conecta sin errores
- [ ] Endpoints responden correctamente
- [ ] Docker image compila
- [ ] Variables de entorno están configuradas
- [ ] Tests pasan
- [ ] Logs son claros y sin errores

---

**Próximo paso:** Despliega en Render usando `RENDER_DEPLOYMENT.md`
