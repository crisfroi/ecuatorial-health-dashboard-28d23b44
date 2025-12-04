import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

interface AuditoriaEventoRequest {
  usuario_id: string
  accion: string
  tabla_afectada: string
  registro_id?: string
  datos_anteriores?: Record<string, unknown>
  datos_nuevos?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
}

interface AuditoriaEventoResponse {
  success: boolean
  evento_id?: string
  error?: string
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as AuditoriaEventoRequest

    const {
      usuario_id,
      accion,
      tabla_afectada,
      registro_id,
      datos_anteriores,
      datos_nuevos,
      ip_address,
      user_agent,
    } = body

    // Validar campos requeridos
    if (!usuario_id || !accion || !tabla_afectada) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Campos requeridos: usuario_id, accion, tabla_afectada",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Obtener IP del cliente si no se proporciona
    let clientIp = ip_address

    if (!clientIp) {
      const forwardedFor = req.headers.get("x-forwarded-for")
      clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : undefined
    }

    // Obtener User-Agent si no se proporciona
    const clientUserAgent = user_agent || req.headers.get("user-agent") || undefined

    // Insertar evento de auditoría
    const { data: evento, error: insertError } = await supabase
      .from("hosix_auditoria")
      .insert({
        usuario_id,
        accion,
        tabla_afectada,
        registro_id: registro_id || null,
        datos_anteriores: datos_anteriores || {},
        datos_nuevos: datos_nuevos || {},
        ip_address: clientIp,
        user_agent: clientUserAgent,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error inserting audit event:", insertError)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Error al registrar evento de auditoría",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        evento_id: evento.id,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error interno del servidor",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
