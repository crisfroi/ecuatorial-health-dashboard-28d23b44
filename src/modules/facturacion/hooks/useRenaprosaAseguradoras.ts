import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Aseguradora {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAseguradoraInput {
  codigo: string;
  nombre: string;
  tipo: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  activo: boolean;
}

export interface UpdateAseguradoraInput extends Partial<CreateAseguradoraInput> {
  id: string;
}

export function useRenaprosaAseguradoras() {
  const queryClient = useQueryClient();

  // Obtener todas las aseguradoras
  const {
    data: aseguradoras = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['renaprosa_aseguradoras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('renaprosa_aseguradoras')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      return (data || []) as Aseguradora[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Crear aseguradora
  const {
    mutate: crearAseguradora,
    isPending: isCreating,
    error: createError,
  } = useMutation({
    mutationFn: async (input: CreateAseguradoraInput) => {
      const { data, error } = await supabase
        .from('renaprosa_aseguradoras')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renaprosa_aseguradoras'] });
      toast.success('Aseguradora creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al crear aseguradora: ${error.message}`);
    },
  });

  // Actualizar aseguradora
  const {
    mutate: actualizarAseguradora,
    isPending: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: async (input: UpdateAseguradoraInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('renaprosa_aseguradoras')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renaprosa_aseguradoras'] });
      toast.success('Aseguradora actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar aseguradora: ${error.message}`);
    },
  });

  // Eliminar aseguradora
  const {
    mutate: eliminarAseguradora,
    isPending: isDeleting,
    error: deleteError,
  } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('renaprosa_aseguradoras')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renaprosa_aseguradoras'] });
      toast.success('Aseguradora eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar aseguradora: ${error.message}`);
    },
  });

  // Obtener aseguradora por ID
  const obtenerAseguradoraPorId = async (id: string) => {
    const { data, error } = await supabase
      .from('renaprosa_aseguradoras')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Aseguradora;
  };

  // Obtener aseguradoras activas
  const obtenerAseguradorasActivas = async () => {
    const { data, error } = await supabase
      .from('renaprosa_aseguradoras')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) throw error;
    return (data || []) as Aseguradora[];
  };

  return {
    aseguradoras,
    isLoading,
    error,
    refetch,
    crearAseguradora,
    isCreating,
    createError,
    actualizarAseguradora,
    isUpdating,
    updateError,
    eliminarAseguradora,
    isDeleting,
    deleteError,
    obtenerAseguradoraPorId,
    obtenerAseguradorasActivas,
  };
}
