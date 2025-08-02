import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicSearchResult {
  id: string;
  numero_carnet: string;
  nombre_completo: string;
  area_profesional: string;
  estado_solicitud: string;
  fecha_validez: string;
  estado_acreditacion: "vigente" | "vencido" | "proximo_vencimiento";
  dias_hasta_vencimiento: number;
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

      // Procesar resultados para agregar estado de acreditación automático
      const processedData: PublicSearchResult[] = (data || []).map((profesional) => {
        const fechaValidez = new Date(profesional.fecha_validez || "");
        const hoy = new Date();
        const diasHastaVencimiento = Math.ceil((fechaValidez.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

        let estadoAcreditacion: "vigente" | "vencido" | "proximo_vencimiento";

        if (fechaValidez <= hoy) {
          estadoAcreditacion = "vencido";
        } else if (diasHastaVencimiento <= 30) {
          estadoAcreditacion = "proximo_vencimiento";
        } else {
          estadoAcreditacion = "vigente";
        }

        return {
          ...profesional,
          estado_acreditacion: estadoAcreditacion,
          dias_hasta_vencimiento: diasHastaVencimiento,
        };
      });

      console.log("Search results:", processedData?.length || 0);
      return processedData;
    },
    enabled: false, // Solo ejecutar cuando se haga refetch manualmente
  });
}
