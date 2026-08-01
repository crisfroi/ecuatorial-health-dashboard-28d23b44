import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';
import { useState } from 'react';
import { toast } from 'sonner';

// ============================================
// INTERFACES Y TIPOS
// ============================================

export interface Almacen {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  ubicacion_fisica?: string;
  area_m2?: number;
  requiere_refrigeracion: boolean;
  temperatura_minima?: number;
  temperatura_maxima?: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Deposito {
  id: string;
  almacen_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_deposito: string;
  capacidad_maxima?: number;
  unidad_capacidad?: string;
  ubicacion_relativa?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: string;
  articulo_id: string;
  almacen_id: string;
  deposito_id?: string;
  cantidad_actual: number;
  cantidad_reservada: number;
  cantidad_disponible: number;
  stock_minimo?: number;
  stock_maximo?: number;
  requiere_lote: boolean;
  requiere_caducidad: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lote {
  id: string;
  stock_id: string;
  numero_lote: string;
  cantidad_lote: number;
  fecha_vencimiento?: string;
  dias_para_vencer?: number;
  activo: boolean;
  created_at: string;
}

export interface Movimiento {
  id: string;
  articulo_id: string;
  tipo_movimiento: string;
  cantidad: number;
  unidad?: string;
  numero_lote?: string;
  motivo?: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface OrdenCompra {
  id: string;
  numero_orden: string;
  fecha_orden: string;
  fecha_esperada_entrega?: string;
  estado: string;
  total?: number;
  created_at: string;
  updated_at: string;
}

export interface Inventario {
  id: string;
  numero_inventario: string;
  almacen_id: string;
  fecha_inicio?: string;
  fecha_cierre?: string;
  estado: string;
  cantidad_articulos: number;
  diferencias_encontradas: number;
  created_at: string;
  updated_at: string;
}

export interface CentroCosto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at: string;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useHosixAlmacenes() {
  const queryClient = useQueryClient();
  const [isLoadingAlmacenes, setIsLoadingAlmacenes] = useState(false);

  // ============================================
  // QUERIES
  // ============================================

  // Obtener almacenes
  const { data: almacenes = [], isLoading: isLoadingAlmacenesQuery } = useQuery({
    queryKey: ['hosix_almacenes'],
    queryFn: async () => {
      setIsLoadingAlmacenes(true);
      const { data, error } = await supabase
        .from('hosix_almacenes')
        .select('*')
        .order('nombre');
      if (error) throw error;
      setIsLoadingAlmacenes(false);
      return data || [];
    },
  });

  // Obtener depósitos
  const { data: depositos = [] } = useQuery({
    queryKey: ['hosix_almacenes_depositos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_almacenes_depositos')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return data || [];
    },
  });

  // Obtener stock
  const { data: stock = [] } = useQuery({
    queryKey: ['hosix_stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_stock')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Obtener lotes
  const { data: lotes = [] } = useQuery({
    queryKey: ['hosix_stock_lotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_stock_lotes')
        .select('*')
        .order('fecha_vencimiento');
      if (error) throw error;
      return data || [];
    },
  });

  // Obtener movimientos
  const { data: movimientos = [] } = useQuery({
    queryKey: ['hosix_stock_movimientos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_stock_movimientos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  // Obtener órdenes de compra
  const { data: ordenesCompra = [] } = useQuery({
    queryKey: ['hosix_ordenes_compra'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_ordenes_compra')
        .select('*')
        .order('fecha_orden', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Obtener inventarios
  const { data: inventarios = [] } = useQuery({
    queryKey: ['hosix_inventarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_inventarios')
        .select('*')
        .order('fecha_inicio', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Obtener centros de coste
  const { data: centrosCosto = [] } = useQuery({
    queryKey: ['hosix_centros_coste'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_centros_coste')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return data || [];
    },
  });

  // ============================================
  // MUTATIONS - ALMACENES
  // ============================================

  const createAlmacenMutation = useMutation({
    mutationFn: async (newAlmacen: Omit<Almacen, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hosix_almacenes')
        .insert([newAlmacen])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_almacenes'] });
      toast.success('Almacén creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al crear almacén: ${error.message}`);
    },
  });

  const updateAlmacenMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Almacen> }) => {
      const { data, error } = await supabase
        .from('hosix_almacenes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_almacenes'] });
      toast.success('Almacén actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar almacén: ${error.message}`);
    },
  });

  // ============================================
  // MUTATIONS - DEPÓSITOS
  // ============================================

  const createDepositoMutation = useMutation({
    mutationFn: async (newDeposito: Omit<Deposito, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hosix_almacenes_depositos')
        .insert([newDeposito])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_almacenes_depositos'] });
      toast.success('Depósito creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al crear depósito: ${error.message}`);
    },
  });

  const updateDepositoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Deposito> }) => {
      const { data, error } = await supabase
        .from('hosix_almacenes_depositos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_almacenes_depositos'] });
      toast.success('Depósito actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar depósito: ${error.message}`);
    },
  });

  // ============================================
  // MUTATIONS - STOCK
  // ============================================

  const crearStockMutation = useMutation({
    mutationFn: async (newStock: Omit<Stock, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hosix_stock')
        .insert([newStock])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_stock'] });
      toast.success('Stock creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al crear stock: ${error.message}`);
    },
  });

  const actualizarStockMutation = useMutation({
    mutationFn: async ({
      id,
      cantidad_actual,
      cantidad_reservada,
    }: {
      id: string;
      cantidad_actual: number;
      cantidad_reservada: number;
    }) => {
      const { data, error } = await supabase
        .from('hosix_stock')
        .update({
          cantidad_actual,
          cantidad_reservada,
          fecha_ultimo_movimiento: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_stock'] });
      toast.success('Stock actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar stock: ${error.message}`);
    },
  });

  // ============================================
  // MUTATIONS - MOVIMIENTOS
  // ============================================

  const crearMovimientoMutation = useMutation({
    mutationFn: async (newMovimiento: Omit<Movimiento, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hosix_stock_movimientos')
        .insert([newMovimiento])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_stock_movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['hosix_stock'] });
      toast.success('Movimiento registrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al registrar movimiento: ${error.message}`);
    },
  });

  // ============================================
  // MUTATIONS - LOTES
  // ============================================

  const crearLoteMutation = useMutation({
    mutationFn: async (newLote: Omit<Lote, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('hosix_stock_lotes')
        .insert([newLote])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_stock_lotes'] });
      toast.success('Lote registrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al registrar lote: ${error.message}`);
    },
  });

  // ============================================
  // MUTATIONS - ÓRDENES DE COMPRA
  // ============================================

  const crearOrdenCompraMutation = useMutation({
    mutationFn: async (newOrden: Omit<OrdenCompra, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hosix_ordenes_compra')
        .insert([newOrden])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_ordenes_compra'] });
      toast.success('Orden de compra creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al crear orden de compra: ${error.message}`);
    },
  });

  const actualizarOrdenCompraMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<OrdenCompra> }) => {
      const { data, error } = await supabase
        .from('hosix_ordenes_compra')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_ordenes_compra'] });
      toast.success('Orden de compra actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar orden de compra: ${error.message}`);
    },
  });

  // ============================================
  // MUTATIONS - INVENTARIOS
  // ============================================

  const crearInventarioMutation = useMutation({
    mutationFn: async (newInventario: Omit<Inventario, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hosix_inventarios')
        .insert([newInventario])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_inventarios'] });
      toast.success('Inventario creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al crear inventario: ${error.message}`);
    },
  });

  const actualizarInventarioMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Inventario> }) => {
      const { data, error } = await supabase
        .from('hosix_inventarios')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix_inventarios'] });
      toast.success('Inventario actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar inventario: ${error.message}`);
    },
  });

  // ============================================
  // RETORNO DEL HOOK
  // ============================================

  return {
    // Datos
    almacenes,
    depositos,
    stock,
    lotes,
    movimientos,
    ordenesCompra,
    inventarios,
    centrosCosto,

    // Estados de carga
    isLoadingAlmacenes: isLoadingAlmacenes || isLoadingAlmacenesQuery,

    // Mutations - Almacenes
    createAlmacenMutation,
    updateAlmacenMutation,

    // Mutations - Depósitos
    createDepositoMutation,
    updateDepositoMutation,

    // Mutations - Stock
    crearStockMutation,
    actualizarStockMutation,

    // Mutations - Movimientos
    crearMovimientoMutation,

    // Mutations - Lotes
    crearLoteMutation,

    // Mutations - Órdenes de Compra
    crearOrdenCompraMutation,
    actualizarOrdenCompraMutation,

    // Mutations - Inventarios
    crearInventarioMutation,
    actualizarInventarioMutation,
  };
}
