import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSupabaseHealth() {
  return useQuery({
    queryKey: ["supabase-health"],
    queryFn: async () => {
      console.log("Checking Supabase connection health...");

      try {
        // Test basic connection with a simple query
        const startTime = Date.now();
        const { data, error } = await supabase
          .from("profesionales_sanitarios")
          .select("id")
          .limit(1);

        const responseTime = Date.now() - startTime;

        if (error) {
          console.error("Health check failed:", error.message || error);
          return {
            status: "error",
            message: error.message || "Database connection error",
            details: error,
            responseTime,
          };
        }

        return {
          status: "healthy",
          message: "Connection successful",
          responseTime,
          recordCount: data?.length || 0,
        };
      } catch (networkError: any) {
        console.error("Network error during health check:", networkError);
        return {
          status: "network_error",
          message: "Failed to connect to database",
          details: networkError.message,
          responseTime: null,
        };
      }
    },
    refetchInterval: 30000, // Check every 30 seconds
    retry: false, // Don't retry health checks
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

export function useSupabaseConnectionInfo() {
  return {
    url: "https://wdieynendfjbkbhfovrx.supabase.co",
    project: "wdieynendfjbkbhfovrx",
    region: "Database URL suggests default region",
  };
}
