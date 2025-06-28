
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, role = 'user' } = await req.json()

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Crear usuario en Supabase Auth
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Crear usuario
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: true,
    })

    if (userError) {
      throw new Error(`Error creating user: ${userError.message}`)
    }

    // Enviar invitación por correo usando Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Sistema de Salud <noreply@salud.gq>',
        to: [email],
        subject: 'Invitación al Sistema de Gestión de Profesionales Sanitarios',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #2563eb;">Invitación al Sistema de Salud - Guinea Ecuatorial</h2>
            <p>Estimado/a,</p>
            <p>Ha sido invitado/a a formar parte del Sistema de Gestión de Profesionales Sanitarios del Ministerio de Sanidad y Bienestar Social de Guinea Ecuatorial.</p>
            <p><strong>Su rol asignado:</strong> ${role}</p>
            <p>Para acceder al sistema, haga clic en el siguiente enlace:</p>
            <a href="${supabaseUrl}/auth/v1/verify?token=${userData.user?.email_confirmation_token}&type=signup&redirect_to=${Deno.env.get('SITE_URL') || window.location.origin}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">
              Acceder al Sistema
            </a>
            <p>Si tiene alguna pregunta, contacte con el administrador del sistema.</p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Este correo fue enviado automáticamente por el Sistema de Gestión de Profesionales Sanitarios.<br>
              Ministerio de Sanidad y Bienestar Social - Guinea Ecuatorial
            </p>
          </div>
        `,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      throw new Error(`Email sending failed: ${errorData.message}`)
    }

    const emailResult = await emailResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: userData.user,
        emailId: emailResult.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in user invitation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
