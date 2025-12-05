import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UrgenciasWorklist from '@/components/hosix/urgencias/UrgenciasWorklist';
import TriageForm from '@/components/hosix/urgencias/TriageForm';
import AtencionForm from '@/components/hosix/urgencias/AtencionForm';
import { AlertCircle, Plus, CheckCircle } from 'lucide-react';

export default function UrgenciasPage() {
  const [activeTab, setActiveTab] = useState('worklist');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Módulo de Urgencias</h1>
        <p className="text-gray-600 mt-2">
          Gestiona el flujo de pacientes en urgencias: registro, triage y atención
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="worklist" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Worklist
          </TabsTrigger>
          <TabsTrigger value="triage" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Triage
          </TabsTrigger>
          <TabsTrigger value="atencion" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Atención
          </TabsTrigger>
        </TabsList>

        <TabsContent value="worklist" className="space-y-4">
          <UrgenciasWorklist />
        </TabsContent>

        <TabsContent value="triage" className="space-y-4">
          <TriageForm />
        </TabsContent>

        <TabsContent value="atencion" className="space-y-4">
          <AtencionForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
