import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/hosixClient';
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

  // Restaurar sesiÃ³n al montar
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
              // SesiÃ³n expirada
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

      if (!username) {
        throw new Error('Usuario requerido');
      }

      if (!password) {
        throw new Error('ContraseÃ±a requerida');
      }

      console.log('ðŸ” Iniciando login HOSIX para usuario:', username);

      // Llamar a la edge function hosix-auth-login
      const { data, error } = await supabase.functions.invoke('hosix-auth-login', {
        body: {
          username: username.trim(),
          password: password.trim(),
        },
      });

      console.log('ðŸ“¡ Respuesta de edge function:', { success: data?.success, error });

      if (error) {
        console.error('âŒ Error en edge function:', error);
        throw new Error(error.message || 'Error al conectar con el servidor');
      }

      if (!data?.success || !data?.user) {
        throw new Error(data?.error || 'Usuario o contraseÃ±a incorrectos');
      }

      const user: HosixUser = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        nombre_completo: data.user.nombre_completo,
        perfil_id: data.user.perfil_id,
        centro_salud_id: data.user.centro_salud_id || '',
        activo: true,
      };

      // Crear sesiÃ³n
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8);

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
        title: 'Â¡Bienvenido!',
        description: `Bienvenido ${user.nombre_completo}`,
      });

      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesiÃ³n';
      console.error('ðŸ”´ Error en login:', errorMessage, err);

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
        title: 'SesiÃ³n cerrada',
        description: 'Ha cerrado sesiÃ³n correctamente',
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

