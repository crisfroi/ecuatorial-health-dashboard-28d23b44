import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseISO, differenceInYears } from 'date-fns'; 

// --- 1. TIPOS DE DATOS Y ESTRUCTURAS ---

// Tipo de datos de un profesional (mínimo necesario para la agregación)
interface ProfessionalData {
    id: string;
    pais_formacion_1: string | null;
    pais_formacion_2: string | null;
    institucion_1: string | null;
    institucion_2: string | null;
    fecha_nacimiento: string | null;
    area_profesional: string | null;
    estado_solicitud: string;
    // <--- NUEVOS CAMPOS AÑADIDOS
    genero: 'M' | 'F' | 'Otro' | null; 
    categoria_titulacion: string | null; 
    funcion_publica: boolean | null; 
    // FIN NUEVOS CAMPOS AÑADIDOS --->
}

// Interfaces de las métricas (lo que devolverá el hook)
export interface GeographicFilters {
  distrito_sanitario?: string;
  provincia?: string;
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

export interface AreaProfessionalStats {
  area_profesional: string;
  total: number;
  aprobados: number;
  pendientes: number;
  porcentaje: number;
}

export interface AgeRangeStats {
  rango_edad: string;
  cantidad: number;
  porcentaje: number;
}

// <--- NUEVOS TIPOS DE ESTADÍSTICAS AÑADIDOS
export interface GenderStats { 
    genero: string;
    cantidad: number;
    porcentaje: number;
}

export interface TitulacionStats { 
    categoria: string;
    cantidad: number;
    porcentaje: number;
}

export interface PublicServantStats { 
    tipo: 'Funcionario Público' | 'No Funcionario' | 'Desconocido';
    cantidad: number;
    porcentaje: number;
}
// FIN NUEVOS TIPOS DE ESTADÍSTICAS AÑADIDOS --->

// Interfaz del resumen completo (ACTUALIZADA)
export interface GeographicAnalyticsSummary {
    areaName: string; 
    total_profesionales: number;
    total_centros: number;
    profesionales_por_area: AreaProfessionalStats[]; 
    rango_edades: AgeRangeStats[];
    paises_formacion: CountryStats[];
    instituciones_top: InstitutionStats[];
    // <--- NUEVAS ESTADÍSTICAS EN EL RESUMEN
    estadisticas_genero: GenderStats[];
    estadisticas_titulacion: TitulacionStats[];
    estadisticas_funcionario: PublicServantStats[];
    // FIN NUEVAS ESTADÍSTICAS EN EL RESUMEN --->
}


// --- 2. FUNCIONES AUXILIARES PARA EL CÁLCULO DE MÉTRICAS ---
// (Las funciones existentes se mantienen y se añaden las nuevas)

const aggregateCountryStats = (professionals: ProfessionalData[]): CountryStats[] => {
    const counts = professionals.reduce((acc, prof) => {
        [prof.pais_formacion_1, prof.pais_formacion_2].forEach((pais) => {
          if (pais && pais.trim()) acc[pais] = (acc[pais] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);
    const total = Object.values(counts).reduce((s, c) => s + c, 0);
    return Object.entries(counts).map(([pais_formacion, cantidad]) => ({
      pais_formacion, cantidad, porcentaje: total ? (cantidad / total) * 100 : 0,
    })).sort((a, b) => b.cantidad - a.cantidad);
};

const aggregateInstitutionStats = (professionals: ProfessionalData[]): InstitutionStats[] => {
    const map = professionals.reduce((acc, prof) => {
        const institutions = [
            { inst: prof.institucion_1, pais: prof.pais_formacion_1 },
            { inst: prof.institucion_2, pais: prof.pais_formacion_2 },
        ];
        institutions.forEach(({ inst, pais }) => {
            if (inst && inst.trim()) {
                if (!acc[inst]) acc[inst] = { cantidad: 0, pais: pais || null };
                acc[inst].cantidad++;
            }
        });
        return acc;
    }, {} as Record<string, { cantidad: number; pais: string | null }>);

    return Object.entries(map).map(([institucion, data]) => ({
        institucion,
        cantidad: data.cantidad,
        pais: data.pais,
    })).sort((a, b) => b.cantidad - a.cantidad);
};

const aggregateAgeRangeStats = (professionals: ProfessionalData[]): AgeRangeStats[] => {
  const now = new Date();
  const ranges = {'18-29': 0, '30-39': 0, '40-49': 0, '50-59': 0, '60+': 0};
  let totalCount = 0;

  (professionals || []).forEach((p) => {
    if (!p.fecha_nacimiento) return;
    try {
        const birthDate = parseISO(p.fecha_nacimiento);
        const age = differenceInYears(now, birthDate);
        
        if (age >= 18 && age <= 29) ranges['18-29']++;
        else if (age >= 30 && age <= 39) ranges['30-39']++;
        else if (age >= 40 && age <= 49) ranges['40-49']++;
        else if (age >= 50 && age <= 59) ranges['50-59']++;
        else if (age >= 60) ranges['60+']++;
        else return;
        
        totalCount++;

    } catch (e) { /* ignore */ }
  });

  return Object.entries(ranges).map(([rango_edad, cantidad]) => ({
      rango_edad, cantidad, porcentaje: totalCount ? (cantidad / totalCount) * 100 : 0,
  })).filter(r => r.cantidad > 0);
};

const aggregateAreaStats = (professionals: ProfessionalData[]): AreaProfessionalStats[] => {
    const map = professionals.reduce((acc, p) => {
        const area = p.area_profesional || 'Desconocida';
        if (!acc[area]) acc[area] = { area_profesional: area, total: 0, aprobados: 0, pendientes: 0, porcentaje: 0 };
        acc[area].total++;
        if (p.estado_solicitud === 'Aprobado') acc[area].aprobados++;
        else if (p.estado_solicitud === 'Pendiente') acc[area].pendientes++;
        return acc;
    }, {} as Record<string, AreaProfessionalStats>);
    
    const totalGlobal = professionals.length;

    return Object.values(map)
        .map(item => ({
            ...item,
            porcentaje: totalGlobal ? (item.total / totalGlobal) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total);
};


// <--- NUEVAS FUNCIONES DE AGREGACIÓN AÑADIDAS
const aggregateGenderStats = (professionals: ProfessionalData[]): GenderStats[] => {
    const counts = professionals.reduce((acc, p) => {
        const key = p.genero || 'Sin especificar';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const total = professionals.length;
    
    return Object.entries(counts).map(([genero, cantidad]) => ({
        genero, 
        cantidad, 
        porcentaje: total ? (cantidad / total) * 100 : 0,
    })).sort((a, b) => b.cantidad - a.cantidad);
};

const aggregateTitulacionStats = (professionals: ProfessionalData[]): TitulacionStats[] => {
    const counts = professionals.reduce((acc, p) => {
        const key = p.categoria_titulacion || 'Sin especificar';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const total = professionals.length;
    
    return Object.entries(counts).map(([categoria, cantidad]) => ({
        categoria, 
        cantidad, 
        porcentaje: total ? (cantidad / total) * 100 : 0,
    })).sort((a, b) => b.cantidad - a.cantidad);
};

const aggregatePublicServantStats = (professionals: ProfessionalData[]): PublicServantStats[] => {
    const counts: Record<PublicServantStats['tipo'], number> = { 
        'Funcionario Público': 0, 
        'No Funcionario': 0, 
        'Desconocido': 0 
    };
    
    professionals.forEach(p => {
        if (p.funcion_publica === true) {
            counts['Funcionario Público']++;
        } else if (p.funcion_publica === false) {
            counts['No Funcionario']++;
        } else {
            counts['Desconocido']++;
        }
    });

    const total = professionals.length;
    
    return Object.entries(counts).map(([tipo, cantidad]) => ({
        tipo: tipo as PublicServantStats['tipo'],
        cantidad, 
        porcentaje: total ? (cantidad / total) * 100 : 0,
    })).filter(s => s.cantidad > 0);
};
// FIN NUEVAS FUNCIONES DE AGREGACIÓN AÑADIDAS --->


// --- 3. HOOK PRINCIPAL ---

export const useGeographicAnalytics = (filters: GeographicFilters) => {
  const queryKey = ["geographicAnalytics", filters];
  const areaName = filters.distrito_sanitario || filters.provincia || "Toda la Región";

  return useQuery({
    queryKey,
    queryFn: async (): Promise<GeographicAnalyticsSummary> => {
      
      // 1. Consulta base de Profesionales (ACTUALIZADA PARA INCLUIR NUEVOS CAMPOS)
      let profQuery = supabase
        .from("profesionales_sanitarios")
        .select(`
          id, pais_formacion_1, pais_formacion_2, institucion_1, institucion_2, 
          fecha_nacimiento, area_profesional, estado_solicitud,
          genero, categoria_titulacion, funcion_publica // <-- AÑADIDOS
        `)
        .eq("estado_solicitud", "Aprobado"); 
      
      if (filters.distrito_sanitario) {
          profQuery = profQuery.eq("distrito_sanitario", filters.distrito_sanitario);
      } else if (filters.provincia) {
          profQuery = profQuery.eq("provincia", filters.provincia);
      }
      
      // 2. Consulta de Centros de Salud (solo el conteo)
      let centrosQuery = supabase.from("centros_salud").select("id", { count: 'exact', head: true });

      if (filters.distrito_sanitario) {
          centrosQuery = centrosQuery.eq("distrito_sanitario", filters.distrito_sanitario);
      } else if (filters.provincia) {
          centrosQuery = centrosQuery.eq("provincia", filters.provincia);
      }

      // 3. Ejecutar todas las consultas en paralelo
      const [profDataResult, centrosDataResult] = await Promise.all([
        profQuery,
        centrosQuery
      ]);
      
      if (profDataResult.error) throw profDataResult.error;
      if (centrosDataResult.error) throw centrosDataResult.error;

      // 4. Procesar y Consolidar Datos (ACTUALIZADA PARA INCLUIR NUEVAS MÉTRICAS)
      const allProfessionals = profDataResult.data as ProfessionalData[] || [];
      
      return {
          areaName,
          total_profesionales: allProfessionals.length,
          total_centros: centrosDataResult.count || 0,
          profesionales_por_area: aggregateAreaStats(allProfessionals),
          rango_edades: aggregateAgeRangeStats(allProfessionals),
          paises_formacion: aggregateCountryStats(allProfessionals),
          instituciones_top: aggregateInstitutionStats(allProfessionals),
          // <--- NUEVAS MÉTRICAS EN EL RETORNO
          estadisticas_genero: aggregateGenderStats(allProfessionals),
          estadisticas_titulacion: aggregateTitulacionStats(allProfessionals),
          estadisticas_funcionario: aggregatePublicServantStats(allProfessionals),
          // FIN NUEVAS MÉTRICAS EN EL RETORNO --->
      } as GeographicAnalyticsSummary;
    },
    enabled: !!(filters.distrito_sanitario || filters.provincia),
    staleTime: 60_000,
  });
};