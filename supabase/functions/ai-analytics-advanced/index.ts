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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { query, filters } = await req.json()

    // Función para obtener estadísticas avanzadas y completas
    const getAdvancedStats = async (query: string, filters: any = {}) => {
      let result: any = {}

      switch (query) {
        case 'demographics':
          // Estadísticas demográficas completas
          const demographics = await supabaseClient
            .from('profesionales_sanitarios')
            .select('genero, edad, nacionalidad, provincia, distrito, fecha_nacimiento, estado_solicitud')
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
            }, {}),
            distritos: demographics.data?.reduce((acc: any, prof: any) => {
              if (prof.distrito) {
                acc[prof.distrito] = (acc[prof.distrito] || 0) + 1
              }
              return acc
            }, {}),
            estados_solicitud: demographics.data?.reduce((acc: any, prof: any) => {
              if (prof.estado_solicitud) {
                acc[prof.estado_solicitud] = (acc[prof.estado_solicitud] || 0) + 1
              }
              return acc
            }, {})
          }
          break

        case 'professional_areas':
          // Áreas profesionales expandidas
          const areas = await supabaseClient
            .from('profesionales_sanitarios')
            .select('area_profesional, especialidad, categoria_titulacion, situacion_laboral, estado_solicitud')
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
            }, {}),
            situaciones_laborales: areas.data?.reduce((acc: any, prof: any) => {
              if (prof.situacion_laboral) {
                acc[prof.situacion_laboral] = (acc[prof.situacion_laboral] || 0) + 1
              }
              return acc
            }, {}),
            areas_por_estado: areas.data?.reduce((acc: any, prof: any) => {
              const key = `${prof.area_profesional}_${prof.estado_solicitud}`
              acc[key] = (acc[key] || 0) + 1
              return acc
            }, {})
          }
          break

        case 'education':
          // Formación y educación mejorada
          const education = await supabaseClient
            .from('profesionales_sanitarios')
            .select(`
              pais_formacion_1, 
              periodo_formacion,
              institucion_1, 
              titulacion_especifica_1,
              categoria_titulacion,
              area_profesional,
              especialidad
            `)
            .not('pais_formacion_1', 'is', null)

          // Análisis de período de formación para extraer años
          const yearAnalysis = education.data?.map(prof => {
            if (prof.periodo_formacion) {
              const match = prof.periodo_formacion.match(/(\d{4})-(\d{4})|(\d{4})/)
              if (match) {
                return {
                  ...prof,
                  año_inicio: match[1] || match[3],
                  año_fin: match[2] || match[3]
                }
              }
            }
            return prof
          })

          result = {
            paises_formacion: education.data?.reduce((acc: any, prof: any) => {
              if (prof.pais_formacion_1) {
                acc[prof.pais_formacion_1] = (acc[prof.pais_formacion_1] || 0) + 1
              }
              return acc
            }, {}),
            instituciones_principales: education.data?.reduce((acc: any, prof: any) => {
              if (prof.institucion_1) {
                acc[prof.institucion_1] = (acc[prof.institucion_1] || 0) + 1
              }
              return acc
            }, {}),
            titulaciones_especificas: education.data?.reduce((acc: any, prof: any) => {
              if (prof.titulacion_especifica_1) {
                acc[prof.titulacion_especifica_1] = (acc[prof.titulacion_especifica_1] || 0) + 1
              }
              return acc
            }, {}),
            formacion_por_area: education.data?.reduce((acc: any, prof: any) => {
              const key = `${prof.area_profesional}_${prof.pais_formacion_1}`
              if (prof.area_profesional && prof.pais_formacion_1) {
                acc[key] = (acc[key] || 0) + 1
              }
              return acc
            }, {}),
            años_graduacion_estimados: yearAnalysis?.reduce((acc: any, prof: any) => {
              if (prof.año_fin) {
                const decade = Math.floor(parseInt(prof.año_fin) / 10) * 10
                const decadeLabel = `${decade}-${decade + 9}`
                acc[decadeLabel] = (acc[decadeLabel] || 0) + 1
              }
              return acc
            }, {})
          }
          break

        case 'work_centers':
          // Centros de trabajo expandido
          const workCenters = await supabaseClient
            .from('profesionales_sanitarios')
            .select('nombre_centro, categoria_centro, tipo_sector, distrito_sanitario, situacion_laboral, provincia, distrito')

          const centersData = await supabaseClient
            .from('centros_salud')
            .select('*')

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
            distribucion_geografica: workCenters.data?.reduce((acc: any, prof: any) => {
              const key = `${prof.provincia}_${prof.distrito}`
              if (prof.provincia && prof.distrito) {
                acc[key] = (acc[key] || 0) + 1
              }
              return acc
            }, {}),
            centros_registrados: centersData.data?.length || 0,
            centros_por_categoria: centersData.data?.reduce((acc: any, center: any) => {
              if (center.categoria) {
                acc[center.categoria] = (acc[center.categoria] || 0) + 1
              }
              return acc
            }, {}),
            centros_por_estado: centersData.data?.reduce((acc: any, center: any) => {
              if (center.estado) {
                acc[center.estado] = (acc[center.estado] || 0) + 1
              }
              return acc
            }, {})
          }
          break

        case 'application_status':
          // Estados de solicitud mejorado
          const status = await supabaseClient
            .from('profesionales_sanitarios')
            .select(`
              estado_solicitud, 
              fecha_solicitud, 
              fecha_aprobacion, 
              fecha_rechazo, 
              motivo_rechazo, 
              urgencia_solicitud,
              area_profesional,
              provincia
            `)

          const currentYear = new Date().getFullYear()
          const currentMonth = new Date().getMonth()

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
                const date = new Date(prof.fecha_solicitud)
                const month = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                acc[month] = (acc[month] || 0) + 1
              }
              return acc
            }, {}),
            aprobaciones_por_mes: status.data?.reduce((acc: any, prof: any) => {
              if (prof.fecha_aprobacion) {
                const date = new Date(prof.fecha_aprobacion)
                const month = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                acc[month] = (acc[month] || 0) + 1
              }
              return acc
            }, {}),
            motivos_rechazo: status.data?.reduce((acc: any, prof: any) => {
              if (prof.motivo_rechazo) {
                acc[prof.motivo_rechazo] = (acc[prof.motivo_rechazo] || 0) + 1
              }
              return acc
            }, {}),
            pendientes_por_area: status.data?.filter(p => p.estado_solicitud === 'Pendiente')
              ?.reduce((acc: any, prof: any) => {
                if (prof.area_profesional) {
                  acc[prof.area_profesional] = (acc[prof.area_profesional] || 0) + 1
                }
                return acc
              }, {}),
            solicitudes_este_año: status.data?.filter(p => {
              if (p.fecha_solicitud) {
                const year = new Date(p.fecha_solicitud).getFullYear()
                return year === currentYear
              }
              return false
            }).length || 0
          }
          break

        case 'carnet_generation':
          // Generación de carnets expandida
          const carnets = await supabaseClient
            .from('carnets_generados')
            .select('*')

          const colaCarnets = await supabaseClient
            .from('cola_generacion_carnets')
            .select('*')

          const profesionalesConCarnet = await supabaseClient
            .from('profesionales_sanitarios')
            .select('url_codigo_barras_expediente, fecha_validez_carnet, estado_solicitud')

          // Análisis de vencimientos
          const now = new Date()
          const threeMonthsFromNow = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000))

          const vencimientoAnalysis = profesionalesConCarnet.data?.reduce((acc: any, prof: any) => {
            if (prof.fecha_validez_carnet) {
              const vencimiento = new Date(prof.fecha_validez_carnet)
              if (vencimiento < now) {
                acc.vencidos++
              } else if (vencimiento < threeMonthsFromNow) {
                acc.proximos_vencer++
              } else {
                acc.vigentes++
              }
            } else {
              acc.sin_fecha++
            }
            return acc
          }, { vencidos: 0, proximos_vencer: 0, vigentes: 0, sin_fecha: 0 })

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
            }, {}),
            profesionales_con_carnet: profesionalesConCarnet.data?.filter(p => p.url_codigo_barras_expediente).length || 0,
            analisis_vencimientos: vencimientoAnalysis,
            tasa_generacion_exitosa: colaCarnets.data?.length > 0 ? 
              (colaCarnets.data.filter(c => c.estado === 'completado').length / colaCarnets.data.length * 100).toFixed(2) : 0
          }
          break

        case 'centers_analysis':
          // Análisis de centros de salud completo
          const centers = await supabaseClient
            .from('centros_salud')
            .select('*')

          const professionalsByCenter = await supabaseClient
            .from('profesionales_sanitarios')
            .select('centro_salud_id, area_profesional, nombre_centro, categoria_centro, distrito_sanitario')

          // Análisis de cobertura sanitaria
          const coverageAnalysis = {
            centros_con_profesionales: 0,
            centros_sin_profesionales: 0,
            promedio_profesionales_por_centro: 0
          }

          const centerProfessionalCount = professionalsByCenter.data?.reduce((acc: any, prof: any) => {
            if (prof.centro_salud_id) {
              acc[prof.centro_salud_id] = (acc[prof.centro_salud_id] || 0) + 1
            }
            return acc
          }, {})

          const centrosConProfesionales = Object.keys(centerProfessionalCount || {}).length
          const totalCentros = centers.data?.length || 0

          coverageAnalysis.centros_con_profesionales = centrosConProfesionales
          coverageAnalysis.centros_sin_profesionales = totalCentros - centrosConProfesionales
          coverageAnalysis.promedio_profesionales_por_centro = centrosConProfesionales > 0 ? 
            (Object.values(centerProfessionalCount || {}).reduce((a: any, b: any) => a + b, 0) / centrosConProfesionales).toFixed(2) : 0

          result = {
            total_centros: totalCentros,
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
            centros_por_estado: centers.data?.reduce((acc: any, center: any) => {
              if (center.estado) {
                acc[center.estado] = (acc[center.estado] || 0) + 1
              }
              return acc
            }, {}),
            profesionales_por_centro: centerProfessionalCount,
            cobertura_sanitaria: coverageAnalysis,
            distribucion_por_sector: centers.data?.reduce((acc: any, center: any) => {
              if (center.sector) {
                acc[center.sector] = (acc[center.sector] || 0) + 1
              }
              return acc
            }, {}),
            centros_pendientes_validacion: centers.data?.filter(c => c.estado === 'pendiente_validacion').length || 0
          }
          break

        case 'temporal_analysis':
          // Análisis temporal completo
          const temporal = await supabaseClient
            .from('profesionales_sanitarios')
            .select('created_at, fecha_solicitud, fecha_aprobacion, fecha_nacimiento, updated_at, estado_solicitud')

          const now = new Date()
          const currentYear = now.getFullYear()
          const currentMonth = now.getMonth()

          // Análisis de tendencias mensuales
          const monthlyTrends = temporal.data?.reduce((acc: any, prof: any) => {
            if (prof.created_at) {
              const date = new Date(prof.created_at)
              const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
              acc.registros[monthKey] = (acc.registros[monthKey] || 0) + 1
            }
            if (prof.fecha_aprobacion) {
              const date = new Date(prof.fecha_aprobacion)
              const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
              acc.aprobaciones[monthKey] = (acc.aprobaciones[monthKey] || 0) + 1
            }
            return acc
          }, { registros: {}, aprobaciones: {} })

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
            tendencias_mensuales: monthlyTrends,
            registros_este_año: temporal.data?.filter(p => {
              if (p.created_at) {
                return new Date(p.created_at).getFullYear() === currentYear
              }
              return false
            }).length || 0,
            registros_este_mes: temporal.data?.filter(p => {
              if (p.created_at) {
                const date = new Date(p.created_at)
                return date.getFullYear() === currentYear && date.getMonth() === currentMonth
              }
              return false
            }).length || 0,
            tiempo_promedio_aprobacion: (() => {
              const aprobados = temporal.data?.filter(p => p.fecha_aprobacion && p.fecha_solicitud)
              if (!aprobados || aprobados.length === 0) return 0
              
              const tiempos = aprobados.map(p => {
                const solicitud = new Date(p.fecha_solicitud)
                const aprobacion = new Date(p.fecha_aprobacion)
                return (aprobacion.getTime() - solicitud.getTime()) / (1000 * 60 * 60 * 24) // días
              })
              
              return (tiempos.reduce((a, b) => a + b, 0) / tiempos.length).toFixed(1)
            })()
          }
          break

        case 'user_management':
          // Análisis de gestión de usuarios
          const userProfiles = await supabaseClient
            .from('user_profiles')
            .select('*')

          result = {
            total_usuarios: userProfiles.data?.length || 0,
            usuarios_por_rol: userProfiles.data?.reduce((acc: any, user: any) => {
              if (user.role) {
                acc[user.role] = (acc[user.role] || 0) + 1
              }
              return acc
            }, {}),
            usuarios_activos: userProfiles.data?.filter(u => u.is_active).length || 0,
            usuarios_por_departamento: userProfiles.data?.reduce((acc: any, user: any) => {
              if (user.department) {
                acc[user.department] = (acc[user.department] || 0) + 1
              }
              return acc
            }, {}),
            usuarios_con_centro_asignado: userProfiles.data?.filter(u => u.assigned_center_id).length || 0
          }
          break

        case 'system_performance':
          // Análisis de rendimiento del sistema
          const tables = [
            'profesionales_sanitarios',
            'centros_salud', 
            'carnets_generados',
            'cola_generacion_carnets',
            'user_profiles'
          ]

          const tableCounts = await Promise.all(
            tables.map(async (table) => {
              const { count } = await supabaseClient
                .from(table)
                .select('*', { count: 'exact', head: true })
              return { table, count }
            })
          )

          result = {
            total_registros: tableCounts.reduce((acc, { count }) => acc + (count || 0), 0),
            registros_por_tabla: tableCounts.reduce((acc: any, { table, count }) => {
              acc[table] = count || 0
              return acc
            }, {}),
            timestamp: new Date().toISOString(),
            salud_sistema: 'operativo'
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
            getAdvancedStats('temporal_analysis'),
            getAdvancedStats('user_management'),
            getAdvancedStats('system_performance')
          ])

          result = {
            resumen_ejecutivo: {
              timestamp: new Date().toISOString(),
              version_sistema: '1.0',
              estado_general: 'operativo'
            },
            demograficas: allStats[0],
            areas_profesionales: allStats[1],
            educacion: allStats[2],
            centros_trabajo: allStats[3],
            estados_solicitud: allStats[4],
            generacion_carnets: allStats[5],
            analisis_centros: allStats[6],
            analisis_temporal: allStats[7],
            gestion_usuarios: allStats[8],
            rendimiento_sistema: allStats[9]
          }
          break

        default:
          result = { 
            error: 'Consulta no reconocida',
            consultas_disponibles: [
              'demographics',
              'professional_areas', 
              'education',
              'work_centers',
              'application_status',
              'carnet_generation',
              'centers_analysis',
              'temporal_analysis',
              'user_management',
              'system_performance',
              'comprehensive'
            ]
          }
      }

      return result
    }

    const stats = await getAdvancedStats(query, filters)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: stats,
        timestamp: new Date().toISOString(),
        query_executed: query 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in ai-analytics-advanced:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
