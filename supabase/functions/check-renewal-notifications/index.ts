import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Inicializar cliente Supabase con service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    console.log("Ejecutando verificación automática de renovaciones...");

    // Ejecutar la función de actualización de estados
    const updateResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/update-accreditation-status`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
      },
    );

    let updateResult;
    if (updateResponse.ok) {
      updateResult = await updateResponse.json();
      console.log("Actualización de estados completada:", updateResult);
    } else {
      console.error("Error en actualización de estados:", await updateResponse.text());
    }

    // También verificar profesionales próximos a vencer (30 días) para notificaciones
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 30);

    const { data: proximosVencer, error: proximosError } = await supabaseClient
      .from("profesionales_sanitarios")
      .select("id, nombre_completo, fecha_validez_carnet, fecha_caducidad, telefono")
      .eq("estado_solicitud", "Aprobado")
      .or(`fecha_validez_carnet.lte.${fechaLimite.toISOString()},fecha_caducidad.lte.${fechaLimite.toISOString()}`);

    if (proximosError) {
      console.error("Error obteniendo profesionales próximos a vencer:", proximosError);
    }

    console.log(`Encontrados ${proximosVencer?.length || 0} profesionales próximos a vencer`);

    // Aquí se podrían enviar notificaciones SMS o email
    // Por ahora solo loggeamos la información

    const response = {
      success: true,
      message: "Verificación de renovaciones completada",
      update_result: updateResult,
      professionals_expiring_soon: proximosVencer?.length || 0,
      executed_at: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );

  } catch (error) {
    console.error("Error en verificación de renovaciones:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message || JSON.stringify(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }
});
