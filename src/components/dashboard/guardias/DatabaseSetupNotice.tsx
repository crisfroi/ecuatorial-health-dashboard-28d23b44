import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Database, ExternalLink, CheckCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DatabaseSetupNoticeProps {
  showSuccessMessage?: boolean;
}

const DatabaseSetupNotice: React.FC<DatabaseSetupNoticeProps> = ({ showSuccessMessage = false }) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Ruta copiada al portapapeles",
    });
  };

  if (showSuccessMessage) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Sistema de Guardias Configurado</AlertTitle>
        <AlertDescription className="text-green-700">
          <div className="space-y-2">
            <p>Las tablas del sistema de guardias están correctamente configuradas y funcionando.</p>
            <div className="text-sm">
              <strong>Funcionalidades disponibles:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Gestión de profesionales de guardia con datos reales</li>
                <li>Programación de guardias por calendario interactivo</li>
                <li>Sistema de validación multi-etapa</li>
                <li>Generación automática de nóminas</li>
                <li>Gestión de pagos y seguimiento</li>
                <li>Editor de baremos por categoría con base de datos</li>
                <li>Reportes y estadísticas en tiempo real</li>
                <li>Auditoría completa del sistema</li>
              </ul>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-orange-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-orange-800 mb-2">
              Configuración del Sistema de Guardias Requerida
            </h3>
            <p className="text-orange-700 mb-4">
              Para utilizar el sistema completo de guardias médicas con datos reales de la base de datos, 
              es necesario ejecutar la migración correspondiente.
            </p>
            
            <div className="space-y-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <p className="font-medium mb-2 text-orange-800">Pasos para configurar:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-orange-700">
                  <li>Ir al dashboard de Supabase</li>
                  <li>Navegar a "SQL Editor"</li>
                  <li>Ejecutar la migración: <code className="bg-white px-2 py-1 rounded">20241225000000_create_guard_tables.sql</code></li>
                  <li>Verificar que las tablas se crearon correctamente</li>
                  <li>Recargar la aplicación</li>
                </ol>
              </div>

              <div className="bg-white p-3 rounded border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-orange-800">Archivo de migración:</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard('supabase/migrations/20241225000000_create_guard_tables.sql')}
                    className="h-6 px-2 text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar ruta
                  </Button>
                </div>
                <code className="text-xs bg-gray-100 p-2 rounded block text-gray-700">
                  supabase/migrations/20241225000000_create_guard_tables.sql
                </code>
              </div>

              <div className="text-sm text-orange-700">
                <p className="font-medium mb-2">Esta migración creará:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Tablas de profesionales y guardias</li>
                    <li>Sistema de validaciones multi-etapa</li>
                    <li>Gestión de nóminas y pagos</li>
                    <li>Configuración de baremos reales</li>
                  </ul>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Auditoría y bitácora completa</li>
                    <li>Funciones automáticas</li>
                    <li>Políticas de seguridad (RLS)</li>
                    <li>Datos iniciales de baremos oficiales</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Abrir Supabase
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Recargar Página
                </Button>
              </div>

              <p className="text-xs font-medium text-orange-600 bg-orange-100 p-2 rounded">
                ⚠️ Una vez ejecutada la migración, el sistema dejará de usar datos ficticios y trabajará 
                exclusivamente con datos reales de la base de datos.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseSetupNotice;
