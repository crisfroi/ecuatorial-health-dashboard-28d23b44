import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PrescriptionData {
  pacienteId: string
  medicamentoId: string
  nombreMedicamento: string
  dosis: number
  unidadDosis: string
  viasAdministracion: string
  frecuencia: string
  duracionDias?: number
  medicamentosActuales?: string[]
  edadPaciente?: number
  pesoPaciente?: number
  funcionRenal?: 'normal' | 'leve' | 'moderada' | 'grave'
}

interface Alert {
  id: string
  codigo: string
  tipo: 'alergia' | 'interaccion' | 'dosis' | 'duplicidad' | 'contraindicacion' | 'edad'
  severidad: 'info' | 'advertencia' | 'critica'
  mensaje: string
  recomendacion: string
  medicamentoImplicado?: string
  medicamentoInteraccion?: string
  permitirIgnorar: boolean
}

interface CDSResult {
  alertas: Alert[]
  alertasCriticas: number
  alertasAdvertencia: number
  alertasInfo: number
  permitePrescripcion: boolean
  motivo?: string
  timestamp: string
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { prescription } = await req.json() as { prescription: PrescriptionData }

    const alerts: Alert[] = []
    let alertasCriticas = 0
    let alertasAdvertencia = 0
    let alertasInfo = 0

    // ============================================================
    // 1. VALIDAR ALERGIAS
    // ============================================================
    const { data: paciente } = await supabase
      .from('hosix_pacientes')
      .select('alergias, fecha_nacimiento')
      .eq('id', prescription.pacienteId)
      .single()

    if (paciente?.alergias) {
      const alergias = Array.isArray(paciente.alergias) ? paciente.alergias : []
      
      if (alergias.some((a: any) => 
        a.medicamento_id === prescription.medicamentoId ||
        a.nombre?.toLowerCase().includes(prescription.nombreMedicamento.toLowerCase())
      )) {
        const alert: Alert = {
          id: `alergia_${prescription.medicamentoId}`,
          codigo: 'ALERGIA_CRITICA',
          tipo: 'alergia',
          severidad: 'critica',
          mensaje: `⚠️ ALERTA CRÍTICA: Paciente tiene alergia registrada a ${prescription.nombreMedicamento}`,
          recomendacion: 'NO PRESCRIBIR. Buscar alternativa medicamentosa.',
          medicamentoImplicado: prescription.nombreMedicamento,
          permitirIgnorar: false
        }
        alerts.push(alert)
        alertasCriticas++
      }
    }

    // ============================================================
    // 2. VALIDAR INTERACCIONES MEDICAMENTOSAS
    // ============================================================
    if (prescription.medicamentosActuales && prescription.medicamentosActuales.length > 0) {
      // En producción, consultar tabla hosix_cds_interacciones
      // Por ahora, usar validación manual para medicamentos comunes
      const interaccionesConocidas = {
        'Warfarina|Aspirina': {
          severidad: 'critica',
          descripcion: 'Aumento de riesgo de hemorragia',
          recomendacion: 'Aumentar monitoreo INR. Considerar alternativa.'
        },
        'Metformina|Contraste radiográfico': {
          severidad: 'advertencia',
          descripcion: 'Riesgo de acidosis láctica',
          recomendacion: 'Suspender metformina 48h antes y después del contraste.'
        },
        'Estatinas|Eritromicina': {
          severidad: 'advertencia',
          descripcion: 'Aumenta riesgo de miopatía',
          recomendacion: 'Usar antibiótico alternativo si es posible.'
        }
      }

      for (const medicamentoActual of prescription.medicamentosActuales) {
        const key1 = `${prescription.nombreMedicamento}|${medicamentoActual}`
        const key2 = `${medicamentoActual}|${prescription.nombreMedicamento}`
        
        const interaccion = interaccionesConocidas[key1 as keyof typeof interaccionesConocidas] || 
                           interaccionesConocidas[key2 as keyof typeof interaccionesConocidas]
        
        if (interaccion) {
          const alert: Alert = {
            id: `interaccion_${prescription.medicamentoId}_${medicamentoActual}`,
            codigo: 'INTERACCION_DETECTADA',
            tipo: 'interaccion',
            severidad: interaccion.severidad as 'advertencia' | 'critica',
            mensaje: `Interacción potencial entre ${prescription.nombreMedicamento} y ${medicamentoActual}: ${interaccion.descripcion}`,
            recomendacion: interaccion.recomendacion,
            medicamentoImplicado: prescription.nombreMedicamento,
            medicamentoInteraccion: medicamentoActual,
            permitirIgnorar: interaccion.severidad !== 'critica'
          }
          alerts.push(alert)
          
          if (interaccion.severidad === 'critica') {
            alertasCriticas++
          } else {
            alertasAdvertencia++
          }
        }
      }
    }

    // ============================================================
    // 3. VALIDAR DOSIFICACIÓN PEDIÁTRICA
    // ============================================================
    if (prescription.edadPaciente !== undefined && prescription.edadPaciente < 18) {
      const edad = prescription.edadPaciente
      const peso = prescription.pesoPaciente || 70

      // Validaciones básicas pediátricas
      const validacionesPediatricas: Record<string, { minDosis: number; maxDosis: number; unidad: string; recomendacion: string }> = {
        'Paracetamol': {
          minDosis: 10,
          maxDosis: 15,
          unidad: 'mg/kg',
          recomendacion: 'Máximo 5 dosis en 24h, total máximo 4g/día'
        },
        'Ibuprofeno': {
          minDosis: 5,
          maxDosis: 10,
          unidad: 'mg/kg',
          recomendacion: 'Máximo 3 dosis en 24h'
        },
        'Amoxicilina': {
          minDosis: 25,
          maxDosis: 45,
          unidad: 'mg/kg/día',
          recomendacion: 'Dividir en 3 dosis'
        }
      }

      const validacion = validacionesPediatricas[prescription.nombreMedicamento]
      if (validacion) {
        const dosisMgKg = (prescription.dosis / peso)
        
        if (dosisMgKg < validacion.minDosis || dosisMgKg > validacion.maxDosis) {
          const alert: Alert = {
            id: `dosis_pediatrica_${prescription.medicamentoId}`,
            codigo: 'DOSIS_PEDIATRICA_FUERA_RANGO',
            tipo: 'dosis',
            severidad: 'critica',
            mensaje: `⚠️ Dosis FUERA DE RANGO para paciente pediátrico (${edad} años, ${peso}kg). Dosis actual: ${dosisMgKg.toFixed(1)} ${validacion.unidad}. Rango recomendado: ${validacion.minDosis}-${validacion.maxDosis} ${validacion.unidad}`,
            recomendacion: validacion.recomendacion,
            permitirIgnorar: false
          }
          alerts.push(alert)
          alertasCriticas++
        }
      }
    }

    // ============================================================
    // 4. VALIDAR FUNCIÓN RENAL
    // ============================================================
    if (prescription.funcionRenal && prescription.funcionRenal !== 'normal') {
      const medicamentosConAjuste: Record<string, { recomendacion: string; severidad: 'advertencia' | 'critica' }> = {
        'Gentamicina': {
          recomendacion: 'Ajustar dosis según clearance de creatinina. Monitorear niveles séricos.',
          severidad: 'critica'
        },
        'Metformina': {
          recomendacion: 'Contraindcada en insuficiencia renal moderada-grave (Cr >1.5). Suspender si Cr >3.',
          severidad: prescription.funcionRenal === 'grave' ? 'critica' : 'advertencia'
        },
        'AINE': {
          recomendacion: 'Usar dosis menor y monitorear creatinina. Evitar si posible.',
          severidad: 'advertencia'
        }
      }

      const ajuste = medicamentosConAjuste[prescription.nombreMedicamento]
      if (ajuste) {
        const alert: Alert = {
          id: `funcion_renal_${prescription.medicamentoId}`,
          codigo: 'AJUSTE_FUNCION_RENAL',
          tipo: 'contraindicacion',
          severidad: ajuste.severidad,
          mensaje: `Medicamento requiere ajuste por ${prescription.funcionRenal} función renal`,
          recomendacion: ajuste.recomendacion,
          medicamentoImplicado: prescription.nombreMedicamento,
          permitirIgnorar: ajuste.severidad !== 'critica'
        }
        alerts.push(alert)
        
        if (ajuste.severidad === 'critica') {
          alertasCriticas++
        } else {
          alertasAdvertencia++
        }
      }
    }

    // ============================================================
    // 5. VALIDAR DUPLICIDAD
    // ============================================================
    if (prescription.medicamentosActuales) {
      const mismoMedicamento = prescription.medicamentosActuales.some(m =>
        m.toLowerCase().includes(prescription.nombreMedicamento.toLowerCase()) ||
        prescription.nombreMedicamento.toLowerCase().includes(m.toLowerCase())
      )
      
      if (mismoMedicamento) {
        const alert: Alert = {
          id: `duplicidad_${prescription.medicamentoId}`,
          codigo: 'DUPLICIDAD_MEDICAMENTO',
          tipo: 'duplicidad',
          severidad: 'advertencia',
          mensaje: `El paciente ya está tomando ${prescription.nombreMedicamento}. ¿Prescripción duplicada?`,
          recomendacion: 'Verificar que la prescripción anterior no siga activa.',
          medicamentoImplicado: prescription.nombreMedicamento,
          permitirIgnorar: true
        }
        alerts.push(alert)
        alertasAdvertencia++
      }
    }

    // ============================================================
    // RESULTADO FINAL
    // ============================================================
    const permitePrescripcion = alertasCriticas === 0

    const resultado: CDSResult = {
      alertas,
      alertasCriticas,
      alertasAdvertencia,
      alertasInfo,
      permitePrescripcion,
      motivo: permitePrescripcion 
        ? 'Evaluación de seguridad APROBADA'
        : `BLOQUEADO: ${alertasCriticas} alerta(s) crítica(s) detectada(s). Requiere revisión médica.`,
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(resultado),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200
      }
    )
  } catch (error) {
    console.error('CDS Engine Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error en CDS Engine',
        alertas: [],
        alertasCriticas: 0,
        permitePrescripcion: false
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500
      }
    )
  }
})
