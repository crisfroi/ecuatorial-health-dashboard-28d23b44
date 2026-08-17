import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileText, RefreshCw, Save, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSolicitudesEstablecimientosQuery, useSolicitudesEstablecimientos } from "@/hooks/useSolicitudesEstablecimientos";

const STATUS_ORDER = ["Recibido", "Revisando", "Pendiente de Firma", "Autorizado", "Rechazado"];
const getStatusClass = (status?: string | null) => ({
  Recibido: "bg-gray-100 text-gray-800 border-gray-300",
  Revisando: "bg-blue-100 text-blue-800 border-blue-300",
  "Pendiente de Firma": "bg-orange-100 text-orange-800 border-orange-300",
  Autorizado: "bg-green-100 text-green-800 border-green-300",
  Rechazado: "bg-red-100 text-red-800 border-red-300",
}[status || ""] || "bg-gray-100 text-gray-800 border-gray-300");

export default function EstablishmentRequestsPanel() {
  const { toast } = useToast();
  const [estado, setEstado] = useState("todos");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [rejections, setRejections] = useState<Record<string, string>>({});
  const { data: solicitudes = [], isLoading, refetch } = useSolicitudesEstablecimientosQuery({ estado, fecha_desde: start || undefined, fecha_hasta: end || undefined });
  const { actualizarEstadoMutation } = useSolicitudesEstablecimientos();

  const save = async (id: string, current?: string | null) => {
    const next = editing[id];
    if (!next || next === current) return;
    const currentIndex = Math.max(0, STATUS_ORDER.indexOf(current || "Recibido"));
    const nextIndex = STATUS_ORDER.indexOf(next);
    if (next !== "Rechazado" && nextIndex < currentIndex) {
      toast({ title: "Flujo no válido", description: "No se puede retroceder a un estado anterior.", variant: "destructive" });
      return;
    }
    if (next === "Rechazado" && !rejections[id]?.trim()) {
      toast({ title: "Motivo requerido", description: "Debe indicar el motivo del rechazo.", variant: "destructive" });
      return;
    }
    try {
      await actualizarEstadoMutation.mutateAsync({ id, estado: next, motivo_rechazo: next === "Rechazado" ? rejections[id] : undefined });
      setEditing((v) => { const n = { ...v }; delete n[id]; return n; });
      setRejections((v) => { const n = { ...v }; delete n[id]; return n; });
    } catch { /* mutation displays the error */ }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Solicitudes de Establecimientos Sanitarios <Badge variant="outline">{solicitudes.length}</Badge></CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-auto" />
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-auto" />
            <Select value={estado} onValueChange={setEstado}><SelectTrigger className="w-48"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}><RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="py-8 text-center text-muted-foreground">Cargando solicitudes...</div> : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm"><thead className="bg-muted/50"><tr><th className="p-3 text-left">Establecimiento</th><th className="p-3 text-left">Categoría</th><th className="p-3 text-left">Provincia</th><th className="p-3 text-left">Solicitud</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Acciones</th></tr></thead>
              <tbody>{solicitudes.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground"><FileText className="mx-auto mb-2 h-8 w-8" />No hay solicitudes.</td></tr> : solicitudes.map((s) => {
                const current = s.estado || "Recibido"; const selected = editing[s.id] ?? current;
                return <tr key={s.id} className="border-t align-top"><td className="p-3 font-medium">{s.nombre_establecimiento}<div className="text-xs text-muted-foreground">{s.numero_solicitud || s.id}</div></td><td className="p-3">{s.categoria}</td><td className="p-3">{s.provincia}<div className="text-xs text-muted-foreground">{s.distrito_sanitario || ""}</div></td><td className="p-3">{s.fecha_solicitud ? new Date(s.fecha_solicitud).toLocaleDateString("es-ES") : "—"}</td><td className="p-3"><Badge className={getStatusClass(current)} variant="outline">{current}</Badge></td><td className="min-w-[260px] p-3"><div className="flex gap-2"><Select value={selected} onValueChange={(v) => setEditing((x) => ({ ...x, [s.id]: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_ORDER.filter((option) => option === "Rechazado" || STATUS_ORDER.indexOf(option) >= STATUS_ORDER.indexOf(current)).map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select><Button size="icon" onClick={() => save(s.id, current)} disabled={actualizarEstadoMutation.isPending}><Save className="h-4 w-4" /></Button></div>{selected === "Rechazado" && <Textarea className="mt-2" placeholder="Motivo del rechazo" value={rejections[s.id] || ""} onChange={(e) => setRejections((x) => ({ ...x, [s.id]: e.target.value }))} />}</td></tr>;
              })}</tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
