import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Asegúrate de que tu tipo Profesional incluya 'motivo_rechazo'
export type Profesional =
  Database["public"]["Tables"]["profesionales_sanitarios"]["Row"] & {
    motivo_rechazo?: string; // Aseguramos que el tipo incluya esta propiedad
  };
export type ProfesionalInsert =
  Database["public"]["Tables"]["profesionales_sanitarios"]["Insert"];
export type ProfesionalUpdate =
  Database["public"]["Tables"]["profesionales_sanitarios"]["Update"];

interface Filtros {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  search?: string; // Para búsquedas de texto general
  distrito?: string;
  anoGraduacion?: string;
  // --- NUEVOS FILTROS DE FECHA ---
  fecha_solicitud_gte?: string; // Greater Than or Equal (Fecha de inicio)
  fecha_solicitud_lte?: string; // Less Than or Equal (Fecha de fin)
  // --- FIN NUEVOS FILTROS ---
}

export function useProfesionales(filtros: Filtros = {}) {
  return useQuery({
    queryKey: ["profesionales", filtros],
    queryFn: async () => {
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

      if (filtros.anoGraduacion && filtros.anoGraduacion !== "todos") {
        query = query.eq("año_graduacion", parseInt(filtros.anoGraduacion));
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
        console.error("Error fetching profesionales:", error.message || error);
        throw error;
      }

      console.log("Fetched profesionales:", data?.length || 0);
      return data || [];
    },
  });
}
