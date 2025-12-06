#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mcpDir = path.join(__dirname, "..", ".mcp");

console.log("📦 Instalando MCP Migrations...\n");

try {
  // 1. Verificar que existe package.json en .mcp
  const packagePath = path.join(mcpDir, "package.json");
  if (!fs.existsSync(packagePath)) {
    console.error("❌ No se encuentra .mcp/package.json");
    process.exit(1);
  }

  // 2. Instalar dependencias
  console.log("📥 Instalando dependencias...");
  execSync("npm install", { cwd: mcpDir, stdio: "inherit" });

  // 3. Crear enlace global
  console.log("\n🔗 Creando enlace global...");
  execSync("npm link", { cwd: mcpDir, stdio: "inherit" });

  console.log("\n✅ ¡Instalación completada!");
  console.log("\n📖 Uso:");
  console.log("  mcp exec migrations list_migrations");
  console.log("  mcp exec migrations list_tables");
  console.log("  mcp exec migrations apply_migration --file <file.sql>");
  console.log("\n📚 Ver: .mcp/README-MIGRATIONS.md\n");
} catch (error) {
  console.error("❌ Error durante la instalación:", error.message);
  process.exit(1);
}
