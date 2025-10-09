import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

type CambioEstadoPayload = {
  expedienteId: string;
  nuevoEstado: "borrador" | "en_investigacion" | "audiencia_programada" | "pendiente_resolucion" | "sancionado" | "archivado";
  comentario?: string;
};

type NotaPayload = {
  expedienteId: string;
  comentario: string;
};

type AdjuntarDocumentoPayload = {
  expedienteId: string;
  documentoUrl: string;
  comentario?: string;
};

type Body = {
  accion: "cambio_estado" | "nota" | "adjuntar_documento" | "notificacion";
  payload: CambioEstadoPayload | NotaPayload | AdjuntarDocumentoPayload | Record<string, unknown>;
};

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const { data: { user } } = await anon.auth.getUser();
    if (!user) return json({ error: "No autenticado" }, 401);

    const roles = (user.app_metadata as any)?.roles as string[] | undefined;
    const rawRole = (user.user_metadata as any)?.role as string | undefined;
    const norm = (s?: string) => (s || '').toString().trim().toUpperCase();
    const allowed = new Set(["SUPER_ADMINISTRADOR", "AUTORIDAD_DISCIPLINARIA"]);
    const hasRole = (Array.isArray(roles) && roles.map(norm).some(r => allowed.has(r))) || allowed.has(norm(rawRole));
    if (!hasRole) return json({ error: "Permiso denegado" }, 403);

    const body = await req.json() as Body;
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    if (body.accion === "cambio_estado") {
      const { expedienteId, nuevoEstado, comentario } = body.payload as CambioEstadoPayload;
      if (!expedienteId || !nuevoEstado) return json({ error: "Datos inválidos" }, 400);

      const { data: exp, error: eGet } = await service
        .from("expedientes_disciplinarios")
        .select("id, estado")
        .eq("id", expedienteId)
        .single();
      if (eGet || !exp) return json({ error: eGet?.message || "Expediente no encontrado" }, 404);

      const { error: eUpd } = await service
        .from("expedientes_disciplinarios")
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
        .eq("id", expedienteId);
      if (eUpd) return json({ error: eUpd.message }, 500);

      await service.from("historial_acciones_expediente").insert({
        expediente_id: expedienteId,
        accion: "cambio_estado",
        comentario: `Estado: ${exp.estado} → ${nuevoEstado}${comentario ? ` | ${comentario}` : ""}`,
        actor_id: user.id,
      });

      return json({ ok: true });
    }

    if (body.accion === "nota") {
      const { expedienteId, comentario } = body.payload as NotaPayload;
      if (!expedienteId || !comentario) return json({ error: "Datos inválidos" }, 400);
      await service.from("historial_acciones_expediente").insert({
        expediente_id: expedienteId,
        accion: "nota",
        comentario,
        actor_id: user.id,
      });
      return json({ ok: true });
    }

    if (body.accion === "adjuntar_documento") {
      const { expedienteId, documentoUrl, comentario } = body.payload as AdjuntarDocumentoPayload;
      if (!expedienteId || !documentoUrl) return json({ error: "Datos inválidos" }, 400);

      const { data: exp } = await service
        .from("expedientes_disciplinarios")
        .select("pruebas_urls")
        .eq("id", expedienteId)
        .single();
      const arr = Array.isArray(exp?.pruebas_urls) ? exp!.pruebas_urls as string[] : [];
      arr.push(documentoUrl);
      const { error: eUpd } = await service
        .from("expedientes_disciplinarios")
        .update({ pruebas_urls: arr, updated_at: new Date().toISOString() })
        .eq("id", expedienteId);
      if (eUpd) return json({ error: eUpd.message }, 500);

      await service.from("historial_acciones_expediente").insert({
        expediente_id: expedienteId,
        accion: "adjuntar_documento",
        comentario: comentario ? `${comentario} | ${documentoUrl}` : documentoUrl,
        actor_id: user.id,
      });
      return json({ ok: true });
    }

    if (body.accion === "notificacion") {
      const payload = body.payload as Record<string, unknown>;
      await service.from("historial_acciones_expediente").insert({
        expediente_id: String(payload.expedienteId || ""),
        accion: "notificacion",
        comentario: (payload.detalle as string) || "notificación registrada",
        actor_id: user.id,
      });
      return json({ ok: true });
    }

    return json({ error: "Acción no soportada" }, 400);
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
