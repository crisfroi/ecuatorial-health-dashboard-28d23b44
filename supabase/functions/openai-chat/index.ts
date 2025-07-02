
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
    const { messages } = await req.json()
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY no configurada')
    }

    // Configurar cliente de Supabase para acceder a datos
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener datos en tiempo real para análisis
    const [
      { data: profesionales },
      { data: distritosSanitarios },
      { data: incidencias },
      { data: notificaciones }
    ] = await Promise.all([
      supabase.from('profesionales_sanitarios').select('*').limit(100),
      supabase.from('distrito_sanitario').select('*'),
      supabase.from('incidencias_hospitalarias').select('*').limit(50),
      supabase.from('notificaciones_sms').select('*').limit(50)
    ])

    // Crear contexto con datos actuales
    const contextData = {
      totalProfesionales: profesionales?.length || 0,
      profesionalesPorArea: profesionales?.reduce((acc: any, p: any) => {
        acc[p.area_profesional] = (acc[p.area_profesional] || 0) + 1
        return acc
      }, {}),
      profesionalesPorEstado: profesionales?.reduce((acc: any, p: any) => {
        acc[p.estado_solicitud] = (acc[p.estado_solicitud] || 0) + 1
        return acc
      }, {}),
      totalDistritos: distritosSanitarios?.length || 0,
      incidenciasAbiertas: incidencias?.filter((i: any) => i.estado === 'Abierta').length || 0,
      notificacionesRecientes: notificaciones?.length || 0
    }

    // Crear el prompt del sistema especializado en salud con datos reales
    const systemPrompt = {
      role: 'system',
      content: `Eres un asistente de IA especializado en análisis de datos sanitarios para el Ministerio de Sanidad de Guinea Ecuatorial. 

DATOS ACTUALES DEL SISTEMA:
- Total de profesionales registrados: ${contextData.totalProfesionales}
- Profesionales por área: ${JSON.stringify(contextData.profesionalesPorArea, null, 2)}
- Estados de solicitudes: ${JSON.stringify(contextData.profesionalesPorEstado, null, 2)}
- Total de distritos sanitarios: ${contextData.totalDistritos}
- Incidencias abiertas: ${contextData.incidenciasAbiertas}
- Notificaciones recientes: ${contextData.notificacionesRecientes}

Tu función es ayudar a analizar datos de profesionales sanitarios, generar reportes, y responder preguntas sobre:
- Estadísticas de profesionales registrados (usa los datos reales arriba)
- Análisis de distribución geográfica
- Tendencias en especialidades médicas
- Métricas de acreditación y renovación
- Alertas de vencimiento de carnets
- Recomendaciones para mejorar el sistema de salud
- Estado actual del sistema con datos en tiempo real

Responde siempre en español y mantén un tono profesional y útil. Utiliza los datos reales del sistema para proporcionar análisis precisos y actualizados.`
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [systemPrompt, ...messages],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify({ 
        response: data.choices[0].message.content 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
