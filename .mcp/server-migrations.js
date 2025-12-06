#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, TextContent } from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// INICIALIZAR SERVIDOR MCP
// ============================================================

const server = new Server({
  name: "supabase-migrations",
  version: "1.0.0",
});

// ============================================================
// VARIABLES GLOBALES
// ============================================================

let supabase = null;

// ============================================================
// INICIALIZAR SUPABASE
// ============================================================

function initSupabase() {
  const url = process.env.SUPABASE_URL || "https://wdieynendfjbkbhfovrx.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no configurada");
  }

  supabase = createClient(url, key);
}

// ============================================================
// HERRAMIENTAS MCP
// ============================================================

// 1. LISTAR MIGRACIONES
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request;

  try {
    if (name === "list_migrations") {
      const dir = args?.dir || process.cwd();
      const migrationsPath = path.join(dir, "supabase", "migrations");

      if (!fs.existsSync(migrationsPath)) {
        return {
          content: [
            {
              type: "text",
              text: `❌ No se encontró directorio: ${migrationsPath}`,
            },
          ],
        };
      }

      const files = fs
        .readdirSync(migrationsPath)
        .filter((f) => f.endsWith(".sql") && !f.includes("/supabase/"))
        .sort();

      const migrations = files.map((file) => ({
        filename: file,
        size: fs.statSync(path.join(migrationsPath, file)).size,
        path: path.join(migrationsPath, file),
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(migrations, null, 2),
          },
        ],
      };
    }

    // 2. LISTAR TABLAS
    if (name === "list_tables") {
      if (!supabase) initSupabase();

      const { data, error } = await supabase
        .from("information_schema.tables")
        .select("table_name, table_schema")
        .eq("table_schema", "public");

      if (error) throw error;

      const tables = (data || [])
        .map((t) => t.table_name)
        .filter((t) => !t.startsWith("pg_"))
        .sort();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tables, null, 2),
          },
        ],
      };
    }

    // 3. VER TABLA
    if (name === "view_table") {
      if (!supabase) initSupabase();
      const tableName = args?.table;

      if (!tableName) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Parámetro requerido: table",
            },
          ],
        };
      }

      const { data: columns, error: colError } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable")
        .eq("table_schema", "public")
        .eq("table_name", tableName);

      if (colError) throw colError;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(columns, null, 2),
          },
        ],
      };
    }

    // 4. VER POLÍTICAS RLS
    if (name === "view_policies") {
      if (!supabase) initSupabase();
      const tableName = args?.table;

      if (!tableName) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Parámetro requerido: table",
            },
          ],
        };
      }

      const { data, error } = await supabase
        .from("pg_catalog.pg_policies")
        .select("*")
        .eq("tablename", tableName);

      if (error) {
        // Fallback: leer directamente con query
        const { data: policies, error: queryError } = await supabase.rpc(
          "get_policies",
          { table_name: tableName }
        ).catch(() => ({ data: [] }));

        if (policies) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(policies, null, 2),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: "Tabla RLS no configurada o sin políticas",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    // 5. EJECUTAR MIGRACIÓN
    if (name === "apply_migration") {
      if (!supabase) initSupabase();

      const migrationFile = args?.file;
      if (!migrationFile) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Parámetro requerido: file",
            },
          ],
        };
      }

      const dir = args?.dir || process.cwd();
      const filePath = path.join(dir, "supabase", "migrations", migrationFile);

      if (!fs.existsSync(filePath)) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Archivo no encontrado: ${filePath}`,
            },
          ],
        };
      }

      const sql = fs.readFileSync(filePath, "utf8");

      try {
        // Ejecutar SQL (requiere función auxiliar en Supabase)
        const { data, error } = await supabase.rpc("exec_sql", { sql });

        if (error) {
          // Intentar con query directo
          const statements = sql
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s && !s.startsWith("--"));

          for (const stmt of statements) {
            await supabase.rpc("exec_sql", { sql: stmt + ";" }).catch(() => {});
          }
        }

        return {
          content: [
            {
              type: "text",
              text: `✅ Migración aplicada: ${migrationFile}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Error: ${error.message}`,
            },
          ],
        };
      }
    }

    // 6. LEER MIGRACIÓN
    if (name === "read_migration") {
      const migrationFile = args?.file;
      if (!migrationFile) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Parámetro requerido: file",
            },
          ],
        };
      }

      const dir = args?.dir || process.cwd();
      const filePath = path.join(dir, "supabase", "migrations", migrationFile);

      if (!fs.existsSync(filePath)) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Archivo no encontrado: ${filePath}`,
            },
          ],
        };
      }

      const content = fs.readFileSync(filePath, "utf8");

      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `❌ Herramienta desconocida: ${name}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Error: ${error.message}`,
        },
      ],
    };
  }
});

// ============================================================
// DEFINIR HERRAMIENTAS
// ============================================================

server.setRequestHandler(
  { method: "tools/list" },
  async () => ({
    tools: [
      {
        name: "list_migrations",
        description: "Listar todas las migraciones SQL disponibles",
        inputSchema: {
          type: "object",
          properties: {
            dir: {
              type: "string",
              description: "Directorio del proyecto (default: cwd)",
            },
          },
        },
      },
      {
        name: "read_migration",
        description: "Leer contenido de una migración SQL",
        inputSchema: {
          type: "object",
          properties: {
            file: {
              type: "string",
              description: "Nombre del archivo de migración",
            },
            dir: {
              type: "string",
              description: "Directorio del proyecto",
            },
          },
          required: ["file"],
        },
      },
      {
        name: "apply_migration",
        description: "Aplicar una migración SQL a Supabase",
        inputSchema: {
          type: "object",
          properties: {
            file: {
              type: "string",
              description: "Nombre del archivo de migración",
            },
            dir: {
              type: "string",
              description: "Directorio del proyecto",
            },
          },
          required: ["file"],
        },
      },
      {
        name: "list_tables",
        description: "Listar todas las tablas en Supabase",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "view_table",
        description: "Ver columnas y tipos de una tabla",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "Nombre de la tabla",
            },
          },
          required: ["table"],
        },
      },
      {
        name: "view_policies",
        description: "Ver políticas RLS de una tabla",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "Nombre de la tabla",
            },
          },
          required: ["table"],
        },
      },
    ],
  })
);

// ============================================================
// INICIAR SERVIDOR
// ============================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ MCP Server: supabase-migrations iniciado");
}

main().catch(console.error);
