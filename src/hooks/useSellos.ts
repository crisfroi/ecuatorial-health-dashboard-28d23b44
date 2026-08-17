import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SelloNormalizado {
  tipo: "profesional" | "expediente";
  url: string | null;
  hash: string | null;
  codigo: string | null;
  fecha: string | null;
  raw: Record<string, any>;
}

const URL_KEYS = ["url_sello", "url_sello_profesional", "url_png", "url_imagen", "imagen_url", "url", "url_archivo", "archivo_url", "storage_url"];
const HASH_KEYS = ["hash", "sello_hash", "hash_sello", "hmac", "firma", "firma_hash", "token"];
const CODIGO_KEYS = ["codigo", "codigo_sello", "numero_sello", "serie", "id_profesional_unico", "codigo_verificacion"];
const FECHA_KEYS = ["fecha_emision", "created_at", "fecha_creacion", "emitido_en", "fecha"];

const pick = (row: Record<string, any>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = row?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
};

const normalize = (row: Record<string, any> | null, tipo: SelloNormalizado["tipo"]): SelloNormalizado | null => {
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

async function fetchFirstRow(tables: string[], filterColumns: string[], value: string): Promise<Record<string, any> | null> {
  for (const table of tables) {
    for (const column of filterColumns) {
      try {
        const { data, error } = await (supabase as any)
          .from(table)
          .select("*")
          .eq(column, value)
          .order("created_at", { ascending: false })
          .limit(1);
        if (!error && Array.isArray(data) && data.length) return data[0];
      } catch {
        // Tabla/columna no disponible: continuar.
      }
    }
  }
  return null;
}

export const useSelloProfesional = (profesionalId?: string, idUnico?: string | null) =>
  useQuery({
    queryKey: ["sello-profesional", profesionalId, idUnico],
    enabled: Boolean(profesionalId || idUnico),
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<SelloNormalizado | null> => {
      // Primero usamos la fuente canónica del profesional. El sello profesional
      // no debe depender del sello de expediente ni de una fila de auditoría.
      if (profesionalId) {
        try {
          const { data } = await (supabase as any)
            .from("profesionales_sanitarios")
            .select("id,id_profesional_unico,url_sello_profesional,sello_profesional_id")
            .eq("id", profesionalId)
            .maybeSingle();
          if (data?.url_sello_profesional) {
            return normalize({ ...data, url_sello: data.url_sello_profesional, codigo: data.id_profesional_unico }, "profesional");
          }
          if (data?.sello_profesional_id) {
            const row = await fetchFirstRow(["sellos_profesionales", "sellos_auditoria"], ["id", "sello_id", "referencia_id", "entidad_id"], data.sello_profesional_id);
            if (row) return normalize(row, "profesional");
          }
        } catch {
          // Continuar con fuentes históricas.
        }
      }

      const tables = ["sellos_profesionales", "sellos_auditoria"];
      let row = profesionalId ? await fetchFirstRow(tables, ["profesional_id", "entidad_id", "referencia_id", "id_profesional_unico"], profesionalId) : null;
      if (!row && idUnico) row = await fetchFirstRow(tables, ["id_profesional_unico", "codigo", "referencia"], idUnico);
      return normalize(row, "profesional");
    },
  });

export const useSelloExpediente = (profesionalId?: string, codigoExpediente?: string | null) =>
  useQuery({
    queryKey: ["sello-expediente", profesionalId, codigoExpediente],
    enabled: Boolean(profesionalId || codigoExpediente),
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<SelloNormalizado | null> => {
      let row: Record<string, any> | null = null;
      if (codigoExpediente) row = await fetchFirstRow(["sellos_expedientes", "sellos_auditoria"], ["codigo_expediente", "expediente", "referencia"], codigoExpediente);
      if (!row && profesionalId) row = await fetchFirstRow(["sellos_expedientes", "sellos_auditoria"], ["profesional_id", "entidad_id", "referencia_id"], profesionalId);
      return normalize(row, "expediente");
    },
  });
