// supabase/functions/ai-chat-master/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://deno.land/x/openai@v4.24.1/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

interface ClientMessage {
  role: 'user' | 'assistant';
  content: string;
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    
    // 1. MANEJAR PETICIÓN OPTIONS (PREFLIGHT)
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                ...corsHeaders,
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
        });
    }

    let messages: ClientMessage[] = [];

    // 2. MANEJO DE ERROR 400: PARSEAR JSON DE ENTRADA
    try {
        const body = await req.json();
        // Lanza error si el cuerpo está vacío, no es JSON, o no tiene la clave 'messages'
        if (!body || !Array.isArray(body.messages)) {
            throw new Error("Cuerpo de la petición JSON no válido o campo 'messages' ausente.");
        }
        messages = body.messages;

    } catch (e) {
        const errorMessage = (e as Error).message;
        return new Response(JSON.stringify({
            error: `Error 400: Fallo en el parsing de JSON. Causa: ${errorMessage}`
        }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    }
    
    let sql = "";
    let rawSql = "";

    try {
        if (messages.length === 0) {
          return new Response(JSON.stringify({
            error: "Error 400: El array 'messages' no debe estar vacío."
          }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        // 3. RECUPERAR ESQUEMA DE LA BD
        const { data: catalog, error } = await supabase.from("schema_catalog").select("*");
        if (error) throw error;

        const schemaDescription = catalog.map((c) => 
            `Table ${c.table_name}, column ${c.column_name} (${c.data_type})`
        ).join("\n");
        
        // 4. CONSTRUIR PROMPT CON MEMORIA
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
            { role: "system", content: systemPrompt },
            ...messages
        ];

        // 5. LLAMAR A OPENAI
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: conversationHistory as any, 
          temperature: 0
        });

        rawSql = completion.choices[0].message?.content ?? "";
        
        // Extraer solo el código SQL del bloque markdown
        const sqlMatch = rawSql.match(/```(?:sql|SQL)?\s*([\s\S]*?)\s*```/);
        sql = sqlMatch ? sqlMatch[1].trim() : rawSql.trim();

        // 6. VALIDACIÓN POST-IA (PUNTO DE FALLO PROBABLE)
        // Se añade información de debugging a la respuesta 400
        if (!sql || !sql.toUpperCase().trim().startsWith("SELECT")) {
             return new Response(JSON.stringify({
                 error: "La IA no generó una sentencia SQL SELECT válida.",
                 debug_sql_extracted: sql,
                 debug_ai_raw_response: rawSql, // <-- CLAVE PARA DIAGNÓSTICO
                 message: "Revisa la respuesta cruda de la IA para ver si incluyó explicaciones o no generó un bloque SQL."
             }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders }});
        }

        // 7. EJECUTAR EL SQL
        const { data: result, error: queryError } = await supabase.rpc("exec_sql", {
          query: sql
        });

        // 8. ERROR DE EJECUCIÓN SQL (OTRO PUNTO DE FALLO PROBABLE)
        if (queryError) {
          return new Response(JSON.stringify({
            error: `Error de ejecución SQL: ${queryError.message}`,
            debug_sql_executed: sql,
            message: "La sentencia SQL fue válida pero falló al ejecutarse contra la BD."
          }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        // 9. RESPUESTA EXITOSA
        return new Response(JSON.stringify({
          sql,
          result,
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    } catch (err) {
        console.error("❌ Error:", err);
        // 10. ERROR INTERNO NO CONTROLADO (Debería ser un 500)
        return new Response(JSON.stringify({
          error: `Error de servidor no controlado: ${(err as Error).message}`,
          debug_ai_raw_response: rawSql,
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    }
});
