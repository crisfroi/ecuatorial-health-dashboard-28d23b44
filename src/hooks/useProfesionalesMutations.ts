
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
      console.log("🔄 Actualizando profesional:", id, updates);

      try {
        // Si se está cambiando a "Pendiente de Firma", preparar datos y validar
        if (updates.estado_solicitud === "Pendiente de Firma") {
          console.log("📋 Preparando cambio a 'Pendiente de Firma'");
          
          // Establecer fechas automáticamente
          updates.fecha_alta = new Date().toISOString().split("T")[0];
          updates.fecha_aprobacion = new Date().toISOString().split("T")[0];
          
          // Verificar que el profesional tenga los campos requeridos
          const { data: profesional, error: errorCheck } = await supabase
            .from("profesionales_sanitarios")
            .select("id_profesional_unico, url_codigo_barras, codigo_barras")
            .eq("id", id)
            .single();

          if (errorCheck) {
            console.error("❌ Error al verificar datos:", errorCheck);
            throw new Error(`Error al verificar datos del profesional: ${errorCheck.message}`);
          }

          console.log("📊 Datos del profesional:", profesional);

          // Verificar campos requeridos
          if (!profesional?.id_profesional_unico) {
            console.warn("⚠️ Falta ID profesional único, se generará automáticamente");
          }

          console.log("✅ Profesional validado para cambio de estado");
        }

        // Realizar la actualización
        console.log("💾 Ejecutando actualización en base de datos...");
        const { data, error } = await supabase
          .from("profesionales_sanitarios")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error("❌ Error en actualización:", error);
          throw new Error(`Error al actualizar: ${error.message}`);
        }

        console.log("✅ Profesional actualizado exitosamente:", data);

        // Generar carnet automáticamente si se cambió a "Pendiente de Firma"
        if (updates.estado_solicitud === "Pendiente de Firma") {
          console.log("🎫 Iniciando generación automática de carnet para profesional", id);

          // Dar un momento para que los triggers de la base de datos se ejecuten
          setTimeout(() => {
            generateCarnet.mutateAsync(id)
              .then((carnetResult) => {
                console.log("✅ Carnet generado automáticamente:", carnetResult);
                
                // Invalidar queries para refrescar datos
                queryClient.invalidateQueries({ queryKey: ["profesionales"] });
                
                toast({
                  title: "🎫 Carnet generado",
                  description: "El carnet profesional se ha generado automáticamente y está listo para descarga.",
                  duration: 5000,
                });
              })
              .catch((carnetError) => {
                console.error("❌ Error en generación automática de carnet:", carnetError);
                toast({
                  title: "⚠️ Advertencia",
                  description: "El estado se actualizó correctamente, pero hubo un problema al generar el carnet. Puede intentar generarlo manualmente.",
                  variant: "destructive",
                  duration: 7000,
                });
              });
          }, 1000);
        }

        return data;

      } catch (error: any) {
        console.error("❌ Error en mutación completa:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log("🎉 Mutación exitosa para:", variables.id);
      
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
        title: "✅ Éxito",
        description: mensaje,
      });
    },
    onError: (error: any) => {
      console.error("❌ Error en mutación:", error);
      
      let errorMessage = error.message || "Error desconocido al actualizar el estado";
      
      // Mensajes de error más específicos
      if (errorMessage.includes("violates check constraint")) {
        errorMessage = "Error de validación: Los datos no cumplen con las restricciones de la base de datos.";
      } else if (errorMessage.includes("foreign key")) {
        errorMessage = "Error: Referencia a datos inexistentes.";
      } else if (errorMessage.includes("permission")) {
        errorMessage = "Error de permisos: No tiene autorización para esta operación.";
      }
      
      toast({
        title: "❌ Error",
        description: `No se pudo actualizar el estado: ${errorMessage}`,
        variant: "destructive",
        duration: 8000,
      });
    },
  });

  const updateMultipleProfesionales = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: any }) => {
      console.log("🔄 Actualizando múltiples profesionales:", ids.length, "profesionales");

      const results = [];
      const errors = [];

      // Procesar cada profesional individualmente para mejor control de errores
      for (const id of ids) {
        try {
          console.log(`📋 Procesando profesional ${id}...`);
          
          let profesionalUpdates = { ...updates };

          // Si se está cambiando a "Pendiente de Firma", preparar datos
          if (updates.estado_solicitud === "Pendiente de Firma") {
            profesionalUpdates.fecha_alta = new Date().toISOString().split("T")[0];
            profesionalUpdates.fecha_aprobacion = new Date().toISOString().split("T")[0];
          }

          const { data, error } = await supabase
            .from("profesionales_sanitarios")
            .update(profesionalUpdates)
            .eq("id", id)
            .select()
            .single();

          if (error) {
            console.error(`❌ Error actualizando ${id}:`, error);
            errors.push({ id, error: error.message });
          } else {
            console.log(`✅ Actualizado exitosamente: ${id}`);
            results.push(data);
            
            // Si cambió a "Pendiente de Firma", programar generación de carnet
            if (updates.estado_solicitud === "Pendiente de Firma") {
              setTimeout(() => {
                generateCarnet.mutate(id);
              }, 500 * results.length); // Escalonar las generaciones
            }
          }
        } catch (error: any) {
          console.error(`❌ Error procesando ${id}:`, error);
          errors.push({ id, error: error.message });
        }
      }

      if (errors.length > 0) {
        console.warn(`⚠️ Se completaron ${results.length} actualizaciones, ${errors.length} fallaron`);
        if (results.length === 0) {
          throw new Error(`Todas las actualizaciones fallaron. Primer error: ${errors[0].error}`);
        }
      }

      return {
        success: results.length,
        errors: errors.length,
        results,
        errorDetails: errors
      };
    },
    onSuccess: (data) => {
      console.log("🎉 Actualización múltiple completada:", data);
      
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas-avanzadas"] });
      queryClient.refetchQueries({ queryKey: ["profesionales"] });

      let mensaje = `Se actualizaron exitosamente ${data.success} profesionales.`;
      if (data.errors > 0) {
        mensaje += ` ${data.errors} actualizaciones fallaron.`;
      }

      toast({
        title: data.errors === 0 ? "✅ Éxito completo" : "⚠️ Éxito parcial",
        description: mensaje,
        variant: data.errors === 0 ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      console.error("❌ Error en actualización múltiple:", error);
      toast({
        title: "❌ Error",
        description: `Error en actualización múltiple: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteProfesional = useMutation({
    mutationFn: async (id: string) => {
      console.log("🗑️ Eliminando profesional:", id);
      
      const { error } = await supabase
        .from("profesionales_sanitarios")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("❌ Error eliminando:", error);
        throw new Error(`Error al eliminar: ${error.message}`);
      }
      
      console.log("✅ Profesional eliminado exitosamente");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
      queryClient.refetchQueries({ queryKey: ["profesionales"] });
      toast({
        title: "✅ Éxito",
        description: "El profesional ha sido eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: `No se pudo eliminar el profesional: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    updateProfesional,
    updateMultipleProfesionales,
    deleteProfesional,
  };
}

// Export with both names for backward compatibility
export const useActualizarProfesional = () => {
  const { updateProfesional } = useProfesionalesMutations();
  return updateProfesional;
};
