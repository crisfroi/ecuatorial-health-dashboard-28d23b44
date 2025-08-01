
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useProfesionalesMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateProfesional = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      console.log("Actualizando profesional:", id, updates);

      // Si se está cambiando a "Pendiente de Firma", establecer fechas
      if (updates.estado_solicitud === "Pendiente de Firma") {
        updates.fecha_alta = new Date().toISOString().split("T")[0];
        updates.fecha_aprobacion = new Date().toISOString().split("T")[0];
        
        // Verificar que el profesional tenga los campos requeridos para generar carnet
        const { data: profesional, error: errorCheck } = await supabase
          .from("profesionales_sanitarios")
          .select("id_profesional_unico, url_codigo_barras")
          .eq("id", id)
          .single();

        if (errorCheck) {
          throw new Error(`Error al verificar datos del profesional: ${errorCheck.message}`);
        }

        if (!profesional?.id_profesional_unico) {
          throw new Error("El profesional debe tener un ID profesional único antes de generar el carnet");
        }

        if (!profesional?.url_codigo_barras) {
          throw new Error("El profesional debe tener un código de barras generado antes de generar el carnet");
        }

        console.log("Profesional tiene los datos requeridos para generar carnet");
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

      // Si se cambió a "Pendiente de Firma", mostrar mensaje sobre generación de carnet
      if (updates.estado_solicitud === "Pendiente de Firma") {
        console.log("El carnet se generará automáticamente en segundo plano");
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidar múltiples consultas para asegurar que se actualicen
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas-avanzadas"] });

      // Refrescar datos específicos
      queryClient.refetchQueries({ queryKey: ["profesionales"] });

      let mensaje = "El estado del profesional ha sido actualizado correctamente.";
      
      // Mensaje específico para generación de carnet
      if (variables.updates.estado_solicitud === "Pendiente de Firma") {
        mensaje = "El profesional fue aprobado y su carnet se está generando automáticamente.";
      }

      toast({
        title: "Éxito",
        description: mensaje,
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
