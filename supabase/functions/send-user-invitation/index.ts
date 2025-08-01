import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🚀 Función send-user-invitation iniciada')
  
  if (req.method === 'OPTIONS') {
    console.log('✅ Respuesta CORS OPTIONS')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log('📥 Datos recibidos:', {
      email: requestBody.email,
      role: requestBody.role,
      full_name: requestBody.full_name,
      department: requestBody.department
    })

    const { 
      email, 
      role = 'OBSERVADOR',
      full_name,
      department = 'Ministerio de Sanidad y Bienestar Social',
      assigned_center_id,
      invited_by 
    } = requestBody

    // Validar email (acepta cualquier formato válido)
    if (!email || !email.includes('@')) {
      throw new Error('Email inválido')
    }

    // Validar rol
    const validRoles = ['SUPER_ADMINISTRADOR', 'REVISOR_SOLICITUDES', 'PERSONALIDAD_MINISTERIAL', 'OBSERVADOR', 'DIRECTIVO_CENTRO_SANITARIO']
    if (!validRoles.includes(role)) {
      throw new Error(`Rol inválido: ${role}`)
    }

    console.log('✅ Validaciones pasadas')

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY no configurada')
      throw new Error('RESEND_API_KEY not configured')
    }

    console.log('✅ RESEND_API_KEY encontrada')

    // Crear usuario en Supabase Auth
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    console.log('🔐 Creando cliente Supabase...')
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Generar contraseña temporal
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`
    console.log('🔑 Contraseña temporal generada')

    console.log('👤 Creando usuario en Supabase Auth...')
    // Crear usuario con datos completos
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: role,
        full_name: full_name || email.split('@')[0],
        department: department,
        assigned_center_id: assigned_center_id,
        invited_by: invited_by,
        invitation_date: new Date().toISOString()
      }
    })

    if (userError) {
      console.error('❌ Error creating user:', userError)
      throw new Error(`Error creating user: ${userError.message}`)
    }

    console.log('✅ Usuario creado exitosamente:', userData.user?.id)

    // Obtener nombre del rol para el correo
    const roleNames: Record<string, string> = {
      'SUPER_ADMINISTRADOR': 'Super Administrador',
      'REVISOR_SOLICITUDES': 'Revisor de Solicitudes',
      'PERSONALIDAD_MINISTERIAL': 'Personalidad Ministerial',
      'DIRECTIVO_CENTRO_SANITARIO': 'Directivo de Centro Sanitario',
      'OBSERVADOR': 'Observador'
    }

    const roleName = roleNames[role] || role

    // URL del sistema (acepta cualquier URL)
    const siteUrl = Deno.env.get('SITE_URL') || 'https://salud.gq'

    console.log('📧 Enviando correo con Resend...')
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
        subject: 'Invitación al Sistema de Gestión de Profesionales Sanitarios - Guinea Ecuatorial',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitación al Sistema de Salud</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">
                  🏥 Sistema de Gestión de Profesionales Sanitarios
                </h1>
                <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">
                  Ministerio de Sanidad y Bienestar Social - Guinea Ecuatorial
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">
                  ¡Bienvenido/a al Sistema de Salud!
                </h2>
                
                <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                  Estimado/a <strong>${full_name || email.split('@')[0]}</strong>,
                </p>
                
                <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
                  Ha sido invitado/a a formar parte del Sistema de Gestión de Profesionales Sanitarios del Ministerio de Sanidad y Bienestar Social de Guinea Ecuatorial.
                </p>

                <!-- User Info Box -->
                <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px;">Información de su cuenta:</h3>
                  <ul style="margin: 0; padding: 0; list-style: none;">
                    <li style="padding: 4px 0; color: #374151;">
                      <strong>📧 Email:</strong> ${email}
                    </li>
                    <li style="padding: 4px 0; color: #374151;">
                      <strong>👤 Rol asignado:</strong> ${roleName}
                    </li>
                    <li style="padding: 4px 0; color: #374151;">
                      <strong>🏢 Departamento:</strong> ${department}
                    </li>
                    <li style="padding: 4px 0; color: #374151;">
                      <strong>🔐 Contraseña temporal:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${tempPassword}</code>
                    </li>
                  </ul>
                </div>

                <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 20px 0;">
                  <p style="color: #92400e; margin: 0; font-size: 14px;">
                    ⚠️ <strong>Importante:</strong> Por seguridad, cambie su contraseña después del primer inicio de sesión.
                  </p>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${siteUrl}" 
                     style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
                            color: white; 
                            padding: 14px 32px; 
                            text-decoration: none; 
                            border-radius: 6px; 
                            font-weight: bold; 
                            font-size: 16px; 
                            display: inline-block;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    🚀 Acceder al Sistema
                  </a>
                </div>

                <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
                  Si tiene alguna pregunta o necesita asistencia, no dude en contactar con el equipo de soporte técnico.
                </p>
              </div>

              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
                  Este correo fue enviado automáticamente por el Sistema de Gestión de Profesionales Sanitarios.<br>
                  <strong>Ministerio de Sanidad y Bienestar Social - Guinea Ecuatorial</strong><br>
                  © ${new Date().getFullYear()} - Todos los derechos reservados
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    })

    console.log('📨 Respuesta de Resend:', emailResponse.status)

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      console.error('❌ Email sending failed:', errorData)
      throw new Error(`Email sending failed: ${errorData.message || 'Unknown error'}`)
    }

    const emailResult = await emailResponse.json()
    console.log('✅ Email enviado exitosamente:', emailResult.id)

    const successResponse = { 
      success: true, 
      user: userData.user,
      emailId: emailResult.id,
      message: 'Invitación enviada exitosamente'
    }

    console.log('🎉 Proceso completado exitosamente')

    return new Response(
      JSON.stringify(successResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Error in user invitation:', error)
    
    const errorResponse = {
      error: error.message,
      details: 'Check function logs for more information',
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
