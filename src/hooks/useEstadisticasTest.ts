import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEstadisticasTest() {
  return useQuery({
    queryKey: ["estadisticas-test"],
    queryFn: async () => {
      console.log("Testing simple estadisticas fetch...");

      try {
        const { data, error } = await supabase
          .from("profesionales_sanitarios")
          .select("id, estado_solicitud")
          .limit(10);

        if (error) {
          console.error("Test query error:", error);
          throw error;
        }

        console.log("Test query successful:", data);

        // Return simple test data
        return {
          total: data?.length || 0,
          aprobados:
            data?.filter((p) => p.estado_solicitud === "Aprobado").length || 0,
          test: "working",
        };
      } catch (err) {
        console.error("Test query failed:", err);
        throw err;
      }
    },
    retry: 1,
    refetchInterval: false,
  });
}
