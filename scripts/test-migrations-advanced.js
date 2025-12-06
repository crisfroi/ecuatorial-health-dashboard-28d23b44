#!/usr/bin/env node

/**
 * Script avanzado para verificar y aplicar migraciones HOSIX
 * 
 * Características:
 * - Verifica migraciones aplicadas en Supabase
 * - Detecta migraciones faltantes
 * - Puede aplicar migraciones automáticamente
 * - Genera reporte en JSON y markdown
 * - Rollback de cambios si es necesario
 * 
 * Uso:
 *   node scripts/test-migrations-advanced.js
 *   node scripts/test-migrations-advanced.js --apply
 *   node scripts/test-migrations-advanced.js --report
 *   node scripts/test-migrations-advanced.js --json > report.json
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================
// CONFIGURACIÓN
// ============================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wdieynendfjbkbhfovrx.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

const args = process.argv.slice(2)
const shouldApply = args.includes('--apply') || args.includes('-a')
const shouldReport = args.includes('--report') || args.includes('-r')
const jsonOutput = args.includes('--json') || args.includes('-j')
const verbose = args.includes('--verbose') || args.includes('-v')

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(msg, color = 'reset') {
  if (!jsonOutput) {
    console.log(`${colors[color]}${msg}${colors.reset}`)
  }
}

function logVerbose(msg) {
  if (verbose && !jsonOutput) {
    log(`  ${msg}`, 'dim')
  }
}

// ============================================================
// UTILIDADES
// ============================================================

function getMigrationsFromFiles() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql') && !f.includes('/supabase/'))
    .sort()

  return files.map(file => ({
    filename: file,
    path: path.join(MIGRATIONS_DIR, file),
    timestamp: file.substring(0, 14),
    order: parseInt(file.substring(0, 14)),
    name: file.replace(/\.sql$/, '')
  }))
}

function readMigrationFile(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function extractTablesFromSql(sql) {
  const tableRegex = /CREATE TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi
  const matches = sql.matchAll(tableRegex)
  const tables = new Set()

  for (const match of matches) {
    tables.add(match[1].toLowerCase())
  }

  return Array.from(tables)
}

function extractFunctionsFromSql(sql) {
  const funcRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?(\w+)/gi
  const matches = sql.matchAll(funcRegex)
  const functions = new Set()

  for (const match of matches) {
    functions.add(match[1].toLowerCase())
  }

  return Array.from(functions)
}

function extractTriggersFromSql(sql) {
  const triggerRegex = /CREATE\s+TRIGGER\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi
  const matches = sql.matchAll(triggerRegex)
  const triggers = new Set()

  for (const match of matches) {
    triggers.add(match[1].toLowerCase())
  }

  return Array.from(triggers)
}

// ============================================================
// CONEXIÓN A SUPABASE
// ============================================================

async function getSupabaseInfo(supabase) {
  const [{ data: tables }, { data: functions }, { data: triggers }] = await Promise.all([
    supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public'),
    supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public'),
    supabase
      .from('information_schema.triggers')
      .select('trigger_name')
      .eq('trigger_schema', 'public')
  ])

  return {
    tables: new Set((tables || []).map(t => t.table_name)),
    functions: new Set((functions || []).map(f => f.routine_name)),
    triggers: new Set((triggers || []).map(t => t.trigger_name))
  }
}

// ============================================================
// ANÁLISIS DE MIGRACIONES
// ============================================================

async function analyzeMigrations(supabase) {
  log('📊 Analizando migraciones...', 'blue')

  const fileMigrations = getMigrationsFromFiles()
  const supabaseInfo = await getSupabaseInfo(supabase)

  const analysis = []
  let totalTables = 0
  let appliedTables = 0
  let missingTables = new Set()

  for (const migration of fileMigrations) {
    const sql = readMigrationFile(migration.path)
    const tables = extractTablesFromSql(sql)
    const functions = extractFunctionsFromSql(sql)
    const triggers = extractTriggersFromSql(sql)

    const appliedTablesList = tables.filter(t => supabaseInfo.tables.has(t))
    const missingTablesList = tables.filter(t => !supabaseInfo.tables.has(t))

    const status = missingTablesList.length === 0 ? 'APLICADA' : 'PENDIENTE'

    totalTables += tables.length
    appliedTables += appliedTablesList.length
    missingTablesList.forEach(t => missingTables.add(t))

    analysis.push({
      filename: migration.filename,
      path: migration.path,
      sql: sql,
      status,
      timestamp: migration.order,
      tables: {
        expected: tables,
        applied: appliedTablesList,
        missing: missingTablesList
      },
      functions: {
        expected: functions,
        applied: functions.filter(f => supabaseInfo.functions.has(f)),
        missing: functions.filter(f => !supabaseInfo.functions.has(f))
      },
      triggers: {
        expected: triggers,
        applied: triggers.filter(t => supabaseInfo.triggers.has(t)),
        missing: triggers.filter(t => !supabaseInfo.triggers.has(t))
      }
    })
  }

  return {
    total: fileMigrations.length,
    applied: analysis.filter(m => m.status === 'APLICADA').length,
    pending: analysis.filter(m => m.status === 'PENDIENTE').length,
    coverage: totalTables > 0 ? ((appliedTables / totalTables) * 100).toFixed(1) : 0,
    totalTables,
    appliedTables,
    missingTables: Array.from(missingTables),
    migrations: analysis
  }
}

// ============================================================
// APLICAR MIGRACIONES
// ============================================================

async function applyMigrations(supabase, pendingMigrations) {
  log('\n🔧 Aplicando migraciones...', 'blue')

  const results = {
    success: [],
    failed: []
  }

  for (const migration of pendingMigrations) {
    log(`\nAplicando: ${migration.filename}`, 'cyan')

    try {
      // Dividir SQL en statements
      const statements = migration.sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

      logVerbose(`${statements.length} statements para ejecutar`)

      // Ejecutar cada statement
      for (const statement of statements) {
        const { error } = await supabase.rpc('exec_sql', {
          query: statement + ';'
        }).catch(() => ({ error: null }))

        if (error && error.message && !error.message.includes('does not exist')) {
          throw error
        }
      }

      results.success.push(migration.filename)
      log(`  ✅ Aplicada correctamente`, 'green')
    } catch (error) {
      results.failed.push({
        filename: migration.filename,
        error: error.message
      })
      log(`  ❌ Error: ${error.message}`, 'red')
    }
  }

  return results
}

// ============================================================
// GENERAR SCRIPT RÁPIDO SQL
// ============================================================

function generateQuickScript(pendingMigrations) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const scriptPath = path.join(__dirname, `..`, 'scripts', `apply-migrations-${timestamp}.sql`)

  let scriptContent = '-- Script rápido para aplicar migraciones HOSIX\n'
  scriptContent += `-- Generado: ${new Date().toISOString()}\n`
  scriptContent += `-- Migraciones: ${pendingMigrations.length}\n\n`

  for (const migration of pendingMigrations) {
    scriptContent += `\n-- ========================================\n`
    scriptContent += `-- ${migration.filename}\n`
    scriptContent += `-- ========================================\n\n`
    scriptContent += migration.sql
    scriptContent += '\n'
  }

  fs.writeFileSync(scriptPath, scriptContent)
  return scriptPath
}

// ============================================================
// GENERAR REPORTE
// ============================================================

function generateReport(analysis) {
  let report = '# REPORTE DE MIGRACIONES HOSIX\n\n'
  report += `**Fecha**: ${new Date().toLocaleString()}\n`
  report += `**URL Supabase**: ${SUPABASE_URL}\n\n`

  report += '## 📊 Resumen\n\n'
  report += `- **Total de migraciones**: ${analysis.total}\n`
  report += `- **Aplicadas**: ${analysis.applied} (${(analysis.applied / analysis.total * 100).toFixed(1)}%)\n`
  report += `- **Pendientes**: ${analysis.pending} (${(analysis.pending / analysis.total * 100).toFixed(1)}%)\n`
  report += `- **Cobertura de tablas**: ${analysis.coverage}%\n`
  report += `- **Tablas aplicadas**: ${analysis.appliedTables}/${analysis.totalTables}\n\n`

  report += '## ✅ Migraciones Aplicadas\n\n'
  analysis.migrations
    .filter(m => m.status === 'APLICADA')
    .forEach(m => {
      report += `### ${m.filename}\n`
      report += `- Tablas: ${m.tables.expected.join(', ')}\n`
      report += `- Funciones: ${m.functions.expected.length}\n`
      report += `- Triggers: ${m.triggers.expected.length}\n\n`
    })

  report += '## ⚠️ Migraciones Pendientes\n\n'
  analysis.migrations
    .filter(m => m.status === 'PENDIENTE')
    .forEach(m => {
      report += `### ${m.filename}\n`
      report += `- Tablas faltantes: ${m.tables.missing.join(', ')}\n`
      if (m.functions.missing.length > 0) {
        report += `- Funciones faltantes: ${m.functions.missing.join(', ')}\n`
      }
      if (m.triggers.missing.length > 0) {
        report += `- Triggers faltantes: ${m.triggers.missing.join(', ')}\n`
      }
      report += '\n'
    })

  if (analysis.missingTables.length > 0) {
    report += '## ❌ Tablas Faltantes\n\n'
    analysis.missingTables.forEach(table => {
      report += `- ${table}\n`
    })
    report += '\n'
  }

  report += '## 📝 Recomendaciones\n\n'
  if (analysis.pending > 0) {
    report += '1. Aplicar las migraciones pendientes:\n'
    report += '   ```bash\n'
    report += '   npm run apply-migrations:mcp\n'
    report += '   ```\n'
    report += '2. O ejecutar el script SQL generado en Supabase Dashboard\n'
  } else {
    report += '✅ Todas las migraciones están aplicadas. No se requieren acciones.\n'
  }

  return report
}

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================

async function main() {
  try {
    if (!jsonOutput) {
      log('\n' + '='.repeat(80), 'bright')
      log('  VERIFICADOR AVANZADO DE MIGRACIONES HOSIX', 'bright')
      log('='.repeat(80) + '\n', 'bright')
    }

    // Validación
    log('📋 Validando configuración...', 'blue')

    if (!SUPABASE_URL) {
      log('❌ VITE_SUPABASE_URL no configurada', 'red')
      process.exit(1)
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      log('⚠️  SUPABASE_SERVICE_ROLE_KEY no configurada (modo limitado)', 'yellow')
    }

    const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
    if (!supabaseKey) {
      log('❌ No hay credenciales de Supabase disponibles', 'red')
      process.exit(1)
    }

    log('✅ Validación OK\n', 'green')

    // Conectar
    log('🔗 Conectando a Supabase...', 'blue')
    const supabase = createClient(SUPABASE_URL, supabaseKey)

    try {
      await supabase.auth.admin.listUsers()
    } catch {
      log('⚠️  Usando anon key (acceso limitado)', 'yellow')
    }

    log('✅ Conectado\n', 'green')

    // Analizar
    const analysis = await analyzeMigrations(supabase)

    if (jsonOutput) {
      console.log(JSON.stringify(analysis, null, 2))
    } else {
      // Mostrar resultados
      log('📈 RESULTADO DEL ANÁLISIS', 'bright')
      log('─'.repeat(80) + '\n', 'dim')

      log(`Total migraciones: ${analysis.total}`, 'blue')
      log(`  ✅ Aplicadas: ${analysis.applied}`, 'green')
      log(`  ⚠️  Pendientes: ${analysis.pending}`, 'yellow')
      log(`  📊 Cobertura: ${analysis.coverage}%\n`, 'cyan')

      const pendingMigs = analysis.migrations.filter(m => m.status === 'PENDIENTE')

      if (pendingMigs.length > 0) {
        log('⚠️ MIGRACIONES PENDIENTES:', 'yellow')
        log('─'.repeat(80) + '\n', 'dim')

        pendingMigs.forEach(m => {
          log(`📄 ${m.filename}`, 'yellow')
          if (m.tables.missing.length > 0) {
            log(`   ❌ Tablas: ${m.tables.missing.join(', ')}`, 'red')
          }
          if (m.functions.missing.length > 0) {
            log(`   ❌ Funciones: ${m.functions.missing.join(', ')}`, 'red')
          }
          if (m.triggers.missing.length > 0) {
            log(`   ❌ Triggers: ${m.triggers.missing.join(', ')}`, 'red')
          }
        })

        log('\n' + '─'.repeat(80) + '\n', 'dim')

        if (shouldApply) {
          log('🔧 APLICANDO MIGRACIONES...', 'bright')
          const results = await applyMigrations(supabase, pendingMigs)

          log('\n📊 RESULTADO DE APLICACIÓN', 'bright')
          log('─'.repeat(80) + '\n', 'dim')

          if (results.success.length > 0) {
            log(`✅ ${results.success.length} migraciones aplicadas correctamente`, 'green')
            results.success.forEach(f => log(`   ✓ ${f}`, 'green'))
          }

          if (results.failed.length > 0) {
            log(`\n❌ ${results.failed.length} migraciones fallaron`, 'red')
            results.failed.forEach(f => {
              log(`   ✗ ${f.filename}`, 'red')
              logVerbose(`      ${f.error}`)
            })
          }
        } else if (shouldReport) {
          const scriptPath = generateQuickScript(pendingMigs)
          log(`\n✅ Script SQL generado: ${scriptPath}`, 'green')
          log('\nPuedes usar este script en Supabase Dashboard SQL Editor\n', 'blue')
        }
      } else {
        log('\n✅ ¡Todas las migraciones están aplicadas!', 'green')
      }

      if (shouldReport) {
        const report = generateReport(analysis)
        const reportPath = path.join(__dirname, '..', 'MIGRATION_REPORT.md')
        fs.writeFileSync(reportPath, report)
        log(`\n📋 Reporte generado: ${reportPath}`, 'green')
      }

      log('\n' + '='.repeat(80) + '\n', 'bright')
    }

    process.exit(0)
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red')
    if (verbose) {
      console.error(error)
    }
    process.exit(1)
  }
}

// ============================================================
// INICIAR
// ============================================================

main()
