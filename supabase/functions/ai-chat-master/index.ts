// supabase/functions/ai-chat-master/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://deno.land/x/openai@v4.24.1/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

serve(async (req) => {
  try {
    const { question } = await req.json();

    if (!question) {
      return new Response(JSON.stringify({ error: "Missing field: question" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: catalog, error } = await supabase
      .from("schema_catalog")
      .select("*");

    if (error) throw error;

    const schemaDescription = catalog
      .map((c: any) =>
        `Table ${c.table_name}, column ${c.column_name} (${c.data_type})`
      )
      .join("\n");

    const systemPrompt = `
Eres un asistente SQL. Devuelves únicamente sentencias SQL válidas de PostgreSQL, sin explicaciones.
Usa exclusivamente las siguientes tablas y columnas disponibles en Supabase:

${schemaDescription}

Responde siempre con un bloque SQL que pueda ejecutarse directamente.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0,
    });

    const sql = completion.choices[0].message?.content ?? "";

    const { data: result, error: queryError } = await supabase.rpc("exec_sql", {
      query: sql,
    });

    if (queryError) {
      return new Response(JSON.stringify({ error: queryError.message, sql }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ sql, result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
