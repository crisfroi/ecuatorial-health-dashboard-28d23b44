
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Profesional {
  id: string;
  nombre_completo: string;
  nombre?: string;
  apellidos?: string;
  fecha_nacimiento?: string;
  edad?: number;
  genero?: string;
  nacionalidad?: string;
  area_profesional: string;
  especialidad?: string;
  lugar_trabajo?: string;
  provincia?: string;
  distrito?: string;
  estado_solicitud?: string;
  fecha_validez_carnet?: string;
  numero_carnet_profesional?: string;
  telefono?: string;
  tipo_sector?: string;
  created_at?: string;
  updated_at?: string;
}

export const useProfesionales = (filters?: any) => {
  return useQuery({
    queryKey: ['profesionales', filters],
    queryFn: async () => {
      let query = supabase
        .from('profesionales_sanitarios')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros si existen
      if (filters?.area_profesional) {
        query = query.eq('area_profesional', filters.area_profesional);
      }
      if (filters?.provincia) {
        query = query.eq('provincia', filters.provincia);
      }
      if (filters?.estado_solicitud) {
        query = query.eq('estado_solicitud', filters.estado_solicitud);
      }
      if (filters?.genero) {
        query = query.eq('genero', filters.genero);
      }
      if (filters?.tipo_sector) {
        query = query.eq('tipo_sector', filters.tipo_sector);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching profesionales:', error);
        throw error;
      }
      
      return data as Profesional[];
    },
  });
};

export const useEstadisticasProfesionales = () => {
  return useQuery({
    queryKey: ['estadisticas-profesionales'],
    queryFn: async () => {
      // Obtener estadísticas generales
      const { data: profesionales, error } = await supabase
        .from('profesionales_sanitarios')
        .select('*');

      if (error) throw error;

      const total = profesionales?.length || 0;
      const aprobados = profesionales?.filter(p => p.estado_solicitud === 'Aprobado').length || 0;
      const pendientes = profesionales?.filter(p => p.estado_solicitud === 'Pendiente').length || 0;
      const rechazadas = profesionales?.filter(p => p.estado_solicitud === 'Rechazado').length || 0;

      // Estadísticas por área profesional
      const porArea = profesionales?.reduce((acc: any, prof) => {
        const area = prof.area_profesional || 'Sin especificar';
        acc[area] = (acc[area] || 0) + 1;
        return acc;
      }, {}) || {};

      // Estadísticas por provincia
      const porProvincia = profesionales?.reduce((acc: any, prof) => {
        const provincia = prof.provincia || 'Sin especificar';
        acc[provincia] = (acc[provincia] || 0) + 1;
        return acc;
      }, {}) || {};

      // Próximos a vencer (carnets que vencen en los próximos 30 días)
      const hoy = new Date();
      const proximos30Dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const proximosVencer = profesionales?.filter(prof => {
        if (!prof.fecha_validez_carnet) return false;
        const fechaVencimiento = new Date(prof.fecha_validez_carnet);
        return fechaVencimiento >= hoy && fechaVencimiento <= proximos30Dias;
      }).length || 0;

      // Carnets vencidos
      const vencidos = profesionales?.filter(prof => {
        if (!prof.fecha_validez_carnet) return false;
        const fechaVencimiento = new Date(prof.fecha_validez_carnet);
        return fechaVencimiento < hoy;
      }).length || 0;

      return {
        total,
        aprobados,
        pendientes,
        rechazadas,
        porArea,
        porProvincia,
        proximosVencer,
        vencidos
      };
    },
  });
};

export const useCrearProfesional = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profesional: Partial<Profesional>) => {
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .insert([profesional])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-profesionales'] });
    },
  });
};

export const useActualizarProfesional = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...profesional }: Partial<Profesional> & { id: string }) => {
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .update(profesional)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-profesionales'] });
    },
  });
};
