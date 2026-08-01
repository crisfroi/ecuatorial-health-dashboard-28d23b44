import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';
import { useToast } from '@/components/ui/use-toast';

export interface Cama {
  id: string;
  codigo: string;
  nombre: string;
  servicio_id: string;
  ubicacion: string;
  tipo_cama: string;
  estado: 'disponible' | 'ocupada' | 'mantenimiento' | 'reservada';
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Hospitalizacion {
  id: string;
  paciente_id: string;
  fecha_ingreso: string;
  origen_ingreso: 'urgencias' | 'programado' | 'traslado';
  diagnostico_ingreso: string;
  medico_responsable_id: string;
  servicio_id: string;
  cama_id: string;
  duracion_prevista_dias: number;
  fecha_alta?: string;
  tipo_alta?: 'domicilio' | 'traslado' | 'defuncion' | 'voluntaria';
  diagnostico_alta?: string;
  informe_alta?: string;
  estado: 'prehospitalizacion' | 'activo' | 'alta';
  created_at: string;
  updated_at: string;
}

export interface Traslado {
  id: string;
  hospitalizacion_id: string;
  cama_anterior_id: string;
  cama_nueva_id: string;
  servicio_anterior_id: string;
  servicio_nuevo_id: string;
  fecha_traslado: string;
  motivo: string;
  medico_responsable_id: string;
  created_at: string;
}

export const useHosixHospitalizacion = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ============================================
  // CAMAS
  // ============================================

  const camas = useQuery({
    queryKey: ['hosix_camas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_camas')
        .select('*')
        .eq('activo', true)
        .order('codigo');

      if (error) throw new Error(error.message);
      return data as Cama[];
    },
  });

  const camasDisponibles = useQuery({
    queryKey: ['hosix_camas', 'disponibles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_camas')
        .select('*')
        .eq('activo', true)
        .eq('estado', 'disponible')
        .order('codigo');

      if (error) throw new Error(error.message);
      return data as Cama[];
    },
  });

  const camasPorServicio = (servicioId: string) =>
    useQuery({
      queryKey: ['hosix_camas', 'servicio', servicioId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('hosix_camas')
          .select('*')
          .eq('servicio_id', servicioId)
          .eq('activo', true)
          .order('codigo');

        if (error) throw new Error(error.message);
        return data as Cama[];
      },
    });

  const updateEstadoCama = useMutation({
    mutationFn: async ({ camaId, estado }: { camaId: string; estado: Cama['estado'] }) => {
      const { data, error } = await supabase
        .from('hosix_camas')
        .update({ estado })
        .eq('id', camaId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_camas'] });
      toast({ title: 'Éxito', description: 'Estado de cama actualizado' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    },
  });

  // ============================================
  // HOSPITALIZACIONES
  // ============================================

  const hospitalizaciones = useQuery({
    queryKey: ['hosix_hospitalizacion_episodios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_hospitalizacion_episodios')
        .select('*')
        .order('fecha_ingreso', { ascending: false });

      if (error) throw new Error(error.message);
      return data as Hospitalizacion[];
    },
  });

  const hospitalizacionesActivas = useQuery({
    queryKey: ['hosix_hospitalizacion_episodios', 'activas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_hospitalizacion_episodios')
        .select('*')
        .eq('estado', 'activo')
        .order('fecha_ingreso', { ascending: false });

      if (error) throw new Error(error.message);
      return data as Hospitalizacion[];
    },
  });

  const hospitalizacionesPorPaciente = (pacienteId: string) =>
    useQuery({
      queryKey: ['hosix_hospitalizacion_episodios', 'paciente', pacienteId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('hosix_hospitalizacion_episodios')
          .select('*')
          .eq('paciente_id', pacienteId)
          .order('fecha_ingreso', { ascending: false });

        if (error) throw new Error(error.message);
        return data as Hospitalizacion[];
      },
    });

  const createHospitalizacion = useMutation({
    mutationFn: async (hospitalizacion: Omit<Hospitalizacion, 'id' | 'created_at' | 'updated_at'>) => {
      // Validar que la cama esté disponible
      const { data: cama, error: camaError } = await supabase
        .from('hosix_camas')
        .select('estado')
        .eq('id', hospitalizacion.cama_id)
        .single();

      if (camaError || cama?.estado !== 'disponible') {
        throw new Error('Cama no disponible');
      }

      // Crear hospitalización
      const { data, error } = await supabase
        .from('hosix_hospitalizacion_episodios')
        .insert([hospitalizacion])
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Marcar cama como ocupada
      await updateEstadoCama.mutateAsync({
        camaId: hospitalizacion.cama_id,
        estado: 'ocupada',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_hospitalizacion_episodios'] });
      toast({ title: 'Éxito', description: 'Paciente hospitalizado correctamente' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    },
  });

  const darAlta = useMutation({
    mutationFn: async ({
      hospitalizacionId,
      tipoAlta,
      diagnosticoAlta,
      informeAlta,
      camaId,
    }: {
      hospitalizacionId: string;
      tipoAlta: Hospitalizacion['tipo_alta'];
      diagnosticoAlta: string;
      informeAlta: string;
      camaId: string;
    }) => {
      const { data, error } = await supabase
        .from('hosix_hospitalizacion_episodios')
        .update({
          estado: 'alta',
          fecha_alta: new Date().toISOString(),
          tipo_alta: tipoAlta,
          diagnostico_alta: diagnosticoAlta,
          informe_alta: informeAlta,
        })
        .eq('id', hospitalizacionId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Liberar cama
      await updateEstadoCama.mutateAsync({
        camaId,
        estado: 'disponible',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_hospitalizacion_episodios'] });
      toast({ title: 'Éxito', description: 'Paciente dado de alta' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    },
  });

  // ============================================
  // TRASLADOS
  // ============================================

  const traslados = useQuery({
    queryKey: ['hosix_hospitalizacion_traslados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_hospitalizacion_traslados')
        .select('*')
        .order('fecha_traslado', { ascending: false });

      if (error) throw new Error(error.message);
      return data as Traslado[];
    },
  });

  const trasladosPorHospitalizacion = (hospitalizacionId: string) =>
    useQuery({
      queryKey: ['hosix_hospitalizacion_traslados', 'hospitalizacion', hospitalizacionId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('hosix_hospitalizacion_traslados')
          .select('*')
          .eq('hospitalizacion_id', hospitalizacionId)
          .order('fecha_traslado', { ascending: false });

        if (error) throw new Error(error.message);
        return data as Traslado[];
      },
    });

  const crearTraslado = useMutation({
    mutationFn: async (traslado: Omit<Traslado, 'id' | 'created_at'>) => {
      // Validar que cama nueva esté disponible
      const { data: camaNueva, error: camaError } = await supabase
        .from('hosix_camas')
        .select('estado')
        .eq('id', traslado.cama_nueva_id)
        .single();

      if (camaError || camaNueva?.estado !== 'disponible') {
        throw new Error('Cama destino no disponible');
      }

      // Crear traslado
      const { data, error } = await supabase
        .from('hosix_hospitalizacion_traslados')
        .insert([traslado])
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Actualizar camas
      await updateEstadoCama.mutateAsync({
        camaId: traslado.cama_anterior_id,
        estado: 'disponible',
      });

      await updateEstadoCama.mutateAsync({
        camaId: traslado.cama_nueva_id,
        estado: 'ocupada',
      });

      // Actualizar hospitalización
      const { error: updateError } = await supabase
        .from('hosix_hospitalizacion_episodios')
        .update({
          cama_id: traslado.cama_nueva_id,
          servicio_id: traslado.servicio_nuevo_id,
        })
        .eq('id', traslado.hospitalizacion_id);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_hospitalizacion_traslados', 'hosix_hospitalizacion_episodios', 'hosix_camas'] });
      toast({ title: 'Éxito', description: 'Traslado realizado correctamente' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    },
  });

  return {
    // Camas
    camas,
    camasDisponibles,
    camasPorServicio,
    updateEstadoCama: updateEstadoCama.mutateAsync,

    // Hospitalizaciones
    hospitalizaciones,
    hospitalizacionesActivas,
    hospitalizacionesPorPaciente,
    createHospitalizacion: createHospitalizacion.mutateAsync,
    darAlta: darAlta.mutateAsync,
    isCreatingHospitalizacion: createHospitalizacion.isPending,
    isDandoAlta: darAlta.isPending,

    // Traslados
    traslados,
    trasladosPorHospitalizacion,
    crearTraslado: crearTraslado.mutateAsync,
    isCreatingTraslado: crearTraslado.isPending,
  };
};
