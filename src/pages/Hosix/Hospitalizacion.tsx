import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IngresoPacienteForm from '@/components/hosix/hospitalizacion/IngresoPacienteForm';
import AltaForm from '@/components/hosix/hospitalizacion/AltaForm';
import TrasladosManager from '@/components/hosix/hospitalizacion/TrasladosManager';
import { Plus, LogOut, ArrowRightLeft } from 'lucide-react';

const HospitalizacionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ingresos');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sistema de Hospitalización</h1>
        <p className="text-gray-600 mt-2">
          Gestiona ingresos, altas, traslados y ocupación de camas
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ingresos" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Ingresos
          </TabsTrigger>
          <TabsTrigger value="altas" className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Altas
          </TabsTrigger>
          <TabsTrigger value="traslados" className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Traslados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ingresos" className="space-y-4">
          <IngresoPacienteForm />
        </TabsContent>

        <TabsContent value="altas" className="space-y-4">
          <AltaForm />
        </TabsContent>

        <TabsContent value="traslados" className="space-y-4">
          <TrasladosManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HospitalizacionPage;
