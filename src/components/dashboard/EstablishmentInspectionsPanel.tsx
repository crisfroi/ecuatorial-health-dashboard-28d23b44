import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, Plus, RefreshCw, Save, Search, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TYPES = ["INICIAL", "SEGUIMIENTO", "EXTRAORDINARIA", "RENOVACION"] as const;
const STATES = ["PROGRAMADA", "EN_CURSO", "APROBADA", "CONDICIONADA", "RECHAZADA", "CANCELADA"] as const;

interface Inspection {
  id: string;
  establecimiento_id: string;
  numero_inspeccion: string;
  tipo_inspeccion: string;
  estado: string;
  inspector_id: string | null;
  fecha_programada: string | null;
  puntuacion: number | null;
  resultado: string | null;
  observaciones: string | null;
  medidas_correctivas: string | null;
  plazo_correccion: string | null;
  created_at: string;
  solicitudes_establecimientos?: { nombre_establecimiento: string; numero_solicitud: string | null; provincia: string } | null;
}

export default function EstablishmentInspectionsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>("");
  const [filter, setFilter] = useState("TODOS");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ establecimiento_id: "", tipo_inspeccion: "INICIAL", fecha_programada: "", observaciones: "" });

  const { data: establishments = [] } = useQuery({
    queryKey: ["establecimientos-para-inspeccion"],
    queryFn: async () => {
      const { data, error } = await supabase.from("solicitudes_establecimientos").select("id,nombre_establecimiento,numero_solicitud,provincia,estado").in("estado", ["Autorizado", "Pendiente de Firma", "Revisando", "Pendiente"]).order("nombre_establecimiento");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: inspections = [], isLoading, refetch } = useQuery({
    queryKey: ["inspecciones-establecimientos", filter],
    queryFn: async () => {
      let query = supabase.from("inspecciones_establecimientos").select("*, solicitudes_establecimientos(nombre_establecimiento,numero_solicitud,provincia)").order("created_at", { ascending: false });
      if (filter !== "TODOS") query = query.eq("estado", filter);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Inspection[];
    },
    refetchInterval: 15000,
  });

  const createInspection = useMutation({
    mutationFn: async () => {
      if (!form.establecimiento_id) throw new Error("Seleccione un establecimiento.");
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("inspecciones_establecimientos").insert({
        establecimiento_id: form.establecimiento_id,
        tipo_inspeccion: form.tipo_inspeccion,
        fecha_programada: form.fecha_programada ? new Date(form.fecha_programada).toISOString() : null,
        observaciones: form.observaciones || null,
        created_by: user?.id || null,
        inspector_id: user?.id || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Inspección programada", description: "La inspección ha quedado registrada." });
      setForm({ establecimiento_id: "", tipo_inspeccion: "INICIAL", fecha_programada: "", observaciones: "" });
      setShowNew(false);
      queryClient.invalidateQueries({ queryKey: ["inspecciones-establecimientos"] });
    },
    onError: (error: any) => toast({ title: "No se pudo programar", description: error?.message || "Error de inspección", variant: "destructive" }),
  });

  const updateInspection = useMutation({
    mutationFn: async (patch: Partial<Inspection> & { id: string }) => {
      const { id, ...updates } = patch;
      const { error } = await supabase.from("inspecciones_establecimientos").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Inspección actualizada" });
      queryClient.invalidateQueries({ queryKey: ["inspecciones-establecimientos"] });
    },
    onError: (error: any) => toast({ title: "No se pudo actualizar", description: error?.message || "Error", variant: "destructive" }),
  });

  const selected = useMemo(() => inspections.find((item) => item.id === selectedId) || null, [inspections, selectedId]);

  const statusClass = (status: string) => ({
    PROGRAMADA: "bg-slate-100 text-slate-800",
    EN_CURSO: "bg-blue-100 text-blue-800",
    APROBADA: "bg-green-100 text-green-800",
    CONDICIONADA: "bg-amber-100 text-amber-800",
    RECHAZADA: "bg-red-100 text-red-800",
    CANCELADA: "bg-gray-100 text-gray-600",
  } as Record<string, string>)[status] || "bg-gray-100 text-gray-800";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Inspecciones de Establecimientos Sanitarios</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos</SelectItem>{STATES.map((state) => <SelectItem key={state} value={state}>{state.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
              <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Actualizar</Button>
              <Button size="sm" onClick={() => setShowNew((value) => !value)}><Plus className="h-4 w-4 mr-2" />Programar inspección</Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Planificación, ejecución, resultado, hallazgos y seguimiento de las inspecciones sanitarias.</p>
        </CardHeader>
        {showNew && <CardContent className="border-t bg-muted/20">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2"><Label>Establecimiento</Label><Select value={form.establecimiento_id} onValueChange={(value) => setForm((v) => ({ ...v, establecimiento_id: value }))}><SelectTrigger><SelectValue placeholder="Seleccione un establecimiento" /></SelectTrigger><SelectContent>{establishments.map((item: any) => <SelectItem key={item.id} value={item.id}>{item.nombre_establecimiento} · {item.provincia}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Tipo</Label><Select value={form.tipo_inspeccion} onValueChange={(value) => setForm((v) => ({ ...v, tipo_inspeccion: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Fecha programada</Label><Input type="datetime-local" value={form.fecha_programada} onChange={(e) => setForm((v) => ({ ...v, fecha_programada: e.target.value }))} /></div>
          </div>
          <div className="mt-4"><Label>Observaciones iniciales</Label><Textarea value={form.observaciones} onChange={(e) => setForm((v) => ({ ...v, observaciones: e.target.value }))} placeholder="Motivo, alcance o instrucciones de la inspección" /></div>
          <div className="mt-4 flex justify-end"><Button onClick={() => createInspection.mutate()} disabled={createInspection.isPending}><Plus className="h-4 w-4 mr-2" />{createInspection.isPending ? "Guardando..." : "Crear inspección"}</Button></div>
        </CardContent>}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">Agenda y expediente de inspecciones <Badge variant="outline" className="ml-2">{inspections.length}</Badge></CardTitle></CardHeader>
          <CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/50"><tr><th className="p-3 text-left">Nº</th><th className="p-3 text-left">Establecimiento</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">Estado</th></tr></thead><tbody>{isLoading ? <tr><td colSpan={5} className="p-8 text-center">Cargando...</td></tr> : inspections.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hay inspecciones registradas.</td></tr> : inspections.map((item) => <tr key={item.id} className={`border-t cursor-pointer ${selectedId === item.id ? "bg-muted/50" : ""}`} onClick={() => setSelectedId(item.id)}><td className="p-3 font-mono">{item.numero_inspeccion}</td><td className="p-3 font-medium">{item.solicitudes_establecimientos?.nombre_establecimiento || "—"}<div className="text-xs text-muted-foreground">{item.solicitudes_establecimientos?.provincia || ""}</div></td><td className="p-3">{item.tipo_inspeccion}</td><td className="p-3">{item.fecha_programada ? new Date(item.fecha_programada).toLocaleString("es-ES") : "—"}</td><td className="p-3"><Badge className={statusClass(item.estado)}>{item.estado.replace("_", " ")}</Badge></td></tr>)}</tbody></table></div></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Expediente de inspección</CardTitle></CardHeader>
          <CardContent>{!selected ? <div className="py-10 text-center text-muted-foreground"><Search className="mx-auto h-8 w-8 mb-2" />Seleccione una inspección.</div> : <div className="space-y-4">
            <div className="rounded-lg border p-3"><div className="font-semibold">{selected.solicitudes_establecimientos?.nombre_establecimiento}</div><div className="text-xs text-muted-foreground">{selected.numero_inspeccion} · {selected.tipo_inspeccion}</div></div>
            <div><Label>Estado</Label><Select value={selected.estado} onValueChange={(estado) => updateInspection.mutate({ id: selected.id, estado })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATES.map((state) => <SelectItem key={state} value={state}>{state.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Puntuación</Label><Input type="number" min="0" max="100" step="0.01" value={selected.puntuacion ?? ""} onChange={(e) => updateInspection.mutate({ id: selected.id, puntuacion: e.target.value === "" ? null : Number(e.target.value) })} /></div>
            <div><Label>Resultado</Label><Input value={selected.resultado || ""} onChange={(e) => updateInspection.mutate({ id: selected.id, resultado: e.target.value })} placeholder="Conforme, condicionado, no conforme..." /></div>
            <div><Label>Observaciones</Label><Textarea value={selected.observaciones || ""} onChange={(e) => updateInspection.mutate({ id: selected.id, observaciones: e.target.value })} /></div>
            <div><Label>Medidas correctivas</Label><Textarea value={selected.medidas_correctivas || ""} onChange={(e) => updateInspection.mutate({ id: selected.id, medidas_correctivas: e.target.value })} /></div>
            <div><Label>Plazo de corrección</Label><Input type="date" value={selected.plazo_correccion || ""} onChange={(e) => updateInspection.mutate({ id: selected.id, plazo_correccion: e.target.value || null })} /></div>
            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground"><ShieldCheck className="inline h-4 w-4 mr-1" /> El acta, hallazgos y sello de inspección quedarán vinculados al expediente.</div>
            <Button variant="outline" className="w-full" onClick={() => refetch()}><Save className="h-4 w-4 mr-2" />Actualizar expediente</Button>
          </div>}</CardContent>
        </Card>
      </div>
    </div>
  );
}
