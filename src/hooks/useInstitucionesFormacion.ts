import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InstitucionFormacion {
  id: string;
  nombre: string;
  pais: string;
  categoria: string;
}

export const useInstitucionesFormacion = (pais?: string, search?: string) => {
  return useQuery({
    queryKey: ["instituciones_formacion", pais || null, search || ""],
    queryFn: async (): Promise<InstitucionFormacion[]> => {
      let q = supabase.from("instituciones_formacion").select("id, nombre, pais, categoria").order("nombre");
      if (pais && pais !== "") q = q.eq("pais", pais);
      if (search && search.trim()) q = q.ilike("nombre", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const addInstitucionFormacion = async (nombre: string, pais: string, categoria: string) => {
  const { data, error } = await supabase
    .from("instituciones_formacion")
    .insert([{ nombre: nombre.trim(), pais: pais.trim(), categoria: categoria.trim() || "OTRA" }])
    .select("id, nombre, pais, categoria")
    .single();
  if (error) throw error;
  return data as InstitucionFormacion;
};
