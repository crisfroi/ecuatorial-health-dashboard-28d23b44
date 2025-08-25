/**
 * Connection test runner utility
 * This provides a simple way to test and validate the Supabase connection fixes
 */

import { SupabaseConnectivityTester } from './supabaseConnectionTest';
import { supabase } from '@/integrations/supabase/client';

export interface TestSummary {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  networkHealthy: boolean;
  supabaseHealthy: boolean;
  details: string[];
}

export class ConnectionTestRunner {
  
  static async runQuickTest(): Promise<TestSummary> {
    const timestamp = new Date().toISOString();
    const details: string[] = [];
    let passedTests = 0;
    let failedTests = 0;

    console.log('🧪 Running quick connection test...');

    // Test 1: Basic network connectivity
    try {
      const networkTest = await SupabaseConnectivityTester.testNetworkConnectivity();
      if (networkTest.success) {
        passedTests++;
        details.push('✅ Network connectivity: OK');
      } else {
        failedTests++;
        details.push(`❌ Network connectivity: ${networkTest.error}`);
      }
    } catch (error) {
      failedTests++;
      details.push(`❌ Network connectivity: Exception - ${error}`);
    }

    // Test 2: Basic Supabase query
    try {
      const basicTest = await SupabaseConnectivityTester.testBasicConnection();
      if (basicTest.success) {
        passedTests++;
        details.push('✅ Supabase connection: OK');
      } else {
        failedTests++;
        details.push(`❌ Supabase connection: ${basicTest.error}`);
      }
    } catch (error) {
      failedTests++;
      details.push(`❌ Supabase connection: Exception - ${error}`);
    }

    // Test 3: Check if we can fetch a simple table count
    try {
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select('id', { count: 'exact', head: true });

      if (!error) {
        passedTests++;
        details.push('✅ Database query: OK');
      } else {
        failedTests++;
        details.push(`❌ Database query: ${error.message}`);
      }
    } catch (error: any) {
      failedTests++;
      details.push(`❌ Database query: Exception - ${error.message}`);
    }

    const totalTests = passedTests + failedTests;
    const networkHealthy = !details.some(d => d.includes('Network connectivity') && d.includes('❌'));
    const supabaseHealthy = !details.some(d => d.includes('Supabase connection') && d.includes('❌'));

    return {
      timestamp,
      totalTests,
      passedTests,
      failedTests,
      networkHealthy,
      supabaseHealthy,
      details
    };
  }

  static async validateGuardiasStoreFunctions(): Promise<TestSummary> {
    const timestamp = new Date().toISOString();
    const details: string[] = [];
    let passedTests = 0;
    let failedTests = 0;

    console.log('🏥 Testing Guardias store functions...');

    // Import the store
    const { useGuardiasStore } = await import('@/stores/useGuardiasStore');
    const store = useGuardiasStore.getState();

    // Test fetchGuardias function exists and is callable
    try {
      if (typeof store.fetchGuardias === 'function') {
        passedTests++;
        details.push('✅ fetchGuardias function: Available');
      } else {
        failedTests++;
        details.push('❌ fetchGuardias function: Not available');
      }
    } catch (error) {
      failedTests++;
      details.push(`❌ fetchGuardias function: Error - ${error}`);
    }

    // Test fetchNominas function exists
    try {
      if (typeof store.fetchNominas === 'function') {
        passedTests++;
        details.push('✅ fetchNominas function: Available');
      } else {
        failedTests++;
        details.push('❌ fetchNominas function: Not available');
      }
    } catch (error) {
      failedTests++;
      details.push(`❌ fetchNominas function: Error - ${error}`);
    }

    // Test fetchPagos function exists
    try {
      if (typeof store.fetchPagos === 'function') {
        passedTests++;
        details.push('✅ fetchPagos function: Available');
      } else {
        failedTests++;
        details.push('❌ fetchPagos function: Not available');
      }
    } catch (error) {
      failedTests++;
      details.push(`❌ fetchPagos function: Error - ${error}`);
    }

    const totalTests = passedTests + failedTests;

    return {
      timestamp,
      totalTests,
      passedTests,
      failedTests,
      networkHealthy: true, // Not applicable for function tests
      supabaseHealthy: true, // Not applicable for function tests
      details
    };
  }

  static async runFullDiagnostic(): Promise<{
    connectionTest: TestSummary;
    functionTest: TestSummary;
    overallStatus: 'healthy' | 'warning' | 'error';
    recommendations: string[];
  }> {
    console.log('🔬 Running full diagnostic...');

    const connectionTest = await this.runQuickTest();
    const functionTest = await this.validateGuardiasStoreFunctions();

    const recommendations: string[] = [];
    let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';

    // Analyze results and provide recommendations
    if (!connectionTest.networkHealthy) {
      overallStatus = 'error';
      recommendations.push('❌ Verifique su conexión a internet');
      recommendations.push('❌ Compruebe si hay proxies o firewalls bloqueando la conexión');
    }

    if (!connectionTest.supabaseHealthy) {
      overallStatus = 'error';
      recommendations.push('❌ Verifique la configuración de Supabase');
      recommendations.push('❌ Contacte al administrador del sistema');
    }

    if (functionTest.failedTests > 0) {
      if (overallStatus === 'healthy') overallStatus = 'warning';
      recommendations.push('⚠️ Algunas funciones del store no están disponibles');
    }

    if (connectionTest.passedTests === connectionTest.totalTests && functionTest.passedTests === functionTest.totalTests) {
      recommendations.push('✅ Todas las pruebas pasaron exitosamente');
      recommendations.push('✅ El sistema está funcionando correctamente');
    }

    return {
      connectionTest,
      functionTest,
      overallStatus,
      recommendations
    };
  }
}

export default ConnectionTestRunner;
