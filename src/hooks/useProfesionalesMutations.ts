import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useProfesionalesMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateProfesional = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      console.log("Actualizando profesional:", id, updates);

      // Si se está cambiando a "Pendiente de Firma", generar automáticamente el carnet
      if (updates.estado_solicitud === "Pendiente de Firma") {
        updates.fecha_alta = new Date().toISOString().split("T")[0];
        updates.fecha_aprobacion = new Date().toISOString().split("T")[0];
      }

      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating professional:", error.message || error);
        throw new Error(`Error al actualizar: ${error.message}`);
      }

      console.log("Profesional actualizado exitosamente:", data);
      return data;
    },
    onSuccess: (data) => {
      // Invalidar múltiples consultas para asegurar que se actualicen
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas-avanzadas"] });

      // Refrescar datos específicos
      queryClient.refetchQueries({ queryKey: ["profesionales"] });

      toast({
        title: "Éxito",
        description:
          "El estado del profesional ha sido actualizado correctamente.",
      });
    },
    onError: (error: any) => {
      console.error("Error en mutación:", error.message || error);
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
        .from("profesionales_sanitarios")
        .delete()
        .eq("id", id);

      if (error) throw new Error(`Error al eliminar: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
      queryClient.refetchQueries({ queryKey: ["profesionales"] });
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
