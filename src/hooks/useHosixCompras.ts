import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';
import { useToast } from './use-toast';
import { UUID } from 'crypto';

interface Presupuesto {
  id: string;
  numero_presupuesto: string;
  centro_coste_id: string;
  anio_presupuestario: number;
  monto_total: number;
  monto_utilizado: number;
  monto_disponible: number;
  estado: string;
  created_at: string;
  updated_at: string;
}

interface Licitacion {
  id: string;
  numero_licitacion: string;
  presupuesto_id: string;
  titulo: string;
  descripcion: string;
  fecha_apertura: string;
  fecha_cierre: string;
  presupuesto_estimado: number;
  estado: string;
  created_at: string;
  updated_at: string;
}

interface Oferta {
  id: string;
  licitacion_id: string;
  proveedor_id: string;
  numero_oferta: string;
  fecha_presentacion: string;
  monto_total: number;
  monto_final: number;
  puntuacion_tecnica: number;
  puntuacion_precio: number;
  puntuacion_total: number;
  estado: string;
  created_at: string;
  updated_at: string;
}

interface Adjudicacion {
  id: string;
  numero_adjudicacion: string;
  licitacion_id: string;
  oferta_adjudicada_id: string;
  proveedor_adjudicado_id: string;
  monto_adjudicado: number;
  estado: string;
  created_at: string;
  updated_at: string;
}

export const useHosixCompras = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ============================================
  // PRESUPUESTOS
  // ============================================

  const presupuestosQuery = useQuery({
    queryKey: ['hosix-presupuestos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_presupuestos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Presupuesto[];
    },
  });

  const crearPresupuestoMutation = useMutation({
    mutationFn: async (presupuesto: Omit<Presupuesto, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hosix_presupuestos')
        .insert([presupuesto])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix-presupuestos'] });
      toast({ title: 'Presupuesto creado exitosamente' });
    },
    onError: (error) => {
      toast({
        title: 'Error al crear presupuesto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const actualizarPresupuestoMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Presupuesto> & { id: string }) => {
      const { data, error } = await supabase
        .from('hosix_presupuestos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix-presupuestos'] });
      toast({ title: 'Presupuesto actualizado' });
    },
    onError: (error) => {
      toast({
        title: 'Error al actualizar presupuesto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ============================================
  // LICITACIONES
  // ============================================

  const licitacionesQuery = useQuery({
    queryKey: ['hosix-licitaciones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_licitaciones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Licitacion[];
    },
  });

  const crearLicitacionMutation = useMutation({
    mutationFn: async (licitacion: Omit<Licitacion, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hosix_licitaciones')
        .insert([licitacion])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix-licitaciones'] });
      toast({ title: 'Licitación creada exitosamente' });
    },
    onError: (error) => {
      toast({
        title: 'Error al crear licitación',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const actualizarLicitacionMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Licitacion> & { id: string }) => {
      const { data, error } = await supabase
        .from('hosix_licitaciones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix-licitaciones'] });
      toast({ title: 'Licitación actualizada' });
    },
    onError: (error) => {
      toast({
        title: 'Error al actualizar licitación',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ============================================
  // OFERTAS
  // ============================================

  const ofertasQuery = useQuery({
    queryKey: ['hosix-ofertas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_licitaciones_ofertas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Oferta[];
    },
  });

  const crearOfertaMutation = useMutation({
    mutationFn: async (oferta: Omit<Oferta, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hosix_licitaciones_ofertas')
        .insert([oferta])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix-ofertas'] });
      toast({ title: 'Oferta registrada exitosamente' });
    },
    onError: (error) => {
      toast({
        title: 'Error al registrar oferta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const evaluarOfertaMutation = useMutation({
    mutationFn: async ({
      id,
      puntuacion_tecnica,
      puntuacion_precio,
    }: {
      id: string;
      puntuacion_tecnica: number;
      puntuacion_precio: number;
    }) => {
      const { data, error } = await supabase
        .from('hosix_licitaciones_ofertas')
        .update({
          puntuacion_tecnica,
          puntuacion_precio,
          estado: 'evaluada',
          fecha_evaluacion: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix-ofertas'] });
      toast({ title: 'Oferta evaluada exitosamente' });
    },
    onError: (error) => {
      toast({
        title: 'Error al evaluar oferta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ============================================
  // ADJUDICACIONES
  // ============================================

  const adjudicacionesQuery = useQuery({
    queryKey: ['hosix-adjudicaciones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_adjudicaciones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Adjudicacion[];
    },
  });

  const crearAdjudicacionMutation = useMutation({
    mutationFn: async (adjudicacion: Omit<Adjudicacion, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hosix_adjudicaciones')
        .insert([adjudicacion])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix-adjudicaciones'] });
      toast({ title: 'Adjudicación registrada exitosamente' });
    },
    onError: (error) => {
      toast({
        title: 'Error al registrar adjudicación',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    // Presupuestos
    presupuestos: presupuestosQuery.data || [],
    presupuestosLoading: presupuestosQuery.isLoading,
    presupuestosError: presupuestosQuery.error,
    crearPresupuesto: crearPresupuestoMutation.mutate,
    actualizarPresupuesto: actualizarPresupuestoMutation.mutate,
    
    // Licitaciones
    licitaciones: licitacionesQuery.data || [],
    licitacionesLoading: licitacionesQuery.isLoading,
    licitacionesError: licitacionesQuery.error,
    crearLicitacion: crearLicitacionMutation.mutate,
    actualizarLicitacion: actualizarLicitacionMutation.mutate,
    
    // Ofertas
    ofertas: ofertasQuery.data || [],
    ofertasLoading: ofertasQuery.isLoading,
    ofertasError: ofertasQuery.error,
    crearOferta: crearOfertaMutation.mutate,
    evaluarOferta: evaluarOfertaMutation.mutate,
    
    // Adjudicaciones
    adjudicaciones: adjudicacionesQuery.data || [],
    adjudicacionesLoading: adjudicacionesQuery.isLoading,
    adjudicacionesError: adjudicacionesQuery.error,
    crearAdjudicacion: crearAdjudicacionMutation.mutate,
  };
};
