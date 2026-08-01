import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Database, Zap, Building2, TrendingUp } from 'lucide-react';
import IntegracionHosix from '../components/IntegracionHosix';
import AseguradorasManager from '../components/AseguradorasManager';
import TarifasManager from '../components/TarifasManager';

export default function Facturacion() {
  const [activeTab, setActiveTab] = useState('integracion');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold">Facturación - RENAPROSA</h1>
          </div>
          <p className="text-gray-600">
            Gestión centralizada de conceptos, tarifas, aseguradoras y reglas de tarifación dinámica
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="integracion" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Integración</span>
            </TabsTrigger>
            <TabsTrigger value="aseguradoras" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Aseguradoras</span>
            </TabsTrigger>
            <TabsTrigger value="tarifas" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Tarifas</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Integración HOSIX */}
          <TabsContent value="integracion" className="space-y-4">
            <IntegracionHosix />
          </TabsContent>

          {/* Tab: Aseguradoras */}
          <TabsContent value="aseguradoras" className="space-y-4">
            <AseguradorasManager />
          </TabsContent>

          {/* Tab: Tarifas */}
          <TabsContent value="tarifas" className="space-y-4">
            <TarifasManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
