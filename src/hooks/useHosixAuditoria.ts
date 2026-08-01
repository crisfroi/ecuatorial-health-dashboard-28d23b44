import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/hosixClient';
import { useHosixAuth } from './useHosixAuth';

export interface RegistroAuditoria {
  id: string;
  usuario_id: string;
  accion: string;
  tabla_afectada: string;
  registro_id?: string;
  datos_anteriores?: any;
  datos_nuevos?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface FiltrosAuditoria {
  usuario_id?: string;
  tabla_afectada?: string;
  accion?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  limite?: number;
}

export const useHosixAuditoria = () => {
  const { user } = useHosixAuth();

  // Registrar evento de auditoría
  const registrarEvento = useCallback(async (
    accion: string,
    tablaAfectada: string,
    registroId?: string,
    datosAnteriores?: any,
    datosNuevos?: any
  ) => {
    try {
      if (!user?.id) {
        console.warn('User not authenticated for audit logging');
        return;
      }

      const { error } = await supabase
        .from('hosix_auditoria')
        .insert({
          usuario_id: user.id,
          accion,
          tabla_afectada: tablaAfectada,
          registro_id: registroId,
          datos_anteriores: datosAnteriores,
          datos_nuevos: datosNuevos,
          ip_address: null, // Se obtendría del backend
          user_agent: navigator.userAgent,
        });

      if (error) {
        console.error('Error logging audit event:', error);
      }
    } catch (err) {
      console.error('Error in audit logging:', err);
    }
  }, [user?.id]);

  // Obtener registros de auditoría
  const obtenerRegistros = useCallback(async (filtros: FiltrosAuditoria) => {
    try {
      let query = supabase
        .from('hosix_auditoria')
        .select('*');

      if (filtros.usuario_id) {
        query = query.eq('usuario_id', filtros.usuario_id);
      }

      if (filtros.tabla_afectada) {
        query = query.eq('tabla_afectada', filtros.tabla_afectada);
      }

      if (filtros.accion) {
        query = query.eq('accion', filtros.accion);
      }

      if (filtros.fecha_desde) {
        query = query.gte('created_at', filtros.fecha_desde);
      }

      if (filtros.fecha_hasta) {
        query = query.lte('created_at', filtros.fecha_hasta);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(filtros.limite || 100);

      if (error) throw error;
      return (data || []) as RegistroAuditoria[];
    } catch (err) {
      console.error('Error fetching audit records:', err);
      throw err;
    }
  }, []);

  // Obtener auditoría por usuario
  const obtenerAuditoriaUsuario = useCallback(async (usuarioId: string, limite: number = 50) => {
    try {
      const { data, error } = await supabase
        .from('hosix_auditoria')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false })
        .limit(limite);

      if (error) throw error;
      return (data || []) as RegistroAuditoria[];
    } catch (err) {
      console.error('Error fetching user audit:', err);
      throw err;
    }
  }, []);

  // Obtener auditoría por tabla
  const obtenerAuditoriaPorTabla = useCallback(async (tabla: string, limite: number = 50) => {
    try {
      const { data, error } = await supabase
        .from('hosix_auditoria')
        .select('*')
        .eq('tabla_afectada', tabla)
        .order('created_at', { ascending: false })
        .limit(limite);

      if (error) throw error;
      return (data || []) as RegistroAuditoria[];
    } catch (err) {
      console.error('Error fetching table audit:', err);
      throw err;
    }
  }, []);

  // Obtener auditoría por registro específico
  const obtenerAuditoriaRegistro = useCallback(async (registroId: string) => {
    try {
      const { data, error } = await supabase
        .from('hosix_auditoria')
        .select('*')
        .eq('registro_id', registroId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as RegistroAuditoria[];
    } catch (err) {
      console.error('Error fetching record audit:', err);
      throw err;
    }
  }, []);

  // Generar reporte de auditoría
  const generarReporte = useCallback(async (
    fechaInicio: string,
    fechaFin: string,
    usuarioId?: string
  ) => {
    try {
      let query = supabase
        .from('hosix_auditoria')
        .select('*')
        .gte('created_at', fechaInicio)
        .lte('created_at', fechaFin);

      if (usuarioId) {
        query = query.eq('usuario_id', usuarioId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Procesar datos para reporte
      const reporte = {
        período: { inicio: fechaInicio, fin: fechaFin },
        totalEventos: data?.length || 0,
        eventosPorAcción: {} as Record<string, number>,
        eventosPorTabla: {} as Record<string, number>,
        eventosPorUsuario: {} as Record<string, number>,
        eventos: data || [],
      };

      (data || []).forEach(evento => {
        reporte.eventosPorAcción[evento.accion] = (reporte.eventosPorAcción[evento.accion] || 0) + 1;
        reporte.eventosPorTabla[evento.tabla_afectada] = (reporte.eventosPorTabla[evento.tabla_afectada] || 0) + 1;
        reporte.eventosPorUsuario[evento.usuario_id] = (reporte.eventosPorUsuario[evento.usuario_id] || 0) + 1;
      });

      return reporte;
    } catch (err) {
      console.error('Error generating audit report:', err);
      throw err;
    }
  }, []);

  // Acciones de auditoría comunes
  const auditarCreacion = useCallback((tabla: string, registroId: string, datos: any) => {
    return registrarEvento('CREATE', tabla, registroId, null, datos);
  }, [registrarEvento]);

  const auditarActualizacion = useCallback((tabla: string, registroId: string, datosAnteriores: any, datosNuevos: any) => {
    return registrarEvento('UPDATE', tabla, registroId, datosAnteriores, datosNuevos);
  }, [registrarEvento]);

  const auditarEliminacion = useCallback((tabla: string, registroId: string, datos: any) => {
    return registrarEvento('DELETE', tabla, registroId, datos, null);
  }, [registrarEvento]);

  const auditarAcceso = useCallback((tabla: string, registroId?: string) => {
    return registrarEvento('READ', tabla, registroId);
  }, [registrarEvento]);

  return {
    registrarEvento,
    obtenerRegistros,
    obtenerAuditoriaUsuario,
    obtenerAuditoriaPorTabla,
    obtenerAuditoriaRegistro,
    generarReporte,
    auditarCreacion,
    auditarActualizacion,
    auditarEliminacion,
    auditarAcceso,
  };
};
