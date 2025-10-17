import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Pais {
  id: number;
  pais: string;
}

export function usePaises() {
  return useQuery({
    queryKey: ["paises"],
    queryFn: async (): Promise<Pais[]> => {
      console.log("Fetching países...");

      // CAMBIO CLAVE: Seleccionar 'id' y 'pais'
      const { data, error } = await supabase
        .from("nacionalidades_mundo")
        .select("id, pais")
        .order("pais", { ascending: true });

      if (error) {
        console.error("Error fetching países:", error.message || error);
        throw error;
      }

      // Filtrar y deduplicar por nombre de país (aunque es mejor que la DB ya esté limpia)
      const uniquePaisesMap = new Map<string, Pais>();
      data?.forEach(item => {
        if (item.pais && item.pais.trim() !== '' && !uniquePaisesMap.has(item.pais.trim().toUpperCase())) {
          uniquePaisesMap.set(item.pais.trim().toUpperCase(), {
            id: item.id,
            pais: item.pais.trim()
          });
        }
      });
      
      const uniquePaises = Array.from(uniquePaisesMap.values()).sort((a, b) => a.pais.localeCompare(b.pais));

      console.log("Fetched países:", uniquePaises?.length || 0);
      return uniquePaises || [];
    },
  });
}
