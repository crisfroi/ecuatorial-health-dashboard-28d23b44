import React, { useState } from 'react'
import { useHosixQuirofanos } from '@/hooks/useHosixQuirofanos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { HosixLayout } from '@/components/hosix/HosixLayout'

export default function QuirovanosPage() {
  const { quirofanos, programaciones, historiales } = useHosixQuirofanos()
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <HosixLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Quirófanos (ASIS 3.0)</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Programar Cirugía
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quirófanos Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quirofanos.filter(q => q.estado_quirofano === 'disponible').length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Programaciones Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{programaciones.filter(p => p.estado_programacion === 'programada').length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cirugías Completadas (Hoy)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{historiales.filter(h => new Date(h.created_at).toDateString() === new Date().toDateString()).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Quirófanos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quirofanos.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="programacion">Programación</TabsTrigger>
            <TabsTrigger value="historiales">Historiales</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quirófanos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quirofanos.map((q) => (
                    <Card key={q.id} className="p-4">
                      <div className="font-semibold">{q.nombre}</div>
                      <div className="text-sm text-gray-500">Código: {q.codigo}</div>
                      <div className="text-sm text-gray-500">Piso: {q.piso}</div>
                      <div className="text-sm mt-2">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded">
                          {q.estado_quirofano}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="programacion">
            <Card>
              <CardHeader>
                <CardTitle>Cirugías Programadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Paciente</th>
                        <th className="text-left py-2">Tipo</th>
                        <th className="text-left py-2">Quirófano</th>
                        <th className="text-left py-2">Fecha</th>
                        <th className="text-left py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programaciones.map((p) => (
                        <tr key={p.id} className="border-b">
                          <td className="py-2">{p.paciente?.primer_nombre} {p.paciente?.primer_apellido}</td>
                          <td className="py-2">{p.tipo_cirugia}</td>
                          <td className="py-2">{p.quirofano?.nombre}</td>
                          <td className="py-2">{new Date(p.fecha_programada).toLocaleDateString()}</td>
                          <td className="py-2">
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {p.estado_programacion}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historiales">
            <Card>
              <CardHeader>
                <CardTitle>Historiales Quirúrgicos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Paciente</th>
                        <th className="text-left py-2">Quirófano</th>
                        <th className="text-left py-2">Inicio</th>
                        <th className="text-left py-2">Fin</th>
                        <th className="text-left py-2">Duración</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historiales.map((h) => (
                        <tr key={h.id} className="border-b">
                          <td className="py-2">{h.paciente?.primer_nombre}</td>
                          <td className="py-2">{h.quirofano?.nombre}</td>
                          <td className="py-2">{new Date(h.fecha_hora_inicio).toLocaleString()}</td>
                          <td className="py-2">{h.fecha_hora_fin ? new Date(h.fecha_hora_fin).toLocaleString() : '-'}</td>
                          <td className="py-2">{h.duracion_real_minutos || '-'} min</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </HosixLayout>
  )
}
