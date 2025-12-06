import React, { useState } from 'react'
import { useHosixFarmacia } from '@/hooks/useHosixFarmacia'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DispensacionesManager } from '@/components/hosix/farmacia/DispensacionesManager'

export default function FarmaciaPage() {
  const { dispensarios = [], dispensaciones = [], farmacovigilancia = [] } = useHosixFarmacia()
  const [activeTab, setActiveTab] = useState('dispensaciones')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Farmacia Clínica (ASIS 10.0)</h1>
        <p className="text-gray-600 mt-2">Gestión de dispensación de medicamentos, farmacovigilancia y evaluación clínica</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dispensarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dispensarios.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dispensaciones Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dispensaciones.filter(d => new Date(d.fecha_dispensacion).toDateString() === new Date().toDateString()).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Eventos Adversos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmacovigilancia.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Dispensaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dispensaciones.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dispensaciones">Dispensaciones</TabsTrigger>
          <TabsTrigger value="farmacovigilancia">Farmacovigilancia</TabsTrigger>
        </TabsList>

        <TabsContent value="dispensaciones">
          <DispensacionesManager />
        </TabsContent>

        <TabsContent value="farmacovigilancia">
          <Card>
            <CardHeader>
              <CardTitle>Eventos Adversos (Farmacovigilancia)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Módulo de farmacovigilancia en desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
  }
