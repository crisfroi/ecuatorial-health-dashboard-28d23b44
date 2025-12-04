import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useHosixAuth } from './useHosixAuth';

export interface HosixPaciente {
  id: string;
  ppi: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  fecha_nacimiento: string;
  sexo: string;
  numero_documento?: string;
  telefono_movil?: string;
  email?: string;
  grupo_sanguineo?: string;
  alergias?: string[];
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface FiltrosPacientes {
  busqueda?: string;
  estado?: 'activo' | 'inactivo' | 'todos';
  página?: number;
  limite?: number;
}

export const useHosixPacientes = () => {
  const { user } = useHosixAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener lista de pacientes
  const {
    data: pacientes,
    isLoading: isLoadingPacientes,
    error: errorPacientes,
    refetch: refetchPacientes,
  } = useQuery({
    queryKey: ['hosix-pacientes', user?.centro_salud_id],
    queryFn: async () => {
      if (!user?.centro_salud_id) return [];

      const { data, error } = await supabase
        .from('hosix_pacientes')
        .select('*')
        .eq('activo', true)
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as HosixPaciente[];
    },
    enabled: !!user?.centro_salud_id,
  });

  // Buscar pacientes
  const buscarPacientes = useCallback(async (filtros: FiltrosPacientes) => {
    try {
      let query = supabase
        .from('hosix_pacientes')
        .select('*');

      if (filtros.busqueda) {
        query = query.or(
          `primer_nombre.ilike.%${filtros.busqueda}%,` +
          `primer_apellido.ilike.%${filtros.busqueda}%,` +
          `ppi.ilike.%${filtros.busqueda}%,` +
          `numero_documento.ilike.%${filtros.busqueda}%`
        );
      }

      if (filtros.estado && filtros.estado !== 'todos') {
        query = query.eq('activo', filtros.estado === 'activo');
      }

      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .limit(filtros.limite || 50)
        .offset((filtros.página || 0) * (filtros.limite || 50));

      if (error) throw error;
      return (data || []) as HosixPaciente[];
    } catch (err) {
      console.error('Error searching patients:', err);
      throw err;
    }
  }, []);

  // Obtener paciente por ID
  const obtenerPaciente = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('hosix_pacientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as HosixPaciente;
    } catch (err) {
      console.error('Error fetching patient:', err);
      throw err;
    }
  }, []);

  // Generar PPI único
  const generarPPI = useCallback(async (): Promise<string> => {
    try {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `PPI-${timestamp}-${random}`;
    } catch (err) {
      console.error('Error generating PPI:', err);
      throw err;
    }
  }, []);

  // Crear paciente
  const crearPaciente = useMutation({
    mutationFn: async (pacienteData: Partial<HosixPaciente>) => {
      if (!user?.centro_salud_id) throw new Error('Centro de salud requerido');

      const ppi = await generarPPI();

      const { data, error } = await supabase
        .from('hosix_pacientes')
        .insert({
          ...pacienteData,
          ppi,
          centro_registro_id: user.centro_salud_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as HosixPaciente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix-pacientes'] });
      toast({
        title: 'Éxito',
        description: 'Paciente creado correctamente',
      });
    },
    onError: (err) => {
      console.error('Error creating patient:', err);
      toast({
        title: 'Error',
        description: 'Error al crear paciente',
        variant: 'destructive',
      });
    },
  });

  // Actualizar paciente
  const actualizarPaciente = useMutation({
    mutationFn: async (pacienteData: Partial<HosixPaciente> & { id: string }) => {
      const { id, ...updateData } = pacienteData;

      const { data, error } = await supabase
        .from('hosix_pacientes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as HosixPaciente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix-pacientes'] });
      toast({
        title: 'Éxito',
        description: 'Paciente actualizado correctamente',
      });
    },
    onError: (err) => {
      console.error('Error updating patient:', err);
      toast({
        title: 'Error',
        description: 'Error al actualizar paciente',
        variant: 'destructive',
      });
    },
  });

  // Desactivar paciente
  const desactivarPaciente = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('hosix_pacientes')
        .update({ activo: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as HosixPaciente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix-pacientes'] });
      toast({
        title: 'Éxito',
        description: 'Paciente desactivado correctamente',
      });
    },
    onError: (err) => {
      console.error('Error deactivating patient:', err);
      toast({
        title: 'Error',
        description: 'Error al desactivar paciente',
        variant: 'destructive',
      });
    },
  });

  return {
    pacientes: pacientes || [],
    isLoadingPacientes,
    errorPacientes,
    refetchPacientes,
    buscarPacientes,
    obtenerPaciente,
    generarPPI,
    crearPaciente: crearPaciente.mutate,
    crearPacienteAsync: crearPaciente.mutateAsync,
    isCreatingPaciente: crearPaciente.isPending,
    actualizarPaciente: actualizarPaciente.mutate,
    actualizarPacienteAsync: actualizarPaciente.mutateAsync,
    isActualizandoPaciente: actualizarPaciente.isPending,
    desactivarPaciente: desactivarPaciente.mutate,
    desactivarPacienteAsync: desactivarPaciente.mutateAsync,
    isDesactivandoPaciente: desactivarPaciente.isPending,
  };
};
