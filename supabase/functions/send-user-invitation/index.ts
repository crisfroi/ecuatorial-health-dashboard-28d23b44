import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🚀 send-user-invitation function started')
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📥 Processing request...')
    const requestBody = await req.json()
    console.log('📋 Request body received:', { 
      email: requestBody.email, 
      role: requestBody.role,
      hasFullName: !!requestBody.full_name 
    })

    const {
      email,
      role = 'OBSERVADOR',
      full_name,
      department,
      assigned_center_id
    } = requestBody

    // Validación básica
    if (!email || !email.includes('@')) {
      throw new Error('Email inválido')
    }

    console.log('✅ Email validation passed')

    // Verificar variables de entorno
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const siteUrl = Deno.env.get('SITE_URL') || 'https://e326d7762bce426c8bb8967ed29b2b1f-1b8f06346ec0483abd5cbc642.fly.dev'

    console.log('🔐 Environment check:', {
      hasResendKey: !!RESEND_API_KEY,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      siteUrl: siteUrl
    })

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not configured')
    }

    // Crear cliente Supabase
    console.log('🔧 Creating Supabase client...')
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Generar contraseña temporal
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`
    console.log('🔑 Generated temporary password')

    // Crear usuario
    console.log('👤 Creating user in Supabase Auth...')
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: role,
        full_name: full_name || email.split('@')[0],
        department: department || 'Ministerio de Sanidad y Bienestar Social',
        assigned_center_id: assigned_center_id || null
      }
    })

    if (userError) {
      console.error('❌ User creation failed:', userError)
      throw new Error(`Error creating user: ${userError.message}`)
    }

    console.log('✅ User created successfully:', userData.user?.id)

    // Preparar correo
    console.log('📧 Preparing email...')
    const emailData = {
      from: 'Sistema de Salud <noreply@salud.gq>',
      to: [email],
      subject: 'Invitación al Sistema de Gestión de Profesionales Sanitarios',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: white; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2563eb; text-align: center;">🏥 Sistema de Salud - Guinea Ecuatorial</h2>
          
          <p>Estimado/a <strong>${full_name || email.split('@')[0]}</strong>,</p>
          
          <p>Ha sido invitado/a a formar parte del Sistema de Gestión de Profesionales Sanitarios del Ministerio de Sanidad y Bienestar Social de Guinea Ecuatorial.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">Información de acceso:</h3>
            <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>👤 Rol:</strong> ${role}</p>
            <p style="margin: 5px 0;"><strong>🔐 Contraseña temporal:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              🚀 Acceder al Sistema
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 30px;">
            Este correo fue enviado automáticamente por el Sistema de Gestión de Profesionales Sanitarios.<br>
            <strong>Ministerio de Sanidad y Bienestar Social - Guinea Ecuatorial</strong>
          </p>
        </div>
      `
    }

    console.log('📨 Sending email via Resend...')
    
    // Enviar correo
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    console.log('📬 Email API response status:', emailResponse.status)

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('❌ Email sending failed:', errorText)
      throw new Error(`Email sending failed: ${errorText}`)
    }

    const emailResult = await emailResponse.json()
    console.log('✅ Email sent successfully, ID:', emailResult.id)

    // Respuesta exitosa
    const successResponse = {
      success: true,
      user: {
        id: userData.user?.id,
        email: userData.user?.email
      },
      emailId: emailResult.id,
      message: 'Usuario creado e invitación enviada exitosamente'
    }

    console.log('🎉 Function completed successfully')

    return new Response(
      JSON.stringify(successResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('❌ Function error:', error)
    console.error('❌ Error stack:', error.stack)
    
    const errorResponse = {
      success: false,
      error: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(errorResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
