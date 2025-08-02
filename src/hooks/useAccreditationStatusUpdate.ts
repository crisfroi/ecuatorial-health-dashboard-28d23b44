import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
      const SUPABASE_URL = "https://wdieynendfjbkbhfovrx.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8";

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/update-accreditation-status`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Error al actualizar estados: ${text}`);
      }

      try {
        return JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Error parsing response: ${parseError}`);
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
