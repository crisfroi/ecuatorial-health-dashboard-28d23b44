
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useEstadisticasAvanzadas() {
  return useQuery({
    queryKey: ['estadisticas-avanzadas'],
    queryFn: async () => {
      console.log('Fetching estadísticas avanzadas...');
      
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select('*');

      if (error) {
        console.error('Error fetching estadísticas avanzadas:', error);
        throw error;
      }

      const profesionales = data || [];
      
      // Calcular estadísticas básicas
      const total = profesionales.length;
      const aprobados = profesionales.filter(p => p.estado_solicitud === 'Aprobado').length;
      const pendientes = profesionales.filter(p => p.estado_solicitud === 'Pendiente').length;
      const rechazados = profesionales.filter(p => p.estado_solicitud === 'Rechazado').length;
      const revisando = profesionales.filter(p => p.estado_solicitud === 'Revisando').length;
      
      // Estadísticas por área profesional
      const porArea = profesionales.reduce((acc, prof) => {
        const area = prof.area_profesional || 'Sin especificar';
        acc[area] = (acc[area] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Estadísticas por provincia
      const porProvincia = profesionales.reduce((acc, prof) => {
        const provincia = prof.provincia || 'Sin especificar';
        acc[provincia] = (acc[provincia] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Estadísticas por género
      const porGenero = profesionales.reduce((acc, prof) => {
        const genero = prof.genero || 'Sin especificar';
        acc[genero] = (acc[genero] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Estadísticas por tipo de sector
      const porTipoSector = profesionales.reduce((acc, prof) => {
        const sector = prof.tipo_sector || 'Sin especificar';
        acc[sector] = (acc[sector] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Estadísticas por distrito
      const porDistrito = profesionales.reduce((acc, prof) => {
        const distrito = prof.distrito || 'Sin especificar';
        acc[distrito] = (acc[distrito] || 0) + 1;
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

      // Calcular carnets vencidos
      const carnetVencidos = profesionales.filter(prof => {
        if (!prof.fecha_validez_carnet) return false;
        const fechaVencimiento = new Date(prof.fecha_validez_carnet);
        return fechaVencimiento < hoy;
      }).length;

      // Estadísticas por año de graduación
      const porAnoGraduacion = profesionales.reduce((acc, prof) => {
        if (prof.año_graduacion) {
          const ano = prof.año_graduacion.toString();
          acc[ano] = (acc[ano] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Tendencias mensuales (últimos 12 meses)
      const tendenciasMensuales = [];
      for (let i = 11; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        const mesAno = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        
        const registrosDelMes = profesionales.filter(prof => {
          if (!prof.created_at) return false;
          const fechaCreacion = new Date(prof.created_at);
          const mesAnoCreacion = `${fechaCreacion.getFullYear()}-${String(fechaCreacion.getMonth() + 1).padStart(2, '0')}`;
          return mesAnoCreacion === mesAno;
        }).length;

        tendenciasMensuales.push({
          mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
          registros: registrosDelMes
        });
      }

      const estadisticas = {
        // Estadísticas básicas
        total,
        aprobados,
        pendientes,
        rechazados,
        revisando,
        vencimientosProximos,
        carnetVencidos,
        
        // Distribuciones
        porArea,
        porProvincia,
        porGenero,
        porTipoSector,
        porDistrito,
        porAnoGraduacion,
        
        // Tendencias
        tendenciasMensuales,
        
        // Tasas de conversión
        tasaAprobacion: total > 0 ? ((aprobados / total) * 100).toFixed(1) : '0',
        tasaRechazo: total > 0 ? ((rechazados / total) * 100).toFixed(1) : '0',
        
        // Datos para gráficos
        datosGraficoEstados: [
          { estado: 'Aprobado', cantidad: aprobados, color: '#22c55e' },
          { estado: 'Pendiente', cantidad: pendientes, color: '#f59e0b' },
          { estado: 'Rechazado', cantidad: rechazados, color: '#ef4444' },
          { estado: 'Revisando', cantidad: revisando, color: '#3b82f6' }
        ],
        
        datosGraficoAreas: Object.entries(porArea).map(([area, cantidad]) => ({
          area,
          cantidad: cantidad as number
        })),
        
        datosGraficoProvincias: Object.entries(porProvincia).map(([provincia, cantidad]) => ({
          provincia,
          cantidad: cantidad as number
        }))
      };

      console.log('Estadísticas avanzadas calculadas:', estadisticas);
      return estadisticas;
    },
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });
}
