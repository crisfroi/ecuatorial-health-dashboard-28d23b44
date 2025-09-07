import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/utils/errorHandler";

export interface SolicitudEstablecimiento {
  id: string;
  numero_solicitud?: string;
  numero_registro?: string;
  nombre_establecimiento: string;
  categoria: string;
  tipo_servicio: string;
  provincia: string;
  distrito_sanitario?: string | null;
  direccion: string;
  telefono?: string | null;
  email?: string | null;
  director_responsable?: string | null;
  servicios_ofrecidos?: string[] | null;
  numero_camas?: number | null;
  areas_especializadas?: string[] | null;
  equipamiento_medico?: string[] | null;
  fotos_establecimiento?: string[] | null;
  documentos_adicionales?: string[] | null;
  estado?: string | null;
  motivo_rechazo?: string | null;
  fecha_solicitud?: string | null;
  fecha_revision?: string | null;
  fecha_autorizacion?: string | null;
  solicitante_id?: string | null;
  revisor_id?: string | null;
  autorizador_id?: string | null;
  observaciones?: string | null;
  notas_revision?: string | null;
  nif?: string | null;
  tipo_documento?: string | null;
  numero_documento?: string | null;
  nacionalidad_responsable?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CrearSolicitudEstablecimientoParams {
  nombre_establecimiento: string;
  categoria: string;
  tipo_servicio: string;
  provincia: string;
  distrito_sanitario?: string;
  direccion: string;
  telefono?: string;
  email?: string;
  director_responsable?: string;
  servicios_ofrecidos?: string[];
  numero_camas?: number;
  areas_especializadas?: string[];
  equipamiento_medico?: string[];
  fotos_establecimiento?: File[];
  documentos_adicionales?: File[];
  observaciones?: string;
  nif?: string;
  tipo_documento?: string;
  numero_documento?: string;
  nacionalidad_responsable?: string;
}

export const useSolicitudesEstablecimientos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const crearSolicitud = async (params: CrearSolicitudEstablecimientoParams) => {
    console.log("🏗️ Creando nueva solicitud de establecimiento:", params.nombre_establecimiento);

    const { data: { user } } = await supabase.auth.getUser();
    const solicitanteId = user?.id || null; // permitir envío público sin sesión

    // Helper para convertir archivos a data URL como respaldo cuando el storage falle o no haya permisos
    const fileToDataUrl = async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    // Intentar subir archivos; si falla por permisos, usar data URLs (permite envíos públicos)
    let fotosUrls: string[] = [];
    if (params.fotos_establecimiento && params.fotos_establecimiento.length > 0) {
      for (const foto of params.fotos_establecimiento) {
        try {
          const fileName = `${Date.now()}_${foto.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('fotos-carnet')
            .upload(`establecimientos/${fileName}`, foto);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('fotos-carnet')
            .getPublicUrl(uploadData.path);

          fotosUrls.push(publicUrl);
        } catch (e) {
          const fallback = await fileToDataUrl(foto);
          fotosUrls.push(fallback);
        }
      }
    }

    let documentosUrls: string[] = [];
    if (params.documentos_adicionales && params.documentos_adicionales.length > 0) {
      for (const doc of params.documentos_adicionales) {
        try {
          const fileName = `${Date.now()}_${doc.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documentos-profesionales')
            .upload(`establecimientos/${fileName}`, doc);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('documentos-profesionales')
            .getPublicUrl(uploadData.path);

          documentosUrls.push(publicUrl);
        } catch (e) {
          const fallback = await fileToDataUrl(doc);
          documentosUrls.push(fallback);
        }
      }
    }

    const {
      fotos_establecimiento: _fe,
      documentos_adicionales: _da,
      nif,
      tipo_documento,
      numero_documento,
      nacionalidad_responsable,
      observaciones,
      ...rest
    } = params as any;

    const observacionesExtendidas = [
      observaciones?.toString().trim() || null,
      nif ? `NIF: ${nif}` : null,
      tipo_documento ? `Tipo documento: ${tipo_documento}` : null,
      numero_documento ? `Número documento: ${numero_documento}` : null,
      nacionalidad_responsable ? `Nacionalidad responsable: ${nacionalidad_responsable}` : null,
    ].filter(Boolean).join(" | ") || null;

    const { data, error } = await supabase
      .from("solicitudes_establecimientos")
      .insert([
        {
          ...rest,
          observaciones: observacionesExtendidas,
          fotos_establecimiento: fotosUrls,
          documentos_adicionales: documentosUrls,
          solicitante_id: solicitanteId,
        },
      ])
      .select()
      .single();

    if (error) {
      const message = getErrorMessage(error);
      console.error("❌ Error al crear solicitud:", message, error);
      throw error;
    }
    
    console.log("✅ Solicitud creada exitosamente:", data.id);
    return data;
  };

  const actualizarEstado = async (id: string, estado: string, motivo_rechazo?: string, notas_revision?: string) => {
    console.log("✏️ Actualizando estado de solicitud:", id, "a", estado);
    
    const updates: any = {
      estado,
      updated_at: new Date().toISOString()
    };

    if (estado === 'Revisando' || estado === 'Pendiente de Firma') {
      updates.fecha_revision = new Date().toISOString();
    }
    
    if (estado === 'Rechazado' && motivo_rechazo) {
      updates.motivo_rechazo = motivo_rechazo;
    }

    if (notas_revision) {
      updates.notas_revision = notas_revision;
    }

    const { data, error } = await supabase
      .from("solicitudes_establecimientos")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Error al actualizar estado:", error);
      throw error;
    }
    
    console.log("✅ Estado actualizado exitosamente");
    return data;
  };

  const obtenerSolicitudes = async (filtros: { estado?: string; fecha_desde?: string; fecha_hasta?: string } = {}) => {
    let query = supabase
      .from("solicitudes_establecimientos")
      .select("*");

    if (filtros.estado && filtros.estado !== "todos") {
      query = query.eq("estado", filtros.estado);
    }

    if (filtros.fecha_desde) {
      query = query.gte("fecha_solicitud", filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      query = query.lte("fecha_solicitud", filtros.fecha_hasta);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error al obtener solicitudes:", error);
      throw error;
    }

    return data as SolicitudEstablecimiento[];
  };

  const crearSolicitudMutation = useMutation({
    mutationFn: crearSolicitud,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitudes-establecimientos"] });
      toast({
        title: "Solicitud creada",
        description: "La solicitud de establecimiento ha sido enviada exitosamente.",
      });
    },
    onError: (error: any) => {
      const message = getErrorMessage(error);
      console.error("❌ Error en mutación crear solicitud:", message, error);
      toast({
        title: "Error al crear solicitud",
        description: message,
        variant: "destructive",
      });
    },
  });

  const actualizarEstadoMutation = useMutation({
    mutationFn: ({ id, estado, motivo_rechazo, notas_revision }: { 
      id: string; 
      estado: string; 
      motivo_rechazo?: string; 
      notas_revision?: string; 
    }) => actualizarEstado(id, estado, motivo_rechazo, notas_revision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitudes-establecimientos"] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la solicitud ha sido actualizado correctamente.",
      });
    },
    onError: (error: any) => {
      const message = getErrorMessage(error);
      console.error("❌ Error en mutación actualizar estado:", message, error);
      toast({
        title: "Error al actualizar estado",
        description: message,
        variant: "destructive",
      });
    },
  });

  return {
    crearSolicitudMutation,
    actualizarEstadoMutation,
    obtenerSolicitudes,
  };
};

export const useSolicitudesEstablecimientosQuery = (filtros: { estado?: string; fecha_desde?: string; fecha_hasta?: string } = {}) => {
  const { obtenerSolicitudes } = useSolicitudesEstablecimientos();

  return useQuery({
    queryKey: ["solicitudes-establecimientos", filtros],
    queryFn: () => obtenerSolicitudes(filtros),
    refetchInterval: 10000,
    staleTime: 5000,
  });
};
