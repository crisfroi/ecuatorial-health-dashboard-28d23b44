import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DistritoSanitario {
  id: number;
  nombre_distrito: string;
  nombre_provincia?: string;
  abreviatura_distrito?: string;
  abreviatura_provincia?: string;
}

export const useDistritosSanitarios = (provincia?: string) => {
  const obtenerDistritos = async () => {
    let query = supabase
      .from("distrito_sanitario")
      .select("*");

    if (provincia) {
      query = query.eq("nombre_provincia", provincia);
    }

    const { data, error } = await query.order("nombre_distrito");

    if (error) {
      console.error("❌ Error al obtener distritos sanitarios:", error);
      throw error;
    }

    return data as DistritoSanitario[];
  };

  return useQuery({
    queryKey: ["distritos-sanitarios", provincia],
    queryFn: obtenerDistritos,
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};