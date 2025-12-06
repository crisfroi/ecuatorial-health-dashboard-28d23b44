import React, { useState } from 'react'
import { useHosixCRED } from '@/hooks/useHosixCRED'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function CREDPage() {
  const { seguimientos, vacunaciones } = useHosixCRED()
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">CRED - Crecimiento y Desarrollo (ASIS 5.0)</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Control CRED
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Controles CRED</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{seguimientos.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vacunaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vacunaciones.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Niños Seguidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(seguimientos.map(s => s.paciente_id)).size}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Última Actualización</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">{seguimientos.length > 0 ? new Date(seguimientos[0].fecha_control).toLocaleDateString() : '-'}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
            <TabsTrigger value="vacunas">Vacunas</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle>CRED - Crecimiento y Desarrollo Infantil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Sistema de seguimiento de crecimiento, desarrollo y vacunación infantil integrado.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seguimiento">
            <Card>
              <CardHeader>
                <CardTitle>Controles de Crecimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Fecha</th>
                      <th className="text-left py-2">Edad (meses)</th>
                      <th className="text-left py-2">Peso</th>
                      <th className="text-left py-2">Talla</th>
                      <th className="text-left py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seguimientos.map((s) => (
                      <tr key={s.id} className="border-b">
                        <td className="py-2">{new Date(s.fecha_control).toLocaleDateString()}</td>
                        <td className="py-2">{s.edad_meses}</td>
                        <td className="py-2">{s.peso_kg} kg</td>
                        <td className="py-2">{s.talla_cm} cm</td>
                        <td className="py-2">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {s.estado_nutricional || 'Normal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vacunas">
            <Card>
              <CardHeader>
                <CardTitle>Esquema de Vacunación</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Fecha</th>
                      <th className="text-left py-2">Vacuna</th>
                      <th className="text-left py-2">Lote</th>
                      <th className="text-left py-2">Dosis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vacunaciones.map((v) => (
                      <tr key={v.id} className="border-b">
                        <td className="py-2">{new Date(v.fecha_vacunacion).toLocaleDateString()}</td>
                        <td className="py-2">{v.vacuna_nombre}</td>
                        <td className="py-2">{v.vacuna_lote}</td>
                        <td className="py-2">{v.dosis}</td>
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
