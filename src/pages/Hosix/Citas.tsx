import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AgendasList from '@/components/hosix/citas/AgendasList';
import CitasForm from '@/components/hosix/citas/CitasForm';
import CitasList from '@/components/hosix/citas/CitasList';
import { Calendar, Plus, List } from 'lucide-react';

const CitasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('gestionar');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sistema de Citas y Agendas</h1>
        <p className="text-gray-600 mt-2">
          Gestiona agendas, programa citas y administra la lista de espera de pacientes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gestionar" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Gestionar Citas
          </TabsTrigger>
          <TabsTrigger value="agendar" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Agendar Cita
          </TabsTrigger>
          <TabsTrigger value="agendas" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Agendas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gestionar" className="space-y-4">
          <CitasList />
        </TabsContent>

        <TabsContent value="agendar" className="space-y-4">
          <CitasForm />
        </TabsContent>

        <TabsContent value="agendas" className="space-y-4">
          <AgendasList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CitasPage;
