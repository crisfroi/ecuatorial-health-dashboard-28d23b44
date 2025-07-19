import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types for analytics data
export interface TopCenter {
  id: string;
  nombre: string;
  categoria: string;
  distrito_sanitario: string | null;
  provincia: string;
  sector: string;
  total_profesionales: number;
}

export interface AreaProfessionalStats {
  area_profesional: string;
  total: number;
  aprobados: number;
  pendientes: number;
  porcentaje: number;
}

export interface DistrictStats {
  distrito_sanitario: string;
  total_profesionales: number;
  total_centros: number;
  areas_mas_comunes: string[];
}

export interface AgeRangeStats {
  rango_edad: string;
  cantidad: number;
  porcentaje: number;
}

export interface GraduationYearStats {
  año_graduacion: number;
  cantidad: number;
}

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

export interface CenterCategoryStats {
  categoria: string;
  total_centros: number;
  total_profesionales: number;
  promedio_profesionales_por_centro: number;
}

export interface TitulacionCategoryStats {
  categoria_titulacion: string;
  total: number;
  aprobados: number;
  pendientes: number;
  porcentaje: number;
}

// Hook for top centers by number of professionals
export const useTopCenters = () => {
  return useQuery({
    queryKey: ["topCenters"],
    queryFn: async (): Promise<TopCenter[]> => {
      const { data, error } = await supabase
        .from("centros_salud")
        .select(
          `
          id,
          nombre,
          categoria,
          distrito_sanitario,
          provincia,
          sector
        `,
        )
        .order("nombre");

      if (error) throw error;

      // Get professionals count for each center using both nombre_centro and lugar_trabajo fields
      const centersWithCounts = await Promise.all(
        data.map(async (center) => {
          const { count } = await supabase
            .from("profesionales_sanitarios")
            .select("*", { count: "exact", head: true })
            .or(
              `nombre_centro.eq.${center.nombre},lugar_trabajo.eq.${center.nombre}`,
            )
            .eq("estado_solicitud", "Aprobado");

          return {
            ...center,
            total_profesionales: count || 0,
          };
        }),
      );

      return centersWithCounts
        .sort((a, b) => b.total_profesionales - a.total_profesionales)
        .slice(0, 10);
    },
  });
};

// Hook for professional areas statistics
export const useAreaProfessionalStats = () => {
  return useQuery({
    queryKey: ["areaProfessionalStats"],
    queryFn: async (): Promise<AreaProfessionalStats[]> => {
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("area_profesional, estado_solicitud")
        .not("area_profesional", "is", null);

      if (error) throw error;

      const areaStats = data.reduce(
        (acc, prof) => {
          const area = prof.area_profesional!;
          if (!acc[area]) {
            acc[area] = { total: 0, aprobados: 0, pendientes: 0 };
          }

          acc[area].total++;
          if (prof.estado_solicitud === "Aprobado") {
            acc[area].aprobados++;
          } else {
            acc[area].pendientes++;
          }

          return acc;
        },
        {} as Record<
          string,
          { total: number; aprobados: number; pendientes: number }
        >,
      );

      const totalProfessionals = Object.values(areaStats).reduce(
        (sum, area) => sum + area.total,
        0,
      );

      return Object.entries(areaStats)
        .map(([area_profesional, stats]) => ({
          area_profesional,
          ...stats,
          porcentaje: (stats.total / totalProfessionals) * 100,
        }))
        .sort((a, b) => b.total - a.total);
    },
  });
};

// Hook for district statistics
export const useDistrictStats = () => {
  return useQuery({
    queryKey: ["districtStats"],
    queryFn: async (): Promise<DistrictStats[]> => {
      // Get professionals by district
      const { data: profData, error: profError } = await supabase
        .from("profesionales_sanitarios")
        .select("distrito_sanitario, area_profesional")
        .eq("estado_solicitud", "Aprobado")
        .not("distrito_sanitario", "is", null);

      if (profError) throw profError;

      // Get centers by district
      const { data: centerData, error: centerError } = await supabase
        .from("centros_salud")
        .select("distrito_sanitario")
        .not("distrito_sanitario", "is", null);

      if (centerError) throw centerError;

      const districtMap = profData.reduce(
        (acc, prof) => {
          const distrito = prof.distrito_sanitario!;
          if (!acc[distrito]) {
            acc[distrito] = { profesionales: [], areas: new Set() };
          }

          acc[distrito].profesionales.push(prof);
          if (prof.area_profesional) {
            acc[distrito].areas.add(prof.area_profesional);
          }

          return acc;
        },
        {} as Record<string, { profesionales: any[]; areas: Set<string> }>,
      );

      const centerCounts = centerData.reduce(
        (acc, center) => {
          const distrito = center.distrito_sanitario!;
          acc[distrito] = (acc[distrito] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return Object.entries(districtMap)
        .map(([distrito_sanitario, data]) => ({
          distrito_sanitario,
          total_profesionales: data.profesionales.length,
          total_centros: centerCounts[distrito_sanitario] || 0,
          areas_mas_comunes: Array.from(data.areas).slice(0, 3),
        }))
        .sort((a, b) => b.total_profesionales - a.total_profesionales);
    },
  });
};

// Hook for age range statistics
export const useAgeRangeStats = () => {
  return useQuery({
    queryKey: ["ageRangeStats"],
    queryFn: async (): Promise<AgeRangeStats[]> => {
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("edad")
        .eq("estado_solicitud", "Aprobado")
        .not("edad", "is", null);

      if (error) throw error;

      const ageRanges = data.reduce(
        (acc, prof) => {
          const edad = prof.edad!;
          let rango = "";

          if (edad < 25) rango = "< 25 años";
          else if (edad < 35) rango = "25-34 años";
          else if (edad < 45) rango = "35-44 años";
          else if (edad < 55) rango = "45-54 años";
          else if (edad < 65) rango = "55-64 años";
          else rango = "65+ años";

          acc[rango] = (acc[rango] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const total = Object.values(ageRanges).reduce(
        (sum, count) => sum + count,
        0,
      );

      return Object.entries(ageRanges)
        .map(([rango_edad, cantidad]) => ({
          rango_edad,
          cantidad,
          porcentaje: (cantidad / total) * 100,
        }))
        .sort((a, b) => {
          const order = [
            "< 25 años",
            "25-34 años",
            "35-44 años",
            "45-54 años",
            "55-64 años",
            "65+ años",
          ];
          return order.indexOf(a.rango_edad) - order.indexOf(b.rango_edad);
        });
    },
  });
};

// Hook for graduation year statistics
export const useGraduationYearStats = () => {
  return useQuery({
    queryKey: ["graduationYearStats"],
    queryFn: async (): Promise<GraduationYearStats[]> => {
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("año_graduacion")
        .eq("estado_solicitud", "Aprobado")
        .not("año_graduacion", "is", null)
        .gte("año_graduacion", 1990) // Filter reasonable years
        .lte("año_graduacion", new Date().getFullYear());

      if (error) throw error;

      const yearCounts = data.reduce(
        (acc, prof) => {
          const año = prof.año_graduacion!;
          acc[año] = (acc[año] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>,
      );

      return Object.entries(yearCounts)
        .map(([año, cantidad]) => ({
          año_graduacion: parseInt(año),
          cantidad,
        }))
        .sort((a, b) => b.año_graduacion - a.año_graduacion)
        .slice(0, 20); // Last 20 years
    },
  });
};

// Hook for countries of formation statistics
export const useCountryStats = () => {
  return useQuery({
    queryKey: ["countryStats"],
    queryFn: async (): Promise<CountryStats[]> => {
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("pais_formacion_1, pais_formacion_2")
        .eq("estado_solicitud", "Aprobado");

      if (error) throw error;

      const countryCounts = data.reduce(
        (acc, prof) => {
          [prof.pais_formacion_1, prof.pais_formacion_2].forEach((pais) => {
            if (pais && pais.trim()) {
              acc[pais] = (acc[pais] || 0) + 1;
            }
          });
          return acc;
        },
        {} as Record<string, number>,
      );

      const total = Object.values(countryCounts).reduce(
        (sum, count) => sum + count,
        0,
      );

      return Object.entries(countryCounts)
        .map(([pais_formacion, cantidad]) => ({
          pais_formacion,
          cantidad,
          porcentaje: (cantidad / total) * 100,
        }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10);
    },
  });
};

// Hook for institution statistics
export const useInstitutionStats = () => {
  return useQuery({
    queryKey: ["institutionStats"],
    queryFn: async (): Promise<InstitutionStats[]> => {
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select(
          "institucion_1, institucion_2, pais_formacion_1, pais_formacion_2",
        )
        .eq("estado_solicitud", "Aprobado");

      if (error) throw error;

      const institutionCounts = data.reduce(
        (acc, prof) => {
          const institutions = [
            { inst: prof.institucion_1, pais: prof.pais_formacion_1 },
            { inst: prof.institucion_2, pais: prof.pais_formacion_2 },
          ];

          institutions.forEach(({ inst, pais }) => {
            if (inst && inst.trim()) {
              if (!acc[inst]) {
                acc[inst] = { cantidad: 0, pais: pais || null };
              }
              acc[inst].cantidad++;
            }
          });

          return acc;
        },
        {} as Record<string, { cantidad: number; pais: string | null }>,
      );

      return Object.entries(institutionCounts)
        .map(([institucion, data]) => ({
          institucion,
          cantidad: data.cantidad,
          pais: data.pais,
        }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 15);
    },
  });
};

// Hook for center category statistics
export const useCenterCategoryStats = () => {
  return useQuery({
    queryKey: ["centerCategoryStats"],
    queryFn: async (): Promise<CenterCategoryStats[]> => {
      const { data: centers, error } = await supabase
        .from("centros_salud")
        .select("categoria, nombre");

      if (error) throw error;

      const categoryGroups = centers.reduce(
        (acc, center) => {
          if (!acc[center.categoria]) {
            acc[center.categoria] = [];
          }
          acc[center.categoria].push(center.nombre);
          return acc;
        },
        {} as Record<string, string[]>,
      );

      const statsPromises = Object.entries(categoryGroups).map(
        async ([categoria, centerNames]) => {
          const { count } = await supabase
            .from("profesionales_sanitarios")
            .select("*", { count: "exact", head: true })
            .or(
              `nombre_centro.in.(${centerNames.map((name) => `"${name}"`).join(",")}),lugar_trabajo.in.(${centerNames.map((name) => `"${name}"`).join(",")})`,
            )
            .eq("estado_solicitud", "Aprobado");

          return {
            categoria,
            total_centros: centerNames.length,
            total_profesionales: count || 0,
            promedio_profesionales_por_centro:
              (count || 0) / centerNames.length,
          };
        },
      );

      const results = await Promise.all(statsPromises);
      return results.sort(
        (a, b) => b.total_profesionales - a.total_profesionales,
      );
    },
  });
};

// Hook for categoria_titulacion statistics
export const useTitulacionCategoryStats = () => {
  return useQuery({
    queryKey: ["titulacionCategoryStats"],
    queryFn: async (): Promise<TitulacionCategoryStats[]> => {
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("categoria_titulacion, estado_solicitud")
        .not("categoria_titulacion", "is", null);

      if (error) throw error;

      const titulacionStats = data.reduce(
        (acc, prof) => {
          const categoria = prof.categoria_titulacion!;
          if (!acc[categoria]) {
            acc[categoria] = { total: 0, aprobados: 0, pendientes: 0 };
          }

          acc[categoria].total++;
          if (prof.estado_solicitud === "Aprobado") {
            acc[categoria].aprobados++;
          } else {
            acc[categoria].pendientes++;
          }

          return acc;
        },
        {} as Record<
          string,
          { total: number; aprobados: number; pendientes: number }
        >,
      );

      const totalProfessionals = Object.values(titulacionStats).reduce(
        (sum, categoria) => sum + categoria.total,
        0,
      );

      return Object.entries(titulacionStats)
        .map(([categoria_titulacion, stats]) => ({
          categoria_titulacion,
          ...stats,
          porcentaje: (stats.total / totalProfessionals) * 100,
        }))
        .sort((a, b) => b.total - a.total);
    },
  });
};
