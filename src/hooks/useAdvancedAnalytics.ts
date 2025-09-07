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
export const useTopCenters = (filters?: Partial<{ provincia: string; distrito_sanitario: string; distrito: string; sector: string }>) => {
  return useQuery({
    queryKey: ["topCenters", filters || null],
    queryFn: async (): Promise<TopCenter[]> => {
      let centersQuery = supabase
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

      if (filters?.provincia) centersQuery = centersQuery.eq('provincia', filters.provincia);
      if (filters?.distrito_sanitario) centersQuery = centersQuery.eq('distrito_sanitario', filters.distrito_sanitario);
      if (filters?.distrito) centersQuery = centersQuery.eq('distrito', filters.distrito);
      if (filters?.sector) centersQuery = centersQuery.eq('sector', filters.sector);

      const { data, error } = await centersQuery;

      if (error) throw error;

      // Get professionals count for each center using nombre_centro and centro_salud_id fields
      const centersWithCounts = await Promise.all(
        data.map(async (center) => {
          const { count } = await supabase
            .from("profesionales_sanitarios")
            .select("id", { count: "exact", head: true })
            .eq("estado_solicitud", "Aprobado")
            .or(`nombre_centro.eq.${center.nombre},centro_salud_id.eq.${center.id}`);

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
export const useAreaProfessionalStats = (filters?: Partial<{ provincia: string; distrito_sanitario: string; distrito: string; genero: string; tipo_sector: string; centro_id: string; centro_nombre: string; edad_minima: number; edad_maxima: number; año_graduacion: number }>) => {
  return useQuery({
    queryKey: ["areaProfessionalStats", filters || null],
    queryFn: async (): Promise<AreaProfessionalStats[]> => {
      let profQuery = supabase
        .from("profesionales_sanitarios")
        .select("area_profesional, estado_solicitud")
        .not("area_profesional", "is", null);

      if (filters?.provincia) profQuery = profQuery.eq('provincia', filters.provincia);
      if (filters?.distrito_sanitario) profQuery = profQuery.eq('distrito_sanitario', filters.distrito_sanitario);
      if (filters?.distrito) profQuery = profQuery.eq('distrito', filters.distrito);
      if (filters?.genero) profQuery = profQuery.eq('genero', filters.genero);
      if (filters?.tipo_sector) profQuery = profQuery.eq('tipo_sector', filters.tipo_sector);
      if (filters?.centro_id) profQuery = profQuery.eq('centro_salud_id', filters.centro_id);
      if (!filters?.centro_id && filters?.centro_nombre) profQuery = profQuery.eq('nombre_centro', filters.centro_nombre);
      if (typeof filters?.edad_minima === 'number') profQuery = profQuery.gte('edad', filters.edad_minima);
      if (typeof filters?.edad_maxima === 'number') profQuery = profQuery.lte('edad', filters.edad_maxima);
      if (typeof filters?.año_graduacion === 'number') profQuery = profQuery.eq('año_graduacion', filters.año_graduacion);

      const { data, error } = await profQuery;

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
export const useDistrictStats = (filters?: Partial<{ provincia: string; distrito_sanitario: string; distrito: string; genero: string; tipo_sector: string; centro_id: string; centro_nombre: string }>) => {
  return useQuery({
    queryKey: ["districtStats", filters || null],
    queryFn: async (): Promise<DistrictStats[]> => {
      // Get professionals by district
      let profQuery = supabase
        .from("profesionales_sanitarios")
        .select("distrito_sanitario, area_profesional")
        .eq("estado_solicitud", "Aprobado")
        .not("distrito_sanitario", "is", null);
      if (filters?.provincia) profQuery = profQuery.eq('provincia', filters.provincia);
      if (filters?.distrito_sanitario) profQuery = profQuery.eq('distrito_sanitario', filters.distrito_sanitario);
      if (filters?.distrito) profQuery = profQuery.eq('distrito', filters.distrito);
      if (filters?.genero) profQuery = profQuery.eq('genero', filters.genero);
      if (filters?.tipo_sector) profQuery = profQuery.eq('tipo_sector', filters.tipo_sector);
      if (filters?.centro_id) profQuery = profQuery.eq('centro_salud_id', filters.centro_id);
      if (!filters?.centro_id && filters?.centro_nombre) profQuery = profQuery.eq('nombre_centro', filters.centro_nombre);
      const { data: profData, error: profError } = await profQuery;

      if (profError) throw profError;

      // Get centers by district
      let centerQuery = supabase
        .from("centros_salud")
        .select("distrito_sanitario")
        .not("distrito_sanitario", "is", null);
      if (filters?.provincia) centerQuery = centerQuery.eq('provincia', filters.provincia);
      if (filters?.distrito_sanitario) centerQuery = centerQuery.eq('distrito_sanitario', filters.distrito_sanitario);
      if (filters?.distrito) centerQuery = centerQuery.eq('distrito', filters.distrito);
      if (filters?.tipo_sector) centerQuery = centerQuery.eq('sector', filters.tipo_sector);
      const { data: centerData, error: centerError } = await centerQuery;

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
export const useAgeRangeStats = (filters?: Partial<{ provincia: string; distrito_sanitario: string; distrito: string; genero: string; tipo_sector: string; centro_id: string; centro_nombre: string; edad_minima: number; edad_maxima: number }>) => {
  return useQuery({
    queryKey: ["ageRangeStats", filters || null],
    queryFn: async (): Promise<AgeRangeStats[]> => {
      let profQuery = supabase
        .from("profesionales_sanitarios")
        .select("edad")
        .eq("estado_solicitud", "Aprobado")
        .not("edad", "is", null);
      if (filters?.provincia) profQuery = profQuery.eq('provincia', filters.provincia);
      if (filters?.distrito_sanitario) profQuery = profQuery.eq('distrito_sanitario', filters.distrito_sanitario);
      if (filters?.distrito) profQuery = profQuery.eq('distrito', filters.distrito);
      if (filters?.genero) profQuery = profQuery.eq('genero', filters.genero);
      if (filters?.tipo_sector) profQuery = profQuery.eq('tipo_sector', filters.tipo_sector);
      if (filters?.centro_id) profQuery = profQuery.eq('centro_salud_id', filters.centro_id);
      if (!filters?.centro_id && filters?.centro_nombre) profQuery = profQuery.eq('nombre_centro', filters.centro_nombre);
      if (typeof filters?.edad_minima === 'number') profQuery = profQuery.gte('edad', filters.edad_minima);
      if (typeof filters?.edad_maxima === 'number') profQuery = profQuery.lte('edad', filters.edad_maxima);
      const { data, error } = await profQuery;

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
export const useGraduationYearStats = (filters?: Partial<{ provincia: string; distrito_sanitario: string; distrito: string; genero: string; tipo_sector: string; centro_id: string; centro_nombre: string; año_graduacion: number }>) => {
  return useQuery({
    queryKey: ["graduationYearStats", filters || null],
    queryFn: async (): Promise<GraduationYearStats[]> => {
      let profQuery = supabase
        .from("profesionales_sanitarios")
        .select("año_graduacion")
        .eq("estado_solicitud", "Aprobado")
        .not("año_graduacion", "is", null)
        .gte("año_graduacion", 1990)
        .lte("año_graduacion", new Date().getFullYear());
      if (filters?.provincia) profQuery = profQuery.eq('provincia', filters.provincia);
      if (filters?.distrito_sanitario) profQuery = profQuery.eq('distrito_sanitario', filters.distrito_sanitario);
      if (filters?.distrito) profQuery = profQuery.eq('distrito', filters.distrito);
      if (filters?.genero) profQuery = profQuery.eq('genero', filters.genero);
      if (filters?.tipo_sector) profQuery = profQuery.eq('tipo_sector', filters.tipo_sector);
      if (filters?.centro_id) profQuery = profQuery.eq('centro_salud_id', filters.centro_id);
      if (!filters?.centro_id && filters?.centro_nombre) profQuery = profQuery.eq('nombre_centro', filters.centro_nombre);
      if (typeof filters?.año_graduacion === 'number') profQuery = profQuery.eq('año_graduacion', filters.año_graduacion);
      const { data, error } = await profQuery;

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
export const useCountryStats = (filters?: Partial<{ provincia: string; distrito_sanitario: string; distrito: string; genero: string; tipo_sector: string; centro_id: string; centro_nombre: string }>) => {
  return useQuery({
    queryKey: ["countryStats", filters || null],
    queryFn: async (): Promise<CountryStats[]> => {
      let profQuery = supabase
        .from("profesionales_sanitarios")
        .select("pais_formacion_1, pais_formacion_2")
        .eq("estado_solicitud", "Aprobado");
      if (filters?.provincia) profQuery = profQuery.eq('provincia', filters.provincia);
      if (filters?.distrito_sanitario) profQuery = profQuery.eq('distrito_sanitario', filters.distrito_sanitario);
      if (filters?.distrito) profQuery = profQuery.eq('distrito', filters.distrito);
      if (filters?.genero) profQuery = profQuery.eq('genero', filters.genero);
      if (filters?.tipo_sector) profQuery = profQuery.eq('tipo_sector', filters.tipo_sector);
      if (filters?.centro_id) profQuery = profQuery.eq('centro_salud_id', filters.centro_id);
      if (!filters?.centro_id && filters?.centro_nombre) profQuery = profQuery.eq('nombre_centro', filters.centro_nombre);
      const { data, error } = await profQuery;

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
export const useInstitutionStats = (filters?: Partial<{ provincia: string; distrito_sanitario: string; distrito: string; genero: string; tipo_sector: string; centro_id: string; centro_nombre: string }>) => {
  return useQuery({
    queryKey: ["institutionStats", filters || null],
    queryFn: async (): Promise<InstitutionStats[]> => {
      let profQuery = supabase
        .from("profesionales_sanitarios")
        .select(
          "institucion_1, institucion_2, pais_formacion_1, pais_formacion_2",
        )
        .eq("estado_solicitud", "Aprobado");
      if (filters?.provincia) profQuery = profQuery.eq('provincia', filters.provincia);
      if (filters?.distrito_sanitario) profQuery = profQuery.eq('distrito_sanitario', filters.distrito_sanitario);
      if (filters?.distrito) profQuery = profQuery.eq('distrito', filters.distrito);
      if (filters?.genero) profQuery = profQuery.eq('genero', filters.genero);
      if (filters?.tipo_sector) profQuery = profQuery.eq('tipo_sector', filters.tipo_sector);
      if (filters?.centro_id) profQuery = profQuery.eq('centro_salud_id', filters.centro_id);
      if (!filters?.centro_id && filters?.centro_nombre) profQuery = profQuery.eq('nombre_centro', filters.centro_nombre);
      const { data, error } = await profQuery;

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
export const useCenterCategoryStats = (filters?: Partial<{ provincia: string; distrito_sanitario: string; distrito: string; sector: string }>) => {
  return useQuery({
    queryKey: ["centerCategoryStats", filters || null],
    queryFn: async (): Promise<CenterCategoryStats[]> => {
      let centersQuery = supabase
        .from("centros_salud")
        .select("categoria, nombre, id");
      if (filters?.provincia) centersQuery = centersQuery.eq('provincia', filters.provincia);
      if (filters?.distrito_sanitario) centersQuery = centersQuery.eq('distrito_sanitario', filters.distrito_sanitario);
      if (filters?.distrito) centersQuery = centersQuery.eq('distrito', filters.distrito);
      if (filters?.sector) centersQuery = centersQuery.eq('sector', filters.sector);
      const { data: centers, error } = await centersQuery;

      if (error) throw error;

      const categoryGroups = centers.reduce(
        (acc, center) => {
          if (!acc[center.categoria]) {
            acc[center.categoria] = { names: [], ids: [] };
          }
          acc[center.categoria].names.push(center.nombre);
          acc[center.categoria].ids.push(center.id);
          return acc;
        },
        {} as Record<string, { names: string[]; ids: string[] }>,
      );

      const statsPromises = Object.entries(categoryGroups).map(
        async ([categoria, group]) => {
          const namesList = group.names.map((name) => `"${name}"`).join(",");
          const idsList = group.ids.map((id) => `"${id}"`).join(",");
          const { count } = await supabase
            .from("profesionales_sanitarios")
            .select("id", { count: "exact", head: true })
            .eq("estado_solicitud", "Aprobado")
            .or(`nombre_centro.in.(${namesList}),centro_salud_id.in.(${idsList})`);

          return {
            categoria,
            total_centros: group.names.length,
            total_profesionales: count || 0,
            promedio_profesionales_por_centro:
              (count || 0) / group.names.length,
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
export const useTitulacionCategoryStats = (filters?: Partial<{ provincia: string; distrito_sanitario: string; distrito: string; genero: string; tipo_sector: string; centro_id: string; centro_nombre: string }>) => {
  return useQuery({
    queryKey: ["titulacionCategoryStats", filters || null],
    queryFn: async (): Promise<TitulacionCategoryStats[]> => {
      let profQuery = supabase
        .from("profesionales_sanitarios")
        .select("categoria_titulacion, estado_solicitud")
        .not("categoria_titulacion", "is", null);
      if (filters?.provincia) profQuery = profQuery.eq('provincia', filters.provincia);
      if (filters?.distrito_sanitario) profQuery = profQuery.eq('distrito_sanitario', filters.distrito_sanitario);
      if (filters?.distrito) profQuery = profQuery.eq('distrito', filters.distrito);
      if (filters?.genero) profQuery = profQuery.eq('genero', filters.genero);
      if (filters?.tipo_sector) profQuery = profQuery.eq('tipo_sector', filters.tipo_sector);
      if (filters?.centro_id) profQuery = profQuery.eq('centro_salud_id', filters.centro_id);
      if (!filters?.centro_id && filters?.centro_nombre) profQuery = profQuery.eq('nombre_centro', filters.centro_nombre);
      const { data, error } = await profQuery;

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
