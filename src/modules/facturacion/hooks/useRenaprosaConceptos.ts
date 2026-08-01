import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ConceptoMaestro {
  id: string;
  codigo: string;
  descripcion: string;
  tipo_concepto: string;
  precio_base: number;
  usa_tarifacion_dinamica: boolean;
  visible_aseguradoras: boolean;
  snomed_code?: string;
  cpt_code?: string;
  nota?: string;
  activo: boolean;
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
}

export interface CreateConceptoInput {
  codigo: string;
  descripcion: string;
  tipo_concepto: string;
  precio_base: number;
  usa_tarifacion_dinamica: boolean;
  visible_aseguradoras: boolean;
  snomed_code?: string;
  cpt_code?: string;
  nota?: string;
  activo: boolean;
}

export interface UpdateConceptoInput extends Partial<CreateConceptoInput> {
  id: string;
}

export function useRenaprosaConceptos() {
  const queryClient = useQueryClient();

  // Obtener todos los conceptos
  const {
    data: conceptos = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['renaprosa_conceptos_maestro'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('renaprosa_conceptos_maestro')
        .select('*')
        .order('codigo', { ascending: true });

      if (error) throw error;
      return (data || []) as ConceptoMaestro[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Crear concepto
  const {
    mutate: crearConcepto,
    isPending: isCreating,
    error: createError,
  } = useMutation({
    mutationFn: async (input: CreateConceptoInput) => {
      const { data, error } = await supabase
        .from('renaprosa_conceptos_maestro')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renaprosa_conceptos_maestro'] });
      toast.success('Concepto creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al crear concepto: ${error.message}`);
    },
  });

  // Actualizar concepto
  const {
    mutate: actualizarConcepto,
    isPending: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: async (input: UpdateConceptoInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('renaprosa_conceptos_maestro')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renaprosa_conceptos_maestro'] });
      toast.success('Concepto actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar concepto: ${error.message}`);
    },
  });

  // Eliminar concepto
  const {
    mutate: eliminarConcepto,
    isPending: isDeleting,
    error: deleteError,
  } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('renaprosa_conceptos_maestro')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renaprosa_conceptos_maestro'] });
      toast.success('Concepto eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar concepto: ${error.message}`);
    },
  });

  // Obtener concepto por ID
  const obtenerConceptoPorId = async (id: string) => {
    const { data, error } = await supabase
      .from('renaprosa_conceptos_maestro')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ConceptoMaestro;
  };

  // Obtener conceptos por tipo
  const obtenerConceptosPorTipo = async (tipo: string) => {
    const { data, error } = await supabase
      .from('renaprosa_conceptos_maestro')
      .select('*')
      .eq('tipo_concepto', tipo)
      .order('descripcion', { ascending: true });

    if (error) throw error;
    return (data || []) as ConceptoMaestro[];
  };

  return {
    conceptos,
    isLoading,
    error,
    refetch,
    crearConcepto,
    isCreating,
    createError,
    actualizarConcepto,
    isUpdating,
    updateError,
    eliminarConcepto,
    isDeleting,
    deleteError,
    obtenerConceptoPorId,
    obtenerConceptosPorTipo,
  };
}
