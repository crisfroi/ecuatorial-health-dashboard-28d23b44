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
      let response: Response;
      let text: string;

      try {
        // Get current session for authentication
        const { data: { session } } = await supabase.auth.getSession();

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8",
          "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8`,
        };

        // Override with user token if available for better auth
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        response = await fetch(
          "https://wdieynendfjbkbhfovrx.supabase.co/functions/v1/update-accreditation-status",
          {
            method: "POST",
            headers,
            body: JSON.stringify({}),
          }
        );

        text = await response.text();
      } catch (networkError) {
        console.error('Network/connection error:', networkError);
        throw new Error(`Error de conexión: ${networkError.message}`);
      }

      if (!response.ok) {
        console.error('Function response error:', {
          status: response.status,
          statusText: response.statusText,
          text
        });
        throw new Error(`Error al actualizar estados (${response.status}): ${text}`);
      }

      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Text:', text);
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
