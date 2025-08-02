import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AccreditationUpdateResponse {
  success: boolean;
  message: string;
  total_processed: number;
  updated_count: number;
  expired_professionals: string[];
  processed_at: string;
}

export const useAccreditationStatusUpdate = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateAccreditationStatus = useMutation({
    mutationFn: async (): Promise<AccreditationUpdateResponse> => {
      try {
        const { data, error } = await supabase.functions.invoke('update-accreditation-status', {
          body: {},
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(`Error al actualizar estados: ${error.message}`);
        }

        return data;
      } catch (networkError) {
        console.error('Network/connection error:', networkError);
        throw new Error(`Error de conexión: ${networkError.message}`);
      }
    },
    onSuccess: (data) => {
      console.log("Actualización de estados exitosa:", data);
      
      if (data.updated_count > 0) {
        toast({
          title: "Estados Actualizados",
          description: `${data.updated_count} profesionales han sido marcados como vencidos automáticamente.`,
        });
      }

      // Invalidar consultas relacionadas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ["public-search"] });
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (error) => {
      console.error("Error updating accreditation status:", error);
      toast({
        title: "Error en Actualización",
        description: "No se pudieron actualizar algunos estados de acreditación automáticamente.",
        variant: "destructive",
      });
    },
  });

  return {
    updateAccreditationStatus: updateAccreditationStatus.mutate,
    isUpdating: updateAccreditationStatus.isPending,
    isError: updateAccreditationStatus.isError,
    error: updateAccreditationStatus.error,
  };
};
