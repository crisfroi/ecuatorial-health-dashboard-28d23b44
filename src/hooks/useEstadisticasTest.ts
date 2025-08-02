import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage, logError } from "@/utils/errorHandler";

export function useEstadisticasTest() {
  return useQuery({
    queryKey: ["estadisticas-test"],
    queryFn: async () => {
      console.log("Testing simple estadisticas fetch...");

      try {
        // Simple database query
        const { data, error } = await supabase
          .from("profesionales_sanitarios")
          .select("id, estado_solicitud")
          .limit(5);

        if (error) {
          console.error("Query error:", error);
          logError("Statistics test query failed", error);
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
        };
      } catch (err: any) {
        console.error("Estadisticas test failed:", err);
        logError("Estadisticas test failed", err);
        throw new Error(`Test failed: ${getErrorMessage(err)}`);
      }
    },
    retry: 1,
    refetchInterval: false,
  });
}
