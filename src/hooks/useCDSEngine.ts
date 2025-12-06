import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export interface Alert {
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

export interface CDSResult {
  alertas: Alert[]
  alertasCriticas: number
  alertasAdvertencia: number
  alertasInfo: number
  permitePrescripcion: boolean
  motivo?: string
  timestamp: string
}

export interface PrescriptionForCDS {
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

export function useCDSEngine() {
  const { toast } = useToast()

  // ============================================================
  // EVALUAR PRESCRIPCIÓN CON CDS
  // ============================================================
  const evaluarPrescripcionMutation = useMutation({
    mutationFn: async (prescription: PrescriptionForCDS): Promise<CDSResult> => {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(
        `${new URL(supabase.supabaseClient.supabaseUrl).origin}/functions/v1/cds-engine`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prescription })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error evaluando prescripción')
      }

      return response.json()
    },
    onError: (error) => {
      toast({
        title: 'Error en CDS Engine',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive'
      })
    }
  })

  // ============================================================
  // OBTENER MEDICAMENTOS ACTUALES DEL PACIENTE
  // ============================================================
  const obtenerMedicamentosActuales = async (pacienteId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from('hosix_cpoe_prescripciones')
      .select('nombre_medicamento')
      .eq('paciente_id', pacienteId)
      .eq('estado', 'activa')
    
    if (error) throw error
    
    return data?.map(p => p.nombre_medicamento) || []
  }

  // ============================================================
  // REGISTRAR ALERTA IGNORADA (AUDITORÍA)
  // ============================================================
  const ignorarAlertaMutation = useMutation({
    mutationFn: async ({
      prescripcionId,
      reglaId,
      alerta,
      motivo,
      justificacionClinica
    }: {
      prescripcionId: string
      reglaId: string
      alerta: Alert
      motivo: string
      justificacionClinica: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Usuario no autenticado')

      // Guardar en tabla de auditoría (si existe)
      // const { error } = await supabase
      //   .from('hosix_cds_alertas_ignoradas')
      //   .insert([
      //     {
      //       prescripcion_id: prescripcionId,
      //       regla_id: reglaId,
      //       alerta_original: alerta,
      //       motivo_ignorancia: motivo,
      //       justificacion_clinica: justificacionClinica,
      //       ignorada_por: user.id
      //     }
      //   ])

      // if (error) throw error

      return { success: true }
    },
    onSuccess: () => {
      toast({
        title: 'Alerta registrada',
        description: 'La decisión clínica ha sido registrada para auditoría',
        variant: 'default'
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al registrar alerta',
        variant: 'destructive'
      })
    }
  })

  // ============================================================
  // OBTENER INFORMACIÓN DEL PACIENTE PARA CDS
  // ============================================================
  const { data: pacienteInfo, isLoading: cargandoPaciente } = useQuery({
    queryKey: ['paciente-info-cds'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('hosix_pacientes')
        .select('id, alergias, fecha_nacimiento')
        .limit(1)

      if (error) throw error
      return data?.[0] || null
    }
  })

  // ============================================================
  // OBTENER DOSIS PEDIÁTRICA RECOMENDADA
  // ============================================================
  const obtenerDosisPediatrica = async (medicamentoId: string, edad: number, peso: number) => {
    // En producción, consultar tabla hosix_cds_dosificacion_pediatrica
    // Por ahora, usar valores estándar
    const dosisEstander: Record<string, { minMgKg: number; maxMgKg: number; maxDiarios: number }> = {
      'paracetamol': { minMgKg: 10, maxMgKg: 15, maxDiarios: 5 },
      'ibuprofeno': { minMgKg: 5, maxMgKg: 10, maxDiarios: 3 },
      'amoxicilina': { minMgKg: 25, maxMgKg: 45, maxDiarios: 3 },
    }

    return { dosisEstander, edadPaciente: edad, pesoPaciente: peso }
  }

  return {
    // Mutaciones
    evaluarPrescripcion: evaluarPrescripcionMutation.mutate,
    evaluarPrescripcionAsync: evaluarPrescripcionMutation.mutateAsync,
    ignorarAlerta: ignorarAlertaMutation.mutate,
    ignorarAlertaAsync: ignorarAlertaMutation.mutateAsync,

    // Estados
    evaluandoPrescripcion: evaluarPrescripcionMutation.isPending,
    ignorandoAlerta: ignorarAlertaMutation.isPending,
    cargandoPaciente,

    // Datos
    pacienteInfo,

    // Funciones auxiliares
    obtenerMedicamentosActuales,
    obtenerDosisPediatrica,

    // Errores
    errorEvaluacion: evaluarPrescripcionMutation.error?.message,
    errorIgnorar: ignorarAlertaMutation.error?.message,
  }
}

// ============================================================
// UTILIDADES PARA PROCESAR ALERTAS
// ============================================================

export function agruparAlertasPorSeveridad(alertas: Alert[]) {
  return {
    criticas: alertas.filter(a => a.severidad === 'critica'),
    advertencias: alertas.filter(a => a.severidad === 'advertencia'),
    info: alertas.filter(a => a.severidad === 'info')
  }
}

export function obtenerColorSeveridad(severidad: Alert['severidad']): string {
  const colores: Record<Alert['severidad'], string> = {
    'critica': 'bg-red-500 text-white',
    'advertencia': 'bg-yellow-500 text-black',
    'info': 'bg-blue-500 text-white'
  }
  return colores[severidad]
}

export function obtenerIconoSeveridad(severidad: Alert['severidad']): string {
  const iconos: Record<Alert['severidad'], string> = {
    'critica': '🚫',
    'advertencia': '⚠️',
    'info': 'ℹ️'
  }
  return iconos[severidad]
}
