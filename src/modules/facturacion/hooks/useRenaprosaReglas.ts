import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReglaTarifacion {
  id: string;
  concepto_id: string;
  nombre: string;
  tipo_regla: string;
  condicion_json: Record<string, any>;
  tipo_aplicacion: string;
  valor_aplicacion: number;
  orden_aplicacion: number;
  permitir_acumulacion: boolean;
  es_descuento: boolean;
  precio_minimo?: number;
  precio_maximo?: number;
  requiere_aprobacion: boolean;
  activo: boolean;
  nota?: string;
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
}

export interface CreateReglaInput {
  concepto_id: string;
  nombre: string;
  tipo_regla: string;
  condicion_json: Record<string, any>;
  tipo_aplicacion: string;
  valor_aplicacion: number;
  orden_aplicacion: number;
  permitir_acumulacion: boolean;
  es_descuento: boolean;
  precio_minimo?: number;
  precio_maximo?: number;
  requiere_aprobacion: boolean;
  activo: boolean;
  nota?: string;
}

export interface UpdateReglaInput extends Partial<CreateReglaInput> {
  id: string;
}

export function useRenaprosaReglas(conceptoId?: string) {
  const queryClient = useQueryClient();

  // Obtener todas las reglas (o filtradas por concepto)
  const {
    data: reglas = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['renaprosa_reglas_tarifacion', conceptoId],
    queryFn: async () => {
      let query = supabase
        .from('renaprosa_reglas_tarifacion')
        .select('*');

      if (conceptoId) {
        query = query.eq('concepto_id', conceptoId);
      }

      const { data, error } = await query.order('orden_aplicacion', { ascending: true });

      if (error) throw error;
      return (data || []) as ReglaTarifacion[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Crear regla
  const {
    mutate: crearRegla,
    isPending: isCreating,
    error: createError,
  } = useMutation({
    mutationFn: async (input: CreateReglaInput) => {
      const { data, error } = await supabase
        .from('renaprosa_reglas_tarifacion')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renaprosa_reglas_tarifacion'] });
      toast.success('Regla creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al crear regla: ${error.message}`);
    },
  });

  // Actualizar regla
  const {
    mutate: actualizarRegla,
    isPending: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: async (input: UpdateReglaInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('renaprosa_reglas_tarifacion')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renaprosa_reglas_tarifacion'] });
      toast.success('Regla actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar regla: ${error.message}`);
    },
  });

  // Eliminar regla
  const {
    mutate: eliminarRegla,
    isPending: isDeleting,
    error: deleteError,
  } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('renaprosa_reglas_tarifacion')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renaprosa_reglas_tarifacion'] });
      toast.success('Regla eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar regla: ${error.message}`);
    },
  });

  // Obtener regla por ID
  const obtenerReglaPorId = async (id: string) => {
    const { data, error } = await supabase
      .from('renaprosa_reglas_tarifacion')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ReglaTarifacion;
  };

  // Obtener reglas por concepto
  const obtenerReglasPorConcepto = async (conceptoId: string) => {
    const { data, error } = await supabase
      .from('renaprosa_reglas_tarifacion')
      .select('*')
      .eq('concepto_id', conceptoId)
      .order('orden_aplicacion', { ascending: true });

    if (error) throw error;
    return (data || []) as ReglaTarifacion[];
  };

  // Obtener reglas por tipo
  const obtenerReglasPorTipo = async (tipo: string) => {
    const { data, error } = await supabase
      .from('renaprosa_reglas_tarifacion')
      .select('*')
      .eq('tipo_regla', tipo)
      .order('orden_aplicacion', { ascending: true });

    if (error) throw error;
    return (data || []) as ReglaTarifacion[];
  };

  // Ver reglas por concepto (desde vista)
  const obtenerVwReglasPorConcepto = async () => {
    const { data, error } = await supabase
      .from('vw_reglas_tarifacion_por_concepto')
      .select('*');

    if (error) throw error;
    return data || [];
  };

  return {
    reglas,
    isLoading,
    error,
    refetch,
    crearRegla,
    isCreating,
    createError,
    actualizarRegla,
    isUpdating,
    updateError,
    eliminarRegla,
    isDeleting,
    deleteError,
    obtenerReglaPorId,
    obtenerReglasPorConcepto,
    obtenerReglasPorTipo,
    obtenerVwReglasPorConcepto,
  };
}
