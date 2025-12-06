#!/usr/bin/env node

/**
 * Script interactivo para aplicar migraciones HOSIX
 * 
 * Permite elegir entre diferentes métodos de aplicación
 * y guía al usuario paso a paso
 * 
 * Uso:
 *   npm run apply-migrations
 *   node scripts/apply-migrations.js
 */

import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================
// COLORES Y ESTILOS
// ============================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
}

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`)
}

function logHeader(msg) {
  console.log('\n' + '='.repeat(60))
  log(`  ${msg}`, 'bright')
  console.log('='.repeat(60) + '\n')
}

function logStep(step, title) {
  log(`\n[${step}] ${title}`, 'bright')
  log('─'.repeat(40), 'dim')
}

// ============================================================
// READLINE PARA INPUT
// ============================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise(resolve => {
    rl.question(`${colors.blue}${prompt}${colors.reset}`, answer => {
      resolve(answer)
    })
  })
}

// ============================================================
// VALIDACIONES
// ============================================================

async function checkPrerequisites() {
  logStep('1', 'Verificando Prerequisitos')

  const checks = {
    '.env': () => fs.existsSync('.env') || fs.existsSync('.env.local'),
    'supabase/migrations': () => fs.existsSync('supabase/migrations'),
    'package.json': () => fs.existsSync('package.json')
  }

  let allGood = true

  for (const [name, check] of Object.entries(checks)) {
    if (check()) {
      log(`  ✅ ${name}`, 'green')
    } else {
      log(`  ❌ ${name}`, 'red')
      allGood = false
    }
  }

  if (!allGood) {
    log('\n⚠️  Algunos requisitos no están configurados', 'yellow')
    return false
  }

  log('  ✅ Todos los requisitos están completos', 'green')
  return true
}

// ============================================================
// MOSTRAR OPCIONES
// ============================================================

function showOptions() {
  logStep('2', 'Selecciona método de aplicación')

  const options = [
    {
      id: '1',
      name: 'Supabase CLI (Recomendado)',
      description: 'Más simple y confiable',
      command: 'supabase db push'
    },
    {
      id: '2',
      name: 'Supabase Dashboard',
      description: 'Manual - Copiar/pegar SQL en editor web'
    },
    {
      id: '3',
      name: 'psql (PostgreSQL CLI)',
      description: 'Conexión directa a base de datos',
      script: 'bash scripts/apply-migrations-psql.sh'
    },
    {
      id: '4',
      name: 'MCP (Node.js)',
      description: 'Via Model Context Protocol',
      script: 'node scripts/apply-migrations-mcp.js'
    }
  ]

  options.forEach(opt => {
    log(`\n  ${colors.magenta}[${opt.id}]${colors.reset} ${opt.name}`, 'bright')
    log(`      ${opt.description}`, 'dim')
  })

  return options
}

// ============================================================
// LÓGICA DE OPCIONES
// ============================================================

async function handleOptionCLI() {
  logStep('3', 'Configuración Supabase CLI')

  log('\n1️⃣  Instala Supabase CLI:', 'yellow')
  log('   npm install -g supabase', 'blue')

  log('\n2️⃣  Autentica:', 'yellow')
  log('   supabase login', 'blue')

  log('\n3️⃣  Enlaza tu proyecto:', 'yellow')
  log('   supabase link --project-ref wdieynendfjbkbhfovrx', 'blue')

  log('\n4️⃣  Aplica migraciones:', 'yellow')
  log('   supabase db push', 'blue')

  const proceed = await question('\n¿Deseas ejecutar ahora? (s/n): ')

  if (proceed.toLowerCase() === 's') {
    await executeCommand('supabase', ['db', 'push'])
  }
}

async function handleOptionDashboard() {
  logStep('3', 'Aplicar manualmente en Supabase Dashboard')

  log('\n1️⃣  Ir a: https://app.supabase.com', 'yellow')
  log('   → Selecciona proyecto: wdieynendfjbkbhfovrx', 'blue')
  log('   → SQL Editor → New Query', 'blue')

  log('\n2️⃣  Copiar SQL de migración más reciente:', 'yellow')
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250206_014_hosix_interconsultas_asis_11.sql')
  
  if (fs.existsSync(migrationPath)) {
    log(`   Archivo: 20250206_014_hosix_interconsultas_asis_11.sql`, 'blue')
    log('\n3️⃣  Pegar en SQL Editor y hacer clic en "Run"', 'yellow')
  }

  log('\n📌 Las otras migraciones ya están aplicadas', 'green')
}

async function handleOptionPSQL() {
  logStep('3', 'Aplicar via psql')

  log('\n1️⃣  Verifica que psql esté instalado:', 'yellow')
  log('   which psql', 'blue')

  log('\n2️⃣  Configura variables de entorno en .env:', 'yellow')
  log('   SUPABASE_CONNECTION_STRING=postgresql://...', 'blue')

  log('\n3️⃣  Ejecuta el script:', 'yellow')
  log('   bash scripts/apply-migrations-psql.sh', 'blue')

  const proceed = await question('\n¿Deseas ejecutar ahora? (s/n): ')

  if (proceed.toLowerCase() === 's') {
    await executeCommand('bash', ['scripts/apply-migrations-psql.sh'])
  }
}

async function handleOptionMCP() {
  logStep('3', 'Aplicar via MCP (Node.js)')

  log('\n1️⃣  Verifica que tienes Node.js:', 'yellow')
  log('   node --version', 'blue')

  log('\n2️⃣  Configura en .env:', 'yellow')
  log('   SUPABASE_SERVICE_ROLE_KEY=...', 'blue')

  log('\n3️⃣  Ejecuta el script:', 'yellow')
  log('   node scripts/apply-migrations-mcp.js', 'blue')

  const proceed = await question('\n¿Deseas ejecutar ahora? (s/n): ')

  if (proceed.toLowerCase() === 's') {
    await executeCommand('node', ['scripts/apply-migrations-mcp.js'])
  }
}

// ============================================================
// EJECUTAR COMANDO
// ============================================================

function executeCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    log(`\n▶️  Ejecutando: ${cmd} ${args.join(' ')}`, 'blue')
    log('─'.repeat(40), 'dim')

    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true
    })

    child.on('close', code => {
      log('─'.repeat(40), 'dim')
      if (code === 0) {
        log(`✅ Comando completado exitosamente`, 'green')
        resolve()
      } else {
        log(`❌ Comando falló con código ${code}`, 'red')
        reject(new Error(`Command failed: ${code}`))
      }
    })

    child.on('error', error => {
      log(`❌ Error: ${error.message}`, 'red')
      reject(error)
    })
  })
}

// ============================================================
// MOSTRAR RESUMEN
// ============================================================

function showSummary() {
  logStep('4', 'Próximos Pasos')

  log('✅ Las migraciones deben estar aplicadas', 'green')

  log('\n1️⃣  Verificar en Supabase Dashboard:', 'yellow')
  log('   SQL Editor → Buscar tabla "hosix_interconsultas"', 'blue')

  log('\n2️⃣  Inicia el servidor de desarrollo:', 'yellow')
  log('   npm run dev', 'blue')

  log('\n3️⃣  Verifica la conectividad en la app:', 'yellow')
  log('   Abre http://localhost:5173', 'blue')

  log('\n📚 Documentación:', 'yellow')
  log('   - MIGRACIONES_INTERCONSULTAS_APLICACION.md', 'blue')
  log('   - ESTADO_HOSIX_CONSOLIDADO_2025-02-06.md', 'blue')
}

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================

async function main() {
  try {
    logHeader('APLICADOR DE MIGRACIONES HOSIX')

    // 1. Verificar prerequisitos
    const prereqOk = await checkPrerequisites()
    if (!prereqOk) {
      log('\n⚠️  Por favor configura los requisitos primero', 'yellow')
      process.exit(1)
    }

    // 2. Mostrar opciones
    const options = showOptions()

    // 3. Obtener selección
    let choice = ''
    while (!['1', '2', '3', '4'].includes(choice)) {
      choice = await question('\nSelecciona una opción (1-4): ')
    }

    const selectedOption = options[parseInt(choice) - 1]

    log(`\n✅ Seleccionaste: ${selectedOption.name}`, 'green')

    // 4. Ejecutar según opción
    switch (choice) {
      case '1':
        await handleOptionCLI()
        break
      case '2':
        await handleOptionDashboard()
        break
      case '3':
        await handleOptionPSQL()
        break
      case '4':
        await handleOptionMCP()
        break
    }

    // 5. Mostrar resumen
    showSummary()

    logHeader('¡Listo!')
    log('Para más información: https://docs.supabase.com/', 'blue')

    rl.close()
    process.exit(0)
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red')
    rl.close()
    process.exit(1)
  }
}

// ============================================================
// INICIAR
// ============================================================

main()
