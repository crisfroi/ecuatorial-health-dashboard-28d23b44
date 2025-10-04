import { supabase } from "@/integrations/supabase/client";

export interface UpdateProfesionalParams {
  id: string;
  updates: Record<string, unknown>;
}

export const updateProfesionalSanitario = async ({ id, updates }: UpdateProfesionalParams) => {
  if (!id) throw new Error("ID requerido");
  if (!updates || typeof updates !== "object") throw new Error("Actualizaciones inválidas");

  const { data, error } = await supabase
    .from("profesionales_sanitarios")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
};
