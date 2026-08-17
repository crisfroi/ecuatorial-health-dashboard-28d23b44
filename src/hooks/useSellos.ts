import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Los sellos (profesional / expediente / tesorería) se crearon directamente en
 * Supabase, por lo que los tipos generados locales aún no los incluyen y los
 * nombres exactos de columna pueden variar. Este hook consulta de forma
 * defensiva: prueba varias tablas y varias columnas de filtrado y normaliza el
 * resultado a una forma estable para la UI.
 */

export interface SelloNormalizado {
  tipo: "profesional" | "expediente";
  url: string | null;
  hash: string | null;
  codigo: string | null;
  fecha: string | null;
  raw: Record<string, any>;
}

const URL_KEYS = [
  "url_sello",
  "url_sello_profesional",
  "url_png",
  "url_imagen",
  "imagen_url",
  "url",
  "url_archivo",
  "archivo_url",
  "storage_url",
];

const HASH_KEYS = ["hash", "sello_hash", "hash_sello", "hmac", "firma", "firma_hash", "token"];
const CODIGO_KEYS = ["codigo", "codigo_sello", "numero_sello", "serie", "id_profesional_unico", "codigo_verificacion"];
const FECHA_KEYS = ["fecha_emision", "created_at", "fecha_creacion", "emitido_en", "fecha"];

const pick = (row: Record<string, any>, keys: string[]): string | null => {
  for (const k of keys) {
    const v = row?.[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  // Heurística: cualquier campo string que parezca una URL de imagen
  if (keys === URL_KEYS) {
    for (const [k, v] of Object.entries(row || {})) {
      if (typeof v === "string" && /^https?:\/\//.test(v) && /(png|svg|jpg|jpeg|webp|sello)/i.test(k + v)) {
        return v;
      }
    }
  }
  return null;
};

const normalize = (
  row: Record<string, any> | null,
  tipo: SelloNormalizado["tipo"],
): SelloNormalizado | null => {
  if (!row) return null;
  return {
    tipo,
    url: pick(row, URL_KEYS),
    hash: pick(row, HASH_KEYS),
    codigo: pick(row, CODIGO_KEYS),
    fecha: pick(row, FECHA_KEYS),
    raw: row,
  };
};

async function fetchFirstRow(
  tables: string[],
  filterColumns: string[],
  value: string,
): Promise<Record<string, any> | null> {
  for (const table of tables) {
    for (const col of filterColumns) {
      try {
        const { data, error } = await (supabase as any)
          .from(table)
          .select("*")
          .eq(col, value)
          .order("created_at", { ascending: false })
          .limit(1);
        if (error) continue;
        if (Array.isArray(data) && data.length > 0) return data[0];
      } catch {
        // columna o tabla inexistente / sin permisos: seguimos probando
      }
    }
  }
  return null;
}

export const useSelloProfesional = (profesionalId?: string, idUnico?: string | null) =>
  useQuery({
    queryKey: ["sello-profesional", profesionalId, idUnico],
    enabled: !!profesionalId,
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<SelloNormalizado | null> => {
      const tables = ["sellos_profesionales", "sellos_auditoria"];
      const cols = ["profesional_id", "entidad_id", "referencia_id", "id_profesional_unico"];
      let row = await fetchFirstRow(tables, cols, profesionalId!);
      if (!row && idUnico) {
        row = await fetchFirstRow(tables, ["id_profesional_unico", "codigo", "referencia"], idUnico);
      }
      return normalize(row, "profesional");
    },
  });

export const useSelloExpediente = (profesionalId?: string, codigoExpediente?: string | null) =>
  useQuery({
    queryKey: ["sello-expediente", profesionalId, codigoExpediente],
    enabled: !!profesionalId || !!codigoExpediente,
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<SelloNormalizado | null> => {
      const tables = ["sellos_expedientes", "sellos_auditoria"];
      let row: Record<string, any> | null = null;
      if (codigoExpediente) {
        row = await fetchFirstRow(tables, ["codigo_expediente", "expediente", "referencia"], codigoExpediente);
      }
      if (!row && profesionalId) {
        row = await fetchFirstRow(tables, ["profesional_id", "entidad_id", "referencia_id"], profesionalId);
      }
      return normalize(row, "expediente");
    },
  });
