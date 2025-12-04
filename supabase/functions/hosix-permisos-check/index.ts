import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

interface PermisosCheckRequest {
  usuario_id: string
  modulo: string
  accion: "leer" | "crear" | "editar" | "eliminar" | "aprobar"
}

interface PermisosCheckResponse {
  tiene_permiso: boolean
  nivel_acceso?: number
  modulo?: string
  accion?: string
  error?: string
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { usuario_id, modulo, accion } = (await req.json()) as PermisosCheckRequest

    if (!usuario_id || !modulo || !accion) {
      return new Response(
        JSON.stringify({
          tiene_permiso: false,
          error: "Parámetros requeridos: usuario_id, modulo, accion",
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

    // Obtener usuario y su perfil
    const { data: usuario, error: usuarioError } = await supabase
      .from("hosix_usuarios")
      .select("id, perfil_id")
      .eq("id", usuario_id)
      .single()

    if (usuarioError || !usuario) {
      return new Response(
        JSON.stringify({
          tiene_permiso: false,
          error: "Usuario no encontrado",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Obtener perfil del usuario
    const { data: perfil, error: perfilError } = await supabase
      .from("hosix_perfiles")
      .select("id, nivel_acceso")
      .eq("id", usuario.perfil_id)
      .single()

    if (perfilError || !perfil) {
      return new Response(
        JSON.stringify({
          tiene_permiso: false,
          error: "Perfil no encontrado",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Obtener permisos para el módulo
    const { data: permisos, error: permisosError } = await supabase
      .from("hosix_permisos_modulos")
      .select("puede_leer, puede_crear, puede_editar, puede_eliminar, puede_aprobar")
      .eq("perfil_id", usuario.perfil_id)
      .eq("modulo", modulo)
      .single()

    if (permisosError || !permisos) {
      // Si no hay permisos definidos para este módulo, denegar acceso
      return new Response(
        JSON.stringify({
          tiene_permiso: false,
          nivel_acceso: perfil.nivel_acceso,
          modulo,
          accion,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Verificar permiso específico
    let tiene_permiso = false

    switch (accion) {
      case "leer":
        tiene_permiso = permisos.puede_leer
        break
      case "crear":
        tiene_permiso = permisos.puede_crear
        break
      case "editar":
        tiene_permiso = permisos.puede_editar
        break
      case "eliminar":
        tiene_permiso = permisos.puede_eliminar
        break
      case "aprobar":
        tiene_permiso = permisos.puede_aprobar
        break
    }

    // Registrar en auditoría
    await supabase
      .from("hosix_auditoria")
      .insert({
        usuario_id,
        accion: "PERMISO_CHECK",
        tabla_afectada: "hosix_permisos_modulos",
        datos_nuevos: {
          modulo,
          accion,
          tiene_permiso,
          timestamp: new Date().toISOString(),
        },
      })

    return new Response(
      JSON.stringify({
        tiene_permiso,
        nivel_acceso: perfil.nivel_acceso,
        modulo,
        accion,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({
        tiene_permiso: false,
        error: "Error interno del servidor",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
