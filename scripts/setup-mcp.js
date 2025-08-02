#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Configurando MCP para Supabase...\n');

// Verificar si existe el archivo de configuración
const configPath = path.join(__dirname, '..', '.mcp', 'config.json');
const examplePath = path.join(__dirname, '..', '.mcp', 'config.example.json');

if (!fs.existsSync(configPath)) {
  console.log('❌ No se encontró el archivo de configuración MCP.');
  console.log('📝 Copiando archivo de ejemplo...');
  
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, configPath);
    console.log('✅ Archivo de ejemplo copiado.');
    console.log('\n📋 Pasos para completar la configuración:');
    console.log('1. Ve a https://supabase.com/dashboard');
    console.log('2. Selecciona tu proyecto: wdieynendfjbkbhfovrx');
    console.log('3. Ve a Settings > API');
    console.log('4. Copia la "service_role" key');
    console.log('5. Edita el archivo .mcp/config.json');
    console.log('6. Reemplaza "your-service-role-key-here" con tu clave real');
  } else {
    console.log('❌ No se encontró el archivo de ejemplo.');
  }
} else {
  console.log('✅ El archivo de configuración MCP ya existe.');
  
  // Verificar si tiene la service role key configurada
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const serviceRoleKey = config.mcpServers && config.mcpServers.supabase && config.mcpServers.supabase.env && config.mcpServers.supabase.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key-here') {
    console.log('⚠️  La Service Role Key no está configurada.');
    console.log('📋 Para completar la configuración:');
    console.log('1. Ve a https://supabase.com/dashboard');
    console.log('2. Selecciona tu proyecto: wdieynendfjbkbhfovrx');
    console.log('3. Ve a Settings > API');
    console.log('4. Copia la "service_role" key');
    console.log('5. Edita el archivo .mcp/config.json');
    console.log('6. Reemplaza "your-service-role-key-here" con tu clave real');
  } else {
    console.log('✅ La Service Role Key está configurada.');
    console.log('🎉 El MCP está listo para usar.');
  }
}

console.log('\n📚 Para más información, consulta .mcp/README.md'); 