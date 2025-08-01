import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useGenerateCarnet() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (profesionalId: string) => {
      console.log(`Iniciando generación de carnet para profesional: ${profesionalId}`);

      try {
        // Obtener la sesión actual para la autorización
        const { data: { session } } = await supabase.auth.getSession();
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        // Llamar a la edge function para generar el carnet
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generar-carnet-profesional?id=${profesionalId}`,
          {
            method: 'GET',
            headers,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || 
            errorData?.details || 
            `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || result.details || 'Error desconocido al generar carnet');
        }

        console.log('Carnet generado exitosamente:', result);
        return result;

      } catch (error: any) {
        console.error('Error al generar carnet:', error);
        throw new Error(`Error al generar carnet: ${error.message}`);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Carnet generado",
        description: `El carnet profesional ha sido generado exitosamente.`,
      });
      console.log("Carnet generado con éxito:", data.url_carnet);
    },
    onError: (error: any) => {
      console.error("Error en generación de carnet:", error);
      toast({
        title: "Error al generar carnet",
        description: error.message || "No se pudo generar el carnet profesional.",
        variant: "destructive",
      });
    },
  });
}
