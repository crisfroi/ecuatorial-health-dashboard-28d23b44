import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    )
  }

  try {
    const { profesionalId, telefono, tipoNotificacion, mensaje } = await req.json()

    if (!profesionalId || !telefono || !tipoNotificacion || !mensaje) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: profesionalId, telefono, tipoNotificacion, mensaje' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validación E.164 básica
    const e164 = /^\+[1-9]\d{6,14}$/
    if (!e164.test(telefono)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone format. Use E.164 (e.g., +240XXXXXXXX)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Enviar SMS usando Twilio
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: telefono,
        Body: mensaje,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      const err = typeof result === 'object' ? (result.message || JSON.stringify(result)) : String(result)
      return new Response(
        JSON.stringify({ error: `Twilio error: ${err}`, status: response.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }

    // Registrar la notificación en la base de datos
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY; skipping DB insert')
    } else {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { error: insertError } = await supabase
        .from('notificaciones_sms')
        .insert({
          profesional_id: profesionalId,
          telefono,
          tipo_notificacion: tipoNotificacion,
          estado: 'enviado',
          mensaje_sid: result.sid
        })
      if (insertError) {
        console.error('Error saving notification:', insertError)
      }
    }

    return new Response(
      JSON.stringify({ success: true, messageSid: result.sid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error sending SMS:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
