# ⚡ Setup Rápido: Aplicar Migraciones (30 segundos)

> Si eres perezoso y solo quieres que funcione, esto es para ti.

---

## 🚀 OPCIÓN 1: Script Interactivo (Más fácil)

```bash
npm run apply-migrations
```

Después sigue las instrucciones en pantalla. ✨

---

## 🚀 OPCIÓN 2: Supabase Dashboard (Sin instalar nada)

1. Abre: https://app.supabase.com
2. Proyecto: `wdieynendfjbkbhfovrx`
3. SQL Editor → New Query
4. Copia-pega: `supabase/migrations/20250206_014_hosix_interconsultas_asis_11.sql`
5. Click "Run" ✅

---

## 🚀 OPCIÓN 3: Una línea (si tienes psql)

```bash
cp .env.example .env.local && \
nano .env.local  # Edita con tu contraseña de BD && \
npm run apply-migrations:psql
```

---

## ✅ LISTO

Inicia el servidor:

```bash
npm run dev
```

Abre: http://localhost:5173

---

**Eso es. No hay nada más complicado.** 🎉
