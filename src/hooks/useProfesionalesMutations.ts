import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/utils/errorHandler";
import { useCarnetGeneration } from "./useCarnetGeneration";
import type { ProfesionalUpdate } from "./useProfesionales";

export const useProfesionalesMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { generateCarnetAfterStatusChange } = useCarnetGeneration();

  const updateProfesionalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProfesionalUpdate }) => {
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(getErrorMessage(error));
      if (!data) throw new Error("No data returned from update operation");
      return data;
    },
    onSuccess: async (data, variables) => {
      const newStatus = variables.updates.estado_solicitud;
      // El carnet se genera al entrar en cualquiera de los estados que lo habilitan.
      if (newStatus === "Pendiente de Firma" || newStatus === "Aprobado") {
        try {
          await generateCarnetAfterStatusChange(data.id);
        } catch (error) {
          toast({
            title: "Carnet no generado",
            description: `El profesional se actualizó, pero el carnet no pudo generarse: ${getErrorMessage(error)}`,
            variant: "destructive",
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["centros"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["carnets"] });
      toast({ title: "Profesional actualizado", description: "Los datos del profesional han sido actualizados exitosamente." });
    },
    onError: (error: any) => toast({
      title: "Error al actualizar",
      description: getErrorMessage(error),
      variant: "destructive",
    }),
  });

  const deleteProfesionalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profesionales_sanitarios").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["centros"] });
      toast({ title: "Profesional eliminado", description: "El profesional ha sido eliminado exitosamente." });
    },
    onError: (error: any) => toast({ title: "Error al eliminar", description: getErrorMessage(error), variant: "destructive" }),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; changes: ProfesionalUpdate }>) => {
      const results = await Promise.all(updates.map(async ({ id, changes }) => {
        const { data, error } = await supabase.from("profesionales_sanitarios").update(changes).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }));
      return results;
    },
    onSuccess: async (results, variables) => {
      const carnetIds = variables
        .filter(({ changes }) => changes.estado_solicitud === "Pendiente de Firma" || changes.estado_solicitud === "Aprobado")
        .map(({ id }) => id);
      if (carnetIds.length) {
        try { await generateCarnetAfterStatusChange(carnetIds); }
        catch (error) {
          toast({ title: "Carnets no generados", description: getErrorMessage(error), variant: "destructive" });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["centros"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["carnets"] });
      toast({ title: "Actualización masiva completada", description: `Se actualizaron ${results.length} profesionales exitosamente.` });
    },
    onError: (error: any) => toast({ title: "Error en actualización masiva", description: getErrorMessage(error), variant: "destructive" }),
  });

  return {
    updateProfesional: updateProfesionalMutation,
    deleteProfesional: deleteProfesionalMutation,
    bulkUpdate: bulkUpdateMutation,
    isUpdating: updateProfesionalMutation.isPending,
    isDeleting: deleteProfesionalMutation.isPending,
    isBulkUpdating: bulkUpdateMutation.isPending,
  };
};
