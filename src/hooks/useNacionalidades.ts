import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useNacionalidades() {
  return useQuery({
    queryKey: ["nacionalidades"],
    queryFn: async () => {
      console.log("Fetching nacionalidades...");

      const { data, error } = await supabase
        .from("nacionalidades_mundo")
        .select("*")
        .order("nacionalidad", { ascending: true });

      if (error) {
        console.error("Error fetching nacionalidades:", error.message || error);
        throw error;
      }

      console.log("Fetched nacionalidades:", data?.length || 0);
      return data || [];
    },
  });
}
