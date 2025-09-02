import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface SegmentationResult {
  total: number;
  areas: { nombre: string; total: number; porcentaje: number }[];
  titulaciones: { nombre: string; total: number; porcentaje: number }[];
}

export const useFormationSegmentation = (params: { country?: string | null; institution?: string | null }) => {
  const { country, institution } = params;

  return useQuery({
    queryKey: ["formationSegmentation", country || null, institution || null],
    enabled: Boolean(country || institution),
    queryFn: async (): Promise<SegmentationResult> => {
      let query = supabase
        .from("profesionales_sanitarios")
        .select("area_profesional, categoria_titulacion")
        .eq("estado_solicitud", "Aprobado");

      if (country) {
        query = query.or(`pais_formacion_1.eq.${country},pais_formacion_2.eq.${country}`);
      }
      if (institution) {
        query = query.or(`institucion_1.eq.${institution},institucion_2.eq.${institution}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const total = data?.length || 0;

      const areaCounts = (data || []).reduce((acc, row) => {
        const key = row.area_profesional || "Sin especificar";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const titCounts = (data || []).reduce((acc, row) => {
        const key = (row as any).categoria_titulacion || "Sin especificar";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const areas = Object.entries(areaCounts)
        .map(([nombre, totalCount]) => ({
          nombre,
          total: totalCount as number,
          porcentaje: total ? ((totalCount as number) / total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);

      const titulaciones = Object.entries(titCounts)
        .map(([nombre, totalCount]) => ({
          nombre,
          total: totalCount as number,
          porcentaje: total ? ((totalCount as number) / total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);

      return { total, areas, titulaciones };
    },
  });
};
