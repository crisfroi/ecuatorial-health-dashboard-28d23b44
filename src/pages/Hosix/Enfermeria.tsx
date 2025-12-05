import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Activity, FileText, ClipboardList, Droplet } from 'lucide-react';
import WorklistEnfermeria from '@/components/hosix/enfermeria/WorklistEnfermeria';
import ConstantesVitales from '@/components/hosix/enfermeria/ConstantesVitales';
import Kardex from '@/components/hosix/enfermeria/Kardex';
import PlanesCuidado from '@/components/hosix/enfermeria/PlanesCuidado';

export default function Enfermeria() {
  const [selectedPaciente, setSelectedPaciente] = useState<{
    pacienteId: string;
    episodioId?: string;
    tipoEpisodio?: string;
    worklistId?: string;
  } | null>(null);

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center gap-2">
        <Heart className="h-8 w-8 text-pink-600" />
        <div>
          <h1 className="text-3xl font-bold">Módulo de Enfermería</h1>
          <p className="text-gray-600">Gestión de cuidados y atención de enfermería</p>
        </div>
      </div>

      {/* Tabs de navegación */}
      <Tabs defaultValue="worklist" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="worklist" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Worklist
          </TabsTrigger>
          <TabsTrigger value="constantes" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Constantes Vitales
          </TabsTrigger>
          <TabsTrigger value="kardex" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Kardex
          </TabsTrigger>
          <TabsTrigger value="planes" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Planes de Cuidado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="worklist" className="space-y-4">
          <WorklistEnfermeria />
        </TabsContent>

        <TabsContent value="constantes" className="space-y-4">
          {selectedPaciente ? (
            <ConstantesVitales
              pacienteId={selectedPaciente.pacienteId}
              episodioId={selectedPaciente.episodioId}
              tipoEpisodio={selectedPaciente.tipoEpisodio}
              worklistId={selectedPaciente.worklistId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <Activity className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Seleccione un paciente</p>
              <p className="text-gray-400 text-sm">
                Para registrar constantes vitales, seleccione un paciente desde el Worklist
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="kardex" className="space-y-4">
          {selectedPaciente ? (
            <Kardex
              pacienteId={selectedPaciente.pacienteId}
              episodioId={selectedPaciente.episodioId}
              tipoEpisodio={selectedPaciente.tipoEpisodio}
              worklistId={selectedPaciente.worklistId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Seleccione un paciente</p>
              <p className="text-gray-400 text-sm">
                Para acceder al kardex, seleccione un paciente desde el Worklist
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="planes" className="space-y-4">
          {selectedPaciente ? (
            <PlanesCuidado
              pacienteId={selectedPaciente.pacienteId}
              episodioId={selectedPaciente.episodioId}
              tipoEpisodio={selectedPaciente.tipoEpisodio}
              worklistId={selectedPaciente.worklistId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <Heart className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Seleccione un paciente</p>
              <p className="text-gray-400 text-sm">
                Para gestionar planes de cuidado, seleccione un paciente desde el Worklist
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

