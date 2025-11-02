import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface GuardiaAsistencia {
  id: string;
  profesional_guardia_id: string;
  profesional_nombre: string;
  centro_salud_id: string;
  centro_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: 'fisica' | 'localizable' | 'administrativa';
  tipo_dia: 'ordinario' | 'fin_semana' | 'festivo';
  estado: 'activa' | 'cumplida' | 'no_cumplida' | 'parcial';
  horas_guardadas: number;
  entrada_registrada: string | null;
  salida_registrada: string | null;
  asistencia_confirmada: boolean;
  inconsistencias: string[];
  observaciones: string;
}

export interface AsistenciaVsGuardia {
  profesional_id: string;
  profesional_nombre: string;
  centro_salud_id: string;
  centro_nombre: string;
  fecha: string;
  guardia_programada: boolean;
  guardia_id?: string;
  asistencia_registrada: boolean;
  entrada_hora?: string;
  salida_hora?: string;
  estado: 'conforme' | 'sin_asistencia' | 'asistencia_no_programada' | 'sin_guardia';
  duracion_programada?: number;
  duracion_real?: number;
  diferencia_horas?: number;
}

export interface ReporteGuardiaAsistencia {
  fecha_reporte: string;
  mes: number;
  ano: number;
  periodo: string;
  total_guardias_programadas: number;
  total_guardias_cumplidas: number;
  total_guardias_incumplidas: number;
  tasa_cumplimiento: number;
  asistencias_no_programadas: number;
  profesionales_sin_asistencia: number;
  inconsistencias_detectadas: number;
  centros_afectados: string[];
}

export function useGuardiaAsistenciaIntegration(
  mes: number,
  ano: number,
  centroId?: string | null
) {
  const { toast } = useToast();
  const [guardiaAsistencias, setGuardiaAsistencias] = useState<GuardiaAsistencia[]>([]);
  const [comparativaAsistencia, setComparativaAsistencia] = useState<AsistenciaVsGuardia[]>([]);
  const [reporte, setReporte] = useState<ReporteGuardiaAsistencia | null>(null);
  const [loading, setLoading] = useState(false);

  // Query: Obtener guardias para el período
  const guardiasQuery = useQuery({
    queryKey: ['guardias-integracion', mes, ano, centroId],
    queryFn: async () => {
      const startDate = new Date(ano, mes - 1, 1).toISOString();
      const endDate = new Date(ano, mes, 0, 23, 59, 59).toISOString();

      let query = supabase
        .from('guardias')
        .select(`
          id,
          profesional_guardia_id,
          centro_salud_id,
          fecha_inicio,
          fecha_fin,
          tipo,
          tipo_dia,
          estado,
          observaciones,
          profesionales_guardias!inner(
            profesionales_sanitarios!inner(id, nombre_completo)
          ),
          centros_salud!inner(id, nombre)
        `)
        .gte('fecha_inicio', startDate)
        .lte('fecha_inicio', endDate);

      if (centroId) {
        query = query.eq('centro_salud_id', centroId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Query: Obtener logs de asistencia para el período
  const attendanceQuery = useQuery({
    queryKey: ['attendance-integracion', mes, ano, centroId],
    queryFn: async () => {
      const startDate = new Date(ano, mes - 1, 1);
      const endDate = new Date(ano, mes, 0);

      let query = supabase
        .from('attendance_logs')
        .select(`
          id,
          id_profesional,
          fecha_hora,
          inout,
          dispositivos!inner(centro_salud_id),
          profesionales_sanitarios(nombre_completo)
        `)
        .gte('fecha_hora', startDate.toISOString())
        .lte('fecha_hora', endDate.toISOString());

      if (centroId) {
        query = query.eq('dispositivos.centro_salud_id', centroId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Función: Procesar y comparar guardias vs asistencia
  const procesarGuardiaAsistencia = useCallback(async () => {
    if (!guardiasQuery.data || !attendanceQuery.data) return;

    setLoading(true);

    try {
      const guardias = guardiasQuery.data;
      const logs = attendanceQuery.data;

      const processedGuardias: GuardiaAsistencia[] = [];
      const comparativa: AsistenciaVsGuardia[] = [];
      const inconsistenciasMap = new Map<string, Set<string>>();

      // Procesar cada guardia
      for (const guardia of guardias) {
        const profesionalNombre = guardia.profesionales_guardias?.profesionales_sanitarios?.nombre_completo || 'Sin nombre';
        const profesionalId = guardia.profesionales_guardias?.profesionales_sanitarios?.id;
        const centroNombre = guardia.centros_salud?.nombre || 'Sin centro';

        const fechaInicioGuardia = new Date(guardia.fecha_inicio);
        const fechaFinGuardia = new Date(guardia.fecha_fin);
        const horas = (fechaFinGuardia.getTime() - fechaInicioGuardia.getTime()) / (1000 * 60 * 60);

        // Buscar logs de asistencia dentro del período de la guardia
        const logsGuardia = logs.filter(log => {
          if (log.id_profesional !== profesionalId) return false;
          const logDate = new Date(log.fecha_hora);
          return logDate >= fechaInicioGuardia && logDate <= fechaFinGuardia;
        });

        // Encontrar entrada y salida
        const entradas = logsGuardia.filter(log => log.inout === 'IN');
        const salidas = logsGuardia.filter(log => log.inout === 'OUT');

        const entrada = entradas.length > 0 
          ? new Date(entradas[entradas.length - 1].fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : null;
        
        const salida = salidas.length > 0
          ? new Date(salidas[salidas.length - 1].fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : null;

        const asistenciaConfirmada = entradas.length > 0;
        let estado: 'activa' | 'cumplida' | 'no_cumplida' | 'parcial' = 'activa';
        const inconsistencias: string[] = [];

        // Determinar estado
        if (!asistenciaConfirmada) {
          estado = 'no_cumplida';
          inconsistencias.push('Profesional no registró entrada durante la guardia');
          
          if (!inconsistenciasMap.has(profesionalId || '')) {
            inconsistenciasMap.set(profesionalId || '', new Set());
          }
          inconsistenciasMap.get(profesionalId || '')?.add('Sin asistencia en guardia');
        } else if (salida) {
          estado = 'cumplida';
          
          // Validar tiempo de permanencia
          if (entradas.length > 0 && salidas.length > 0) {
            const duracionReal = (salidas[0].getTime() - entradas[0].getTime()) / (1000 * 60 * 60);
            if (duracionReal < horas * 0.8) {
              inconsistencias.push(`Duración real (${duracionReal.toFixed(1)}h) menor a programada (${horas.toFixed(1)}h)`);
              estado = 'parcial';
            }
          }
        } else if (entradas.length > 0) {
          estado = 'parcial';
          inconsistencias.push('Profesional registró entrada pero no salida');
        }

        processedGuardias.push({
          id: guardia.id,
          profesional_guardia_id: guardia.profesional_guardia_id,
          profesional_nombre: profesionalNombre,
          centro_salud_id: guardia.centro_salud_id || '',
          centro_nombre: centroNombre,
          fecha_inicio: guardia.fecha_inicio,
          fecha_fin: guardia.fecha_fin,
          tipo: guardia.tipo,
          tipo_dia: guardia.tipo_dia,
          estado,
          horas_guardadas: horas,
          entrada_registrada: entrada,
          salida_registrada: salida,
          asistencia_confirmada: asistenciaConfirmada,
          inconsistencias,
          observaciones: guardia.observaciones || '',
        });

        // Agregar a comparativa
        const fechaGuardia = fechaInicioGuardia.toLocaleDateString('es-ES');
        comparativa.push({
          profesional_id: profesionalId || '',
          profesional_nombre: profesionalNombre,
          centro_salud_id: guardia.centro_salud_id || '',
          centro_nombre: centroNombre,
          fecha: fechaGuardia,
          guardia_programada: true,
          guardia_id: guardia.id,
          asistencia_registrada: asistenciaConfirmada,
          entrada_hora: entrada,
          salida_hora: salida,
          estado: asistenciaConfirmada ? 'conforme' : 'sin_asistencia',
          duracion_programada: horas,
        });
      }

      // Detectar asistencias no programadas
      const profesionalesConGuardia = new Set(guardias.map(g => g.profesionales_guardias?.profesionales_sanitarios?.id).filter(Boolean));
      
      const logsPorProfesional = new Map<string, any[]>();
      for (const log of logs) {
        if (!logsPorProfesional.has(log.id_profesional || '')) {
          logsPorProfesional.set(log.id_profesional || '', []);
        }
        logsPorProfesional.get(log.id_profesional || '')?.push(log);
      }

      for (const [profId, profsLogs] of logsPorProfesional.entries()) {
        if (!profesionalesConGuardia.has(profId)) {
          // Agrupar por día
          const logsPorDia = new Map<string, any[]>();
          for (const log of profsLogs) {
            const dia = new Date(log.fecha_hora).toLocaleDateString('es-ES');
            if (!logsPorDia.has(dia)) {
              logsPorDia.set(dia, []);
            }
            logsPorDia.get(dia)?.push(log);
          }

          for (const [dia, diasLogs] of logsPorDia.entries()) {
            const entrada = diasLogs.find(l => l.inout === 'IN');
            if (entrada) {
              comparativa.push({
                profesional_id: profId,
                profesional_nombre: entrada.profesionales_sanitarios?.nombre_completo || 'Sin nombre',
                centro_salud_id: entrada.dispositivos?.centro_salud_id || '',
                centro_nombre: 'Sin especificar',
                fecha: dia,
                guardia_programada: false,
                asistencia_registrada: true,
                entrada_hora: new Date(entrada.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                estado: 'asistencia_no_programada',
              });

              if (!inconsistenciasMap.has(profId)) {
                inconsistenciasMap.set(profId, new Set());
              }
              inconsistenciasMap.get(profId)?.add('Asistencia registrada sin guardia programada');
            }
          }
        }
      }

      // Generar reporte
      const guardiasConAsistencia = processedGuardias.filter(g => g.asistencia_confirmada).length;
      const guardiasSinAsistencia = processedGuardias.filter(g => !g.asistencia_confirmada).length;
      const asistenciasNoProgra = comparativa.filter(c => c.estado === 'asistencia_no_programada').length;
      const centrosUnicos = new Set(processedGuardias.map(g => g.centro_nombre));

      const reporteData: ReporteGuardiaAsistencia = {
        fecha_reporte: new Date().toISOString(),
        mes,
        ano,
        periodo: `${mes}/${ano}`,
        total_guardias_programadas: processedGuardias.length,
        total_guardias_cumplidas: guardiasConAsistencia,
        total_guardias_incumplidas: guardiasSinAsistencia,
        tasa_cumplimiento: processedGuardias.length > 0 ? (guardiasConAsistencia / processedGuardias.length) * 100 : 0,
        asistencias_no_programadas: asistenciasNoProgra,
        profesionales_sin_asistencia: new Set(processedGuardias.filter(g => !g.asistencia_confirmada).map(g => g.profesional_guardia_id)).size,
        inconsistencias_detectadas: inconsistenciasMap.size,
        centros_afectados: Array.from(centrosUnicos),
      };

      setGuardiaAsistencias(processedGuardias);
      setComparativaAsistencia(comparativa);
      setReporte(reporteData);

      console.log('✅ Integración completada:', {
        guardias: processedGuardias.length,
        comparativa: comparativa.length,
        inconsistencias: inconsistenciasMap.size,
      });
    } catch (error) {
      console.error('❌ Error procesando integración:', error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar la integración de asistencia y guardias',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [guardiasQuery.data, attendanceQuery.data, toast]);

  // Ejecutar procesamiento cuando los datos están listos
  useEffect(() => {
    if (guardiasQuery.data && attendanceQuery.data) {
      procesarGuardiaAsistencia();
    }
  }, [guardiasQuery.data, attendanceQuery.data, procesarGuardiaAsistencia]);

  // Función: Validar conflictos usando la Edge Function
  const validarConflictosEdgeFunction = useCallback(async (guardiaId?: string) => {
    try {
      const requestData = guardiaId
        ? { guardia_id: guardiaId }
        : { mes, ano, centro_id: centroId };

      const { data, error } = await supabase.functions.invoke('detect-guardia-conflicts', {
        body: requestData,
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error calling detect-guardia-conflicts:', error);
      toast({
        title: 'Error',
        description: 'No se pudo validar conflictos de guardias',
        variant: 'destructive',
      });
      throw error;
    }
  }, [mes, ano, centroId, toast]);

  // Función: Exportar reporte
  const exportarReporte = useCallback(async (formato: 'json' | 'csv' = 'json') => {
    try {
      let contenido = '';

      if (formato === 'json') {
        contenido = JSON.stringify(
          {
            reporte,
            guardias_asistencia: guardiaAsistencias,
            comparativa: comparativaAsistencia,
          },
          null,
          2
        );
      } else {
        // CSV
        contenido = 'Profesional,Centro,Fecha,Guardia Programada,Asistencia Registrada,Entrada,Salida,Estado\n';
        
        for (const item of comparativaAsistencia) {
          contenido += `"${item.profesional_nombre}","${item.centro_nombre}","${item.fecha}",${item.guardia_programada},${item.asistencia_registrada},"${item.entrada_hora || 'N/A'}","${item.salida_hora || 'N/A'}","${item.estado}"\n`;
        }
      }

      // Crear descarga
      const blob = new Blob([contenido], { type: formato === 'json' ? 'application/json' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-guardia-asistencia-${mes}-${ano}.${formato}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Éxito',
        description: `Reporte exportado en formato ${formato.toUpperCase()}`,
      });
    } catch (error) {
      console.error('❌ Error exporting report:', error);
      toast({
        title: 'Error',
        description: 'No se pudo exportar el reporte',
        variant: 'destructive',
      });
    }
  }, [mes, ano, reporte, guardiaAsistencias, comparativaAsistencia, toast]);

  return {
    // Datos
    guardiaAsistencias,
    comparativaAsistencia,
    reporte,
    
    // Estados
    loading: loading || guardiasQuery.isLoading || attendanceQuery.isLoading,
    isError: guardiasQuery.isError || attendanceQuery.isError,
    error: guardiasQuery.error || attendanceQuery.error,

    // Funciones
    validarConflictosEdgeFunction,
    exportarReporte,
    refetch: () => {
      guardiasQuery.refetch();
      attendanceQuery.refetch();
    },
  };
}
