import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InstitucionFormacion {
  id: string;
  nombre: string;
  pais: string; // Nombre del país (texto, por compatibilidad)
  pais_id?: number; // Nuevo ID del país (clave foránea)
  categoria: string;
}

export const useInstitucionesFormacion = (pais?: string, search?: string) => {
  return useQuery({
    queryKey: ["instituciones_formacion", pais || null, search || ""],
    queryFn: async (): Promise<InstitucionFormacion[]> => {
      // CAMBIO: Seleccionamos pais_id y ajustamos la proyección para el futuro si es necesario
      let q = supabase.from("instituciones_formacion").select("id, nombre, pais, pais_id, categoria").order("nombre"); 
      if (pais && pais !== "") q = q.eq("pais", pais);
      if (search && search.trim()) q = q.ilike("nombre", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// CAMBIO CLAVE: Agregamos el parámetro paisId (number)
export const addInstitucionFormacion = async (nombre: string, pais: string, categoria: string, paisId: number) => {
  const { data, error } = await supabase
    .from("instituciones_formacion")
    .insert([
        { 
            nombre: nombre.trim(), 
            pais: pais.trim(), 
            categoria: categoria.trim() || "OTRA",
            pais_id: paisId // <--- GUARDAMOS LA CLAVE FORÁNEA DEL PAÍS
        }
    ])
    .select("id, nombre, pais, categoria, pais_id") // Seleccionamos el nuevo campo
    .single();
  if (error) throw error;
  return data as InstitucionFormacion;
};
