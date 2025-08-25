import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage, logError } from "@/utils/errorHandler";

// Helper function to detect network connectivity issues
const isNetworkError = (error: any): boolean => {
  if (!error) return false;

  const networkErrorPatterns = [
    'Failed to fetch',
    'TypeError: Failed to fetch',
    'Network request failed',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED'
  ];

  const errorMessage = error.message || error.toString() || '';
  return networkErrorPatterns.some(pattern =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
};

// Helper function for retry with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isNetworkError(error) || attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`🔄 Retrying estadisticas test in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

export function useEstadisticasTest() {
  return useQuery({
    queryKey: ["estadisticas-test"],
    queryFn: async () => {
      console.log("Testing simple estadisticas fetch...");

      return await retryWithBackoff(async () => {
        // Simple database query
        const { data, error } = await supabase
          .from("profesionales_sanitarios")
          .select("id, estado_solicitud")
          .limit(5);

        if (error) {
          console.error("Query error:", error);
          logError("Statistics test query failed", error);

          if (isNetworkError(error)) {
            throw new Error(`Network connectivity issue: ${getErrorMessage(error)}`);
          }

          throw new Error(`Database query failed: ${getErrorMessage(error)}`);
        }

        console.log("Query successful, records:", data?.length || 0);

        // Calculate simple statistics
        const total = data?.length || 0;
        const aprobados = data?.filter((p) => p.estado_solicitud === "Aprobado").length || 0;
        const pendientes = data?.filter((p) => p.estado_solicitud === "Pendiente").length || 0;

        return {
          total,
          aprobados,
          pendientes,
          test: "working",
          sampleData: data?.slice(0, 2),
          timestamp: new Date().toISOString()
        };
      });
    },
    retry: false, // We handle retries manually
    refetchInterval: false,
  });
}
