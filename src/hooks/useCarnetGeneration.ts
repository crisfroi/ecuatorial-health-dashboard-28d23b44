import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/utils/errorHandler";

interface CarnetGenerationResponse {
  success: boolean;
  message: string;
  url_carnet?: string;
  profesional_id: string;
  svg_content?: string;
}

interface CarnetGenerationResult {
  profesionalId: string;
  success: boolean;
  message: string;
  url_carnet?: string;
  error?: string;
}

export const useCarnetGeneration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Función para generar carnet individual
  const generateCarnetMutation = useMutation({
    mutationFn: async (profesionalId: string): Promise<CarnetGenerationResponse> => {
      console.log(`Generando carnet para profesional ID: ${profesionalId}`);

      try {
        // Obtener token de sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        
        const headers: Record<string, string> = {
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8",
        };

        // Usar token de usuario si está disponible
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(
          `https://wdieynendfjbkbhfovrx.supabase.co/functions/v1/generar-carnet-profesional?id=${profesionalId}`,
          {
            method: "GET",
            headers,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || result.details || "Error desconocido en generación de carnet");
        }

        console.log(`Carnet generado exitosamente para profesional ${profesionalId}:`, result);
        return result;

      } catch (error) {
        console.error(`Error al generar carnet para profesional ${profesionalId}:`, error);
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: (data) => {
      console.log("Carnet generado exitosamente:", data);
      
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      
      toast({
        title: "Carnet Generado",
        description: `Carnet profesional generado exitosamente.`,
      });
    },
    onError: (error: any) => {
      console.error("Error en generación de carnet:", error);
      toast({
        title: "Error al Generar Carnet",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  // Función para generar carnets en bloque
  const generateMultipleCarnets = useMutation({
    mutationFn: async (profesionalIds: string[]): Promise<CarnetGenerationResult[]> => {
      console.log(`Generando carnets para ${profesionalIds.length} profesionales:`, profesionalIds);

      const results: CarnetGenerationResult[] = [];
      
      // Procesar en lotes de 5 para evitar sobrecarga
      const batchSize = 5;
      for (let i = 0; i < profesionalIds.length; i += batchSize) {
        const batch = profesionalIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (profesionalId) => {
          try {
            const result = await generateCarnetMutation.mutateAsync(profesionalId);
            return {
              profesionalId,
              success: true,
              message: result.message,
              url_carnet: result.url_carnet
            };
          } catch (error) {
            console.error(`Error generando carnet para ${profesionalId}:`, error);
            return {
              profesionalId,
              success: false,
              message: "Error en generación",
              error: getErrorMessage(error)
            };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              profesionalId: batch[index],
              success: false,
              message: "Error en procesamiento",
              error: result.reason
            });
          }
        });

        // Pausa pequeña entre lotes
        if (i + batchSize < profesionalIds.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`Generación masiva completada: ${successful} exitosos, ${failed} fallidos`);
      
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      
      if (failed === 0) {
        toast({
          title: "Carnets Generados",
          description: `Se generaron ${successful} carnets exitosamente.`,
        });
      } else {
        toast({
          title: "Generación Parcial",
          description: `${successful} carnets generados, ${failed} fallaron. Revisa los detalles.`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Error en generación masiva de carnets:", error);
      toast({
        title: "Error en Generación Masiva",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  // Función helper para generar carnet automáticamente después de cambio de estado
  const generateCarnetAfterStatusChange = async (profesionalIds: string | string[]) => {
    try {
      if (Array.isArray(profesionalIds)) {
        if (profesionalIds.length > 1) {
          console.log(`Iniciando generación masiva de carnets para ${profesionalIds.length} profesionales`);
          return await generateMultipleCarnets.mutateAsync(profesionalIds);
        } else if (profesionalIds.length === 1) {
          console.log(`Generando carnet individual para profesional ${profesionalIds[0]}`);
          const result = await generateCarnetMutation.mutateAsync(profesionalIds[0]);
          return [{ 
            profesionalId: profesionalIds[0], 
            success: result.success, 
            message: result.message,
            url_carnet: result.url_carnet 
          }];
        }
      } else {
        console.log(`Generando carnet individual para profesional ${profesionalIds}`);
        const result = await generateCarnetMutation.mutateAsync(profesionalIds);
        return [{ 
          profesionalId: profesionalIds, 
          success: result.success, 
          message: result.message,
          url_carnet: result.url_carnet 
        }];
      }
    } catch (error) {
      console.error("Error en generación automática de carnet:", error);
      throw error;
    }
  };

  return {
    generateCarnet: generateCarnetMutation.mutate,
    generateCarnetAsync: generateCarnetMutation.mutateAsync,
    generateMultipleCarnets: generateMultipleCarnets.mutate,
    generateMultipleCarnetsAsync: generateMultipleCarnets.mutateAsync,
    generateCarnetAfterStatusChange,
    isGeneratingCarnet: generateCarnetMutation.isPending,
    isGeneratingMultiple: generateMultipleCarnets.isPending,
    isGenerating: generateCarnetMutation.isPending || generateMultipleCarnets.isPending,
  };
};
