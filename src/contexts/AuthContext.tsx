import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, hasPermission, canAccessTab, getRoleRestrictions, ROLE_DEFINITIONS } from '@/types/roles';
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
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Inicializando autenticación...');

        // Primero verificar si hay una sesión activa
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          console.log('👤 Sesión activa encontrada para:', session.user.email);
          await setupUserFromAuth(session.user);
        } else {
          console.log('🔍 No hay sesión activa, verificando usuario almacenado...');

          // Intentar obtener usuario actual
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();

          if (supabaseUser) {
            console.log('👤 Usuario encontrado en auth:', supabaseUser.email);
            await setupUserFromAuth(supabaseUser);
          } else {
            console.log('❌ No se encontró usuario autenticado');
            // Redirigir al login en lugar de usar usuario demo
            setUser(null);
            setUserRole(null);
          }
        }
      } catch (error) {
        console.error('❌ Error inicializando auth:', error);
        setUser(null);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    const setupUserFromAuth = async (supabaseUser: any) => {
      try {
        let role: UserRole = defaultRole;
        const email = supabaseUser.email?.toLowerCase() || '';

        // 1. Intentar obtener el rol desde user_profiles
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('role, full_name, department, assigned_center_id, is_active')
          .eq('email', email)
          .single();

        if (userProfile && userProfile.is_active) {
          role = userProfile.role as UserRole;
          console.log('👤 Rol obtenido desde user_profiles:', role);

          const userProfileComplete: UserProfile = {
            ...supabaseUser,
            role,
            full_name: userProfile.full_name || supabaseUser.user_metadata?.full_name,
            department: userProfile.department || 'Ministerio de Sanidad y Bienestar Social',
            assigned_center_id: userProfile.assigned_center_id
          };

          setUser(userProfileComplete);
          setUserRole(role);

          console.log('✅ Usuario configurado desde BD:', {
            email: userProfileComplete.email,
            role,
            full_name: userProfileComplete.full_name,
            isValidRole: role in ROLE_DEFINITIONS
          });
          return;
        }

        // 2. Si no está en user_profiles, usar lógica de asignación por email
        console.log('⚠️ Usuario no encontrado en user_profiles, usando lógica de email');

        if (email.includes('juan.froilan') ||
            email.includes('froilan') ||
            email.includes('ramos') ||
            email.includes('nabama') ||
            email === 'juan.froilan@ministeriosanidad.gq' ||
            email === 'chamibeny@gmail.com') {
          role = 'SUPER_ADMINISTRADOR';
          console.log('👑 Asignado rol SUPER_ADMINISTRADOR por email especial');
        } else if (supabaseUser.user_metadata?.role) {
          role = supabaseUser.user_metadata.role as UserRole;
          console.log('🎭 Rol desde metadata:', role);
        } else if (email.includes('admin') || email.includes('administrador')) {
          role = 'SUPER_ADMINISTRADOR';
        } else if (email.includes('revisor') || email.includes('comite') || email.includes('evaluador')) {
          role = 'REVISOR_SOLICITUDES';
        } else if (email.includes('ministro') || email.includes('ministerial') || email.includes('secretario')) {
          role = 'PERSONALIDAD_MINISTERIAL';
        } else if (email.includes('director') || email.includes('centro') || email.includes('hospital')) {
          role = 'DIRECTIVO_CENTRO_SANITARIO';
        } else {
          role = 'OBSERVADOR';
        }

        const userProfileComplete: UserProfile = {
          ...supabaseUser,
          role,
          full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
          department: supabaseUser.user_metadata?.department || 'Ministerio de Sanidad y Bienestar Social',
          assigned_center_id: supabaseUser.user_metadata?.assigned_center_id
        };

        setUser(userProfileComplete);
        setUserRole(role);

        console.log('✅ Usuario configurado desde email logic:', {
          email: userProfileComplete.email,
          role,
          roleType: typeof role,
          isValidRole: role in ROLE_DEFINITIONS
        });
      } catch (profileError) {
        console.error('❌ Error obteniendo perfil de usuario:', profileError);
        // Fallback a rol por defecto
        const fallbackProfile: UserProfile = {
          ...supabaseUser,
          role: 'OBSERVADOR',
          full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
          department: 'Ministerio de Sanidad y Bienestar Social'
        };
        setUser(fallbackProfile);
        setUserRole('OBSERVADOR');
      }
    };

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ Usuario autenticado');
          await initializeAuth();
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 Usuario desconectado');
          setUser(null);
          setUserRole(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refrescado');
          // Mantener usuario actual pero actualizar datos si es necesario
          if (!user && session.user) {
            await initializeAuth();
          }
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
    isCenterDirector: userRole === 'DIRECTIVO_CENTRO_SANITARIO'
  };
};

export default AuthProvider;
