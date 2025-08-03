
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage, logError } from "@/utils/errorHandler";
import type { EstadisticasData } from "./useEstadisticas";

export function useEstadisticasTest() {
  return useQuery({
    queryKey: ["estadisticas-test"],
    queryFn: async (): Promise<EstadisticasData> => {
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
        const pendientes = data?.filter((p) => p.estado_solicitud === "Pendiente de Firma").length || 0;
        const recibidos = data?.filter((p) => p.estado_solicitud === "Recibido").length || 0;
        const rechazados = data?.filter((p) => p.estado_solicitud === "Rechazado").length || 0;
        const revisando = data?.filter((p) => p.estado_solicitud === "En Revisión").length || 0;

        return {
          total,
          aprobados,
          pendientes,
          recibidos,
          rechazados,
          revisando,
          vencimientosProximos: 0,
          carnetVencidos: 0,
          porArea: {},
          porProvincia: {},
          generoMasculino: 0,
          generoFemenino: 0,
          totalPorGenero: {},
          totalPorDistrito: {},
          totalPorTipoSector: {},
          totalPorNacionalidad: {},
          totalPorAreaProfesional: {},
          totalPorEstadoSolicitud: {
            "Recibido": recibidos,
            "En Revisión": revisando,
            "Aprobado": aprobados,
            "Pendiente de Firma": pendientes,
            "Rechazado": rechazados
          },
          totalPorDistritoSanitario: {},
          datosGraficoProvincias: [],
          datosGraficoAreas: [],
          datosGraficoEstados: [
            { estado: "Aprobado", cantidad: aprobados, color: "#22c55e" },
            { estado: "Recibido", cantidad: recibidos, color: "#f59e0b" },
            { estado: "Rechazado", cantidad: rechazados, color: "#ef4444" },
            { estado: "Revisando", cantidad: revisando, color: "#3b82f6" },
            { estado: "Pendiente de Firma", cantidad: pendientes, color: "#8b5cf6" }
          ],
          tasaAprobacion: total > 0 ? ((aprobados / total) * 100).toFixed(1) : "0",
          tasaRechazo: total > 0 ? ((rechazados / total) * 100).toFixed(1) : "0"
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
