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
  profesional_guardia_id?: string;
}

interface NominaLineaCalculo {
  profesional_guardia_id: string;
  categoria: string;
  conteo_ordinarias: number;
  conteo_fines: number;
  conteo_festivos: number;
  localizable_programadas: number;
  localizable_llamadas: number;
  coste_unitario: number;
  total_linea: number;
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

    const { mes, ano, centro_id, profesional_guardia_id } = requestData

    // 1. Obtener baremos vigentes según protocolo oficial
    const { data: baremos, error: errorBaremos } = await supabaseClient
      .from('baremos')
      .select('*')
      .eq('estado', 'vigente')
      .eq('fuente', 'protocol')

    if (errorBaremos || !baremos || baremos.length === 0) {
      throw new Error('No se encontraron baremos vigentes del protocolo oficial. Asegúrate de cargar los baremos.')
    }

    console.log(`📋 Baremos disponibles: ${baremos.length}`)

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
        horas,
        estado,
        profesionales_guardias!inner(
          id,
          categoria,
          profesional_id,
          profesionales_sanitarios!inner(id, nombre_completo)
        )
      `)
      .gte('fecha_inicio', startDate)
      .lte('fecha_inicio', endDate)
      .in('estado', ['realizada', 'cumplida'])

    if (centro_id) {
      queryGuardias = queryGuardias.eq('centro_salud_id', centro_id)
    }

    if (profesional_guardia_id) {
      queryGuardias = queryGuardias.eq('profesional_guardia_id', profesional_guardia_id)
    }

    const { data: guardias, error: errorGuardias } = await queryGuardias

    if (errorGuardias) {
      throw new Error(`Error obteniendo guardias: ${errorGuardias.message}`)
    }

    if (!guardias || guardias.length === 0) {
      throw new Error(`No se encontraron guardias realizadas para el período ${mes}/${ano}`)
    }

    console.log(`✅ Se encontraron ${guardias.length} guardias para procesar`)

    // 3. Agrupar guardias por profesional
    const guardiasXProfesional = new Map<
      string,
      {
        guardias: Array<{
          id: string
          horas: number
          tipo_dia: string
          tipo_guardia: string
          monto: number
        }>;
        categoria: string;
        profesional_id: string;
        nombre_completo: string;
      }
    >()

    for (const guardia of guardias) {
      const profGuardiaId = guardia.profesional_guardia_id
      const profData = guardia.profesionales_guardias

      if (!profGuardiaId || !profData) {
        console.warn('⚠️ Guardia sin profesional:', guardia.id)
        continue
      }

      const profId = profData.profesional_id
      const category = profData.categoria || 'general_licenciado'
      const nombreCompleto = profData.profesionales_sanitarios?.nombre_completo || 'Sin nombre'

      // Obtener tarifa exacta del protocolo según categoría y tipo de día
      const baremoAplicable = baremos.find(b =>
        b.categoria_profesional === category &&
        b.tipo_guardia === 'fisica' &&
        b.tipo_dia === (guardia.tipo_dia || 'ordinario') &&
        b.activo === true
      )

      const montoPorGuardia = baremoAplicable?.monto_base || 25000 // Default si no encuentra

      const key = profGuardiaId

      if (!guardiasXProfesional.has(key)) {
        guardiasXProfesional.set(key, {
          guardias: [],
          categoria: category,
          profesional_id: profId,
          nombre_completo: nombreCompleto,
        })
      }

      guardiasXProfesional.get(key)!.guardias.push({
        id: guardia.id,
        horas: guardia.horas || (
          (new Date(guardia.fecha_fin).getTime() - new Date(guardia.fecha_inicio).getTime()) /
          (1000 * 60 * 60)
        ),
        tipo_dia: guardia.tipo_dia || 'ordinario',
        tipo_guardia: 'fisica',
        monto: montoPorGuardia,
      })
    }

    // 4. Calcular líneas de nómina
    const lineas: NominaLineaCalculo[] = []
    let montoBrutoTotal = 0
    let montoNetoTotal = 0

    for (const [profGuardiaId, profData] of guardiasXProfesional.entries()) {
      const guardiasList = profData.guardias
      const categoria = profData.categoria

      // Calcular totales por tipo de día
      let conteoOrdinarias = 0
      let conteoFines = 0
      let conteoFestivos = 0
      let montoBruto = 0

      for (const guardia of guardiasList) {
        const montoPorGuardia = guardia.monto

        if (guardia.tipo_dia === 'fin_semana') {
          conteoFines++
        } else if (guardia.tipo_dia === 'festivo') {
          conteoFestivos++
        } else {
          conteoOrdinarias++
        }

        montoBruto += montoPorGuardia
      }

      const cantidadGuardias = guardiasList.length
      const descuentos = 0 // Sin descuentos según el protocolo (ya están en las tarifas)
      const montoNeto = montoBruto - descuentos

      montoBrutoTotal += montoBruto
      montoNetoTotal += montoNeto

      lineas.push({
        profesional_guardia_id: profGuardiaId,
        categoria: categoria,
        conteo_ordinarias: conteoOrdinarias,
        conteo_fines: conteoFines,
        conteo_festivos: conteoFestivos,
        localizable_programadas: 0,
        localizable_llamadas: 0,
        coste_unitario: 0,
        total_linea: montoNeto,
        monto_base: montoBruto,
        bonificacion_guardia: 0,
        bonificacion_fin_semana: 0,
        bonificacion_festivo: 0,
        descuentos: descuentos,
        monto_neto: montoNeto,
        detalles: `${cantidadGuardias} guardias (${conteoOrdinarias} ordinarias, ${conteoFines} fin de semana, ${conteoFestivos} festivas)`,
      })
    }

    // 5. Crear nómina en BD
    const { data: nomina, error: errorNomina } = await supabaseClient
      .from('nominas_guardias')
      .insert([
        {
          mes,
          anio: ano,
          centro_salud_id: centro_id || null,
          estado: 'enviada',
          total_importe: montoNetoTotal,
          total_guardias: lineas.reduce((sum, l) => sum + l.conteo_ordinarias + l.conteo_fines + l.conteo_festivos, 0),
          total_profesionales: lineas.length,
          total_bruto: montoBrutoTotal,
          total_neto: montoNetoTotal,
          total_descuentos: 0,
          cantidad_lineas: lineas.length,
          periodo: `${mes}/${ano}`,
          observaciones: `Nómina calculada según protocolo oficial para ${mes}/${ano}`,
        }
      ])
      .select()
      .single()

    if (errorNomina || !nomina) {
      throw new Error(`Error creando nómina: ${errorNomina?.message || 'Unknown error'}`)
    }

    console.log('✅ Nómina creada:', nomina.id)

    // 6. Insertar líneas de nómina
    const lineasConNominaId = lineas.map(linea => ({
      nomina_id: nomina.id,
      profesional_guardia_id: linea.profesional_guardia_id,
      categoria: linea.categoria,
      guardias_ordinarias: linea.conteo_ordinarias,
      guardias_fines_semana: linea.conteo_fines,
      guardias_festivos: linea.conteo_festivos,
      localizables_programadas: linea.localizable_programadas,
      localizables_llamadas: linea.localizable_llamadas,
      coste_unitario_ordinario: 0,
      coste_unitario_fin_semana: 0,
      coste_unitario_festivo: 0,
      coste_localizable_programada: 0,
      coste_localizable_llamada: 0,
      total_linea: linea.total_linea,
      monto_base: linea.monto_base,
      bonificacion_guardia: linea.bonificacion_guardia,
      bonificacion_fin_semana: linea.bonificacion_fin_semana,
      bonificacion_festivo: linea.bonificacion_festivo,
      descuentos: linea.descuentos,
      monto_neto: linea.monto_neto,
      detalles: linea.detalles,
    }))

    const { error: errorLineas } = await supabaseClient
      .from('nominas_guardias_lineas')
      .insert(lineasConNominaId)

    if (errorLineas) {
      console.error('❌ Error creando líneas:', errorLineas)
      throw new Error(`Error creando líneas: ${errorLineas.message}`)
    }

    console.log(`✅ ${lineas.length} líneas de nómina creadas`)

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
      mensaje: `✅ Nómina calculada exitosamente: ${lineas.length} profesionales, XAF ${montoBrutoTotal.toFixed(0)} (total según protocolo oficial)`,
    }

    console.log('✅ Respuesta final:', response)

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
        mensaje: `❌ Error: ${errorMessage}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
