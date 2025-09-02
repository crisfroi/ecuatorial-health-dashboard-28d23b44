import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function useDistritosSanitarios() {
  return useQuery({
    queryKey: ["distritos-sanitarios"],
    queryFn: async () => {
      console.log("Fetching distritos sanitarios...");

      const { data, error } = await supabase
        .from("distrito_sanitario")
        .select("*")
        .order("nombre_distrito", { ascending: true });

      if (error) {
        console.error(
          "Error fetching distritos sanitarios:",
          error.message || error,
        );
        throw error;
      }

      console.log("Fetched distritos sanitarios:", data?.length || 0);
      return data || [];
    },
  });
}
