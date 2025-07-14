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
  
  // NUEVO: Filtro para alertas de renovación
  filterByRenewalAlerts?: boolean;
}

// Extender el tipo Profesional para incluir los campos calculados para las alertas
// Esta interfaz podría definirse aquí o en el componente RenewalAlerts si solo se usa allí.
// Por simplicidad, la dejamos aquí si vas a devolver este tipo desde el hook.
export interface ProfesionalAlert extends Profesional {
  diasRestantes: number;
  prioridad: 'alta' | 'media' | 'baja' | 'vencido';
}

// Función auxiliar para calcular días y prioridad (la misma que en RenewalAlerts)
const calculateRenewalInfo = (professional: Profesional): ProfesionalAlert | null => {
    if (!professional.fecha_caducidad) {
      return null;
    }

    const today = new Date();
    const expiryDate = new Date(professional.fecha_caducidad);
    expiryDate.setHours(23, 59, 59, 999);

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let prioridad: 'alta' | 'media' | 'baja' | 'vencido';
    if (diffDays <= 0) {
      prioridad = 'vencido';
    } else if (diffDays < 30) {
      prioridad = 'alta';
    } else if (diffDays >= 30 && diffDays < 60) {
      prioridad = 'media';
    } else { // diffDays >= 60 && diffDays <= 90
      prioridad = 'baja';
    }

    if (diffDays <= 90) { // Incluye vencidos y hasta 90 días futuros
      return {
        ...professional,
        diasRestantes: diffDays,
        prioridad: prioridad,
      };
    }
    return null;
};


export function useProfesionales(filtros: Filtros = {}) {
  return useQuery<Profesional[] | ProfesionalAlert[]>({ // Puede devolver Profesional[] o ProfesionalAlert[]
    queryKey: ['profesionales', filtros],
    queryFn: async () => {
      console.log('Fetching profesionales with filters:', filtros);
      
      let query = supabase
        .from('profesionales_sanitarios')
        .select('*'); // Seleccionamos todo para poder calcular fechas

      // Aplicar filtros existentes
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

      // NUEVA LÓGICA DE FILTRADO Y PROCESAMIENTO PARA ALERTAS DE RENOVACIÓN
      if (filtros.filterByRenewalAlerts) {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + 90); // Hasta 90 días en el futuro

        const todayIso = today.toISOString().split('T')[0];
        const futureDateIso = futureDate.toISOString().split('T')[0];

        // Aplicar filtros de fecha y estado 'Aprobado' directamente en la base de datos
        query = query
            .lte('fecha_caducidad', futureDateIso)
            .gte('fecha_caducidad', todayIso)
            .eq('estado_solicitud', 'Aprobado') // Filtro de estado aquí
            .order('fecha_caducidad', { ascending: true }); // Ordenar para alertas
      } else {
        // Ordenamiento por defecto si no es una consulta de alerta
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching profesionales:', error);
        throw error;
      }

      console.log('Fetched profesionales:', data?.length || 0);

      // Si es una consulta de alerta, procesar los datos antes de devolverlos
      if (filtros.filterByRenewalAlerts) {
          const processedAlerts: ProfesionalAlert[] = [];
          data.forEach(prof => {
            const alertInfo = calculateRenewalInfo(prof);
            if (alertInfo) {
              processedAlerts.push(alertInfo);
            }
          });
          return processedAlerts;
      }

      return data || [];
    }
  });
}
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
