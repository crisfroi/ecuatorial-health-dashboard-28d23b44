import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/utils/errorHandler";
import type { Database } from "@/integrations/supabase/types";

export type Profesional =
  Database["public"]["Tables"]["profesionales_sanitarios"]["Row"] & {
    motivo_rechazo?: string;
    universidad?: string;
    lugar_trabajo?: string;
    documento_identidad?: string;
    numero_carnet_profesional?: string;
    foto_carnet_base64?: string;
    fecha_graduacion?: number;
    codigo_barras?: string;
  };

export type ProfesionalInsert =
  Database["public"]["Tables"]["profesionales_sanitarios"]["Insert"];
export type ProfesionalUpdate =
  Database["public"]["Tables"]["profesionales_sanitarios"]["Update"];

// Tipo para las alertas de renovación
export interface ProfesionalAlert {
  id: string;
  nombre_completo: string;
  area_profesional: string;
  fecha_caducidad: string;
  estado_solicitud: string;
  numero_carnet_profesional?: string;
  lugar_trabajo?: string;
  email?: string;
  telefono?: string;
}

// Tipo Professional con todas las propiedades necesarias
export type Professional = Profesional & {
  documento_identidad: string;
  lugar_trabajo: string;
};

interface Filtros {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  distrito?: string;
  distrito_sanitario?: string;
  anoGraduacion?: string;
  lugar_trabajo?: string;
  edad_minima?: number;
  edad_maxima?: number;
  año_graduacion?: number;
  categoria_titulacion?: string;
  categoria_centro?: string;
  // Filtros de fecha
  fecha_solicitud_gte?: string;
  fecha_solicitud_lte?: string;
}

// Tipo para filtros de navegación - incluye todas las propiedades necesarias
export interface NavigationFilters {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  search?: string;
  distrito?: string;
  distrito_sanitario?: string;
  anoGraduacion?: string;
  lugar_trabajo?: string;
  edad_minima?: number;
  edad_maxima?: number;
  año_graduacion?: number;
  categoria_titulacion?: string;
  categoria_centro?: string;
  fecha_solicitud_gte?: string;
  fecha_solicitud_lte?: string;
}

export function useProfesionales(filtros: Filtros = {}) {
  return useQuery({
    queryKey: ["profesionales", filtros],
    queryFn: async (): Promise<Professional[]> => {
      console.log("Fetching profesionales with filters:", filtros);

      let query = supabase
        .from("profesionales_sanitarios")
        .select("*")
        .order("created_at", { ascending: false });

      // Aplicar filtros existentes
      if (filtros.area_profesional && filtros.area_profesional !== "todos") {
        query = query.eq("area_profesional", filtros.area_profesional);
      }

      if (filtros.estado_solicitud && filtros.estado_solicitud !== "todos") {
        query = query.eq("estado_solicitud", filtros.estado_solicitud);
      }

      if (filtros.provincia && filtros.provincia !== "todos") {
        query = query.eq("provincia", filtros.provincia);
      }

      if (filtros.genero && filtros.genero !== "todos") {
        query = query.eq("genero", filtros.genero);
      }

      if (filtros.tipo_sector && filtros.tipo_sector !== "todos") {
        query = query.eq("tipo_sector", filtros.tipo_sector);
      }

      if (filtros.distrito && filtros.distrito !== "todos") {
        query = query.eq("distrito", filtros.distrito);
      }

      if (filtros.distrito_sanitario && filtros.distrito_sanitario !== "todos") {
        query = query.eq("distrito_sanitario", filtros.distrito_sanitario);
      }

      if (filtros.anoGraduacion && filtros.anoGraduacion !== "todos") {
        query = query.eq("año_graduacion", parseInt(filtros.anoGraduacion));
      }

      if (filtros.lugar_trabajo && filtros.lugar_trabajo !== "todos") {
        query = query.eq("lugar_trabajo", filtros.lugar_trabajo);
      }

      if (filtros.año_graduacion) {
        query = query.eq("año_graduacion", filtros.año_graduacion);
      }

      if (filtros.edad_minima !== undefined) {
        query = query.gte("edad", filtros.edad_minima);
      }

      if (filtros.edad_maxima !== undefined) {
        query = query.lte("edad", filtros.edad_maxima);
      }

      if (filtros.categoria_titulacion && filtros.categoria_titulacion !== "todos") {
        query = query.eq("categoria_titulacion", filtros.categoria_titulacion);
      }

      if (filtros.categoria_centro && filtros.categoria_centro !== "todos") {
        query = query.eq("categoria_centro", filtros.categoria_centro);
      }

      // --- APLICAR FILTROS DE FECHA ---
      // Asumimos que la columna para la fecha de solicitud es 'created_at' en tu tabla
      if (filtros.fecha_solicitud_gte) {
        query = query.gte("created_at", filtros.fecha_solicitud_gte);
      }
      if (filtros.fecha_solicitud_lte) {
        // Para incluir el día completo de la fecha final, ajustamos la fecha_lte
        // Si la fecha_lte es 'YYYY-MM-DD', Supabase filtra hasta el inicio de ese día.
        // Para incluir todo el día, le sumamos un día y usamos '<' (lt)
        const endDateObj = new Date(filtros.fecha_solicitud_lte);
        endDateObj.setDate(endDateObj.getDate() + 1); // Suma un día
        query = query.lt("created_at", endDateObj.toISOString().split("T")[0]);
        // Alternativa más simple si quieres justo hasta el final del día elegido:
        // query = query.lte('created_at', filtros.fecha_solicitud_lte + 'T23:59:59.999Z');
      }
      // --- FIN FILTROS DE FECHA ---

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching profesionales:", {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          filters: filtros
        });

        const errorMessage = getErrorMessage(error);
        throw new Error(`Failed to fetch professionals: ${errorMessage}`);
      }

      console.log("Fetched profesionales:", data?.length || 0);
      
      // Ensure all required properties are present
      const processedData = (data || []).map((item): Professional => ({
        ...item,
        documento_identidad: item.numero_documento || '',
        lugar_trabajo: item.lugar_trabajo || item.centro_salud_nombre || ''
      }));

      return processedData;
    },
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if ((error as any)?.code === 'PGRST301') return false;

      // Don't retry on permission errors
      if ((error as any)?.code === 'PGRST116') return false;

      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
    onError: (error) => {
      console.error("useProfesionales query failed:", error);
    },
  });
}
