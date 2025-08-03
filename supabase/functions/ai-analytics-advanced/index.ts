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

        default:
          result = { error: 'Consulta no reconocida' }
      }

      return result
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
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 