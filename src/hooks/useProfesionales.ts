
import { useQuery } from '@tanstack/react-query';
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
      if (filtros.area_profesional && filtros.area_profesional !== 'todos') {
        query = query.eq('area_profesional', filtros.area_profesional);
      }
      
      if (filtros.estado_solicitud && filtros.estado_solicitud !== 'todos') {
        query = query.eq('estado_solicitud', filtros.estado_solicitud);
      }
      
      if (filtros.provincia && filtros.provincia !== 'todos') {
        query = query.eq('provincia', filtros.provincia);
      }
      
      if (filtros.genero && filtros.genero !== 'todos') {
        query = query.eq('genero', filtros.genero);
      }
      
      if (filtros.tipo_sector && filtros.tipo_sector !== 'todos') {
        query = query.eq('tipo_sector', filtros.tipo_sector);
      }

      if (filtros.distrito && filtros.distrito !== 'todos') {
        query = query.eq('distrito', filtros.distrito);
      }

      if (filtros.anoGraduacion && filtros.anoGraduacion !== 'todos') {
        query = query.eq('año_graduacion', parseInt(filtros.anoGraduacion));
      }

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
