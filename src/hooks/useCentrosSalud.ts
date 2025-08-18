
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
    console.log("🔍 Buscando centros con parámetros:", params);
    
    // Get all centers with basic filters
    let query = supabase.from("centros_salud").select("*");

    if (params.nombreParcial) {
      query = query.ilike("nombre", `%${params.nombreParcial}%`);
    }
    if (params.categoria) {
      query = query.eq("categoria", params.categoria);
    }
    if (params.distritoSanitario) {
      query = query.eq("distrito_sanitario", params.distritoSanitario);
    }

    const { data: centros, error } = await query.order("nombre");
    if (error) {
      console.error("❌ Error al buscar centros:", error);
      throw error;
    }

    console.log(`📋 Encontrados ${centros?.length || 0} centros`);

    // For each center, count professionals using multiple matching strategies
    const centrosConConteo = await Promise.all(
      (centros || []).map(async (centro) => {
        console.log(`🔢 Contando profesionales para centro: ${centro.nombre}`);
        
        // Strategy 1: Match by centro_salud_id
        const { count: countById } = await supabase
          .from("profesionales_sanitarios")
          .select("*", { count: "exact", head: true })
          .eq("centro_salud_id", centro.id);

        // Strategy 2: Match by nombre_centro
        const { count: countByName } = await supabase
          .from("profesionales_sanitarios")
          .select("*", { count: "exact", head: true })
          .eq("nombre_centro", centro.nombre);

        // Strategy 3: Match by lugar_trabajo
        const { count: countByLugarTrabajo } = await supabase
          .from("profesionales_sanitarios")
          .select("*", { count: "exact", head: true })
          .eq("lugar_trabajo", centro.nombre);

        // Use the maximum count from all strategies
        const totalProfesionales = Math.max(countById || 0, countByName || 0, countByLugarTrabajo || 0);

        console.log(`📊 Centro ${centro.nombre}: ${totalProfesionales} profesionales (ID: ${countById}, Nombre: ${countByName}, Lugar: ${countByLugarTrabajo})`);

        return {
          ...centro,
          total_profesionales: totalProfesionales,
        };
      }),
    );

    console.log("✅ Centros con conteo completado");
    return centrosConConteo;
  };

  const crearCentro = async (params: CrearCentroParams) => {
    console.log("🏗️ Creando nuevo centro:", params.nombre);
    
    const { data, error } = await supabase
      .from("centros_salud")
      .insert([params])
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
      .update(params)
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

  const obtenerProfesionalesPorCentro = async (
    centroId: string,
    areaProfesional?: string,
    estadoSolicitud?: string,
  ) => {
    console.log("👥 Obteniendo profesionales para centro:", centroId);
    
    // First get the center information
    const { data: centro, error: centerError } = await supabase
      .from("centros_salud")
      .select("nombre, distrito_sanitario")
      .eq("id", centroId)
      .single();

    if (centerError) {
      console.error("❌ Error al obtener centro:", centerError);
      throw centerError;
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

    // Strategy 3: By lugar_trabajo
    let query3 = supabase
      .from("profesionales_sanitarios")
      .select("*")
      .eq("lugar_trabajo", centro.nombre);

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

    // Execute all queries
    const [result1, result2, result3] = await Promise.all([
      query1,
      query2,
      query3
    ]);

    // Combine results and remove duplicates
    const allProfessionals = [];
    const seenIds = new Set();

    [result1.data, result2.data, result3.data].forEach(data => {
      if (data) {
        data.forEach(prof => {
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
    refetchInterval: 10000, // Refrescar cada 10 segundos para datos en tiempo real
    staleTime: 5000, // Considerar datos obsoletos después de 5 segundos
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
