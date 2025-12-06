import React, { useState } from 'react'
import { useHosixImagenologia } from '@/hooks/useHosixImagenologia'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImagenologiaSolicitudesManager } from '@/components/hosix/imagenologia/SolicitudesManager'

export default function ImagenologiaPage() {
  const { modalidades = [], solicitudes = [], estudios = [], reportes = [] } = useHosixImagenologia()
  const [activeTab, setActiveTab] = useState('solicitudes')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Imagenología - RIS (ASIS 9.0)</h1>
        <p className="text-gray-600 mt-2">Sistema de Información Radiológica: solicitudes, adquisición de imágenes y reportes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Modalidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modalidades.length}</div>
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
            <CardTitle className="text-sm font-medium">Estudios Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estudios.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reportes Firmados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportes.filter(r => r.firmado).length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
          <TabsTrigger value="estudios">Estudios</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="solicitudes">
          <ImagenologiaSolicitudesManager />
        </TabsContent>

        <TabsContent value="estudios">
          <Card>
            <CardHeader>
              <CardTitle>Estudios Realizados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Módulo de estudios realizados en desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reportes">
          <Card>
            <CardHeader>
              <CardTitle>Reportes Radiológicos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Módulo de reportes radiológicos en desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
  }
