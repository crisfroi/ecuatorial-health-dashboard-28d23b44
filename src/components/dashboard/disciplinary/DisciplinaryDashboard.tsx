// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DisciplinaryDashboard() {
  const { data: kpis } = useQuery({
    queryKey: ["disciplinary_kpis"],
    queryFn: async () => {
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
      const { data: abiertos } = await supabase
        .from("expedientes_disciplinarios")
        .select("id, estado, fecha_apertura, falta_codigo, centro_salud_id");
      const abiertosPorMes: Record<string, number> = {};
      const porCategoria: Record<string, number> = {};
      const centros: Record<string, number> = {};
      let total = 0, resueltos = 0;
      for (const e of abiertos || []) {
        total++;
        const d = new Date(e.fecha_apertura);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        abiertosPorMes[key] = (abiertosPorMes[key] || 0) + 1;
        porCategoria[e.falta_codigo || 'sin_categoria'] = (porCategoria[e.falta_codigo || 'sin_categoria'] || 0) + 1;
        if (e.centro_salud_id) centros[e.centro_salud_id] = (centros[e.centro_salud_id] || 0) + 1;
        if (e.estado === 'sancionado' || e.estado === 'archivado') resueltos++;
      }
      return { abiertosPorMes, porCategoria, centros, total, resueltos };
    }
  });

  const meses = Object.entries(kpis?.abiertosPorMes || {}).sort(([a],[b]) => a.localeCompare(b));
  const categorias = Object.entries(kpis?.porCategoria || {}).sort((a,b) => b[1]-a[1]).slice(0,5);
  const centros = Object.entries(kpis?.centros || {}).sort((a,b) => b[1]-a[1]).slice(0,5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader><CardTitle>Expedientes abiertos por mes</CardTitle></CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1">
            {meses.map(([m, n]) => (<li key={m} className="flex justify-between"><span>{m}</span><span>{n}</span></li>))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>% resolución por categoría</CardTitle></CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1">
            {categorias.map(([cat, n]) => {
              const pct = kpis && kpis.total ? Math.round((n / kpis.total) * 100) : 0;
              return <li key={cat} className="flex justify-between"><span>{cat}</span><span>{pct}%</span></li>
            })}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Centros con más incidencias</CardTitle></CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1">
            {centros.map(([c, n]) => (<li key={c} className="flex justify-between"><span>{c}</span><span>{n}</span></li>))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
