import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConflictDetectionRequest {
  guardia_id?: string;
  profesional_guardia_id?: string;
  fecha_inicio: string;
  fecha_fin: string;
  mes?: number;
  ano?: number;
  centro_id?: string;
}

interface Conflicto {
  tipo: 'solapamiento' | 'mismo_dia' | 'duracion_invalida' | 'rango_horario_invalido';
  descripcion: string;
  guardia_conflictiva_id?: string;
  fecha_conflicto?: string;
  profesional_guardia_id: string;
  severidad: 'alto' | 'medio' | 'bajo';
  recomendacion: string;
}

interface ConflictDetectionResponse {
  success: boolean;
  conflictos: Conflicto[];
  total_conflictos: number;
  guardias_validadas: number;
  mensaje: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const requestData: ConflictDetectionRequest = await req.json()
    
    console.log('🔍 Detecting guardia conflicts:', requestData)

    const conflictos: Conflicto[] = []
    let guardiasValidadas = 0

    // Escenario 1: Validar una guardia específica contra todas las demás del mismo profesional
    if (requestData.guardia_id) {
      console.log('✅ Validating specific guardia:', requestData.guardia_id)
      
      const { data: guardiaActual, error: errorGuardia } = await supabaseClient
        .from('guardias')
        .select(`
          id,
          profesional_guardia_id,
          fecha_inicio,
          fecha_fin,
          tipo_dia,
          centro_salud_id,
          tipo
        `)
        .eq('id', requestData.guardia_id)
        .single()

      if (errorGuardia || !guardiaActual) {
        throw new Error(`Guardia no encontrada: ${requestData.guardia_id}`)
      }

      // Validar duración
      const duracion = (new Date(guardiaActual.fecha_fin).getTime() - new Date(guardiaActual.fecha_inicio).getTime()) / (1000 * 60 * 60)
      
      if (duracion < 12) {
        conflictos.push({
          tipo: 'duracion_invalida',
          descripcion: `Duración de guardia muy corta (${duracion.toFixed(1)} horas). Mínimo requerido: 12 horas`,
          profesional_guardia_id: guardiaActual.profesional_guardia_id,
          severidad: 'alto',
          recomendacion: 'Extender la duración de la guardia para cumplir con el mínimo requerido'
        })
      }

      if (duracion > 24) {
        conflictos.push({
          tipo: 'duracion_invalida',
          descripcion: `Duración de guardia muy larga (${duracion.toFixed(1)} horas). Máximo permitido: 24 horas`,
          profesional_guardia_id: guardiaActual.profesional_guardia_id,
          severidad: 'alto',
          recomendacion: 'Reducir la duración de la guardia para no exceder el máximo permitido'
        })
      }

      // Buscar solapamientos con otras guardias del mismo profesional
      const { data: otrasGuardias, error: errorOtras } = await supabaseClient
        .from('guardias')
        .select(`
          id,
          profesional_guardia_id,
          fecha_inicio,
          fecha_fin,
          tipo_dia,
          tipo
        `)
        .eq('profesional_guardia_id', guardiaActual.profesional_guardia_id)
        .neq('id', guardiaActual.id)
        .order('fecha_inicio', { ascending: true })

      if (errorOtras) {
        console.error('Error fetching otras guardias:', errorOtras)
      }

      // Detectar solapamientos
      const inicio1 = new Date(guardiaActual.fecha_inicio).getTime()
      const fin1 = new Date(guardiaActual.fecha_fin).getTime()

      for (const otroGuardia of otrasGuardias || []) {
        const inicio2 = new Date(otroGuardia.fecha_inicio).getTime()
        const fin2 = new Date(otroGuardia.fecha_fin).getTime()

        // Verificar solapamiento
        if (inicio1 < fin2 && inicio2 < fin1) {
          conflictos.push({
            tipo: 'solapamiento',
            descripcion: `Solapamiento detectado con guardia ${otroGuardia.id}. Período: ${new Date(otroGuardia.fecha_inicio).toLocaleString()} a ${new Date(otroGuardia.fecha_fin).toLocaleString()}`,
            guardia_conflictiva_id: otroGuardia.id,
            profesional_guardia_id: guardiaActual.profesional_guardia_id,
            severidad: 'alto',
            recomendacion: 'Eliminar una de las guardias solapadas o ajustar sus horarios'
          })
        }

        // Verificar mismo día
        const fecha1 = new Date(guardiaActual.fecha_inicio).toLocaleDateString('es-ES')
        const fecha2 = new Date(otroGuardia.fecha_inicio).toLocaleDateString('es-ES')

        if (fecha1 === fecha2) {
          conflictos.push({
            tipo: 'mismo_dia',
            descripcion: `Dos guardias asignadas el mismo día (${fecha1}). Segunda guardia: ${new Date(otroGuardia.fecha_inicio).toLocaleTimeString()}`,
            guardia_conflictiva_id: otroGuardia.id,
            profesional_guardia_id: guardiaActual.profesional_guardia_id,
            severidad: 'medio',
            recomendacion: 'Considerar si esta asignación doble es intencional o un error'
          })
        }
      }

      guardiasValidadas = 1
    }

    // Escenario 2: Validar todas las guardias de un período/mes
    else if (requestData.mes && requestData.ano) {
      console.log(`📅 Validating all guardias for ${requestData.mes}/${requestData.ano}`)

      const startDate = new Date(requestData.ano, requestData.mes - 1, 1).toISOString()
      const endDate = new Date(requestData.ano, requestData.mes, 0, 23, 59, 59).toISOString()

      let query = supabaseClient
        .from('guardias')
        .select(`
          id,
          profesional_guardia_id,
          fecha_inicio,
          fecha_fin,
          tipo_dia,
          tipo,
          centro_salud_id
        `)
        .gte('fecha_inicio', startDate)
        .lte('fecha_inicio', endDate)
        .order('fecha_inicio', { ascending: true })

      if (requestData.centro_id) {
        query = query.eq('centro_salud_id', requestData.centro_id)
      }

      const { data: guardias, error: errorGuardias } = await query

      if (errorGuardias) {
        throw new Error(`Error fetching guardias: ${errorGuardias.message}`)
      }

      // Agrupar guardias por profesional
      const guardiasXProfesional = new Map<string, typeof guardias>()
      for (const guardia of guardias || []) {
        const profId = guardia.profesional_guardia_id
        if (!guardiasXProfesional.has(profId)) {
          guardiasXProfesional.set(profId, [])
        }
        guardiasXProfesional.get(profId)!.push(guardia)
      }

      // Validar cada profesional
      for (const [profId, guardiasProf] of guardiasXProfesional.entries()) {
        for (let i = 0; i < guardiasProf.length; i++) {
          const guardia1 = guardiasProf[i]

          // Validar duración
          const duracion = (new Date(guardia1.fecha_fin).getTime() - new Date(guardia1.fecha_inicio).getTime()) / (1000 * 60 * 60)

          if (duracion < 12) {
            conflictos.push({
              tipo: 'duracion_invalida',
              descripcion: `Guardia ${guardia1.id}: Duración muy corta (${duracion.toFixed(1)} horas)`,
              profesional_guardia_id: profId,
              severidad: 'alto',
              recomendacion: 'Extender la duración mínimo a 12 horas'
            })
          }

          if (duracion > 24) {
            conflictos.push({
              tipo: 'duracion_invalida',
              descripcion: `Guardia ${guardia1.id}: Duración muy larga (${duracion.toFixed(1)} horas)`,
              profesional_guardia_id: profId,
              severidad: 'alto',
              recomendacion: 'Reducir la duración máximo a 24 horas'
            })
          }

          // Detectar solapamientos con otras guardias del mismo profesional
          for (let j = i + 1; j < guardiasProf.length; j++) {
            const guardia2 = guardiasProf[j]

            const inicio1 = new Date(guardia1.fecha_inicio).getTime()
            const fin1 = new Date(guardia1.fecha_fin).getTime()
            const inicio2 = new Date(guardia2.fecha_inicio).getTime()
            const fin2 = new Date(guardia2.fecha_fin).getTime()

            if (inicio1 < fin2 && inicio2 < fin1) {
              conflictos.push({
                tipo: 'solapamiento',
                descripcion: `Guardias ${guardia1.id} y ${guardia2.id} se solapan`,
                guardia_conflictiva_id: guardia2.id,
                profesional_guardia_id: profId,
                severidad: 'alto',
                recomendacion: 'Eliminar una de las guardias o ajustar horarios'
              })
            }

            // Mismo día
            const fecha1 = new Date(guardia1.fecha_inicio).toLocaleDateString('es-ES')
            const fecha2 = new Date(guardia2.fecha_inicio).toLocaleDateString('es-ES')

            if (fecha1 === fecha2) {
              conflictos.push({
                tipo: 'mismo_dia',
                descripcion: `Guardias ${guardia1.id} y ${guardia2.id} el mismo día`,
                guardia_conflictiva_id: guardia2.id,
                profesional_guardia_id: profId,
                severidad: 'medio',
                recomendacion: 'Verificar si esta asignación doble es intencional'
              })
            }
          }
        }

        guardiasValidadas += guardiasProf.length
      }
    }

    // Escenario 3: Validar basado en profesional y fechas
    else if (requestData.profesional_guardia_id && requestData.fecha_inicio) {
      console.log('👤 Validating for professional:', requestData.profesional_guardia_id)

      const { data: guardiasProf, error: errorGuardias } = await supabaseClient
        .from('guardias')
        .select(`
          id,
          profesional_guardia_id,
          fecha_inicio,
          fecha_fin,
          tipo_dia,
          tipo
        `)
        .eq('profesional_guardia_id', requestData.profesional_guardia_id)
        .order('fecha_inicio', { ascending: true })

      if (errorGuardias) {
        throw new Error(`Error fetching guardias: ${errorGuardias.message}`)
      }

      const inicio1 = new Date(requestData.fecha_inicio).getTime()
      const fin1 = new Date(requestData.fecha_fin).getTime()

      for (const guardia of guardiasProf || []) {
        const inicio2 = new Date(guardia.fecha_inicio).getTime()
        const fin2 = new Date(guardia.fecha_fin).getTime()

        if (inicio1 < fin2 && inicio2 < fin1) {
          conflictos.push({
            tipo: 'solapamiento',
            descripcion: `Nueva guardia se solapa con guardia existente ${guardia.id}`,
            guardia_conflictiva_id: guardia.id,
            profesional_guardia_id: requestData.profesional_guardia_id,
            severidad: 'alto',
            recomendacion: 'Seleccionar una fecha diferente para la nueva guardia'
          })
        }
      }

      guardiasValidadas = guardiasProf?.length || 0
    }

    const response: ConflictDetectionResponse = {
      success: true,
      conflictos,
      total_conflictos: conflictos.length,
      guardias_validadas: guardiasValidadas,
      mensaje: conflictos.length === 0 
        ? `✅ Validación completada: ${guardiasValidadas} guardia(s) validada(s) sin conflictos`
        : `⚠️ Se detectaron ${conflictos.length} conflicto(s) en ${guardiasValidadas} guardia(s)`
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('❌ Error in detect-guardia-conflicts:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    
    return new Response(
      JSON.stringify({
        success: false,
        conflictos: [],
        total_conflictos: 0,
        guardias_validadas: 0,
        mensaje: `Error en detección de conflictos: ${errorMessage}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
