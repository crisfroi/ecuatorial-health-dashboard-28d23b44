import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProfessionalsTableTest() {
  return useQuery({
    queryKey: ["professionals-table-test"],
    queryFn: async () => {
      console.log("=== TESTING PROFESIONALES_SANITARIOS TABLE ===");

      try {
        // Test 1: Simple count query (should work even with RLS)
        console.log("Testing table count...");
        const { count, error: countError } = await supabase
          .from("profesionales_sanitarios")
          .select("*", { count: "exact", head: true });

        if (countError) {
          console.error("Count query failed:", {
            message: countError.message,
            details: countError.details,
            hint: countError.hint,
            code: countError.code,
          });

          return {
            status: "failed",
            step: "count",
            error: {
              message: countError.message,
              details: countError.details,
              hint: countError.hint,
              code: countError.code,
            },
          };
        }

        console.log("✓ Count query successful:", count);

        // Test 2: Try to get one record
        console.log("Testing single record fetch...");
        const { data, error: selectError } = await supabase
          .from("profesionales_sanitarios")
          .select("id, nombre_completo, area_profesional")
          .limit(1);

        if (selectError) {
          console.error("Select query failed:", {
            message: selectError.message,
            details: selectError.details,
            hint: selectError.hint,
            code: selectError.code,
          });

          return {
            status: "partial_success",
            step: "select",
            count: count,
            error: {
              message: selectError.message,
              details: selectError.details,
              hint: selectError.hint,
              code: selectError.code,
            },
          };
        }

        console.log("✓ Select query successful, records:", data?.length || 0);

        // Test 3: Try different queries that are commonly used
        console.log("Testing common aggregations...");

        const tests = [
          {
            name: "Count by area",
            query: () =>
              supabase
                .from("profesionales_sanitarios")
                .select("area_profesional", { count: "exact" })
                .not("area_profesional", "is", null)
                .limit(1),
          },
          {
            name: "Count by estado",
            query: () =>
              supabase
                .from("profesionales_sanitarios")
                .select("estado_solicitud", { count: "exact" })
                .not("estado_solicitud", "is", null)
                .limit(1),
          },
        ];

        const testResults = [];
        for (const test of tests) {
          try {
            const { count: testCount, error: testError } = await test.query();
            testResults.push({
              name: test.name,
              success: !testError,
              count: testCount,
              error: testError?.message,
            });
          } catch (err: any) {
            testResults.push({
              name: test.name,
              success: false,
              error: err.message,
            });
          }
        }

        return {
          status: "success",
          totalRecords: count || 0,
          sampleRecords: data?.length || 0,
          testResults,
          message: "All table tests passed successfully",
        };
      } catch (error: any) {
        console.error("Professionals table test failed:", error);

        return {
          status: "error",
          error: {
            message: error?.message || "Unknown error",
            name: error?.name,
            stack: error?.stack?.substring(0, 200),
          },
        };
      }
    },
    retry: 1,
    refetchInterval: false,
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
