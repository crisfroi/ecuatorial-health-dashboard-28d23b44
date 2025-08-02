
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Simplified Professional type based on database schema
export interface Profesional {
  id: string;
  nombre_completo: string;
  nombre?: string | null;
  apellidos?: string | null;
  genero?: string | null;
  edad?: number | null;
  fecha_nacimiento?: string | null;
  nacionalidad?: string | null;
  numero_documento?: string | null;
  tipo_documento?: string | null;
  email?: string | null;
  telefono?: string | null;
  domicilio?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  distrito_sanitario?: string | null;
  area_profesional?: string | null;
  especialidad?: string | null;
  año_graduacion?: number | null;
  institucion_1?: string | null;
  periodo_formacion_1?: string | null;
  pais_formacion_1?: string | null;
  nombre_centro?: string | null;
  categoria_centro?: string | null;
  tipo_sector?: string | null;
  puesto_responsabilidad?: string | null;
  estado_solicitud?: string | null;
  fecha_solicitud?: string | null;
  fecha_emision?: string | null;
  fecha_caducidad?: string | null;
  numero_autonumerico_correlativo?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  
  // Additional computed fields for backward compatibility
  documento_identidad?: string;
  lugar_trabajo?: string;
  universidad?: string;
  numero_carnet_profesional?: string;
  motivo_rechazo?: string;
  foto_carnet_base64?: string;
  fecha_graduacion?: number;
  codigo_barras?: string;
}

export type Professional = Profesional;

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

export interface Filtros {
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
  fecha_solicitud_gte?: string;
  fecha_solicitud_lte?: string;
}

export interface NavigationFilters extends Filtros {
  search?: string;
}

export function useProfesionales(filtros: Filtros = {}) {
  return useQuery({
    queryKey: ["profesionales", filtros],
    queryFn: async (): Promise<Profesional[]> => {
      console.log("Fetching profesionales with filters:", filtros);

      let query = supabase
        .from("profesionales_sanitarios")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters
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

      if (filtros.año_graduacion) {
        query = query.eq("año_graduacion", filtros.año_graduacion);
      }

      if (filtros.edad_minima !== undefined) {
        query = query.gte("edad", filtros.edad_minima);
      }

      if (filtros.edad_maxima !== undefined) {
        query = query.lte("edad", filtros.edad_maxima);
      }

      // Date filters
      if (filtros.fecha_solicitud_gte) {
        query = query.gte("created_at", filtros.fecha_solicitud_gte);
      }
      if (filtros.fecha_solicitud_lte) {
        const endDateObj = new Date(filtros.fecha_solicitud_lte);
        endDateObj.setDate(endDateObj.getDate() + 1);
        query = query.lt("created_at", endDateObj.toISOString().split("T")[0]);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching profesionales:", error.message || error);
        throw error;
      }

      console.log("Fetched profesionales:", data?.length || 0);
      
      // Transform data and add computed fields
      return (data || []).map(item => ({
        ...item,
        documento_identidad: item.numero_documento || '',
        lugar_trabajo: item.nombre_centro || '',
        universidad: item.institucion_1 || '',
        numero_carnet_profesional: item.numero_autonumerico_correlativo?.toString() || ''
      }));
    },
  });
}
