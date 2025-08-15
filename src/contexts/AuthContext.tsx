import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, hasPermission, canAccessTab, getRoleRestrictions } from '@/types/roles';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

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
  const [userRole, setUserRole] = useState<UserRole | null>('SUPER_ADMINISTRADOR'); // Forzar SUPER_ADMINISTRADOR por defecto
  const [isLoading, setIsLoading] = useState(false); // Cambiar a false para no bloquear

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Inicializando autenticación...');

        // Clear any invalid tokens first
        try {
          await supabase.auth.signOut();
          console.log('🧹 Cleared any existing invalid sessions');
        } catch (clearError) {
          console.log('⚠️ Could not clear existing session:', clearError);
        }

        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (supabaseUser) {
          console.log('👤 Usuario autenticado encontrado:', supabaseUser.email);

          // Get role from metadata or assign based on email
          let role: UserRole = defaultRole;

          if (supabaseUser.user_metadata?.role) {
            role = supabaseUser.user_metadata.role as UserRole;
          } else {
            const email = supabaseUser.email?.toLowerCase() || '';

            if (email === 'chamibeny@gmail.com' || email.includes('chamibeny')) {
              role = 'SUPER_ADMINISTRADOR';
            } else if (email.includes('admin')) {
              role = 'SUPER_ADMINISTRADOR';
            } else {
              role = 'OBSERVADOR';
            }
          }

          const userProfile: UserProfile = {
            ...supabaseUser,
            role,
            full_name: supabaseUser.user_metadata?.full_name ||
                      (supabaseUser.email === 'chamibeny@gmail.com' ? 'Beltran Ebiole' :
                       supabaseUser.email?.split('@')[0]?.replace('.', ' ').toUpperCase()),
            department: supabaseUser.user_metadata?.department || 'Ministerio de Sanidad y Bienestar Social'
          };

          setUser(userProfile);
          setUserRole(role);
        } else {
          console.log('👤 No hay usuario autenticado, usando datos demo');
          // Create demo user for development
          const mockUser: UserProfile = {
            id: 'demo-user-id',
            email: 'chamibeny@gmail.com',
            role: 'SUPER_ADMINISTRADOR',
            full_name: 'Beltran Ebiole',
            department: 'Ministerio de Sanidad y Bienestar Social',
            aud: 'authenticated',
            app_metadata: {},
            user_metadata: {
              role: 'SUPER_ADMINISTRADOR',
              full_name: 'Beltran Ebiole'
            },
            created_at: new Date().toISOString()
          };
          setUser(mockUser);
          setUserRole('SUPER_ADMINISTRADOR');
        }
      } catch (error) {
        console.error('❌ Error inicializando auth:', error);
        // Fallback to demo user on any error
        const fallbackUser: UserProfile = {
          id: 'fallback-user-id',
          email: 'chamibeny@gmail.com',
          role: 'SUPER_ADMINISTRADOR',
          full_name: 'Beltran Ebiole',
          department: 'Ministerio de Sanidad y Bienestar Social',
          aud: 'authenticated',
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString()
        };
        setUser(fallbackUser);
        setUserRole('SUPER_ADMINISTRADOR');
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for auth state changes but handle errors gracefully
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event);

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ Usuario autenticado');
            await initializeAuth();
          } else if (event === 'SIGNED_OUT') {
            console.log('👋 Usuario desconectado');
            // Keep demo user even when signed out for development
            const demoUser: UserProfile = {
              id: 'demo-after-signout',
              email: 'chamibeny@gmail.com',
              role: 'SUPER_ADMINISTRADOR',
              full_name: 'Beltran Ebiole',
              department: 'Ministerio de Sanidad y Bienestar Social',
              aud: 'authenticated',
              app_metadata: {},
              user_metadata: {},
              created_at: new Date().toISOString()
            };
            setUser(demoUser);
            setUserRole('SUPER_ADMINISTRADOR');
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('🔄 Token refrescado');
          }
        } catch (authError) {
          console.error('⚠️ Error in auth state change:', authError);
          // Don't break the app on auth errors
        }
      }
    );

    initializeAuth();

    return () => subscription.unsubscribe();
  }, [defaultRole]);

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
        return { success: true };
      }

      return { success: false, error: 'No se pudo obtener información del usuario' };
    } catch (error: any) {
      console.error('❌ Error de conexión en login:', error);
      return { success: false, error: 'Error de conexión. Intente nuevamente.' };
    } finally {
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
    isCenterDirector: userRole === 'DIRECTIVO_CENTRO_SANITARIO',
    isHospital: userRole === 'HOSPITAL'
  };
};

export default AuthProvider;
