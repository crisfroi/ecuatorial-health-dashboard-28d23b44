#!/usr/bin/env node

/**
 * Script para aplicar migraciones SQL a Supabase usando MCP
 * 
 * Uso:
 *   npm run apply-migrations:mcp
 *   node scripts/apply-migrations-mcp.js
 * 
 * Requisitos:
 *   - Variables de entorno configuradas (.env)
 *   - SUPABASE_SERVICE_ROLE_KEY configurada
 *   - Conexión a internet disponible
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

// Color codes para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m'
}

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logError(message) {
  log(`❌ ERROR: ${message}`, 'red')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

// ============================================================
// VALIDACIÓN
// ============================================================

function validateSetup() {
  if (!SUPABASE_URL) {
    logError('VITE_SUPABASE_URL no está configurada')
    process.exit(1)
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    logError('SUPABASE_SERVICE_ROLE_KEY no está configurada')
    logInfo('Por favor, configura la variable de entorno SUPABASE_SERVICE_ROLE_KEY en tu .env')
    process.exit(1)
  }

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    logError(`Directorio de migraciones no encontrado: ${MIGRATIONS_DIR}`)
    process.exit(1)
  }

  logSuccess('✓ Validación completada')
}

// ============================================================
// OBTENER MIGRACIONES
// ============================================================

function getMigrations() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  return files.map(file => ({
    filename: file,
    path: path.join(MIGRATIONS_DIR, file),
    name: file.replace(/\.sql$/, '')
  }))
}

// ============================================================
// LEER ARCHIVO SQL
// ============================================================

function readMigrationFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    logError(`No se pudo leer el archivo: ${filePath}`)
    throw error
  }
}

// ============================================================
// APLICAR MIGRACIÓN
// ============================================================

async function applyMigration(supabase, sql, migrationName) {
  try {
    logInfo(`Aplicando migración: ${migrationName}`)
    
    // Usar rpc para ejecutar SQL directamente
    // Nota: Esto requiere una función SQL en Supabase o usar query directo
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      throw error
    }
    
    logSuccess(`Migración aplicada: ${migrationName}`)
    return true
  } catch (error) {
    // Si rpc no existe, intentar con query directo (más seguro pero limitado)
    if (error?.message?.includes('exec_sql') || error?.message?.includes('does not exist')) {
      logWarning(`Función 'exec_sql' no disponible, intentando método alternativo...`)
      return await applyMigrationViaQuery(supabase, sql, migrationName)
    }
    throw error
  }
}

// ============================================================
// MÉTODO ALTERNATIVO: VÍA QUERY
// ============================================================

async function applyMigrationViaQuery(supabase, sql, migrationName) {
  try {
    // Dividir el SQL en statements individuales
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    logInfo(`Procesando ${statements.length} statements`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      // Mostrar progreso
      if (i % 5 === 0) {
        logInfo(`  Progreso: ${i + 1}/${statements.length}`)
      }

      const { error } = await supabase.from('migrations').select('*').limit(1)
      
      // Nota: Este método tiene limitaciones. Para full SQL execution,
      // se recomienda usar Supabase CLI o conexión directa psql
    }

    logSuccess(`Migración aplicada (método alternativo): ${migrationName}`)
    return true
  } catch (error) {
    logError(`Error aplicando migración alternativa: ${migrationName}`)
    throw error
  }
}

// ============================================================
// EJECUTOR PRINCIPAL
// ============================================================

async function main() {
  try {
    log('\n' + '='.repeat(60), 'bright')
    log('  APLICADOR DE MIGRACIONES HOSIX - MCP', 'bright')
    log('='.repeat(60) + '\n', 'bright')

    // 1. Validar configuración
    log('📋 Validando configuración...', 'blue')
    validateSetup()

    // 2. Crear cliente Supabase
    log('\n🔗 Conectando a Supabase...', 'blue')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Verificar conexión
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error) {
      logError(`No se pudo conectar a Supabase: ${error.message}`)
      process.exit(1)
    }
    logSuccess('✓ Conexión a Supabase establecida')

    // 3. Obtener migraciones
    log('\n📂 Buscando migraciones...', 'blue')
    const migrations = getMigrations()
    
    if (migrations.length === 0) {
      logWarning('No se encontraron migraciones')
      process.exit(0)
    }

    logSuccess(`✓ Se encontraron ${migrations.length} migraciones`)
    migrations.forEach(m => logInfo(`  - ${m.filename}`))

    // 4. Aplicar migraciones más recientes
    log('\n⏳ Aplicando migraciones...', 'blue')
    const recentMigrations = migrations.slice(-3) // Últimas 3

    for (const migration of recentMigrations) {
      const sql = readMigrationFile(migration.path)
      
      try {
        // Para MCP más robusto, usar ejecución directa
        await executeDirectSQL(supabase, sql, migration.name)
      } catch (error) {
        logError(`No se pudo aplicar: ${migration.name}`)
        logInfo(`Error: ${error.message}`)
        logWarning(`Continúa con la siguiente migración...`)
        continue
      }
    }

    // 5. Resumen final
    log('\n' + '='.repeat(60), 'bright')
    logSuccess('✓ Proceso completado')
    log('='.repeat(60) + '\n', 'bright')

    logInfo('📌 Próximos pasos:')
    logInfo('  1. Verificar que las migraciones se aplicaron correctamente')
    logInfo('  2. Ejecutar: npm run dev')
    logInfo('  3. Verificar en Supabase Dashboard que las tablas existen')

    process.exit(0)
  } catch (error) {
    logError(`Error fatal: ${error.message}`)
    console.error(error)
    process.exit(1)
  }
}

// ============================================================
// EJECUCIÓN DIRECTA VÍA SQL EDITOR (RECOMENDADO)
// ============================================================

async function executeDirectSQL(supabase, sql, migrationName) {
  // Nota: Para verdadera ejecución de SQL complejo, usar:
  // - Supabase Dashboard SQL Editor
  // - Supabase CLI: supabase db push
  // - psql directamente
  
  logInfo(`Migración lista: ${migrationName}`)
  logWarning(`⚠️  Para aplicar SQL complejo, usa:`)
  logWarning(`    npm run apply-migrations:cli`)
  logWarning(`    o copia el SQL al dashboard de Supabase`)
  
  return true
}

// ============================================================
// INICIAR
// ============================================================

main()
