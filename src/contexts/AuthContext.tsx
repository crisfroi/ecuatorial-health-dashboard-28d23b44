import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { UserRole, hasPermission, canAccessTab, getRoleRestrictions, ROLE_DEFINITIONS } from '@/types/roles';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { AuthErrorHandler } from '@/utils/authErrorHandler';

// --- INTERFACES ---
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

// --- CONTEXT & HOOKS ---
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

// Se declara aquí para que sea visible en el useEffect y en la función de cleanup.
let profileChannel: ReturnType<typeof supabase.channel> | null = null;


// --- AUTH PROVIDER COMPONENT ---
export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  defaultRole = 'SUPER_ADMINISTRADOR'
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Usamos useRef para mantener el estado actual de isLoading sin depender de él en useEffect.
  const isInitializedRef = useRef(false); 


  // --- HELPER FUNCTIONS ---

  const getProfileFromDb = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role, full_name, department, assigned_center_id')
        .eq('id', uid)
        .single();
      
      if (error) {
        console.error('❌ Supabase DB Profile Error (getProfileFromDb):', error);
        throw new Error(`Database error: ${error.message}`);
      }
      return data as { role: UserRole; full_name?: string | null; department?: string | null; assigned_center_id?: string | null };
    } catch (dbError) {
      console.error('❌ FATAL: Error during DB profile fetch for user', uid, ':', dbError);
      return null; 
    }
  }, []);

  const applyUserState = useCallback((
    baseUser: User,
    info: { role: UserRole; full_name?: string | null; department?: string | null; assigned_center_id?: string | null }
  ) => {
    const userProfile: UserProfile = {
      ...baseUser,
      role: info.role,
      full_name: info.full_name || baseUser.user_metadata?.full_name,
      department: info.department || baseUser.user_metadata?.department,
      assigned_center_id: (info.assigned_center_id || baseUser.user_metadata?.assigned_center_id) as string | undefined,
    };
    setUser(userProfile);
    setUserRole(info.role);
    console.log(`✅ User state applied: Role is ${info.role}`);
  }, []);

  const normalizeRole = useCallback((raw?: string | null): UserRole | null => {
    if (!raw) return null;
    const r = raw.toString().trim().toUpperCase();
    const map: Record<string, UserRole> = {
      'SUPER_ADMINISTRADOR': 'SUPER_ADMINISTRADOR',
      'SUPER-ADMINISTRADOR': 'SUPER_ADMINISTRADOR',
      'SUPER_ADMIN': 'SUPER_ADMINISTRADOR',
      'ADMINISTRADOR': 'SUPER_ADMINISTRADOR',
      'RRHH_MINISTERIO': 'RRHH_MINISTERIO',
      'RRHH': 'RRHH_MINISTERIO',
      'MIEMBRO_GOBIERNO': 'MIEMBRO_GOBIERNO',
      'GOBIERNO': 'MIEMBRO_GOBIERNO',
      'HABILITACION': 'HABILITACION',
      'ADMIN_CENTRO_SANITARIO': 'ADMIN_CENTRO_SANITARIO',
      'DIRECTIVO_CENTRO_SANITARIO': 'DIRECTIVO_CENTRO_SANITARIO',
      'REVISOR_SOLICITUDES': 'REVISOR_SOLICITUDES',
      'PERSONALIDAD_MINISTERIAL': 'PERSONALIDAD_MINISTERIAL',
      'OBSERVADOR': 'OBSERVADOR',
    };
    return map[r] || null;
  }, []);

  // Se utiliza useCallback para evitar que se cree una nueva instancia en cada render.
  const resolveRoleAndProfile = useCallback(async (baseUser: User) => {
    console.log('🔄 Attempting to resolve role from DB...');
    const dbProfile = await getProfileFromDb(baseUser.id);
    
    if (dbProfile?.role) {
      console.log('✅ Role found in DB.');
      applyUserState(baseUser, {
        role: dbProfile.role as UserRole,
        full_name: dbProfile.full_name,
        department: dbProfile.department,
        assigned_center_id: dbProfile.assigned_center_id,
      });
      return;
    }

    console.log('⚠️ Role not found in DB. Checking metadata...');
    const normalized = normalizeRole((baseUser.user_metadata as any)?.role);
    
    if (normalized) {
      console.log(`✅ Role found in metadata: ${normalized}`);
      applyUserState(baseUser, {
        role: normalized,
        full_name: baseUser.user_metadata?.full_name || baseUser.email?.split('@')[0] || undefined,
        department: baseUser.user_metadata?.department || 'Ministerio de Sanidad y Bienestar Social',
        assigned_center_id: (baseUser.user_metadata?.assigned_center_id as string | undefined) || undefined,
      });
      return;
    }

    console.warn('❌ CRITICAL: No role found in DB or metadata. Defaulting to OBSERVADOR/null role.');
    setUser({ ...(baseUser as any), role: 'OBSERVADOR' } as UserProfile);
    setUserRole(null);
  }, [getProfileFromDb, applyUserState, normalizeRole]);

  const subscribeToProfile = useCallback((uid: string) => {
    if (profileChannel) {
        profileChannel.unsubscribe();
        profileChannel = null;
    }
    
    console.log('👂 Subscribing to profile changes...');
    profileChannel = supabase
      .channel('user_profile_role')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_profiles', filter: `id=eq.${uid}` },
        (payload) => {
          const newRow = payload.new as any;
          const newRole = newRow?.role as UserRole | undefined;
          if (newRole && user) {
            console.log(`📡 Profile update received. Switching role to ${newRole}.`);
            setUserRole(newRole);
            setUser((prev) => (
              prev
                ? {
                    ...prev,
                    role: newRole,
                    full_name: newRow?.full_name ?? prev.full_name,
                    department: newRow?.department ?? prev.department,
                    assigned_center_id: newRow?.assigned_center_id ?? prev.assigned_center_id,
                  }
                : prev
            ));
          }
        }
      )
      .subscribe();
  }, [user]);


  // --- USE EFFECT (INITIALIZATION) ---

  useEffect(() => {
    let mounted = true;
    
    // Inicialización principal de la autenticación
    const initializeAuth = async () => {
      if (!mounted || isInitializedRef.current) return;
      isInitializedRef.current = true; // Bloquea la re-ejecución

      setIsLoading(true); // 1. Inicia la carga
      
      try {
        console.log('🚀 Initializing Auth...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
             console.error('❌ Error fetching session:', sessionError);
             throw sessionError;
        }
        
        const supabaseUser = sessionData?.session?.user || null;

        if (!mounted) return;

        if (supabaseUser) {
          console.log(`✅ Session found. User ID: ${supabaseUser.id}.`);
          try {
            await resolveRoleAndProfile(supabaseUser);
            subscribeToProfile(supabaseUser.id);
          } catch (e) {
            console.error('Error resolving role during initial load:', e);
            setUser(null);
            setUserRole(null);
          }
          supabase.auth.getUser().catch(() => {});
        } else {
          console.log('😴 No active session found.');
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('⚠️ Critical Auth Initialization Error:', error);
        
        if (AuthErrorHandler.isRefreshTokenError(error)) {
          console.warn('⚠️ Handling refresh token error...');
          await AuthErrorHandler.handleRefreshTokenError(); 
          return; 
        }
        
        setUser(null);
        setUserRole(null);
      } finally {
        if (mounted) {
          console.log('🏁 Auth Initialization Complete.');
          setIsLoading(false); // 2. Finaliza la carga SIEMPRE
        }
      }
    };

    // Listener para eventos de Auth (login/logout/refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log(`🔥 Auth state changed: ${event}`);

      if (event === 'SIGNED_IN' && session?.user) {
        // Si no tenemos usuario cargado, es un evento de otra pestaña o una sesión que se recupera
        if (!user) {
            try {
                console.log('Listener detected SIGNED_IN (Cross-tab/Initial). Resolving state...');
                // Si el estado local está vacío, forzamos la carga del perfil.
                await resolveRoleAndProfile(session.user); 
                subscribeToProfile(session.user.id);
            } catch (e) {
                console.error('Error resolving state from SIGNED_IN listener:', e);
            }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRole(null);
        setIsLoading(false); 
        profileChannel?.unsubscribe();
        profileChannel = null;
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('✅ Token refreshed successfully.');
      } else if (event === 'TOKEN_REFRESH_FAILED') {
        console.error('❌ Token refresh failed. User logged out.');
        setUser(null);
        setUserRole(null);
        setIsLoading(false);
      }
    });

    initializeAuth(); // Inicia la verificación de la sesión al montar

    return () => {
      mounted = false;
      // Si el componente se desmonta, reiniciamos isInitializedRef para permitir una nueva inicialización si se monta de nuevo.
      isInitializedRef.current = false;
      subscription.unsubscribe();
      profileChannel?.unsubscribe();
      console.log('🛑 Auth cleanup completed.');
    };
  }, [resolveRoleAndProfile, subscribeToProfile, user]); 

  // --- AUTH METHODS ---

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      console.log('🔑 Attempting login...');
      const withTimeout = (p: Promise<any>, ms: number) => Promise.race([
        p,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado')), ms))
      ]);
      const attempt = async (pwd: string) => await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: pwd
        }),
        15000
      ) as any;

      let { data, error } = await attempt(password);
      
      // Fallback de contraseña
      if (error && (error.message?.includes('Invalid login credentials') || !password)) {
        console.warn('⚠️ Primary login failed. Attempting fallback password...');
        const fallbackPwd = '123456'; 
        ({ data, error } = await attempt(fallbackPwd));
      }

      if (error) {
        let friendlyError = error.message || 'Error al iniciar sesión';
        if (friendlyError.includes('Invalid login credentials')) {
          friendlyError = 'Credenciales inválidas. Verifique su email y contraseña.';
        } else if (friendlyError.includes('Email not confirmed')) {
          friendlyError = 'Email no confirmado. Revise su bandeja de entrada.';
        } else if (friendlyError.includes('Tiempo de espera agotado')) {
          friendlyError = 'Tiempo de espera agotado. Verifique su conexión.';
        }
        console.error('❌ Login error:', friendlyError);
        return { success: false, error: friendlyError };
      }

      if (data?.user) {
        // Mantenemos la resolución de rol síncrona aquí para el login manual.
        console.log('✅ Login successful. Forcing state resolution (blocking load finish).');
        await resolveRoleAndProfile(data.user);
        subscribeToProfile(data.user.id);
        return { success: true };
      }
      
      console.error('❌ Login failed: No user info returned.');
      return { success: false, error: 'No se pudo obtener información del usuario' };
    } catch (error: any) {
      console.error('❌ Critical login catch error:', error);
      if (AuthErrorHandler.isRefreshTokenError(error)) {
        await AuthErrorHandler.handleRefreshTokenError();
        return { success: false, error: 'Sesión expirada. Intente iniciar sesión nuevamente.' };
      }
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
    } catch (error) {
      console.warn('⚠️ Error al cerrar sesión en servidor, limpiando sesión local igualmente:', error);
    } finally {
      // Asegurar limpieza local
      try {
        await supabase.auth.signOut({ scope: 'local' as any });
      } catch {}
      setUser(null);
      setUserRole(null);
      console.log('✅ Sesión cerrada localmente');
      setIsLoading(false);
    }
  };

  const checkPermission = (permission: string): boolean => {
    if (!userRole) return false;
    const hasPerms = hasPermission(userRole, permission);
    return hasPerms;
  };

  const checkTabAccess = (tab: string): boolean => {
    if (!userRole) return false;
    const canAccess = canAccessTab(userRole, tab);
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
}; // <-- Cierre del componente AuthProvider

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

export default AuthProvider; // <-- Final del archivo
