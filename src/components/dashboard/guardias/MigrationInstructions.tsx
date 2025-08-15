import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Database, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const MigrationInstructions: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const migrationSQL = `-- Execute this SQL in Supabase SQL Editor
-- This will create all necessary tables for the Guard Management System

-- Example tables (simplified for demo)
-- Note: The full migration is in supabase/migrations/20241225000000_create_guard_tables.sql

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('guardias', 'nominas_guardias', 'ajustes_baremo', 'configuracion_guardias');

-- If no tables are returned, you need to run the migration
-- Please execute the full migration file from the supabase/migrations/ folder`;

  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(migrationSQL);
      setCopied(true);
      toast.success('SQL copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar al portapapeles');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Configuración de Base de Datos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 mb-3">
            Acción Requerida
          </Badge>
          <p className="text-sm text-gray-600">
            Para usar el sistema de guardias, primero debe ejecutar las migraciones de base de datos.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Pasos a seguir:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Abrir el panel de administración de Supabase</li>
            <li>Ir a "SQL Editor"</li>
            <li>Ejecutar el siguiente comando para verificar las tablas:</li>
          </ol>
        </div>

        <div className="relative">
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
            <code>{migrationSQL}</code>
          </pre>
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleCopySQL}
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir Supabase
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Recargar después de migración
          </Button>
        </div>

        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <strong>Nota:</strong> El archivo completo de migración se encuentra en 
          <code className="bg-blue-100 px-1 rounded mx-1">
            supabase/migrations/20241225000000_create_guard_tables.sql
          </code>
          y contiene todas las tablas, índices, funciones y datos iniciales necesarios.
        </div>
      </CardContent>
    </Card>
  );
};

export default MigrationInstructions;
