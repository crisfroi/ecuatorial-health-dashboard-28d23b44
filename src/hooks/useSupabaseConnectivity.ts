import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSupabaseConnectivity() {
  return useQuery({
    queryKey: ["supabase-connectivity"],
    queryFn: async () => {
      console.log("=== SIMPLE SUPABASE CONNECTIVITY TEST ===");

      try {
        // Test 1: Check if supabase client exists
        if (!supabase) {
          throw new Error("Supabase client not initialized");
        }

        console.log("✓ Supabase client exists");

        // Test 2: Check configuration
        const url = supabase.supabaseUrl;
        const key = supabase.supabaseKey;

        if (!url || !key) {
          throw new Error(
            `Missing configuration - URL: ${!!url}, Key: ${!!key}`,
          );
        }

        console.log("✓ Supabase configuration present");
        console.log("- URL:", url?.substring(0, 30) + "...");
        console.log("- Key:", key?.substring(0, 20) + "...");

        // Test 3: Try to access auth (doesn't require database access)
        const session = await supabase.auth.getSession();
        console.log(
          "✓ Auth module accessible, session:",
          !!session.data.session,
        );

        // Test 4: Try simplest possible database query
        console.log("Testing database access...");

        // First try: Get table info (metadata query)
        try {
          const { error: metaError } = await supabase
            .from("profesionales_sanitarios")
            .select("id", { count: "exact", head: true });

          if (metaError) {
            console.log("Metadata query error:", {
              message: metaError.message,
              details: metaError.details,
              hint: metaError.hint,
              code: metaError.code,
            });
            throw metaError;
          }

          console.log("✓ Table metadata accessible");
        } catch (metaErr: any) {
          console.error("Table metadata failed:", metaErr);
          const errorDetails = {
            message: metaErr?.message || "Unknown error",
            details: metaErr?.details || null,
            hint: metaErr?.hint || null,
            code: metaErr?.code || null,
          };
          const fullErrorMessage = `${errorDetails.message}${errorDetails.details ? ` (${errorDetails.details})` : ""}${errorDetails.hint ? ` Hint: ${errorDetails.hint}` : ""}${errorDetails.code ? ` Code: ${errorDetails.code}` : ""}`;
          throw new Error(`Table access failed: ${fullErrorMessage}`);
        }

        // Test 5: Try to get one record
        try {
          const { data, error } = await supabase
            .from("profesionales_sanitarios")
            .select("id")
            .limit(1);

          if (error) {
            console.log("Single record query error:", error);
            throw error;
          }

          console.log("✓ Database query successful");
          console.log("- Records available:", data?.length || 0);

          return {
            status: "connected",
            hasRecords: (data?.length || 0) > 0,
            recordCount: data?.length || 0,
            message: "Supabase connection successful",
          };
        } catch (queryErr: any) {
          console.error("Database query failed:", queryErr);
          const errorMessage =
            queryErr?.message ||
            queryErr?.details ||
            queryErr?.hint ||
            JSON.stringify(queryErr);
          throw new Error(`Database query failed: ${errorMessage}`);
        }
      } catch (error: any) {
        console.error("=== CONNECTIVITY TEST FAILED ===");
        console.error("Error:", error);
        console.error("Type:", typeof error);
        console.error("Constructor:", error?.constructor?.name);
        console.error("Message:", error?.message);
        console.error("Stack:", error?.stack);

        return {
          status: "failed",
          error: error?.message || error?.toString() || "Unknown error",
          details: {
            type: typeof error,
            constructor: error?.constructor?.name,
            hasMessage: !!error?.message,
            hasStack: !!error?.stack,
          },
        };
      }
    },
    retry: 1,
    refetchInterval: false,
    gcTime: 0, // Don't cache results
  });
}
