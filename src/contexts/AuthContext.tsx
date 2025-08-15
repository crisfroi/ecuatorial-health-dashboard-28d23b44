
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
  is_active?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  userRole: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string, resource?: string, targetCenterId?: string) => boolean;
  canAccessTab: (tab: string) => boolean;
  getRestrictions: () => any;
  switchRole: (newRole: UserRole) => void;
  refreshProfile: () => Promise<void>;
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

  const loadUserProfile = async (authUser: User) => {
    try {
      // Intentar cargar perfil de la base de datos
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user profile:', error);
      }

      let userProfile: UserProfile;

      if (profile) {
        // Usuario existente con perfil en la base de datos
        userProfile = {
          ...authUser,
          role: profile.role as UserRole,
          assigned_center_id: profile.assigned_center_id,
          full_name: profile.full_name,
          department: profile.department,
          is_active: profile.is_active
        };
      } else {
        // Usuario nuevo o sin perfil - crear perfil demo
        const role = authUser.email === 'chamibeny@gmail.com' ? 'SUPER_ADMINISTRADOR' : 'OBSERVADOR';
        
        userProfile = {
          ...authUser,
          role: role as UserRole,
          full_name: authUser.user_metadata?.full_name || 
                    (authUser.email === 'chamibeny@gmail.com' ? 'Beltran Ebiole' : 
                     authUser.email?.split('@')[0]?.replace('.', ' ').toUpperCase()),
          department: 'Ministerio de Sanidad y Bienestar Social',
          is_active: true
        };

        // Intentar crear el perfil en la base de datos
        try {
          await supabase
            .from('user_profiles')
            .insert({
              id: authUser.id,
              email: authUser.email || '',
              full_name: userProfile.full_name,
              role: userProfile.role,
              department: userProfile.department,
              is_active: true
            });
        } catch (insertError) {
          console.warn('Could not create user profile in database:', insertError);
        }
      }

      setUser(userProfile);
      setUserRole(userProfile.role);
      return userProfile;
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      // Fallback para desarrollo
      const fallbackProfile: UserProfile = {
        ...authUser,
        role: 'SUPER_ADMINISTRADOR',
        full_name: 'Usuario Demo',
        department: 'Ministerio de Sanidad y Bienestar Social',
        is_active: true
      };
      setUser(fallbackProfile);
      setUserRole('SUPER_ADMINISTRADOR');
      return fallbackProfile;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await loadUserProfile(authUser);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        console.log('🔐 Inicializando autenticación...');

        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (supabaseUser) {
          console.log('👤 Usuario autenticado encontrado:', supabaseUser.email);
          await loadUserProfile(supabaseUser);
        } else {
          console.log('👤 No hay usuario autenticado, usando datos demo');
          // Create demo user for development
          const mockUser: UserProfile = {
            id: 'demo-user-id',
            email: 'chamibeny@gmail.com',
            role: 'SUPER_ADMINISTRADOR',
            full_name: 'Beltran Ebiole',
            department: 'Ministerio de Sanidad y Bienestar Social',
            is_active: true,
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
          is_active: true,
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

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event);

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ Usuario autenticado');
            await loadUserProfile(session.user);
          } else if (event === 'SIGNED_OUT') {
            console.log('👋 Usuario desconectado');
            setUser(null);
            setUserRole(null);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('🔄 Token refrescado');
            await refreshProfile();
          }
        } catch (authError) {
          console.error('⚠️ Error in auth state change:', authError);
        }
      }
    );

    initializeAuth();

    return () => subscription.unsubscribe();
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
        await loadUserProfile(data.user);
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

  const checkPermission = (permission: string, resource?: string, targetCenterId?: string): boolean => {
    if (!userRole || !user) return false;

    // Super admin siempre tiene acceso
    if (userRole === 'SUPER_ADMINISTRADOR') return true;

    // Verificar permisos específicos basados en rol
    const rolePermissions: Record<UserRole, string[]> = {
      'SUPER_ADMINISTRADOR': ['*'],
      'PERSONALIDAD_MINISTERIAL': ['view_all', 'validate', 'analytics'],
      'DIRECTIVO_CENTRO_SANITARIO': ['view', 'manage', 'create'],
      'HOSPITAL': ['view', 'manage'],
      'REVISOR_SOLICITUDES': ['view'],
      'OBSERVADOR': ['view']
    };

    const allowedPermissions = rolePermissions[userRole] || [];
    
    // Verificar si tiene el permiso
    const hasBasePermission = allowedPermissions.includes('*') || 
                             allowedPermissions.includes(permission) ||
                             allowedPermissions.includes('view_all') ||
                             allowedPermissions.includes('manage_all');

    if (!hasBasePermission) return false;

    // Verificar restricciones por centro si aplica
    if (targetCenterId && user.assigned_center_id) {
      const centerRestrictedRoles: UserRole[] = ['DIRECTIVO_CENTRO_SANITARIO', 'HOSPITAL'];
      if (centerRestrictedRoles.includes(userRole)) {
        return user.assigned_center_id === targetCenterId;
      }
    }

    return true;
  };

  const checkTabAccess = (tab: string): boolean => {
    if (!userRole) return false;
    
    const tabAccess: Record<UserRole, string[]> = {
      'SUPER_ADMINISTRADOR': ['*'],
      'PERSONALIDAD_MINISTERIAL': ['dashboard', 'professionals', 'guardias', 'nominas', 'analytics', 'reports'],
      'DIRECTIVO_CENTRO_SANITARIO': ['dashboard', 'guardias', 'nominas', 'professionals'],
      'HOSPITAL': ['dashboard', 'guardias', 'nominas', 'professionals'],
      'REVISOR_SOLICITUDES': ['dashboard', 'professionals', 'requests'],
      'OBSERVADOR': ['dashboard', 'public-search']
    };

    const allowedTabs = tabAccess[userRole] || [];
    return allowedTabs.includes('*') || allowedTabs.includes(tab);
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
    switchRole,
    refreshProfile
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
    isMinisterial: userRole === 'PERSONALIDAD_MINISTERIAL',
    isHospitalDirector: userRole === 'DIRECTIVO_CENTRO_SANITARIO',
    isHospitalNetwork: userRole === 'HOSPITAL',
    isRevisor: userRole === 'REVISOR_SOLICITUDES',
    isObserver: userRole === 'OBSERVADOR',
    assignedCenterId: user?.assigned_center_id
  };
};

export default AuthProvider;
