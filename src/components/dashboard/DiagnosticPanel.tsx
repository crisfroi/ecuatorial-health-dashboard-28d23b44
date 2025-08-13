import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const DiagnosticPanel = () => {
  const { user, userRole, isLoading } = useAuth();
  const [dbTest, setDbTest] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const testDatabaseConnection = async () => {
    setTestLoading(true);
    try {
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("id, estado_solicitud, genero")
        .limit(5);

      setDbTest({
        success: !error,
        data: data,
        error: error?.message,
        count: data?.length || 0
      });
    } catch (err: any) {
      setDbTest({
        success: false,
        error: err.message,
        count: 0
      });
    }
    setTestLoading(false);
  };

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  return (
    <Card className="mb-6 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-yellow-800">🔍 Panel de Diagnóstico</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado de Autenticación */}
        <div>
          <h4 className="font-medium mb-2">Estado de Autenticación:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <span className="text-sm font-medium">Email:</span>
              <Badge variant={user?.email ? "default" : "destructive"}>
                {user?.email || "No detectado"}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">Nombre:</span>
              <Badge variant={user?.full_name ? "default" : "secondary"}>
                {user?.full_name || "No configurado"}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">Rol:</span>
              <Badge variant={userRole ? "default" : "destructive"}>
                {userRole || "No asignado"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Estado de Base de Datos */}
        <div>
          <h4 className="font-medium mb-2">Estado de Base de Datos:</h4>
          <div className="flex items-center gap-2 mb-2">
            <Button 
              onClick={testDatabaseConnection} 
              disabled={testLoading}
              size="sm"
              variant="outline"
            >
              {testLoading ? "Probando..." : "Probar Conexión"}
            </Button>
            {dbTest && (
              <Badge variant={dbTest.success ? "default" : "destructive"}>
                {dbTest.success ? `✅ Conectado (${dbTest.count} registros)` : "❌ Error"}
              </Badge>
            )}
          </div>
          {dbTest?.error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              Error: {dbTest.error}
            </div>
          )}
          {dbTest?.data && (
            <div className="text-sm bg-green-50 p-2 rounded">
              <strong>Datos de prueba:</strong>
              <pre className="mt-1 text-xs">
                {JSON.stringify(dbTest.data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Debug completo */}
        <div>
          <h4 className="font-medium mb-2">Debug Completo:</h4>
          <div className="text-xs bg-gray-50 p-2 rounded font-mono">
            <pre>
{JSON.stringify({
  authLoading: isLoading,
  user: user ? {
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name
  } : null,
  userRole,
  timestamp: new Date().toISOString()
}, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
