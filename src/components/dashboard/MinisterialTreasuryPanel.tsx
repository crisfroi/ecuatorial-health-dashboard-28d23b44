import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Save, ShieldCheck, RefreshCw, Landmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTesoreriaConceptos, useUpdateTesoreriaConcepto, type TesoreriaConcepto } from "@/hooks/useTesoreriaConceptos";

interface MinisterialTreasuryPanelProps {
  userRole: string;
}

const MINISTERIAL_ROLES = ["ministerial", "ministerio", "admin_ministerial", "superadmin"];

export default function MinisterialTreasuryPanel({ userRole }: MinisterialTreasuryPanelProps) {
  const { toast } = useToast();
  const { data: conceptos = [], isLoading, refetch } = useTesoreriaConceptos();
  const updateConcepto = useUpdateTesoreriaConcepto();
  const [drafts, setDrafts] = useState<Record<string, Partial<TesoreriaConcepto>>>({});

  const normalizedRole = String(userRole || "").toLowerCase();
  const canEdit = MINISTERIAL_ROLES.includes(normalizedRole);

  const draft = (concepto: TesoreriaConcepto) => ({ ...concepto, ...(drafts[concepto.id] || {}) });

  const setDraft = (concepto: TesoreriaConcepto, patch: Partial<TesoreriaConcepto>) => {
    setDrafts((current) => ({ ...current, [concepto.id]: { ...current[concepto.id], ...patch } }));
  };

  const save = async (concepto: TesoreriaConcepto) => {
    if (!canEdit) return;
    const value = draft(concepto);
    try {
      await updateConcepto.mutateAsync({
        id: concepto.id,
        monto: Number(value.monto || 0),
        moneda: String(value.moneda || "XAF"),
        cuenta_tesoreria: value.cuenta_tesoreria || null,
        activo: Boolean(value.activo),
      });
      setDrafts((current) => { const next = { ...current }; delete next[concepto.id]; return next; });
      toast({ title: "Configuración guardada", description: `${concepto.descripcion} ha sido actualizado.` });
    } catch (error: any) {
      toast({ title: "No se pudo guardar", description: error?.message || "Error de Tesorería", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5" /> Configuración Ministerial de Tesorería</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline"><ShieldCheck className="mr-1 h-3 w-3" /> Solo Ministerio</Badge>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}><RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /></Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Estos parámetros determinan el importe y la cuenta de Tesorería usados por las nuevas Notas de Ingreso.</p>
      </CardHeader>
      <CardContent>
        {!canEdit && <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Vista de solo lectura. Los importes y cuentas solo pueden modificarse desde el Panel Ministerial.</div>}
        {isLoading ? <div className="py-8 text-center text-muted-foreground">Cargando conceptos...</div> : (
          <div className="space-y-4">
            {conceptos.map((concepto) => {
              const value = draft(concepto);
              return (
                <div key={concepto.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div><div className="font-medium">{concepto.descripcion}</div><div className="text-xs text-muted-foreground">{concepto.codigo} · {concepto.tipo_solicitud}</div></div>
                    <div className="flex items-center gap-2 text-sm"><Switch checked={Boolean(value.activo)} disabled={!canEdit} onCheckedChange={(activo) => setDraft(concepto, { activo })} /> {value.activo ? "Activo" : "Inactivo"}</div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div><label className="mb-1 block text-xs font-medium">Importe</label><Input type="number" min="0" step="0.01" value={value.monto ?? 0} disabled={!canEdit} onChange={(e) => setDraft(concepto, { monto: Number(e.target.value) })} /></div>
                    <div><label className="mb-1 block text-xs font-medium">Moneda</label><Input value={value.moneda ?? "XAF"} disabled={!canEdit} onChange={(e) => setDraft(concepto, { moneda: e.target.value.toUpperCase() })} /></div>
                    <div><label className="mb-1 block text-xs font-medium">Cuenta de Tesorería</label><Input value={value.cuenta_tesoreria ?? ""} disabled={!canEdit} placeholder="Cuenta / código presupuestario" onChange={(e) => setDraft(concepto, { cuenta_tesoreria: e.target.value })} /></div>
                  </div>
                  {canEdit && <div className="mt-3 flex justify-end"><Button size="sm" onClick={() => save(concepto)} disabled={updateConcepto.isPending}><Save className="mr-2 h-4 w-4" />Guardar parámetros</Button></div>}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
