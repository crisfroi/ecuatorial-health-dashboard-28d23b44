#!/usr/bin/env node

/**
 * Script de diagnóstico para verificar migraciones HOSIX en Supabase
 * 
 * Uso:
 *   npx ts-node scripts/test-migrations.ts
 *   node --loader tsx scripts/test-migrations.ts
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================
// CONFIGURACIÓN
// ============================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wdieynendfjbkbhfovrx.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
}

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`)
}

// ============================================================
// OBTENER MIGRACIONES DE ARCHIVO
// ============================================================

function getMigrationsFromFiles() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  return files.map(file => ({
    filename: file,
    path: path.join(MIGRATIONS_DIR, file),
    timestamp: file.substring(0, 14),
    name: file.replace(/\.sql$/, '')
  }))
}

// ============================================================
// OBTENER TABLAS DE SUPABASE
// ============================================================

async function getSupabaseInfo(supabase) {
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name, table_schema')
    .eq('table_schema', 'public')

  if (error) {
    throw new Error(`Error obteniendo tablas: ${error.message}`)
  }

  return tables || []
}

// ============================================================
// EXTRAER TABLAS DE SQL
// ============================================================

function extractTablesFromSql(sql) {
  const tableRegex = /CREATE TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi
  const matches = sql.matchAll(tableRegex)
  const tables = new Set()

  for (const match of matches) {
    tables.add(match[1].toLowerCase())
  }

  return Array.from(tables)
}

// ============================================================
// LEER ARCHIVO SQL
// ============================================================

function readMigrationFile(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

// ============================================================
// VERIFICAR MIGRACIONES
// ============================================================

async function checkMigrations() {
  try {
    log('\n' + '='.repeat(70), 'bright')
    log('  VERIFICADOR DE MIGRACIONES HOSIX', 'bright')
    log('='.repeat(70) + '\n', 'bright')

    // 1. Validar configuración
    log('📋 Validando configuración...', 'blue')
    if (!SUPABASE_URL) {
      log('❌ VITE_SUPABASE_URL no está configurada', 'red')
      process.exit(1)
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      log('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada', 'red')
      log('   Configure en variables de entorno o .env', 'yellow')
      process.exit(1)
    }

    log('✅ Configuración OK\n', 'green')

    // 2. Conectar a Supabase
    log('🔗 Conectando a Supabase...', 'blue')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) {
      log(`❌ Error de conexión: ${userError.message}`, 'red')
      process.exit(1)
    }

    log('✅ Conectado a Supabase\n', 'green')

    // 3. Obtener migraciones de archivos
    log('📂 Leyendo migraciones de archivos...', 'blue')
    const fileMigrations = getMigrationsFromFiles()
    log(`✅ Se encontraron ${fileMigrations.length} migraciones\n`, 'green')

    // 4. Obtener tablas de Supabase
    log('🔍 Obteniendo tablas de Supabase...', 'blue')
    const supabaseTables = await getSupabaseInfo(supabase)
    const tableNames = new Set(supabaseTables.map(t => t.table_name))
    log(`✅ Se encontraron ${tableNames.size} tablas\n`, 'green')

    // 5. Analizar migraciones
    log('📊 Analizando migraciones...', 'blue')
    log('─'.repeat(70) + '\n', 'dim')

    const migrationAnalysis = []
    let tablesFound = new Set()
    let tablesMissing = new Set()

    for (const migration of fileMigrations) {
      const sql = readMigrationFile(migration.path)
      const expectedTables = extractTablesFromSql(sql)

      const status = expectedTables.every(table => tableNames.has(table))
        ? 'APLICADA'
        : 'PENDIENTE'

      expectedTables.forEach(t => {
        if (tableNames.has(t)) {
          tablesFound.add(t)
        } else {
          tablesMissing.add(t)
        }
      })

      migrationAnalysis.push({
        filename: migration.filename,
        status,
        expectedTables,
        appliedTables: expectedTables.filter(t => tableNames.has(t)),
        missingTables: expectedTables.filter(t => !tableNames.has(t))
      })

      const statusColor = status === 'APLICADA' ? 'green' : 'yellow'
      log(`${status === 'APLICADA' ? '✅' : '⚠️'} ${migration.filename}`, statusColor)
      
      if (expectedTables.length > 0) {
        log(`    Tablas esperadas: ${expectedTables.join(', ')}`, 'dim')
        if (expectedTables.some(t => !tableNames.has(t))) {
          const missing = expectedTables.filter(t => !tableNames.has(t))
          log(`    ❌ Faltantes: ${missing.join(', ')}`, 'red')
        }
      }
    }

    log('\n' + '─'.repeat(70) + '\n', 'dim')

    // 6. Resumen
    log('📈 RESUMEN', 'bright')
    log('─'.repeat(70) + '\n', 'dim')

    const aplicadas = migrationAnalysis.filter(m => m.status === 'APLICADA').length
    const pendientes = migrationAnalysis.filter(m => m.status === 'PENDIENTE').length

    log(`Total de migraciones: ${fileMigrations.length}`, 'blue')
    log(`  ✅ Aplicadas: ${aplicadas} (${Math.round(aplicadas / fileMigrations.length * 100)}%)`, 'green')
    log(`  ⚠️  Pendientes: ${pendientes} (${Math.round(pendientes / fileMigrations.length * 100)}%)`, 'yellow')

    log(`\nTablas en Supabase: ${tableNames.size}`, 'blue')
    log(`  ✅ Esperadas (aplicadas): ${tablesFound.size}`, 'green')
    log(`  ❌ Faltantes: ${tablesMissing.size}`, 'red')

    if (tablesMissing.size > 0) {
      log(`\nTablas que faltan aplicar:`, 'yellow')
      Array.from(tablesMissing).slice(0, 10).forEach(t => {
        log(`  - ${t}`, 'red')
      })
      if (tablesMissing.size > 10) {
        log(`  ... y ${tablesMissing.size - 10} más`, 'red')
      }
    }

    // 7. Migraciones pendientes
    const pendingMigrations = migrationAnalysis.filter(m => m.status === 'PENDIENTE')
    if (pendingMigrations.length > 0) {
      log(`\n⚠️  Migraciones PENDIENTES (${pendingMigrations.length}):`, 'yellow')
      log('─'.repeat(70) + '\n', 'dim')

      pendingMigrations.forEach(m => {
        log(`📄 ${m.filename}`, 'yellow')
        log(`   Tablas a crear: ${m.missingTables.join(', ')}`, 'red')
      })
    }

    // 8. Tabla hosix_usuarios
    log('\n' + '─'.repeat(70) + '\n', 'dim')
    log('🔑 VERIFICACIÓN DE TABLA CRÍTICA: hosix_usuarios', 'bright')

    const hasUsersTable = tableNames.has('hosix_usuarios')
    log(`  Estado: ${hasUsersTable ? '✅ EXISTE' : '❌ NO EXISTE'}`, 
      hasUsersTable ? 'green' : 'red')

    // 9. Resumen tablas HOSIX
    log('\n📋 TABLAS HOSIX ENCONTRADAS:', 'bright')
    const hosixTables = Array.from(tableNames)
      .filter(t => t.startsWith('hosix_'))
      .sort()

    if (hosixTables.length > 0) {
      log(`Total: ${hosixTables.length} tablas\n`, 'blue')
      hosixTables.forEach(table => {
        log(`  ✅ ${table}`, 'green')
      })
    } else {
      log('  ❌ No se encontraron tablas hosix_*', 'red')
    }

    log('\n' + '='.repeat(70), 'bright')
    log('  FIN DE VERIFICACIÓN', 'bright')
    log('='.repeat(70) + '\n', 'bright')

    // 10. Recomendaciones
    if (pendientes > 0) {
      log('📌 PRÓXIMOS PASOS:', 'yellow')
      log('1. Aplicar las migraciones pendientes:', 'blue')
      log('   npm run apply-migrations:mcp', 'magenta')
      log('   o', 'blue')
      log('   npm run apply-migrations:cli', 'magenta')
      log('\n2. Ejecutar nuevamente para verificar:', 'blue')
      log('   npx ts-node scripts/test-migrations.ts', 'magenta')
    } else {
      log('✅ ¡Todas las migraciones están aplicadas!', 'green')
    }

    process.exit(pendientes > 0 ? 1 : 0)
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  }
}

// ============================================================
// INICIAR
// ============================================================

checkMigrations()
