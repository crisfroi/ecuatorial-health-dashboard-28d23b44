import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/utils/errorHandler';

interface ConnectivityTestResult {
  isSuccess: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export const useConnectivityTest = () => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<ConnectivityTestResult | null>(null);

  const testDatabaseConnection = async (): Promise<ConnectivityTestResult> => {
    setIsTestingConnection(true);
    const timestamp = new Date().toISOString();

    try {
      console.log('Testing Supabase connection...');
      
      // Test 1: Basic connection and auth status
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('Auth session error:', authError);
        return {
          isSuccess: false,
          message: `Error de autenticación: ${getErrorMessage(authError)}`,
          details: authError,
          timestamp
        };
      }

      console.log('Auth session status:', session ? 'Authenticated' : 'Not authenticated');

      // Test 2: Simple database query
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Database query error:', error);
        return {
          isSuccess: false,
          message: `Error de base de datos: ${getErrorMessage(error)}`,
          details: error,
          timestamp
        };
      }

      console.log('Database query successful');

      // Test 3: Check if we can access the table structure
      const { data: tableInfo, error: tableError } = await supabase
        .from('profesionales_sanitarios')
        .select('id, estado_solicitud')
        .limit(1);

      if (tableError) {
        console.error('Table access error:', tableError);
        return {
          isSuccess: false,
          message: `Error de acceso a tabla: ${getErrorMessage(tableError)}`,
          details: tableError,
          timestamp
        };
      }

      return {
        isSuccess: true,
        message: 'Conexión exitosa a Supabase',
        details: {
          authStatus: session ? 'authenticated' : 'unauthenticated',
          recordsAccessible: data?.length || 0,
          tableColumns: tableInfo ? Object.keys(tableInfo[0] || {}) : []
        },
        timestamp
      };

    } catch (networkError) {
      console.error('Network/connection error:', networkError);
      return {
        isSuccess: false,
        message: `Error de red: ${getErrorMessage(networkError)}`,
        details: networkError,
        timestamp
      };
    } finally {
      setIsTestingConnection(false);
    }
  };

  const runConnectivityTest = async () => {
    const result = await testDatabaseConnection();
    setLastTestResult(result);
    return result;
  };

  const testTableOperations = async () => {
    setIsTestingConnection(true);
    const timestamp = new Date().toISOString();

    try {
      // Test basic CRUD operations without actually modifying data
      
      // Test SELECT
      const { data: selectData, error: selectError } = await supabase
        .from('profesionales_sanitarios')
        .select('id, estado_solicitud, nombre, apellidos')
        .limit(5);

      if (selectError) {
        throw new Error(`SELECT failed: ${getErrorMessage(selectError)}`);
      }

      // Test filtered SELECT
      const { data: filteredData, error: filteredError } = await supabase
        .from('profesionales_sanitarios')
        .select('id')
        .eq('estado_solicitud', 'Aprobado')
        .limit(1);

      if (filteredError) {
        throw new Error(`Filtered SELECT failed: ${getErrorMessage(filteredError)}`);
      }

      return {
        isSuccess: true,
        message: 'Operaciones de tabla exitosas',
        details: {
          totalRecordsAccessed: selectData?.length || 0,
          filteredRecordsCount: filteredData?.length || 0,
          sampleRecord: selectData?.[0] || null
        },
        timestamp
      };

    } catch (error) {
      return {
        isSuccess: false,
        message: `Error en operaciones de tabla: ${getErrorMessage(error)}`,
        details: error,
        timestamp
      };
    } finally {
      setIsTestingConnection(false);
    }
  };

  return {
    testDatabaseConnection: runConnectivityTest,
    testTableOperations,
    isTestingConnection,
    lastTestResult
  };
};
