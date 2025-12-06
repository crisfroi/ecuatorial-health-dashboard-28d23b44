import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GestacionesManager } from '@/components/hosix/obstetricia/GestacionesManager'
import { useHosixObstetricia } from '@/hooks/useHosixObstetricia'

export default function ObstetriciaPage() {
  const { gestaciones = [], controles = [], partos = [] } = useHosixObstetricia()
  const [activeTab, setActiveTab] = useState('gestaciones')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Obstetricia (ASIS 4.0)</h1>
        <p className="text-gray-600 mt-2">Gestión integral de gestaciones, controles prenatales, partos y puerperio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gestaciones Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gestaciones.filter(g => g.estado_gestacion === 'activa').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Controles Prenatales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{controles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Partos Registrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Gestaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gestaciones.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="gestaciones">Gestaciones</TabsTrigger>
          <TabsTrigger value="controles">Controles Prenatales</TabsTrigger>
          <TabsTrigger value="partos">Partos</TabsTrigger>
        </TabsList>

        <TabsContent value="gestaciones">
          <GestacionesManager />
        </TabsContent>

        <TabsContent value="controles">
          <Card>
            <CardHeader>
              <CardTitle>Controles Prenatales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Módulo de controles prenatales en desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partos">
          <Card>
            <CardHeader>
              <CardTitle>Partos Registrados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Módulo de partos en desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
