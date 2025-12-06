import React, { useState } from 'react'
import { useHosixLaboratorio } from '@/hooks/useHosixLaboratorio'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SolicitudesManager } from '@/components/hosix/laboratorio/SolicitudesManager'

export default function LaboratorioPage() {
  const { pruebas = [], solicitudes = [], resultados = [] } = useHosixLaboratorio()
  const [activeTab, setActiveTab] = useState('solicitudes')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Laboratorio Clínico (ASIS 8.0)</h1>
        <p className="text-gray-600 mt-2">Gestión integral de solicitudes, muestras, análisis y resultados de laboratorio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pruebas Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pruebas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{solicitudes.filter(s => s.estado_solicitud === 'pendiente').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resultados Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resultados.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{solicitudes.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
          <TabsTrigger value="resultados">Resultados</TabsTrigger>
          <TabsTrigger value="pruebas">Catálogo</TabsTrigger>
        </TabsList>

        <TabsContent value="solicitudes">
          <SolicitudesManager />
        </TabsContent>

        <TabsContent value="resultados">
          <Card>
            <CardHeader>
              <CardTitle>Resultados de Laboratorio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Módulo de resultados en desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pruebas">
          <Card>
            <CardHeader>
              <CardTitle>Catálogo de Pruebas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{pruebas.length} pruebas disponibles en el sistema</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
  }
