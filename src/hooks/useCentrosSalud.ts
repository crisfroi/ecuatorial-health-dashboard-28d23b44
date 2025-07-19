import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BuscarCentrosParams {
  nombreParcial?: string;
  categoria?: string;
  distritoSanitario?: string;
}

interface CrearCentroParams {
  nombre: string;
  categoria: string;
  distrito_sanitario?: string;
  sector: string;
  provincia: string;
  distrito: string;
  director?: string;
  telefono?: string;
}

export const useCentrosSalud = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const buscarCentros = async (params: BuscarCentrosParams) => {
    const { data, error } = await supabase.rpc("buscar_centros_por_criterios", {
      p_nombre_parcial: params.nombreParcial || null,
      p_categoria: params.categoria || null,
      p_distrito_sanitario: params.distritoSanitario || null,
    });

    if (error) throw error;
    return data || [];
  };

  const crearCentro = async (params: CrearCentroParams) => {
    const { data, error } = await supabase
      .from("centros_salud")
      .insert([params])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const actualizarCentro = async (
    id: string,
    params: Partial<CrearCentroParams>,
  ) => {
    const { data, error } = await supabase
      .from("centros_salud")
      .update(params)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const obtenerProfesionalesPorCentro = async (
    centroId: string,
    areaProfesional?: string,
    estadoSolicitud?: string,
  ) => {
    // First get the center name
    const { data: centro, error: centerError } = await supabase
      .from("centros_salud")
      .select("nombre")
      .eq("id", centroId)
      .single();

    if (centerError) throw centerError;

    // Then query professionals using both nombre_centro and lugar_trabajo
    let query = supabase
      .from("profesionales_sanitarios")
      .select("*")
      .or(
        `nombre_centro.eq.${centro.nombre},lugar_trabajo.eq.${centro.nombre}`,
      );

    if (areaProfesional) {
      query = query.eq("area_profesional", areaProfesional);
    }

    if (estadoSolicitud) {
      query = query.eq("estado_solicitud", estadoSolicitud);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  };

  const crearCentroMutation = useMutation({
    mutationFn: crearCentro,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centros"] });
      toast({
        title: "Centro creado",
        description: "El centro de salud ha sido creado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear centro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const actualizarCentroMutation = useMutation({
    mutationFn: ({
      id,
      ...params
    }: { id: string } & Partial<CrearCentroParams>) =>
      actualizarCentro(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centros"] });
      toast({
        title: "Centro actualizado",
        description: "El centro de salud ha sido actualizado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar centro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    buscarCentros,
    crearCentroMutation,
    actualizarCentroMutation,
    obtenerProfesionalesPorCentro,
  };
};

export const useBuscarCentros = (params: BuscarCentrosParams) => {
  const { buscarCentros } = useCentrosSalud();

  return useQuery({
    queryKey: ["centros", params],
    queryFn: () => buscarCentros(params),
    enabled: true,
  });
};

export const useProfesionalesPorCentro = (
  centroId: string,
  areaProfesional?: string,
  estadoSolicitud?: string,
) => {
  const { obtenerProfesionalesPorCentro } = useCentrosSalud();

  return useQuery({
    queryKey: [
      "profesionales-centro",
      centroId,
      areaProfesional,
      estadoSolicitud,
    ],
    queryFn: () =>
      obtenerProfesionalesPorCentro(centroId, areaProfesional, estadoSolicitud),
    enabled: !!centroId,
  });
};
