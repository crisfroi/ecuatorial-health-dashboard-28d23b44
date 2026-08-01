import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/hosixClient'
import { toast } from 'sonner'

export const useHosixFarmacia = () => {
  const queryClient = useQueryClient()

  const dispensariosQuery = useQuery({
    queryKey: ['hosix_farmacia_dispensario'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_farmacia_dispensario')
        .select('*')
        .order('nombre')
      if (error) throw error
      return data || []
    }
  })

  const dispensacionesQuery = useQuery({
    queryKey: ['hosix_farmacia_dispensaciones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_farmacia_dispensaciones')
        .select('*')
        .order('fecha_dispensacion', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const farmacovigilanciaQuery = useQuery({
    queryKey: ['hosix_farmacia_farmacovigilancia'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_farmacia_farmacovigilancia')
        .select('*')
        .order('fecha_evento', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const crearDispensacionMutation = useMutation({
    mutationFn: async (dispensacion: any) => {
      const { data, error } = await supabase
        .from('hosix_farmacia_dispensaciones')
        .insert([dispensacion])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_farmacia_dispensaciones'] })
      toast.success('Medicamento dispensado')
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  const reportarEventoMutation = useMutation({
    mutationFn: async (evento: any) => {
      const { data, error } = await supabase
        .from('hosix_farmacia_farmacovigilancia')
        .insert([evento])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_farmacia_farmacovigilancia'] })
      toast.success('Evento reportado a farmacovigilancia')
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  return {
    dispensarios: dispensariosQuery.data || [],
    dispensariosLoading: dispensariosQuery.isLoading,
    dispensaciones: dispensacionesQuery.data || [],
    dispensacionesLoading: dispensacionesQuery.isLoading,
    farmacovigilancia: farmacovigilanciaQuery.data || [],
    farmacovigilanciaLoading: farmacovigilanciaQuery.isLoading,
    crearDispensacion: crearDispensacionMutation.mutate,
    reportarEvento: reportarEventoMutation.mutate
  }
}
