import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalculateNominaRequest {
  mes: number;
  ano: number;
  centro_id: string;
}

interface GuardiaData {
  id: string;
  profesional_guardia_id: string;
  tipo: 'fisica' | 'localizable' | 'administrativa';
  tipo_dia: 'ordinario' | 'fin_semana' | 'festivo';
  horas: number;
  localizable_activada?: boolean;
  hora_llamada?: string;
}

interface BaremoData {
  categoria: string;
  tipo_guardia: string;
  tipo_dia: string;
  valor: number;
  porcentaje_localizable: number;
  porcentaje_llamada: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { mes, ano, centro_id }: CalculateNominaRequest = await req.json()

    console.log(`🧮 Calculating nomina for center ${centro_id}, ${mes}/${ano}`)

    // 1. Fetch guardias for the period
    const startDate = new Date(ano, mes - 1, 1).toISOString()
    const endDate = new Date(ano, mes, 0, 23, 59, 59).toISOString()

    const { data: guardias, error: guardiasError } = await supabaseClient
      .from('guardias')
      .select(`
        id,
        profesional_guardia_id,
        tipo,
        tipo_dia,
        horas,
        localizable_activada,
        hora_llamada,
        profesionales_guardias!inner(
          id,
          categoria,
          funcion_publica
        )
      `)
      .eq('centro_salud_id', centro_id)
      .gte('fecha_inicio', startDate)
      .lte('fecha_inicio', endDate)

    if (guardiasError) {
      throw new Error(`Error fetching guardias: ${guardiasError.message}`)
    }

    console.log(`📊 Found ${guardias?.length || 0} guardias`)

    // 2. Fetch active baremos
    const { data: baremos, error: baremosError } = await supabaseClient
      .from('ajustes_baremos')
      .select('*')
      .eq('activo', true)
      .lte('vigente_desde', new Date().toISOString())
      .or(`vigente_hasta.is.null,vigente_hasta.gte.${new Date().toISOString()}`)

    if (baremosError) {
      throw new Error(`Error fetching baremos: ${baremosError.message}`)
    }

    console.log(`💰 Found ${baremos?.length || 0} active baremos`)

    // 3. Group guardias by professional and calculate totals
    const nominaLines = new Map()

    for (const guardia of guardias || []) {
      const profesionalId = guardia.profesional_guardia_id
      const categoria = guardia.profesionales_guardias.categoria
      const funcionPublica = guardia.profesionales_guardias.funcion_publica

      if (!nominaLines.has(profesionalId)) {
        nominaLines.set(profesionalId, {
          profesional_guardia_id: profesionalId,
          categoria,
          funcion_publica: funcionPublica,
          guardias_ordinarias: 0,
          guardias_fines_semana: 0,
          guardias_festivos: 0,
          localizables_programadas: 0,
          localizables_llamadas: 0,
          coste_unitario_ordinario: 0,
          coste_unitario_fin_semana: 0,
          coste_unitario_festivo: 0,
          coste_localizable_programada: 0,
          coste_localizable_llamada: 0,
          total_linea: 0
        })
      }

      const line = nominaLines.get(profesionalId)

      // Find applicable baremo
      const baremo = baremos?.find(b => 
        b.categoria === categoria &&
        b.tipo_guardia === guardia.tipo &&
        b.tipo_dia === guardia.tipo_dia
      )

      // Default values if no baremo found
      const baseValue = baremo?.valor || getDefaultValue(guardia.tipo, guardia.tipo_dia)
      
      // Calculate final amount with adjustments
      let finalAmount = baseValue
      if (guardia.tipo === 'localizable' && baremo?.porcentaje_localizable) {
        finalAmount *= (1 + baremo.porcentaje_localizable / 100)
      }
      if (guardia.hora_llamada && baremo?.porcentaje_llamada) {
        finalAmount *= (1 + baremo.porcentaje_llamada / 100)
      }

      // Accumulate counts and costs
      switch (guardia.tipo_dia) {
        case 'ordinario':
          line.guardias_ordinarias += 1
          line.coste_unitario_ordinario = finalAmount
          break
        case 'fin_semana':
          line.guardias_fines_semana += 1
          line.coste_unitario_fin_semana = finalAmount
          break
        case 'festivo':
          line.guardias_festivos += 1
          line.coste_unitario_festivo = finalAmount
          break
      }

      if (guardia.tipo === 'localizable') {
        if (guardia.hora_llamada) {
          line.localizables_llamadas += 1
          line.coste_localizable_llamada = finalAmount
        } else {
          line.localizables_programadas += 1
          line.coste_localizable_programada = finalAmount
        }
      }

      // Calculate line total
      line.total_linea = 
        (line.guardias_ordinarias * line.coste_unitario_ordinario) +
        (line.guardias_fines_semana * line.coste_unitario_fin_semana) +
        (line.guardias_festivos * line.coste_unitario_festivo) +
        (line.localizables_programadas * line.coste_localizable_programada) +
        (line.localizables_llamadas * line.coste_localizable_llamada)
    }

    // 4. Create or update nomina
    const totalImporte = Array.from(nominaLines.values()).reduce((sum, line) => sum + line.total_linea, 0)
    const totalGuardias = guardias?.length || 0
    const totalProfesionales = nominaLines.size

    const { data: existingNomina } = await supabaseClient
      .from('nominas_guardias')
      .select('id')
      .eq('centro_salud_id', centro_id)
      .eq('mes', mes)
      .eq('anio', ano)
      .single()

    let nominaId: string

    if (existingNomina) {
      // Update existing nomina
      const { error: updateError } = await supabaseClient
        .from('nominas_guardias')
        .update({
          total_importe: totalImporte,
          total_guardias: totalGuardias,
          total_profesionales: totalProfesionales,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingNomina.id)

      if (updateError) {
        throw new Error(`Error updating nomina: ${updateError.message}`)
      }

      nominaId = existingNomina.id

      // Delete existing lines
      await supabaseClient
        .from('nominas_guardias_lineas')
        .delete()
        .eq('nomina_id', nominaId)
    } else {
      // Create new nomina
      const { data: newNomina, error: createError } = await supabaseClient
        .from('nominas_guardias')
        .insert({
          centro_salud_id: centro_id,
          mes,
          anio,
          estado: 'borrador',
          total_importe: totalImporte,
          total_guardias: totalGuardias,
          total_profesionales: totalProfesionales
        })
        .select('id')
        .single()

      if (createError) {
        throw new Error(`Error creating nomina: ${createError.message}`)
      }

      nominaId = newNomina.id
    }

    // 5. Insert nomina lines
    const linesToInsert = Array.from(nominaLines.values()).map(line => ({
      ...line,
      nomina_id: nominaId
    }))

    const { error: linesError } = await supabaseClient
      .from('nominas_guardias_lineas')
      .insert(linesToInsert)

    if (linesError) {
      throw new Error(`Error inserting nomina lines: ${linesError.message}`)
    }

    console.log(`✅ Nomina calculated successfully: ${totalImporte} XAF for ${totalProfesionales} professionals`)

    return new Response(
      JSON.stringify({
        success: true,
        nomina_id: nominaId,
        summary: {
          total_importe: totalImporte,
          total_guardias: totalGuardias,
          total_profesionales: totalProfesionales,
          lines_created: linesToInsert.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error calculating nomina:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

function getDefaultValue(tipo: string, tipoDia: string): number {
  // Default fallback values in XAF
  const defaults = {
    fisica: {
      ordinario: 50000,
      fin_semana: 75000,
      festivo: 100000
    },
    localizable: {
      ordinario: 25000,
      fin_semana: 37500,
      festivo: 50000
    },
    administrativa: {
      ordinario: 30000,
      fin_semana: 45000,
      festivo: 60000
    }
  }

  return defaults[tipo]?.[tipoDia] || 50000
}
