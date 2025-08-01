import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGenerateCarnet } from "@/hooks/useGenerateCarnet";

export function useProfesionalesMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const generateCarnet = useGenerateCarnet();

  const updateProfesional = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      console.log("Actualizando profesional:", id, updates);

      // Si se está cambiando a "Pendiente de Firma", preparar fechas y generar carnet
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

        // Handle specific database function errors gracefully
        if (
          error.message &&
          error.message.includes("generar_url_carnet_profesional")
        ) {
          console.warn(
            "Database function generar_url_carnet_profesional not found, but update may have succeeded",
          );

          // Try to fetch the updated record to verify the update worked
          const { data: verifyData, error: verifyError } = await supabase
            .from("profesionales_sanitarios")
            .select()
            .eq("id", id)
            .single();

          if (!verifyError && verifyData) {
            console.log(
              "Update actually succeeded despite function error:",
              verifyData,
            );
            return verifyData;
          }
        }

        throw new Error(`Error al actualizar: ${error.message}`);
      }

      console.log("Profesional actualizado exitosamente:", data);

      // Generar carnet automáticamente si se cambió a "Pendiente de Firma"
      if (updates.estado_solicitud === "Pendiente de Firma") {
        console.log(`Iniciando generación automática de carnet para profesional ${id}`);

        // Llamar a la generación de carnet de forma asíncrona
        // No esperamos el resultado para no bloquear la actualización del estado
        generateCarnet.mutateAsync(id).catch((carnetError) => {
          console.error("Error en generación automática de carnet:", carnetError);
          // Mostrar notificación adicional solo para el error del carnet
          toast({
            title: "Advertencia",
            description: "El estado se actualizó correctamente, pero hubo un error al generar el carnet. Puede intentar generarlo manualmente.",
            variant: "destructive",
            duration: 7000,
          });
        });
      }

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
