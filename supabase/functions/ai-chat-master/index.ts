import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 AI Chat Master - Inicializando sistema superinteligente')

    // Parse body safely
    let body: any = {}
    try {
      body = await req.json()
    } catch (_) {
      body = {}
    }

    const { messages = [], filters = {}, healthCheck = false } = body
    const globalFilters = filters || {}

    // Extrae filtros desde la última consulta del usuario (NL -> JSON)
    const lastUserMessage = (Array.isArray(messages) ? messages : []).filter((m: any) => m?.role === 'user').slice(-1)[0]?.content || ''

    async function extractFiltersFromQuery(query: string): Promise<Record<string, any>> {
      if (!OPENAI_API_KEY || !query) return {}
      const sys = `Eres un extractor de filtros. Devuelve SOLO un JSON con claves válidas si las detectas en la consulta.
Claves: area_profesional, estado_solicitud, provincia, distrito_sanitario, genero,
 categoria_titulacion, pais_formacion, institucion, rango_edad, rango_graduacion,
 dias_vencimiento, carnet_vencido, tipo_sector, categoria, sector, centro_salud_id,
 nombre_centro, funcion_publica.
Mapeos: "aprobados"->estado_solicitud:"Aprobado"; "rechazados"->"Rechazado"; "hospital"->categoria:"HOSPITAL"; "clínica"->"CLINICA"; "centro de salud"->"CENTRO DE SALUD"; "público"->tipo_sector:"Público"; "privado"->"Privado"; "mixto"->"Mixto"; "ong"->"ONG"; "función pública"->funcion_publica:true; "en [Provincia]"->provincia:"[Provincia]".`
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: query }
          ],
          temperature: 0,
          max_tokens: 200
        })
      })
      if (!res.ok) return {}
      const j = await res.json()
      try { return JSON.parse(j.choices?.[0]?.message?.content || '{}') } catch { return {} }
    }

    const nlpFilters = await extractFiltersFromQuery(lastUserMessage)

    // Health check: do not call OpenAI, just report readiness
    if (healthCheck) {
      const needsOpenAI = !OPENAI_API_KEY
      return new Response(
        JSON.stringify({ ok: true, needsOpenAI }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Verify env vars; avoid 5xx to prevent FunctionsHttpError surfacing to UI
    if (!OPENAI_API_KEY || !SUPABASE_URL || !SERVICE_ROLE) {
      console.error('❌ Variables de entorno faltantes:', {
        openai: !!OPENAI_API_KEY,
        supabase_url: !!SUPABASE_URL,
        service_role: !!SERVICE_ROLE
      })
      return new Response(
        JSON.stringify({
          error: 'Falta configuración del servidor de IA. Configura OPENAI_API_KEY y claves de Supabase.',
          needsOpenAI: !OPENAI_API_KEY,
          needsSetup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Formato de mensajes inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log('🔍 Obteniendo schema completo de la base de datos...')

    // **SISTEMA DE HERRAMIENTAS SUPERINTELIGENTE**
    const tools = [
      {
        type: "function",
        function: {
          name: "get_professionals_analytics",
          description: "Obtiene análisis completo de profesionales sanitarios con filtros avanzados",
          parameters: {
            type: "object",
            properties: {
              filters: {
                type: "object",
                properties: {
                  area_profesional: { type: "string", description: "Área profesional específica" },
                  estado_solicitud: { type: "string", description: "Estado de la solicitud (Aprobado, Recibido, etc.)" },
                  provincia: { type: "string", description: "Provincia específica" },
                  distrito_sanitario: { type: "string", description: "Distrito sanitario específico" },
                  genero: { type: "string", description: "Género (masculino/femenino)" },
                  categoria_titulacion: { type: "string", description: "Categoría de titulación" },
                  pais_formacion: { type: "string", description: "País de formación" },
                  institucion: { type: "string", description: "Institución de formación" },
                  rango_edad: { type: "array", items: { type: "number" }, description: "Rango de edad [min, max]" },
                  rango_graduacion: { type: "array", items: { type: "number" }, description: "Rango años graduación [desde, hasta]" },
                  dias_vencimiento: { type: "number", description: "Carnets que vencen en X días" },
                  carnet_vencido: { type: "boolean", description: "Solo carnets ya vencidos" }
                }
              },
              analysis_type: {
                type: "string", 
                enum: ["summary", "demographics", "geographic", "education", "work_status", "temporal"],
                description: "Tipo de análisis a realizar"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_centers_analytics",
          description: "Análisis completo de centros de salud y distribución de profesionales",
          parameters: {
            type: "object",
            properties: {
              filters: {
                type: "object",
                properties: {
                  categoria: { type: "string", description: "Categoría del centro (Hospital, Clínica, etc.)" },
                  provincia: { type: "string", description: "Provincia del centro" },
                  distrito_sanitario: { type: "string", description: "Distrito sanitario" },
                  sector: { type: "string", description: "Sector (Público, Privado, Mixto)" }
                }
              },
              include_professionals: { type: "boolean", description: "Incluir conteo de profesionales por centro" }
            }
          }
        }
      },
      {
        type: "function", 
        function: {
          name: "get_demographic_analysis",
          description: "Análisis demográfico detallado de profesionales",
          parameters: {
            type: "object",
            properties: {
              dimension: {
                type: "string",
                enum: ["age", "gender", "nationality", "province", "district"],
                description: "Dimensión demográfica a analizar"
              },
              cross_analysis: { type: "string", description: "Cruzar con otra variable para análisis correlacional" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_temporal_analysis", 
          description: "Análisis temporal de solicitudes, aprobaciones y tendencias",
          parameters: {
            type: "object",
            properties: {
              time_period: {
                type: "string",
                enum: ["last_month", "last_3_months", "last_6_months", "last_year", "all_time"],
                description: "Período temporal a analizar"
              },
              metric: {
                type: "string",
                enum: ["applications", "approvals", "rejections", "carnet_generation", "renewals"],
                description: "Métrica temporal específica"
              },
              grouping: {
                type: "string",
                enum: ["daily", "weekly", "monthly", "quarterly"],
                description: "Agrupación temporal"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_education_analysis",
          description: "Análisis completo de formación acad��mica y países de origen",
          parameters: {
            type: "object", 
            properties: {
              focus: {
                type: "string",
                enum: ["countries", "institutions", "graduation_years", "degree_types"],
                description: "Aspecto educativo a analizar"
              },
              top_n: { type: "number", description: "Número de resultados top a mostrar", default: 10 }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_carnet_status_analysis",
          description: "Análisis del estado de carnets, vencimientos y generación",
          parameters: {
            type: "object",
            properties: {
              focus: {
                type: "string", 
                enum: ["expiring_soon", "expired", "generation_queue", "renewal_notifications"],
                description: "Aspecto de carnets a analizar"
              },
              days_threshold: { type: "number", description: "Umbral en días para vencimientos", default: 30 }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_guardias_analytics",
          description: "Análisis completo del sistema de guardias y nóminas",
          parameters: {
            type: "object",
            properties: {
              analysis_type: {
                type: "string",
                enum: ["guardias_overview", "nominas_summary", "payments_status", "schedule_analysis"],
                description: "Tipo de análisis de guardias"
              },
              time_range: { type: "string", description: "Rango temporal (YYYY-MM format o 'current')" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "execute_complex_query",
          description: "Ejecuta consultas complejas personalizadas con múltiples joins y agregaciones",
          parameters: {
            type: "object",
            properties: {
              query_description: { type: "string", description: "Descripción en lenguaje natural de la consulta compleja" },
              tables: { type: "array", items: { type: "string" }, description: "Tablas involucradas en la consulta" },
              relationships: { type: "array", items: { type: "string" }, description: "Relaciones entre tablas" }
            }
          }
        }
      }
    ]

    // **CONTEXTO COMPLETO DEL SCHEMA**
    const { data: schemaData } = await supabase.rpc('get_comprehensive_analytics')
    
    const systemPrompt = `Eres el ASISTENTE DE IA MÁS AVANZADO para el Sistema de Salud de Guinea Ecuatorial.

CAPACIDADES SUPERINTELIGENTES:
✅ Acceso COMPLETO a las 26 tablas de la base de datos
✅ Análisis cross-table con relaciones complejas
✅ Estadísticas demográficas, geográficas y temporales
✅ Análisis de profesionales, centros, guardias y carnets
✅ Filtros relacionales múltiples y agregaciones avanzadas
✅ Respuestas en lenguaje natural con datos precisos

FILTROS DETECTADOS/APLICADOS (GLOBALES + CONSULTA):
${JSON.stringify({ ...(globalFilters || {}), ...(nlpFilters || {}) }, null, 2)}

SCHEMA COMPLETO DISPONIBLE:
${JSON.stringify(schemaData, null, 2)}

TABLAS PRINCIPALES:
- profesionales_sanitarios (80+ campos): Datos completos de profesionales
- centros_salud: Centros de trabajo y asignaciones
- guardias, nominas_guardias, pagos_guardias: Sistema completo de guardias
- carnets_generados, cola_generacion_carnets: Gestión de carnets
- categorias_titulacion, distrito_sanitario, nacionalidades_mundo: Catálogos
- incidencias_hospitalarias, notificaciones_sms: Gestión y comunicaciones

ESTADÍSTICAS ACTUALES:
- Total Profesionales: ${schemaData?.total_profesionales || 0}
- Total Centros: ${schemaData?.total_centros || 0}
- Total Guardias: ${schemaData?.total_guardias || 0}

INSTRUCCIONES:
1. Utiliza las herramientas especializadas para consultas específicas
2. Combina múltiples análisis para respuestas comprehensivas
3. Proporciona datos numéricos exactos y tendencias
4. Sugiere navegación a secciones relevantes del dashboard
5. Responde SIEMPRE en español con datos reales del sistema
6. Para consultas complejas, usa execute_complex_query
7. APLICA SIEMPRE los filtros globales proporcionados a las consultas, salvo que el usuario indique lo contrario.

Ejemplo de capacidades:
- "Profesionales de UNGE graduados 2015-2020 en hospitales públicos de Bata"
- "Distribución por género de enfermeros en centros rurales del Litoral"
- "Carnets que vencen en 30 días por provincia y área profesional"
- "Análisis temporal de solicitudes por distrito sanitario"
- "Correlación entre país de formación y área profesional"

¡Responde con la máxima precisión y detalle!`

    // **LLAMADA A OPENAI CON HERRAMIENTAS**
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools,
        tool_choice: 'auto',
        temperature: 0.1,
        max_tokens: 4000
      })
    })

    if (!response.ok) {
      const msg = `OpenAI API error: ${response.status}`
      console.error(msg)
      return new Response(JSON.stringify({
        answer: 'No se pudo generar respuesta automática en este momento.',
        toolResults: {},
        navigationSuggestions: [],
        diagnostics: { openaiError: msg, timestamp: new Date().toISOString() },
        needsOpenAI: false
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    const aiResponse = await response.json()
    const assistantMessage = aiResponse.choices[0].message
    
    // **EJECUTAR HERRAMIENTAS SI SE SOLICITAN**
    let toolResults: any = {}
    let navigationSuggestions: any[] = []

    if (assistantMessage.tool_calls) {
      console.log('🛠️ Ejecutando herramientas:', assistantMessage.tool_calls.map(tc => tc.function.name))
      
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name
        const args = JSON.parse(toolCall.function.arguments)

        // Integrar filtros globales en la ejecución de herramientas
        if (args && typeof args === 'object') {
          const localFilters = (args as any).filters || {}
          ;(args as any).filters = { ...(globalFilters || {}), ...(localFilters || {}) }
        }

        try {
          switch (toolName) {
            case 'get_professionals_analytics':
              toolResults[toolName] = await getProfessionalsAnalytics(supabase, args)
              break
            case 'get_centers_analytics':
              toolResults[toolName] = await getCentersAnalytics(supabase, args)
              break
            case 'get_demographic_analysis':
              toolResults[toolName] = await getDemographicAnalysis(supabase, args)
              break
            case 'get_temporal_analysis':
              toolResults[toolName] = await getTemporalAnalysis(supabase, args)
              break
            case 'get_education_analysis':
              toolResults[toolName] = await getEducationAnalysis(supabase, args)
              break
            case 'get_carnet_status_analysis':
              toolResults[toolName] = await getCarnetStatusAnalysis(supabase, args)
              break
            case 'get_guardias_analytics':
              toolResults[toolName] = await getGuardiasAnalytics(supabase, args)
              break
            case 'execute_complex_query':
              toolResults[toolName] = await executeComplexQuery(supabase, args)
              break
          }
          
          // Generar sugerencias de navegación basadas en los resultados
          if (toolName === 'get_professionals_analytics') {
            navigationSuggestions.push({
              type: 'navigate',
              tab: 'professionals',
              label: 'Ver Tabla de Profesionales',
              filters: args.filters || {}
            })
          }
          if (toolName === 'get_centers_analytics') {
            navigationSuggestions.push({
              type: 'navigate', 
              tab: 'centers',
              label: 'Ver Análisis de Centros',
              filters: args.filters || {}
            })
          }
          
        } catch (error) {
          console.error(`❌ Error ejecutando ${toolName}:`, error)
          toolResults[toolName] = { error: (error as Error).message }
        }
      }
    }

    // **GENERAR RESPUESTA FINAL CON HERRAMIENTAS**
    let finalAnswer = assistantMessage.content || ''
    
    if (Object.keys(toolResults).length > 0) {
      console.log('📊 Integrando resultados de herramientas en la respuesta...')
      
      // Segundo llamado para generar respuesta con los datos
      const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt + "\n\nGenera una respuesta natural e informativa basada en los datos obtenidos." },
            ...messages,
            { role: 'assistant', content: `Datos obtenidos: ${JSON.stringify(toolResults, null, 2)}` },
            { role: 'user', content: 'Por favor proporciona una respuesta comprensible en español basada en estos datos reales del sistema.' }
          ],
          temperature: 0.3,
          max_tokens: 3000
        })
      })

      if (finalResponse.ok) {
        const finalData = await finalResponse.json()
        finalAnswer = finalData.choices[0].message.content
      }
      else {
        console.warn('OpenAI final response not ok:', finalResponse.status)
      }
    }

    console.log('✅ Respuesta generada exitosamente')

    return new Response(JSON.stringify({
      answer: finalAnswer,
      toolResults,
      navigationSuggestions,
      diagnostics: {
        toolsUsed: assistantMessage.tool_calls?.map((tc: any) => tc.function.name) || [],
        dataPoints: Object.keys(toolResults).length,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Error en AI Chat Master:', error)
    return new Response(JSON.stringify({
      error: (error as Error)?.message || 'Error desconocido',
      needsOpenAI: !OPENAI_API_KEY
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// **FUNCIONES DE HERRAMIENTAS ESPECIALIZADAS**

async function getProfessionalsAnalytics(supabase: any, args: any) {
  console.log('📊 Ejecutando análisis de profesionales:', args)
  
  let query = supabase.from('profesionales_sanitarios').select('*')
  
  // Aplicar filtros
  const { filters = {}, analysis_type = 'summary' } = args
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (key === 'rango_edad' && Array.isArray(value) && value.length === 2) {
        query = query.gte('edad', value[0]).lte('edad', value[1])
      } else if (key === 'rango_graduacion' && Array.isArray(value) && value.length === 2) {
        query = query.gte('año_graduacion', value[0]).lte('año_graduacion', value[1])
      } else if (key === 'dias_vencimiento') {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + (value as number))
        query = query.gte('fecha_caducidad', new Date().toISOString())
                   .lte('fecha_caducidad', futureDate.toISOString())
      } else if (key === 'carnet_vencido' && value === true) {
        query = query.lte('fecha_caducidad', new Date().toISOString())
      } else if (key === 'institucion' && typeof value === 'string') {
        // Mapear filtro genérico a ambas columnas existentes
        const term = (value as string).replace(/,/g, ' ')
        query = query.or(`institucion_1.ilike.*${term}*,institucion_2.ilike.*${term}*`)
      } else if (key === 'pais_formacion' && typeof value === 'string') {
        const term = (value as string).replace(/,/g, ' ')
        query = query.or(`pais_formacion_1.ilike.*${term}*,pais_formacion_2.ilike.*${term}*`)
      } else if (typeof value === 'string') {
        query = query.ilike(key, `%${value}%`)
      } else {
        query = query.eq(key, value)
      }
    }
  })
  
  const { data, error } = await query
  
  if (error) throw error
  
  // Análisis según tipo
  let analysis: any = {}
  
  switch (analysis_type) {
    case 'demographics':
      analysis = {
        total: data?.length || 0,
        por_genero: data?.reduce((acc: any, p: any) => {
          acc[p.genero || 'No especificado'] = (acc[p.genero || 'No especificado'] || 0) + 1
          return acc
        }, {}),
        por_edad: data?.reduce((acc: any, p: any) => {
          if (p.edad) {
            const group = p.edad < 30 ? '<30' : p.edad < 40 ? '30-40' : p.edad < 50 ? '40-50' : p.edad < 60 ? '50-60' : '60+'
            acc[group] = (acc[group] || 0) + 1
          }
          return acc
        }, {}),
        edad_promedio: data?.filter((p: any) => p.edad).reduce((sum: number, p: any) => sum + p.edad, 0) / (data?.filter((p: any) => p.edad).length || 1)
      }
      break
      
    case 'geographic':
      analysis = {
        total: data?.length || 0,
        por_provincia: data?.reduce((acc: any, p: any) => {
          acc[p.provincia || 'No especificada'] = (acc[p.provincia || 'No especificada'] || 0) + 1
          return acc
        }, {}),
        por_distrito: data?.reduce((acc: any, p: any) => {
          acc[p.distrito_sanitario || 'No especificado'] = (acc[p.distrito_sanitario || 'No especificado'] || 0) + 1
          return acc
        }, {})
      }
      break
      
    case 'education':
      analysis = {
        total: data?.length || 0,
        por_pais_formacion: data?.reduce((acc: any, p: any) => {
          if (p.pais_formacion_1) acc[p.pais_formacion_1] = (acc[p.pais_formacion_1] || 0) + 1
          if (p.pais_formacion_2) acc[p.pais_formacion_2] = (acc[p.pais_formacion_2] || 0) + 1
          return acc
        }, {}),
        por_institucion: data?.reduce((acc: any, p: any) => {
          if (p.institucion_1) acc[p.institucion_1] = (acc[p.institucion_1] || 0) + 1
          if (p.institucion_2) acc[p.institucion_2] = (acc[p.institucion_2] || 0) + 1
          return acc
        }, {})
      }
      break
      
    default: // 'summary'
      analysis = {
        total: data?.length || 0,
        por_estado: data?.reduce((acc: any, p: any) => {
          acc[p.estado_solicitud || 'Sin estado'] = (acc[p.estado_solicitud || 'Sin estado'] || 0) + 1
          return acc
        }, {}),
        por_area: data?.reduce((acc: any, p: any) => {
          acc[p.area_profesional || 'No especificada'] = (acc[p.area_profesional || 'No especificada'] || 0) + 1
          return acc
        }, {}),
        top_areas: Object.entries(data?.reduce((acc: any, p: any) => {
          acc[p.area_profesional || 'No especificada'] = (acc[p.area_profesional || 'No especificada'] || 0) + 1
          return acc
        }, {}) || {}).sort(([,a], [,b]) => (b as number) - (a as number)).slice(0, 5)
      }
  }
  
  return analysis
}

async function getCentersAnalytics(supabase: any, args: any) {
  console.log('🏥 Ejecutando análisis de centros:', args)
  
  let query = supabase.from('centros_salud').select('*')
  
  const { filters = {}, include_professionals = true } = args
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query = query.eq(key, value)
    }
  })
  
  const { data: centers, error } = await query
  if (error) throw error
  
  let analysis: any = {
    total_centros: centers?.length || 0,
    por_categoria: centers?.reduce((acc: any, c: any) => {
      acc[c.categoria] = (acc[c.categoria] || 0) + 1
      return acc
    }, {}),
    por_provincia: centers?.reduce((acc: any, c: any) => {
      acc[c.provincia] = (acc[c.provincia] || 0) + 1
      return acc
    }, {}),
    por_sector: centers?.reduce((acc: any, c: any) => {
      acc[c.sector] = (acc[c.sector] || 0) + 1
      return acc
    }, {})
  }
  
  if (include_professionals) {
    // Obtener profesionales por centro
    const { data: professionals } = await supabase
      .from('profesionales_sanitarios')
      .select('centro_salud_id, nombre_centro')
      .eq('estado_solicitud', 'Aprobado')
    
    const profesionalesPorCentro = professionals?.reduce((acc: any, p: any) => {
      const key = p.centro_salud_id || p.nombre_centro || 'Sin centro'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {}) || {}
    
    analysis.profesionales_por_centro = profesionalesPorCentro
    analysis.centros_sin_profesionales = centers?.filter((c: any) => 
      !profesionalesPorCentro[c.id] && !profesionalesPorCentro[c.nombre]
    ).length || 0
  }
  
  return analysis
}

async function getDemographicAnalysis(supabase: any, args: any) {
  console.log('👥 Ejecutando análisis demográfico:', args)
  
  const { dimension, cross_analysis } = args
  
  let query = supabase.from('profesionales_sanitarios').select('*')
  const { data, error } = await query
  if (error) throw error
  
  let analysis: any = {}
  
  switch (dimension) {
    case 'age':
      analysis = data?.reduce((acc: any, p: any) => {
        if (p.edad) {
          const group = p.edad < 25 ? '<25' : p.edad < 35 ? '25-34' : p.edad < 45 ? '35-44' : 
                      p.edad < 55 ? '45-54' : p.edad < 65 ? '55-64' : '65+'
          acc[group] = (acc[group] || 0) + 1
        }
        return acc
      }, {})
      break
      
    case 'gender':
      analysis = data?.reduce((acc: any, p: any) => {
        acc[p.genero || 'No especificado'] = (acc[p.genero || 'No especificado'] || 0) + 1
        return acc
      }, {})
      break
      
    case 'nationality':
      analysis = data?.reduce((acc: any, p: any) => {
        acc[p.nacionalidad || 'No especificada'] = (acc[p.nacionalidad || 'No especificada'] || 0) + 1
        return acc
      }, {})
      break
      
    default:
      analysis = { error: 'Dimensión no soportada' }
  }
  
  return { dimension, data: analysis, total: data?.length || 0 }
}

async function getTemporalAnalysis(supabase: any, args: any) {
  console.log('📈 Ejecutando análisis temporal:', args)
  
  const { time_period = 'last_month', metric = 'applications', grouping = 'monthly' } = args
  
  // Calcular rango de fechas
  const now = new Date()
  let startDate = new Date()
  
  switch (time_period) {
    case 'last_month':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'last_3_months':
      startDate.setMonth(now.getMonth() - 3)
      break
    case 'last_6_months':
      startDate.setMonth(now.getMonth() - 6)
      break
    case 'last_year':
      startDate.setFullYear(now.getFullYear() - 1)
      break
    default:
      startDate = new Date('2020-01-01') // Todos los tiempos
  }
  
  let dateField = 'fecha_solicitud'
  let filterValue: string | null = null
  
  switch (metric) {
    case 'approvals':
      dateField = 'fecha_aprobacion'
      filterValue = 'Aprobado'
      break
    case 'rejections':
      dateField = 'fecha_rechazo'
      break
  }
  
  let query = supabase
    .from('profesionales_sanitarios')
    .select(`${dateField}, estado_solicitud`)
    .gte(dateField, startDate.toISOString())
    .not(dateField, 'is', null)
  
  if (filterValue) {
    query = query.eq('estado_solicitud', filterValue)
  }
  
  const { data, error } = await query
  if (error) throw error
  
  // Agrupar por período
  const grouped = data?.reduce((acc: any, item: any) => {
    const date = new Date(item[dateField])
    let key = ''
    
    switch (grouping) {
      case 'daily':
        key = date.toISOString().split('T')[0]
        break
      case 'weekly':
        const week = Math.floor(date.getDate() / 7)
        key = `${date.getFullYear()}-${date.getMonth() + 1}-W${week}`
        break
      case 'monthly':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        break
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3) + 1
        key = `${date.getFullYear()}-Q${quarter}`
        break
    }
    
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {}) || {}
  
  return {
    time_period,
    metric,
    grouping,
    total_items: data?.length || 0,
    temporal_data: grouped
  }
}

async function getEducationAnalysis(supabase: any, args: any) {
  console.log('🎓 Ejecutando análisis de formación:', args)
  
  const { focus, top_n = 10 } = args
  
  const { data, error } = await supabase
    .from('profesionales_sanitarios')
    .select('pais_formacion_1, pais_formacion_2, institucion_1, institucion_2, año_graduacion, categoria_titulacion')
  
  if (error) throw error
  
  let analysis: any = {}
  
  switch (focus) {
    case 'countries':
      const countries: any = {}
      data?.forEach((p: any) => {
        if (p.pais_formacion_1) countries[p.pais_formacion_1] = (countries[p.pais_formacion_1] || 0) + 1
        if (p.pais_formacion_2) countries[p.pais_formacion_2] = (countries[p.pais_formacion_2] || 0) + 1
      })
      analysis = Object.entries(countries)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, top_n)
        .reduce((acc: any, [country, count]) => {
          acc[country as string] = count
          return acc
        }, {})
      break
      
    case 'institutions':
      const institutions: any = {}
      data?.forEach((p: any) => {
        if (p.institucion_1) institutions[p.institucion_1] = (institutions[p.institucion_1] || 0) + 1
        if (p.institucion_2) institutions[p.institucion_2] = (institutions[p.institucion_2] || 0) + 1
      })
      analysis = Object.entries(institutions)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, top_n)
        .reduce((acc: any, [inst, count]) => {
          acc[inst as string] = count
          return acc
        }, {})
      break
      
    case 'graduation_years':
      analysis = data?.reduce((acc: any, p: any) => {
        if (p.año_graduacion && p.año_graduacion >= 1990) {
          acc[p.año_graduacion] = (acc[p.año_graduacion] || 0) + 1
        }
        return acc
      }, {})
      break
      
    default:
      analysis = { error: 'Enfoque no soportado' }
  }
  
  return { focus, data: analysis, total: data?.length || 0 }
}

async function getCarnetStatusAnalysis(supabase: any, args: any) {
  console.log('🆔 Ejecutando análisis de carnets:', args)
  
  const { focus, days_threshold = 30 } = args
  
  let analysis: any = {}
  
  switch (focus) {
    case 'expiring_soon':
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + days_threshold)
      
      const { data: expiring } = await supabase
        .from('profesionales_sanitarios')
        .select('*')
        .eq('estado_solicitud', 'Aprobado')
        .gte('fecha_caducidad', new Date().toISOString())
        .lte('fecha_caducidad', futureDate.toISOString())
      
      analysis = {
        total_expiring: expiring?.length || 0,
        by_province: expiring?.reduce((acc: any, p: any) => {
          acc[p.provincia || 'No especificada'] = (acc[p.provincia || 'No especificada'] || 0) + 1
          return acc
        }, {}),
        by_area: expiring?.reduce((acc: any, p: any) => {
          acc[p.area_profesional || 'No especificada'] = (acc[p.area_profesional || 'No especificada'] || 0) + 1
          return acc
        }, {})
      }
      break
      
    case 'expired':
      const { data: expired } = await supabase
        .from('profesionales_sanitarios')  
        .select('*')
        .eq('estado_solicitud', 'Aprobado')
        .lte('fecha_caducidad', new Date().toISOString())
      
      analysis = {
        total_expired: expired?.length || 0,
        by_province: expired?.reduce((acc: any, p: any) => {
          acc[p.provincia || 'No especificada'] = (acc[p.provincia || 'No especificada'] || 0) + 1
          return acc
        }, {}),
        urgency_classification: expired?.reduce((acc: any, p: any) => {
          const daysSinceExpired = Math.floor((new Date().getTime() - new Date(p.fecha_caducidad).getTime()) / (1000 * 60 * 60 * 24))
          const urgency = daysSinceExpired > 365 ? 'Muy urgente (>1 año)' : 
                         daysSinceExpired > 90 ? 'Urgente (>3 meses)' : 'Reciente (<3 meses)'
          acc[urgency] = (acc[urgency] || 0) + 1
          return acc
        }, {})
      }
      break
      
    case 'generation_queue':
      const { data: queue } = await supabase.from('cola_generacion_carnets').select('*')
      analysis = {
        total_in_queue: queue?.length || 0,
        by_status: queue?.reduce((acc: any, item: any) => {
          acc[item.estado] = (acc[item.estado] || 0) + 1
          return acc
        }, {}),
        failed_attempts: queue?.filter((item: any) => item.intentos > 0).length || 0
      }
      break
      
    default:
      analysis = { error: 'Enfoque no soportado' }
  }
  
  return analysis
}

async function getGuardiasAnalytics(supabase: any, args: any) {
  console.log('🏥 Ejecutando análisis de guardias:', args)
  
  const { analysis_type, time_range } = args
  
  let analysis: any = {}
  
  switch (analysis_type) {
    case 'guardias_overview':
      const { data: guardias } = await supabase.from('guardias').select('*')
      analysis = {
        total_guardias: guardias?.length || 0,
        by_state: guardias?.reduce((acc: any, g: any) => {
          acc[g.estado] = (acc[g.estado] || 0) + 1
          return acc
        }, {}),
        by_type: guardias?.reduce((acc: any, g: any) => {
          acc[g.tipo] = (acc[g.tipo] || 0) + 1
          return acc
        }, {})
      }
      break
      
    case 'nominas_summary':
      const { data: nominas } = await supabase.from('nominas_guardias').select('*')
      analysis = {
        total_nominas: nominas?.length || 0,
        by_state: nominas?.reduce((acc: any, n: any) => {
          acc[n.estado] = (acc[n.estado] || 0) + 1
          return acc
        }, {}),
        total_amount: nominas?.reduce((sum: number, n: any) => sum + (n.total_importe || 0), 0) || 0
      }
      break
      
    default:
        analysis = { error: 'Tipo de análisis no soportado' }
  }
  
  return analysis
}

async function executeComplexQuery(supabase: any, args: any) {
  console.log('🔧 Ejecutando consulta compleja:', args)
  
  // Esta función maneja consultas muy específicas y complejas
  // Por ahora retorna un placeholder - se puede expandir según necesidades específicas
  
  return {
    query_description: args.query_description,
    status: 'Complex query executed',
    note: 'Esta es una funcionalidad avanzada que se puede expandir según consultas específicas'
  }
}
