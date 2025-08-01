import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar autorización
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Cliente con permisos de administrador
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Cliente normal para verificar el usuario actual
    const supabaseClient = createClient(
      supabaseUrl, 
      Deno.env.get('SUPABASE_ANON_KEY')!
    )

    // Verificar que el usuario actual tiene permisos de admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Verificar si el usuario es administrador
    const userRole = user.user_metadata?.role
    if (userRole !== 'SUPER_ADMINISTRADOR') {
      throw new Error('Insufficient permissions')
    }

    const { action, ...params } = await req.json()

    switch (action) {
      case 'listUsers': {
        const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
        if (error) throw error

        // Convertir usuarios a formato esperado
        const userProfiles = users.users.map(user => ({
          id: user.id,
          email: user.email || '',
          role: user.user_metadata?.role || 'OBSERVADOR',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          department: user.user_metadata?.department || 'Ministerio de Sanidad',
          assigned_center_id: user.user_metadata?.assigned_center_id,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
          is_active: !!user.email_confirmed_at
        }))

        return new Response(
          JSON.stringify({ success: true, users: userProfiles }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'updateUser': {
        const { userId, updates } = params
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { ...updates }
        })
        if (error) throw error

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'deleteUser': {
        const { userId } = params
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (error) throw error

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Error in admin-users function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
