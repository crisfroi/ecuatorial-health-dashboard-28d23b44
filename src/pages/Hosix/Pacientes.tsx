import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PacientesList from '@/components/hosix/pacientes/PacientesList';
import PacienteForm from '@/components/hosix/pacientes/PacienteForm';
import HistoriaClinicaView from '@/components/hosix/pacientes/HistoriaClinicaView';
import DocumentosManager from '@/components/hosix/pacientes/DocumentosManager';
import AvisosManager from '@/components/hosix/pacientes/AvisosManager';
import { Plus, FileText, AlertCircle } from 'lucide-react';

export default function PacientesPage() {
  const [activeTab, setActiveTab] = useState('listar');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Pacientes</h1>
        <p className="text-gray-600 mt-2">
          Administra información de pacientes, historia clínica electrónica, documentos y avisos
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="listar">Listar Pacientes</TabsTrigger>
          <TabsTrigger value="crear" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo
          </TabsTrigger>
          <TabsTrigger value="historia" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Historia Clínica
          </TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="avisos" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Avisos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listar" className="space-y-4">
          <PacientesList />
        </TabsContent>

        <TabsContent value="crear" className="space-y-4">
          <PacienteForm />
        </TabsContent>

        <TabsContent value="historia" className="space-y-4">
          <HistoriaClinicaView />
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <DocumentosManager />
        </TabsContent>

        <TabsContent value="avisos" className="space-y-4">
          <AvisosManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
