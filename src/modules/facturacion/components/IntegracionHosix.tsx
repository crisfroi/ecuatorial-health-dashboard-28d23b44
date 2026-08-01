import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Database, Zap } from 'lucide-react';
import ConceptosManager from './ConceptosManager';
import ReglasEditor from './ReglasEditor';

export default function IntegracionHosix() {
  const [activeTab, setActiveTab] = useState('conceptos');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Integración HOSIX - Nodo Central</h2>
        <p className="text-gray-600">
          Administra conceptos maestros y reglas de tarifación que se sincronizarán automáticamente con todos los nodos HOSIX
        </p>
      </div>

      {/* Alert Info */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Administración Centralizada</p>
              <p>
                RENAPROSA es la fuente única de verdad para conceptos maestros y reglas de tarifación. 
                Los cambios se replican automáticamente a todos los nodos hospitalarios (HOSIX) después de sincronización.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="conceptos" className="gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Conceptos Maestros</span>
            <span className="sm:hidden">Conceptos</span>
          </TabsTrigger>
          <TabsTrigger value="reglas" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Reglas de Tarifación</span>
            <span className="sm:hidden">Reglas</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Conceptos Maestros */}
        <TabsContent value="conceptos" className="space-y-4">
          <ConceptosManager />
        </TabsContent>

        {/* Tab: Reglas de Tarifación */}
        <TabsContent value="reglas" className="space-y-4">
          <ReglasEditor />
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Card className="bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Estado de Sincronización</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Última sincronización:</span>
            <span className="font-semibold">Hace 2 minutos</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Nodos sincronizados:</span>
            <span className="font-semibold">3 de 3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cambios pendientes:</span>
            <span className="font-semibold text-amber-600">0</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
