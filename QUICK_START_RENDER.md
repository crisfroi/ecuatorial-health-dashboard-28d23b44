# ⚡ Guía Rápida: Desplegar SDK Qiandao en Render

**Tiempo estimado**: 20 minutos

## 1️⃣ Preparación (5 min)

### Obtener credenciales de Supabase

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleccionar tu proyecto
3. Ir a **Project Settings** → **Database**
4. Copiar las credenciales:

```
Host: your-project.pooler.supabase.com
Port: 6543
User: postgres.YOUR_PROJECT_ID
Password: (tu contraseña)
Database: postgres
```

### Aplicar migraciones de BD

```bash
# Configurar variables
export DB_HOST="your-project.pooler.supabase.com"
export DB_PORT="6543"
export DB_USER="postgres.YOUR_PROJECT_ID"
export DB_PASSWORD="your_password"
export DB_NAME="postgres"

# Ejecutar migración
cd code/rena
./scripts/run-migrations.sh  # Linux/Mac
# ó
.\scripts\run-migrations.ps1  # Windows
```

✅ **Verificar que las tablas fueron creadas**:
```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT -c "\dt"
```

## 2️⃣ Preparar Render (5 min)

### Crear cuenta en Render

1. Ve a [Render.com](https://render.com)
2. Click en "Get Started"
3. Crea cuenta con GitHub
4. Conecta tu repositorio que contiene la carpeta `rena/`

### Crear Web Service

1. Dashboard → **New +** → **Web Service**
2. Selecciona tu repositorio
3. Configura:
   - **Name**: `qiandao-sdk`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `rena/Dockerfile`
   - **Instance Type**: Starter Pro ($12/mo)

## 3️⃣ Configurar Variables de Entorno (5 min)

En Render, en la sección **Environment**:

| Variable | Valor |
|----------|-------|
| `DB_HOST` | `your-project.pooler.supabase.com` |
| `DB_PORT` | `6543` |
| `DB_USER` | `postgres.YOUR_PROJECT_ID` |
| `DB_PASSWORD` | (tu contraseña) |
| `DB_NAME` | `postgres` |
| `ASPNETCORE_ENVIRONMENT` | `Production` |

## 4️⃣ Desplegar (1 min)

Click en **"Create Web Service"** y espera 5-10 minutos.

Verifica que el estado sea **"Live"** (color verde).

## 5️⃣ Validar Despliegue (4 min)

### Health Check

```bash
# Reemplaza YOUR-SERVICE-URL con tu URL de Render
curl https://YOUR-SERVICE-URL.onrender.com/health

# Respuesta esperada:
# {"status":"healthy","timestamp":"2024-...","environment":"Production","service":"Qiandao SDK"}
```

### Probar Endpoints

```bash
# Listar dispositivos
curl https://YOUR-SERVICE-URL.onrender.com/api/device

# Respuesta esperada:
# {"code":0,"msg":"success","count":0,"data":[]}
```

### Revisar Logs

1. Render Dashboard → `qiandao-sdk` → **Logs**
2. Busca: `Application started` ✓

## ✅ ¡Listo!

Tu SDK está en producción. Ahora puedes:

- 🔗 Conectar el Dashboard a `https://YOUR-SERVICE-URL.onrender.com`
- 📊 Ver logs en Render Dashboard
- 📈 Monitorear en Supabase SQL Editor

## 🐛 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "Connection refused" | Verifica DB_HOST, DB_PORT en Render env vars |
| "Tables not found" | Vuelve a ejecutar `run-migrations.sh` |
| "Service won't start" | Revisa logs en Render (última línea del error) |
| "Timeout after 10 min" | Espera más, primer deploy toma tiempo |

## 📞 Necesitas Ayuda?

Consulta:
- `DEPLOYMENT_CHECKLIST.md` - Checklist completo
- `POSTGRESQL_SETUP.md` - Problemas con BD
- `RENA_MIGRATION_SUMMARY.md` - Resumen de cambios

## 🎯 Próximos Pasos

1. Conectar Dashboard al SDK
2. Configurar sincronización de dispositivos
3. Monitorear logs regularmente
4. Configurar alertas en Render

---

**¡Tu SDK Qiandao está listo para producción!** 🚀
