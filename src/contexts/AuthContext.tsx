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
  defaultRole = 'OBSERVADOR' 
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(defaultRole);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de usuario para demo
    const initializeAuth = async () => {
      try {
        // En un entorno real, aquí cargarías el usuario de Supabase
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        
        if (supabaseUser) {
          // En producción, cargarías el rol desde la base de datos
          const mockUserProfile: UserProfile = {
            ...supabaseUser,
            role: defaultRole,
            full_name: 'Usuario Demo',
            department: 'Ministerio de Sanidad'
          };
          setUser(mockUserProfile);
          setUserRole(defaultRole);
        } else {
          // Para demo, crear usuario mock
          const mockUser: UserProfile = {
            id: 'demo-user-id',
            email: 'demo@ministeriosanidad.gq',
            role: defaultRole,
            full_name: 'Usuario Demo',
            department: 'Ministerio de Sanidad',
            aud: 'authenticated',
            app_metadata: {},
            user_metadata: {},
            created_at: new Date().toISOString()
          };
          setUser(mockUser);
          setUserRole(defaultRole);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // En caso de error, mantener usuario demo
        const mockUser: UserProfile = {
          id: 'demo-user-id',
          email: 'demo@ministeriosanidad.gq',
          role: defaultRole,
          full_name: 'Usuario Demo',
          department: 'Ministerio de Sanidad',
          aud: 'authenticated',
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString()
        };
        setUser(mockUser);
        setUserRole(defaultRole);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
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
        // En producción, cargar el rol desde la base de datos
        // Por ahora, asignar rol basado en email
        let role: UserRole = 'OBSERVADOR';
        
        if (email.includes('admin')) {
          role = 'SUPER_ADMINISTRADOR';
        } else if (email.includes('revisor') || email.includes('comite')) {
          role = 'REVISOR_SOLICITUDES';
        } else if (email.includes('ministro') || email.includes('ministerial')) {
          role = 'PERSONALIDAD_MINISTERIAL';
        } else if (email.includes('director') || email.includes('centro')) {
          role = 'DIRECTIVO_CENTRO_SANITARIO';
        }

        const userProfile: UserProfile = {
          ...data.user,
          role,
          full_name: data.user.user_metadata?.full_name || 'Usuario',
          department: 'Ministerio de Sanidad'
        };

        setUser(userProfile);
        setUserRole(role);
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
