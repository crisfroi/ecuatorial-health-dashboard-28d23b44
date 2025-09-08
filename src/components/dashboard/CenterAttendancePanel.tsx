import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ProfessionalLite { id: string; nombre_completo?: string | null; area_profesional?: string | null }

interface Props { centerId: string; professionals: ProfessionalLite[] }

const CenterAttendancePanel: React.FC<Props> = ({ centerId, professionals }) => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: devices = [] } = useQuery({
    queryKey: ["asistencia-dispositivos", centerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asistencia_dispositivos")
        .select("id, sn, modelo, firmware, ws_url, estado, created_at")
        .eq("centro_salud_id", centerId)
        .order("created_at", { ascending: false });
      if (error) throw error; return data || [];
    }
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["turnos-plantillas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turnos_plantillas")
        .select("id, nombre, hora_inicio, hora_fin, tolerancia_minutos, nocturno")
        .order("nombre");
      if (error) throw error; return data || [];
    }
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["horarios-profesionales", centerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("horarios_profesionales")
        .select("id, profesional_id, turno_id, dia_semana, vigente_desde, vigente_hasta, activo, turnos_plantillas(nombre, hora_inicio, hora_fin)")
        .eq("centro_salud_id", centerId)
        .order("profesional_id");
      if (error) throw error; return data || [];
    }
  });

  const { data: recentPunches = [] } = useQuery({
    queryKey: ["asistencia-fichajes-center", centerId],
    queryFn: async () => {
      // Prefer device filter if exists; else fallback to profesional by center
      const { data: devs } = await supabase
        .from("asistencia_dispositivos")
        .select("sn")
        .eq("centro_salud_id", centerId);
      let punches: any[] = [];
      if (devs && devs.length) {
        const sns = devs.map(d => d.sn);
        const { data, error } = await supabase
          .from("asistencia_fichajes")
          .select("device_sn, enroll_id, profesional_id, time_local, inout, mode, event, temperature, image_url")
          .in("device_sn", sns as string[])
          .order("time_local", { ascending: false })
          .limit(50);
        if (error) throw error; punches = data || [];
      } else {
        const profIds = professionals.map(p => p.id);
        if (profIds.length) {
          const { data, error } = await supabase
            .from("asistencia_fichajes")
            .select("device_sn, enroll_id, profesional_id, time_local, inout, mode, event, temperature, image_url")
            .in("profesional_id", profIds as string[])
            .order("time_local", { ascending: false })
            .limit(50);
          if (error) throw error; punches = data || [];
        }
      }
      return punches;
    }
  });

  const registerDevice = useMutation({
    mutationFn: async (payload: { sn: string; ws_url?: string }) => {
      const { data, error } = await supabase
        .from("asistencia_dispositivos")
        .insert([{ sn: payload.sn.trim(), ws_url: payload.ws_url || null, centro_salud_id: centerId }])
        .select()
        .single();
      if (error) throw error; return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["asistencia-dispositivos", centerId] }); toast({ title: "Dispositivo registrado" }); }
  });

  const createTemplate = useMutation({
    mutationFn: async (payload: { nombre: string; inicio: string; fin: string; tolerancia: number; nocturno: boolean }) => {
      const { data, error } = await supabase
        .from("turnos_plantillas")
        .insert([{ nombre: payload.nombre.trim(), hora_inicio: payload.inicio, hora_fin: payload.fin, tolerancia_minutos: payload.tolerancia, nocturno: payload.nocturno }])
        .select()
        .single();
      if (error) throw error; return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["turnos-plantillas"] }); toast({ title: "Plantilla creada" }); }
  });

  const assignSchedule = useMutation({
    mutationFn: async (payload: { profesional_id: string; turno_id: string; dia_semana: number }) => {
      const { data, error } = await supabase
        .from("horarios_profesionales")
        .insert([{ profesional_id: payload.profesional_id, turno_id: payload.turno_id, dia_semana: payload.dia_semana, centro_salud_id: centerId }])
        .select()
        .single();
      if (error) throw error; return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["horarios-profesionales", centerId] }); toast({ title: "Horario asignado" }); }
  });

  const [sn, setSn] = useState("");
  const [ws, setWs] = useState("");
  const [tplName, setTplName] = useState("");
  const [tplStart, setTplStart] = useState("08:00");
  const [tplEnd, setTplEnd] = useState("16:00");
  const [tplTol, setTplTol] = useState(5);
  const [tplNight, setTplNight] = useState(false);
  const [selProf, setSelProf] = useState<string | undefined>(undefined);
  const [selTpl, setSelTpl] = useState<string | undefined>(undefined);
  const [selDay, setSelDay] = useState<number>(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asistencia y Turnos del Centro</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="devices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="devices">Dispositivos</TabsTrigger>
            <TabsTrigger value="shifts">Turnos</TabsTrigger>
            <TabsTrigger value="schedules">Horarios</TabsTrigger>
            <TabsTrigger value="attendance">Asistencia</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Serial (SN)" value={sn} onChange={e => setSn(e.target.value)} />
              <Input placeholder="WS URL (opcional)" value={ws} onChange={e => setWs(e.target.value)} />
              <Button disabled={!sn || registerDevice.isPending} onClick={() => registerDevice.mutate({ sn, ws_url: ws })}>Registrar</Button>
            </div>
            <ScrollArea className="h-64 border rounded p-2">
              {devices.length === 0 ? <div className="text-sm text-gray-500">Sin dispositivos</div> : (
                <div className="space-y-2">
                  {devices.map((d: any) => (
                    <div key={d.id} className="flex justify-between items-center border rounded p-2">
                      <div>
                        <div className="font-medium">{d.sn}</div>
                        <div className="text-xs text-gray-500">{d.modelo || "Modelo?"} • {d.firmware || "fw?"}</div>
                        {d.ws_url && <div className="text-xs text-gray-500">{d.ws_url}</div>}
                      </div>
                      <div className="text-xs font-medium">{d.estado}</div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="shifts" className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <Input placeholder="Nombre" value={tplName} onChange={e => setTplName(e.target.value)} />
              <Input type="time" value={tplStart} onChange={e => setTplStart(e.target.value)} />
              <Input type="time" value={tplEnd} onChange={e => setTplEnd(e.target.value)} />
              <Input type="number" value={tplTol} onChange={e => setTplTol(parseInt(e.target.value || "0", 10))} />
              <Button disabled={!tplName || createTemplate.isPending} onClick={() => createTemplate.mutate({ nombre: tplName, inicio: tplStart, fin: tplEnd, tolerancia: tplTol, nocturno: tplNight })}>Crear plantilla</Button>
            </div>
            <ScrollArea className="h-64 border rounded p-2">
              {templates.length === 0 ? <div className="text-sm text-gray-500">Sin plantillas</div> : (
                <div className="space-y-2">
                  {templates.map((t: any) => (
                    <div key={t.id} className="flex justify-between items-center border rounded p-2">
                      <div>
                        <div className="font-medium">{t.nombre}</div>
                        <div className="text-xs text-gray-500">{t.hora_inicio} - {t.hora_fin} • tol {t.tolerancia_minutos}m {t.nocturno ? "• nocturno" : ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="schedules" className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Select value={selProf} onValueChange={setSelProf}>
                <SelectTrigger><SelectValue placeholder="Profesional" /></SelectTrigger>
                <SelectContent>
                  {professionals.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre_completo || p.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selTpl} onValueChange={setSelTpl}>
                <SelectTrigger><SelectValue placeholder="Plantilla" /></SelectTrigger>
                <SelectContent>
                  {templates.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selDay)} onValueChange={v => setSelDay(parseInt(v,10))}>
                <SelectTrigger><SelectValue placeholder="Día semana" /></SelectTrigger>
                <SelectContent>
                  {[
                    {v:1,l:"Lunes"},{v:2,l:"Martes"},{v:3,l:"Miércoles"},{v:4,l:"Jueves"},{v:5,l:"Viernes"},{v:6,l:"Sábado"},{v:7,l:"Domingo"}
                  ].map(d => (<SelectItem key={d.v} value={String(d.v)}>{d.l}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button disabled={!selProf || !selTpl || assignSchedule.isPending} onClick={() => assignSchedule.mutate({ profesional_id: selProf!, turno_id: selTpl!, dia_semana: selDay })}>Asignar</Button>
            </div>
            <ScrollArea className="h-64 border rounded p-2">
              {schedules.length === 0 ? <div className="text-sm text-gray-500">Sin horarios</div> : (
                <div className="space-y-2">
                  {schedules.map((s: any) => (
                    <div key={s.id} className="flex justify-between items-center border rounded p-2">
                      <div>
                        <div className="font-medium">{professionals.find(p => p.id === s.profesional_id)?.nombre_completo || s.profesional_id}</div>
                        <div className="text-xs text-gray-500">{s.turnos_plantillas?.hora_inicio} - {s.turnos_plantillas?.hora_fin} • {s.turnos_plantillas?.nombre} • D{String(s.dia_semana)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-3">
            <ScrollArea className="h-80 border rounded p-2">
              {recentPunches.length === 0 ? <div className="text-sm text-gray-500">Sin fichajes recientes</div> : (
                <div className="space-y-2">
                  {recentPunches.map((r: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center border rounded p-2">
                      <div>
                        <div className="font-medium">{new Date(r.time_local).toLocaleString("es-ES")}</div>
                        <div className="text-xs text-gray-500">SN {r.device_sn} • ENR {r.enroll_id} • {professionals.find(p => p.id === r.profesional_id)?.nombre_completo || r.profesional_id || ""}</div>
                      </div>
                      {r.temperature != null && <div className="text-xs">{r.temperature}ºC</div>}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CenterAttendancePanel;
