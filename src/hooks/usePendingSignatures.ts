import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface PendingSignature {
  id: string;
  profesional: string;
  profesion: string;
  fecha_solicitud: string;
  urgencia: "Alta" | "Media" | "Baja";
  dias_pendiente: number;
  telefono?: string;
  email?: string;
  area_profesional?: string;
  id_profesional: string;
}

// Calculate urgency based on days since application
function calculateUrgency(fechaSolicitud: string): {
  urgencia: "Alta" | "Media" | "Baja";
  dias: number;
} {
  const solicitudDate = new Date(fechaSolicitud);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - solicitudDate.getTime());
  const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let urgencia: "Alta" | "Media" | "Baja";

  if (dias > 15) {
    urgencia = "Alta";
  } else if (dias >= 7) {
    urgencia = "Media";
  } else {
    urgencia = "Baja";
  }

  return { urgencia, dias };
}

export function usePendingSignatures() {
  return useQuery({
    queryKey: ["pending-signatures"],
    queryFn: async (): Promise<PendingSignature[]> => {
      console.log("Fetching professionals pending signature...");

      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select(
          `
          id,
          nombre,
          apellidos,
          area_profesional,
          id_profesional_unico,
          titulacion_especifica_1,
          telefono,
          email,
          fecha_solicitud,
          estado_solicitud
        `,
        )
        .eq("estado_solicitud", "Pendiente de Firma")
        .order("fecha_solicitud", { ascending: true }); // Oldest first

      if (error) {
        console.error("Error fetching pending signatures:", {
          error,
          type: typeof error,
          constructor: error?.constructor?.name,
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          keys: Object.keys(error || {}),
          stringified: JSON.stringify(
            error,
            Object.getOwnPropertyNames(error),
            2,
          ),
        });

        // Create a more informative error
        const errorMessage =
          error?.details ||
          error?.hint ||
          error?.message ||
          `Database error (code: ${error?.code || "unknown"})`;

        throw new Error(`Failed to fetch pending signatures: ${errorMessage}`);
      }

      if (!data) {
        return [];
      }

      const pendingSignatures: PendingSignature[] = data.map((professional) => {
        const fullName =
          `${professional.nombre || ""} ${professional.apellidos || ""}`.trim();
        const { urgencia, dias } = calculateUrgency(
          professional.fecha_solicitud || "",
        );

        return {
          id: professional.id,
          profesional: fullName,
          profesion:
            professional.titulacion_especifica_1 ||
            professional.area_profesional ||
            "No especificado",
          fecha_solicitud: professional.fecha_solicitud || "",
          urgencia,
          dias_pendiente: dias,
          telefono: professional.telefono,
          email: professional.email,
          area_profesional: professional.area_profesional,
          id_profesional: professional.id_profesional_unico || "No asignado",
        };
      });

      console.log(
        `Found ${pendingSignatures.length} professionals pending signature`,
      );
      return pendingSignatures;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useSignProfessional() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      professionalId,
      reason,
    }: {
      professionalId: string;
      reason?: string;
    }) => {
      console.log(`Signing professional ${professionalId}...`);

      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .update({
          estado_solicitud: "Aprobado",
          fecha_aprobacion: new Date().toISOString(),
        })
        .eq("id", professionalId)
        .select("nombre, apellidos")
        .single();

      if (error) {
        console.error("Error signing professional:", {
          error,
          type: typeof error,
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          stringified: JSON.stringify(
            error,
            Object.getOwnPropertyNames(error),
            2,
          ),
        });

        const errorMessage =
          error?.details ||
          error?.hint ||
          error?.message ||
          `Database error (code: ${error?.code || "unknown"})`;

        throw new Error(`Failed to sign professional: ${errorMessage}`);
      }

      return data;
    },
    onSuccess: (data) => {
      const fullName = `${data.nombre || ""} ${data.apellidos || ""}`.trim();

      toast({
        title: "Profesional Firmado",
        description: `${fullName} ha sido aprobado exitosamente.`,
      });

      // Invalidate queries to refresh data immediately
      queryClient.invalidateQueries({ queryKey: ["pending-signatures"] });
      queryClient.invalidateQueries({ queryKey: ["signature-history"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas-avanzadas"] });

      // Force refetch to ensure immediate updates
      queryClient.refetchQueries({ queryKey: ["signature-history"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al Firmar",
        description: `No se pudo firmar al profesional: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useSignMultipleProfessionals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      professionalIds,
      reason,
    }: {
      professionalIds: string[];
      reason?: string;
    }) => {
      console.log(`Signing ${professionalIds.length} professionals...`);

      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .update({
          estado_solicitud: "Aprobado",
          fecha_aprobacion: new Date().toISOString(),
        })
        .in("id", professionalIds)
        .select("id, nombre, apellidos");

      if (error) {
        console.error("Error signing multiple professionals:", {
          error,
          type: typeof error,
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          stringified: JSON.stringify(
            error,
            Object.getOwnPropertyNames(error),
            2,
          ),
        });

        const errorMessage =
          error?.details ||
          error?.hint ||
          error?.message ||
          `Database error (code: ${error?.code || "unknown"})`;

        throw new Error(
          `Failed to sign multiple professionals: ${errorMessage}`,
        );
      }

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Firma Múltiple Exitosa",
        description: `Se han aprobado ${data.length} profesionales exitosamente.`,
      });

      // Invalidate queries to refresh data immediately
      queryClient.invalidateQueries({ queryKey: ["pending-signatures"] });
      queryClient.invalidateQueries({ queryKey: ["signature-history"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas-avanzadas"] });

      // Force refetch to ensure immediate updates
      queryClient.refetchQueries({ queryKey: ["signature-history"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error en Firma Múltiple",
        description: `No se pudo completar la firma múltiple: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useRejectProfessional() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      professionalId,
      reason,
    }: {
      professionalId: string;
      reason: string;
    }) => {
      console.log(`Rejecting professional ${professionalId}...`);

      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .update({
          estado_solicitud: "Rechazado",
          fecha_rechazo: new Date().toISOString(),
          motivo_rechazo: reason,
        })
        .eq("id", professionalId)
        .select("nombre, apellidos")
        .single();

      if (error) {
        console.error("Error rejecting professional:", {
          error,
          type: typeof error,
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          stringified: JSON.stringify(
            error,
            Object.getOwnPropertyNames(error),
            2,
          ),
        });

        const errorMessage =
          error?.details ||
          error?.hint ||
          error?.message ||
          `Database error (code: ${error?.code || "unknown"})`;

        throw new Error(`Failed to reject professional: ${errorMessage}`);
      }

      return data;
    },
    onSuccess: (data) => {
      const fullName = `${data.nombre || ""} ${data.apellidos || ""}`.trim();

      toast({
        title: "Solicitud Rechazada",
        description: `La solicitud de ${fullName} ha sido rechazada.`,
        variant: "destructive",
      });

      // Invalidate queries to refresh data immediately
      queryClient.invalidateQueries({ queryKey: ["pending-signatures"] });
      queryClient.invalidateQueries({ queryKey: ["signature-history"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas-avanzadas"] });

      // Force refetch to ensure immediate updates
      queryClient.refetchQueries({ queryKey: ["signature-history"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al Rechazar",
        description: `No se pudo rechazar la solicitud: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}
