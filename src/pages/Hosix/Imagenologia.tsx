import React, { useState } from 'react'
import { useHosixImagenologia } from '@/hooks/useHosixImagenologia'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function ImagenologiaPage() {
  const { modalidades, solicitudes, estudios, reportes } = useHosixImagenologia()
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Imagenología - RIS (ASIS 9.0)</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Solicitud
          </Button>
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
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
            <TabsTrigger value="estudios">Estudios</TabsTrigger>
            <TabsTrigger value="reportes">Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle>Sistema de Información Radiológica (RIS)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Gestión integral de solicitudes, adquisición de imágenes y reportes radiológicos.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="solicitudes">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes de Imagenología</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Fecha</th>
                      <th className="text-left py-2">Modalidad</th>
                      <th className="text-left py-2">Región</th>
                      <th className="text-left py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudes.map((s) => (
                      <tr key={s.id} className="border-b">
                        <td className="py-2">{new Date(s.fecha_solicitud).toLocaleDateString()}</td>
                        <td className="py-2">{s.modalidad_id}</td>
                        <td className="py-2">{s.region_anatomica}</td>
                        <td className="py-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {s.estado_solicitud}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estudios">
            <Card>
              <CardHeader>
                <CardTitle>Estudios Realizados</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Código</th>
                      <th className="text-left py-2">Modalidad</th>
                      <th className="text-left py-2">Imágenes</th>
                      <th className="text-left py-2">Calidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudios.map((e) => (
                      <tr key={e.id} className="border-b">
                        <td className="py-2">{e.codigo_estudio}</td>
                        <td className="py-2">{e.modalidad_id}</td>
                        <td className="py-2">{e.numero_imagenes}</td>
                        <td className="py-2">{e.calidad_imagen}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reportes">
            <Card>
              <CardHeader>
                <CardTitle>Reportes Radiológicos</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Fecha</th>
                      <th className="text-left py-2">Radiologo</th>
                      <th className="text-left py-2">Estado</th>
                      <th className="text-left py-2">Firmado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportes.map((r) => (
                      <tr key={r.id} className="border-b">
                        <td className="py-2">{new Date(r.fecha_reporte).toLocaleDateString()}</td>
                        <td className="py-2">{r.radiologo_id}</td>
                        <td className="py-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {r.estado_reporte}
                          </span>
                        </td>
                        <td className="py-2">{r.firmado ? '✓' : '-'}</td>
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
