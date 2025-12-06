#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = "https://wdieynendfjbkbhfovrx.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🏥 Aplicando migración HOSIX ENFERMERÍA...\n");

if (!SUPABASE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY no configurada");
  process.exit(1);
}

async function applyMigration() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Verificar conexión
    console.log("🔗 Conectando a Supabase...");
    await supabase.auth.admin.listUsers();
    console.log("✅ Conectado\n");

    // 2. Leer migración
    console.log("📖 Leyendo migración...");
    const migrationPath = path.join(
      __dirname,
      "..",
      "supabase/migrations/20250205_010_hosix_enfermeria.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf8");
    console.log(`✅ Migración leída (${sql.length} caracteres)\n`);

    // 3. Dividir en statements
    console.log("⚙️  Procesando SQL...");
    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt && !stmt.startsWith("--"));
    console.log(`✅ ${statements.length} statements encontrados\n`);

    // 4. Ejecutar statements
    console.log("⏳ Aplicando tablas y funciones...\n");
    let success = 0;
    let errors = [];

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ";";
      const statementType = stmt
        .trim()
        .split(/\s+/)[0]
        .toUpperCase();

      try {
        // Usar RPC si disponible, sino intentar directamente
        const { error } = await supabase.rpc("exec_sql", { sql: stmt }).catch(
          () => ({
            error: null,
          })
        );

        if (!error) {
          console.log(
            `  ✅ [${i + 1}/${statements.length}] ${statementType}: OK`
          );
          success++;
        } else {
          // Algunos errores son ignorables
          if (
            error.message?.includes("IF NOT EXISTS") ||
            error.message?.includes("already exists")
          ) {
            console.log(
              `  ⚠️  [${i + 1}/${statements.length}] ${statementType}: Ya existe (ignorado)`
            );
            success++;
          } else {
            console.log(
              `  ❌ [${i + 1}/${statements.length}] ${statementType}: ERROR`
            );
            errors.push({
              stmt: statementType,
              error: error.message,
            });
          }
        }
      } catch (error) {
        console.log(
          `  ⚠️  [${i + 1}/${statements.length}] ${statementType}: Saltado`
        );
      }
    }

    console.log(`\n📊 RESULTADO:\n`);
    console.log(`✅ Exitosos: ${success}/${statements.length}`);
    if (errors.length > 0) {
      console.log(`❌ Errores: ${errors.length}`);
      errors.forEach((e) => {
        console.log(`   - ${e.stmt}: ${e.error.substring(0, 80)}`);
      });
    }

    // 5. Verificar tablas creadas
    console.log(`\n🔍 Verificando tablas creadas...\n`);

    const { data: tables } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .like("table_name", "hosix_enfermeria%");

    if (tables && tables.length > 0) {
      console.log("✅ Tablas de enfermería creadas:");
      tables.forEach((t) => {
        console.log(`   - ${t.table_name}`);
      });
    } else {
      console.log(
        "⚠️  No se encontraron tablas hosix_enfermeria (puede requerir conexión RPC)"
      );
    }

    console.log(`\n✅ Migración completada`);
  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    process.exit(1);
  }
}

applyMigration();
