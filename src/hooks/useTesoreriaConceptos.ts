import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TesoreriaConcepto {
  id: string;
  codigo: string;
  descripcion: string;
  tipo_solicitud: "profesional" | "establecimiento";
  clave_solicitud: string;
  monto: number;
  moneda: string;
  cuenta_tesoreria: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useTesoreriaConceptos = () => useQuery({
  queryKey: ["tesoreria-conceptos"],
  queryFn: async () => {
    const { data, error } = await supabase.from("tesoreria_conceptos").select("*").order("tipo_solicitud").order("clave_solicitud").order("codigo");
    if (error) throw error;
    return (data || []) as TesoreriaConcepto[];
  },
  staleTime: 5 * 60 * 1000,
});

export const useUpdateTesoreriaConcepto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, descripcion, monto, moneda, cuenta_tesoreria, activo }: Pick<TesoreriaConcepto, "id" | "descripcion" | "monto" | "moneda" | "cuenta_tesoreria" | "activo">) => {
      const { data: authData } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("tesoreria_conceptos").update({
        descripcion,
        monto,
        moneda,
        cuenta_tesoreria: cuenta_tesoreria || null,
        activo,
        updated_by: authData.user?.id ?? null,
        updated_at: new Date().toISOString(),
      }).eq("id", id).select("*").single();
      if (error) throw error;
      return data as TesoreriaConcepto;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tesoreria-conceptos"] }),
  });
};
