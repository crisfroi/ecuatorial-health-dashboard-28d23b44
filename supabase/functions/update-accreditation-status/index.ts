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
    // Inicializar cliente Supabase con service role para operaciones administrativas
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    console.log("Iniciando actualización automática de estados de acreditación...");

    // Obtener todos los profesionales con estado "Aprobado"
    const { data: profesionales, error: fetchError } = await supabaseClient
      .from("profesionales_sanitarios")
      .select("id, estado_solicitud, fecha_validez_carnet, fecha_caducidad")
      .eq("estado_solicitud", "Aprobado");

    if (fetchError) {
      console.error("Error fetching professionals:", fetchError);
      return new Response(
        JSON.stringify({
          error: "Error al obtener profesionales",
          details: fetchError.message,
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

    if (!profesionales || profesionales.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No se encontraron profesionales aprobados para actualizar",
          updated_count: 0,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    const hoy = new Date();
    const profesionalesVencidos: string[] = [];
    const profesionalesActualizados: string[] = [];

    // Procesar cada profesional
    for (const profesional of profesionales) {
      try {
        // Usar fecha_validez_carnet o fecha_caducidad como fallback
        const fechaValidez = profesional.fecha_validez_carnet || profesional.fecha_caducidad;
        
        if (!fechaValidez) {
          console.warn(`Profesional ${profesional.id} no tiene fecha de validez definida`);
          continue;
        }

        const fechaVencimiento = new Date(fechaValidez);
        
        // Si la fecha de vencimiento es anterior a hoy, cambiar estado a "Vencido"
        if (fechaVencimiento <= hoy) {
          const { error: updateError } = await supabaseClient
            .from("profesionales_sanitarios")
            .update({ 
              estado_solicitud: "Vencido",
              updated_at: new Date().toISOString()
            })
            .eq("id", profesional.id);

          if (updateError) {
            console.error(`Error updating professional ${profesional.id}:`, updateError);
          } else {
            profesionalesVencidos.push(profesional.id);
            profesionalesActualizados.push(profesional.id);
            console.log(`Profesional ${profesional.id} marcado como vencido`);
          }

          // También actualizar en la vista pública
          const { error: publicUpdateError } = await supabaseClient
            .from("busqueda_profesionales_publica")
            .update({ 
              estado_solicitud: "Vencido",
            })
            .eq("profesional_id", profesional.id);

          if (publicUpdateError) {
            console.error(`Error updating public view for professional ${profesional.id}:`, publicUpdateError);
          }
        }
      } catch (processingError) {
        console.error(`Error processing professional ${profesional.id}:`, processingError);
      }
    }

    // Respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        message: `Actualización completada. ${profesionalesVencidos.length} profesionales marcados como vencidos.`,
        total_processed: profesionales.length,
        updated_count: profesionalesActualizados.length,
        expired_professionals: profesionalesVencidos,
        processed_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );

  } catch (error) {
    console.error("Error in accreditation status update:", error);
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
