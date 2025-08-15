
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/roles';

/**
 * Hook especializado para control de acceso basado en roles y centros
 */
export const useRoleBasedAccess = () => {
  const { user, userRole, hasPermission } = useAuth();

  // Determinar si el usuario tiene acceso a módulos específicos
  const moduleAccess = useMemo(() => {
    if (!userRole) return {};

    const access = {
      guardias: false,
      nominas: false,
      analytics: false,
      userManagement: false,
      professionals: false,
      incidents: false,
      publicSearch: false,
      centers: false
    };

    switch (userRole) {
      case 'SUPER_ADMINISTRADOR':
        // Acceso completo a todo
        Object.keys(access).forEach(key => {
          access[key as keyof typeof access] = true;
        });
        break;

      case 'PERSONALIDAD_MINISTERIAL':
        access.guardias = true;
        access.nominas = true;
        access.analytics = true;
        access.professionals = true;
        access.incidents = true;
        access.centers = true;
        break;

      case 'DIRECTIVO_CENTRO_SANITARIO':
      case 'HOSPITAL':
        access.guardias = true;
        access.nominas = true;
        access.professionals = true;
        access.incidents = true;
        break;

      case 'REVISOR_SOLICITUDES':
        access.professionals = true;
        access.incidents = true;
        break;

      case 'OBSERVADOR':
        access.publicSearch = true;
        access.analytics = true; // Solo lectura
        break;
    }

    return access;
  }, [userRole]);

  // Obtener pestañas permitidas para el usuario
  const allowedTabs = useMemo(() => {
    const tabs: Array<{
      id: string;
      label: string;
      icon: string;
      path: string;
      roles: UserRole[];
    }> = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'Home',
        path: '/dashboard',
        roles: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO', 'HOSPITAL', 'REVISOR_SOLICITUDES', 'OBSERVADOR']
      },
      {
        id: 'professionals',
        label: 'Profesionales',
        icon: 'Users',
        path: '/dashboard/professionals',
        roles: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO', 'HOSPITAL', 'REVISOR_SOLICITUDES']
      },
      {
        id: 'guardias',
        label: 'Gestión de Guardias',
        icon: 'Shield',
        path: '/dashboard/guardias',
        roles: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO', 'HOSPITAL']
      },
      {
        id: 'nominas',
        label: 'Nóminas de Guardias',
        icon: 'Calculator',
        path: '/dashboard/nominas',
        roles: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO', 'HOSPITAL']
      },
      {
        id: 'centers',
        label: 'Centros de Salud',
        icon: 'Building2',
        path: '/dashboard/centers',
        roles: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL']
      },
      {
        id: 'incidents',
        label: 'Incidencias',
        icon: 'AlertTriangle',
        path: '/dashboard/incidents',
        roles: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO', 'HOSPITAL', 'REVISOR_SOLICITUDES']
      },
      {
        id: 'analytics',
        label: 'Análisis y Reportes',
        icon: 'BarChart3',
        path: '/dashboard/analytics',
        roles: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'OBSERVADOR']
      },
      {
        id: 'users',
        label: 'Gestión de Usuarios',
        icon: 'UserCog',
        path: '/dashboard/users',
        roles: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL']
      },
      {
        id: 'public-search',
        label: 'Búsqueda Pública',
        icon: 'Search',
        path: '/search',
        roles: ['OBSERVADOR', 'SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL']
      }
    ];

    return tabs.filter(tab => 
      userRole && tab.roles.includes(userRole)
    );
  }, [userRole]);

  // Filtrar datos según restricciones de centro
  const filterDataByCenter = useMemo(() => {
    return <T extends { centro_salud_id?: string; centroAfectado?: string; nombre_centro?: string }>(
      data: T[],
      centerField: keyof T = 'centro_salud_id'
    ): T[] => {
      if (!userRole || !data) return data;

      // Roles con restricción por centro
      const centerRestrictedRoles: UserRole[] = ['DIRECTIVO_CENTRO_SANITARIO', 'HOSPITAL'];
      
      if (centerRestrictedRoles.includes(userRole) && user?.assigned_center_id) {
        return data.filter(item => {
          const centerValue = item[centerField];
          return centerValue === user.assigned_center_id ||
                 item.centroAfectado === user.assigned_center_id ||
                 item.nombre_centro === user.assigned_center_id;
        });
      }

      return data;
    };
  }, [userRole, user]);

  // Verificar si puede acceder a un centro específico
  const canAccessCenter = (centerId: string): boolean => {
    if (!userRole) return false;
    
    // Super admin y ministerial pueden acceder a todos
    if (['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole)) {
      return true;
    }

    // Roles con restricción por centro
    if (['DIRECTIVO_CENTRO_SANITARIO', 'HOSPITAL'].includes(userRole)) {
      return user?.assigned_center_id === centerId;
    }

    return false;
  };

  // Obtener contexto del centro asignado
  const centerContext = useMemo(() => {
    if (!user?.assigned_center_id) return null;

    return {
      centerId: user.assigned_center_id,
      isRestricted: ['DIRECTIVO_CENTRO_SANITARIO', 'HOSPITAL'].includes(userRole || ''),
      canManageGuards: ['DIRECTIVO_CENTRO_SANITARIO', 'HOSPITAL'].includes(userRole || ''),
      canValidatePayrolls: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole || '')
    };
  }, [user, userRole]);

  return {
    userRole,
    user,
    moduleAccess,
    allowedTabs,
    filterDataByCenter,
    canAccessCenter,
    centerContext,
    hasPermission,
    isRestricted: ['DIRECTIVO_CENTRO_SANITARIO', 'HOSPITAL'].includes(userRole || ''),
    canManageUsers: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole || ''),
    canValidateData: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'REVISOR_SOLICITUDES'].includes(userRole || '')
  };
};

export default useRoleBasedAccess;
