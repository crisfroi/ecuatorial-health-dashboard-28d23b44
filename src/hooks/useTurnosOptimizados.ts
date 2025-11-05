import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TurnoMaestro {
  id: string;
  nombre_turno: string;
  hora_inicio: string;  // "08:00:00"
  hora_fin: string;     // "16:00:00"
  tolerancia_entrada_min: number;
  tolerancia_salida_min: number;
  tipo: 'diurno' | 'nocturno' | 'festivo';
  centro_salud_id: string | null;
  dispositivo_id: string | null;
  sync_a_dispositivo: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface HorarioBaseProfesional {
  id: string;
  profesional_id: string;
  turno_id: string;
  dia_semana: number;  // 1=Lunes, 7=Domingo
  vigencia_desde: string;
  vigencia_hasta: string | null;
  centro_salud_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface HorarioProfesionalConTurno extends HorarioBaseProfesional {
  turno?: TurnoMaestro;
}

/**
 * Hook para gestión optimizada de turnos biométricos
 * Mantiene relación con horarios_base_profesional (semanal, sin cuadrantes diarios)
 */
export function useTurnosOptimizados(centroId?: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ============================================
  // QUERIES
  // ============================================

  /**
   * Query: Obtener todos los turnos maestros
   */
  const turnosQuery = useQuery<TurnoMaestro[], Error>({
    queryKey: ['turnos-maestros', centroId],
    queryFn: async () => {
      let qb = supabase
        .from('turnos_maestros')
        .select('*')
        .eq('activo', true)
        .order('nombre_turno', { ascending: true });

      if (centroId) {
        qb = qb.eq('centro_salud_id', centroId);
      }

      const { data, error } = await qb;
      if (error) throw error;
      return (data || []) as TurnoMaestro[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  /**
   * Query: Obtener horarios de un profesional específico
   */
  const obtenerHorariosProfesional = async (profesionalId: string) => {
    const { data, error } = await supabase
      .from('horarios_base_profesional')
      .select(`
        *,
        turno:turno_id(*)
      `)
      .eq('profesional_id', profesionalId)
      .order('dia_semana', { ascending: true });

    if (error) throw error;
    return (data || []) as HorarioProfesionalConTurno[];
  };

  const horariosQuery = (profesionalId?: string) =>
    useQuery<HorarioProfesionalConTurno[], Error>({
      queryKey: ['horarios-profesional', profesionalId],
      queryFn: () => obtenerHorariosProfesional(profesionalId!),
      enabled: !!profesionalId,
      staleTime: 5 * 60 * 1000,
    });

  /**
   * Query: Obtener turno actual para un profesional en una fecha específica
   */
  const obtenerTurnoActual = async (profesionalId: string, fecha?: string) => {
    const fechaTarget = fecha || new Date().toISOString().split('T')[0];
    
    // Calcular día de la semana (1=lunes, 7=domingo)
    const date = new Date(fechaTarget + 'T00:00:00Z');
    const diaSemana = (date.getUTCDay() + 6) % 7 + 1;

    const { data, error } = await supabase
      .from('horarios_base_profesional')
      .select(`
        *,
        turno:turno_id(*)
      `)
      .eq('profesional_id', profesionalId)
      .eq('dia_semana', diaSemana)
      .gte('vigencia_desde', fechaTarget)
      .or(`vigencia_hasta.gte.${fechaTarget},vigencia_hasta.is.null`)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return (data || null) as HorarioProfesionalConTurno | null;
  };

  const turnoActualQuery = (profesionalId?: string, fecha?: string) =>
    useQuery<HorarioProfesionalConTurno | null, Error>({
      queryKey: ['turno-actual', profesionalId, fecha],
      queryFn: () => obtenerTurnoActual(profesionalId!, fecha),
      enabled: !!profesionalId,
      staleTime: 1 * 60 * 1000, // 1 minuto (más fresco para comparar asistencia)
    });

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Mutation: Crear nuevo turno maestro
   */
  const createTurnoMutation = useMutation<TurnoMaestro, Error, Partial<TurnoMaestro>>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('turnos_maestros')
        .insert({
          nombre_turno: payload.nombre_turno || '',
          hora_inicio: payload.hora_inicio || '08:00:00',
          hora_fin: payload.hora_fin || '16:00:00',
          tolerancia_entrada_min: payload.tolerancia_entrada_min ?? 5,
          tolerancia_salida_min: payload.tolerancia_salida_min ?? 5,
          tipo: payload.tipo || 'diurno',
          centro_salud_id: payload.centro_salud_id || null,
          dispositivo_id: payload.dispositivo_id || null,
          sync_a_dispositivo: payload.sync_a_dispositivo ?? true,
          activo: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TurnoMaestro;
    },
    onSuccess: (newTurno) => {
      queryClient.invalidateQueries({ queryKey: ['turnos-maestros'] });
      toast({
        title: 'Turno creado',
        description: `${newTurno.nombre_turno} ha sido creado exitosamente`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al crear turno',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  /**
   * Mutation: Actualizar turno maestro
   */
  const updateTurnoMutation = useMutation<
    TurnoMaestro,
    Error,
    { id: string; patch: Partial<TurnoMaestro> }
  >({
    mutationFn: async ({ id, patch }) => {
      const { data, error } = await supabase
        .from('turnos_maestros')
        .update({
          nombre_turno: patch.nombre_turno,
          hora_inicio: patch.hora_inicio,
          hora_fin: patch.hora_fin,
          tolerancia_entrada_min: patch.tolerancia_entrada_min,
          tolerancia_salida_min: patch.tolerancia_salida_min,
          tipo: patch.tipo,
          sync_a_dispositivo: patch.sync_a_dispositivo,
          activo: patch.activo,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TurnoMaestro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos-maestros'] });
      toast({ title: 'Turno actualizado correctamente' });
    },
    onError: (error) => {
      toast({
        title: 'Error al actualizar turno',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  /**
   * Mutation: Eliminar turno maestro (soft delete - marcar como inactivo)
   */
  const deleteTurnoMutation = useMutation<void, Error, string>({
    mutationFn: async (turnoId) => {
      const { error } = await supabase
        .from('turnos_maestros')
        .update({ activo: false })
        .eq('id', turnoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos-maestros'] });
      toast({ title: 'Turno eliminado' });
    },
    onError: (error) => {
      toast({
        title: 'Error al eliminar turno',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  /**
   * Mutation: Asignar turno a profesional para un día de la semana
   */
  const asignarTurnoMutation = useMutation<
    HorarioBaseProfesional,
    Error,
    {
      profesional_id: string;
      turno_id: string;
      dia_semana: number;
      vigencia_desde?: string;
      vigencia_hasta?: string | null;
    }
  >({
    mutationFn: async (payload) => {
      const vigenciaDesde = payload.vigencia_desde || new Date().toISOString().split('T')[0];

      // Intentar UPSERT: si existe (profesional + dia_semana + vigencia), actualizar; si no, insertar
      const { data, error } = await supabase
        .from('horarios_base_profesional')
        .upsert(
          {
            profesional_id: payload.profesional_id,
            turno_id: payload.turno_id,
            dia_semana: payload.dia_semana,
            vigencia_desde: vigenciaDesde,
            vigencia_hasta: payload.vigencia_hasta || null,
          },
          {
            onConflict: 'profesional_id,dia_semana,vigencia_desde',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data as HorarioBaseProfesional;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios-profesional'] });
      queryClient.invalidateQueries({ queryKey: ['turno-actual'] });
      toast({ title: 'Turno asignado correctamente' });
    },
    onError: (error) => {
      toast({
        title: 'Error al asignar turno',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  /**
   * Mutation: Eliminar asignación de turno a profesional
   */
  const eliminarHorarioMutation = useMutation<void, Error, string>({
    mutationFn: async (horarioId) => {
      const { error } = await supabase
        .from('horarios_base_profesional')
        .delete()
        .eq('id', horarioId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios-profesional'] });
      queryClient.invalidateQueries({ queryKey: ['turno-actual'] });
      toast({ title: 'Asignación eliminada' });
    },
    onError: (error) => {
      toast({
        title: 'Error al eliminar asignación',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Validar si un turno cumple con los horarios dentro de tolerancia
   */
  const validarAsistenciaTurno = (turno: TurnoMaestro | null, entrada?: string, salida?: string): {
    puntual: boolean;
    temprano: boolean;
    tarde: boolean;
    mensaje: string;
  } => {
    if (!turno) {
      return { puntual: false, temprano: false, tarde: false, mensaje: 'Sin turno asignado' };
    }

    const [hI, minI] = turno.hora_inicio.split(':').map(Number);
    const [hF, minF] = turno.hora_fin.split(':').map(Number);
    const horaInicio = hI * 60 + minI;
    const horaFin = hF * 60 + minF;

    let puntual = true;
    let temprano = false;
    let tarde = false;
    let mensaje = 'Puntual';

    if (entrada) {
      const [hE, minE] = entrada.split(':').map(Number);
      const horaEntrada = hE * 60 + minE;
      const margenEntrada = horaInicio - turno.tolerancia_entrada_min * 60;

      if (horaEntrada < margenEntrada) {
        temprano = true;
        puntual = false;
      } else if (horaEntrada > horaInicio + turno.tolerancia_entrada_min * 60) {
        tarde = true;
        puntual = false;
      }
    }

    if (!puntual) {
      mensaje = `${temprano ? 'Muy temprano' : 'Retrasado'} (${Math.abs(Number(entrada?.split(':')[0] || 0) - (hI))} hrs)`;
    }

    return { puntual, temprano, tarde, mensaje };
  };

  /**
   * Obtener nombre del día en español
   */
  const getNombreDia = (diaSemana: number): string => {
    const nombres = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return nombres[diaSemana] || '';
  };

  return {
    // Queries
    turnosQuery,
    horariosQuery,
    turnoActualQuery,
    obtenerHorariosProfesional,
    obtenerTurnoActual,

    // Mutations
    createTurnoMutation,
    updateTurnoMutation,
    deleteTurnoMutation,
    asignarTurnoMutation,
    eliminarHorarioMutation,

    // Utilities
    validarAsistenciaTurno,
    getNombreDia,
  };
}
