import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, hasPermission, canAccessTab, getRoleRestrictions, ROLE_DEFINITIONS } from '@/types/roles';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { AuthErrorHandler } from '@/utils/authErrorHandler';

interface UserProfile extends User {
  role: UserRole;
  assigned_center_id?: string;
  full_name?: string;
  department?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  userRole: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  canAccessTab: (tab: string) => boolean;
  getRestrictions: () => any;
  switchRole: (newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
  defaultRole?: UserRole;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  defaultRole = 'SUPER_ADMINISTRADOR'
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (!mounted) return;

      try {
        console.log('🔐 Inicializando autenticación...');

        // Primero intenta leer sesión local sin red para evitar errores de conexión
        const { data: sessionData } = await supabase.auth.getSession();
        const supabaseUser = sessionData?.session?.user || null;

        if (!mounted) return;

        if (supabaseUser) {
          console.log('👤 Usuario autenticado encontrado:', supabaseUser.email);

          let role: UserRole = 'SUPER_ADMINISTRADOR';
          let fullName = 'Beltran Ebiole';
          const email = supabaseUser.email?.toLowerCase() || '';

          // Asignación directa para usuarios conocidos
          if (email === 'chamibeny@gmail.com') {
            role = 'SUPER_ADMINISTRADOR';
            fullName = 'Beltran Ebiole';
          } else if (email === 'juan.froilan@ministeriosanidad.gq') {
            role = 'RRHH_MINISTERIO'; // Asignar como RRHH
            fullName = 'Juan Froilan Ramos Nabama';
          } else if (email.includes('rrhh@') || email.includes('recursos@')) {
            role = 'RRHH_MINISTERIO';
            fullName = supabaseUser.email?.split('@')[0] || 'RRHH Usuario';
          } else if (email.includes('gobierno@') || email.includes('ministro@')) {
            role = 'MIEMBRO_GOBIERNO';
            fullName = supabaseUser.email?.split('@')[0] || 'Miembro Gobierno';
          } else if (email.includes('habilitacion@')) {
            role = 'HABILITACION';
            fullName = supabaseUser.email?.split('@')[0] || 'Habilitación Usuario';
          } else if (email.includes('admin@centro') || email.includes('director@')) {
            role = 'ADMIN_CENTRO_SANITARIO';
            fullName = supabaseUser.email?.split('@')[0] || 'Admin Centro';
          } else {
            role = 'OBSERVADOR';
            fullName = supabaseUser.email?.split('@')[0] || 'Usuario';
          }

          const userProfile: UserProfile = {
            ...supabaseUser,
            role,
            full_name: fullName,
            department: 'Ministerio de Sanidad y Bienestar Social'
          };

          setUser(userProfile);
          setUserRole(role);
          console.log('✅ Usuario configurado:', { email, role, fullName });

          // Intento en segundo plano para refrescar datos del usuario desde la red (sin romper si falla)
          supabase.auth.getUser().catch((e) => {
            console.warn('⚠️ No se pudo refrescar el usuario desde la red (se mantiene sesión local):', e?.message || e);
          });
        } else {
          console.log('❌ No hay usuario autenticado');
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('❌ Error inicializando auth:', error);

        // Handle refresh token errors
        if (AuthErrorHandler.isRefreshTokenError(error)) {
          await AuthErrorHandler.handleRefreshTokenError();
          return;
        }

        setUser(null);
        setUserRole(null);
      } finally {
        if (mounted) {
          console.log('🔄 Setting isLoading(false) after initialization');
          setIsLoading(false);
        }
      }
    };

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event);

        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ Usuario autenticado en state change');

          const email = session.user.email?.toLowerCase() || '';
          let role: UserRole = 'SUPER_ADMINISTRADOR';
          let fullName = 'Beltran Ebiole';

          if (email === 'chamibeny@gmail.com') {
            role = 'SUPER_ADMINISTRADOR';
            fullName = 'Beltran Ebiole';
          } else if (email === 'juan.froilan@ministeriosanidad.gq') {
            role = 'RRHH_MINISTERIO';
            fullName = 'Juan Froilan Ramos Nabama';
          } else if (email.includes('rrhh@') || email.includes('recursos@')) {
            role = 'RRHH_MINISTERIO';
            fullName = session.user.email?.split('@')[0] || 'RRHH Usuario';
          } else if (email.includes('gobierno@') || email.includes('ministro@')) {
            role = 'MIEMBRO_GOBIERNO';
            fullName = session.user.email?.split('@')[0] || 'Miembro Gobierno';
          } else if (email.includes('habilitacion@')) {
            role = 'HABILITACION';
            fullName = session.user.email?.split('@')[0] || 'Habilitación Usuario';
          } else if (email.includes('admin@centro') || email.includes('director@')) {
            role = 'ADMIN_CENTRO_SANITARIO';
            fullName = session.user.email?.split('@')[0] || 'Admin Centro';
          } else {
            role = 'OBSERVADOR';
            fullName = session.user.email?.split('@')[0] || 'Usuario';
          }

          const userProfile: UserProfile = {
            ...session.user,
            role,
            full_name: fullName,
            department: 'Ministerio de Sanidad y Bienestar Social'
          };

          setUser(userProfile);
          setUserRole(role);
          setIsLoading(false);
          console.log('✅ Usuario configurado desde state change');
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 Usuario desconectado');
          setUser(null);
          setUserRole(null);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed successfully');
        } else if (event === 'TOKEN_REFRESH_FAILED') {
          console.error('❌ Token refresh failed - logging out user');
          setUser(null);
          setUserRole(null);
          setIsLoading(false);
        }
      }
    );

    // Solo inicializar una vez al cargar
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    console.log('🔑 Intentando login para:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        console.error('❌ Error de login:', error.message);
        let friendlyError = error.message;
        
        if (error.message.includes('Invalid login credentials')) {
          friendlyError = 'Credenciales incorrectas. Verifique su email y contraseña.';
        } else if (error.message.includes('Email not confirmed')) {
          friendlyError = 'Email no confirmado. Revise su bandeja de entrada.';
        }
        
        return { success: false, error: friendlyError };
      }

      if (data.user) {
        console.log('✅ Login exitoso para:', data.user.email);
        console.log('🔄 Setting isLoading(false) after successful login');
        return { success: true };
      }

      console.log('❌ No user data received');
      return { success: false, error: 'No se pudo obtener información del usuario' };
    } catch (error: any) {
      console.error('❌ Error de conexión en login:', error);

      // Handle refresh token errors
      if (AuthErrorHandler.isRefreshTokenError(error)) {
        await AuthErrorHandler.handleRefreshTokenError();
        return { success: false, error: 'Sesión expirada. Intente iniciar sesión nuevamente.' };
      }

      return { success: false, error: 'Error de conexión. Intente nuevamente.' };
    } finally {
      console.log('🔄 AuthContext: Setting isLoading(false) in finally block');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    console.log('👋 Cerrando sesión...');
    
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      console.log('✅ Sesión cerrada exitosamente');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermission = (permission: string): boolean => {
    if (!userRole) return false;
    const hasPerms = hasPermission(userRole, permission);
    console.log(`🔐 Checking permission '${permission}' for role '${userRole}':`, hasPerms);
    return hasPerms;
  };

  const checkTabAccess = (tab: string): boolean => {
    if (!userRole) return false;
    const canAccess = canAccessTab(userRole, tab);
    console.log(`🔐 Checking tab access '${tab}' for role '${userRole}':`, canAccess);
    return canAccess;
  };

  const getRestrictions = () => {
    return getRoleRestrictions(userRole);
  };

  const switchRole = (newRole: UserRole) => {
    console.log('🔄 Switching role from', userRole, 'to', newRole);
    setUserRole(newRole);
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  const value: AuthContextType = {
    user,
    userRole,
    isLoading,
    login,
    logout,
    hasPermission: checkPermission,
    canAccessTab: checkTabAccess,
    getRestrictions,
    switchRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para obtener información del rol actual
export const useRole = () => {
  const { user, userRole, hasPermission, canAccessTab, getRestrictions } = useAuth();
  
  return {
    currentRole: userRole,
    user,
    hasPermission,
    canAccessTab,
    restrictions: getRestrictions(),
    isAdmin: userRole === 'SUPER_ADMINISTRADOR',
    isRevisor: userRole === 'REVISOR_SOLICITUDES',
    isMinisterial: userRole === 'PERSONALIDAD_MINISTERIAL',
    isObserver: userRole === 'OBSERVADOR',
    isCenterDirector: userRole === 'DIRECTIVO_CENTRO_SANITARIO'
  };
};

export default AuthProvider;
