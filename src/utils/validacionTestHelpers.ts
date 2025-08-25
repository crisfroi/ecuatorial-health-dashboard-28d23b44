/**
 * Test helpers to verify enum mapping functionality
 */

import { 
  mapWorkflowToEtapa, 
  mapEtapaToWorkflow, 
  EtapaValidacion, 
  EtapaWorkflow,
  getAllEtapaValues,
  getAllWorkflowStages 
} from './validacionHelpers';

/**
 * Test the bidirectional mapping to ensure consistency
 */
export const testEnumMapping = (): boolean => {
  console.log('🧪 Testing enum mapping consistency...');
  
  const workflowStages = getAllWorkflowStages();
  const etapaValues = getAllEtapaValues();
  
  let allTestsPassed = true;
  
  // Test each workflow stage maps to a valid etapa
  for (const workflow of workflowStages) {
    const mapped = mapWorkflowToEtapa(workflow);
    if (!etapaValues.includes(mapped)) {
      console.error(`❌ Workflow "${workflow}" maps to invalid etapa "${mapped}"`);
      allTestsPassed = false;
    } else {
      console.log(`✅ ${workflow} → ${mapped}`);
    }
  }
  
  // Test each etapa maps to a valid workflow
  for (const etapa of etapaValues) {
    const mapped = mapEtapaToWorkflow(etapa);
    if (!workflowStages.includes(mapped)) {
      console.error(`❌ Etapa "${etapa}" maps to invalid workflow "${mapped}"`);
      allTestsPassed = false;
    } else {
      console.log(`✅ ${etapa} → ${mapped}`);
    }
  }
  
  // Test round-trip consistency for workflows
  for (const workflow of workflowStages) {
    const etapa = mapWorkflowToEtapa(workflow);
    const backToWorkflow = mapEtapaToWorkflow(etapa);
    if (backToWorkflow !== workflow) {
      console.warn(`⚠️ Round-trip inconsistency: ${workflow} → ${etapa} → ${backToWorkflow}`);
      // This might be expected if multiple etapas map to the same workflow
    }
  }
  
  console.log(allTestsPassed ? '✅ All enum mapping tests passed!' : '❌ Some enum mapping tests failed!');
  return allTestsPassed;
};

/**
 * Mock data for testing validacion creation
 */
export const createMockValidacionData = (workflowStage: EtapaWorkflow) => {
  return {
    guardia_id: 'test-guardia-id',
    etapa: workflowStage,
    usuario_id: 'test-user-id',
    resultado: 'pendiente',
    comentario: 'Test validation comment',
    firma: 'test-signature'
  };
};

/**
 * Test data structure that should work with database
 */
export const createValidDatabaseValidacionData = (etapa: EtapaValidacion) => {
  return {
    guardia_id: 'test-guardia-id',
    etapa: etapa,
    usuario_id: 'test-user-id',
    resultado: 'pendiente',
    comentario: 'Test validation comment',
    firma: 'test-signature'
  };
};

/**
 * Validate enum values match expected database enum
 */
export const validateDatabaseEnumValues = (): boolean => {
  const expectedValues = ['dir_medica', 'dir_admin', 'dir_enfermeria', 'jefe_rrhh', 'admin_hospital', 'dir_gerente', 'dg_coordinacion'];
  const actualValues = getAllEtapaValues();
  
  const allMatch = expectedValues.every(val => actualValues.includes(val)) && 
                   actualValues.every(val => expectedValues.includes(val));
  
  if (!allMatch) {
    console.error('❌ Database enum values mismatch:');
    console.error('Expected:', expectedValues);
    console.error('Actual:', actualValues);
  } else {
    console.log('✅ Database enum values match expected values');
  }
  
  return allMatch;
};

// Run tests when module loads (only in development)
if (import.meta.env?.DEV) {
  console.log('🧪 Running validation enum tests...');
  testEnumMapping();
  validateDatabaseEnumValues();
}
