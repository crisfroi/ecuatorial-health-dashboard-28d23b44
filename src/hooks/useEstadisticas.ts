
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
