import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';

export interface EpisodioUrgencia {
  id: string;
  paciente_id: string;
  fecha_entrada: string;
  lugar_entrada?: string;
  procedencia?: string;
  box_asignado?: string;
  nivel_triage?: number;
  clasificacion_inicial?: string;
  observaciones_triage?: string;
  medico_responsable_id?: string;
  diagnostico_inicial?: string;
  diagnostico_final?: string;
  fecha_salida?: string;
  tipo_salida?: string;
  destino_salida?: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface TriageData {
  nivel_urgencia: number;
  motivo_consulta?: string;
  signos_vitales?: {
    temperatura?: number;
    presion_arterial?: string;
    frecuencia_cardiaca?: number;
    frecuencia_respiratoria?: number;
    saturacion_oxigeno?: number;
  };
  sintomas?: string[];
  observaciones?: string;
}

export const useHosixUrgencias = () => {
  const queryClient = useQueryClient();

  // Obtener episodios de urgencia activos
  const { data: episodios = [], isLoading: isLoadingEpisodios } = useQuery({
    queryKey: ['urgencias-episodios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_urgencias_episodios')
        .select(`
          *,
          paciente:hosix_pacientes(id, ppi, primer_nombre, primer_apellido, fecha_nacimiento),
          medico:profesionales_sanitarios(id, nombre_completo)
        `)
        .eq('estado', 'en_proceso')
        .order('fecha_entrada', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Registrar entrada a urgencias
  const registrarEntradaMutation = useMutation({
    mutationFn: async ({
      paciente_id,
      lugar_entrada,
      procedencia,
      box_asignado,
      observaciones_iniciales,
    }: {
      paciente_id: string;
      lugar_entrada?: string;
      procedencia?: string;
      box_asignado?: string;
      observaciones_iniciales?: string;
    }) => {
      const { data, error } = await supabase
        .from('hosix_urgencias_episodios')
        .insert([
          {
            paciente_id,
            fecha_entrada: new Date().toISOString(),
            lugar_entrada,
            procedencia,
            box_asignado,
            estado: 'en_proceso',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Registrar en historia clínica
      await supabase
        .from('hosix_historia_clinica')
        .insert([
          {
            paciente_id,
            tipo_entrada: 'urgencia',
            episodio_id: data.id,
            fecha_entrada: new Date().toISOString(),
            titulo: 'Entrada a Urgencias',
            contenido: observaciones_iniciales || '',
          },
        ]);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urgencias-episodios'] });
    },
  });

  // Registrar triage
  const registrarTriageMutation = useMutation({
    mutationFn: async ({
      episodio_id,
      triageData,
    }: {
      episodio_id: string;
      triageData: TriageData;
    }) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('hosix_urgencias_triage')
        .insert([
          {
            episodio_id,
            fecha_evaluacion: new Date().toISOString(),
            evaluador_id: userData?.user?.id,
            nivel_urgencia: triageData.nivel_urgencia,
            motivo_consulta: triageData.motivo_consulta,
            signos_vitales: triageData.signos_vitales || {},
            sintomas: triageData.sintomas || [],
            observaciones: triageData.observaciones,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Actualizar clasificación inicial en episodio
      const nivelDescripcion = getNivelTriageDescripcion(triageData.nivel_urgencia);
      await supabase
        .from('hosix_urgencias_episodios')
        .update({
          nivel_triage: triageData.nivel_urgencia,
          clasificacion_inicial: nivelDescripcion,
          observaciones_triage: triageData.observaciones,
        })
        .eq('id', episodio_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urgencias-episodios'] });
    },
  });

  // Registrar diagnóstico y atención
  const registrarAtencionMutation = useMutation({
    mutationFn: async ({
      episodio_id,
      diagnostico_inicial,
      diagnostico_final,
      medico_responsable_id,
      observaciones,
    }: {
      episodio_id: string;
      diagnostico_inicial?: string;
      diagnostico_final?: string;
      medico_responsable_id?: string;
      observaciones?: string;
    }) => {
      const { error } = await supabase
        .from('hosix_urgencias_episodios')
        .update({
          diagnostico_inicial,
          diagnostico_final,
          medico_responsable_id,
        })
        .eq('id', episodio_id);

      if (error) throw error;

      // Registrar en historia clínica
      const episodio = await supabase
        .from('hosix_urgencias_episodios')
        .select('paciente_id')
        .eq('id', episodio_id)
        .single();

      if (episodio.data) {
        await supabase
          .from('hosix_historia_clinica')
          .insert([
            {
              paciente_id: episodio.data.paciente_id,
              tipo_entrada: 'urgencia',
              episodio_id,
              fecha_entrada: new Date().toISOString(),
              titulo: 'Diagnóstico y Atención en Urgencias',
              contenido: `Inicial: ${diagnostico_inicial}\n\nFinal: ${diagnostico_final}\n\nObservaciones: ${observaciones}`,
            },
          ]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urgencias-episodios'] });
    },
  });

  // Cerrar episodio de urgencia (alta, ingreso, traslado)
  const cerrarEpisodioMutation = useMutation({
    mutationFn: async ({
      episodio_id,
      tipo_salida,
      destino_salida,
      diagnostico_final,
    }: {
      episodio_id: string;
      tipo_salida: string;
      destino_salida?: string;
      diagnostico_final?: string;
    }) => {
      const { error } = await supabase
        .from('hosix_urgencias_episodios')
        .update({
          estado: 'cerrado',
          fecha_salida: new Date().toISOString(),
          tipo_salida,
          destino_salida,
          diagnostico_final: diagnostico_final || undefined,
        })
        .eq('id', episodio_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urgencias-episodios'] });
    },
  });

  // Obtener detalles de un episodio
  const obtenerEpisodio = async (id: string) => {
    const { data, error } = await supabase
      .from('hosix_urgencias_episodios')
      .select(`
        *,
        paciente:hosix_pacientes(*),
        triage:hosix_urgencias_triage(*),
        medico:profesionales_sanitarios(id, nombre_completo)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  };

  return {
    // Estado
    episodios,
    isLoadingEpisodios,

    // Funciones
    obtenerEpisodio,

    // Mutaciones
    registrarEntrada: registrarEntradaMutation.mutate,
    isRegistrandoEntrada: registrarEntradaMutation.isPending,
    registrarTriage: registrarTriageMutation.mutate,
    isRegistrandoTriage: registrarTriageMutation.isPending,
    registrarAtencion: registrarAtencionMutation.mutate,
    isRegistrandoAtencion: registrarAtencionMutation.isPending,
    cerrarEpisodio: cerrarEpisodioMutation.mutate,
    isCerrandoEpisodio: cerrarEpisodioMutation.isPending,

    // Errores
    errorEntrada: registrarEntradaMutation.error?.message,
    errorTriage: registrarTriageMutation.error?.message,
    errorAtencion: registrarAtencionMutation.error?.message,
    errorCierre: cerrarEpisodioMutation.error?.message,
  };
};

export function getNivelTriageDescripcion(nivel: number): string {
  const descripciones: Record<number, string> = {
    1: 'Emergencia - Riesgo de Vida',
    2: 'Urgencia - Muy Grave',
    3: 'Urgencia - Grave',
    4: 'Menos Urgente',
    5: 'No Urgente',
  };
  return descripciones[nivel] || 'Nivel Desconocido';
}

export function getNivelTriageColor(nivel: number): string {
  const colores: Record<number, string> = {
    1: 'bg-red-600',
    2: 'bg-orange-600',
    3: 'bg-yellow-600',
    4: 'bg-blue-600',
    5: 'bg-green-600',
  };
  return colores[nivel] || 'bg-gray-600';
}
