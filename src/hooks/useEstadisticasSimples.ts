import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EstadisticasSimples {
  total: number;
  aprobados: number;
  pendientes: number;
  rechazados: number;
  hombres: number;
  mujeres: number;
  centros: number;
  proximosVencer: number;
}

export const useEstadisticasSimples = () => {
  return useQuery({
    queryKey: ["estadisticas-simples"],
    queryFn: async (): Promise<EstadisticasSimples> => {
      try {
        console.log("🔍 Obteniendo estadísticas simples...");

        // Estadísticas básicas de profesionales
        const { data: profesionales, error: profError } = await supabase
          .from("profesionales_sanitarios")
          .select("estado_solicitud, genero, fecha_validez_carnet, fecha_caducidad");

        if (profError) {
          console.error("Error obteniendo profesionales:", profError);
          throw profError;
        }

        console.log("✅ Profesionales obtenidos:", profesionales?.length || 0);

        // Estadísticas de centros
        const { data: centros, error: centrosError } = await supabase
          .from("centros_salud")
          .select("id");

        if (centrosError) {
          console.warn("Error obteniendo centros (continuando):", centrosError);
        }

        // Calcular próximos a vencer
        const hoy = new Date();
        const treintaDias = new Date();
        treintaDias.setDate(hoy.getDate() + 30);

        const proximosVencer = profesionales?.filter(p => {
          if (!p.fecha_caducidad && !p.fecha_validez_carnet) return false;
          const fechaCaducidad = new Date(p.fecha_caducidad || p.fecha_validez_carnet);
          return fechaCaducidad > hoy && fechaCaducidad <= treintaDias;
        }).length || 0;

        const stats: EstadisticasSimples = {
          total: profesionales?.length || 0,
          aprobados: profesionales?.filter(p => p.estado_solicitud === 'Aprobado').length || 0,
          pendientes: profesionales?.filter(p =>
            p.estado_solicitud === 'Pendiente' ||
            p.estado_solicitud === 'Recibido' ||
            p.estado_solicitud === 'Revisando' ||
            p.estado_solicitud === 'En Revisión' ||
            p.estado_solicitud === 'Pendiente de Firma'
          ).length || 0,
          rechazados: profesionales?.filter(p => p.estado_solicitud === 'Rechazado' || p.estado_solicitud === 'Rechazada').length || 0,
          hombres: profesionales?.filter(p => p.genero === 'Masculino' || p.genero === 'Hombre').length || 0,
          mujeres: profesionales?.filter(p => p.genero === 'Femenino' || p.genero === 'Mujer').length || 0,
          centros: centros?.length || 0,
          proximosVencer
        };

        console.log("📊 Estadísticas calculadas:", stats);
        return stats;

      } catch (error) {
        console.error("❌ Error en useEstadisticasSimples:", error);
        // Retornar estadísticas por defecto en caso de error
        return {
          total: 0,
          aprobados: 0,
          pendientes: 0,
          rechazados: 0,
          hombres: 0,
          mujeres: 0,
          centros: 0,
          proximosVencer: 0
        };
      }
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
    staleTime: 10000, // Considerar datos frescos por 10 segundos
    retry: 3,
    retryDelay: 1000
  });
};
