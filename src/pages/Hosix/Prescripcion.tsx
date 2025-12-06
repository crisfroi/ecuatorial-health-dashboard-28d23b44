import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pill, Eye, Plus, History } from 'lucide-react'
import CPOEPrescripcionForm from '@/components/hosix/prescripcion/CPOEPrescripcionForm'
import PrescripcionesListado from '@/components/hosix/prescripcion/PrescripcionesListado'
import HistoricoPrescripciones from '@/components/hosix/prescripcion/HistoricoPrescripciones'

export default function Prescripcion() {
  const [selectedPaciente, setSelectedPaciente] = useState<{
    pacienteId: string
    episodioId?: string
  } | null>(null)

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center gap-2">
        <Pill className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold">Prescripción Electrónica (CPOE)</h1>
          <p className="text-gray-600">Sistema de prescripción con soporte de decisiones clínicas</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="listado" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="listado" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Listado de Órdenes
          </TabsTrigger>
          <TabsTrigger value="nueva" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva Prescripción
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Listado */}
        <TabsContent value="listado" className="space-y-4">
          <PrescripcionesListado
            onSelectPaciente={(paciente) => setSelectedPaciente(paciente)}
          />
        </TabsContent>

        {/* Nueva Prescripción */}
        <TabsContent value="nueva" className="space-y-4">
          {selectedPaciente ? (
            <CPOEPrescripcionForm
              pacienteId={selectedPaciente.pacienteId}
              episodioId={selectedPaciente.episodioId}
              onSuccess={() => {
                setRefreshTrigger(prev => prev + 1)
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <Pill className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Selecciona un paciente</p>
              <p className="text-gray-400 text-sm">
                Primero carga el listado de órdenes para seleccionar un paciente
              </p>
            </div>
          )}
        </TabsContent>

        {/* Historial */}
        <TabsContent value="historial" className="space-y-4">
          {selectedPaciente ? (
            <HistoricoPrescripciones
              pacienteId={selectedPaciente.pacienteId}
              episodioId={selectedPaciente.episodioId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <History className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Selecciona un paciente</p>
              <p className="text-gray-400 text-sm">
                Para ver el historial de prescripciones
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
