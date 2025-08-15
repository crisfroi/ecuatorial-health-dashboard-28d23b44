import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Database, ExternalLink } from 'lucide-react';

const DatabaseSetupNotice: React.FC = () => {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Configuración de Base de Datos Requerida
            </h3>
            <p className="text-yellow-700 mb-4">
              El sistema de gestión de guardias médicas requiere que se ejecuten las migraciones 
              de base de datos para crear las tablas necesarias.
            </p>
            
            <div className="space-y-3">
              <div className="text-sm text-yellow-700">
                <strong>Pasos para completar la configuración:</strong>
              </div>
              
              <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700 ml-4">
                <li>Acceder al panel de Supabase</li>
                <li>Ir a la sección "SQL Editor"</li>
                <li>Ejecutar el archivo de migración: <code className="bg-yellow-100 px-1 rounded">supabase/migrations/20241225000000_create_guard_tables.sql</code></li>
                <li>Verificar que todas las tablas se crearon correctamente</li>
                <li>Recargar la aplicación</li>
              </ol>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Abrir Supabase
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  Recargar Página
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseSetupNotice;
