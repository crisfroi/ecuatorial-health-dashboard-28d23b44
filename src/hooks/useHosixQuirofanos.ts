import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface Quirofano {
  id: string
  codigo: string
  nombre: string
  piso: number
  area: string
  capacidad_simultanea: number
  especialidades: string[]
  equipamiento: Record<string, any>
  estado: string
  created_at: string
  updated_at: string
}

interface ProgramacionQuirugia {
  id: string
  quirofano_id: string
  paciente_id: string
  cirugia_id?: string
  tipo_cirugia: string
  especialidad: string
  descripcion?: string
  diagnostico_preoperatorio?: string
  cirujano_principal_id: string
  anesteologo_id?: string
  instrumentista_id?: string
  circulante_id?: string
  fecha_programada: string
  duracion_estimada_minutos?: number
  tipo_anestesia?: string
  estado: string
  prioridad: string
  observaciones_preoperatorias?: string
  created_at: string
  updated_at: string
}

interface HistorialQuirugia {
  id: string
  programacion_id: string
  paciente_id: string
  quirofano_id: string
  fecha_hora_inicio: string
  fecha_hora_fin?: string
  duracion_real_minutos?: number
  complicaciones_intraoperatorias?: string
  hallazgos_quirurgicos?: string
  producto_extraido?: Record<string, any>
  estado_salida_quirofano?: string
  diagnostico_postoperatorio?: string
  reporte_quirurgico?: string
  tiempo_recuperacion_estimado?: number
  created_at: string
}

interface Conteo {
  id: string
  historial_id: string
  conteo_gasas_esperadas: number
  conteo_gasas_reales: number
  conteo_gasas_ok: boolean
  conteo_agujas_esperadas: number
  conteo_agujas_reales: number
  conteo_agujas_ok: boolean
  conteo_instrumental_esperado: number
  conteo_instrumental_real: number
  conteo_instrumental_ok: boolean
  observaciones?: string
  responsable_id: string
  fecha_conteo: string
  created_at: string
}

export const useHosixQuirofanos = () => {
  const queryClient = useQueryClient()

  const quirofanosQuery = useQuery({
    queryKey: ['hosix_quirofanos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_quirofanos')
        .select('*')
        .order('piso, codigo')

      if (error) throw error
      return (data as Quirofano[]) || []
    }
  })

  const programacionesQuery = useQuery({
    queryKey: ['hosix_quirofanos_programacion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_quirofanos_programacion')
        .select(`
          *,
          quirofano:hosix_quirofanos(codigo, nombre),
          paciente:hosix_pacientes(id, primer_nombre, primer_apellido),
          cirujano:profesionales_sanitarios!cirujano_principal_id(nombres, apellidos)
        `)
        .order('fecha_programada', { ascending: false })

      if (error) throw error
      return (data as any[]) || []
    }
  })

  const historialesQuery = useQuery({
    queryKey: ['hosix_quirofanos_historiales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_quirofanos_historiales')
        .select(`
          *,
          quirofano:hosix_quirofanos(codigo, nombre),
          paciente:hosix_pacientes(id, primer_nombre, primer_apellido)
        `)
        .order('fecha_hora_inicio', { ascending: false })

      if (error) throw error
      return (data as any[]) || []
    }
  })

  const crearQuirofanoMutation = useMutation({
    mutationFn: async (quirofano: Partial<Quirofano>) => {
      const { data, error } = await supabase
        .from('hosix_quirofanos')
        .insert([quirofano])
        .select()

      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_quirofanos'] })
      toast.success('Quirófano creado exitosamente')
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`)
    }
  })

  const actualizarQuirofanoMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Quirofano> & { id: string }) => {
      const { data, error } = await supabase
        .from('hosix_quirofanos')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_quirofanos'] })
      toast.success('Quirófano actualizado')
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`)
    }
  })

  const crearProgramacionMutation = useMutation({
    mutationFn: async (programacion: Partial<ProgramacionQuirugia>) => {
      const { data, error } = await supabase
        .from('hosix_quirofanos_programacion')
        .insert([programacion])
        .select()

      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_quirofanos_programacion'] })
      toast.success('Cirugía programada exitosamente')
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`)
    }
  })

  const cancelarProgramacionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('hosix_quirofanos_programacion')
        .update({ estado: 'cancelada' })
        .eq('id', id)
        .select()

      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_quirofanos_programacion'] })
      toast.success('Programación cancelada')
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`)
    }
  })

  const registrarHistorialMutation = useMutation({
    mutationFn: async (historial: Partial<HistorialQuirugia>) => {
      const { data, error } = await supabase
        .from('hosix_quirofanos_historiales')
        .insert([historial])
        .select()

      if (error) throw error

      if (historial.programacion_id) {
        await supabase
          .from('hosix_quirofanos_programacion')
          .update({ estado: 'completada' })
          .eq('id', historial.programacion_id)
      }

      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_quirofanos_historiales'] })
      queryClient.invalidateQueries({ queryKey: ['hosix_quirofanos_programacion'] })
      toast.success('Historial quirúrgico registrado')
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`)
    }
  })

  const registrarConteoMutation = useMutation({
    mutationFn: async (conteo: Partial<Conteo>) => {
      const { data, error } = await supabase
        .from('hosix_quirofanos_conteos')
        .insert([conteo])
        .select()

      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_quirofanos_historiales'] })
      toast.success('Conteo registrado')
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`)
    }
  })

  return {
    quirofanos: quirofanosQuery.data || [],
    quirofanosLoading: quirofanosQuery.isLoading,
    programaciones: programacionesQuery.data || [],
    programacionesLoading: programacionesQuery.isLoading,
    historiales: historialesQuery.data || [],
    historialesLoading: historialesQuery.isLoading,
    crearQuirofano: crearQuirofanoMutation.mutate,
    actualizarQuirofano: actualizarQuirofanoMutation.mutate,
    crearProgramacion: crearProgramacionMutation.mutate,
    cancelarProgramacion: cancelarProgramacionMutation.mutate,
    registrarHistorial: registrarHistorialMutation.mutate,
    registrarConteo: registrarConteoMutation.mutate
  }
}
