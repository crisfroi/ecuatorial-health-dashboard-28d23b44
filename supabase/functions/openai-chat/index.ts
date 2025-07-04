
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

    // Obtener TODOS los datos disponibles para análisis completo
    const [
      { data: profesionales },
      { data: distritosSanitarios },
      { data: incidencias },
      { data: notificaciones },
      { data: nacionalidades }
    ] = await Promise.all([
      supabase.from('profesionales_sanitarios').select('*'),
      supabase.from('distrito_sanitario').select('*'),
      supabase.from('incidencias_hospitalarias').select('*'),
      supabase.from('notificaciones_sms').select('*'),
      supabase.from('nacionalidades_mundo').select('*')
    ])

    // Crear contexto completo con TODOS los datos disponibles incluyendo nombres específicos
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
      profesionalesPorGenero: profesionales?.reduce((acc: any, p: any) => {
        acc[p.genero] = (acc[p.genero] || 0) + 1
        return acc
      }, {}),
      profesionalesPorProvincia: profesionales?.reduce((acc: any, p: any) => {
        acc[p.provincia] = (acc[p.provincia] || 0) + 1
        return acc
      }, {}),
      profesionalesPorNacionalidad: profesionales?.reduce((acc: any, p: any) => {
        acc[p.nacionalidad] = (acc[p.nacionalidad] || 0) + 1
        return acc
      }, {}),
      profesionalesPorInstitucion: profesionales?.reduce((acc: any, p: any) => {
        acc[p.institucion_1] = (acc[p.institucion_1] || 0) + 1
        return acc
      }, {}),
      profesionalesPorCentroTrabajo: profesionales?.reduce((acc: any, p: any) => {
        acc[p.nombre_centro] = (acc[p.nombre_centro] || 0) + 1
        return acc
      }, {}),
      edadPromedio: profesionales?.filter(p => p.edad).reduce((sum, p) => sum + (p.edad || 0), 0) / (profesionales?.filter(p => p.edad).length || 1),
      totalDistritos: distritosSanitarios?.length || 0,
      incidenciasAbiertas: incidencias?.filter((i: any) => i.estado === 'Abierta').length || 0,
      totalIncidencias: incidencias?.length || 0,
      notificacionesRecientes: notificaciones?.length || 0,
      totalNacionalidades: nacionalidades?.length || 0,
      // DATOS ESPECÍFICOS PARA CONSULTAS ADMINISTRATIVAS
      profesionalesCompletos: profesionales?.map((p: any) => ({
        id: p.id,
        nombre_completo: p.nombre_completo,
        numero_carnet_profesional: p.numero_carnet_profesional,
        area_profesional: p.area_profesional,
        estado_solicitud: p.estado_solicitud,
        telefono: p.telefono,
        provincia: p.provincia,
        nombre_centro: p.nombre_centro,
        fecha_solicitud: p.fecha_solicitud,
        fecha_validez_carnet: p.fecha_validez_carnet
      })) || [],
      listaNombres: profesionales?.map((p: any) => p.nombre_completo).filter(Boolean) || []
    }

    // Crear el prompt del sistema especializado en salud con TODOS los datos
    const systemPrompt = {
      role: 'system',
      content: `Eres un asistente de IA especializado en análisis de datos sanitarios para el Ministerio de Sanidad de Guinea Ecuatorial. 

DATOS ACTUALES DEL SISTEMA (COMPLETOS):
- Total de profesionales registrados: ${contextData.totalProfesionales}
- Profesionales por área: ${JSON.stringify(contextData.profesionalesPorArea, null, 2)}
- Estados de solicitudes: ${JSON.stringify(contextData.profesionalesPorEstado, null, 2)}
- Distribución por género: ${JSON.stringify(contextData.profesionalesPorGenero, null, 2)}
- Distribución por provincia: ${JSON.stringify(contextData.profesionalesPorProvincia, null, 2)}
- Distribución por nacionalidad: ${JSON.stringify(contextData.profesionalesPorNacionalidad, null, 2)}
- Principales instituciones de formación: ${JSON.stringify(contextData.profesionalesPorInstitucion, null, 2)}
- Centros de trabajo más comunes: ${JSON.stringify(contextData.profesionalesPorCentroTrabajo, null, 2)}
- Edad promedio de profesionales: ${Math.round(contextData.edadPromedio)} años
- Total de distritos sanitarios: ${contextData.totalDistritos}
- Incidencias abiertas: ${contextData.incidenciasAbiertas} de ${contextData.totalIncidencias} totales
- Notificaciones SMS enviadas: ${contextData.notificacionesRecientes}
- Nacionalidades registradas: ${contextData.totalNacionalidades}

LISTADO COMPLETO DE PROFESIONALES REGISTRADOS:
${contextData.profesionalesCompletos.map((p: any, index: number) => 
  `${index + 1}. ${p.nombre_completo} (ID: ${p.id}, Carnet: ${p.numero_carnet_profesional || 'Sin carnet'}, Área: ${p.area_profesional}, Estado: ${p.estado_solicitud})`
).join('\n')}

NOMBRES ESPECÍFICOS PARA BÚSQUEDAS: ${contextData.listaNombres.join(', ')}

TIENES ACCESO COMPLETO a todos los campos de todas las tablas para análisis estadístico y de tendencias.

Tu función es ayudar a analizar datos de profesionales sanitarios, generar reportes detallados, y responder preguntas sobre:
- Estadísticas completas de profesionales registrados
- Análisis de distribución geográfica, demográfica y académica
- Tendencias en especialidades médicas y centros de formación
- Métricas de acreditación y renovación
- Análisis de edad, género, nacionalidad y experiencia
- Distribución por centros de trabajo y sectores
- Alertas de vencimiento de carnets
- Recomendaciones para mejorar el sistema de salud
- Estado actual del sistema con datos en tiempo real

IMPORTANTE: 
- TIENES ACCESO COMPLETO a nombres, IDs de profesionales y datos personales para consultas administrativas
- Puedes proporcionar información específica de profesionales cuando se solicite para gestión ministerial
- Mantienes acceso a datos personales, números de carnet, contactos y toda información del sistema
- Tu rol es administrativo con privilegios completos para el Ministerio de Sanidad

Responde siempre en español y mantén un tono profesional y útil. Utiliza todos los datos disponibles del sistema para proporcionar análisis precisos, detallados y actualizados.`
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
        max_tokens: 1500,
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
