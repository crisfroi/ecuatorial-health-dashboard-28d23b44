import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/hosixClient'
import { toast } from 'sonner'

export const useHosixCRED = () => {
  const queryClient = useQueryClient()

  const seguimientosQuery = useQuery({
    queryKey: ['hosix_cred_seguimiento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_cred_seguimiento')
        .select('*')
        .order('fecha_control', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const vacunacionesQuery = useQuery({
    queryKey: ['hosix_cred_vacunacion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_cred_vacunacion')
        .select('*')
        .order('fecha_vacunacion', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const crearSeguimientoMutation = useMutation({
    mutationFn: async (seguimiento: any) => {
      const { data, error } = await supabase
        .from('hosix_cred_seguimiento')
        .insert([seguimiento])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_cred_seguimiento'] })
      toast.success('Seguimiento CRED registrado')
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  const registrarVacunaMutation = useMutation({
    mutationFn: async (vacunacion: any) => {
      const { data, error } = await supabase
        .from('hosix_cred_vacunacion')
        .insert([vacunacion])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_cred_vacunacion'] })
      toast.success('Vacuna registrada')
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  return {
    seguimientos: seguimientosQuery.data || [],
    seguimientosLoading: seguimientosQuery.isLoading,
    vacunaciones: vacunacionesQuery.data || [],
    vacunacionesLoading: vacunacionesQuery.isLoading,
    crearSeguimiento: crearSeguimientoMutation.mutate,
    registrarVacuna: registrarVacunaMutation.mutate
  }
}
