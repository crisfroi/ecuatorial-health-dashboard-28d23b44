import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface HosixUser {
  id: string;
  username: string;
  email: string;
  nombre_completo: string;
  perfil_id: string;
  centro_salud_id: string;
  activo: boolean;
  ultimo_acceso?: string;
}

export interface HosixAuthState {
  user: HosixUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export const useHosixAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authState, setAuthState] = useState<HosixAuthState>({
    user: null,
    isLoading: true,
    error: null,
    isAuthenticated: false,
  });

  // Restaurar sesión al montar
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const sessionStr = localStorage.getItem('hosix_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session.user && session.expiresAt) {
            const expiresAt = new Date(session.expiresAt);
            if (expiresAt > new Date()) {
              setAuthState({
                user: session.user,
                isLoading: false,
                error: null,
                isAuthenticated: true,
              });
              return;
            } else {
              // Sesión expirada
              localStorage.removeItem('hosix_session');
            }
          }
        }
        setAuthState(prev => ({ ...prev, isLoading: false }));
      } catch (err) {
        console.error('Error restoring session:', err);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('hosix_usuarios')
        .select('*')
        .eq('username', username)
        .eq('activo', true)
        .single();

      if (error || !data) {
        throw new Error('Usuario o contraseña incorrectos');
      }

      // TODO: Validar contraseña con hash en backend
      // Por ahora, esto es una validación simple
      if (!password) {
        throw new Error('Contraseña requerida');
      }

      // Verificar si usuario está bloqueado por intentos fallidos
      const intentosFallidos = data.intentos_fallidos || 0;
      if (intentosFallidos >= 3 && data.bloqueado_hasta) {
        const bloqueadoHasta = new Date(data.bloqueado_hasta);
        if (bloqueadoHasta > new Date()) {
          throw new Error(`Usuario bloqueado. Intente más tarde.`);
        }
      }

      // Crear sesión
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8); // 8 horas de sesión

      const user: HosixUser = {
        id: data.id,
        username: data.username,
        email: data.email,
        nombre_completo: data.nombre_completo,
        perfil_id: data.perfil_id,
        centro_salud_id: data.centro_salud_id,
        activo: data.activo,
      };

      // Actualizar último acceso
      await supabase
        .from('hosix_usuarios')
        .update({ 
          ultimo_acceso: new Date().toISOString(),
          intentos_fallidos: 0
        })
        .eq('id', data.id);

      // Guardar sesión
      localStorage.setItem(
        'hosix_session',
        JSON.stringify({ user, expiresAt: expiresAt.toISOString() })
      );

      setAuthState({
        user,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      });

      toast({
        title: 'Bienvenido',
        description: `Bienvenido ${user.nombre_completo}`,
      });

      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      throw err;
    }
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      localStorage.removeItem('hosix_session');
      setAuthState({
        user: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      });

      toast({
        title: 'Sesión cerrada',
        description: 'Ha cerrado sesión correctamente',
      });

      navigate('/hosix/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  }, [navigate, toast]);

  const requireLogin = useCallback(() => {
    if (!authState.isAuthenticated) {
      navigate('/hosix/login');
      throw new Error('Authentication required');
    }
  }, [authState.isAuthenticated, navigate]);

  return {
    ...authState,
    login,
    logout,
    requireLogin,
  };
};
