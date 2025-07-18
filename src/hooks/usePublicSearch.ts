import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicSearchResult {
  id: string;
  numero_carnet: string;
  nombre_completo: string;
  area_profesional: string;
  estado_solicitud: string;
  fecha_validez: string;
}

export function usePublicSearch(
  searchTerm: string,
  searchType: "carnet" | "nombre",
) {
  return useQuery({
    queryKey: ["public-search", searchTerm, searchType],
    queryFn: async (): Promise<PublicSearchResult[]> => {
      if (!searchTerm.trim()) {
        return [];
      }

      console.log("Searching for:", searchTerm, "by:", searchType);

      let query = supabase.from("busqueda_profesionales_publica").select("*");

      if (searchType === "carnet") {
        query = query.ilike("numero_carnet", `%${searchTerm}%`);
      } else {
        query = query.ilike("nombre_completo", `%${searchTerm}%`);
      }

      const { data, error } = await query
        .eq("estado_solicitud", "Aprobado")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error searching professionals:", error.message || error);
        throw error;
      }

      console.log("Search results:", data?.length || 0);
      return data || [];
    },
    enabled: false, // Solo ejecutar cuando se haga refetch manualmente
  });
}
