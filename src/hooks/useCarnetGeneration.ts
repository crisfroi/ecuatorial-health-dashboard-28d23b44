import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
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

  const generateCarnetMutation = useMutation({
    mutationFn: async (profesionalId: string): Promise<CarnetGenerationResponse> => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "apikey": SUPABASE_PUBLISHABLE_KEY,
        };
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const response = await fetch(
          `https://wdieynendfjbkbhfovrx.supabase.co/functions/v1/generar-carnet-profesional?id=${encodeURIComponent(profesionalId)}`,
          { method: "GET", headers }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error ${response.status}: ${errorText}`);
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || result.details || "Error desconocido en generación de carnet");
        }
        return result;
      } catch (error) {
        console.error(`Error al generar carnet para profesional ${profesionalId}:`, error);
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["carnets"] });
      toast({ title: "Carnet Generado", description: "Carnet profesional generado exitosamente." });
    },
    onError: (error: any) => {
      console.error("Error en generación de carnet:", error);
      toast({ title: "Error al Generar Carnet", description: getErrorMessage(error), variant: "destructive" });
    },
  });

  const generateMultipleCarnets = useMutation({
    mutationFn: async (profesionalIds: string[]): Promise<CarnetGenerationResult[]> => {
      const results: CarnetGenerationResult[] = [];
      const batchSize = 5;
      for (let i = 0; i < profesionalIds.length; i += batchSize) {
        const batch = profesionalIds.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map(async (profesionalId) => {
            try {
              const result = await generateCarnetMutation.mutateAsync(profesionalId);
              return { profesionalId, success: true, message: result.message, url_carnet: result.url_carnet };
            } catch (error) {
              return { profesionalId, success: false, message: "Error en generación", error: getErrorMessage(error) };
            }
          })
        );
        batchResults.forEach((result, index) => {
          results.push(result.status === "fulfilled" ? result.value : {
            profesionalId: batch[index],
            success: false,
            message: "Error en procesamiento",
            error: getErrorMessage(result.reason),
          });
        });
        if (i + batchSize < profesionalIds.length) await new Promise(resolve => setTimeout(resolve, 1000));
      }
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["carnets"] });
      toast({
        title: failed === 0 ? "Carnets Generados" : "Generación Parcial",
        description: `${successful} carnets generados${failed ? `, ${failed} con error` : ""}.`,
        variant: failed === 0 ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({ title: "Error en Generación Masiva", description: getErrorMessage(error), variant: "destructive" });
    },
  });

  const generateCarnetAfterStatusChange = async (profesionalIds: string | string[]) => {
    if (Array.isArray(profesionalIds)) {
      if (profesionalIds.length === 0) return [];
      if (profesionalIds.length > 1) return generateMultipleCarnets.mutateAsync(profesionalIds);
      const id = profesionalIds[0];
      const result = await generateCarnetMutation.mutateAsync(id);
      return [{ profesionalId: id, success: result.success, message: result.message, url_carnet: result.url_carnet }];
    }
    const result = await generateCarnetMutation.mutateAsync(profesionalIds);
    return [{ profesionalId: profesionalIds, success: result.success, message: result.message, url_carnet: result.url_carnet }];
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
