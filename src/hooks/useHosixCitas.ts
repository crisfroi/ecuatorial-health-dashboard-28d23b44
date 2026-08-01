import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';
import { useToast } from '@/components/ui/use-toast';

export interface Agenda {
  id: string;
  codigo: string;
  nombre: string;
  servicio_id: string;
  profesional_id: string;
  sala: string;
  tipo_agenda: 'consulta' | 'procedimiento' | 'teleconsulta';
  duracion_default_minutos: number;
  capacidad_maxima_dia: number;
  permite_teleconsulta: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cita {
  id: string;
  agenda_id: string;
  paciente_id: string;
  fecha_hora: string;
  duracion_minutos: number;
  actividad_id?: string;
  motivo: string;
  estado: 'programada' | 'confirmada' | 'en_proceso' | 'completada' | 'cancelada' | 'no_asistio';
  motivo_cancelacion?: string;
  es_teleconsulta: boolean;
  url_teleconsulta?: string;
  created_at: string;
  updated_at: string;
}

export interface Horario {
  id: string;
  agenda_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

export interface ListaEspera {
  id: string;
  paciente_id: string;
  tipo_solicitud: 'hospitalizacion' | 'consulta_ambulatoria' | 'examen_diagnostico' | 'cirugia_con_hospitalizacion' | 'cirugia_mayor_ambulatoria' | 'cirugia_menor_ambulatoria';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  fecha_solicitud: string;
  motivo: string;
  estado: 'activa' | 'asignada' | 'completada' | 'cancelada';
  fecha_asignacion?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export const useHosixCitas = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ============================================
  // AGENDAS
  // ============================================

  const agendas = useQuery({
    queryKey: ['hosix_agendas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_agendas')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      
      if (error) throw new Error(error.message);
      return data as Agenda[];
    },
  });

  const createAgenda = useMutation({
    mutationFn: async (agenda: Omit<Agenda, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hosix_agendas')
        .insert([agenda])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_agendas'] });
      toast({ title: 'Éxito', description: 'Agenda creada correctamente' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    },
  });

  const updateAgenda = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Agenda>) => {
      const { data, error } = await supabase
        .from('hosix_agendas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_agendas'] });
      toast({ title: 'Éxito', description: 'Agenda actualizada correctamente' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    },
  });

  // ============================================
  // HORARIOS
  // ============================================

  const horarios = useQuery({
    queryKey: ['hosix_agendas_horarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_agendas_horarios')
        .select('*')
        .eq('activo', true)
        .order('dia_semana, hora_inicio');

      if (error) throw new Error(error.message);
      return data as Horario[];
    },
  });

  const createHorario = useMutation({
    mutationFn: async (horario: Omit<Horario, 'id'>) => {
      const { data, error } = await supabase
        .from('hosix_agendas_horarios')
        .insert([horario])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_agendas_horarios'] });
      toast({ title: 'Éxito', description: 'Horario creado correctamente' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    },
  });

  // ============================================
  // CITAS
  // ============================================

  const citas = useQuery({
    queryKey: ['hosix_citas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_citas')
        .select('*')
        .order('fecha_hora', { ascending: true });

      if (error) throw new Error(error.message);
      return data as Cita[];
    },
  });

  const citasPorPaciente = (pacienteId: string) => 
    useQuery({
      queryKey: ['hosix_citas', 'paciente', pacienteId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('hosix_citas')
          .select('*')
          .eq('paciente_id', pacienteId)
          .order('fecha_hora', { ascending: false });

        if (error) throw new Error(error.message);
        return data as Cita[];
      },
    });

  const citasPorAgenda = (agendaId: string) =>
    useQuery({
      queryKey: ['hosix_citas', 'agenda', agendaId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('hosix_citas')
          .select('*')
          .eq('agenda_id', agendaId)
          .order('fecha_hora', { ascending: true });

        if (error) throw new Error(error.message);
        return data as Cita[];
      },
    });

  const createCita = useMutation({
    mutationFn: async (cita: Omit<Cita, 'id' | 'created_at' | 'updated_at'>) => {
      // Validar que no haya conflicto de horario
      const { data: conflictingCitas, error: checkError } = await supabase
        .from('hosix_citas')
        .select('*')
        .eq('agenda_id', cita.agenda_id)
        .eq('estado', 'programada')
        .lte('fecha_hora', cita.fecha_hora)
        .gte('fecha_hora', new Date(new Date(cita.fecha_hora).getTime() - cita.duracion_minutos * 60000).toISOString());

      if (checkError) throw new Error(checkError.message);
      if (conflictingCitas && conflictingCitas.length > 0) {
        throw new Error('Ya existe una cita programada en este horario');
      }

      const { data, error } = await supabase
        .from('hosix_citas')
        .insert([cita])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_citas'] });
      toast({ title: 'Éxito', description: 'Cita programada correctamente' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    },
  });

  const updateCita = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Cita>) => {
      const { data, error } = await supabase
        .from('hosix_citas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_citas'] });
      toast({ title: 'Éxito', description: 'Cita actualizada correctamente' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    },
  });

  const cancelarCita = useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('hosix_citas')
        .update({
          estado: 'cancelada',
          motivo_cancelacion: motivo,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_citas'] });
      toast({ title: 'Éxito', description: 'Cita cancelada correctamente' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    },
  });

  const confirmarCita = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('hosix_citas')
        .update({ estado: 'confirmada' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_citas'] });
      toast({ title: 'Éxito', description: 'Cita confirmada correctamente' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    },
  });

  // ============================================
  // LISTA DE ESPERA
  // ============================================

  const listaEspera = useQuery({
    queryKey: ['hosix_lista_espera'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_lista_espera')
        .select('*')
        .eq('estado', 'activa')
        .order('fecha_solicitud', { ascending: true });

      if (error) throw new Error(error.message);
      return data as ListaEspera[];
    },
  });

  const createListaEspera = useMutation({
    mutationFn: async (solicitud: Omit<ListaEspera, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hosix_lista_espera')
        .insert([solicitud])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_lista_espera'] });
      toast({ title: 'Éxito', description: 'Solicitud agregada a lista de espera' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    },
  });

  const asignarDesdeListaEspera = useMutation({
    mutationFn: async ({ listaSolicitudId, citaData }: { listaSolicitudId: string; citaData: Omit<Cita, 'id' | 'created_at' | 'updated_at'> }) => {
      // Crear cita
      const { data: citaResult, error: citaError } = await supabase
        .from('hosix_citas')
        .insert([citaData])
        .select()
        .single();

      if (citaError) throw new Error(citaError.message);

      // Actualizar lista de espera
      const { error: updateError } = await supabase
        .from('hosix_lista_espera')
        .update({
          estado: 'asignada',
          fecha_asignacion: new Date().toISOString(),
        })
        .eq('id', listaSolicitudId);

      if (updateError) throw new Error(updateError.message);

      return citaResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_lista_espera', 'hosix_citas'] });
      toast({ title: 'Éxito', description: 'Cita asignada desde lista de espera' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    },
  });

  return {
    // Agendas
    agendas,
    createAgenda: createAgenda.mutateAsync,
    updateAgenda: updateAgenda.mutateAsync,
    isCreatingAgenda: createAgenda.isPending,
    isUpdatingAgenda: updateAgenda.isPending,

    // Horarios
    horarios,
    createHorario: createHorario.mutateAsync,
    isCreatingHorario: createHorario.isPending,

    // Citas
    citas,
    citasPorPaciente,
    citasPorAgenda,
    createCita: createCita.mutateAsync,
    updateCita: updateCita.mutateAsync,
    cancelarCita: cancelarCita.mutateAsync,
    confirmarCita: confirmarCita.mutateAsync,
    isCreatingCita: createCita.isPending,
    isUpdatingCita: updateCita.isPending,

    // Lista de Espera
    listaEspera,
    createListaEspera: createListaEspera.mutateAsync,
    asignarDesdeListaEspera: asignarDesdeListaEspera.mutateAsync,
    isCreatingListaEspera: createListaEspera.isPending,
  };
};
