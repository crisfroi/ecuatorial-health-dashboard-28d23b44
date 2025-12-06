import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import WorklistMedicos from '@/components/hosix/medicos/WorklistMedicos'
import ConsultaMedicaForm from '@/components/hosix/medicos/ConsultaMedicaForm'
import HistorialMedico from '@/components/hosix/medicos/HistorialMedico'
import DiarioClinicoMedico from '@/components/hosix/medicos/DiarioClinicoMedico'
import ListaEsperaMedicos from '@/components/hosix/medicos/ListaEsperaMedicos'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Stethoscope } from 'lucide-react'

export const MedicosPage: React.FC = () => {
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<string>('')
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<string>('')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-8">
          <Stethoscope className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Módulo de Médicos (ASIS 1.0)</h1>
            <p className="text-gray-600">
              Gestión de consultas, diagnósticos y prescripciones clínicas
            </p>
          </div>
        </div>

        {/* Información del Sistema */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-blue-900">Estándares Soportados</p>
                <p className="text-blue-700">CIE-10 / ICD-10 + SNOMED CT</p>
              </div>
              <div>
                <p className="font-medium text-blue-900">Integración</p>
                <p className="text-blue-700">CPOE + CDS Engine + Enfermería</p>
              </div>
              <div>
                <p className="font-medium text-blue-900">Funcionalidades</p>
                <p className="text-blue-700">Worklist, Consultas, Diagnósticos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Principales */}
        <Tabs defaultValue="worklist" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="worklist">Worklist</TabsTrigger>
            <TabsTrigger value="espera">Lista Espera</TabsTrigger>
            <TabsTrigger value="consulta">Nueva Consulta</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
            <TabsTrigger value="diario">Diario Clínico</TabsTrigger>
          </TabsList>

          {/* TAB 1: WORKLIST */}
          <TabsContent value="worklist" className="space-y-4 mt-6">
            <WorklistMedicos />
          </TabsContent>

          {/* TAB 2: LISTA DE ESPERA */}
          <TabsContent value="espera" className="space-y-4 mt-6">
            <ListaEsperaMedicos />
          </TabsContent>

          {/* TAB 4: NUEVA CONSULTA */}
          <TabsContent value="consulta" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Nueva Consulta Médica</CardTitle>
                <CardDescription>
                  Registre una nueva consulta con evaluación clínica y diagnósticos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!ordenSeleccionada || !pacienteSeleccionado ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      Para crear una consulta, seleccione una orden en el Worklist
                    </p>
                    <p className="text-sm text-gray-400">
                      O ingrese manualmente los datos:
                    </p>
                    <div className="mt-4 space-y-2 max-w-sm mx-auto">
                      <input
                        type="text"
                        placeholder="ID de Orden Médica"
                        value={ordenSeleccionada}
                        onChange={(e) => setOrdenSeleccionada(e.target.value)}
                        className="w-full h-10 px-3 border rounded"
                      />
                      <input
                        type="text"
                        placeholder="ID de Paciente"
                        value={pacienteSeleccionado}
                        onChange={(e) => setPacienteSeleccionado(e.target.value)}
                        className="w-full h-10 px-3 border rounded"
                      />
                    </div>
                  </div>
                ) : (
                  <ConsultaMedicaForm
                    ordenId={ordenSeleccionada}
                    pacienteId={pacienteSeleccionado}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: HISTORIAL */}
          <TabsContent value="historial" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial Médico del Paciente</CardTitle>
                <CardDescription>
                  Consultas previas, diagnósticos activos y resueltos, diario clínico
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!pacienteSeleccionado ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      Ingrese el ID del paciente para ver su historial médico
                    </p>
                    <div className="mt-4 space-y-2 max-w-sm mx-auto">
                      <input
                        type="text"
                        placeholder="ID de Paciente"
                        value={pacienteSeleccionado}
                        onChange={(e) => setPacienteSeleccionado(e.target.value)}
                        className="w-full h-10 px-3 border rounded"
                      />
                    </div>
                  </div>
                ) : (
                  <HistorialMedico pacienteId={pacienteSeleccionado} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: DIARIO CLÍNICO */}
          <TabsContent value="diario" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Diario Clínico</CardTitle>
                <CardDescription>
                  Registre notas de evolución y seguimiento del paciente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!pacienteSeleccionado ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      Ingrese el ID del paciente para acceder al diario clínico
                    </p>
                    <div className="mt-4 space-y-2 max-w-sm mx-auto">
                      <input
                        type="text"
                        placeholder="ID de Paciente"
                        value={pacienteSeleccionado}
                        onChange={(e) => setPacienteSeleccionado(e.target.value)}
                        className="w-full h-10 px-3 border rounded"
                      />
                    </div>
                  </div>
                ) : (
                  <DiarioClinicoMedico pacienteId={pacienteSeleccionado} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Información de Referencia */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">Información de Referencia</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>CIE-10 (ICD-10):</strong> Sistema de clasificación internacional de
              enfermedades utilizado para diagnósticos
            </p>
            <p>
              <strong>SNOMED CT:</strong> Terminología clínica estandarizada para
              interoperabilidad con sistemas FHIR
            </p>
            <p>
              <strong>Integración CPOE:</strong> Las consultas se vinculan con prescripciones
              electrónicas y validación del CDS Engine
            </p>
            <p>
              <strong>Enfermería:</strong> Los diagnósticos y planes se distribuyen
              automáticamente al módulo de Enfermería
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default MedicosPage
