import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfessionalCenterData {
  nombre_centro: string;
  categoria_centro: string;
  distrito_sanitario?: string;
  tipo_sector: string;
  provincia: string;
  distrito: string;
}

export const useCenterSync = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Function to sync center data from professional registration
  const syncCenterFromProfessional = async (
    professionalData: ProfessionalCenterData & { professional_id?: string },
  ) => {
    const {
      nombre_centro,
      categoria_centro,
      distrito_sanitario,
      tipo_sector,
      provincia,
      distrito,
    } = professionalData;

    if (!nombre_centro || !categoria_centro || !provincia || !distrito) {
      return null; // Skip if essential data is missing
    }

    // Check if center already exists
    const { data: existingCenter, error: searchError } = await supabase
      .from("centros_salud")
      .select("id, nombre, categoria, provincia, distrito")
      .eq("nombre", nombre_centro)
      .eq("categoria", categoria_centro)
      .eq("provincia", provincia)
      .eq("distrito", distrito)
      .maybeSingle();

    if (searchError) {
      console.error("Error searching for existing center:", searchError);
      return null;
    }

    // If center exists, return its ID
    if (existingCenter) {
      return existingCenter.id;
    }

    // Create new center with pending status
    const { data: newCenter, error: createError } = await supabase
      .from("centros_salud")
      .insert([
        {
          nombre: nombre_centro,
          categoria: categoria_centro,
          distrito_sanitario: distrito_sanitario || null,
          sector: tipo_sector,
          provincia,
          distrito,
          estado: "pendiente_validacion", // Mark as pending validation
          created_at: new Date().toISOString(),
        },
      ])
      .select("id")
      .single();

    if (createError) {
      console.error("Error creating new center:", createError);
      throw createError;
    }

    return newCenter.id;
  };

  // Mutation to validate and complete center information
  const validateCenterMutation = useMutation({
    mutationFn: async ({
      centerId,
      validationData,
    }: {
      centerId: string;
      validationData: {
        director?: string;
        telefono?: string;
        especialidades?: string[];
        estado: "validado" | "rechazado";
      };
    }) => {
      const { data, error } = await supabase
        .from("centros_salud")
        .update({
          ...validationData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", centerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centros"] });
      toast({
        title: "Centro validado",
        description: "El centro de salud ha sido validado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al validar centro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to get pending centers for validation
  const getPendingCenters = async () => {
    const { data, error } = await supabase
      .from("centros_salud")
      .select(
        `
        *,
        profesionales_count:profesionales_sanitarios(count)
      `,
      )
      .eq("estado", "pendiente_validacion")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  };

  // Hook to update professional's center relationship
  const updateProfessionalCenterMutation = useMutation({
    mutationFn: async ({
      professionalId,
      centerId,
    }: {
      professionalId: string;
      centerId: string;
    }) => {
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .update({ centro_salud_id: centerId })
        .eq("id", professionalId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profesionales"] });
    },
  });

  return {
    syncCenterFromProfessional,
    validateCenterMutation,
    updateProfessionalCenterMutation,
    getPendingCenters,
  };
};

export default useCenterSync;
