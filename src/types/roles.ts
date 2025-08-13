/**
 * SISTEMA COMPLETO DE ROLES Y PERMISOS
 * 
 * Este archivo define todos los roles de usuario y sus permisos correspondientes
 */

export type UserRole =
  | 'SUPER_ADMINISTRADOR'
  | 'REVISOR_SOLICITUDES'
  | 'PERSONALIDAD_MINISTERIAL'
  | 'OBSERVADOR'
  | 'DIRECTIVO_CENTRO_SANITARIO'
  | 'HOSPITAL';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface RoleDefinition {
  id: UserRole;
  name: string;
  description: string;
  permissions: string[];
  dashboardTabs: string[];
  restrictions?: {
    dataFilters?: Record<string, any>;
    timeRestrictions?: string[];
    exportLimits?: number;
  };
}

// Definición completa de permisos
export const PERMISSIONS: Permission[] = [
  // PERMISOS DE VISUALIZACIÓN
  { id: 'view_dashboard', name: 'Ver Dashboard', description: 'Acceso al dashboard principal', category: 'Visualización' },
  { id: 'view_professionals', name: 'Ver Profesionales', description: 'Ver lista de profesionales registrados', category: 'Visualización' },
  { id: 'view_requests', name: 'Ver Solicitudes', description: 'Ver solicitudes de registro', category: 'Visualización' },
  { id: 'view_analytics', name: 'Ver Analíticas', description: 'Acceso a análisis avanzados', category: 'Visualización' },
  { id: 'view_centers', name: 'Ver Centros', description: 'Ver centros de salud', category: 'Visualización' },
  { id: 'view_incidents', name: 'Ver Incidencias', description: 'Ver incidencias hospitalarias y profesionales', category: 'Visualización' },
  { id: 'view_renewals', name: 'Ver Renovaciones', description: 'Ver alertas de renovación', category: 'Visualización' },
  { id: 'view_ai_chat', name: 'Ver AI Chat', description: 'Acceso al chat con IA', category: 'Visualización' },
  { id: 'view_admin_panel', name: 'Ver Panel Admin', description: 'Acceso al panel administrativo', category: 'Visualización' },
  { id: 'view_ministerial_panel', name: 'Ver Panel Ministerial', description: 'Acceso al panel ministerial', category: 'Visualización' },

  // PERMISOS DE GESTIÓN DE PROFESIONALES
  { id: 'approve_professionals', name: 'Aprobar Profesionales', description: 'Aprobar solicitudes de profesionales', category: 'Gestión Profesionales' },
  { id: 'reject_professionals', name: 'Rechazar Profesionales', description: 'Rechazar solicitudes de profesionales', category: 'Gestión Profesionales' },
  { id: 'edit_professionals', name: 'Editar Profesionales', description: 'Modificar datos de profesionales', category: 'Gestión Profesionales' },
  { id: 'delete_professionals', name: 'Eliminar Profesionales', description: 'Eliminar registros de profesionales', category: 'Gestión Profesionales' },
  { id: 'generate_carnets', name: 'Generar Carnets', description: 'Generar carnets profesionales', category: 'Gestión Profesionales' },
  { id: 'assign_centers', name: 'Asignar Centros', description: 'Asignar profesionales a centros', category: 'Gestión Profesionales' },
  { id: 'manage_renewals', name: 'Gestionar Renovaciones', description: 'Gestionar renovaciones de carnets', category: 'Gestión Profesionales' },

  // PERMISOS DE GESTIÓN DE CENTROS
  { id: 'create_centers', name: 'Crear Centros', description: 'Crear nuevos centros de salud', category: 'Gestión Centros' },
  { id: 'edit_centers', name: 'Editar Centros', description: 'Modificar información de centros', category: 'Gestión Centros' },
  { id: 'validate_centers', name: 'Validar Centros', description: 'Validar centros pendientes', category: 'Gestión Centros' },
  { id: 'assign_professionals_to_centers', name: 'Asignar Profesionales', description: 'Asignar profesionales a centros', category: 'Gestión Centros' },

  // PERMISOS DE GESTIÓN DE INCIDENCIAS
  { id: 'create_incidents', name: 'Crear Incidencias', description: 'Reportar nuevas incidencias', category: 'Gestión Incidencias' },
  { id: 'resolve_incidents', name: 'Resolver Incidencias', description: 'Resolver incidencias reportadas', category: 'Gestión Incidencias' },
  { id: 'view_all_incidents', name: 'Ver Todas las Incidencias', description: 'Ver incidencias de todos los centros', category: 'Gestión Incidencias' },
  { id: 'manage_professional_incidents', name: 'Gestionar Inc. Profesionales', description: 'Gestionar incidencias de profesionales', category: 'Gestión Incidencias' },

  // PERMISOS DE REPORTES Y EXPORTACIÓN
  { id: 'export_data', name: 'Exportar Datos', description: 'Exportar información en diferentes formatos', category: 'Reportes' },
  { id: 'generate_reports', name: 'Generar Reportes', description: 'Generar reportes estadísticos', category: 'Reportes' },
  { id: 'view_financial_data', name: 'Ver Datos Financieros', description: 'Acceso a análisis financieros', category: 'Reportes' },
  { id: 'access_audit_logs', name: 'Ver Logs de Auditoría', description: 'Acceso a registros de auditoría', category: 'Reportes' },

  // PERMISOS ADMINISTRATIVOS
  { id: 'manage_users', name: 'Gestionar Usuarios', description: 'Crear y gestionar usuarios del sistema', category: 'Administración' },
  { id: 'manage_roles', name: 'Gestionar Roles', description: 'Asignar roles y permisos', category: 'Administración' },
  { id: 'system_configuration', name: 'Configuración Sistema', description: 'Configurar parámetros del sistema', category: 'Administración' },
  { id: 'backup_restore', name: 'Backup y Restauración', description: 'Realizar copias de seguridad', category: 'Administración' },

  // PERMISOS DE AI CHAT
  { id: 'ai_chat_basic', name: 'AI Chat Básico', description: 'Consultas básicas al AI Chat', category: 'AI Chat' },
  { id: 'ai_chat_advanced', name: 'AI Chat Avanzado', description: 'Consultas avanzadas con todas las métricas', category: 'AI Chat' },
  { id: 'ai_chat_analytics', name: 'AI Chat Analíticas', description: 'Acceso a análisis predictivos', category: 'AI Chat' }
];

// Definición de roles con permisos específicos
export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  SUPER_ADMINISTRADOR: {
    id: 'SUPER_ADMINISTRADOR',
    name: 'Super Administrador',
    description: 'Acceso completo a todas las funcionalidades del sistema',
    permissions: PERMISSIONS.map(p => p.id), // TODOS los permisos
    dashboardTabs: [
      'overview',
      'professionals', 
      'requests',
      'analytics',
      'health-centers',
      'incidents',
      'renewals',
      'ai-chat',
      'admin',
      'ministerial'
    ]
  },

  REVISOR_SOLICITUDES: {
    id: 'REVISOR_SOLICITUDES',
    name: 'Revisor de Solicitudes / Comité Evaluador',
    description: 'Encargado de revisar, aprobar o rechazar solicitudes de profesionales',
    permissions: [
      'view_dashboard',
      'view_professionals',
      'view_requests',
      'view_analytics',
      'view_centers',
      'view_incidents',
      'approve_professionals',
      'reject_professionals',
      'edit_professionals',
      'generate_carnets',
      'manage_renewals',
      'create_incidents',
      'resolve_incidents',
      'view_all_incidents',
      'manage_professional_incidents',
      'export_data',
      'generate_reports',
      'ai_chat_basic',
      'ai_chat_advanced'
    ],
    dashboardTabs: [
      'overview',
      'professionals',
      'requests',
      'analytics',
      'health-centers',
      'incidents',
      'renewals',
      'ai-chat'
    ]
  },

  PERSONALIDAD_MINISTERIAL: {
    id: 'PERSONALIDAD_MINISTERIAL',
    name: 'Personalidad Ministerial',
    description: 'Alto cargo ministerial con acceso a información estratégica y reportes ejecutivos',
    permissions: [
      'view_dashboard',
      'view_professionals',
      'view_requests',
      'view_analytics',
      'view_centers',
      'view_incidents',
      'view_renewals',
      'view_ai_chat',
      'view_ministerial_panel',
      'generate_reports',
      'view_financial_data',
      'export_data',
      'access_audit_logs',
      'ai_chat_advanced',
      'ai_chat_analytics'
    ],
    dashboardTabs: [
      'overview',
      'analytics',
      'ministerial',
      'professionals',
      'health-centers',
      'ai-chat'
    ],
    restrictions: {
      // Solo puede ver datos agregados, no detalles individuales sensibles
      dataFilters: {
        hidePersonalDetails: true,
        aggregatedDataOnly: true
      }
    }
  },

  OBSERVADOR: {
    id: 'OBSERVADOR',
    name: 'Observador',
    description: 'Acceso de solo lectura para monitoreo y consulta de información',
    permissions: [
      'view_dashboard',
      'view_professionals',
      'view_requests',
      'view_analytics',
      'view_centers',
      'view_incidents',
      'view_renewals',
      'ai_chat_basic'
    ],
    dashboardTabs: [
      'overview',
      'professionals',
      'analytics',
      'health-centers',
      'ai-chat'
    ],
    restrictions: {
      dataFilters: {
        readOnly: true,
        hidePersonalDetails: true
      },
      exportLimits: 100 // Límite de registros por exportación
    }
  },

  DIRECTIVO_CENTRO_SANITARIO: {
    id: 'DIRECTIVO_CENTRO_SANITARIO',
    name: 'Directivo de Centro Sanitario',
    description: 'Director o administrador de un centro de salud específico',
    permissions: [
      'view_dashboard',
      'view_professionals',
      'view_centers',
      'view_incidents',
      'edit_centers',
      'assign_professionals_to_centers',
      'create_incidents',
      'resolve_incidents',
      'export_data',
      'ai_chat_basic'
    ],
    dashboardTabs: [
      'overview',
      'professionals',
      'health-centers',
      'incidents',
      'ai-chat'
    ],
    restrictions: {
      dataFilters: {
        // Solo puede ver datos de su centro asignado
        centerRestricted: true,
        onlyAssignedCenter: true
      }
    }
  }
};

// Funciones de utilidad para verificar permisos
export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  const role = ROLE_DEFINITIONS[userRole];
  return role.permissions.includes(permission);
};

export const canAccessTab = (userRole: UserRole, tab: string): boolean => {
  const role = ROLE_DEFINITIONS[userRole];
  return role.dashboardTabs.includes(tab);
};

export const getUserPermissions = (userRole: UserRole): Permission[] => {
  const role = ROLE_DEFINITIONS[userRole];
  return PERMISSIONS.filter(p => role.permissions.includes(p.id));
};

export const getRoleRestrictions = (userRole: UserRole | null) => {
  if (!userRole || !ROLE_DEFINITIONS[userRole]) {
    return {};
  }
  return ROLE_DEFINITIONS[userRole].restrictions || {};
};

// Vista específica para cada rol en el dashboard
export const ROLE_DASHBOARD_VIEWS: Record<UserRole, {
  defaultTab: string;
  featuredCards: string[];
  hiddenSections: string[];
}> = {
  SUPER_ADMINISTRADOR: {
    defaultTab: 'overview',
    featuredCards: ['total_professionals', 'pending_requests', 'system_health', 'recent_activity'],
    hiddenSections: []
  },
  REVISOR_SOLICITUDES: {
    defaultTab: 'requests',
    featuredCards: ['pending_requests', 'approved_today', 'rejected_requests', 'urgent_requests'],
    hiddenSections: ['financial_data', 'system_logs']
  },
  PERSONALIDAD_MINISTERIAL: {
    defaultTab: 'analytics',
    featuredCards: ['total_professionals', 'coverage_statistics', 'monthly_trends', 'performance_metrics'],
    hiddenSections: ['individual_professional_details', 'personal_data']
  },
  OBSERVADOR: {
    defaultTab: 'overview',
    featuredCards: ['total_professionals', 'basic_statistics', 'public_information'],
    hiddenSections: ['personal_data', 'financial_data', 'audit_logs', 'admin_functions']
  },
  DIRECTIVO_CENTRO_SANITARIO: {
    defaultTab: 'health-centers',
    featuredCards: ['center_professionals', 'center_incidents', 'center_statistics', 'assigned_staff'],
    hiddenSections: ['other_centers', 'global_admin', 'ministerial_data']
  }
};

export default ROLE_DEFINITIONS;
