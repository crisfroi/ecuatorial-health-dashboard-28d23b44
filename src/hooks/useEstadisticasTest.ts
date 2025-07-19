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
          console.error(
            "- Message property type:",
            typeof connectionError?.message,
          );
          console.error("- Message property value:", connectionError?.message);
          console.error("- Message length:", connectionError?.message?.length);
          console.error("- Code:", connectionError?.code);
          console.error("- Details:", connectionError?.details);
          console.error("- Hint:", connectionError?.hint);
          console.error("- Full object:", connectionError);
          console.error(
            "- JSON stringified:",
            JSON.stringify(
              connectionError,
              Object.getOwnPropertyNames(connectionError),
              2,
            ),
          );

          // Additional debugging for empty message errors
          if (connectionError.message === "") {
            console.error("EMPTY MESSAGE DETECTED - Additional debugging:");
            console.error("- Error toString():", connectionError.toString());
            console.error("- Error valueOf():", connectionError.valueOf());
            console.error(
              "- All properties:",
              Object.getOwnPropertyNames(connectionError),
            );

            // Try to extract more information
            const allProps = Object.getOwnPropertyNames(connectionError);
            allProps.forEach((prop) => {
              console.error(`- ${prop}:`, connectionError[prop]);
            });
          }

          logError("Connection test failed", connectionError);
          const errorMsg = getErrorMessage(connectionError);
          console.error("Processed error message:", errorMsg);

          throw new Error(`Connection failed: ${errorMsg}`);
        }

        console.log("Connection test passed");

        // Test 2: Simple select
        console.log("Test 2: Simple select test...");
        const { data, error } = await supabase
          .from("profesionales_sanitarios")
          .select("id, estado_solicitud")
          .limit(5);

        if (error) {
          console.error("Select error details:");
          console.error("- Type:", typeof error);
          console.error("- Constructor:", error?.constructor?.name);
          console.error("- Keys:", Object.keys(error || {}));
          console.error("- Message property:", error?.message);
          console.error("- Full object:", error);

          logError("Select test failed", error);
          const errorMsg = getErrorMessage(error);
          console.error("Processed select error message:", errorMsg);

          throw new Error(`Select failed: ${errorMsg}`);
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
