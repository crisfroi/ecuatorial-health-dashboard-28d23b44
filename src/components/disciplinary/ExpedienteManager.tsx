import { useState } from "react";
import { useAdjuntarDocumento, useActualizarEstado, useAgregarNota, useExpedientes, useGenerarResolucion, ExpedienteEstado } from "@/hooks/useExpedienteWorkflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

export function ExpedienteManager() {
  const [estado, setEstado] = useState<ExpedienteEstado | "todos">("todos");
  const [search, setSearch] = useState("");
  const { data: expedientes, refetch } = useExpedientes({ estado, search });
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = expedientes?.find(e => e.id === selectedId) || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Expedientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-center">
            <Input placeholder="Buscar por motivo o profesional" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={estado} onValueChange={(v) => setEstado(v as any)}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="borrador">Abierto/Borrador</SelectItem>
                <SelectItem value="en_investigacion">En Investigación</SelectItem>
                <SelectItem value="audiencia_programada">Audiencia Programada</SelectItem>
                <SelectItem value="pendiente_resolucion">Pendiente de Resolución</SelectItem>
                <SelectItem value="sancionado">Sancionado</SelectItem>
                <SelectItem value="archivado">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded border">
            <div className="grid grid-cols-12 text-sm font-medium bg-muted/50 px-3 py-2">
              <div className="col-span-3">Profesional</div>
              <div className="col-span-3">Motivo</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-2">Fecha</div>
              <div className="col-span-2 text-right">Acciones</div>
            </div>
            <div className="divide-y">
              {expedientes?.filter(e => !search || e.motivo.toLowerCase().includes(search.toLowerCase()) || (e.profesional?.nombre_completo || '').toLowerCase().includes(search.toLowerCase()))
                .map(e => (
                <div key={e.id} className="grid grid-cols-12 items-center px-3 py-2 hover:bg-accent/40">
                  <div className="col-span-3 truncate">{e.profesional?.nombre_completo}</div>
                  <div className="col-span-3 truncate" title={e.motivo}>{e.motivo}</div>
                  <div className="col-span-2">{e.estado}</div>
                  <div className="col-span-2">{new Date(e.fecha_apertura).toLocaleDateString('es-ES')}</div>
                  <div className="col-span-2 text-right">
                    <Button size="sm" variant={selectedId === e.id ? "default" : "outline"} onClick={() => setSelectedId(e.id)}>
                      Gestionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gestión del Flujo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selected && <p className="text-sm text-muted-foreground">Seleccione un expediente para gestionarlo.</p>}
          {selected && (
            <ExpedienteDetail expedienteId={selected.id} profesionalId={selected.profesional_id} estadoActual={selected.estado as ExpedienteEstado} onUpdated={() => { refetch(); }} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExpedienteDetail({ expedienteId, profesionalId, estadoActual, onUpdated }:{ expedienteId: string; profesionalId: string; estadoActual: ExpedienteEstado; onUpdated: () => void }) {
  const { mutateAsync: actualizar } = useActualizarEstado();
  const { mutateAsync: agregarNota } = useAgregarNota();
  const { mutateAsync: adjuntar } = useAdjuntarDocumento();
  const { mutateAsync: generar } = useGenerarResolucion();
  const { toast } = useToast();

  const [nota, setNota] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const nextTransitions: { label: string; value: ExpedienteEstado }[] = [];
  if (estadoActual === "borrador") nextTransitions.push({ label: "Mover a Investigación", value: "en_investigacion" });
  if (estadoActual === "en_investigacion") nextTransitions.push({ label: "Programar Audiencia", value: "audiencia_programada" });
  if (estadoActual === "audiencia_programada") nextTransitions.push({ label: "Marcar Pendiente de Resolución", value: "pendiente_resolucion" });
  if (estadoActual === "pendiente_resolucion") nextTransitions.push({ label: "Finalizar como Sancionado", value: "sancionado" }, { label: "Archivar (sin falta)", value: "archivado" });

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-medium mb-2">Acciones de Flujo</div>
        <div className="flex flex-wrap gap-2">
          {nextTransitions.map(t => (
            <Button key={t.value} size="sm" onClick={async () => {
              await actualizar({ expedienteId, nuevoEstado: t.value });
              toast({ title: "Estado actualizado" });
              onUpdated();
            }}>{t.label}</Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Agregar Nota/Auditoría</div>
        <div className="flex gap-2">
          <Input placeholder="Comentario" value={nota} onChange={(e) => setNota(e.target.value)} />
          <Button variant="outline" onClick={async () => {
            if (!nota.trim()) { toast({ title: "Ingrese un comentario", variant: "destructive" }); return; }
            await agregarNota({ expedienteId, comentario: nota.trim() });
            setNota("");
            toast({ title: "Nota registrada" });
            onUpdated();
          }}>Guardar</Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Documentación Adicional</div>
        <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <Button variant="outline" disabled={!file} onClick={async () => {
          if (!file) return;
          await adjuntar({ expedienteId, file, comentario: "Documento adicional" });
          setFile(null);
          toast({ title: "Documento adjuntado" });
          onUpdated();
        }}>Subir Documento</Button>
      </div>

      <ResolutionSection expedienteId={expedienteId} profesionalId={profesionalId} onDone={() => { toast({ title: "Resolución generada" }); onUpdated(); }} />
    </div>
  );
}

function ResolutionSection({ expedienteId, profesionalId, onDone }:{ expedienteId: string; profesionalId: string; onDone: () => void }) {
  const { mutateAsync: generar } = useGenerarResolucion();
  const [resolucionFinal, setResolucionFinal] = useState("");
  const [sancionTipo, setSancionTipo] = useState<"amonestacion" | "suspension" | "multa" | "inhabilitacion" | "archivado" | "">("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [multa, setMulta] = useState<string>("");

  const requiresPeriodo = sancionTipo === "suspension";
  const requiresMonto = sancionTipo === "multa";

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Resolución y Conclusión</div>
      <Select value={sancionTipo} onValueChange={(v) => setSancionTipo(v as any)}>
        <SelectTrigger><SelectValue placeholder="Tipo de sanción" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="amonestacion">Amonestación Escrita</SelectItem>
          <SelectItem value="suspension">Suspensión Temporal</SelectItem>
          <SelectItem value="multa">Multa Económica</SelectItem>
          <SelectItem value="inhabilitacion">Inhabilitación Permanente</SelectItem>
          <SelectItem value="archivado">Archivado (sin falta)</SelectItem>
        </SelectContent>
      </Select>
      {requiresPeriodo && (
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} placeholder="Inicio" />
          <Input type="date" value={fin} onChange={(e) => setFin(e.target.value)} placeholder="Fin" />
        </div>
      )}
      {requiresMonto && (
        <Input type="number" value={multa} onChange={(e) => setMulta(e.target.value)} placeholder="Monto XAF" />
      )}
      <Textarea value={resolucionFinal} onChange={(e) => setResolucionFinal(e.target.value)} rows={6} placeholder="Redacte la resolución final, citando normativa aplicable" />
      <Button disabled={!resolucionFinal || !sancionTipo} onClick={async () => {
        await generar({
          expedienteId,
          profesionalId,
          resolucionFinal,
          sancionTipo: sancionTipo as any,
          sancionFechaInicio: inicio || undefined,
          sancionFechaFin: fin || undefined,
          multaMonto: multa ? Number(multa) : undefined,
        });
        onDone();
      }}>Generar PDF de Resolución</Button>
    </div>
  );
}
