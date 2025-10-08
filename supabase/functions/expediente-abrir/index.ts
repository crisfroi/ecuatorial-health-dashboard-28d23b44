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

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const { data: { user } } = await anon.auth.getUser();
    if (!user) return json({ error: "No autenticado" }, 401);

    // Simple role check: metadata roles array or role string
    const roles = (user.app_metadata as any)?.roles as string[] | undefined;
    const rawRole = (user.user_metadata as any)?.role as string | undefined;
    const norm = (s?: string) => (s || '').toString().trim().toUpperCase();
    const isSuperAdmin = (Array.isArray(roles) && roles.map(norm).includes('SUPER_ADMINISTRADOR')) || norm(rawRole) === 'SUPER_ADMINISTRADOR';
    if (!isSuperAdmin) return json({ error: "Permiso denegado: solo SUPER_ADMINISTRADOR" }, 403);

    const { profesionalId, motivo, archivoAdjuntoUrl, fechaIncidente, faltaCodigo, gravedad, descripcion, centroSaludId, pruebasUrls } = await req.json();
    if (!profesionalId || !motivo) return json({ error: "Datos inválidos" }, 400);

    // Use service role for DB writes under RLS
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: expediente, error } = await service
      .from("expedientes_disciplinarios")
      .insert([{
        profesional_id: profesionalId,
        motivo,
        archivo_adjunto_url: archivoAdjuntoUrl ?? null,
        created_by: user.id,
        autoridad_solicitante: user.id,
        fecha_incidente: fechaIncidente ? new Date(fechaIncidente).toISOString() : new Date().toISOString(),
        falta_codigo: faltaCodigo ?? null,
        gravedad: gravedad ?? null,
        descripcion: descripcion ?? null,
        centro_salud_id: centroSaludId ?? null,
        pruebas_urls: Array.isArray(pruebasUrls) ? pruebasUrls : (archivoAdjuntoUrl ? [archivoAdjuntoUrl] : []),
        estado: 'borrador'
      }])
      .select()
      .single();
    if (error) throw error;

    await service.from("historial_acciones_expediente").insert([{
      expediente_id: expediente.id,
      accion: "apertura",
      comentario: "Expediente abierto (borrador) por SUPER_ADMINISTRADOR",
      actor_id: user.id,
    }]);

    return json({ ok: true, expediente });
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
