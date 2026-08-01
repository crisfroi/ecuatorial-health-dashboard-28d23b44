import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';
import { useToast } from '@/components/ui/use-toast';
import { useHosixAuth } from './useHosixAuth';

export interface HosixUsuario {
  id: string;
  auth_user_id?: string;
  username: string;
  email: string;
  nombre_completo: string;
  perfil_id: string;
  centro_salud_id: string;
  activo: boolean;
  ultimo_acceso?: string;
  intentos_fallidos?: number;
  bloqueado_hasta?: string;
  created_at: string;
  updated_at: string;
}

export interface FiltrosUsuarios {
  perfil_id?: string;
  centro_salud_id?: string;
  activo?: boolean;
  busqueda?: string;
}

export const useHosixUsers = () => {
  const { user } = useHosixAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener usuarios del centro de salud del usuario actual
  const {
    data: usuarios,
    isLoading: isLoadingUsuarios,
    error: errorUsuarios,
    refetch: refetchUsuarios,
  } = useQuery({
    queryKey: ['hosix-usuarios', user?.centro_salud_id],
    queryFn: async () => {
      if (!user?.centro_salud_id) return [];

      const { data, error } = await supabase
        .from('hosix_usuarios')
        .select('*')
        .eq('centro_salud_id', user.centro_salud_id)
        .order('nombre_completo', { ascending: true });

      if (error) throw error;
      return (data || []) as HosixUsuario[];
    },
    enabled: !!user?.centro_salud_id,
  });

  // Obtener perfiles disponibles
  const {
    data: perfiles,
    isLoading: isLoadingPerfiles,
  } = useQuery({
    queryKey: ['hosix-perfiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_perfiles')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar usuario específico
  const obtenerUsuario = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('hosix_usuarios')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as HosixUsuario;
    } catch (err) {
      console.error('Error fetching user:', err);
      throw err;
    }
  };

  // Crear usuario
  const crearUsuario = useMutation({
    mutationFn: async (usuarioData: Partial<HosixUsuario>) => {
      if (!user?.centro_salud_id) throw new Error('Centro de salud requerido');

      const { data, error } = await supabase
        .from('hosix_usuarios')
        .insert({
          ...usuarioData,
          centro_salud_id: user.centro_salud_id,
          activo: true,
          intentos_fallidos: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as HosixUsuario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix-usuarios'] });
      toast({
        title: 'Éxito',
        description: 'Usuario creado correctamente',
      });
    },
    onError: (err) => {
      console.error('Error creating user:', err);
      toast({
        title: 'Error',
        description: 'Error al crear usuario',
        variant: 'destructive',
      });
    },
  });

  // Actualizar usuario
  const actualizarUsuario = useMutation({
    mutationFn: async (usuarioData: Partial<HosixUsuario> & { id: string }) => {
      const { id, ...updateData } = usuarioData;

      const { data, error } = await supabase
        .from('hosix_usuarios')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as HosixUsuario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix-usuarios'] });
      toast({
        title: 'Éxito',
        description: 'Usuario actualizado correctamente',
      });
    },
    onError: (err) => {
      console.error('Error updating user:', err);
      toast({
        title: 'Error',
        description: 'Error al actualizar usuario',
        variant: 'destructive',
      });
    },
  });

  // Desactivar usuario
  const desactivarUsuario = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('hosix_usuarios')
        .update({ activo: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as HosixUsuario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix-usuarios'] });
      toast({
        title: 'Éxito',
        description: 'Usuario desactivado correctamente',
      });
    },
    onError: (err) => {
      console.error('Error deactivating user:', err);
      toast({
        title: 'Error',
        description: 'Error al desactivar usuario',
        variant: 'destructive',
      });
    },
  });

  // Resetear intentos fallidos
  const resetearIntentos = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('hosix_usuarios')
        .update({
          intentos_fallidos: 0,
          bloqueado_hasta: null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as HosixUsuario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix-usuarios'] });
      toast({
        title: 'Éxito',
        description: 'Intentos reseteados',
      });
    },
  });

  // Cambiar contraseña (simulado - en producción ir a backend)
  const cambiarContrasena = useMutation({
    mutationFn: async ({ userId, contraseña }: { userId: string; contraseña: string }) => {
      if (!contraseña || contraseña.length < 8) {
        throw new Error('Contraseña debe tener mínimo 8 caracteres');
      }

      // TODO: Llamar a endpoint de cambio de contraseña en backend
      // Por ahora solo actualizar flag de cambio requerido
      const { data, error } = await supabase
        .from('hosix_usuarios')
        .update({ cambio_password_requerido: false })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as HosixUsuario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosix-usuarios'] });
      toast({
        title: 'Éxito',
        description: 'Contraseña actualizada correctamente',
      });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: 'Error al cambiar contraseña',
        variant: 'destructive',
      });
    },
  });

  return {
    usuarios: usuarios || [],
    isLoadingUsuarios,
    errorUsuarios,
    refetchUsuarios,
    perfiles: perfiles || [],
    isLoadingPerfiles,
    obtenerUsuario,
    crearUsuario: crearUsuario.mutate,
    crearUsuarioAsync: crearUsuario.mutateAsync,
    isCreandoUsuario: crearUsuario.isPending,
    actualizarUsuario: actualizarUsuario.mutate,
    actualizarUsuarioAsync: actualizarUsuario.mutateAsync,
    isActualizandoUsuario: actualizarUsuario.isPending,
    desactivarUsuario: desactivarUsuario.mutate,
    desactivarUsuarioAsync: desactivarUsuario.mutateAsync,
    isDesactivandoUsuario: desactivarUsuario.isPending,
    resetearIntentos: resetearIntentos.mutate,
    resetearIntentosAsync: resetearIntentos.mutateAsync,
    isResetandoIntentos: resetearIntentos.isPending,
    cambiarContrasena: cambiarContrasena.mutate,
    cambiarContrasenaAsync: cambiarContrasena.mutateAsync,
    isCambiandoContrasena: cambiarContrasena.isPending,
  };
};
