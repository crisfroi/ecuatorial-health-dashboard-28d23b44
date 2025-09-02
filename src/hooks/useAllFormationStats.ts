import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface CountryStats {
  pais_formacion: string;
  cantidad: number;
  porcentaje: number;
}

export interface InstitutionStats {
  institucion: string;
  cantidad: number;
  pais: string | null;
}

export const useAllCountryStats = () => {
  return useQuery({
    queryKey: ["allCountryStats"],
    queryFn: async (): Promise<CountryStats[]> => {
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("pais_formacion_1, pais_formacion_2")
        .eq("estado_solicitud", "Aprobado");

      if (error) throw error;

      const counts = data.reduce((acc, prof) => {
        // @ts-ignore
        [prof.pais_formacion_1, prof.pais_formacion_2].forEach((pais: string | null) => {
          if (pais && pais.trim()) acc[pais] = (acc[pais] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      const total = Object.values(counts).reduce((s, c) => s + c, 0);
      return Object.entries(counts)
        .map(([pais_formacion, cantidad]) => ({
          pais_formacion,
          cantidad,
          porcentaje: total ? (cantidad / total) * 100 : 0,
        }))
        .sort((a, b) => b.cantidad - a.cantidad);
    },
  });
};

export const useAllInstitutionStats = () => {
  return useQuery({
    queryKey: ["allInstitutionStats"],
    queryFn: async (): Promise<InstitutionStats[]> => {
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select(
          "institucion_1, institucion_2, pais_formacion_1, pais_formacion_2",
        )
        .eq("estado_solicitud", "Aprobado");

      if (error) throw error;

      const map = data.reduce((acc, prof) => {
        // @ts-ignore
        const institutions = [
          { inst: prof.institucion_1 as string | null, pais: prof.pais_formacion_1 as string | null },
          { inst: prof.institucion_2 as string | null, pais: prof.pais_formacion_2 as string | null },
        ];
        institutions.forEach(({ inst, pais }) => {
          if (inst && inst.trim()) {
            if (!acc[inst]) acc[inst] = { cantidad: 0, pais: pais || null };
            acc[inst].cantidad++;
          }
        });
        return acc;
      }, {} as Record<string, { cantidad: number; pais: string | null }>);

      return Object.entries(map)
        .map(([institucion, data]) => ({
          institucion,
          cantidad: data.cantidad,
          pais: data.pais,
        }))
        .sort((a, b) => b.cantidad - a.cantidad);
    },
  });
};
