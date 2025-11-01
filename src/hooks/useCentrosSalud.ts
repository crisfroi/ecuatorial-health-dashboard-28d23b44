import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/utils/errorHandler";

interface BuscarCentrosParams {
  nombreParcial?: string;
  categoria?: string;
  distritoSanitario?: string;
  provincia?: string;
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
  subcategoria?: string | null;
}

export const useCentrosSalud = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const buscarCentros = async (params: BuscarCentrosParams) => {
    console.log("🔍 Buscando centros con parámetros:", params);
    
    // Get all centers with basic filters (select only required columns)
    let query = supabase
      .from("centros_salud")
      .select("id, nombre, categoria, sector, distrito_sanitario, provincia, distrito, director, telefono");

    if (params.nombreParcial) {
      query = query.ilike("nombre", `%${params.nombreParcial}%`);
    }
    if (params.categoria) {
      query = query.eq("categoria", params.categoria);
    }
    if (params.distritoSanitario) {
      query = query.eq("distrito_sanitario", params.distritoSanitario);
    }
    if (params.provincia) {
      query = query.eq("provincia", params.provincia);
    }

    const { data: centros, error } = await query.order("nombre");
    if (error) {
      console.error("❌ Error al buscar centros:", error);
      throw error;
    }

    console.log(`📋 Encontrados ${centros?.length || 0} centros`);

    // Batch compute professional counts per center in 2 queries (by id and by name)
    const centerIds = (centros || []).map((c: any) => c.id).filter(Boolean);
    const centerNames = (centros || []).map((c: any) => c.nombre).filter(Boolean);

    const [byIdRes, byNameRes] = await Promise.all([
      centerIds.length
        ? supabase
            .from("profesionales_sanitarios")
            .select("id, centro_salud_id")
            .in("centro_salud_id", centerIds)
        : Promise.resolve({ data: [] as any[] }),
      centerNames.length
        ? supabase
            .from("profesionales_sanitarios")
            .select("id, nombre_centro")
            .in("nombre_centro", centerNames)
        : Promise.resolve({ data: [] as any[] })
    ]);

    const countsById = new Map<string, number>();
    (byIdRes.data || []).forEach((p: any) => {
      if (p.centro_salud_id) countsById.set(p.centro_salud_id, (countsById.get(p.centro_salud_id) || 0) + 1);
    });

    const nameToId = new Map<string, string>();
    (centros || []).forEach((c: any) => nameToId.set(c.nombre, c.id));

    const countsByName = new Map<string, number>();
    (byNameRes.data || []).forEach((p: any) => {
      const cid = nameToId.get(p.nombre_centro);
      if (cid) countsByName.set(cid, (countsByName.get(cid) || 0) + 1);
    });

    const centrosConConteo = (centros || []).map((centro: any) => {
      const total = Math.max(countsById.get(centro.id) || 0, countsByName.get(centro.id) || 0);
      return { ...centro, total_profesionales: total };
    });

    console.log("✅ Centros con conteo completado (batched)");
    return centrosConConteo;
  };

  const crearCentro = async (params: CrearCentroParams) => {
    console.log("🏗️ Creando nuevo centro:", params.nombre);
    
    const { data, error } = await supabase
      .from("centros_salud")
      .insert([{
        ...(params as any),
        estado: (params as any)?.estado ?? "pendiente_validacion",
      }])
      .select()
      .single();

    if (error) {
      console.error("❌ Error al crear centro:", error);
      throw error;
    }
    
    console.log("✅ Centro creado exitosamente:", data.id);
    return data;
  };

  const actualizarCentro = async (
    id: string,
    params: Partial<CrearCentroParams>,
  ) => {
    console.log("✏️ Actualizando centro:", id);
    
    const { data, error } = await supabase
      .from("centros_salud")
      .update(params as any)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Error al actualizar centro:", error);
      throw error;
    }
    
    console.log("✅ Centro actualizado exitosamente");
    return data;
  };

  const eliminarCentro = async (id: string) => {
    console.log("🗑️ Eliminando centro:", id);
    const { error } = await supabase.from("centros_salud").delete().eq("id", id);
    if (error) {
      console.error("❌ Error al eliminar centro:", error);
      throw error;
    }
    queryClient.invalidateQueries({ queryKey: ["centros"] });
  };

  const obtenerProfesionalesPorCentro = async (
    centroId: string,
    areaProfesional?: string,
    estadoSolicitud?: string,
  ) => {
    if (!centroId) {
      console.warn("⚠️ obtenerProfesionalesPorCentro llamado sin centroId válido");
      return [] as any[];
    }

    console.log("👥 Obteniendo profesionales para centro:", centroId);

    // First get the center information
    const { data: centro, error: centerError } = await supabase
      .from("centros_salud")
      .select("id, nombre, distrito_sanitario")
      .eq("id", centroId)
      .maybeSingle();

    if (centerError || !centro) {
      const message = getErrorMessage(centerError || { message: "Centro no encontrado" });
      console.error("❌ Error al obtener centro:", message, centerError);
      return [] as any[];
    }

    console.log("🏥 Centro encontrado:", centro.nombre);

    // Query professionals using multiple strategies and combine results
    const queries = [];

    // Strategy 1: By centro_salud_id
    let query1 = supabase
      .from("profesionales_sanitarios")
      .select("*")
      .eq("centro_salud_id", centroId);

    // Strategy 2: By nombre_centro
    let query2 = supabase
      .from("profesionales_sanitarios")
      .select("*")
      .eq("nombre_centro", centro.nombre);

    // Strategy 3: By nombre_centro (workplace)
    let query3 = supabase
      .from("profesionales_sanitarios")
      .select("*")
      .eq("nombre_centro", centro.nombre);

    // Apply additional filters to all queries
    if (areaProfesional && areaProfesional !== "todos") {
      query1 = query1.eq("area_profesional", areaProfesional);
      query2 = query2.eq("area_profesional", areaProfesional);
      query3 = query3.eq("area_profesional", areaProfesional);
    }

    if (estadoSolicitud && estadoSolicitud !== "todos") {
      query1 = query1.eq("estado_solicitud", estadoSolicitud);
      query2 = query2.eq("estado_solicitud", estadoSolicitud);
      query3 = query3.eq("estado_solicitud", estadoSolicitud);
    }

    // Execute main queries
    const [result1, result2, result3] = await Promise.all([
      query1,
      query2,
      query3
    ]);

    // Strategy 4: From profesional_centro_asignado mapping by center name
    const { data: asignaciones, error: asignError } = await supabase
      .from("profesional_centro_asignado")
      .select("id_profesional")
      .eq("nombre_centro", centro.nombre);

    let result4: { data: any[] | null } = { data: [] };
    if (!asignError && asignaciones && asignaciones.length > 0) {
      const ids = asignaciones
        .map((a: any) => a.id_profesional)
        .filter((id: any) => !!id);
      if (ids.length > 0) {
        const { data } = await supabase
          .from("profesionales_sanitarios")
          .select("*")
          .in("id", ids);
        result4.data = data || [];
      }
    }

    // Combine results and remove duplicates
    const allProfessionals: any[] = [];
    const seenIds = new Set<string>();

    [result1.data, result2.data, result3.data, result4.data].forEach((data) => {
      if (data) {
        data.forEach((prof: any) => {
          if (!seenIds.has(prof.id)) {
            seenIds.add(prof.id);
            allProfessionals.push(prof);
          }
        });
      }
    });

    console.log(`👥 Encontrados ${allProfessionals.length} profesionales únicos para el centro`);
    return allProfessionals;
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
      console.error("❌ Error en mutación crear centro:", error);
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
      console.error("❌ Error en mutación actualizar centro:", error);
      toast({
        title: "Error al actualizar centro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const eliminarCentroMutation = useMutation({
    mutationFn: eliminarCentro,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centros"] });
      toast({ title: "Centro eliminado", description: "El centro fue eliminado correctamente." });
    },
    onError: (error: any) => {
      console.error("❌ Error en eliminar centro:", error);
      toast({ title: "Error al eliminar centro", description: error.message, variant: "destructive" });
    }
  });

  return {
    buscarCentros,
    crearCentroMutation,
    actualizarCentroMutation,
    eliminarCentroMutation,
    obtenerProfesionalesPorCentro,
  };
};

export const useBuscarCentros = (params: BuscarCentrosParams) => {
  const { buscarCentros } = useCentrosSalud();

  return useQuery({
    queryKey: ["centros", params],
    queryFn: () => buscarCentros(params),
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
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
    refetchInterval: 10000, // Refrescar cada 10 segundos para datos en tiempo real
    staleTime: 5000, // Considerar datos obsoletos después de 5 segundos
  });
};
