import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';
import { useState } from 'react';

export interface Caja {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  responsable_id: string;
  saldo_inicial: number;
  saldo_actual: number;
  estado: 'abierta' | 'cerrada' | 'mantenimiento';
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TurnoCaja {
  id: string;
  caja_id: string;
  usuario_id: string;
  numero_turno: string;
  fecha_inicio: string;
  fecha_cierre: string | null;
  saldo_apertura: number;
  saldo_cierre: number | null;
  total_cobros: number;
  total_pagos: number;
  observaciones: string;
  estado: 'abierto' | 'cerrado';
  created_at: string;
  updated_at: string;
}

export interface MovimientoCaja {
  id: string;
  numero_movimiento: string;
  factura_id: string | null;
  turno_id: string;
  tipo_movimiento: string;
  forma_pago_id: string;
  referencia_pago: string;
  caja_id: string;
  usuario_responsable_id: string;
  monto: number;
  fecha_movimiento: string;
  observaciones: string;
  created_at: string;
}

export interface FormaPago {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  requiere_referencia: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CierreCaja {
  id: string;
  caja_id: string;
  turno_id: string;
  fecha_cierre: string;
  usuario_responsable_id: string;
  saldo_apertura: number;
  total_cobros: number;
  total_pagos: number;
  saldo_teorico: number;
  saldo_real: number;
  diferencia: number;
  estado: 'pendiente_cuadre' | 'cuadrado' | 'descuadre_reportado';
  observaciones: string;
  created_at: string;
  updated_at: string;
}

export interface ArqueooCaja {
  id: string;
  caja_id: string;
  fecha_arqueo: string;
  usuario_responsable_id: string;
  billetes_100: number;
  billetes_50: number;
  billetes_20: number;
  billetes_10: number;
  billetes_5: number;
  billetes_1: number;
  monedas_1: number;
  monedas_otros: number;
  total_efectivo: number;
  cheques_cantidad: number;
  cheques_monto: number;
  tarjetas_cantidad: number;
  tarjetas_monto: number;
  total_arqueo: number;
  saldo_esperado: number;
  diferencia: number;
  observaciones: string;
  aprobado_por: string;
  estado: 'borrador' | 'presentado' | 'aprobado' | 'rechazado';
  created_at: string;
  updated_at: string;
}

export function useHosixCajas() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // CAJAS CRUD
  const { data: cajas = [], isLoading: cajasLoading } = useQuery({
    queryKey: ['hosix_cajas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_cajas')
        .select('*')
        .order('codigo');
      if (error) throw error;
      return data as Caja[];
    }
  });

  const crearCajaMutation = useMutation({
    mutationFn: async (data: Omit<Caja, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('hosix_cajas').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_cajas'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al crear caja');
    }
  });

  const actualizarCajaMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Caja> & { id: string }) => {
      const { error } = await supabase
        .from('hosix_cajas')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_cajas'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al actualizar caja');
    }
  });

  // TURNOS CRUD
  const { data: turnos = [], isLoading: turnosLoading } = useQuery({
    queryKey: ['hosix_cajas_turnos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_cajas_turnos')
        .select('*')
        .order('fecha_inicio', { ascending: false });
      if (error) throw error;
      return data as TurnoCaja[];
    }
  });

  const abrirturnoMutation = useMutation({
    mutationFn: async (data: Omit<TurnoCaja, 'id' | 'created_at' | 'updated_at' | 'fecha_cierre' | 'saldo_cierre'>) => {
      const { error } = await supabase.from('hosix_cajas_turnos').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_cajas_turnos'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al abrir turno');
    }
  });

  const cerrarturnoMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; saldo_cierre: number; fecha_cierre: string; estado: string }) => {
      const { error } = await supabase
        .from('hosix_cajas_turnos')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_cajas_turnos'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al cerrar turno');
    }
  });

  // MOVIMIENTOS CRUD
  const { data: movimientos = [], isLoading: movimientosLoading } = useQuery({
    queryKey: ['hosix_cajas_movimientos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_cajas_movimientos')
        .select('*')
        .order('fecha_movimiento', { ascending: false });
      if (error) throw error;
      return data as MovimientoCaja[];
    }
  });

  const registrarMovimientoMutation = useMutation({
    mutationFn: async (data: Omit<MovimientoCaja, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('hosix_cajas_movimientos').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_cajas_movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['hosix_cajas_turnos'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al registrar movimiento');
    }
  });

  // FORMAS DE PAGO
  const { data: formasPago = [], isLoading: formasLoading } = useQuery({
    queryKey: ['hosix_cajas_formas_pago'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_cajas_formas_pago')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data as FormaPago[];
    }
  });

  // CIERRES
  const { data: cierres = [], isLoading: cierresLoading } = useQuery({
    queryKey: ['hosix_cajas_cierres'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_cajas_cierres')
        .select('*')
        .order('fecha_cierre', { ascending: false });
      if (error) throw error;
      return data as CierreCaja[];
    }
  });

  const crearCierreMutation = useMutation({
    mutationFn: async (data: Omit<CierreCaja, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('hosix_cajas_cierres').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_cajas_cierres'] });
      queryClient.invalidateQueries({ queryKey: ['hosix_cajas_turnos'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al crear cierre');
    }
  });

  const actualizarCierreMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CierreCaja> & { id: string }) => {
      const { error } = await supabase
        .from('hosix_cajas_cierres')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_cajas_cierres'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al actualizar cierre');
    }
  });

  // ARQUEOS
  const { data: arqueos = [], isLoading: arqueosLoading } = useQuery({
    queryKey: ['hosix_cajas_arqueos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_cajas_arqueos')
        .select('*')
        .order('fecha_arqueo', { ascending: false });
      if (error) throw error;
      return data as ArqueooCaja[];
    }
  });

  const crearArqueoMutation = useMutation({
    mutationFn: async (data: Omit<ArqueooCaja, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('hosix_cajas_arqueos').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_cajas_arqueos'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al crear arqueo');
    }
  });

  const actualizarArqueoMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ArqueooCaja> & { id: string }) => {
      const { error } = await supabase
        .from('hosix_cajas_arqueos')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_cajas_arqueos'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al actualizar arqueo');
    }
  });

  // Funciones auxiliares para cálculos
  const calcularSaldoTeorico = (saldoApertura: number, cobros: number, pagos: number) => {
    return saldoApertura + cobros - pagos;
  };

  const calcularDiferencia = (saldoReal: number, saldoTeorico: number) => {
    return saldoReal - saldoTeorico;
  };

  const calcularTotalArqueo = (arqueo: Partial<ArqueooCaja>) => {
    const efectivo = (arqueo.total_efectivo || 0);
    const cheques = (arqueo.cheques_monto || 0);
    const tarjetas = (arqueo.tarjetas_monto || 0);
    return efectivo + cheques + tarjetas;
  };

  return {
    // Cajas
    cajas,
    cajasLoading,
    crearCaja: crearCajaMutation.mutate,
    actualizarCaja: actualizarCajaMutation.mutate,
    crearCajaLoading: crearCajaMutation.isPending,
    
    // Turnos
    turnos,
    turnosLoading,
    abrirTurno: abrirturnoMutation.mutate,
    cerrarTurno: cerrarturnoMutation.mutate,
    abrirTurnoLoading: abrirturnoMutation.isPending,
    cerrarTurnoLoading: cerrarturnoMutation.isPending,
    
    // Movimientos
    movimientos,
    movimientosLoading,
    registrarMovimiento: registrarMovimientoMutation.mutate,
    registrarMovimientoLoading: registrarMovimientoMutation.isPending,
    
    // Formas de pago
    formasPago,
    formasLoading,
    
    // Cierres
    cierres,
    cierresLoading,
    crearCierre: crearCierreMutation.mutate,
    actualizarCierre: actualizarCierreMutation.mutate,
    crearCierreLoading: crearCierreMutation.isPending,
    
    // Arqueos
    arqueos,
    arqueosLoading,
    crearArqueo: crearArqueoMutation.mutate,
    actualizarArqueo: actualizarArqueoMutation.mutate,
    crearArqueoLoading: crearArqueoMutation.isPending,
    
    // Funciones auxiliares
    calcularSaldoTeorico,
    calcularDiferencia,
    calcularTotalArqueo,
    
    error,
    setError
  };
}
