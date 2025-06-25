
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Profesional = Database['public']['Tables']['profesionales_sanitarios']['Row'];
export type ProfesionalInsert = Database['public']['Tables']['profesionales_sanitarios']['Insert'];
export type ProfesionalUpdate = Database['public']['Tables']['profesionales_sanitarios']['Update'];

interface Filtros {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  search?: string;
  distrito?: string;
  anoGraduacion?: string;
}

export function useProfesionales(filtros: Filtros = {}) {
  return useQuery({
    queryKey: ['profesionales', filtros],
    queryFn: async () => {
      console.log('Fetching profesionales with filters:', filtros);
      
      let query = supabase
        .from('profesionales_sanitarios')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros si existen
      if (filtros.area_profesional) {
        query = query.eq('area_profesional', filtros.area_profesional);
      }
      
      if (filtros.estado_solicitud) {
        query = query.eq('estado_solicitud', filtros.estado_solicitud);
      }
      
      if (filtros.provincia) {
        query = query.eq('provincia', filtros.provincia);
      }
      
      if (filtros.genero) {
        query = query.eq('genero', filtros.genero);
      }
      
      if (filtros.tipo_sector) {
        query = query.eq('tipo_sector', filtros.tipo_sector);
      }

      if (filtros.distrito) {
        query = query.eq('distrito', filtros.distrito);
      }

      if (filtros.anoGraduacion) {
        query = query.eq('año_graduacion', parseInt(filtros.anoGraduacion));
      }

      // Búsqueda por texto (se aplica después de la consulta)
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching profesionales:', error);
        throw error;
      }

      console.log('Fetched profesionales:', data?.length || 0);
      return data || [];
    }
  });
}

export function useEstadisticasProfesionales() {
  return useQuery({
    queryKey: ['estadisticas-profesionales'],
    queryFn: async () => {
      console.log('Fetching estadísticas profesionales...');
      
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select('*');

      if (error) {
        console.error('Error fetching estadísticas:', error);
        throw error;
      }

      const profesionales = data || [];
      
      // Calcular estadísticas
      const total = profesionales.length;
      const aprobados = profesionales.filter(p => p.estado_solicitud === 'Aprobado').length;
      const pendientes = profesionales.filter(p => p.estado_solicitud === 'Pendiente').length;
      const rechazados = profesionales.filter(p => p.estado_solicitud === 'Rechazado').length;
      
      // Contar por área profesional
      const porArea = profesionales.reduce((acc, prof) => {
        const area = prof.area_profesional || 'Sin especificar';
        acc[area] = (acc[area] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Contar por provincia
      const porProvincia = profesionales.reduce((acc, prof) => {
        const provincia = prof.provincia || 'Sin especificar';
        acc[provincia] = (acc[provincia] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calcular vencimientos próximos (próximos 30 días)
      const hoy = new Date();
      const en30Dias = new Date();
      en30Dias.setDate(hoy.getDate() + 30);
      
      const vencimientosProximos = profesionales.filter(prof => {
        if (!prof.fecha_validez_carnet) return false;
        const fechaVencimiento = new Date(prof.fecha_validez_carnet);
        return fechaVencimiento >= hoy && fechaVencimiento <= en30Dias;
      }).length;

      const estadisticas = {
        total,
        aprobados,
        pendientes,
        rechazados,
        vencimientosProximos,
        porArea,
        porProvincia
      };

      console.log('Estadísticas calculadas:', estadisticas);
      return estadisticas;
    }
  });
}

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
