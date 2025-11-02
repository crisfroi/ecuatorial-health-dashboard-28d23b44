import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalculateNominasRequest {
  mes: number;
  ano: number;
  centro_id?: string;
  profesional_id?: string;
}

interface NominaLineaCalculo {
  profesional_guardia_id: string;
  profesional_id: string;
  centro_salud_id: string;
  cantidad_guardias: number;
  horas_totales: number;
  monto_base: number;
  bonificacion_guardia: number;
  bonificacion_fin_semana: number;
  bonificacion_festivo: number;
  descuentos: number;
  monto_neto: number;
  detalles: string;
}

interface NominaCalculoResponse {
  success: boolean;
  mes: number;
  ano: number;
  periodo: string;
  nomina_id?: string;
  lineas_calculadas: NominaLineaCalculo[];
  total_profesionales: number;
  monto_total_bruto: number;
  monto_total_neto: number;
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

    const requestData: CalculateNominasRequest = await req.json()

    console.log('📊 Calculando nóminas para:', requestData)

    const { mes, ano, centro_id, profesional_id } = requestData

    // 1. Obtener baremos vigentes
    const { data: baremos, error: errorBaremos } = await supabaseClient
      .from('baremos')
      .select('*')
      .eq('estado', 'vigente')
      .single()

    if (errorBaremos || !baremos) {
      throw new Error('No se encontraron baremos vigentes')
    }

    const montoPorHora = baremos.monto_base || 100
    const bonificacionFinSemana = baremos.bonificacion_fin_semana || 0.25
    const bonificacionFestivo = baremos.bonificacion_festivo || 0.50
    const bonificacionGuardia = baremos.bonificacion_guardia || 0.10

    // 2. Obtener guardias del período
    const startDate = new Date(ano, mes - 1, 1).toISOString()
    const endDate = new Date(ano, mes, 0, 23, 59, 59).toISOString()

    let queryGuardias = supabaseClient
      .from('guardias')
      .select(`
        id,
        profesional_guardia_id,
        centro_salud_id,
        fecha_inicio,
        fecha_fin,
        tipo_dia,
        tipo,
        estado,
        profesionales_guardias!inner(
          profesionales_sanitarios!inner(id, nombre_completo)
        ),
        centros_salud!inner(id, nombre)
      `)
      .gte('fecha_inicio', startDate)
      .lte('fecha_inicio', endDate)
      .eq('estado', 'cumplida')

    if (centro_id) {
      queryGuardias = queryGuardias.eq('centro_salud_id', centro_id)
    }

    if (profesional_id) {
      queryGuardias = queryGuardias.eq(
        'profesionales_guardias.profesionales_sanitarios.id',
        profesional_id
      )
    }

    const { data: guardias, error: errorGuardias } = await queryGuardias

    if (errorGuardias) {
      throw new Error(`Error obteniendo guardias: ${errorGuardias.message}`)
    }

    // 3. Agrupar guardias por profesional
    const guardiasXProfesional = new Map<
      string,
      Array<{
        id: string
        horas: number
        tipo_dia: string
        fecha: Date
        centro_salud_id: string
      }>
    >()

    for (const guardia of guardias || []) {
      const profGuardiaId = guardia.profesional_guardia_id
      const profId = guardia.profesionales_guardias?.profesionales_sanitarios?.id
      const centroId = guardia.centro_salud_id

      if (!profGuardiaId || !profId) continue

      const key = `${profGuardiaId}|${profId}|${centroId}`

      const duracion =
        (new Date(guardia.fecha_fin).getTime() -
          new Date(guardia.fecha_inicio).getTime()) /
        (1000 * 60 * 60)

      if (!guardiasXProfesional.has(key)) {
        guardiasXProfesional.set(key, [])
      }

      guardiasXProfesional.get(key)!.push({
        id: guardia.id,
        horas: duracion,
        tipo_dia: guardia.tipo_dia,
        fecha: new Date(guardia.fecha_inicio),
        centro_salud_id: centroId,
      })
    }

    // 4. Calcular líneas de nómina
    const lineas: NominaLineaCalculo[] = []
    let montoBrutoTotal = 0
    let montoNetoTotal = 0

    for (const [key, guardiasProf] of guardiasXProfesional.entries()) {
      const [profGuardiaId, profId, centroId] = key.split('|')

      const cantidadGuardias = guardiasProf.length
      const horasTotales = guardiasProf.reduce((sum, g) => sum + g.horas, 0)

      // Calcular montos
      const montoBases = horasTotales * montoPorHora
      let bonificacionTotal = 0

      // Bonificación por día (fin de semana y festivos)
      for (const guardia of guardiasProf) {
        if (guardia.tipo_dia === 'fin_semana') {
          bonificacionTotal += guardia.horas * montoPorHora * bonificacionFinSemana
        } else if (guardia.tipo_dia === 'festivo') {
          bonificacionTotal += guardia.horas * montoPorHora * bonificacionFestivo
        }
      }

      // Bonificación por guardia realizada
      const bonificacionGuardiaTotal = cantidadGuardias * (horasTotales * montoPorHora * bonificacionGuardia)

      const montoBruto = montoBases + bonificacionTotal + bonificacionGuardiaTotal
      const descuentos = montoBruto * 0.1 // Asumir 10% descuentos (IESS, etc)
      const montoNeto = montoBruto - descuentos

      montoBrutoTotal += montoBruto
      montoNetoTotal += montoNeto

      lineas.push({
        profesional_guardia_id: profGuardiaId,
        profesional_id: profId,
        centro_salud_id: centroId,
        cantidad_guardias: cantidadGuardias,
        horas_totales: horasTotales,
        monto_base: montoBases,
        bonificacion_guardia: bonificacionGuardiaTotal,
        bonificacion_fin_semana: bonificacionTotal * (bonificacionFinSemana / (bonificacionFinSemana + bonificacionFestivo)),
        bonificacion_festivo: bonificacionTotal * (bonificacionFestivo / (bonificacionFinSemana + bonificacionFestivo)),
        descuentos,
        monto_neto: montoNeto,
        detalles: `${cantidadGuardias} guardias, ${horasTotales.toFixed(1)}h totales`,
      })
    }

    // 5. Crear nómina en BD
    const { data: nomina, error: errorNomina } = await supabaseClient
      .from('nominas')
      .insert([
        {
          mes,
          anio: ano,
          centro_salud_id: centro_id || null,
          estado: 'enviada',
          total_bruto: montoBrutoTotal,
          total_neto: montoNetoTotal,
          total_descuentos: montoBrutoTotal - montoNetoTotal,
          cantidad_lineas: lineas.length,
          observaciones: `Nómina calculada automáticamente para ${mes}/${ano}`,
        }
      ])
      .select()
      .single()

    if (errorNomina || !nomina) {
      throw new Error(`Error creando nómina: ${errorNomina?.message}`)
    }

    // 6. Insertar líneas de nómina
    const lineasConNominaId = lineas.map(linea => ({
      ...linea,
      nomina_id: nomina.id,
    }))

    const { error: errorLineas } = await supabaseClient
      .from('nominas_lineas')
      .insert(lineasConNominaId)

    if (errorLineas) {
      throw new Error(`Error creando líneas: ${errorLineas.message}`)
    }

    const response: NominaCalculoResponse = {
      success: true,
      mes,
      ano,
      periodo: `${mes}/${ano}`,
      nomina_id: nomina.id,
      lineas_calculadas: lineas,
      total_profesionales: lineas.length,
      monto_total_bruto: montoBrutoTotal,
      monto_total_neto: montoNetoTotal,
      mensaje: `✅ Nómina calculada exitosamente: ${lineas.length} profesionales, ${montoBrutoTotal.toFixed(2)} (bruto), ${montoNetoTotal.toFixed(2)} (neto)`,
    }

    console.log('✅ Nómina calculada:', response)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('❌ Error calculando nóminas:', error)

    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

    return new Response(
      JSON.stringify({
        success: false,
        mes: 0,
        ano: 0,
        periodo: '',
        lineas_calculadas: [],
        total_profesionales: 0,
        monto_total_bruto: 0,
        monto_total_neto: 0,
        mensaje: `Error: ${errorMessage}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
