import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';
import { useState } from 'react';

export interface Recobro {
  id: string;
  numero_recobro: string;
  factura_id: string;
  motivo_recobro: string;
  descripcion: string;
  monto_original: number;
  monto_recobrado: number;
  estado: 'pendiente' | 'en_proceso' | 'parcial' | 'completado' | 'rechazado';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  fecha_solicitud: string;
  fecha_cierre: string | null;
  usuario_responsable_id: string;
  observaciones: string;
  created_at: string;
  updated_at: string;
}

export interface NotaCargo {
  id: string;
  numero_nota: string;
  recobro_id: string | null;
  factura_id: string;
  concepto: string;
  descripcion: string;
  monto: number;
  razon_cargo: string;
  documentos_adjuntos: any[];
  estado: 'emitida' | 'aprobada' | 'rechazada';
  fecha_emision: string;
  fecha_aprovacion: string | null;
  aprobado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotaCredito {
  id: string;
  numero_nota: string;
  factura_id: string;
  concepto: string;
  descripcion: string;
  monto: number;
  razon_credito: string;
  documentos_adjuntos: any[];
  estado: 'emitida' | 'aprobada' | 'rechazada' | 'contabilizada';
  fecha_emision: string;
  fecha_aprovacion: string | null;
  aprobado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface SolicitudRecobro {
  id: string;
  numero_solicitud: string;
  aseguradora_id: string;
  tipo_solicitud: 'devolucion' | 'aclaracion' | 'denegacion';
  descripcion: string;
  monto_solicitado: number | null;
  partidas: any[];
  estado: 'abierta' | 'en_respuesta' | 'respondida' | 'cerrada';
  fecha_solicitud: string;
  fecha_vencimiento: string | null;
  fecha_respuesta: string | null;
  respuesta_aseguradora: string;
  documentos_respuesta: any[];
  usuario_responsable_id: string;
  observaciones: string;
  created_at: string;
  updated_at: string;
}

export interface MorosidadRecord {
  id: string;
  cuenta_id: string;
  aseguradora_id: string;
  saldo_deudor: number;
  dias_vencimiento: number;
  facturas_vencidas: number;
  total_facturas_vencidas: number;
  historial_pagos: any[];
  status_cobranza: 'activo' | 'en_litigio' | 'incobrable' | 'pago_total';
  acciones_cobranza: any[];
  notas: string;
  fecha_ultimo_pago: string | null;
  fecha_proximo_seguimiento: string | null;
  created_at: string;
  updated_at: string;
}

export function useHosixRecobros() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // RECOBROS CRUD
  const { data: recobros = [], isLoading: recobrosLoading } = useQuery({
    queryKey: ['hosix_recobros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_recobros')
        .select('*')
        .order('fecha_solicitud', { ascending: false });
      if (error) throw error;
      return data as Recobro[];
    }
  });

  const crearRecobroMutation = useMutation({
    mutationFn: async (data: Omit<Recobro, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('hosix_recobros').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_recobros'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al crear recobro');
    }
  });

  const actualizarRecobroMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Recobro> & { id: string }) => {
      const { error } = await supabase
        .from('hosix_recobros')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_recobros'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al actualizar recobro');
    }
  });

  // NOTAS DE CARGO CRUD
  const { data: notasCargo = [], isLoading: notasCargoLoading } = useQuery({
    queryKey: ['hosix_recobros_notas_cargo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_recobros_notas_cargo')
        .select('*')
        .order('fecha_emision', { ascending: false });
      if (error) throw error;
      return data as NotaCargo[];
    }
  });

  const crearNotaCargoMutation = useMutation({
    mutationFn: async (data: Omit<NotaCargo, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('hosix_recobros_notas_cargo').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_recobros_notas_cargo'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al crear nota de cargo');
    }
  });

  const aprobarNotaCargoMutation = useMutation({
    mutationFn: async ({ id, aprobado_por }: { id: string; aprobado_por: string }) => {
      const { error } = await supabase
        .from('hosix_recobros_notas_cargo')
        .update({
          estado: 'aprobada',
          fecha_aprovacion: new Date().toISOString(),
          aprobado_por
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_recobros_notas_cargo'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al aprobar nota de cargo');
    }
  });

  // NOTAS DE CRÉDITO CRUD
  const { data: notasCredito = [], isLoading: notasCreditoLoading } = useQuery({
    queryKey: ['hosix_recobros_notas_credito'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_recobros_notas_credito')
        .select('*')
        .order('fecha_emision', { ascending: false });
      if (error) throw error;
      return data as NotaCredito[];
    }
  });

  const crearNotaCreditoMutation = useMutation({
    mutationFn: async (data: Omit<NotaCredito, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('hosix_recobros_notas_credito').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_recobros_notas_credito'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al crear nota de crédito');
    }
  });

  const aprobarNotaCreditoMutation = useMutation({
    mutationFn: async ({ id, aprobado_por }: { id: string; aprobado_por: string }) => {
      const { error } = await supabase
        .from('hosix_recobros_notas_credito')
        .update({
          estado: 'aprobada',
          fecha_aprovacion: new Date().toISOString(),
          aprobado_por
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_recobros_notas_credito'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al aprobar nota de crédito');
    }
  });

  // SOLICITUDES CRUD
  const { data: solicitudes = [], isLoading: solicitudesLoading } = useQuery({
    queryKey: ['hosix_recobros_solicitudes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_recobros_solicitudes')
        .select('*')
        .order('fecha_solicitud', { ascending: false });
      if (error) throw error;
      return data as SolicitudRecobro[];
    }
  });

  const crearSolicitudMutation = useMutation({
    mutationFn: async (data: Omit<SolicitudRecobro, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('hosix_recobros_solicitudes').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_recobros_solicitudes'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al crear solicitud');
    }
  });

  const actualizarSolicitudMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<SolicitudRecobro> & { id: string }) => {
      const { error } = await supabase
        .from('hosix_recobros_solicitudes')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_recobros_solicitudes'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al actualizar solicitud');
    }
  });

  // MOROSIDAD
  const { data: morosidad = [], isLoading: morosidadLoading } = useQuery({
    queryKey: ['hosix_recobros_morosidad'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_recobros_morosidad')
        .select('*')
        .order('dias_vencimiento', { ascending: false });
      if (error) throw error;
      return data as MorosidadRecord[];
    }
  });

  const actualizarMorosidadMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<MorosidadRecord> & { id: string }) => {
      const { error } = await supabase
        .from('hosix_recobros_morosidad')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_recobros_morosidad'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al actualizar morosidad');
    }
  });

  return {
    // Recobros
    recobros,
    recobrosLoading,
    crearRecobro: crearRecobroMutation.mutate,
    actualizarRecobro: actualizarRecobroMutation.mutate,
    crearRecobroLoading: crearRecobroMutation.isPending,

    // Notas de Cargo
    notasCargo,
    notasCargoLoading,
    crearNotaCargo: crearNotaCargoMutation.mutate,
    aprobarNotaCargo: aprobarNotaCargoMutation.mutate,
    crearNotaCargoLoading: crearNotaCargoMutation.isPending,

    // Notas de Crédito
    notasCredito,
    notasCreditoLoading,
    crearNotaCredito: crearNotaCreditoMutation.mutate,
    aprobarNotaCredito: aprobarNotaCreditoMutation.mutate,
    crearNotaCreditoLoading: crearNotaCreditoMutation.isPending,

    // Solicitudes
    solicitudes,
    solicitudesLoading,
    crearSolicitud: crearSolicitudMutation.mutate,
    actualizarSolicitud: actualizarSolicitudMutation.mutate,
    crearSolicitudLoading: crearSolicitudMutation.isPending,

    // Morosidad
    morosidad,
    morosidadLoading,
    actualizarMorosidad: actualizarMorosidadMutation.mutate,

    error,
    setError
  };
}
