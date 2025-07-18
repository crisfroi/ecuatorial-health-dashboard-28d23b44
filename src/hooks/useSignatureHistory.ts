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
          titulacion_especifica_1,
          area_profesional
        `,
        )
        .eq("estado_solicitud", "Aprobado")
        .not("fecha_aprobacion", "is", null)
        .order("fecha_aprobacion", { ascending: false })
        .limit(20);

      if (approvedError) {
        console.error("Error fetching approved professionals:", {
          error: approvedError,
          type: typeof approvedError,
          constructor: approvedError?.constructor?.name,
          message: approvedError?.message,
          details: approvedError?.details,
          hint: approvedError?.hint,
          code: approvedError?.code,
          keys: Object.keys(approvedError || {}),
          stringified: JSON.stringify(
            approvedError,
            Object.getOwnPropertyNames(approvedError),
            2,
          ),
        });

        const errorMessage =
          approvedError?.details ||
          approvedError?.hint ||
          approvedError?.message ||
          `Database error (code: ${approvedError?.code || "unknown"})`;

        throw new Error(
          `Failed to fetch approved professionals: ${errorMessage}`,
        );
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
        console.error("Error fetching rejected professionals:", {
          error: rejectedError,
          type: typeof rejectedError,
          constructor: rejectedError?.constructor?.name,
          message: rejectedError?.message,
          details: rejectedError?.details,
          hint: rejectedError?.hint,
          code: rejectedError?.code,
          keys: Object.keys(rejectedError || {}),
          stringified: JSON.stringify(
            rejectedError,
            Object.getOwnPropertyNames(rejectedError),
            2,
          ),
        });

        const errorMessage =
          rejectedError?.details ||
          rejectedError?.hint ||
          rejectedError?.message ||
          `Database error (code: ${rejectedError?.code || "unknown"})`;

        throw new Error(
          `Failed to fetch rejected professionals: ${errorMessage}`,
        );
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
            fecha: professional.fecha_aprobacion, // Keep ISO string for calculations
            fechaDisplay: new Date(
              professional.fecha_aprobacion,
            ).toLocaleString("es-ES"),
            detalles: "Aprobación ministerial completada",
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
            fecha: professional.fecha_rechazo, // Keep ISO string for calculations
            fechaDisplay: new Date(professional.fecha_rechazo).toLocaleString(
              "es-ES",
            ),
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
