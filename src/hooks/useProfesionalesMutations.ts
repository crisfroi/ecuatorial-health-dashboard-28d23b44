
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProfesionalInsert, ProfesionalUpdate } from './useProfesionales';

export function useCrearProfesional() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profesional: ProfesionalInsert) => {
      console.log('Creating profesional:', profesional);
      
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .insert([profesional])
        .select()
        .single();

      if (error) {
        console.error('Error creating profesional:', error);
        throw error;
      }

      console.log('Profesional created:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-profesionales'] });
    }
  });
}

export function useActualizarProfesional() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProfesionalUpdate }) => {
      console.log('Updating profesional:', id, updates);
      
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profesional:', error);
        throw error;
      }

      console.log('Profesional updated:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-profesionales'] });
    }
  });
}

export function useEliminarProfesional() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting profesional:', id);
      
      const { error } = await supabase
        .from('profesionales_sanitarios')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting profesional:', error);
        throw error;
      }

      console.log('Profesional deleted:', id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-profesionales'] });
    }
  });
}

export function useCrearLoteProfesionales() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profesionales: ProfesionalInsert[]) => {
      console.log('Creating batch of profesionales:', profesionales.length);
      
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .insert(profesionales)
        .select();

      if (error) {
        console.error('Error creating batch:', error);
        throw error;
      }

      console.log('Batch created successfully:', data?.length);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-profesionales'] });
    }
  });
}
