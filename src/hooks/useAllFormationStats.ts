import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface CountryStats {
  pais_formacion: string;
  cantidad: number;
  porcentaje: number;
}

export interface InstitutionStats {
  institucion: string;
  cantidad: number;
  pais: string | null;
}

export const useAllCountryStats = () => {
  return useQuery({
    queryKey: ["allCountryStats"],
    queryFn: async (): Promise<CountryStats[]> => {
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("pais_formacion_1, pais_formacion_2")
        .eq("estado_solicitud", "Aprobado");

      if (error) throw error;

      const counts = data.reduce((acc, prof) => {
        // @ts-ignore
        [prof.pais_formacion_1, prof.pais_formacion_2].forEach((pais: string | null) => {
          if (pais && pais.trim()) acc[pais] = (acc[pais] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      const total = Object.values(counts).reduce((s, c) => s + c, 0);
      return Object.entries(counts)
        .map(([pais_formacion, cantidad]) => ({
          pais_formacion,
          cantidad,
          porcentaje: total ? (cantidad / total) * 100 : 0,
        }))
        .sort((a, b) => b.cantidad - a.cantidad);
    },
  });
};

export const useAllInstitutionStats = () => {
  return useQuery({
    queryKey: ["allInstitutionStats"],
    queryFn: async (): Promise<InstitutionStats[]> => {
        // CAMBIO: Solo seleccionamos institucion_formacion_id_1 y el objeto relacionado
        const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select(
          `
                institucion_formacion_id_1, 
                instituciones_formacion(nombre, pais), 
                institucion_2, 
                pais_formacion_2
            `
        )
        .eq("estado_solicitud", "Aprobado");

      if (error) throw error;
      if (!data) return [];


      // Definimos la estructura de datos temporal para la reducción
      type AccType = Record<string, { cantidad: number; institucion: string; pais: string | null }>;
      
      const map = data.reduce((acc, prof) => {
            
            // 1. Manejar la Titulación Principal (Usando el ID)
            const id1 = prof.institucion_formacion_id_1;
            const instData1 = (prof as any).instituciones_formacion as { nombre: string; pais: string } | null;

            if (id1 && instData1) {
                if (!acc[id1]) {
                    acc[id1] = { 
                        cantidad: 0, 
                        institucion: instData1.nombre, 
                        pais: instData1.pais || null 
                    };
                }
                acc[id1].cantidad++;
            }
            
            // 2. Manejar la Titulación Secundaria (Usando el nombre de texto, si existe)
            // (Mantenemos esta lógica ya que no tenemos un ID para la titulación 2)
            const inst2 = prof.institucion_2 as string | null;
            const pais2 = prof.pais_formacion_2 as string | null;
            
            if (inst2 && inst2.trim()) {
                // Usamos el nombre como clave si no es la principal (ya que no tenemos ID)
                const key = `SEC_${inst2}`; 
                if (!acc[key]) acc[key] = { cantidad: 0, institucion: inst2, pais: pais2 || null };
                acc[key].cantidad++;
            }

            return acc;
            
        }, {} as AccType);

      // CAMBIO: Mapeamos los valores (el array) del objeto resultante para mantener el formato de salida
      return Object.values(map)
        .sort((a, b) => b.cantidad - a.cantidad);
    },
  });
};