import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/hosixClient'
import { toast } from 'sonner'

export const useHosixLaboratorio = () => {
  const queryClient = useQueryClient()

  const pruebascatalogQuery = useQuery({
    queryKey: ['hosix_laboratorio_pruebas_catalogo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_laboratorio_pruebas_catalogo')
        .select('*')
        .eq('activa', true)
        .order('nombre')
      if (error) throw error
      return data || []
    }
  })

  const solicitudesQuery = useQuery({
    queryKey: ['hosix_laboratorio_solicitudes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_laboratorio_solicitudes')
        .select('*')
        .order('fecha_solicitud', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const resultadosQuery = useQuery({
    queryKey: ['hosix_laboratorio_resultados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_laboratorio_resultados')
        .select('*')
        .order('fecha_resultado', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const crearSolicitudMutation = useMutation({
    mutationFn: async (solicitud: any) => {
      const { data, error } = await supabase
        .from('hosix_laboratorio_solicitudes')
        .insert([solicitud])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_laboratorio_solicitudes'] })
      toast.success('Solicitud de laboratorio creada')
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  const registrarResultadoMutation = useMutation({
    mutationFn: async (resultado: any) => {
      const { data, error } = await supabase
        .from('hosix_laboratorio_resultados')
        .insert([resultado])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_laboratorio_resultados'] })
      queryClient.invalidateQueries({ queryKey: ['hosix_laboratorio_solicitudes'] })
      toast.success('Resultado registrado')
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  return {
    pruebas: pruebascatalogQuery.data || [],
    pruebasLoading: pruebascatalogQuery.isLoading,
    solicitudes: solicitudesQuery.data || [],
    solicitudesLoading: solicitudesQuery.isLoading,
    resultados: resultadosQuery.data || [],
    resultadosLoading: resultadosQuery.isLoading,
    crearSolicitud: crearSolicitudMutation.mutate,
    registrarResultado: registrarResultadoMutation.mutate
  }
}
