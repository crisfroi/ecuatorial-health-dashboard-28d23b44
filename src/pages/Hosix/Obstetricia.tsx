import React, { useState } from 'react'
import { useHosixObstetricia } from '@/hooks/useHosixObstetricia'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { HosixLayout } from '@/components/hosix/HosixLayout'

export default function ObstetriciaPage() {
  const { gestaciones, controles, partos } = useHosixObstetricia()
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <HosixLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Obstetricia (ASIS 4.0)</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Gestación
          </Button>
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
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="gestaciones">Gestaciones</TabsTrigger>
            <TabsTrigger value="controles">Controles</TabsTrigger>
            <TabsTrigger value="partos">Partos</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle>Resumen Obstétrico</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Módulo de Obstetricia cargado correctamente.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gestaciones">
            <Card>
              <CardHeader>
                <CardTitle>Gestaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {gestaciones.map((g) => (
                    <div key={g.id} className="border rounded p-3">
                      <div className="font-semibold">Semanas de gestación: {g.semanas_gestacion}</div>
                      <div className="text-sm text-gray-600">Estado: {g.estado_gestacion}</div>
                      <div className="text-sm text-gray-600">Prob. Parto: {new Date(g.fecha_probable_parto).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="controles">
            <Card>
              <CardHeader>
                <CardTitle>Controles Prenatales</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Fecha</th>
                      <th className="text-left py-2">Semana</th>
                      <th className="text-left py-2">Peso</th>
                      <th className="text-left py-2">PA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controles.map((c) => (
                      <tr key={c.id} className="border-b">
                        <td className="py-2">{new Date(c.fecha_control).toLocaleDateString()}</td>
                        <td className="py-2">{c.semana_gestacion}</td>
                        <td className="py-2">{c.peso_kg} kg</td>
                        <td className="py-2">{c.presion_sistolica}/{c.presion_diastolica}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partos">
            <Card>
              <CardHeader>
                <CardTitle>Partos Registrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {partos.map((p) => (
                    <div key={p.id} className="border rounded p-3">
                      <div className="font-semibold">{p.tipo_parto}</div>
                      <div className="text-sm text-gray-600">Fecha: {new Date(p.fecha_hora_inicio).toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Vía: {p.via_parto}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </HosixLayout>
  )
}
