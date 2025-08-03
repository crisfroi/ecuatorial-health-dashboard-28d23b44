
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Professional } from "@/types/estadisticas";

export function useProfesionales() {
  return useQuery({
    queryKey: ["profesionales"],
    queryFn: async (): Promise<Professional[]> => {
      console.log("🔄 Fetching profesionales...");

      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching profesionales:", error);
        throw error;
      }

      console.log("✅ Profesionales fetched:", data?.length || 0);
      
      // Transform data to match Professional interface
      return (data || []).map(profesional => ({
        ...profesional,
        documento_identidad: profesional.numero_dip || profesional.numero_pasaporte || '',
        lugar_trabajo: profesional.nombre_centro || '',
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });
}
