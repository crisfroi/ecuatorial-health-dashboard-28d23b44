import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage, logError } from "@/utils/errorHandler";

export function useEstadisticasTest() {
  return useQuery({
    queryKey: ["estadisticas-test"],
    queryFn: async () => {
      console.log("Testing simple estadisticas fetch...");

      try {
        // Test 1: Basic connection
        console.log("Test 1: Basic connection test...");
        const { data: connectionTest, error: connectionError } = await supabase
          .from("profesionales_sanitarios")
          .select("count(*)", { count: "exact", head: true });

        if (connectionError) {
          console.error("Connection error details:");
          console.error("- Type:", typeof connectionError);
          console.error("- Constructor:", connectionError?.constructor?.name);
          console.error("- Keys:", Object.keys(connectionError || {}));
          console.error("- Full object:", connectionError);
          logError("Connection test failed", connectionError);
          throw new Error(
            `Connection failed: ${getErrorMessage(connectionError)}`,
          );
        }

        console.log("Connection test passed");

        // Test 2: Simple select
        console.log("Test 2: Simple select test...");
        const { data, error } = await supabase
          .from("profesionales_sanitarios")
          .select("id, estado_solicitud")
          .limit(5);

        if (error) {
          logError("Select test failed", error);
          throw new Error(`Select failed: ${getErrorMessage(error)}`);
        }

        console.log("Test query successful:", data);
        console.log("Data length:", data?.length);

        // Return simple test data
        return {
          total: data?.length || 0,
          aprobados:
            data?.filter((p) => p.estado_solicitud === "Aprobado").length || 0,
          pendientes:
            data?.filter((p) => p.estado_solicitud === "Pendiente").length || 0,
          test: "working",
          sampleData: data?.slice(0, 2), // Show first 2 records for debugging
        };
      } catch (err: any) {
        logError("Test query failed", err);
        throw new Error(`Test failed: ${getErrorMessage(err)}`);
      }
    },
    retry: 1,
    refetchInterval: false,
  });
}
