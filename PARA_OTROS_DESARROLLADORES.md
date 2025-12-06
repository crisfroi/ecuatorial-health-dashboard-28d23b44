# 👨‍💻 Para Otros Desarrolladores

> "Solo quiero que funcione"

---

## ⚡ LA FORMA MÁS FÁCIL (Una línea)

Ejecuta esto y sigue las instrucciones:

```bash
npm run apply-migrations
```

**Eso es. No necesitas saber nada más.**

---

## 🎯 Lo que pasará

1. El script te preguntará cuál método prefieres
2. Seguirás las instrucciones paso a paso
3. Las migraciones se aplicarán automáticamente
4. El script verificará que todo está correcto

---

## 🔄 Alternativas (si lo anterior no funciona)

### Si tienes Supabase CLI

```bash
npm run apply-migrations:cli
```

### Si tienes PostgreSQL (`psql`)

```bash
# 1. Configurar (una sola vez)
cp .env.example .env.local
# Edita .env.local y cambia YOUR_PASSWORD por tu contraseña

# 2. Ejecutar
npm run apply-migrations:psql
```

### Si solo tienes Node.js

```bash
npm run apply-migrations:mcp
```

### Si ninguna de las anteriores

1. Abre: https://app.supabase.com
2. Proyecto: `wdieynendfjbkbhfovrx`
3. SQL Editor → New Query
4. Copia-pega el archivo: `supabase/migrations/20250206_014_hosix_interconsultas_asis_11.sql`
5. Click "Run"

---

## ✅ Verificación

Después de ejecutar, inicia el servidor:

```bash
npm run dev
```

Abre: http://localhost:5173

Si ves la aplicación, ¡está funcionando! 🎉

---

## ❓ ¿Algo no funciona?

### "SUPABASE_SERVICE_ROLE_KEY no configurada"

En `.env.local`, asegúrate de tener:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### "psql: command not found"

Instala PostgreSQL:
```bash
brew install postgresql  # macOS
```

### "Conexión rechazada"

Verifica tu contraseña de Supabase en el dashboard.

### "Tabla ya existe"

Normal. Las migraciones incluyen `IF NOT EXISTS`.

---

## 📚 Para Aprender Más

- `GUIA_APLICAR_MIGRACIONES.md` - Detalles técnicos
- `SETUP_MIGRACIONES_RAPIDO.md` - Versión rápida
- `scripts/README.md` - Info sobre los scripts

---

## 🚀 TL;DR

```bash
npm run apply-migrations
npm run dev
```

**Listo. Ya está.** ✨

---

*Si tienes dudas, pregunta al equipo. Hay documentación para todo.*
