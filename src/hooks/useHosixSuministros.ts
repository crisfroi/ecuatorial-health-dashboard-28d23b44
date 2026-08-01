import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';
import { useState } from 'react';
import { toast } from 'sonner';

// ============================================
// INTERFACES Y TIPOS
// ============================================

export interface Familia {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Grupo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  familia_id: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnidadDosis {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  simbolo?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnidadCompra {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  cantidad_unidades_basicas: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnidadDispensacion {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  cantidad_unidades_basicas: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ubicacion {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo?: string;
  temperatura_minima?: number;
  temperatura_maxima?: number;
  humedad_minima?: number;
  humedad_maxima?: number;
  capacidad_items?: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TipoEnvase {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  capacidad?: number;
  unidad_capacidad?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Articulo {
  id: string;
  codigo: string;
  codigo_barras?: string;
  nombre: string;
  descripcion?: string;
  familia_id?: string;
  grupo_id?: string;
  es_medicamento: boolean;
  nombre_comercial?: string;
  principio_activo?: string;
  concentracion?: string;
  forma_farmaceutica?: string;
  via_administracion?: string;
  unidad_dosis_id?: string;
  unidad_compra_id?: string;
  unidad_dispensacion_id?: string;
  requiere_receta: boolean;
  controlado: boolean;
  requiere_refrigeracion: boolean;
  ubicacion_principal_id?: string;
  ubicaciones_alternativas?: string[];
  proveedores?: Array<{ proveedor_id: string; codigo_proveedor: string }>;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface FamiliaFormData {
  codigo: string;
  nombre: string;
  descripcion?: string;
}

export interface GrupoFormData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  familia_id: string;
}

export interface ArticuloFormData {
  codigo: string;
  codigo_barras?: string;
  nombre: string;
  descripcion?: string;
  familia_id?: string;
  grupo_id?: string;
  es_medicamento: boolean;
  nombre_comercial?: string;
  principio_activo?: string;
  concentracion?: string;
  forma_farmaceutica?: string;
  via_administracion?: string;
  unidad_dosis_id?: string;
  unidad_compra_id?: string;
  unidad_dispensacion_id?: string;
  requiere_receta?: boolean;
  controlado?: boolean;
  requiere_refrigeracion?: boolean;
  ubicacion_principal_id?: string;
  ubicaciones_alternativas?: string[];
  proveedores?: Array<{ proveedor_id: string; codigo_proveedor: string }>;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export const useHosixSuministros = () => {
  const queryClient = useQueryClient();
  const [filtros, setFiltros] = useState<{
    busqueda?: string;
    familia_id?: string;
    grupo_id?: string;
    es_medicamento?: boolean;
    activo?: boolean;
  }>({});

  // ============================================
  // QUERIES
  // ============================================

  // Familias
  const { data: familias = [], isLoading: isLoadingFamilias } = useQuery({
    queryKey: ['familias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_articulos_familias')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data as Familia[];
    },
  });

  // Grupos
  const { data: grupos = [], isLoading: isLoadingGrupos } = useQuery({
    queryKey: ['grupos', filtros.familia_id],
    queryFn: async () => {
      let query = supabase
        .from('hosix_articulos_grupos')
        .select('*')
        .order('nombre', { ascending: true });

      if (filtros.familia_id) {
        query = query.eq('familia_id', filtros.familia_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Grupo[];
    },
  });

  // Unidades de Dosis
  const { data: unidadesDosis = [], isLoading: isLoadingUnidadesDosis } = useQuery({
    queryKey: ['unidades-dosis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_articulos_unidades_dosis')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data as UnidadDosis[];
    },
  });

  // Unidades de Compra
  const { data: unidadesCompra = [], isLoading: isLoadingUnidadesCompra } = useQuery({
    queryKey: ['unidades-compra'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_articulos_unidades_compra')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data as UnidadCompra[];
    },
  });

  // Unidades de Dispensación
  const { data: unidadesDispensacion = [], isLoading: isLoadingUnidadesDispensacion } = useQuery({
    queryKey: ['unidades-dispensacion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_articulos_unidades_dispensacion')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data as UnidadDispensacion[];
    },
  });

  // Ubicaciones
  const { data: ubicaciones = [], isLoading: isLoadingUbicaciones } = useQuery({
    queryKey: ['ubicaciones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_articulos_ubicaciones')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data as Ubicacion[];
    },
  });

  // Tipos de Envase
  const { data: tiposEnvase = [], isLoading: isLoadingTiposEnvase } = useQuery({
    queryKey: ['tipos-envase'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_articulos_tipos_envase')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data as TipoEnvase[];
    },
  });

  // Artículos
  const { data: articulos = [], isLoading: isLoadingArticulos } = useQuery({
    queryKey: ['articulos', filtros],
    queryFn: async () => {
      let query = supabase
        .from('hosix_articulos')
        .select('*')
        .order('nombre', { ascending: true });

      if (filtros.familia_id) {
        query = query.eq('familia_id', filtros.familia_id);
      }

      if (filtros.grupo_id) {
        query = query.eq('grupo_id', filtros.grupo_id);
      }

      if (filtros.es_medicamento !== undefined) {
        query = query.eq('es_medicamento', filtros.es_medicamento);
      }

      if (filtros.busqueda) {
        const search = filtros.busqueda.toLowerCase();
        query = query.or(`codigo.ilike.%${search}%,nombre.ilike.%${search}%,codigo_barras.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Articulo[];
    },
  });

  // ============================================
  // MUTATIONS - FAMILIAS
  // ============================================

  const crearFamiliaMutation = useMutation({
    mutationFn: async (formData: FamiliaFormData) => {
      const { data, error } = await supabase
        .from('hosix_articulos_familias')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;
      return data as Familia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familias'] });
      toast.success('Familia creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const actualizarFamiliaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FamiliaFormData> }) => {
      const { data: result, error } = await supabase
        .from('hosix_articulos_familias')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Familia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familias'] });
      toast.success('Familia actualizada');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // ============================================
  // MUTATIONS - GRUPOS
  // ============================================

  const crearGrupoMutation = useMutation({
    mutationFn: async (formData: GrupoFormData) => {
      const { data, error } = await supabase
        .from('hosix_articulos_grupos')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;
      return data as Grupo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos'] });
      toast.success('Grupo creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const actualizarGrupoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GrupoFormData> }) => {
      const { data: result, error } = await supabase
        .from('hosix_articulos_grupos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Grupo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos'] });
      toast.success('Grupo actualizado');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // ============================================
  // MUTATIONS - ARTÍCULOS
  // ============================================

  const crearArticuloMutation = useMutation({
    mutationFn: async (formData: ArticuloFormData) => {
      const { data, error } = await supabase
        .from('hosix_articulos')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;
      return data as Articulo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articulos'] });
      toast.success('Artículo creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const actualizarArticuloMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ArticuloFormData> }) => {
      const { data: result, error } = await supabase
        .from('hosix_articulos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Articulo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articulos'] });
      toast.success('Artículo actualizado');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const desactivarArticuloMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hosix_articulos')
        .update({ activo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articulos'] });
      toast.success('Artículo desactivado');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return {
    // Estado
    filtros,
    setFiltros,

    // Familias
    familias,
    isLoadingFamilias,
    crearFamilia: crearFamiliaMutation.mutate,
    isCreatingFamilia: crearFamiliaMutation.isPending,
    actualizarFamilia: actualizarFamiliaMutation.mutate,
    isUpdatingFamilia: actualizarFamiliaMutation.isPending,

    // Grupos
    grupos,
    isLoadingGrupos,
    crearGrupo: crearGrupoMutation.mutate,
    isCreatingGrupo: crearGrupoMutation.isPending,
    actualizarGrupo: actualizarGrupoMutation.mutate,
    isUpdatingGrupo: actualizarGrupoMutation.isPending,

    // Unidades
    unidadesDosis,
    isLoadingUnidadesDosis,
    unidadesCompra,
    isLoadingUnidadesCompra,
    unidadesDispensacion,
    isLoadingUnidadesDispensacion,

    // Ubicaciones
    ubicaciones,
    isLoadingUbicaciones,

    // Tipos de Envase
    tiposEnvase,
    isLoadingTiposEnvase,

    // Artículos
    articulos,
    isLoadingArticulos,
    crearArticulo: crearArticuloMutation.mutate,
    isCreatingArticulo: crearArticuloMutation.isPending,
    actualizarArticulo: actualizarArticuloMutation.mutate,
    isUpdatingArticulo: actualizarArticuloMutation.isPending,
    desactivarArticulo: desactivarArticuloMutation.mutate,
    isDesactivatingArticulo: desactivarArticuloMutation.isPending,
  };
};
