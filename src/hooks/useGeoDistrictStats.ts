import { useMemo } from "react";
import { useDistrictStats } from "@/hooks/useAdvancedAnalytics";
import { useDistritosSanitarios, DistritoSanitario } from "@/hooks/useDistritosSanitarios";
import { getCleanGeoName } from "@/utils/geoUtils";

// Define la estructura de datos que el mapa necesita
export type DistritoGeoStats = DistritoSanitario & {
  total_profesionales: number;
  total_centros: number;
  cleanName: string; // Clave única normalizada para mapear al GeoJSON
};

export const useGeoDistrictStats = () => {
  // Obtener lista de distritos desde el hook original
  const distritosQuery = useDistritosSanitarios();
  // Obtener estadísticas agregadas por distrito desde la API de analytics
  const { data: districtStats = [], isLoading } = useDistrictStats();

  const data: DistritoGeoStats[] = useMemo(() => {
    if (!distritosQuery.data) return [];

    // Build a lookup by normalized district name matching distrito_sanitario
    const statsByName = new Map<string, { total_profesionales: number; total_centros: number }>();
    districtStats.forEach((d) => {
      const key = getCleanGeoName(d.distrito_sanitario || "");
      statsByName.set(key, {
        total_profesionales: d.total_profesionales || 0,
        total_centros: d.total_centros || 0,
      });
    });

    return distritosQuery.data.map((d) => {
      const rawName = (d as any).nombre_distrito || "";
      const cleanName = getCleanGeoName(rawName);
      const stats = statsByName.get(cleanName) || { total_profesionales: 0, total_centros: 0 };
      return {
        ...(d as DistritoSanitario),
        total_profesionales: stats.total_profesionales,
        total_centros: stats.total_centros,
        cleanName,
      } as DistritoGeoStats;
    });
  }, [distritosQuery.data, districtStats]);

  return {
    ...distritosQuery,
    data,
    isLoading,
  };
};
