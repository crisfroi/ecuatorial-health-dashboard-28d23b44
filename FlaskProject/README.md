# FlaskProject - Device Management System

Sistema de gestión de dispositivos de control de asistencia con soporte para comunicación WebSocket y HTTP.

## 🔧 Configuración

### Base de Datos

El sistema ahora utiliza **PostgreSQL (Supabase)** en lugar de MySQL.

#### Variables de Entorno (Recomendado para Producción)

```bash
DATABASE_URL=postgresql://user:password@host:port/database
WEBSOCKET_PORT=7788
UPLOAD_PATH=/path/to/uploads
FLASK_ENV=production
FLASK_DEBUG=0
```

#### Archivo de Configuración (Alternativo)

Editar `config/set.conf`:

```ini
[websocket]
host = 0.0.0.0
port = 7788

[db]
url=postgresql://postgres.wdieynendfjbkbhfovrx:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

## 🚀 Instalación

### 1. Instalar Dependencias

```bash
pip install -r requirements.txt
```

### 2. Configurar Base de Datos

Opción A - Variables de Entorno:
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
```

Opción B - Archivo de configuración:
Editar `config/set.conf` con tus credenciales

### 3. Crear Tablas

```bash
python -c "from app import db; db.create_all()"
```

### 4. Ejecutar Aplicación

**Desarrollo:**
```bash
python app.py
```

**Producción (Gunicorn):**
```bash
gunicorn -b 0.0.0.0:10000 -w 4 -k gevent app:app
```

## 📡 Endpoints

### HTTP Endpoints

- `GET /` - Interfaz web principal
- `GET /device` - Listar dispositivos
- `POST /device` - Crear dispositivo
- `POST /pub/api` - API HTTP para dispositivos
- `GET /pub/api` - Info del endpoint

### WebSocket Endpoints

- `ws://host/pub/chat` - Comunicación bidireccional con dispositivos

#### Comandos WebSocket Soportados

**Del dispositivo al servidor:**
- `reg` - Registro de dispositivo
- `sendlog` - Envío de logs de asistencia
- `senduser` - Envío de información de usuarios

**Del servidor al dispositivo:**
- `getuserlist` - Obtener lista de usuarios
- `getuserinfo` - Obtener información de usuario
- `setuserinfo` - Configurar usuario
- `getalllog` - Obtener todos los registros
- `getnewlog` - Obtener nuevos registros
- `deleteuser` - Eliminar usuario
- `initsys` - Inicializar sistema
- `setdevlock` - Configurar bloqueo de dispositivo
- `setuserlock` - Configurar bloqueo de usuario
- `getdevinfo` - Obtener información del dispositivo
- `setusername` - Configurar nombre de usuario
- `reboot` - Reiniciar dispositivo

## 🔌 Integración con Dispositivos

### Conexión WebSocket

El dispositivo debe conectarse a:
```
ws://your-server.com/pub/chat
```

### Formato de Mensajes

**Registro (reg):**
```json
{
  "cmd": "reg",
  "sn": "DEVICE_SERIAL_NUMBER"
}
```

**Respuesta:**
```json
{
  "ret": "reg",
  "result": true,
  "cloudtime": "2024-01-01 12:00:00"
}
```

## 🗄️ Migración desde MySQL

### Diferencias Clave

1. **Driver:** `pymysql` → `psycopg2-binary`
2. **URL Format:** 
   - Antes: `mysql+pymysql://user:pass@host/db`
   - Ahora: `postgresql://user:pass@host:port/db`

### Pool de Conexiones

El sistema usa pool de conexiones optimizado:
- Pool size: 10 conexiones
- Pool recycle: 3600 segundos
- Pre-ping habilitado para validar conexiones

## 📝 Logs

Los logs se imprimen en stdout/stderr y son capturados por el sistema de deployment (Render, etc.)

## 🔒 Seguridad

- Credenciales en variables de entorno
- Pool de conexiones con timeout
- Validación de comandos WebSocket
- Manejo de errores robusto

## 🌐 Deployment en Render

### Configuración

1. Conectar repositorio GitHub
2. Configurar variables de entorno:
   ```
   DATABASE_URL=postgresql://...
   FLASK_ENV=production
   ```
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `gunicorn -b 0.0.0.0:10000 -w 4 app:app`

### Verificación

Después del deploy:
```bash
curl https://your-app.onrender.com/pub/api
```

Debería retornar:
```json
{
  "status": "ok",
  "message": "Device API endpoint",
  "websocket_url": "ws://your-app.onrender.com/pub/chat"
}
```

## 🐛 Troubleshooting

### Error: "Can't connect to MySQL server"

✅ **Solución:** El sistema ahora usa PostgreSQL. Actualizar DATABASE_URL.

### Error: "No module named 'psycopg2'"

✅ **Solución:** 
```bash
pip install psycopg2-binary
```

### WebSocket no conecta

✅ **Verificar:**
1. Puerto 7788 abierto (si aplica)
2. URL correcta: `ws://host/pub/chat`
3. Firewall no bloquea WebSocket

### Uploads fallan

✅ **Solución:** Configurar UPLOAD_PATH en variable de entorno o crear directorio `uploads/`

## 📚 Estructura del Proyecto

```
FlaskProject/
├── app.py                 # Aplicación principal
├── database.py            # Configuración de BD
├── requirements.txt       # Dependencias
├── config/
│   ├── set.conf          # Configuración
│   └── readConf.py       # Lector de configuración
├── Models/               # Modelos de datos
├── Services/             # Lógica de negocio
├── web_socket/           # Gestión de WebSocket
└── uploads/              # Archivos subidos
```

## 🤝 Soporte

Para problemas o preguntas, verificar:
1. Logs del servidor
2. Conexión a PostgreSQL
3. Variables de entorno configuradas
4. Firewall y puertos abiertos
