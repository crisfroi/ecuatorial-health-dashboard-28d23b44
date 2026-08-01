import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Tarifa {
  id: string;
  concepto_id: string;
  aseguradora_id?: string;
  precio: number;
  vigente_desde: string;
  vigente_hasta?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTarifaInput {
  concepto_id: string;
  aseguradora_id?: string;
  precio: number;
  vigente_desde: string;
  vigente_hasta?: string;
  activo: boolean;
}

export interface UpdateTarifaInput extends Partial<CreateTarifaInput> {
  id: string;
}

export function useRenaperosaTarifas(conceptoId?: string, aseguradoraId?: string) {
  const queryClient = useQueryClient();

  // Obtener todas las tarifas (o filtradas)
  const {
    data: tarifas = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['renaprosa_tarifas', conceptoId, aseguradoraId],
    queryFn: async () => {
      let query = supabase
        .from('renaprosa_tarifas')
        .select('*');

      if (conceptoId) {
        query = query.eq('concepto_id', conceptoId);
      }
      if (aseguradoraId) {
        query = query.eq('aseguradora_id', aseguradoraId);
      }

      const { data, error } = await query.order('vigente_desde', { ascending: false });

      if (error) throw error;
      return (data || []) as Tarifa[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Crear tarifa
  const {
    mutate: crearTarifa,
    isPending: isCreating,
    error: createError,
  } = useMutation({
    mutationFn: async (input: CreateTarifaInput) => {
      const { data, error } = await supabase
        .from('renaprosa_tarifas')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renaprosa_tarifas'] });
      toast.success('Tarifa creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al crear tarifa: ${error.message}`);
    },
  });

  // Actualizar tarifa
  const {
    mutate: actualizarTarifa,
    isPending: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: async (input: UpdateTarifaInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('renaprosa_tarifas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renaprosa_tarifas'] });
      toast.success('Tarifa actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar tarifa: ${error.message}`);
    },
  });

  // Eliminar tarifa
  const {
    mutate: eliminarTarifa,
    isPending: isDeleting,
    error: deleteError,
  } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('renaprosa_tarifas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renaprosa_tarifas'] });
      toast.success('Tarifa eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar tarifa: ${error.message}`);
    },
  });

  // Obtener tarifa por ID
  const obtenerTarifaPorId = async (id: string) => {
    const { data, error } = await supabase
      .from('renaprosa_tarifas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Tarifa;
  };

  // Obtener tarifas vigentes
  const obtenerTarifasVigentes = async () => {
    const hoy = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('renaprosa_tarifas')
      .select('*')
      .lte('vigente_desde', hoy)
      .or(`vigente_hasta.is.null,vigente_hasta.gte.${hoy}`)
      .eq('activo', true);

    if (error) throw error;
    return (data || []) as Tarifa[];
  };

  // Obtener tarifa para un concepto y aseguradora
  const obtenerTarifaConcepto = async (conceptoId: string, aseguradoraId?: string) => {
    const hoy = new Date().toISOString().split('T')[0];
    
    let query = supabase
      .from('renaprosa_tarifas')
      .select('*')
      .eq('concepto_id', conceptoId)
      .lte('vigente_desde', hoy)
      .or(`vigente_hasta.is.null,vigente_hasta.gte.${hoy}`)
      .eq('activo', true);

    if (aseguradoraId) {
      query = query.eq('aseguradora_id', aseguradoraId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data as Tarifa | null;
  };

  return {
    tarifas,
    isLoading,
    error,
    refetch,
    crearTarifa,
    isCreating,
    createError,
    actualizarTarifa,
    isUpdating,
    updateError,
    eliminarTarifa,
    isDeleting,
    deleteError,
    obtenerTarifaPorId,
    obtenerTarifasVigentes,
    obtenerTarifaConcepto,
  };
}
