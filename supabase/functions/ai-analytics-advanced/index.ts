import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { query, filters, message } = await req.json()

    // Utilidad para aplicar filtros sobre profesionales_sanitarios
    const applyProfessionalFilters = (builder: any, filters: Record<string, any>) => {
      let qb = builder

      if (!filters) return qb

      // Filtros directos por igualdad
      const eqFields = [
        'area_profesional',
        'estado_solicitud',
        'provincia',
        'genero',
        'tipo_sector',
        'distrito_sanitario',
      ] as const

      for (const field of eqFields) {
        const value = (filters as any)[field]
        if (value !== undefined && value !== null && value !== '') {
          qb = qb.eq(field, value)
        }
      }

      // Recolectar cláusulas OR para aplicarlas en un solo grupo
      const orClauses: string[] = []

      // Institución (coincidencia en institucion_1 o institucion_2)
      if (filters.institucion) {
        const inst = String(filters.institucion).trim()
        const pattern = `%${inst}%`
        orClauses.push(`institucion_1.ilike.${pattern}`, `institucion_2.ilike.${pattern}`)
      }

      // País de formación (en cualquiera de los dos campos)
      if (filters.pais_formacion) {
        const pais = String(filters.pais_formacion).trim()
        const pattern = `%${pais}%`
        orClauses.push(`pais_formacion_1.ilike.${pattern}`, `pais_formacion_2.ilike.${pattern}`)
      }

      if (orClauses.length > 0) {
        qb = qb.or(orClauses.join(','))
      }

      // Año de graduación exacto o rango
      if (filters.ano_graduacion) {
        qb = qb.eq('año_graduacion', filters.ano_graduacion)
      }
      if (filters.rango_ano_graduacion && Array.isArray(filters.rango_ano_graduacion) && filters.rango_ano_graduacion.length === 2) {
        const [from, to] = filters.rango_ano_graduacion
        if (from) qb = qb.gte('año_graduacion', from)
        if (to) qb = qb.lte('año_graduacion', to)
      }

      // Vencimiento de carnet en próximos N días
      if (typeof filters.expira_en_dias === 'number' && filters.expira_en_dias > 0) {
        const now = new Date()
        const limit = new Date()
        limit.setDate(now.getDate() + filters.expira_en_dias)
        qb = qb
          .eq('estado_solicitud', 'Aprobado')
          .gte('fecha_caducidad', now.toISOString())
          .lte('fecha_caducidad', limit.toISOString())
      }

      // Carnet ya vencido
      if (filters.carnet_vencido === true) {
        const now = new Date().toISOString()
        qb = qb
          .eq('estado_solicitud', 'Aprobado')
          .lte('fecha_caducidad', now)
      }

      // Próximo vencimiento booleano (30 días por defecto)
      if (filters.vencimiento_proximo === true && !filters.expira_en_dias) {
        const now = new Date()
        const limit = new Date()
        limit.setDate(now.getDate() + 30)
        qb = qb
          .eq('estado_solicitud', 'Aprobado')
          .gte('fecha_caducidad', now.toISOString())
          .lte('fecha_caducidad', limit.toISOString())
      }

      return qb
    }

    // Utilidad: invocar OpenAI para extraer intención y filtros
    const parseWithLLM = async (text: string) => {
      if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY no configurada')

      const schema = {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['count_professionals'] },
          filters: {
            type: 'object',
            properties: {
              expira_en_dias: { type: 'number' },
              carnet_vencido: { type: 'boolean' },
              vencimiento_proximo: { type: 'boolean' },
              area_profesional: { type: 'string' },
              estado_solicitud: { type: 'string' },
              provincia: { type: 'string' },
              genero: { type: 'string' },
              tipo_sector: { type: 'string' },
              distrito_sanitario: { type: 'string' },
              institucion: { type: 'string' },
              pais_formacion: { type: 'string' },
              ano_graduacion: { type: 'number' },
              rango_ano_graduacion: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 }
            }
          }
        },
        required: ['action']
      }

      const system = `Eres un parser estricto. Devuelve solo JSON válido (sin texto extra) que cumpla este esquema. Interpreta consultas en español sobre profesionales sanitarios.`
      const user = `Texto: ${text}\n\nDevuelve un JSON con { action: 'count_professionals', filters?: {...} }.
- expira_en_dias: número si piden vencen en N días
- carnet_vencido: true si piden ya vencidos
- distrito_sanitario, provincia, genero, area_profesional según aparezcan
- institucion: ej. 'UNGE' si mencionan UNGE
- pais_formacion si mencionan país de formación
- ano_graduacion o rango_ano_graduacion si se pide año o rango`

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          response_format: { type: 'json_schema', json_schema: { name: 'query_schema', schema, strict: true } }
        })
      })

      if (!resp.ok) throw new Error(`OpenAI status ${resp.status}`)
      const data = await resp.json()
      const content = data.choices?.[0]?.message?.content
      const parsed = JSON.parse(content)
      return parsed
    }

    // Función para obtener estadísticas avanzadas
    const getAdvancedStats = async (query: string, filters: any = {}) => {
      let result: any = {}

      switch (query) {
        case 'demographics':
          // Estadísticas demográficas
          const demographics = await supabaseClient
            .from('profesionales_sanitarios')
            .select('genero, edad, nacionalidad, provincia, distrito')
            .not('genero', 'is', null)

          const genderStats = demographics.data?.reduce((acc: any, prof: any) => {
            acc[prof.genero] = (acc[prof.genero] || 0) + 1
            return acc
          }, {})

          const ageStats = demographics.data?.reduce((acc: any, prof: any) => {
            if (prof.edad) {
              const ageGroup = prof.edad < 30 ? '20-29' : 
                             prof.edad < 40 ? '30-39' : 
                             prof.edad < 50 ? '40-49' : 
                             prof.edad < 60 ? '50-59' : '60+'
              acc[ageGroup] = (acc[ageGroup] || 0) + 1
            }
            return acc
          }, {})

          result = {
            total_profesionales: demographics.data?.length || 0,
            genero: genderStats,
            grupos_edad: ageStats,
            nacionalidades: demographics.data?.reduce((acc: any, prof: any) => {
              if (prof.nacionalidad) {
                acc[prof.nacionalidad] = (acc[prof.nacionalidad] || 0) + 1
              }
              return acc
            }, {}),
            provincias: demographics.data?.reduce((acc: any, prof: any) => {
              if (prof.provincia) {
                acc[prof.provincia] = (acc[prof.provincia] || 0) + 1
              }
              return acc
            }, {})
          }
          break

        case 'professional_areas':
          // Áreas profesionales
          const areas = await supabaseClient
            .from('profesionales_sanitarios')
            .select('area_profesional, especialidad, categoria_titulacion')
            .not('area_profesional', 'is', null)

          result = {
            areas_profesionales: areas.data?.reduce((acc: any, prof: any) => {
              acc[prof.area_profesional] = (acc[prof.area_profesional] || 0) + 1
              return acc
            }, {}),
            especialidades: areas.data?.reduce((acc: any, prof: any) => {
              if (prof.especialidad) {
                acc[prof.especialidad] = (acc[prof.especialidad] || 0) + 1
              }
              return acc
            }, {}),
            categorias_titulacion: areas.data?.reduce((acc: any, prof: any) => {
              if (prof.categoria_titulacion) {
                acc[prof.categoria_titulacion] = (acc[prof.categoria_titulacion] || 0) + 1
              }
              return acc
            }, {})
          }
          break

        case 'education':
          // Formación y educación
          const education = await supabaseClient
            .from('profesionales_sanitarios')
            .select('pais_formacion_1, pais_formacion_2, año_graduacion, institucion_1, institucion_2, tipo_formacion_1, tipo_formacion_2')
            .not('pais_formacion_1', 'is', null)

          result = {
            paises_formacion: education.data?.reduce((acc: any, prof: any) => {
              if (prof.pais_formacion_1) {
                acc[prof.pais_formacion_1] = (acc[prof.pais_formacion_1] || 0) + 1
              }
              if (prof.pais_formacion_2) {
                acc[prof.pais_formacion_2] = (acc[prof.pais_formacion_2] || 0) + 1
              }
              return acc
            }, {}),
            años_graduacion: education.data?.reduce((acc: any, prof: any) => {
              if (prof.año_graduacion) {
                const yearGroup = prof.año_graduacion < 2000 ? 'Antes de 2000' :
                                prof.año_graduacion < 2010 ? '2000-2009' :
                                prof.año_graduacion < 2020 ? '2010-2019' : '2020+'
                acc[yearGroup] = (acc[yearGroup] || 0) + 1
              }
              return acc
            }, {}),
            instituciones: education.data?.reduce((acc: any, prof: any) => {
              if (prof.institucion_1) {
                acc[prof.institucion_1] = (acc[prof.institucion_1] || 0) + 1
              }
              if (prof.institucion_2) {
                acc[prof.institucion_2] = (acc[prof.institucion_2] || 0) + 1
              }
              return acc
            }, {}),
            tipos_formacion: education.data?.reduce((acc: any, prof: any) => {
              if (prof.tipo_formacion_1) {
                acc[prof.tipo_formacion_1] = (acc[prof.tipo_formacion_1] || 0) + 1
              }
              if (prof.tipo_formacion_2) {
                acc[prof.tipo_formacion_2] = (acc[prof.tipo_formacion_2] || 0) + 1
              }
              return acc
            }, {})
          }
          break

        case 'work_centers':
          // Centros de trabajo
          const workCenters = await supabaseClient
            .from('profesionales_sanitarios')
            .select('nombre_centro, categoria_centro, tipo_sector, distrito_sanitario, situacion_laboral, estado_trabajo')

          result = {
            centros_trabajo: workCenters.data?.reduce((acc: any, prof: any) => {
              if (prof.nombre_centro) {
                acc[prof.nombre_centro] = (acc[prof.nombre_centro] || 0) + 1
              }
              return acc
            }, {}),
            categorias_centro: workCenters.data?.reduce((acc: any, prof: any) => {
              if (prof.categoria_centro) {
                acc[prof.categoria_centro] = (acc[prof.categoria_centro] || 0) + 1
              }
              return acc
            }, {}),
            tipos_sector: workCenters.data?.reduce((acc: any, prof: any) => {
              if (prof.tipo_sector) {
                acc[prof.tipo_sector] = (acc[prof.tipo_sector] || 0) + 1
              }
              return acc
            }, {}),
            distritos_sanitarios: workCenters.data?.reduce((acc: any, prof: any) => {
              if (prof.distrito_sanitario) {
                acc[prof.distrito_sanitario] = (acc[prof.distrito_sanitario] || 0) + 1
              }
              return acc
            }, {}),
            situaciones_laborales: workCenters.data?.reduce((acc: any, prof: any) => {
              if (prof.situacion_laboral) {
                acc[prof.situacion_laboral] = (acc[prof.situacion_laboral] || 0) + 1
              }
              return acc
            }, {})
          }
          break

        case 'application_status':
          // Estados de solicitud
          const status = await supabaseClient
            .from('profesionales_sanitarios')
            .select('estado_solicitud, fecha_solicitud, fecha_aprobacion, fecha_rechazo, motivo_rechazo, urgencia_solicitud')

          result = {
            estados_solicitud: status.data?.reduce((acc: any, prof: any) => {
              if (prof.estado_solicitud) {
                acc[prof.estado_solicitud] = (acc[prof.estado_solicitud] || 0) + 1
              }
              return acc
            }, {}),
            urgencias: status.data?.reduce((acc: any, prof: any) => {
              if (prof.urgencia_solicitud) {
                acc[prof.urgencia_solicitud] = (acc[prof.urgencia_solicitud] || 0) + 1
              }
              return acc
            }, {}),
            solicitudes_por_mes: status.data?.reduce((acc: any, prof: any) => {
              if (prof.fecha_solicitud) {
                const month = new Date(prof.fecha_solicitud).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                acc[month] = (acc[month] || 0) + 1
              }
              return acc
            }, {}),
            motivos_rechazo: status.data?.reduce((acc: any, prof: any) => {
              if (prof.motivo_rechazo) {
                acc[prof.motivo_rechazo] = (acc[prof.motivo_rechazo] || 0) + 1
              }
              return acc
            }, {})
          }
          break

        case 'carnet_generation':
          // Generación de carnets
          const carnets = await supabaseClient
            .from('carnets_generados')
            .select('*')

          const colaCarnets = await supabaseClient
            .from('cola_generacion_carnets')
            .select('*')

          result = {
            carnets_generados: carnets.data?.length || 0,
            en_cola_generacion: colaCarnets.data?.filter(c => c.estado === 'pendiente').length || 0,
            estados_cola: colaCarnets.data?.reduce((acc: any, item: any) => {
              acc[item.estado] = (acc[item.estado] || 0) + 1
              return acc
            }, {}),
            carnets_por_fecha: carnets.data?.reduce((acc: any, carnet: any) => {
              if (carnet.fecha_generacion) {
                const date = new Date(carnet.fecha_generacion).toLocaleDateString('es-ES')
                acc[date] = (acc[date] || 0) + 1
              }
              return acc
            }, {})
          }
          break

        case 'centers_analysis':
          // Análisis de centros de salud
          const centers = await supabaseClient
            .from('centros_salud')
            .select('*')

          const professionalsByCenter = await supabaseClient
            .from('profesionales_sanitarios')
            .select('centro_salud_id, area_profesional')

          result = {
            total_centros: centers.data?.length || 0,
            centros_por_categoria: centers.data?.reduce((acc: any, center: any) => {
              acc[center.categoria] = (acc[center.categoria] || 0) + 1
              return acc
            }, {}),
            centros_por_provincia: centers.data?.reduce((acc: any, center: any) => {
              acc[center.provincia] = (acc[center.provincia] || 0) + 1
              return acc
            }, {}),
            centros_por_distrito: centers.data?.reduce((acc: any, center: any) => {
              if (center.distrito_sanitario) {
                acc[center.distrito_sanitario] = (acc[center.distrito_sanitario] || 0) + 1
              }
              return acc
            }, {}),
            profesionales_por_centro: professionalsByCenter.data?.reduce((acc: any, prof: any) => {
              if (prof.centro_salud_id) {
                acc[prof.centro_salud_id] = (acc[prof.centro_salud_id] || 0) + 1
              }
              return acc
            }, {})
          }
          break

        case 'temporal_analysis':
          // Análisis temporal
          const temporal = await supabaseClient
            .from('profesionales_sanitarios')
            .select('created_at, fecha_solicitud, fecha_aprobacion, fecha_nacimiento, año_graduacion')

          result = {
            registros_por_mes: temporal.data?.reduce((acc: any, prof: any) => {
              if (prof.created_at) {
                const month = new Date(prof.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                acc[month] = (acc[month] || 0) + 1
              }
              return acc
            }, {}),
            aprobaciones_por_mes: temporal.data?.reduce((acc: any, prof: any) => {
              if (prof.fecha_aprobacion) {
                const month = new Date(prof.fecha_aprobacion).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                acc[month] = (acc[month] || 0) + 1
              }
              return acc
            }, {}),
            generaciones_graduacion: temporal.data?.reduce((acc: any, prof: any) => {
              if (prof.año_graduacion) {
                acc[prof.año_graduacion] = (acc[prof.año_graduacion] || 0) + 1
              }
              return acc
            }, {})
          }
          break

        case 'comprehensive':
          // Análisis comprehensivo - todas las estadísticas
          const allStats = await Promise.all([
            getAdvancedStats('demographics'),
            getAdvancedStats('professional_areas'),
            getAdvancedStats('education'),
            getAdvancedStats('work_centers'),
            getAdvancedStats('application_status'),
            getAdvancedStats('carnet_generation'),
            getAdvancedStats('centers_analysis'),
            getAdvancedStats('temporal_analysis')
          ])

          result = {
            demograficas: allStats[0],
            areas_profesionales: allStats[1],
            educacion: allStats[2],
            centros_trabajo: allStats[3],
            estados_solicitud: allStats[4],
            generacion_carnets: allStats[5],
            analisis_centros: allStats[6],
            analisis_temporal: allStats[7]
          }
          break

        case 'query_professionals':
          // Conteo dinámico según filtros aplicados sobre profesionales_sanitarios
          {
            let qb = supabaseClient
              .from('profesionales_sanitarios')
              .select('id', { count: 'exact', head: true })

            qb = applyProfessionalFilters(qb, filters || {})

            const { count, error } = await qb
            if (error) {
              result = { error: error.message }
            } else {
              result = {
                total: count || 0,
                filtros_aplicados: filters || {}
              }
            }
          }
          break

        default:
          result = { error: 'Consulta no reconocida' }
      }

      return result
    }

    // Ruta NL-first: si llega message, usar LLM para extraer filtros y contar
    if (message && typeof message === 'string' && message.trim().length > 0) {
      try {
        const intent = await parseWithLLM(message)
        if (intent?.action === 'count_professionals') {
          let qb = supabaseClient
            .from('profesionales_sanitarios')
            .select('id', { count: 'exact', head: true })

          const combinedFilters = { ...(filters || {}), ...(intent.filters || {}) }
          qb = applyProfessionalFilters(qb, combinedFilters)
          const { count, error } = await qb
          if (error) throw error

          return new Response(
            JSON.stringify({ success: true, data: { total: count || 0, filtros_aplicados: combinedFilters }, text: `Total encontrados: ${count || 0}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
      } catch (e) {
        // Continuar al flujo clásico
        console.error('NL parsing fallback:', e)
      }
    }

    const stats = await getAdvancedStats(query, filters)

    return new Response(
      JSON.stringify({ success: true, data: stats }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
