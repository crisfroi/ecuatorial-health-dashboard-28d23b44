import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DisciplinaryHistoryCard({ profesionalId }:{ profesionalId: string }) {
  const { data } = useQuery({
    queryKey: ["expedientes_profesional", profesionalId],
    enabled: Boolean(profesionalId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expedientes_disciplinarios")
        .select("id, estado, motivo, fecha_apertura, sancion_tipo, sancion_fecha_inicio, sancion_fecha_fin, inhabilitacion_permanente")
        .eq("profesional_id", profesionalId)
        .order("fecha_apertura", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial Disciplinario</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(!data || data.length === 0) && <p className="text-sm text-muted-foreground">Sin expedientes.</p>}
        {data?.map(e => (
          <div key={e.id} className="p-3 rounded border">
            <div className="text-sm font-medium">{e.motivo}</div>
            <div className="text-xs text-muted-foreground">{new Date(e.fecha_apertura).toLocaleDateString('es-ES')} • {e.estado}</div>
            {e.sancion_tipo && (
              <div className="text-xs mt-1">Sanción: {e.sancion_tipo} {e.inhabilitacion_permanente ? "(INHABILITADO)" : ""}</div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
