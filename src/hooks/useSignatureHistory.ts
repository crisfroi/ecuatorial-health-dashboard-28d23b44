import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SignatureHistoryEntry {
  id: string;
  profesional: string;
  accion: string;
  usuario: string;
  fecha: string;
  detalles: string;
  tipo: "approval" | "rejection" | "status_change";
  estado_anterior?: string;
  estado_nuevo?: string;
}

export function useSignatureHistory() {
  return useQuery({
    queryKey: ["signature-history"],
    queryFn: async (): Promise<SignatureHistoryEntry[]> => {
      console.log("Fetching signature history...");

      // Get recently approved professionals
      const { data: approved, error: approvedError } = await supabase
        .from("profesionales_sanitarios")
        .select(
          `
          id,
          nombre,
          apellidos,
          fecha_aprobacion,
          notas_aprobacion,
          area_profesional
        `,
        )
        .eq("estado_solicitud", "Aprobado")
        .not("fecha_aprobacion", "is", null)
        .order("fecha_aprobacion", { ascending: false })
        .limit(20);

      if (approvedError) {
        console.error("Error fetching approved professionals:", approvedError);
        throw approvedError;
      }

      // Get recently rejected professionals
      const { data: rejected, error: rejectedError } = await supabase
        .from("profesionales_sanitarios")
        .select(
          `
          id,
          nombre,
          apellidos,
          fecha_rechazo,
          motivo_rechazo,
          area_profesional
        `,
        )
        .eq("estado_solicitud", "Rechazado")
        .not("fecha_rechazo", "is", null)
        .order("fecha_rechazo", { ascending: false })
        .limit(20);

      if (rejectedError) {
        console.error("Error fetching rejected professionals:", rejectedError);
        throw rejectedError;
      }

      const historyEntries: SignatureHistoryEntry[] = [];

      // Process approved professionals
      if (approved) {
        for (const professional of approved) {
          const fullName =
            `${professional.nombre || ""} ${professional.apellidos || ""}`.trim();
          historyEntries.push({
            id: `approved-${professional.id}`,
            profesional: fullName,
            accion: "Solicitud aprobada y firmada",
            usuario: "Ministro de Sanidad", // TODO: Get actual user from auth
            fecha: new Date(professional.fecha_aprobacion).toLocaleString(
              "es-ES",
            ),
            detalles:
              professional.notas_aprobacion ||
              "Aprobación ministerial completada",
            tipo: "approval",
            estado_anterior: "Pendiente de Firma",
            estado_nuevo: "Aprobado",
          });
        }
      }

      // Process rejected professionals
      if (rejected) {
        for (const professional of rejected) {
          const fullName =
            `${professional.nombre || ""} ${professional.apellidos || ""}`.trim();
          historyEntries.push({
            id: `rejected-${professional.id}`,
            profesional: fullName,
            accion: "Solicitud rechazada",
            usuario: "Ministro de Sanidad", // TODO: Get actual user from auth
            fecha: new Date(professional.fecha_rechazo).toLocaleString("es-ES"),
            detalles:
              professional.motivo_rechazo ||
              "Solicitud rechazada por el ministerio",
            tipo: "rejection",
            estado_anterior: "Pendiente de Firma",
            estado_nuevo: "Rechazado",
          });
        }
      }

      // Sort all entries by date (most recent first)
      historyEntries.sort((a, b) => {
        const dateA = new Date(a.fecha).getTime();
        const dateB = new Date(b.fecha).getTime();
        return dateB - dateA;
      });

      console.log(`Found ${historyEntries.length} history entries`);
      return historyEntries.slice(0, 50); // Limit to 50 most recent entries
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
