import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRLSTest() {
  return useQuery({
    queryKey: ["rls-test"],
    queryFn: async () => {
      console.log("=== TESTING RLS POLICIES ===");

      try {
        // Check current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.log("User auth error:", userError);
        }

        console.log(
          "Current user:",
          user ? `${user.email} (${user.id})` : "Anonymous",
        );

        // Test different scenarios
        const tests = [
          {
            name: "Anonymous select (no auth)",
            test: async () => {
              // Create a new client without auth for this test
              const anonClient = supabase;
              const { data, error } = await anonClient
                .from("profesionales_sanitarios")
                .select("id")
                .limit(1);
              return { data, error, count: data?.length };
            },
          },
          {
            name: "Count query",
            test: async () => {
              const { count, error } = await supabase
                .from("profesionales_sanitarios")
                .select("*", { count: "exact", head: true });
              return { count, error };
            },
          },
          {
            name: "Select with columns",
            test: async () => {
              const { data, error } = await supabase
                .from("profesionales_sanitarios")
                .select("id, nombre_completo, estado_solicitud")
                .limit(3);
              return { data, error, count: data?.length };
            },
          },
          {
            name: "Filter by estado",
            test: async () => {
              const { data, error } = await supabase
                .from("profesionales_sanitarios")
                .select("id, estado_solicitud")
                .eq("estado_solicitud", "Aprobado")
                .limit(3);
              return { data, error, count: data?.length };
            },
          },
        ];

        const results = [];

        for (const test of tests) {
          try {
            console.log(`Running test: ${test.name}`);
            const result = await test.test();

            results.push({
              name: test.name,
              success: !result.error,
              count: result.count,
              error: result.error
                ? {
                    message: result.error.message,
                    code: result.error.code,
                    details: result.error.details,
                    hint: result.error.hint,
                  }
                : null,
            });

            console.log(
              `✓ ${test.name}:`,
              result.error ? "FAILED" : "SUCCESS",
              result.count,
            );
          } catch (err: any) {
            console.error(`✗ ${test.name} threw error:`, err);
            results.push({
              name: test.name,
              success: false,
              error: {
                message: err.message,
                name: err.name,
              },
            });
          }
        }

        const successCount = results.filter((r) => r.success).length;
        const totalTests = results.length;

        return {
          status:
            successCount === totalTests
              ? "all_passed"
              : successCount > 0
                ? "partial"
                : "all_failed",
          user: user
            ? {
                id: user.id,
                email: user.email,
                role: user.role,
              }
            : null,
          successCount,
          totalTests,
          results,
        };
      } catch (error: any) {
        console.error("RLS test failed:", error);

        return {
          status: "error",
          error: {
            message: error?.message || "Unknown error",
            name: error?.name,
          },
        };
      }
    },
    retry: 1,
    refetchInterval: false,
    gcTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
}
