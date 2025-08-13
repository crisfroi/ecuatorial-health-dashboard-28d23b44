import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EstadisticasDirectas {
  total: number;
  aprobados: number;
  pendientes: number;
  recibidos: number;
  revisando: number;
  rechazados: number;
  hombres: number;
  mujeres: number;
  centros: number;
  proximosVencer: number;
  carnetVencidos: number;
}

export const useEstadisticasDirectas = () => {
  return useQuery({
    queryKey: ["estadisticas-directas"],
    queryFn: async (): Promise<EstadisticasDirectas> => {
      console.log("🔍 Obteniendo estadísticas directas...");

      try {
        // Query simple y directo
        const { data: profesionales, error } = await supabase
          .from("profesionales_sanitarios")
          .select("estado_solicitud, genero, fecha_validez_carnet, fecha_caducidad");

        if (error) {
          console.error("❌ Error en estadísticas directas:", error);
          throw error;
        }

        console.log("✅ Profesionales obtenidos:", profesionales?.length || 0);

        const total = profesionales?.length || 0;
        const aprobados = profesionales?.filter(p => p.estado_solicitud === 'Aprobado').length || 0;
        const pendientes = profesionales?.filter(p => p.estado_solicitud === 'Pendiente').length || 0;
        const recibidos = profesionales?.filter(p => p.estado_solicitud === 'Recibido').length || 0;
        const revisando = profesionales?.filter(p => p.estado_solicitud === 'Revisando' || p.estado_solicitud === 'En Revisión').length || 0;
        const rechazados = profesionales?.filter(p => p.estado_solicitud === 'Rechazado').length || 0;
        const hombres = profesionales?.filter(p => p.genero === 'Masculino').length || 0;
        const mujeres = profesionales?.filter(p => p.genero === 'Femenino').length || 0;

        // Cálculo simple de vencimientos
        const hoy = new Date();
        const treintaDias = new Date();
        treintaDias.setDate(hoy.getDate() + 30);

        const proximosVencer = profesionales?.filter(p => {
          if (!p.fecha_caducidad && !p.fecha_validez_carnet) return false;
          const fecha = new Date(p.fecha_caducidad || p.fecha_validez_carnet);
          return fecha > hoy && fecha <= treintaDias;
        }).length || 0;

        const carnetVencidos = profesionales?.filter(p => {
          if (!p.fecha_caducidad && !p.fecha_validez_carnet) return false;
          const fecha = new Date(p.fecha_caducidad || p.fecha_validez_carnet);
          return fecha <= hoy;
        }).length || 0;

        // Query separado para centros
        const { data: centros } = await supabase
          .from("centros_salud")
          .select("id");

        const stats = {
          total,
          aprobados,
          pendientes,
          recibidos,
          revisando,
          rechazados,
          hombres,
          mujeres,
          centros: centros?.length || 0,
          proximosVencer,
          carnetVencidos
        };

        console.log("📊 Estadísticas directas calculadas:", stats);
        return stats;

      } catch (error) {
        console.error("❌ Error en useEstadisticasDirectas:", error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 5000,
    refetchInterval: false // No auto-refetch para evitar loops
  });
};
