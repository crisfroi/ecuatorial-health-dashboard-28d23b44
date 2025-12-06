# 📝 Paso a Paso: Aplicar 33 Migraciones Faltantes

**Objetivo**: Aplicar 33 migraciones pendientes a Supabase
**Tiempo estimado**: 5-10 minutos
**Dificultad**: ⭐ Fácil (método recomendado)
**Requisitos**: Navegador web, acceso a Supabase

---

## 📊 Resumen de Estado

```
┌─────────────────────────────────────┐
│  ESTADO ACTUAL DE MIGRACIONES       │
├─────────────────────────────────────┤
│  ✅ Aplicadas:     11/44 (25%)      │
│  ⚠️  Pendientes:   33/44 (75%)      │
│  🎯 Objetivo:     44/44 (100%)      │
└─────────────────────────────────────┘
```

---

## ✅ Método 1: Dashboard (RECOMENDADO - Más Simple)

### Paso 1️⃣: Generar archivo SQL compilado
```bash
npm run compile-migrations
```
**Resultado**: Se genera `supabase-migrations-compiled.sql` (264 KB)

### Paso 2️⃣: Abrir Supabase Dashboard
1. Abre https://app.supabase.com en tu navegador
2. Inicia sesión con tu cuenta
3. Selecciona el proyecto: **wdieynendfjbkbhfovrx**

```
[Dashboard Principal de Supabase]
├── Projects
│   └── ✅ wdieynendfjbkbhfovrx (selecciona este)
```

### Paso 3️⃣: Abrir SQL Editor
1. En la barra lateral izquierda, haz clic en **SQL Editor**
2. Haz clic en **+ New Query** (botón azul)

```
[SQL Editor]
├── SQL Editor (en sidebar)
│   ├── New Query (botón azul)
│   └── Saved Queries
```

### Paso 4️⃣: Copiar contenido SQL
1. Abre el archivo `supabase-migrations-compiled.sql` en tu editor favorito
   ```bash
   cat supabase-migrations-compiled.sql
   # O abrirlo con un editor de texto
   ```
2. Selecciona TODO el contenido (Ctrl+A o Cmd+A)
3. Copia (Ctrl+C o Cmd+C)

### Paso 5️⃣: Pegar en Supabase
1. En Supabase SQL Editor, pega el contenido (Ctrl+V o Cmd+V)
2. Verifica que todo el SQL esté bien pegado
3. Revisa las primeras líneas del SQL

```sql
-- MIGRACIONES HOSIX COMPILADAS
-- Generado: 2025-02-06T12:34:56.000Z
-- Total: 44 migraciones
-- URL: https://wdieynendfjbkbhfovrx.supabase.co

-- INSTRUCCIONES:
-- 1. Abre https://app.supabase.com
-- ... (aquí debe estar el resto del SQL)
```

### Paso 6️⃣: Ejecutar migraciones
1. Haz clic en el botón **RUN** (parte superior derecha)
2. Espera a que se ejecute (puede tomar 2-5 minutos)
3. Revisa los resultados en la sección **Output**

```
[Botones SQL Editor]
├── ▶️  RUN (botón azul grande - HAS CLIC AQUÍ)
├── Save query
└── Format SQL
```

### Paso 7️⃣: Verificar ejecución
En la sección **Output** debajo del editor:

```
✅ SUCCESS (si todo va bien)
   - Executing...
   - Query successful
   - Completed in X ms

⚠️  WARNINGS (avisos, no son errores graves)
   - IF NOT EXISTS: tabla ya existe (normal)
   - algunos warnings puede ignorarse

❌ ERRORS (errores graves, requieren acción)
   - Foreign key constraint
   - Syntax error
   - Permission denied
```

### Paso 8️⃣: Verificar tablas creadas
1. En la barra lateral, haz clic en **Table Editor**
2. Busca tablas que empiezan con **hosix_**
3. Deberías ver ~50+ tablas nuevas

```
[Table Editor]
├── Tables
│   ├── ✅ hosix_usuarios (NUEVA)
│   ├── ✅ hosix_pacientes (NUEVA)
│   ├── ✅ hosix_servicios (NUEVA)
│   ├── ✅ hosix_departamentos (NUEVA)
│   └── ... (y muchas más)
```

### Paso 9️⃣: Verificar en terminal
```bash
npm run test-migrations:verbose
```

Resultado esperado:
```
Total migraciones: 44
✅ Aplicadas: 44
⚠️  Pendientes: 0
📊 Cobertura: 100%
```

### Paso 🔟: Listo ✅
¡Las migraciones están aplicadas!

---

## ✅ Método 2: Supabase CLI (Si tienes CLI instalado)

### Paso 1: Instalar CLI
```bash
npm install -g supabase
```

### Paso 2: Autenticarse
```bash
supabase login
# Se abrirá una ventana para autenticarse
```

### Paso 3: Enlazar proyecto
```bash
supabase link --project-ref wdieynendfjbkbhfovrx
```

### Paso 4: Aplicar migraciones
```bash
supabase db push
```

### Paso 5: Verificar
```bash
npm run test-migrations:verbose
```

---

## ✅ Método 3: Script Rápido (Automático)

### Paso 1: Ejecutar script
```bash
npm run apply-migrations:quick
```

### Paso 2: Seleccionar método
El script detectará automáticamente el mejor método disponible:
- 🌐 Dashboard (sin requisitos)
- 📦 Supabase CLI (si está instalado)
- 🐘 psql (si está disponible)

### Paso 3: Seguir instrucciones
El script te guiará paso a paso

### Paso 4: Verificar
```bash
npm run test-migrations:verbose
```

---

## 🔍 Verificación Final

### Comando de verificación
```bash
npm run test-migrations:verbose
```

### Resultado esperado (después de aplicar)
```
================================================================================
  VERIFICADOR AVANZADO DE MIGRACIONES HOSIX
================================================================================

📋 Validando configuración...
✅ Validación OK

🔗 Conectando a Supabase...
✅ Conectado

📊 Analizando migraciones...
📈 RESULTADO DEL ANÁLISIS
────────────────────────────────────────────────────────────────────────────────

Total migraciones: 44
  ✅ Aplicadas: 44 ✅✅✅
  ⚠️  Pendientes: 0
  📊 Cobertura: 100%
```

### ¡Éxito! Todas las migraciones están aplicadas.

---

## 🚨 Solución de Problemas

### Problema: Error de conexión a Supabase
**Síntoma**:
```
❌ Error: No se puede conectar a Supabase
```

**Solución**:
1. Verifica que tienes internet
2. Usa método Dashboard (no requiere conexión directa)
3. Abre https://app.supabase.com manualmente

### Problema: "Table already exists"
**Síntoma**:
```
⚠️ table "hosix_usuarios" already exists
```

**Causa**: La tabla ya estaba en la base de datos

**Solución**:
- ✅ Es normal - SQL usa `IF NOT EXISTS`
- Continúa con la siguiente migración
- No es un error grave

### Problema: Foreign Key Constraint Error
**Síntoma**:
```
❌ ERROR: insert or update on table violates foreign key constraint
```

**Causa**: Dependencia entre tablas

**Solución**:
1. Verifica que todas las migraciones se apliquen
2. Revisa el orden de ejecución
3. Intenta ejecutar el SQL compilado completo nuevamente

### Problema: Timeout en Supabase
**Síntoma**:
```
❌ ERROR: Query timeout - max 60000ms
```

**Causa**: El SQL es muy grande

**Solución**:
1. Divide el archivo en 2 partes
2. Ejecuta primero migraciones base (001-005)
3. Luego ejecuta el resto

```bash
npm run compile-migrations -- --start 20250116 --end 20250122
npm run compile-migrations -- --start 20250205 --end 20251105
```

### Problema: Permission Denied
**Síntoma**:
```
❌ ERROR: Permission denied
```

**Causa**: Credenciales insuficientes

**Solución**:
1. Verifica que usas Service Role Key (no Anon Key)
2. Verifica en Supabase Settings > API > Keys

---

## 📝 Checklist de Verificación

Después de aplicar las migraciones, verifica:

```
□ Archivo SQL compilado generado (supabase-migrations-compiled.sql)
□ SQL pegado en Supabase SQL Editor
□ Botón RUN ejecutado sin errores críticos
□ Tabla Editor muestra tablas hosix_*
□ npm run test-migrations muestra 44/44 aplicadas
□ No hay errores de foreign keys
□ Se pueden ver las columnas de las tablas

┌─────────────────────────────────────┐
│ SI TODO ESTÁ ✅ → LISTO PARA USAR   │
└─────────────────────────────────────┘
```

---

## 🚀 Próximos Pasos

### 1. Verificar operatividad
```bash
npm run dev
# Abre http://localhost:5173
# Verifica que la app funciona
```

### 2. Revisar logs
En Supabase Dashboard:
- Logs > Realtime
- SQL Editor > Query Results
- Functions (si las hay)

### 3. Ejecutar pruebas
```bash
npm run test-migrations:report
# Genera reporte detallado
```

### 4. Proceder con desarrollo
- Continuar con la implementación de features
- Las migraciones base están listas
- La base de datos HOSIX está operativa

---

## 📚 Comandos Útiles de Referencia

```bash
# Verificación y reportes
npm run test-migrations              # Verificación rápida
npm run test-migrations:verbose      # Con detalles
npm run test-migrations:report       # Reporte Markdown
npm run test-migrations:json         # Salida JSON

# Compilación
npm run compile-migrations           # Compilar todas
npm run compile-migrations -- --filter hosix_  # Solo HOSIX

# Aplicación
npm run apply-migrations:quick       # Script interactivo
npm run apply-migrations:cli         # Via Supabase CLI
npm run apply-migrations:psql        # Via psql

# Desarrollo
npm run dev                          # Iniciar servidor
npm run build                        # Compilar
npm run lint                         # Validar código
```

---

## 💡 Consejos Prácticos

1. **Copiar/Pegar en Supabase**:
   - Usa Ctrl+A para seleccionar todo en el archivo
   - Usa Ctrl+V para pegar en SQL Editor
   - Espera a que se complete la carga

2. **Monitorear progreso**:
   - SQL Editor muestra "Executing..." durante la ejecución
   - No cierres la ventana durante la ejecución
   - Puedes ver el progreso en tiempo real

3. **Si algo va mal**:
   - Los errores se muestran en Output
   - IF NOT EXISTS ignora tablas existentes
   - Puedes ejecutar nuevamente sin problema

4. **Performance**:
   - El SQL compilado es 264 KB
   - Supabase puede tardarse 2-5 minutos
   - No es un problema si tarda

---

## ✅ Validación Final

Después de completar, deberías tener:

✅ **44/44 migraciones aplicadas**
✅ **~50+ tablas HOSIX creadas**
✅ **~20 funciones SQL activas**
✅ **~30 triggers SQL activos**
✅ **Cobertura: 100%**

**Estado**: 🟢 Listo para producción

---

**¿Necesitas ayuda?**
- Lee: `GUIA_RAPIDA_MIGRACIONES.md`
- Lee: `MIGRACIONES_STATUS.md`
- Ejecuta: `npm run test-migrations:verbose`
- Email: crisfroi@geprstotec.com

---

*Última actualización: 2025-02-06*
*Paso a paso para aplicar 33 migraciones faltantes*
*Sistema de verificación automática completado ✅*
