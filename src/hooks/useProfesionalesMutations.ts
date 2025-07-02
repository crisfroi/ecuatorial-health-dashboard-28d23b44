
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useProfesionalesMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateProfesional = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      console.log('Actualizando profesional:', id, updates);
      
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating professional:', error);
        throw error;
      }

      console.log('Profesional actualizado:', data);
      return data;
    },
    onSuccess: (data) => {
      // Invalidar y refrescar las consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-avanzadas'] });
      
      toast({
        title: "Éxito",
        description: "El estado del profesional ha sido actualizado correctamente.",
      });
    },
    onError: (error: any) => {
      console.error('Error en mutación:', error);
      toast({
        title: "Error",
        description: `No se pudo actualizar el estado: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteProfesional = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('profesionales_sanitarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      toast({
        title: "Éxito",
        description: "El profesional ha sido eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar el profesional: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    updateProfesional,
    deleteProfesional,
  };
}

// Export with both names for backward compatibility
export const useActualizarProfesional = () => {
  const { updateProfesional } = useProfesionalesMutations();
  return updateProfesional;
};
