/**
 * SISTEMA COMPLETO DE ROLES Y PERMISOS
 * 
 * Este archivo define todos los roles de usuario y sus permisos correspondientes
 */

export type UserRole = 
  | 'SUPER_ADMINISTRADOR'
  | 'RRHH_MINISTERIO'
  | 'MIEMBRO_GOBIERNO'
  | 'HABILITACION'
  | 'ADMIN_CENTRO_SANITARIO'
  | 'REVISOR_SOLICITUDES'
  | 'PERSONALIDAD_MINISTERIAL'
  | 'OBSERVADOR'
  | 'DIRECTIVO_CENTRO_SANITARIO';

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
  { id: 'view_dynamic_forms', name: 'Ver Formularios Dinámicos', description: 'Acceso al sistema de formularios dinámicos', category: 'Visualización' },
  { id: 'manage_dynamic_forms', name: 'Gestionar Formularios Dinámicos', description: 'Crear y gestionar formularios dinámicos', category: 'Gestión Formularios' },
  { id: 'create_indicators', name: 'Crear Indicadores', description: 'Crear indicadores dinámicos para profesionales', category: 'Gestión Formularios' },

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
  { id: 'ai_chat_analytics', name: 'AI Chat Analíticas', description: 'Acceso a análisis predictivos', category: 'AI Chat' },

  // PERMISOS DE GESTIÓN DE GUARDIAS MÉDICAS
  { id: 'view_guardias', name: 'Ver Guardias', description: 'Acceso al sistema de gestión de guardias', category: 'Guardias Médicas' },
  { id: 'manage_guardias', name: 'Gestionar Guardias', description: 'Registrar y editar guardias médicas', category: 'Guardias Médicas' },
  { id: 'approve_guardias', name: 'Aprobar Guardias', description: 'Validar y aprobar guardias registradas', category: 'Guardias Médicas' },
  { id: 'generate_nominas', name: 'Generar Nóminas', description: 'Calcular y generar nóminas de guardias', category: 'Guardias Médicas' },
  { id: 'manage_payments', name: 'Gestionar Pagos', description: 'Procesar pagos de guardias médicas', category: 'Guardias Médicas' },
  { id: 'view_guardias_reports', name: 'Ver Reportes Guardias', description: 'Acceso a reportes de guardias médicas', category: 'Guardias Médicas' },
  { id: 'audit_guardias', name: 'Auditar Guardias', description: 'Acceso a auditoría del sistema de guardias', category: 'Guardias Médicas' },
  { id: 'configure_guardias', name: 'Configurar Guardias', description: 'Configurar baremos y parámetros del sistema', category: 'Guardias Médicas' }
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
      'renewals',
      'guardias',
      'analytics',
      'health-centers',
      'establecimientos',
      'incidents',
      'iachat',
      'admin',
      'ministerial',
      'traslados',
      'forms',
      'parametros',
      'disciplinary'
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
      'ai_chat_advanced',
      'view_guardias',
      'approve_guardias',
      'view_guardias_reports'
    ],
    dashboardTabs: [
      'overview',
      'professionals',
      'requests',
      'renewals',
      'guardias',
      'analytics',
      'health-centers',
      'establecimientos',
      'incidents',
      'iachat'
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
      'view_dynamic_forms',
      'manage_dynamic_forms',
      'create_indicators',
      'generate_reports',
      'view_financial_data',
      'export_data',
      'access_audit_logs',
      'ai_chat_advanced',
      'ai_chat_analytics',
      'view_guardias',
      'approve_guardias',
      'generate_nominas',
      'manage_payments',
      'view_guardias_reports',
      'audit_guardias'
    ],
    dashboardTabs: [
      'overview',
      'analytics',
      'ministerial',
      'guardias',
      'professionals',
      'health-centers',
      'iachat',
      'forms'
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
      'iachat'
    ],
    restrictions: {
      dataFilters: {
        readOnly: true,
        hidePersonalDetails: true
      },
      exportLimits: 100 // Límite de registros por exportación
    }
  },

  RRHH_MINISTERIO: {
    id: 'RRHH_MINISTERIO',
    name: 'RRHH del Ministerio',
    description: 'Departamento de Recursos Humanos con capacidad de administrar usuarios y roles',
    permissions: [
      'view_dashboard',
      'view_professionals',
      'view_requests', 
      'view_analytics',
      'view_centers',
      'view_incidents',
      'view_renewals',
      'view_admin_panel',
      'manage_users',
      'manage_roles',
      'approve_professionals',
      'reject_professionals',
      'edit_professionals',
      'create_centers',
      'edit_centers',
      'assign_centers',
      'generate_carnets',
      'manage_renewals',
      'export_data',
      'generate_reports',
      'system_configuration',
      'ai_chat_advanced',
      'view_guardias',
      'manage_guardias',
      'approve_guardias',
      'generate_nominas',
      'view_guardias_reports',
      'configure_guardias'
    ],
    dashboardTabs: [
      'overview',
      'professionals',
      'requests',
      'renewals',
      'guardias',
      'analytics',
      'health-centers',
      'establecimientos',
      'incidents',
      'iachat',
      'admin',
      'traslados',
      'parametros'
    ]
  },

  MIEMBRO_GOBIERNO: {
    id: 'MIEMBRO_GOBIERNO',
    name: 'Miembro del Gobierno',
    description: 'Alto cargo gubernamental con acceso a panel ministerial y firmas de autorización',
    permissions: [
      'view_dashboard',
      'view_professionals',
      'view_requests',
      'view_analytics',
      'view_centers',
      'view_incidents',
      'view_renewals',
      'view_ministerial_panel',
      'approve_professionals',
      'generate_reports',
      'view_financial_data',
      'export_data',
      'access_audit_logs',
      'ai_chat_advanced',
      'ai_chat_analytics',
      'view_guardias',
      'approve_guardias',
      'generate_nominas',
      'manage_payments',
      'view_guardias_reports',
      'audit_guardias'
    ],
    dashboardTabs: [
      'overview',
      'professionals',
      'requests',
      'analytics',
      'ministerial',
      'guardias',
      'health-centers',
      'incidents',
      'iachat'
    ],
    restrictions: {
      dataFilters: {
        hidePersonalDetails: false, // Pueden ver más detalles que personalidades ministeriales
        aggregatedDataOnly: false
      }
    }
  },

  HABILITACION: {
    id: 'HABILITACION',
    name: 'Habilitación',
    description: 'Encargados de validar nóminas de guardias y aprobar pagos',
    permissions: [
      'view_dashboard',
      'view_analytics',
      'view_guardias',
      'approve_guardias', 
      'generate_nominas',
      'manage_payments',
      'view_guardias_reports',
      'audit_guardias',
      'export_data',
      'generate_reports',
      'view_financial_data',
      'ai_chat_basic'
    ],
    dashboardTabs: [
      'overview',
      'guardias',
      'analytics',
      'iachat'
    ]
  },

  ADMIN_CENTRO_SANITARIO: {
    id: 'ADMIN_CENTRO_SANITARIO',
    name: 'Admin de Centro Sanitario',
    description: 'Super administrador de un centro sanitario específico con capacidad de gestionar usuarios del centro',
    permissions: [
      'view_dashboard',
      'view_professionals',
      'view_centers',
      'view_incidents',
      'edit_centers',
      'assign_professionals_to_centers',
      'create_incidents',
      'resolve_incidents',
      'manage_users', // Solo para su centro
      'manage_roles', // Solo para su centro
      'export_data',
      'ai_chat_basic',
      'view_guardias',
      'manage_guardias',
      'view_guardias_reports'
    ],
    dashboardTabs: [
      'overview',
      'professionals',
      'guardias',
      'health-centers',
      'incidents',
      'iachat',
      'admin', // Panel de admin limitado a su centro
      'traslados'
    ],
    restrictions: {
      dataFilters: {
        centerRestricted: true,
        onlyAssignedCenter: true,
        canManageOwnCenter: true
      }
    }
  },
};

// Funciones de utilidad para verificar permisos
export const hasPermission = (userRole: UserRole | null, permission: string): boolean => {
  if (!userRole || !ROLE_DEFINITIONS[userRole]) {
    console.warn('hasPermission: Invalid or null userRole:', userRole);
    return false;
  }
  const role = ROLE_DEFINITIONS[userRole];
  return role?.permissions?.includes(permission) || false;
};

export const canAccessTab = (userRole: UserRole | null, tab: string): boolean => {
  if (!userRole || !ROLE_DEFINITIONS[userRole]) {
    console.warn('canAccessTab: Invalid or null userRole:', userRole);
    return false;
  }
  const role = ROLE_DEFINITIONS[userRole];
  return role?.dashboardTabs?.includes(tab) || false;
};

export const getUserPermissions = (userRole: UserRole | null): Permission[] => {
  if (!userRole || !ROLE_DEFINITIONS[userRole]) {
    console.warn('getUserPermissions: Invalid or null userRole:', userRole);
    return [];
  }
  const role = ROLE_DEFINITIONS[userRole];
  return PERMISSIONS.filter(p => role?.permissions?.includes(p.id));
};

export const getRoleRestrictions = (userRole: UserRole | null) => {
  if (!userRole || !ROLE_DEFINITIONS[userRole]) {
    return {};
  }
  return ROLE_DEFINITIONS[userRole].restrictions || {};
};

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
  RRHH_MINISTERIO: {
    defaultTab: 'admin',
    featuredCards: ['total_users', 'pending_requests', 'center_assignments', 'role_management'],
    hiddenSections: []
  },
  MIEMBRO_GOBIERNO: {
    defaultTab: 'ministerial',
    featuredCards: ['national_coverage', 'approval_signatures', 'strategic_metrics', 'policy_impact'],
    hiddenSections: ['detailed_personal_data']
  },
  HABILITACION: {
    defaultTab: 'guardias',
    featuredCards: ['pending_nominas', 'payment_approvals', 'guardia_statistics', 'financial_summary'],
    hiddenSections: ['personal_data', 'professional_details', 'center_management']
  },
  ADMIN_CENTRO_SANITARIO: {
    defaultTab: 'overview',
    featuredCards: ['center_professionals', 'center_incidents', 'center_guardias', 'user_management'],
    hiddenSections: ['other_centers', 'global_admin', 'ministerial_data']
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
