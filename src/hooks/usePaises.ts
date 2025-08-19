import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePaises() {
  return useQuery({
    queryKey: ["paises"],
    queryFn: async () => {
      console.log("Fetching países...");

      const { data, error } = await supabase
        .from("nacionalidades_mundo")
        .select("pais")
        .order("pais", { ascending: true });

      if (error) {
        console.error("Error fetching países:", error.message || error);
        throw error;
      }

      // Remove duplicates and filter out null/empty values
      const uniquePaises = Array.from(
        new Set(data?.map(item => item.pais).filter(pais => pais && pais.trim() !== ''))
      ).sort();

      console.log("Fetched países:", uniquePaises?.length || 0);
      return uniquePaises || [];
    },
  });
}
