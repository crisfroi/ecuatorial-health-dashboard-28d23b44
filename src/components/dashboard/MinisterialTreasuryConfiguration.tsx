import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Save, ShieldCheck, RefreshCw, Landmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTesoreriaConceptos, useUpdateTesoreriaConcepto, type TesoreriaConcepto } from "@/hooks/useTesoreriaConceptos";

interface Props { userRole?: string | null }

const MINISTERIAL_ROLES = ["RRHH_MINISTERIO", "PERSONALIDAD_MINISTERIAL", "MINISTERIAL", "MINISTERIO", "ADMIN_MINISTERIAL", "SUPER_ADMINISTRADOR"];

export default function MinisterialTreasuryConfiguration({ userRole }: Props) {
  const { toast } = useToast();
  const { data: conceptos = [], isLoading, refetch } = useTesoreriaConceptos();
  const updateConcepto = useUpdateTesoreriaConcepto();
  const [drafts, setDrafts] = useState<Record<string, Partial<TesoreriaConcepto>>>({});
  const canEdit = MINISTERIAL_ROLES.includes(String(userRole || "").toUpperCase());
  const getValue = (item: TesoreriaConcepto) => ({ ...item, ...(drafts[item.id] || {}) });
  const setValue = (item: TesoreriaConcepto, patch: Partial<TesoreriaConcepto>) => setDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], ...patch } }));

  const save = async (item: TesoreriaConcepto) => {
    if (!canEdit) return;
    const value = getValue(item);
    try {
      await updateConcepto.mutateAsync({ id: item.id, monto: Number(value.monto || 0), moneda: String(value.moneda || "XAF").toUpperCase(), cuenta_tesoreria: value.cuenta_tesoreria || null, activo: Boolean(value.activo) });
      setDrafts((current) => { const next = { ...current }; delete next[item.id]; return next; });
      toast({ title: "Parámetros de Tesorería guardados", description: "Las nuevas Notas de Ingreso usarán esta configuración." });
    } catch (error: any) {
      toast({ title: "No se pudo guardar", description: error?.message || "Error de Tesorería", variant: "destructive" });
    }
  };

  return <Card>
    <CardHeader>
      <div className="flex items-center justify-between gap-4">
        <div><CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5" /> Parámetros de Notas de Ingreso</CardTitle><p className="mt-1 text-sm text-muted-foreground">Configuración ministerial aplicada automáticamente a las nuevas solicitudes de registro.</p></div>
        <div className="flex items-center gap-2"><Badge variant="outline"><ShieldCheck className="mr-1 h-3 w-3" /> Ministerio</Badge><Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button></div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {!canEdit && <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Vista de solo lectura. Los importes y cuentas de Tesorería solo pueden modificarse desde el Panel Ministerial.</div>}
      {isLoading ? <div className="py-8 text-center text-muted-foreground">Cargando conceptos...</div> : conceptos.map((item) => { const value = getValue(item); return <div key={item.id} className="rounded-lg border p-4">
        <div className="mb-3 flex items-start justify-between gap-4"><div><div className="font-medium">{item.descripcion}</div><div className="text-xs text-muted-foreground">{item.codigo} · {item.tipo_solicitud}</div></div><div className="flex items-center gap-2 text-sm"><Switch checked={Boolean(value.activo)} disabled={!canEdit} onCheckedChange={(activo) => setValue(item, { activo })} />{value.activo ? "Activo" : "Inactivo"}</div></div>
        <div className="grid gap-3 md:grid-cols-3"><div><label className="mb-1 block text-xs font-medium">Importe</label><Input type="number" min="0" step="0.01" value={value.monto ?? 0} disabled={!canEdit} onChange={(e) => setValue(item, { monto: Number(e.target.value) })} /></div><div><label className="mb-1 block text-xs font-medium">Moneda</label><Input value={value.moneda || "XAF"} disabled={!canEdit} onChange={(e) => setValue(item, { moneda: e.target.value.toUpperCase() })} /></div><div><label className="mb-1 block text-xs font-medium">Cuenta de Tesorería</label><Input value={value.cuenta_tesoreria || ""} disabled={!canEdit} placeholder="Código/cuenta" onChange={(e) => setValue(item, { cuenta_tesoreria: e.target.value })} /></div></div>
        {canEdit && <div className="mt-3 flex justify-end"><Button size="sm" onClick={() => save(item)} disabled={updateConcepto.isPending}><Save className="mr-2 h-4 w-4" />Guardar parámetros</Button></div>}
      </div>; })}
    </CardContent>
  </Card>;
}
