import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDistritos = (provincia?: string) => {
  const fetchDistritos = async () => {
    let query = supabase
      .from("centros_salud")
      .select("distrito, provincia")
      .not("distrito", "is", null);

    if (provincia) {
      query = query.eq("provincia", provincia);
    }

    const { data, error } = await query;
    if (error) throw error;

    const set = new Set<string>();
    for (const row of data || []) {
      const d = (row as any).distrito as string | null;
      if (d && d.trim()) set.add(d.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  };

  return useQuery({
    queryKey: ["distritos-normales", provincia],
    queryFn: fetchDistritos,
    staleTime: 5 * 60 * 1000,
  });
};
