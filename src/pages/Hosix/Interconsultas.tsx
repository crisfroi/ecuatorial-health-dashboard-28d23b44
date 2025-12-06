import React, { useState } from 'react'
import { useHosixInterconsultas } from '@/hooks/useHosixInterconsultas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function InterconsultasPage() {
  const { solicitudes, respuestas } = useHosixInterconsultas()
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Interconsultas (ASIS 11.0)</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Interconsulta
          </Button>
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
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
            <TabsTrigger value="respuestas">Respuestas</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle>Sistema de Interconsultas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Gestión integral de solicitudes de interconsulta, respuestas especialista y seguimiento.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="solicitudes">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes de Interconsulta</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Fecha</th>
                      <th className="text-left py-2">Especialidad</th>
                      <th className="text-left py-2">Prioridad</th>
                      <th className="text-left py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudes.map((s) => (
                      <tr key={s.id} className="border-b">
                        <td className="py-2">{new Date(s.fecha_solicitud).toLocaleDateString()}</td>
                        <td className="py-2">{s.especialidad_solicitada}</td>
                        <td className="py-2">
                          <span className={`text-xs px-2 py-1 rounded ${s.urgencia ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                            {s.urgencia ? 'Urgente' : 'Normal'}
                          </span>
                        </td>
                        <td className="py-2">{s.estado_solicitud}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="respuestas">
            <Card>
              <CardHeader>
                <CardTitle>Respuestas de Interconsulta</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Fecha</th>
                      <th className="text-left py-2">Diagnóstico</th>
                      <th className="text-left py-2">Seguimiento</th>
                      <th className="text-left py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {respuestas.map((r) => (
                      <tr key={r.id} className="border-b">
                        <td className="py-2">{new Date(r.fecha_respuesta).toLocaleDateString()}</td>
                        <td className="py-2">{r.diagnostico_especialista}</td>
                        <td className="py-2">{r.seguimiento_necesario ? '✓' : '-'}</td>
                        <td className="py-2">{r.estado_respuesta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }
