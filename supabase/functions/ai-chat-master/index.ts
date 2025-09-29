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

// Interfaz para los mensajes
interface ClientMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ----------------------------------------------------
// DEFINICIÓN DE CABECERAS CORS
// Solución al error 'Access-Control-Allow-Origin'
// * Nota: Puedes reemplazar '*' por tu dominio específico (ej: 'https://tu-app.vercel.app') para mayor seguridad.
// ----------------------------------------------------
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

    try {
        // Asumimos que el cuerpo de la petición es JSON
        const { messages } = await req.json() as { messages: ClientMessage[] };

        if (!messages || messages.length === 0) {
          return new Response(JSON.stringify({
            error: "Missing or invalid field: messages (expected array)"
          }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        // 2. RECUPERAR ESQUEMA DE LA BD
        const { data: catalog, error } = await supabase.from("schema_catalog").select("*");
        if (error) throw error;

        const schemaDescription = catalog.map((c) => 
            `Table ${c.table_name}, column ${c.column_name} (${c.data_type})`
        ).join("\n");
        
        // 3. CONSTRUIR PROMPT CON MEMORIA
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

        // 4. LLAMAR A OPENAI
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: conversationHistory as any, 
          temperature: 0
        });

        const rawSql = completion.choices[0].message?.content ?? "";
        
        // Extraer solo el código SQL del bloque markdown
        const sqlMatch = rawSql.match(/```(?:sql|SQL)?\s*([\s\S]*?)\s*```/);
        const sql = sqlMatch ? sqlMatch[1].trim() : rawSql.trim();

        if (!sql || !sql.toUpperCase().startsWith("SELECT")) {
             return new Response(JSON.stringify({
                 error: "La IA no pudo generar una sentencia SQL SELECT válida. La respuesta fue: " + rawSql.substring(0, 100),
                 sql: sql
             }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders }});
        }

        // 5. EJECUTAR EL SQL
        const { data: result, error: queryError } = await supabase.rpc("exec_sql", {
          query: sql
        });

        if (queryError) {
          return new Response(JSON.stringify({
            error: queryError.message,
            sql
          }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        // 6. RESPUESTA EXITOSA (con cabeceras CORS)
        return new Response(JSON.stringify({
          sql,
          result,
          // Nota: navigationSuggestions se añadiría aquí si el modelo estuviera configurado para generarlo
          // navigationSuggestions: [...] 
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    } catch (err) {
        console.error("❌ Error:", err);
        // 7. RESPUESTA DE ERROR (con cabeceras CORS)
        return new Response(JSON.stringify({
          error: (err as Error).message || "Unexpected error"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    }
});
