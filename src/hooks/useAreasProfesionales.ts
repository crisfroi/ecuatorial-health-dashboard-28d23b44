import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AreaProfesional {
  id: string;
  nombre: string;
  descripcion?: string | null;
}

export function useAreasProfesionales() {
  return useQuery({
    queryKey: ["areas_profesionales"],
    queryFn: async (): Promise<AreaProfesional[]> => {
      const { data, error } = await supabase
        .from("areas_profesionales")
        .select("id, nombre, descripcion")
        .order("nombre");
      if (error) throw error;
      return (data || []) as AreaProfesional[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
