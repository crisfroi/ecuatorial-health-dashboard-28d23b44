import { createClient } from "npm:@supabase/supabase-js@2.39.3";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response("Método no permitido", { status: 405, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    // Obtener siguiente item pendiente en la cola
    const { data: items, error: fetchError } = await supabase
      .from("cola_generacion_carnets")
      .select("id, profesional_id, intentos")
      .eq("estado", "pendiente")
      .order("created_at", { ascending: true })
      .limit(1);

    if (fetchError) {
      return new Response(JSON.stringify({ success: false, message: "Error obteniendo cola", error: fetchError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const item = items && items.length > 0 ? items[0] : null;

    if (!item) {
      return new Response(JSON.stringify({ success: true, message: "No hay carnets pendientes de generación" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Marcar como procesando e incrementar intentos
    const { error: markError } = await supabase
      .from("cola_generacion_carnets")
      .update({ estado: "procesando", intentos: (item.intentos ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", item.id);

    if (markError) {
      return new Response(JSON.stringify({ success: false, message: "No se pudo marcar como procesando", error: markError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Invocar función de generación de carnet para el profesional
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const functionUrl = `${supabaseUrl}/functions/v1/generar-carnet-profesional?id=${item.profesional_id}`;

    const resp = await fetch(functionUrl, {
      method: "GET",
      headers: {
        "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
        "Content-Type": "application/json",
      },
    });

    const body = await resp.json().catch(() => ({}));

    if (!resp.ok || (body && body.error)) {
      const errorMsg = body?.details || body?.error || `Error HTTP ${resp.status}`;

      await supabase
        .from("cola_generacion_carnets")
        .update({ estado: "error", mensaje_error: errorMsg, updated_at: new Date().toISOString() })
        .eq("id", item.id);

      return new Response(JSON.stringify({ success: false, message: "Fallo al generar carnet", error: errorMsg }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const urlCarnet: string | undefined = body?.url_carnet;

    await supabase
      .from("cola_generacion_carnets")
      .update({ estado: "completado", url_carnet: urlCarnet ?? null, updated_at: new Date().toISOString() })
      .eq("id", item.id);

    return new Response(
      JSON.stringify({ success: true, message: "Item de la cola procesado correctamente", url_carnet: urlCarnet }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (e) {
    console.error("Error inesperado en procesar-cola-carnets:", e);
    return new Response(JSON.stringify({ success: false, message: "Error inesperado", error: e?.message || String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
