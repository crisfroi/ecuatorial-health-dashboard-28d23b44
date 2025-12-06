#!/bin/bash

# Instalación de MCP migrations como npm global

echo "📦 Instalando @hosix/mcp-migrations..."

# Instalar como global
npm install -g "./.mcp"

echo "✅ Instalado correctamente"
echo ""
echo "Uso:"
echo "  mcp exec migrations list_migrations"
echo "  mcp exec migrations list_tables"
echo "  mcp exec migrations apply_migration --file 20250116_001.sql"
echo "  mcp exec migrations view_table --table hosix_usuarios"
echo "  mcp exec migrations view_policies --table hosix_usuarios"
