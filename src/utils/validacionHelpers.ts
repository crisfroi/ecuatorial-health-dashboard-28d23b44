/**
 * Helper functions for validation (validacion) management
 * Handles mapping between frontend workflow stages and database enum values
 */

// Database enum values for etapa_validacion
export type EtapaValidacion = 'dir_medica' | 'dir_admin' | 'dir_enfermeria' | 'jefe_rrhh' | 'admin_hospital' | 'dir_gerente' | 'dg_coordinacion';

// Frontend workflow stages (for UI)
export type EtapaWorkflow = 'revision_inicial' | 'supervision_tecnica' | 'aprobacion_final';

/**
 * Maps frontend workflow stages to database enum values
 */
export const mapWorkflowToEtapa = (workflowStage: EtapaWorkflow): EtapaValidacion => {
  const mapping: Record<EtapaWorkflow, EtapaValidacion> = {
    'revision_inicial': 'dir_medica',      // Initial medical review
    'supervision_tecnica': 'jefe_rrhh',    // HR technical supervision  
    'aprobacion_final': 'dir_gerente'      // Final managerial approval
  };

  return mapping[workflowStage] || 'dir_medica';
};

/**
 * Maps database enum values back to frontend workflow stages
 */
export const mapEtapaToWorkflow = (etapa: EtapaValidacion): EtapaWorkflow => {
  const reverseMapping: Record<EtapaValidacion, EtapaWorkflow> = {
    'dir_medica': 'revision_inicial',
    'dir_admin': 'revision_inicial',
    'dir_enfermeria': 'revision_inicial',
    'jefe_rrhh': 'supervision_tecnica',
    'admin_hospital': 'supervision_tecnica',
    'dir_gerente': 'aprobacion_final',
    'dg_coordinacion': 'aprobacion_final'
  };

  return reverseMapping[etapa] || 'revision_inicial';
};

/**
 * Get display name for database etapa values
 */
export const getEtapaDisplayName = (etapa: EtapaValidacion): string => {
  const displayNames: Record<EtapaValidacion, string> = {
    'dir_medica': 'Dirección Médica',
    'dir_admin': 'Dirección Administrativa', 
    'dir_enfermeria': 'Dirección de Enfermería',
    'jefe_rrhh': 'Jefe de Recursos Humanos',
    'admin_hospital': 'Administración Hospitalaria',
    'dir_gerente': 'Dirección Gerente',
    'dg_coordinacion': 'Dirección General/Coordinación'
  };

  return displayNames[etapa] || etapa;
};

/**
 * Get workflow stage display name
 */
export const getWorkflowDisplayName = (workflow: EtapaWorkflow): string => {
  const displayNames: Record<EtapaWorkflow, string> = {
    'revision_inicial': 'Revisión Inicial',
    'supervision_tecnica': 'Supervisión Técnica',
    'aprobacion_final': 'Aprobación Final'
  };

  return displayNames[workflow] || workflow;
};

/**
 * Get all available database etapa values
 */
export const getAllEtapaValues = (): EtapaValidacion[] => {
  return ['dir_medica', 'dir_admin', 'dir_enfermeria', 'jefe_rrhh', 'admin_hospital', 'dir_gerente', 'dg_coordinacion'];
};

/**
 * Get all workflow stages
 */
export const getAllWorkflowStages = (): EtapaWorkflow[] => {
  return ['revision_inicial', 'supervision_tecnica', 'aprobacion_final'];
};

/**
 * Validate if a string is a valid workflow stage
 */
export const isValidWorkflowStage = (stage: string): stage is EtapaWorkflow => {
  return getAllWorkflowStages().includes(stage as EtapaWorkflow);
};

/**
 * Validate if a string is a valid database etapa
 */
export const isValidEtapa = (etapa: string): etapa is EtapaValidacion => {
  return getAllEtapaValues().includes(etapa as EtapaValidacion);
};

/**
 * Get suggested etapa based on user role or context
 */
export const getSuggestedEtapa = (userRole?: string, context?: string): EtapaValidacion => {
  // Default mapping based on user role
  const roleMapping: Record<string, EtapaValidacion> = {
    'SUPER_ADMINISTRADOR': 'dir_gerente',
    'DIRECTIVO_CENTRO_SANITARIO': 'dir_medica',
    'REVISOR_SOLICITUDES': 'jefe_rrhh',
    'PERSONALIDAD_MINISTERIAL': 'dg_coordinacion'
  };

  if (userRole && roleMapping[userRole]) {
    return roleMapping[userRole];
  }

  return 'dir_medica'; // Default to medical director
};
