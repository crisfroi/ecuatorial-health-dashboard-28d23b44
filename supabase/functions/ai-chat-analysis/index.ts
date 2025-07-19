import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.1";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, analytics } = await req.json();
    const question = message;

    console.log("Received question:", question);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

    // Fetch current data from Supabase
    const { data: profesionales, error } = await supabase
      .from("profesionales_sanitarios")
      .select("*");

    if (error) {
      console.error("Error fetching data:", error);
      throw error;
    }

    console.log("Fetched professionals:", profesionales?.length || 0);

    // Calculate statistics
    const total = profesionales?.length || 0;
    const aprobados =
      profesionales?.filter((p) => p.estado_solicitud === "Aprobado").length ||
      0;
    const pendientes =
      profesionales?.filter((p) => p.estado_solicitud === "Pendiente").length ||
      0;
    const rechazados =
      profesionales?.filter((p) => p.estado_solicitud === "Rechazado").length ||
      0;

    // Group by areas
    const porArea =
      profesionales?.reduce(
        (acc, prof) => {
          const area = prof.area_profesional || "Sin especificar";
          acc[area] = (acc[area] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ) || {};

    // Group by provinces
    const porProvincia =
      profesionales?.reduce(
        (acc, prof) => {
          const provincia = prof.provincia || "Sin especificar";
          acc[provincia] = (acc[provincia] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ) || {};

    // Create context for AI
    const dataContext = `
    Datos actuales del sistema sanitario de Guinea Ecuatorial:
    - Total de profesionales registrados: ${total}
    - Profesionales aprobados: ${aprobados}
    - Solicitudes pendientes: ${pendientes}
    - Solicitudes rechazadas: ${rechazados}
    
    Distribución por área profesional:
    ${Object.entries(porArea)
      .map(([area, cantidad]) => `- ${area}: ${cantidad}`)
      .join("\n")}
    
    Distribución por provincia:
    ${Object.entries(porProvincia)
      .map(([provincia, cantidad]) => `- ${provincia}: ${cantidad}`)
      .join("\n")}
    `;

    const systemPrompt = `Eres un asistente especializado en análisis de datos del sistema sanitario de Guinea Ecuatorial. 
    Tienes acceso a datos actualizados del registro nacional de profesionales sanitarios (RENAPROSA).
    
    Tu función es analizar y responder preguntas sobre:
    - Estadísticas de profesionales sanitarios
    - Distribución geográfica de profesionales
    - Estados de solicitudes y procesos de acreditación
    - Tendencias y patrones en los datos
    - Recomendaciones basadas en los datos
    
    Siempre proporciona respuestas precisas basadas en los datos reales que tienes disponibles.
    Usa un tono profesional pero accesible, y estructura tus respuestas de manera clara.
    
    Datos disponibles:
    ${dataContext}`;

    console.log("Calling OpenAI API...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log("AI response generated successfully");

    return new Response(
      JSON.stringify({
        response: aiResponse,
        dataContext: {
          total,
          aprobados,
          pendientes,
          rechazados,
          porArea,
          porProvincia,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in ai-chat-analysis function:", error);
    return new Response(
      JSON.stringify({
        error: "Error processing request",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
