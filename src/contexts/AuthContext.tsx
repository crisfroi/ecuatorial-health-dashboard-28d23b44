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
  switchRole: (newRole: UserRole) => void; // Para testing y demo
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
  defaultRole?: UserRole; // Para demo y desarrollo
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  defaultRole = 'SUPER_ADMINISTRADOR' // Juan Froilan como super admin por defecto
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(defaultRole);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario real de Supabase
    const initializeAuth = async () => {
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        
        if (supabaseUser) {
          // Obtener rol desde user_metadata o asignar rol basado en email
          let role: UserRole = defaultRole;
          
          if (supabaseUser.user_metadata?.role) {
            role = supabaseUser.user_metadata.role as UserRole;
          } else {
            // Asignar rol basado en el email de Juan Froilan
            if (supabaseUser.email === 'juan.froilan@ministeriosanidad.gq' || 
                supabaseUser.email?.toLowerCase().includes('froilan') ||
                supabaseUser.email?.toLowerCase().includes('ramos') ||
                supabaseUser.email?.toLowerCase().includes('nabama')) {
              role = 'SUPER_ADMINISTRADOR';
            } else if (supabaseUser.email?.includes('admin')) {
              role = 'SUPER_ADMINISTRADOR';
            } else if (supabaseUser.email?.includes('revisor') || supabaseUser.email?.includes('comite')) {
              role = 'REVISOR_SOLICITUDES';
            } else if (supabaseUser.email?.includes('ministro') || supabaseUser.email?.includes('ministerial')) {
              role = 'PERSONALIDAD_MINISTERIAL';
            } else if (supabaseUser.email?.includes('director') || supabaseUser.email?.includes('centro')) {
              role = 'DIRECTIVO_CENTRO_SANITARIO';
            }
          }

          const userProfile: UserProfile = {
            ...supabaseUser,
            role,
            full_name: supabaseUser.user_metadata?.full_name || 
                      (supabaseUser.email === 'juan.froilan@ministeriosanidad.gq' ? 'Juan Froilan Ramos Nabama' : 
                       supabaseUser.email?.split('@')[0]),
            department: supabaseUser.user_metadata?.department || 'Ministerio de Sanidad y Bienestar Social',
            assigned_center_id: supabaseUser.user_metadata?.assigned_center_id
          };

          setUser(userProfile);
          setUserRole(role);
        } else {
          // Para desarrollo, crear usuario demo para Juan Froilan
          const mockUser: UserProfile = {
            id: 'juan-froilan-id',
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
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // En caso de error, crear usuario demo para Juan Froilan
        const mockUser: UserProfile = {
          id: 'juan-froilan-id',
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
        if (event === 'SIGNED_IN' && session?.user) {
          await initializeAuth();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserRole(null);
        }
      }
    );

    initializeAuth();

    return () => subscription.unsubscribe();
  }, [defaultRole]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // El usuario se actualizará automáticamente por el listener onAuthStateChange
        return { success: true };
      }

      return { success: false, error: 'No se pudo obtener información del usuario' };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermission = (permission: string): boolean => {
    if (!userRole) return false;
    return hasPermission(userRole, permission);
  };

  const checkTabAccess = (tab: string): boolean => {
    if (!userRole) return false;
    return canAccessTab(userRole, tab);
  };

  const getRestrictions = () => {
    if (!userRole) return {};
    return getRoleRestrictions(userRole);
  };

  const switchRole = (newRole: UserRole) => {
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
