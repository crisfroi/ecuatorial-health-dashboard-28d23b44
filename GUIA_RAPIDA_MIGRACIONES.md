# 🚀 Guía Rápida: Aplicación de Migraciones HOSIX

> **Estado**: 11/44 migraciones aplicadas. **33 migraciones pendientes**.

## 📋 Resumen Rápido

1. **Verificar migraciones**: `npm run test-migrations`
2. **Compilar migraciones**: `npm run compile-migrations`
3. **Aplicar en Supabase**: Copiar `supabase-migrations-compiled.sql` al SQL Editor de Supabase
4. **Verificar aplicación**: `npm run test-migrations` nuevamente

---

## 🔍 Paso 1: Verificar Estado Actual

```bash
# Ver estado de migraciones aplicadas
npm run test-migrations

# Con detalles completos
npm run test-migrations:verbose

# Generar reporte en Markdown
npm run test-migrations:report
```

**Resultado Actual**:
- ✅ Migraciones aplicadas: 11/44 (25%)
- ⚠️ Migraciones pendientes: 33/44 (75%)
- 📊 Cobertura: 0.0% (tablas faltantes)

### Migraciones Pendientes Principales:
1. `20250116_001_hosix_base_schema.sql` - Esquema base (usuarios, departamentos, servicios)
2. `20250116_002_hosix_pacientes_historia_clinica.sql` - Módulo de pacientes
3. `20250116_003_hosix_urgencias_citas_agendas.sql` - Urgencias y citas
4. `20250116_004_hosix_hospitalizacion_quirofanos_farmacia.sql` - Hospitalización
5. `20250116_005_hosix_facturacion_reportes.sql` - Facturación
6. Y 28 migraciones más...

---

## 📝 Paso 2: Compilar Migraciones

Genera un único archivo SQL con todas las migraciones:

```bash
# Compilar todas las migraciones
npm run compile-migrations

# Resultado: supabase-migrations-compiled.sql (264 KB, 44 migraciones)
```

Este archivo incluye:
- ✅ Todas las 44 migraciones ordenadas
- 📝 Comentarios descriptivos
- 🎯 Instrucciones de aplicación
- 🔗 Referencia al proyecto Supabase

---

## ⚡ Paso 3: Aplicar en Supabase Dashboard (Recomendado)

**Opción A: Via Supabase Dashboard (Más Simple)**

1. Abre https://app.supabase.com
2. Selecciona el proyecto: **wdieynendfjbkbhfovrx**
3. Ve a **SQL Editor** → **New Query**
4. Abre el archivo `supabase-migrations-compiled.sql`
5. Copia todo el contenido
6. Pega en el editor de Supabase
7. Haz clic en **Run**
8. Verifica que todas las migraciones se ejecuten sin errores

**Opción B: Via Supabase CLI (Si tienes CLI instalado)**

```bash
# Requiere autenticación previa
supabase login

# Enlaza el proyecto
supabase link --project-ref wdieynendfjbkbhfovrx

# Aplica las migraciones
supabase db push
```

**Opción C: Via Script Rápido**

```bash
# Aplicar con bash script (detecta método automáticamente)
npm run apply-migrations:quick

# O especificar método
npm run apply-migrations:quick -- --method dashboard
npm run apply-migrations:quick -- --method cli
```

---

## ✅ Paso 4: Verificar Aplicación

Después de aplicar, verifica que todo está correcto:

```bash
# Verificar migraciones nuevamente
npm run test-migrations

# Resultado esperado:
# Total migraciones: 44
# ✅ Aplicadas: 44
# ⚠️  Pendientes: 0
# 📊 Cobertura: 100%
```

---

## 🔧 Opciones Avanzadas

### Compilar solo migraciones específicas

```bash
# Solo migraciones que contienen "hosix_"
npm run compile-migrations -- --filter hosix_

# Solo migraciones de datos dinámicos
npm run compile-migrations -- --filter dynamic

# Desde una fecha específica
npm run compile-migrations -- --start 20250116
```

### Generar reportes

```bash
# Reporte en Markdown
npm run test-migrations:report

# Output en JSON
npm run test-migrations:json > migration-report.json

# Salida por consola con detalles
npm run test-migrations:verbose
```

---

## 📊 Scripts Disponibles

| Comando | Descripción |
|---------|------------|
| `npm run test-migrations` | Verifica estado de migraciones |
| `npm run test-migrations:verbose` | Verificación con detalles |
| `npm run test-migrations:report` | Genera reporte en Markdown |
| `npm run test-migrations:json` | Salida en JSON |
| `npm run compile-migrations` | Compila todas las migraciones |
| `npm run apply-migrations:quick` | Script rápido de aplicación |
| `npm run apply-migrations:cli` | Via Supabase CLI |
| `npm run apply-migrations:psql` | Via psql directo |
| `npm run apply-migrations:mcp` | Via MCP de Supabase |

---

## 🚨 Troubleshooting

### Error: "No se puede conectar a Supabase"

**Causa**: Falta la Service Role Key

**Solución**:
```bash
# Configurar la variable de entorno
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# O añadir a .env
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Error: "Connection refused"

**Causa**: Falta conectividad a internet

**Solución**:
- Verifica conexión a internet
- Usa opción Dashboard (no requiere conexión directa)

### Error: "Table already exists"

**Causa**: La migración ya fue aplicada

**Solución**:
- La migración incluye `IF NOT EXISTS`, debería ignorar el error
- Verifica en Supabase Dashboard si la tabla existe

### Error: "Permission denied"

**Causa**: La clave no tiene permisos suficientes

**Solución**:
- Usa la Service Role Key (no Anon Key)
- Verifica permisos en Supabase Settings > API

---

## 🎯 Próximos Pasos

Después de aplicar las migraciones:

1. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. **Verificar tablas en Supabase**:
   - Abre https://app.supabase.com
   - Ve a Table Editor
   - Busca `hosix_`
   - Deberías ver ~50+ tablas

3. **Ejecutar pruebas**:
   ```bash
   npm run test-migrations -- --verbose
   ```

4. **Revisar logs de errores**:
   - SQL Editor de Supabase muestra todos los errores
   - Revisa los warnings en la consola

---

## 📚 Documentación Relacionada

- [`MIGRACIONES_INTERCONSULTAS_APLICACION.md`](./MIGRACIONES_INTERCONSULTAS_APLICACION.md) - Migraciones de interconsultas
- [`ESTADO_HOSIX_CONSOLIDADO_2025-02-06.md`](./ESTADO_HOSIX_CONSOLIDADO_2025-02-06.md) - Estado general del proyecto
- [Supabase SQL Editor](https://app.supabase.com) - Dashboard SQL
- [Documentación de Supabase](https://supabase.com/docs)

---

## 🆘 Soporte

Si encuentras problemas:

1. **Verifica el estado**:
   ```bash
   npm run test-migrations:verbose
   ```

2. **Genera un reporte**:
   ```bash
   npm run test-migrations:report
   ```

3. **Revisa errores en Supabase**:
   - SQL Editor → Revisa la columna "Errors"

4. **Contacta al equipo**:
   - Email: crisfroi@geprstotec.com
   - Adjunta: `MIGRATION_REPORT.md`

---

**Última actualización**: 2025-02-06
**Proyecto**: Equatorial Health Dashboard (HOSIX)
**Estado**: En implementación
