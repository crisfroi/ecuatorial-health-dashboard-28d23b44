import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useBasicConnectivityTest() {
  return useQuery({
    queryKey: ["basic-connectivity-test"],
    queryFn: async () => {
      console.log("=== BASIC CONNECTIVITY TEST ===");

      try {
        // Simple auth check first
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) {
          console.log("Auth error:", authError);
        } else {
          console.log("✓ Auth accessible, user:", !!authData.user);
        }

        // Try the simplest possible database operation
        const { data, error, count } = await supabase
          .from("profesionales_sanitarios")
          .select("id", { count: "exact", head: true });

        if (error) {
          console.error("Database error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });

          return {
            status: "error",
            error: {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            },
          };
        }

        console.log("✓ Database accessible, count:", count);

        return {
          status: "success",
          recordCount: count || 0,
          message: "Database connection successful",
        };
      } catch (error: any) {
        console.error("Connectivity test failed:", error);

        return {
          status: "failed",
          error: {
            message: error?.message || "Unknown error",
            name: error?.name,
            cause: error?.cause,
            stack: error?.stack?.substring(0, 500), // Limit stack trace
          },
        };
      }
    },
    retry: 1,
    refetchInterval: false,
    gcTime: 0,
  });
}
