import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/hosixClient'
import { toast } from 'sonner'

export const useHosixImagenologia = () => {
  const queryClient = useQueryClient()

  const modalidadesQuery = useQuery({
    queryKey: ['hosix_imagenologia_modalidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_imagenologia_modalidades')
        .select('*')
        .eq('activa', true)
        .order('nombre')
      if (error) throw error
      return data || []
    }
  })

  const solicitudesQuery = useQuery({
    queryKey: ['hosix_imagenologia_solicitudes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_imagenologia_solicitudes')
        .select('*')
        .order('fecha_solicitud', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const estudiosQuery = useQuery({
    queryKey: ['hosix_imagenologia_estudios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_imagenologia_estudios')
        .select('*')
        .order('fecha_hora_estudio', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const reportesQuery = useQuery({
    queryKey: ['hosix_imagenologia_reportes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_imagenologia_reportes')
        .select('*')
        .order('fecha_reporte', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const crearSolicitudMutation = useMutation({
    mutationFn: async (solicitud: any) => {
      const { data, error } = await supabase
        .from('hosix_imagenologia_solicitudes')
        .insert([solicitud])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_imagenologia_solicitudes'] })
      toast.success('Solicitud de imaginología creada')
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  const registrarEstudioMutation = useMutation({
    mutationFn: async (estudio: any) => {
      const { data, error } = await supabase
        .from('hosix_imagenologia_estudios')
        .insert([estudio])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_imagenologia_estudios'] })
      toast.success('Estudio registrado')
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  const crearReporteMutation = useMutation({
    mutationFn: async (reporte: any) => {
      const { data, error } = await supabase
        .from('hosix_imagenologia_reportes')
        .insert([reporte])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_imagenologia_reportes'] })
      toast.success('Reporte de imaginología creado')
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  return {
    modalidades: modalidadesQuery.data || [],
    modalidadesLoading: modalidadesQuery.isLoading,
    solicitudes: solicitudesQuery.data || [],
    solicitudesLoading: solicitudesQuery.isLoading,
    estudios: estudiosQuery.data || [],
    estudiosLoading: estudiosQuery.isLoading,
    reportes: reportesQuery.data || [],
    reportesLoading: reportesQuery.isLoading,
    crearSolicitud: crearSolicitudMutation.mutate,
    registrarEstudio: registrarEstudioMutation.mutate,
    crearReporte: crearReporteMutation.mutate
  }
}
