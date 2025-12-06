import React, { useState } from 'react'
import { useHosixInterconsultas } from '@/hooks/useHosixInterconsultas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InterconsultasSolicitudesManager } from '@/components/hosix/interconsultas/SolicitudesManager'

export default function InterconsultasPage() {
  const { solicitudes = [], respuestas = [] } = useHosixInterconsultas()
  const [activeTab, setActiveTab] = useState('solicitudes')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Interconsultas (ASIS 11.0)</h1>
        <p className="text-gray-600 mt-2">Gestión integral de solicitudes de interconsulta, respuestas especialista y seguimiento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium">Solicitudes Respondidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{solicitudes.filter(s => s.estado_solicitud === 'respondida').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Respuestas Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{respuestas.length}</div>
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
          <TabsTrigger value="respuestas">Respuestas</TabsTrigger>
        </TabsList>

        <TabsContent value="solicitudes">
          <InterconsultasSolicitudesManager />
        </TabsContent>

        <TabsContent value="respuestas">
          <Card>
            <CardHeader>
              <CardTitle>Respuestas de Interconsulta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Módulo de respuestas en desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
  }
