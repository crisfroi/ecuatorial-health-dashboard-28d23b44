import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';
import { useState } from 'react';

export interface Aseguradora {
  id: string;
  codigo: string;
  nombre: string;
  tipo?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tarifa {
  id: string;
  aseguradora_id?: string;
  codigo_concepto: string;
  descripcion: string;
  precio: number;
  vigente_desde: string;
  vigente_hasta?: string;
  created_at: string;
  updated_at: string;
}

export interface CuentaFacturacion {
  id: string;
  paciente_id: string;
  episodio_id?: string;
  aseguradora_id?: string;
  numero_cuenta: string;
  estado: string;
  fecha_apertura: string;
  fecha_cierre?: string;
  total_facturado: number;
  total_pagado: number;
  saldo_pendiente: number;
  created_at: string;
  updated_at: string;
}

export interface ConceptoFacturacion {
  id: string;
  codigo: string;
  descripcion: string;
  tipo_concepto?: string;
  precio_base?: number;
  requiere_autorizar: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Factura {
  id: string;
  numero_factura: string;
  cuenta_id: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: string;
  concepto_rechazo?: string;
  created_at: string;
  updated_at: string;
}

export interface LineaFactura {
  id: string;
  factura_id: string;
  concepto_id?: string;
  concepto_texto?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
}

export interface AseguradoraFormData {
  codigo: string;
  nombre: string;
  tipo?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export interface TarifaFormData {
  aseguradora_id?: string;
  codigo_concepto: string;
  descripcion: string;
  precio: number;
  vigente_desde: string;
  vigente_hasta?: string;
}

export interface CuentaFormData {
  paciente_id: string;
  episodio_id?: string;
  aseguradora_id?: string;
  numero_cuenta: string;
}

export interface FacturaFormData {
  cuenta_id: string;
  fecha_vencimiento?: string;
  lineas: {
    concepto_id?: string;
    concepto_texto?: string;
    cantidad: number;
    precio_unitario: number;
  }[];
}

export const useHosixFacturacion = () => {
  const queryClient = useQueryClient();
  const [filtros, setFiltros] = useState<{
    busqueda?: string;
    tipo?: string;
    estado?: string;
    aseguradora_id?: string;
  }>({});

  // Generar número de factura secuencial
  const generarNumeroFactura = async (): Promise<string> => {
    const { data } = await supabase
      .from('hosix_facturas')
      .select('numero_factura')
      .order('numero_factura', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) {
      return `FAC-2025-000001`;
    }

    const ultimoNumero = data[0].numero_factura;
    const partes = ultimoNumero.split('-');
    const numero = parseInt(partes[2]) + 1;
    return `FAC-2025-${String(numero).padStart(6, '0')}`;
  };

  // Generar número de cuenta secuencial
  const generarNumeroCuenta = async (): Promise<string> => {
    const { data } = await supabase
      .from('hosix_facturacion_cuentas')
      .select('numero_cuenta')
      .order('numero_cuenta', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) {
      return `CTA-0001`;
    }

    const ultimaCuenta = data[0].numero_cuenta;
    const numero = parseInt(ultimaCuenta.split('-')[1]) + 1;
    return `CTA-${String(numero).padStart(4, '0')}`;
  };

  // Obtener aseguradoras
  const { data: aseguradoras = [], isLoading: isLoadingAseguradoras, error: errorAseguradoras } = useQuery({
    queryKey: ['aseguradoras', filtros],
    queryFn: async () => {
      let query = supabase
        .from('hosix_aseguradoras')
        .select('*')
        .order('nombre', { ascending: true });

      if (filtros.tipo) {
        query = query.eq('tipo', filtros.tipo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Aseguradora[];
    },
  });

  // Obtener tarifas
  const { data: tarifas = [], isLoading: isLoadingTarifas, error: errorTarifas } = useQuery({
    queryKey: ['tarifas', filtros],
    queryFn: async () => {
      let query = supabase
        .from('hosix_tarifas')
        .select('*')
        .order('codigo_concepto', { ascending: true });

      if (filtros.aseguradora_id) {
        query = query.eq('aseguradora_id', filtros.aseguradora_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Tarifa[];
    },
  });

  // Obtener conceptos de facturación
  const { data: conceptos = [], isLoading: isLoadingConceptos, error: errorConceptos } = useQuery({
    queryKey: ['conceptos-facturacion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_facturacion_conceptos')
        .select('*')
        .eq('activo', true)
        .order('descripcion', { ascending: true });

      if (error) throw error;
      return data as ConceptoFacturacion[];
    },
  });

  // Obtener cuentas de facturación
  const { data: cuentas = [], isLoading: isLoadingCuentas, error: errorCuentas } = useQuery({
    queryKey: ['cuentas-facturacion', filtros],
    queryFn: async () => {
      let query = supabase
        .from('hosix_facturacion_cuentas')
        .select('*')
        .order('fecha_apertura', { ascending: false });

      if (filtros.estado) {
        query = query.eq('estado', filtros.estado);
      }

      if (filtros.aseguradora_id) {
        query = query.eq('aseguradora_id', filtros.aseguradora_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CuentaFacturacion[];
    },
  });

  // Obtener facturas
  const { data: facturas = [], isLoading: isLoadingFacturas, error: errorFacturas } = useQuery({
    queryKey: ['facturas', filtros],
    queryFn: async () => {
      let query = supabase
        .from('hosix_facturas')
        .select('*')
        .order('fecha_emision', { ascending: false });

      if (filtros.estado) {
        query = query.eq('estado', filtros.estado);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Factura[];
    },
  });

  // Obtener líneas de una factura
  const obtenerLineasFactura = async (facturaId: string) => {
    const { data, error } = await supabase
      .from('hosix_facturas_lineas')
      .select('*')
      .eq('factura_id', facturaId);

    if (error) throw error;
    return data as LineaFactura[];
  };

  // Crear aseguradora
  const crearAseguradoraMutation = useMutation({
    mutationFn: async (formData: AseguradoraFormData) => {
      const { data, error } = await supabase
        .from('hosix_aseguradoras')
        .insert([
          {
            ...formData,
            activo: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as Aseguradora;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aseguradoras'] });
    },
  });

  // Actualizar aseguradora
  const actualizarAseguradoraMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AseguradoraFormData> }) => {
      const { data: result, error } = await supabase
        .from('hosix_aseguradoras')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Aseguradora;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aseguradoras'] });
    },
  });

  // Desactivar aseguradora
  const desactivarAseguradoraMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hosix_aseguradoras')
        .update({ activo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aseguradoras'] });
    },
  });

  // Crear tarifa
  const crearTarifaMutation = useMutation({
    mutationFn: async (formData: TarifaFormData) => {
      const { data, error } = await supabase
        .from('hosix_tarifas')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;
      return data as Tarifa;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarifas'] });
    },
  });

  // Actualizar tarifa
  const actualizarTarifaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TarifaFormData> }) => {
      const { data: result, error } = await supabase
        .from('hosix_tarifas')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Tarifa;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarifas'] });
    },
  });

  // Crear cuenta de facturación
  const crearCuentaMutation = useMutation({
    mutationFn: async (formData: CuentaFormData) => {
      const numero_cuenta = await generarNumeroCuenta();

      const { data, error } = await supabase
        .from('hosix_facturacion_cuentas')
        .insert([
          {
            ...formData,
            numero_cuenta,
            estado: 'abierta',
            total_facturado: 0,
            total_pagado: 0,
            saldo_pendiente: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as CuentaFacturacion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas-facturacion'] });
    },
  });

  // Cerrar cuenta de facturación
  const cerrarCuentaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hosix_facturacion_cuentas')
        .update({
          estado: 'cerrada',
          fecha_cierre: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas-facturacion'] });
    },
  });

  // Crear factura
  const crearFacturaMutation = useMutation({
    mutationFn: async (formData: FacturaFormData) => {
      const numero_factura = await generarNumeroFactura();

      // Calcular totales
      const subtotal = formData.lineas.reduce(
        (sum, linea) => sum + linea.cantidad * linea.precio_unitario,
        0
      );
      const impuesto = subtotal * 0.15; // IVA 15%
      const total = subtotal + impuesto;

      // Crear factura
      const { data: facturaData, error: facturaError } = await supabase
        .from('hosix_facturas')
        .insert([
          {
            numero_factura,
            cuenta_id: formData.cuenta_id,
            subtotal,
            impuesto,
            total,
            estado: 'emitida',
            fecha_vencimiento: formData.fecha_vencimiento,
          },
        ])
        .select()
        .single();

      if (facturaError) throw facturaError;

      // Insertar líneas de factura
      const lineasData = formData.lineas.map((linea) => ({
        factura_id: facturaData.id,
        concepto_id: linea.concepto_id,
        concepto_texto: linea.concepto_texto,
        cantidad: linea.cantidad,
        precio_unitario: linea.precio_unitario,
        subtotal: linea.cantidad * linea.precio_unitario,
      }));

      const { error: lineasError } = await supabase
        .from('hosix_facturas_lineas')
        .insert(lineasData);

      if (lineasError) throw lineasError;

      // Actualizar totales de la cuenta
      const { data: cuentaActual } = await supabase
        .from('hosix_facturacion_cuentas')
        .select('total_facturado, total_pagado, saldo_pendiente')
        .eq('id', formData.cuenta_id)
        .single();

      if (cuentaActual) {
        const nuevoTotalFacturado = (cuentaActual.total_facturado || 0) + total;
        const nuevoSaldoPendiente = nuevoTotalFacturado - (cuentaActual.total_pagado || 0);

        await supabase
          .from('hosix_facturacion_cuentas')
          .update({
            total_facturado: nuevoTotalFacturado,
            saldo_pendiente: nuevoSaldoPendiente,
          })
          .eq('id', formData.cuenta_id);
      }

      return facturaData as Factura;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['cuentas-facturacion'] });
    },
  });

  // Cambiar estado de factura
  const cambiarEstadoFacturaMutation = useMutation({
    mutationFn: async ({
      id,
      estado,
      concepto_rechazo,
    }: {
      id: string;
      estado: string;
      concepto_rechazo?: string;
    }) => {
      const { error } = await supabase
        .from('hosix_facturas')
        .update({
          estado,
          concepto_rechazo,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
    },
  });

  // Registrar pago en factura
  const registrarPagoMutation = useMutation({
    mutationFn: async ({
      factura_id,
      monto,
      forma_pago,
    }: {
      factura_id: string;
      monto: number;
      forma_pago: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();

      // Registrar movimiento de caja
      const { error: movimientoError } = await supabase
        .from('hosix_cajas_movimientos')
        .insert([
          {
            numero_movimiento: `MOV-${Date.now()}`,
            factura_id,
            tipo_movimiento: 'pago',
            forma_pago,
            monto,
            usuario_id: userData?.user?.id,
          },
        ]);

      if (movimientoError) throw movimientoError;

      // Obtener factura para actualizar cuenta
      const { data: factura } = await supabase
        .from('hosix_facturas')
        .select('cuenta_id')
        .eq('id', factura_id)
        .single();

      if (factura) {
        const { data: cuentaActual } = await supabase
          .from('hosix_facturacion_cuentas')
          .select('total_pagado, saldo_pendiente')
          .eq('id', factura.cuenta_id)
          .single();

        if (cuentaActual) {
          const nuevoTotalPagado = (cuentaActual.total_pagado || 0) + monto;
          const nuevoSaldoPendiente = (cuentaActual.saldo_pendiente || 0) - monto;

          await supabase
            .from('hosix_facturacion_cuentas')
            .update({
              total_pagado: nuevoTotalPagado,
              saldo_pendiente: Math.max(0, nuevoSaldoPendiente),
            })
            .eq('id', factura.cuenta_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['cuentas-facturacion'] });
    },
  });

  return {
    // Estado de aseguradoras
    aseguradoras,
    isLoadingAseguradoras,
    errorAseguradoras,

    // Estado de tarifas
    tarifas,
    isLoadingTarifas,
    errorTarifas,

    // Estado de conceptos
    conceptos,
    isLoadingConceptos,
    errorConceptos,

    // Estado de cuentas
    cuentas,
    isLoadingCuentas,
    errorCuentas,

    // Estado de facturas
    facturas,
    isLoadingFacturas,
    errorFacturas,

    // Filtros
    filtros,
    setFiltros,

    // Funciones
    generarNumeroFactura,
    generarNumeroCuenta,
    obtenerLineasFactura,

    // Mutaciones - Aseguradoras
    crearAseguradora: crearAseguradoraMutation.mutate,
    isCreatingAseguradora: crearAseguradoraMutation.isPending,
    actualizarAseguradora: actualizarAseguradoraMutation.mutate,
    isUpdatingAseguradora: actualizarAseguradoraMutation.isPending,
    desactivarAseguradora: desactivarAseguradoraMutation.mutate,
    isDesactivatingAseguradora: desactivarAseguradoraMutation.isPending,

    // Mutaciones - Tarifas
    crearTarifa: crearTarifaMutation.mutate,
    isCreatingTarifa: crearTarifaMutation.isPending,
    actualizarTarifa: actualizarTarifaMutation.mutate,
    isUpdatingTarifa: actualizarTarifaMutation.isPending,

    // Mutaciones - Cuentas
    crearCuenta: crearCuentaMutation.mutate,
    isCreatingCuenta: crearCuentaMutation.isPending,
    cerrarCuenta: cerrarCuentaMutation.mutate,
    isClosingCuenta: cerrarCuentaMutation.isPending,

    // Mutaciones - Facturas
    crearFactura: crearFacturaMutation.mutate,
    isCreatingFactura: crearFacturaMutation.isPending,
    cambiarEstadoFactura: cambiarEstadoFacturaMutation.mutate,
    isChangingFacturaStatus: cambiarEstadoFacturaMutation.isPending,
    registrarPago: registrarPagoMutation.mutate,
    isRegisteringPago: registrarPagoMutation.isPending,

    // Errores
    errorCrearAseguradora: crearAseguradoraMutation.error?.message,
    errorActualizarAseguradora: actualizarAseguradoraMutation.error?.message,
    errorCrearTarifa: crearTarifaMutation.error?.message,
    errorCrearCuenta: crearCuentaMutation.error?.message,
    errorCrearFactura: crearFacturaMutation.error?.message,
  };
};
