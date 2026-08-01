import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/hosixClient'
import { toast } from 'sonner'

export const useHosixInterconsultas = () => {
  const queryClient = useQueryClient()

  const solicitudesQuery = useQuery({
    queryKey: ['hosix_interconsultas_solicitudes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_interconsultas_solicitudes')
        .select('*')
        .order('fecha_solicitud', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const respuestasQuery = useQuery({
    queryKey: ['hosix_interconsultas_respuestas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_interconsultas_respuestas')
        .select('*')
        .order('fecha_respuesta', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const crearSolicitudMutation = useMutation({
    mutationFn: async (solicitud: any) => {
      const { data, error } = await supabase
        .from('hosix_interconsultas_solicitudes')
        .insert([solicitud])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_interconsultas_solicitudes'] })
      toast.success('Interconsulta solicitada')
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  const crearRespuestaMutation = useMutation({
    mutationFn: async (respuesta: any) => {
      const { data, error } = await supabase
        .from('hosix_interconsultas_respuestas')
        .insert([respuesta])
        .select()
      if (error) throw error

      if (respuesta.solicitud_id) {
        await supabase
          .from('hosix_interconsultas_solicitudes')
          .update({ estado_solicitud: 'respondida' })
          .eq('id', respuesta.solicitud_id)
      }

      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_interconsultas_respuestas'] })
      queryClient.invalidateQueries({ queryKey: ['hosix_interconsultas_solicitudes'] })
      toast.success('Respuesta de interconsulta registrada')
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  return {
    solicitudes: solicitudesQuery.data || [],
    solicitudesLoading: solicitudesQuery.isLoading,
    respuestas: respuestasQuery.data || [],
    respuestasLoading: respuestasQuery.isLoading,
    crearSolicitud: crearSolicitudMutation.mutate,
    crearRespuesta: crearRespuestaMutation.mutate
  }
}
