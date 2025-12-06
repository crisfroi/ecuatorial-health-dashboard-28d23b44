import React, { useState } from 'react'
import { useHosixLaboratorio } from '@/hooks/useHosixLaboratorio'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { HosixLayout } from '@/components/hosix/HosixLayout'

export default function LaboratorioPage() {
  const { pruebas, solicitudes, resultados } = useHosixLaboratorio()
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <HosixLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Laboratorio Clínico (ASIS 8.0)</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Solicitud
          </Button>
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
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
            <TabsTrigger value="resultados">Resultados</TabsTrigger>
            <TabsTrigger value="pruebas">Catálogo</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle>Laboratorio Clínico</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Sistema completo de solicitudes, muestras y resultados de laboratorio.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="solicitudes">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes de Laboratorio</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Fecha</th>
                      <th className="text-left py-2">Número de Pruebas</th>
                      <th className="text-left py-2">Estado</th>
                      <th className="text-left py-2">Urgente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudes.map((s) => (
                      <tr key={s.id} className="border-b">
                        <td className="py-2">{new Date(s.fecha_solicitud).toLocaleString()}</td>
                        <td className="py-2">{s.pruebas_solicitadas?.length || 0}</td>
                        <td className="py-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {s.estado_solicitud}
                          </span>
                        </td>
                        <td className="py-2">{s.urgente ? '✓' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resultados">
            <Card>
              <CardHeader>
                <CardTitle>Resultados de Laboratorio</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Fecha</th>
                      <th className="text-left py-2">Resultado</th>
                      <th className="text-left py-2">Unidad</th>
                      <th className="text-left py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map((r) => (
                      <tr key={r.id} className="border-b">
                        <td className="py-2">{new Date(r.fecha_resultado).toLocaleDateString()}</td>
                        <td className="py-2">{r.valor_resultado}</td>
                        <td className="py-2">{r.unidad_resultado}</td>
                        <td className="py-2">
                          <span className={`text-xs px-2 py-1 rounded ${r.estado_resultado === 'normal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {r.estado_resultado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pruebas">
            <Card>
              <CardHeader>
                <CardTitle>Catálogo de Pruebas</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Código</th>
                      <th className="text-left py-2">Nombre</th>
                      <th className="text-left py-2">Muestra</th>
                      <th className="text-left py-2">Tiempo Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pruebas.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="py-2">{p.codigo}</td>
                        <td className="py-2">{p.nombre}</td>
                        <td className="py-2">{p.tipo_muestra}</td>
                        <td className="py-2">{p.tiempo_resultado_horas}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </HosixLayout>
  )
}
