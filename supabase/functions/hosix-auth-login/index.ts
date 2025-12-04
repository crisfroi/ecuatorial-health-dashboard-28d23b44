import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

interface LoginRequest {
  username: string
  password: string
}

interface LoginResponse {
  success: boolean
  user?: {
    id: string
    username: string
    email: string
    nombre_completo: string
    perfil_id: string
  }
  error?: string
  message?: string
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { username, password } = (await req.json()) as LoginRequest

    if (!username || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Usuario y contraseña requeridos",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Crear cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar usuario en BD
    const { data: usuario, error: queryError } = await supabase
      .from("hosix_usuarios")
      .select("id, username, email, nombre_completo, perfil_id, activo, intentos_fallidos, bloqueado_hasta")
      .eq("username", username)
      .single()

    if (queryError || !usuario) {
      // Log de intento fallido
      await supabase
        .from("hosix_auditoria")
        .insert({
          accion: "LOGIN_FALLIDO",
          tabla_afectada: "hosix_usuarios",
          datos_nuevos: { username, timestamp: new Date().toISOString() },
        })

      return new Response(
        JSON.stringify({
          success: false,
          error: "Usuario o contraseña incorrectos",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Verificar si está bloqueado
    if (usuario.bloqueado_hasta) {
      const bloqueadoHasta = new Date(usuario.bloqueado_hasta)
      if (bloqueadoHasta > new Date()) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Usuario temporalmente bloqueado por múltiples intentos fallidos",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      }
    }

    // Verificar si está activo
    if (!usuario.activo) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Usuario inactivo",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // TODO: Verificar contraseña con hash (en producción, usar bcrypt)
    // Por ahora, aceptamos cualquier contraseña para testing

    // Actualizar último acceso y resetear intentos fallidos
    const { error: updateError } = await supabase
      .from("hosix_usuarios")
      .update({
        ultimo_acceso: new Date().toISOString(),
        intentos_fallidos: 0,
        bloqueado_hasta: null,
      })
      .eq("id", usuario.id)

    if (updateError) {
      console.error("Error updating user:", updateError)
    }

    // Registrar login exitoso en auditoría
    await supabase
      .from("hosix_auditoria")
      .insert({
        usuario_id: usuario.id,
        accion: "LOGIN_EXITOSO",
        tabla_afectada: "hosix_usuarios",
        datos_nuevos: { timestamp: new Date().toISOString() },
      })

    const response: LoginResponse = {
      success: true,
      user: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombre_completo: usuario.nombre_completo,
        perfil_id: usuario.perfil_id,
      },
      message: "Login exitoso",
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
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
