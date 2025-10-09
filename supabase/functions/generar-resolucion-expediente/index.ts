import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

type Payload = {
  expedienteId: string;
  profesionalId: string;
  resolucionFinal: string;
  sancionTipo: "amonestacion" | "suspension" | "multa" | "inhabilitacion" | "archivado";
  sancionFechaInicio?: string; // ISO date
  sancionFechaFin?: string; // ISO date
  multaMonto?: number;
  autoridadNombre?: string;
  observaciones?: string;
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

    const body = await req.json() as Payload;
    if (!body.expedienteId || !body.profesionalId || !body.resolucionFinal || !body.sancionTipo) {
      return json({ error: "Datos inválidos" }, 400);
    }

    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch professional basic info
    const { data: prof } = await service
      .from("profesionales_sanitarios")
      .select("nombre_completo, id_profesional_unico, numero_dip, nombre_centro")
      .eq("id", body.profesionalId)
      .single();

    // Build a simple PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const drawText = (text: string, x: number, y: number, size = 12) => {
      page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
    };

    // Header
    drawText("República de Guinea Ecuatorial - Ministerio de Sanidad", 50, 800, 12);
    drawText("Dirección General de Recursos Humanos", 50, 785, 11);
    drawText("Resolución Disciplinaria", 50, 760, 16);

    // Professional info
    const y0 = 730;
    drawText(`Profesional: ${prof?.nombre_completo || ""}`.slice(0, 100), 50, y0);
    drawText(`ID Único: ${prof?.id_profesional_unico || ""}`.slice(0, 100), 50, y0 - 18);
    drawText(`Centro: ${prof?.nombre_centro || ""}`.slice(0, 100), 50, y0 - 36);

    // Expediente and decision
    drawText(`Expediente ID: ${body.expedienteId}`, 50, y0 - 66);
    drawText(`Sanción: ${body.sancionTipo.toUpperCase()}`, 50, y0 - 84);
    if (body.sancionFechaInicio) drawText(`Inicio: ${new Date(body.sancionFechaInicio).toLocaleDateString("es-ES")}`, 50, y0 - 102);
    if (body.sancionFechaFin) drawText(`Fin: ${new Date(body.sancionFechaFin).toLocaleDateString("es-ES")}`, 220, y0 - 102);
    if (typeof body.multaMonto === 'number') drawText(`Multa: ${body.multaMonto.toFixed(2)} XAF`, 50, y0 - 120);

    // Resolución Final (wrap lines)
    const wrapText = (t: string, max = 90) => {
      const words = t.split(/\s+/);
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        if ((line + " " + w).trim().length > max) {
          lines.push(line.trim());
          line = w;
        } else {
          line = (line + " " + w).trim();
        }
      }
      if (line) lines.push(line);
      return lines;
    };

    let y = y0 - 150;
    drawText("FUNDAMENTOS Y RESOLUCIÓN:", 50, y, 12);
    y -= 18;
    for (const ln of wrapText(body.resolucionFinal, 95)) {
      drawText(ln, 50, y);
      y -= 16;
      if (y < 80) break; // simple overflow guard
    }

    // Footer (signature)
    drawText(`Autoridad: ${(body.autoridadNombre || user.email || "Autoridad Disciplinaria")}`.slice(0, 90), 50, 80);
    drawText(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, 400, 80);

    const pdfBytes = await pdfDoc.save();
    const fileName = `resolucion_${body.expedienteId}_${Date.now()}.pdf`;

    // Upload to storage bucket "expedientes"
    const { error: upErr } = await service.storage.from("expedientes").upload(
      `${body.expedienteId}/${fileName}`,
      new Blob([pdfBytes], { type: "application/pdf" }),
      { contentType: "application/pdf", upsert: true },
    );
    if (upErr) return json({ error: upErr.message }, 500);

    const { data: pub } = service.storage.from("expedientes").getPublicUrl(`${body.expedienteId}/${fileName}`);
    const pdfUrl = pub?.publicUrl || null;

    // Update expediente with resolution and sanction
    const inhabilita = body.sancionTipo === "inhabilitacion";
    const suspende = body.sancionTipo === "suspension";
    const finalEstado = body.sancionTipo === "archivado" ? "archivado" : "sancionado";

    const updates: Record<string, unknown> = {
      resolucion_final: body.resolucionFinal,
      sancion_tipo: body.sancionTipo,
      sancion_fecha_inicio: body.sancionFechaInicio ? new Date(body.sancionFechaInicio).toISOString().slice(0,10) : null,
      sancion_fecha_fin: body.sancionFechaFin ? new Date(body.sancionFechaFin).toISOString().slice(0,10) : null,
      multa_monto: typeof body.multaMonto === 'number' ? body.multaMonto : null,
      inhabilitacion_permanente: inhabilita,
      updated_at: new Date().toISOString(),
      estado: finalEstado,
    };

    const { error: eUpdExp } = await service
      .from("expedientes_disciplinarios")
      .update(updates)
      .eq("id", body.expedienteId);
    if (eUpdExp) return json({ error: eUpdExp.message }, 500);

    await service.from("historial_acciones_expediente").insert({
      expediente_id: body.expedienteId,
      accion: "resolucion",
      comentario: `Resolución emitida. Sanción: ${body.sancionTipo}${suspende && body.sancionFechaInicio ? ` (${body.sancionFechaInicio}${body.sancionFechaFin ? `→${body.sancionFechaFin}` : ""})` : ""}`,
      actor_id: user.id,
    });

    // Impact on public profile: optional flag via a lightweight record in a separate table or just rely on expediente lookup
    // Here we only ensure the resolution PDF is accessible via expediente relationship.

    return json({ ok: true, pdfUrl });
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
