import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/utils/errorHandler";
import { useCarnetGeneration } from "./useCarnetGeneration";
import type { ProfesionalUpdate } from "./useProfesionales";

export const useProfesionalesMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateProfesionalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProfesionalUpdate }) => {
      console.log("Updating professional:", id, updates);

      try {
        const { data, error } = await supabase
          .from("profesionales_sanitarios")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error("Supabase error updating professional:", {
            error,
            id,
            updates,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw new Error(getErrorMessage(error));
        }

        if (!data) {
          throw new Error("No data returned from update operation");
        }

        return data;
      } catch (networkError) {
        console.error("Network/connection error:", networkError);
        throw new Error(getErrorMessage(networkError));
      }
    },
    onSuccess: (data) => {
      console.log("Professional updated successfully:", data.id);
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["centros"] });
      toast({
        title: "Profesional actualizado",
        description: "Los datos del profesional han sido actualizados exitosamente.",
      });
    },
    onError: (error: any) => {
      console.error("Error updating professional:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        title: "Error al actualizar",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteProfesionalMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting professional:", id);
      
      const { error } = await supabase
        .from("profesionales_sanitarios")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting professional:", error);
        throw error;
      }

      return id;
    },
    onSuccess: (id) => {
      console.log("Professional deleted successfully:", id);
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["centros"] });
      toast({
        title: "Profesional eliminado",
        description: "El profesional ha sido eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting professional:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        title: "Error al eliminar",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; changes: ProfesionalUpdate }>) => {
      console.log("Bulk updating professionals:", updates.length);
      
      const results = await Promise.all(
        updates.map(async ({ id, changes }) => {
          const { data, error } = await supabase
            .from("profesionales_sanitarios")
            .update(changes)
            .eq("id", id)
            .select()
            .single();

          if (error) {
            console.error(`Error updating professional ${id}:`, error);
            throw error;
          }

          return data;
        })
      );

      return results;
    },
    onSuccess: (results) => {
      console.log("Bulk update completed successfully:", results.length);
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["centros"] });
      toast({
        title: "Actualización masiva completada",
        description: `Se actualizaron ${results.length} profesionales exitosamente.`,
      });
    },
    onError: (error: any) => {
      console.error("Error in bulk update:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        title: "Error en actualización masiva",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return {
    updateProfesional: updateProfesionalMutation,
    deleteProfesional: deleteProfesionalMutation,
    bulkUpdate: bulkUpdateMutation,
    // Provide isPending instead of isLoading for compatibility
    isUpdating: updateProfesionalMutation.isPending,
    isDeleting: deleteProfesionalMutation.isPending,
    isBulkUpdating: bulkUpdateMutation.isPending,
  };
};
