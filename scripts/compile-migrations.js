#!/usr/bin/env node

/**
 * Script para compilar todas las migraciones HOSIX en un archivo SQL único
 * 
 * Uso:
 *   node scripts/compile-migrations.js [--output archivo.sql] [--pending] [--filter pattern]
 * 
 * Opciones:
 *   --output    : Nombre del archivo de salida (default: supabase-migrations-compiled.sql)
 *   --pending   : Solo incluir migraciones pendientes (requiere verificación previa)
 *   --filter    : Filtrar migraciones por patrón (ej: hosix_)
 *   --start     : Migración inicial (timestamp o nombre)
 *   --end       : Migración final (timestamp o nombre)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

const args = process.argv.slice(2)
let outputFile = 'supabase-migrations-compiled.sql'
let filterPattern = ''
let startTimestamp = ''
let endTimestamp = ''
let pendingOnly = false

// Parseado de argumentos
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output') outputFile = args[++i]
  if (args[i] === '--filter') filterPattern = args[++i]
  if (args[i] === '--start') startTimestamp = args[++i]
  if (args[i] === '--end') endTimestamp = args[++i]
  if (args[i] === '--pending') pendingOnly = true
}

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
}

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`)
}

try {
  log('\n📝 Compilador de Migraciones HOSIX\n', 'blue')

  // Obtener archivos
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql') && !f.includes('/supabase/'))
    .sort()

  let filtered = files

  // Aplicar filtros
  if (filterPattern) {
    filtered = filtered.filter(f => f.includes(filterPattern))
    log(`📌 Filtro aplicado: ${filterPattern}`, 'yellow')
  }

  if (startTimestamp) {
    filtered = filtered.filter(f => f >= startTimestamp)
    log(`📌 Inicio: ${startTimestamp}`, 'yellow')
  }

  if (endTimestamp) {
    filtered = filtered.filter(f => f <= endTimestamp)
    log(`📌 Fin: ${endTimestamp}`, 'yellow')
  }

  log(`\n✅ Se compilarán ${filtered.length} migraciones\n`)

  // Compilar
  let compiledSQL = '-- MIGRACIONES HOSIX COMPILADAS\n'
  compiledSQL += `-- Generado: ${new Date().toISOString()}\n`
  compiledSQL += `-- Total: ${filtered.length} migraciones\n`
  compiledSQL += `-- URL: https://wdieynendfjbkbhfovrx.supabase.co\n\n`
  compiledSQL += '-- INSTRUCCIONES:\n'
  compiledSQL += '-- 1. Abre https://app.supabase.com\n'
  compiledSQL += '-- 2. Selecciona el proyecto wdieynendfjbkbhfovrx\n'
  compiledSQL += '-- 3. Ve a SQL Editor > New Query\n'
  compiledSQL += '-- 4. Copia y pega este contenido\n'
  compiledSQL += '-- 5. Revisa los warnings y errores\n'
  compiledSQL += '-- 6. Haz clic en "Run"\n'
  compiledSQL += '-- 7. Verifica los resultados\n'
  compiledSQL += '-- 8. Si hay errores, revisa el archivo de migración individual\n\n'
  compiledSQL += '-- '.repeat(40) + '\n\n'

  let count = 0
  for (const file of filtered) {
    count++
    const filePath = path.join(MIGRATIONS_DIR, file)
    const content = fs.readFileSync(filePath, 'utf8')

    compiledSQL += `-- ============================================\n`
    compiledSQL += `-- [${count}/${filtered.length}] ${file}\n`
    compiledSQL += `-- ============================================\n\n`
    compiledSQL += content
    compiledSQL += '\n\n'
  }

  // Guardar
  const outputPath = path.join(__dirname, '..', outputFile)
  fs.writeFileSync(outputPath, compiledSQL)

  const stats = fs.statSync(outputPath)
  const sizeKB = (stats.size / 1024).toFixed(2)

  log(`✅ Archivo compilado: ${outputFile}`, 'green')
  log(`📊 Tamaño: ${sizeKB} KB`, 'green')
  log(`📄 Migraciones: ${count}`, 'green')

  log(`\n📌 Próximos pasos:`, 'blue')
  log(`1. Abre: https://app.supabase.com`, 'blue')
  log(`2. Proyecto: wdieynendfjbkbhfovrx`, 'blue')
  log(`3. SQL Editor > New Query`, 'blue')
  log(`4. Copia el contenido de: ${outputFile}`, 'blue')
  log(`5. Pega y ejecuta\n`, 'blue')

  process.exit(0)
} catch (error) {
  log(`❌ Error: ${error.message}\n`, 'red')
  process.exit(1)
}
