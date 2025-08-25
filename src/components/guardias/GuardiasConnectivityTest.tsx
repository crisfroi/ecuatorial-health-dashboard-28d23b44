import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { SupabaseConnectivityTester, ConnectivityTestResult } from '@/utils/supabaseConnectionTest';

interface GuardiasConnectivityTestProps {
  onConnectionRestored?: () => void;
}

export const GuardiasConnectivityTest: React.FC<GuardiasConnectivityTestProps> = ({
  onConnectionRestored
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<ConnectivityTestResult[]>([]);
  const [diagnosis, setDiagnosis] = useState<string>('');

  const runConnectivityTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    setDiagnosis('');

    try {
      const results = await SupabaseConnectivityTester.runFullConnectivityTest();
      setTestResults(results);

      const diagnosisMessage = await SupabaseConnectivityTester.diagnoseConnectivityIssue();
      setDiagnosis(diagnosisMessage);

      // Check if connection is restored
      const allTestsPassed = results.every(result => result.success);
      if (allTestsPassed && onConnectionRestored) {
        onConnectionRestored();
      }

    } catch (error) {
      console.error('Failed to run connectivity test:', error);
      setDiagnosis(`❌ Failed to run connectivity test: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "Conectado" : "Error"}
      </Badge>
    );
  };

  const getTestTypeLabel = (testType: string) => {
    const labels: Record<string, string> = {
      'network_connectivity': 'Conectividad de Red',
      'auth_connection': 'Autenticación',
      'basic_connection': 'Acceso a Base de Datos'
    };
    return labels[testType] || testType;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Prueba de Conectividad Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Test Button */}
        <div className="flex gap-2">
          <Button 
            onClick={runConnectivityTest} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Probando conexión...' : 'Probar Conexión'}
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Resultados de las Pruebas:</h4>
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.success)}
                  <span className="font-medium">
                    {getTestTypeLabel(result.testType)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(result.success)}
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Diagnosis */}
        {diagnosis && (
          <Alert>
            <AlertDescription>
              {diagnosis}
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Status Summary */}
        {testResults.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {testResults.every(r => r.success) ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                Estado: {testResults.every(r => r.success) ? 'Conectado' : 'Problemas de Conexión'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {testResults.filter(r => r.success).length} de {testResults.length} pruebas pasaron exitosamente.
            </p>
          </div>
        )}

        {/* Troubleshooting Tips */}
        {testResults.some(r => !r.success) && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-600">Soluciones Recomendadas:</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Verifique su conexión a internet</li>
              <li>• Compruebe si hay problemas de firewall o proxy</li>
              <li>• Intente refrescar la página</li>
              <li>• Contacte al administrador si el problema persiste</li>
            </ul>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default GuardiasConnectivityTest;
