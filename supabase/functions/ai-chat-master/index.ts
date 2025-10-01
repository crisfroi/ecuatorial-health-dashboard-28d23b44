// supabase/functions/ai-chat-master/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://deno.land/x/openai@v4.24.1/mod.ts";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // 1. MANEJAR PETICIÓN OPTIONS (PREFLIGHT)
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }
  let messages = [];
  let sql = "";
  let rawSql = "";
  // 2. MANEJO DE ERROR 400: PARSEAR JSON DE ENTRADA
  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.messages)) {
      throw new Error("Cuerpo de la petición JSON no válido o campo 'messages' ausente.");
    }
    messages = body.messages;
  } catch (e) {
    const errorMessage = e.message;
    return new Response(JSON.stringify({
      error: `Error 400: Fallo en el parsing de JSON. Causa: ${errorMessage}`
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
  try {
    if (messages.length === 0) {
      return new Response(JSON.stringify({
        error: "Error 400: El array 'messages' no debe estar vacío."
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    // 3. RECUPERAR ESQUEMA Y CONSTRUIR PROMPT PARA SQL
    // ... (Código para obtener schema y systemPrompt - SIN CAMBIOS) ...
    const { data: catalog, error } = await supabase.from("schema_catalog").select("*");
    if (error) throw error;
    const schemaDescription = catalog.map((c)=>`Table ${c.table_name}, column ${c.column_name} (${c.data_type})`).join("\n");
    const systemPrompt = `
Eres un asistente SQL de PostgreSQL altamente especializado con memoria conversacional. Tu única función es transformar el último mensaje de la conversación, **utilizando el contexto de los mensajes previos**, en una sentencia SQL VÁLIDA y ejecutable.

Reglas estrictas:
1. Devuelves ÚNICAMENTE la sentencia SQL en un bloque de código markdown (Ej: \`\`\`sql SELECT ... \`\`\`).
2. NUNCA incluyas explicaciones, texto adicional o bloques de código que no sean SQL.
3. Usa exclusivamente las siguientes tablas y columnas disponibles en la base de datos:

${schemaDescription}

Asegúrate de que la sentencia SQL sea autocontenida y resuelva la pregunta del usuario utilizando la información contextual de la conversación.
`;
    const conversationHistory = [
      {
        role: "system",
        content: systemPrompt
      },
      ...messages
    ];
    // 4. LLAMAR A OPENAI para generar SQL
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversationHistory,
      temperature: 0
    });
    rawSql = completion.choices[0].message?.content ?? "";
    const sqlMatch = rawSql.match(/```(?:sql|SQL)?\s*([\s\S]*?)\s*```/);
    sql = sqlMatch ? sqlMatch[1].trim() : rawSql.trim();
    // 5. VALIDACIÓN POST-IA Y CORRECCIÓN CRÍTICA
    if (!sql || !sql.toUpperCase().trim().startsWith("SELECT")) {
      return new Response(JSON.stringify({
        error: "La IA no generó una sentencia SQL SELECT válida.",
        debug_sql_extracted: sql,
        debug_ai_raw_response: rawSql,
        message: "Revisa la respuesta cruda de la IA para ver si incluyó explicaciones o no generó un bloque SQL."
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    // CORRECCIÓN: Eliminar el punto y coma final
    const cleanSql = sql.trim().endsWith(';') ? sql.trim().slice(0, -1) : sql;
    // 6. EJECUTAR EL SQL
    const { data: result, error: queryError } = await supabase.rpc("exec_sql", {
      query: cleanSql
    });
    // 7. MANEJO DE ERROR DE EJECUCIÓN
    if (queryError) {
      return new Response(JSON.stringify({
        error: `Error de ejecución SQL: ${queryError.message}`,
        debug_sql_executed: cleanSql,
        message: "La sentencia SQL fue válida pero falló al ejecutarse contra la BD."
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    // ************************************************
    // * 8. POST-PROCESAMIENTO: GENERAR RESPUESTA EN LENGUAJE NATURAL *
    // ************************************************
    const userQuestion = messages[messages.length - 1].content;
    const naturalLanguagePrompt = `
        La consulta del usuario fue: "${userQuestion}"
        El resultado de la base de datos para esta consulta es el siguiente objeto JSON:
        ${JSON.stringify(result, null, 2)}
        
        Tu tarea es resumir este resultado de la base de datos en una respuesta fluida, concisa y profesional en ESPAÑOL. NO incluyas el código SQL ni el JSON de la base de datos en tu respuesta. Si el resultado está vacío, indica que no se encontraron datos.
        `;
    const finalCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: naturalLanguagePrompt
        }
      ],
      temperature: 0.2
    });
    const naturalLanguageResponse = finalCompletion.choices[0].message?.content ?? "No se pudo generar una respuesta en lenguaje natural.";
    // 9. RESPUESTA EXITOSA
    return new Response(JSON.stringify({
      sql: cleanSql,
      result,
      natural_language_response: naturalLanguageResponse
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (err) {
    console.error("❌ Error:", err);
    return new Response(JSON.stringify({
      error: `Error de servidor no controlado: ${err.message}`,
      debug_ai_raw_response: rawSql
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});

