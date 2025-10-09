import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ExpedienteEstado =
  | "borrador"
  | "en_investigacion"
  | "audiencia_programada"
  | "pendiente_resolucion"
  | "sancionado"
  | "archivado";

export interface ExpedienteRow {
  id: string;
  profesional_id: string;
  motivo: string;
  estado: ExpedienteEstado | string;
  fecha_apertura: string;
  fecha_incidente?: string | null;
  falta_codigo?: string | null;
  gravedad?: "leve" | "grave" | "muy_grave" | null;
  descripcion?: string | null;
  centro_salud_id?: string | null;
  pruebas_urls?: string[] | null;
}

export interface ExpedienteWithProfesional extends ExpedienteRow {
  profesional: { id: string; nombre_completo: string; id_profesional_unico: string | null } | null;
}

export function useExpedientes(filter?: { estado?: ExpedienteEstado | "todos"; search?: string }) {
  return useQuery({
    queryKey: ["expedientes", filter?.estado || "todos", filter?.search || ""],
    queryFn: async () => {
      const qb = supabase
        .from("expedientes_disciplinarios")
        .select("id,profesional_id,motivo,estado,fecha_apertura,fecha_incidente,falta_codigo,gravedad,descripcion,centro_salud_id,pruebas_urls, profesionales_sanitarios(id,nombre_completo,id_profesional_unico)")
        .order("fecha_apertura", { ascending: false });
      if (filter?.estado && filter.estado !== "todos") qb.eq("estado", filter.estado);
      const { data, error } = await qb;
      if (error) throw error;
      const mapped: ExpedienteWithProfesional[] = (data || []).map((d: any) => ({
        id: d.id,
        profesional_id: d.profesional_id,
        motivo: d.motivo,
        estado: d.estado,
        fecha_apertura: d.fecha_apertura,
        fecha_incidente: d.fecha_incidente,
        falta_codigo: d.falta_codigo,
        gravedad: d.gravedad,
        descripcion: d.descripcion,
        centro_salud_id: d.centro_salud_id,
        pruebas_urls: d.pruebas_urls,
        profesional: d.profesionales_sanitarios || null,
      }));
      return mapped;
    },
  });
}

export function useHistorial(expedienteId?: string) {
  return useQuery({
    queryKey: ["historial_expediente", expedienteId],
    enabled: Boolean(expedienteId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historial_acciones_expediente")
        .select("id,accion,comentario,actor_id,created_at")
        .eq("expediente_id", expedienteId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useActualizarEstado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { expedienteId: string; nuevoEstado: ExpedienteEstado; comentario?: string }) => {
      const token = (await supabase.auth.getSession()).data.session?.access_token || "";
      const res = await fetch("/functions/v1/expediente-actualizar-estado", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accion: "cambio_estado", payload: input }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error actualizando estado");
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expedientes"] });
      qc.invalidateQueries({ queryKey: ["historial_expediente"] });
    },
  });
}

export function useAgregarNota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { expedienteId: string; comentario: string }) => {
      const token = (await supabase.auth.getSession()).data.session?.access_token || "";
      const res = await fetch("/functions/v1/expediente-actualizar-estado", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accion: "nota", payload: input }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error agregando nota");
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["historial_expediente"] });
    },
  });
}

export function useAdjuntarDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { expedienteId: string; file: File; comentario?: string }) => {
      const path = `${input.expedienteId}/${Date.now()}_${input.file.name}`;
      const up = await supabase.storage.from("expedientes").upload(path, input.file, { upsert: true });
      if (up.error) throw up.error;
      const pub = supabase.storage.from("expedientes").getPublicUrl(up.data.path);
      const url = pub.data.publicUrl;

      const token = (await supabase.auth.getSession()).data.session?.access_token || "";
      const res = await fetch("/functions/v1/expediente-actualizar-estado", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accion: "adjuntar_documento", payload: { expedienteId: input.expedienteId, documentoUrl: url, comentario: input.comentario } }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error adjuntando documento");
      return { ...json, url };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expedientes"] });
      qc.invalidateQueries({ queryKey: ["historial_expediente"] });
    },
  });
}

export function useGenerarResolucion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      expedienteId: string;
      profesionalId: string;
      resolucionFinal: string;
      sancionTipo: "amonestacion" | "suspension" | "multa" | "inhabilitacion" | "archivado";
      sancionFechaInicio?: string;
      sancionFechaFin?: string;
      multaMonto?: number;
      autoridadNombre?: string;
      observaciones?: string;
    }) => {
      const token = (await supabase.auth.getSession()).data.session?.access_token || "";
      const res = await fetch("/functions/v1/generar-resolucion-expediente", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error generando resolución");
      return json as { ok: true; pdfUrl: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expedientes"] });
      qc.invalidateQueries({ queryKey: ["historial_expediente"] });
    },
  });
}
