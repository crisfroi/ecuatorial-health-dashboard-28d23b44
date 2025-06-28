
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
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)
    
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(today.getDate() - 10)

    // Buscar profesionales que necesitan notificación de 30 días antes
    const { data: professionals30Days } = await supabase
      .from('profesionales_sanitarios')
      .select('id, nombre_completo, telefono, fecha_validez_carnet')
      .eq('estado_solicitud', 'Aprobado')
      .gte('fecha_validez_carnet', today.toISOString().split('T')[0])
      .lte('fecha_validez_carnet', thirtyDaysFromNow.toISOString().split('T')[0])
      .not('telefono', 'is', null)

    // Buscar profesionales que vencieron hace 10 días
    const { data: professionals10DaysAfter } = await supabase
      .from('profesionales_sanitarios')
      .select('id, nombre_completo, telefono, fecha_validez_carnet')
      .eq('estado_solicitud', 'Aprobado')
      .gte('fecha_validez_carnet', tenDaysAgo.toISOString().split('T')[0])
      .lte('fecha_validez_carnet', today.toISOString().split('T')[0])
      .not('telefono', 'is', null)

    const notifications = []

    // Procesar notificaciones de 30 días antes
    if (professionals30Days) {
      for (const prof of professionals30Days) {
        // Verificar si ya se envió esta notificación
        const { data: existingNotification } = await supabase
          .from('notificaciones_sms')
          .select('id')
          .eq('profesional_id', prof.id)
          .eq('tipo_notificacion', '30_dias_antes')
          .single()

        if (!existingNotification) {
          const mensaje = `Estimado/a ${prof.nombre_completo}, su carnet profesional vence el ${prof.fecha_validez_carnet}. Por favor, renueve antes del vencimiento. Ministerio de Sanidad - Guinea Ecuatorial`
          
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-sms-notification`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                profesionalId: prof.id,
                telefono: prof.telefono,
                tipoNotificacion: '30_dias_antes',
                mensaje: mensaje
              })
            })
            notifications.push({ type: '30_dias_antes', professional: prof.nombre_completo })
          } catch (error) {
            console.error(`Error sending 30-day notification to ${prof.nombre_completo}:`, error)
          }
        }
      }
    }

    // Procesar notificaciones de 10 días después
    if (professionals10DaysAfter) {
      for (const prof of professionals10DaysAfter) {
        // Verificar si ya se envió esta notificación
        const { data: existingNotification } = await supabase
          .from('notificaciones_sms')
          .select('id')
          .eq('profesional_id', prof.id)
          .eq('tipo_notificacion', '10_dias_despues')
          .single()

        if (!existingNotification) {
          const mensaje = `Estimado/a ${prof.nombre_completo}, su carnet profesional venció el ${prof.fecha_validez_carnet}. Debe renovar urgentemente. Contacte al Ministerio de Sanidad - Guinea Ecuatorial`
          
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-sms-notification`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                profesionalId: prof.id,
                telefono: prof.telefono,
                tipoNotificacion: '10_dias_despues',
                mensaje: mensaje
              })
            })
            notifications.push({ type: '10_dias_despues', professional: prof.nombre_completo })
          } catch (error) {
            console.error(`Error sending 10-day notification to ${prof.nombre_completo}:`, error)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: notifications.length,
        notifications: notifications 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in renewal notifications:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
