#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wdieynendfjbkbhfovrx.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🔍 Verificando estado de HOSIX Enfermería en Supabase\n");

if (!SUPABASE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY no configurada");
  process.exit(1);
}

async function verify() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log("🔗 Conectando a Supabase...");
    await supabase.auth.admin.listUsers();
    console.log("✅ Conectado\n");

    // Verificar tablas de enfermería
    const expectedTables = [
      "hosix_enfermeria_worklist",
      "hosix_enfermeria_constantes",
      "hosix_enfermeria_evaluaciones",
      "hosix_enfermeria_planes",
      "hosix_enfermeria_kardex",
      "hosix_enfermeria_balance_hidrico",
      "hosix_enfermeria_diario",
    ];

    console.log("📋 Tablas esperadas de enfermería:");
    console.log("─".repeat(60));

    const { data: tables } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");

    const tableNames = new Set((tables || []).map((t) => t.table_name));

    expectedTables.forEach((table) => {
      const exists = tableNames.has(table);
      const status = exists ? "✅" : "❌";
      console.log(`${status} ${table}`);
    });

    console.log("\n" + "─".repeat(60));

    const appliedCount = expectedTables.filter((t) => tableNames.has(t)).length;
    const percentage = ((appliedCount / expectedTables.length) * 100).toFixed(
      1
    );

    console.log(
      `\n📊 Estado: ${appliedCount}/${expectedTables.length} tablas (${percentage}%)`
    );

    if (appliedCount === 0) {
      console.log("\n⚠️  Tablas de enfermería NO aplicadas");
      console.log("\n📌 Para aplicar, usa:");
      console.log("   npm run compile-migrations -- --filter enfermeria");
      console.log("   # Luego copia el SQL a Supabase Dashboard");
    } else if (appliedCount === expectedTables.length) {
      console.log("\n✅ TODAS las tablas de enfermería están aplicadas");
    } else {
      console.log(`\n⚠️  Solo ${appliedCount} de ${expectedTables.length} tablas`);
    }

    // Verificar dependencias base
    console.log("\n\n📦 Verificando dependencias base:");
    console.log("─".repeat(60));

    const baseTables = [
      "hosix_pacientes",
      "hosix_usuarios",
      "hosix_servicios",
      "hosix_urgencias_episodios",
      "hosix_hospitalizacion_episodios",
    ];

    baseTables.forEach((table) => {
      const exists = tableNames.has(table);
      const status = exists ? "✅" : "❌";
      console.log(`${status} ${table}`);
    });

    const baseDepsCount = baseTables.filter((t) => tableNames.has(t)).length;
    console.log(
      `\n📊 Dependencias: ${baseDepsCount}/${baseTables.length} presentes`
    );

    if (baseDepsCount < baseTables.length) {
      console.log("\n⚠️  Faltan tablas base. Aplicar primero:");
      console.log("   - 20250116_001_hosix_base_schema.sql");
      console.log("   - 20250116_002_hosix_pacientes_historia_clinica.sql");
      console.log("   - 20250116_003_hosix_urgencias_citas_agendas.sql");
      console.log("   - 20250116_004_hosix_hospitalizacion_quirofanos_farmacia.sql");
    }

    console.log("\n");
  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    process.exit(1);
  }
}

verify();
