/**
 * Supabase connectivity test utility
 * This helps debug network connectivity issues with Supabase
 */

import { supabase } from '@/integrations/supabase/client';

export interface ConnectivityTestResult {
  success: boolean;
  error?: string;
  details?: any;
  timestamp: string;
  testType: string;
}

export class SupabaseConnectivityTester {
  
  static async testBasicConnection(): Promise<ConnectivityTestResult> {
    const timestamp = new Date().toISOString();
    
    try {
      console.log('🔌 Testing basic Supabase connection...');
      
      // Test 1: Basic health check using the simplest possible query
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select('id')
        .limit(1);

      if (error) {
        console.error('❌ Basic connection test failed:', error);
        return {
          success: false,
          error: error.message || 'Unknown Supabase error',
          details: error,
          timestamp,
          testType: 'basic_connection'
        };
      }

      console.log('✅ Basic connection test passed');
      return {
        success: true,
        timestamp,
        testType: 'basic_connection',
        details: { recordsFound: data?.length || 0 }
      };

    } catch (error: any) {
      console.error('💥 Connection test exception:', error);
      return {
        success: false,
        error: error.message || error.toString(),
        details: error,
        timestamp,
        testType: 'basic_connection'
      };
    }
  }

  static async testNetworkConnectivity(): Promise<ConnectivityTestResult> {
    const timestamp = new Date().toISOString();
    
    try {
      console.log('🌐 Testing network connectivity to Supabase...');
      
      // Test direct HTTP connectivity to Supabase
      const supabaseUrl = 'https://wdieynendfjbkbhfovrx.supabase.co';
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8'
        }
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: { status: response.status, statusText: response.statusText },
          timestamp,
          testType: 'network_connectivity'
        };
      }

      console.log('✅ Network connectivity test passed');
      return {
        success: true,
        timestamp,
        testType: 'network_connectivity',
        details: { status: response.status }
      };

    } catch (error: any) {
      console.error('💥 Network connectivity test failed:', error);
      return {
        success: false,
        error: error.message || error.toString(),
        details: error,
        timestamp,
        testType: 'network_connectivity'
      };
    }
  }

  static async testAuthConnection(): Promise<ConnectivityTestResult> {
    const timestamp = new Date().toISOString();
    
    try {
      console.log('🔐 Testing Supabase auth connection...');
      
      // Test auth endpoint
      const { data: session, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Auth connection test failed:', error);
        return {
          success: false,
          error: error.message || 'Auth connection failed',
          details: error,
          timestamp,
          testType: 'auth_connection'
        };
      }

      console.log('✅ Auth connection test passed');
      return {
        success: true,
        timestamp,
        testType: 'auth_connection',
        details: { hasSession: !!session?.session }
      };

    } catch (error: any) {
      console.error('💥 Auth connection test exception:', error);
      return {
        success: false,
        error: error.message || error.toString(),
        details: error,
        timestamp,
        testType: 'auth_connection'
      };
    }
  }

  static async runFullConnectivityTest(): Promise<ConnectivityTestResult[]> {
    console.log('🧪 Running full Supabase connectivity test suite...');
    
    const tests = [
      this.testNetworkConnectivity(),
      this.testAuthConnection(),
      this.testBasicConnection()
    ];

    const results = await Promise.all(tests);
    
    const successCount = results.filter(r => r.success).length;
    console.log(`📊 Connectivity test results: ${successCount}/${results.length} tests passed`);
    
    return results;
  }

  static async diagnoseConnectivityIssue(): Promise<string> {
    try {
      const results = await this.runFullConnectivityTest();
      
      const networkTest = results.find(r => r.testType === 'network_connectivity');
      const authTest = results.find(r => r.testType === 'auth_connection');
      const basicTest = results.find(r => r.testType === 'basic_connection');

      if (!networkTest?.success) {
        return `🌐 Network connectivity issue: ${networkTest?.error}. Check your internet connection and firewall settings.`;
      }

      if (!authTest?.success) {
        return `🔐 Authentication issue: ${authTest?.error}. Check your Supabase API keys and authentication configuration.`;
      }

      if (!basicTest?.success) {
        return `🗄️ Database access issue: ${basicTest?.error}. Check your database permissions and RLS policies.`;
      }

      return '✅ All connectivity tests passed. The issue may be intermittent or related to specific queries.';

    } catch (error: any) {
      return `💥 Failed to run connectivity diagnosis: ${error.message}`;
    }
  }
}

export default SupabaseConnectivityTester;
