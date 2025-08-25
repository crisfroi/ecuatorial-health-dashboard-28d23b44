import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportRequest {
  nomina_id?: string;
  mes?: number;
  ano?: number;
  centro_id?: string;
  format: 'csv' | 'xlsx' | 'json';
  tipo_export: 'nomina' | 'pagos' | 'banco';
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

    const { nomina_id, mes, ano, centro_id, format, tipo_export }: ExportRequest = await req.json()

    console.log(`📊 Exporting ${tipo_export} in ${format} format`)

    let data: any[] = []

    if (tipo_export === 'nomina' && nomina_id) {
      // Export nomina lines
      const { data: nominaData, error } = await supabaseClient
        .from('nominas_guardias_lineas')
        .select(`
          *,
          nominas_guardias!inner(mes, anio, centro_salud_id),
          profesionales_guardias!inner(
            profesional_id,
            categoria,
            unidad_servicio,
            banco,
            iban_cuenta,
            profesionales_sanitarios!inner(
              nombre_completo,
              funcion_publica,
              tipo_sector
            )
          )
        `)
        .eq('nomina_id', nomina_id)

      if (error) throw new Error(`Error fetching nomina data: ${error.message}`)

      data = nominaData?.map(line => ({
        profesional_id: line.profesionales_guardias.profesional_id,
        nombre_completo: line.profesionales_guardias.profesionales_sanitarios.nombre_completo,
        categoria: line.profesionales_guardias.categoria,
        unidad_servicio: line.profesionales_guardias.unidad_servicio,
        funcion_publica: line.profesionales_guardias.profesionales_sanitarios.funcion_publica ? 'Sí' : 'No',
        tipo_sector: line.profesionales_guardias.profesionales_sanitarios.tipo_sector,
        guardias_ordinarias: line.guardias_ordinarias,
        guardias_fines_semana: line.guardias_fines_semana,
        guardias_festivos: line.guardias_festivos,
        localizables_programadas: line.localizables_programadas,
        localizables_llamadas: line.localizables_llamadas,
        total_linea: line.total_linea,
        banco: line.profesionales_guardias.banco,
        iban_cuenta: line.profesionales_guardias.iban_cuenta,
        mes: line.nominas_guardias.mes,
        ano: line.nominas_guardias.anio
      })) || []

    } else if (tipo_export === 'pagos') {
      // Export payments
      let query = supabaseClient
        .from('pagos_guardias')
        .select(`
          *,
          profesionales_guardias!inner(
            profesional_id,
            categoria,
            banco,
            iban_cuenta,
            profesionales_sanitarios!inner(
              nombre_completo,
              funcion_publica
            )
          ),
          nominas_guardias!inner(mes, anio, centro_salud_id)
        `)

      if (nomina_id) {
        query = query.eq('nomina_id', nomina_id)
      } else if (mes && ano) {
        const { data: nominaIds } = await supabaseClient
          .from('nominas_guardias')
          .select('id')
          .eq('mes', mes)
          .eq('anio', ano)
          .eq('centro_salud_id', centro_id || '')

        if (nominaIds?.length) {
          query = query.in('nomina_id', nominaIds.map(n => n.id))
        }
      }

      const { data: pagosData, error } = await query

      if (error) throw new Error(`Error fetching pagos data: ${error.message}`)

      data = pagosData?.map(pago => ({
        pago_id: pago.id,
        profesional_id: pago.profesionales_guardias.profesional_id,
        nombre_completo: pago.profesionales_guardias.profesionales_sanitarios.nombre_completo,
        categoria: pago.profesionales_guardias.categoria,
        funcion_publica: pago.profesionales_guardias.profesionales_sanitarios.funcion_publica ? 'Sí' : 'No',
        importe: pago.importe,
        forma_pago: pago.forma_pago,
        estado: pago.estado,
        fecha_pago: pago.fecha_pago,
        referencia_pago: pago.referencia_pago,
        banco: pago.profesionales_guardias.banco,
        iban_cuenta: pago.profesionales_guardias.iban_cuenta,
        comprobante_url: pago.comprobante_url,
        observaciones: pago.observaciones,
        mes: pago.nominas_guardias.mes,
        ano: pago.nominas_guardias.anio
      })) || []

    } else if (tipo_export === 'banco') {
      // Export for bank transfer (simplified format)
      let query = supabaseClient
        .from('pagos_guardias')
        .select(`
          *,
          profesionales_guardias!inner(
            banco,
            iban_cuenta,
            profesionales_sanitarios!inner(nombre_completo)
          )
        `)
        .eq('estado', 'confirmado')
        .eq('forma_pago', 'transfer_trabajador')

      if (nomina_id) {
        query = query.eq('nomina_id', nomina_id)
      }

      const { data: bankData, error } = await query

      if (error) throw new Error(`Error fetching bank data: ${error.message}`)

      data = bankData?.map(pago => ({
        beneficiario: pago.profesionales_guardias.profesionales_sanitarios.nombre_completo,
        banco: pago.profesionales_guardias.banco || 'NO_ESPECIFICADO',
        cuenta: pago.profesionales_guardias.iban_cuenta || 'NO_ESPECIFICADO',
        importe: pago.importe,
        referencia: pago.referencia_pago || pago.id,
        concepto: `Pago Guardias Médicas - ${new Date().toLocaleDateString()}`,
        moneda: 'XAF'
      })) || []
    }

    // Generate response based on format
    if (format === 'csv') {
      const csv = generateCSV(data)
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${tipo_export}_${Date.now()}.csv"`
        }
      })
    } else if (format === 'json') {
      return new Response(JSON.stringify({
        success: true,
        data,
        meta: {
          total_records: data.length,
          export_type: tipo_export,
          generated_at: new Date().toISOString()
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Default JSON response
    return new Response(JSON.stringify({
      success: true,
      data,
      total_records: data.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Export error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

function generateCSV(data: any[]): string {
  if (!data.length) return ''

  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header]
      // Escape quotes and wrap in quotes if contains comma or quote
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value || ''
    }).join(',')
  )

  return [csvHeaders, ...csvRows].join('\n')
}
