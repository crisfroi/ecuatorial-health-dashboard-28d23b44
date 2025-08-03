
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
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Inicializando autenticación...');
        
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        
        if (supabaseUser) {
          console.log('👤 Usuario autenticado encontrado:', supabaseUser.email);
          
          // Obtener rol desde user_metadata con fallbacks mejorados
          let role: UserRole = defaultRole;
          
          if (supabaseUser.user_metadata?.role) {
            role = supabaseUser.user_metadata.role as UserRole;
            console.log('🎭 Rol desde metadata:', role);
          } else {
            // Asignar rol basado en el email con lógica mejorada
            const email = supabaseUser.email?.toLowerCase() || '';
            
            if (email.includes('juan.froilan') || 
                email.includes('froilan') ||
                email.includes('ramos') ||
                email.includes('nabama') ||
                email === 'juan.froilan@ministeriosanidad.gq') {
              role = 'SUPER_ADMINISTRADOR';
              console.log('👑 Asignado rol SUPER_ADMINISTRADOR por email especial');
            } else if (email.includes('admin') || email.includes('administrador')) {
              role = 'SUPER_ADMINISTRADOR';
            } else if (email.includes('revisor') || email.includes('comite') || email.includes('evaluador')) {
              role = 'REVISOR_SOLICITUDES';
            } else if (email.includes('ministro') || email.includes('ministerial') || email.includes('secretario')) {
              role = 'PERSONALIDAD_MINISTERIAL';
            } else if (email.includes('director') || email.includes('centro') || email.includes('hospital')) {
              role = 'DIRECTIVO_CENTRO_SANITARIO';
            } else {
              role = 'OBSERVADOR'; // Rol más restrictivo por defecto
            }
            console.log('🎭 Rol asignado por email:', role);
          }

          const userProfile: UserProfile = {
            ...supabaseUser,
            role,
            full_name: supabaseUser.user_metadata?.full_name || 
                      (supabaseUser.email === 'juan.froilan@ministeriosanidad.gq' ? 'Juan Froilan Ramos Nabama' : 
                       supabaseUser.email?.split('@')[0]?.replace('.', ' ').toUpperCase()),
            department: supabaseUser.user_metadata?.department || 'Ministerio de Sanidad y Bienestar Social',
            assigned_center_id: supabaseUser.user_metadata?.assigned_center_id
          };

          setUser(userProfile);
          setUserRole(role);
          console.log('✅ Usuario configurado:', { email: userProfile.email, role });
        } else {
          console.log('👤 No hay usuario autenticado, usando datos demo');
          // Para desarrollo, crear usuario demo para Juan Froilan
          const mockUser: UserProfile = {
            id: 'juan-froilan-demo-id',
            email: 'juan.froilan@ministeriosanidad.gq',
            role: 'SUPER_ADMINISTRADOR',
            full_name: 'Juan Froilan Ramos Nabama',
            department: 'Ministerio de Sanidad y Bienestar Social',
            aud: 'authenticated',
            app_metadata: {},
            user_metadata: {
              role: 'SUPER_ADMINISTRADOR',
              full_name: 'Juan Froilan Ramos Nabama',
              department: 'Ministerio de Sanidad y Bienestar Social'
            },
            created_at: new Date().toISOString()
          };
          setUser(mockUser);
          setUserRole('SUPER_ADMINISTRADOR');
        }
      } catch (error) {
        console.error('❌ Error inicializando auth:', error);
        // En caso de error, usar usuario demo
        const mockUser: UserProfile = {
          id: 'error-fallback-id',
          email: 'juan.froilan@ministeriosanidad.gq',
          role: 'SUPER_ADMINISTRADOR',
          full_name: 'Juan Froilan Ramos Nabama',
          department: 'Ministerio de Sanidad y Bienestar Social',
          aud: 'authenticated',
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString()
        };
        setUser(mockUser);
        setUserRole('SUPER_ADMINISTRADOR');
      } finally {
        setIsLoading(false);
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
