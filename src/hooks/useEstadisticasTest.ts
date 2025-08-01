import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage, logError } from "@/utils/errorHandler";

export function useEstadisticasTest() {
  return useQuery({
    queryKey: ["estadisticas-test"],
    queryFn: async () => {
      console.log("=== SIMPLIFIED ESTADISTICAS TEST ===");

      try {
        // Validate Supabase client
        if (!supabase) {
          throw new Error("Supabase client not initialized");
        }

        console.log("✓ Supabase client validated");

        // Enhanced database query with better error handling
        console.log("Testing database query...");
        
        const { data, error } = await supabase
          .from("profesionales_sanitarios")
          .select("id, estado_solicitud")
          .limit(10); // Increase limit slightly for better statistics

        if (error) {
          console.error("Database query error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          
          logError("Statistics test query failed", error);
          
          // Provide more specific error messages
          let errorMsg = getErrorMessage(error);
          
          if (error.message?.includes('fetch')) {
            errorMsg = "Network connection failed. Please check your internet connection and try again.";
          } else if (error.code) {
            errorMsg = `Database error (${error.code}): ${error.message || error.details || 'Unknown database error'}`;
          }
          
          throw new Error(`Database query failed: ${errorMsg}`);
        }

        console.log("✓ Database query successful");
        console.log("- Total records:", data?.length || 0);

        // Calculate statistics from the data
        const total = data?.length || 0;
        const aprobados = data?.filter((p) => p.estado_solicitud === "Aprobado").length || 0;
        const pendientes = data?.filter((p) => p.estado_solicitud === "Pendiente").length || 0;
        const otros = total - aprobados - pendientes;

        const stats = {
          total,
          aprobados,
          pendientes,
          otros,
          test: "working",
          timestamp: new Date().toISOString(),
          sampleData: data?.slice(0, 3), // Show first 3 records for debugging
        };

        console.log("Statistics calculated:", stats);
        return stats;

      } catch (err: any) {
        console.error("=== ESTADISTICAS TEST ERROR ===");
        console.error("Error:", err);
        console.error("Type:", typeof err);
        console.error("Constructor:", err?.constructor?.name);
        console.error("Message:", err?.message);

        // Enhanced error classification
        const isNetworkError = err?.message?.includes('fetch') ||
                             err?.message?.includes('network') ||
                             err?.name === 'TypeError' ||
                             err?.name === 'NetworkError';

        const isCorsError = err?.message?.includes('CORS') ||
                          err?.message?.includes('cross-origin');

        const isTimeoutError = err?.message?.includes('timeout') ||
                             err?.message?.includes('aborted');

        console.log("Error classification:", {
          network: isNetworkError,
          cors: isCorsError,
          timeout: isTimeoutError,
        });

        // Log environment info for debugging
        console.log("Environment info:", {
          userAgent: navigator.userAgent,
          online: navigator.onLine,
          location: window.location.href,
        });

        logError("Estadisticas test failed", err);
        
        // Create user-friendly error message
        let userMessage = getErrorMessage(err);
        
        if (isNetworkError) {
          userMessage = "Unable to connect to the database. Please check your internet connection and try refreshing the page.";
        } else if (isCorsError) {
          userMessage = "Cross-origin request blocked. This might be a browser security setting issue.";
        } else if (isTimeoutError) {
          userMessage = "Request timed out. The server is taking too long to respond.";
        }
        
        throw new Error(userMessage);
      }
    },
    retry: (failureCount, error) => {
      // Only retry network-related errors, and only up to 2 times
      if (failureCount < 2) {
        const errorMessage = error?.message || '';
        return errorMessage.includes('fetch') || 
               errorMessage.includes('network') || 
               errorMessage.includes('timeout') ||
               errorMessage.includes('connect');
      }
      return false;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * 2 ** attemptIndex, 4000);
    },
    refetchInterval: false,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}
