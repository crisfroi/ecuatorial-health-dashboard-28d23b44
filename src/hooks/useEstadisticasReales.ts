
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useEstadisticasReales() {
  return useQuery({
    queryKey: ['estadisticas-reales'],
    queryFn: async () => {
      console.log('Fetching estadísticas reales...');
      
      // Obtener datos de profesionales
      const { data: profesionales, error: profError } = await supabase
        .from('profesionales_sanitarios')
        .select('*');

      if (profError) {
        console.error('Error fetching profesionales:', profError);
        throw profError;
      }

      // Obtener datos de distritos sanitarios
      const { data: distritos, error: distError } = await supabase
        .from('distrito_sanitario')
        .select('*');

      if (distError) {
        console.error('Error fetching distritos:', distError);
        throw distError;
      }

      const profesionalesData = profesionales || [];
      const distritosData = distritos || [];
      
      // Calcular estadísticas básicas
      const total = profesionalesData.length;
      const aprobados = profesionalesData.filter(p => p.estado_solicitud === 'Aprobado').length;
      const pendientes = profesionalesData.filter(p => p.estado_solicitud === 'Pendiente').length;
      const rechazados = profesionalesData.filter(p => p.estado_solicitud === 'Rechazado').length;
      const revisando = profesionalesData.filter(p => p.estado_solicitud === 'Revisando').length;
      
      // Estadísticas por área profesional
      const porArea = profesionalesData.reduce((acc, prof) => {
        const area = prof.area_profesional || 'Sin especificar';
        acc[area] = (acc[area] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Estadísticas por provincia usando datos de distritos
      const porProvincia = profesionalesData.reduce((acc, prof) => {
        const provincia = prof.provincia || 'Sin especificar';
        acc[provincia] = (acc[provincia] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Estadísticas por distrito sanitario
      const porDistrito = profesionalesData.reduce((acc, prof) => {
        const distrito = prof.distrito_sanitario || 'Sin especificar';
        acc[distrito] = (acc[distrito] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Estadísticas por género
      const porGenero = profesionalesData.reduce((acc, prof) => {
        const genero = prof.genero || 'Sin especificar';
        acc[genero] = (acc[genero] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Estadísticas por tipo de sector
      const porTipoSector = profesionalesData.reduce((acc, prof) => {
        const sector = prof.tipo_sector || 'Sin especificar';
        acc[sector] = (acc[sector] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calcular vencimientos próximos y vencidos
      const hoy = new Date();
      const en30Dias = new Date();
      en30Dias.setDate(hoy.getDate() + 30);
      
      const vencimientosProximos = profesionalesData.filter(prof => {
        if (!prof.fecha_validez_carnet) return false;
        const fechaVencimiento = new Date(prof.fecha_validez_carnet);
        return fechaVencimiento >= hoy && fechaVencimiento <= en30Dias;
      }).length;

      const carnetVencidos = profesionalesData.filter(prof => {
        if (!prof.fecha_validez_carnet) return false;
        const fechaVencimiento = new Date(prof.fecha_validez_carnet);
        return fechaVencimiento < hoy;
      }).length;

      // Tendencias mensuales
      const tendenciasMensuales = [];
      for (let i = 11; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        const mesAno = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        
        const registrosDelMes = profesionalesData.filter(prof => {
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
        
        // Datos de referencia
        distritos: distritosData,
        
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

      console.log('Estadísticas reales calculadas:', estadisticas);
      return estadisticas;
    },
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });
}
