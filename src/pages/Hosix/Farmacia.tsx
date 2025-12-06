import React, { useState } from 'react'
import { useHosixFarmacia } from '@/hooks/useHosixFarmacia'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { HosixLayout } from '@/components/hosix/HosixLayout'

export default function FarmaciaPage() {
  const { dispensarios, dispensaciones, farmacovigilancia } = useHosixFarmacia()
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <HosixLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Farmacia Clínica (ASIS 10.0)</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Dispensación
          </Button>
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
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="dispensaciones">Dispensaciones</TabsTrigger>
            <TabsTrigger value="farmacovigilancia">Farmacovigilancia</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle>Farmacia Clínica</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Gestión de dispensación de medicamentos, farmacovigilancia y evaluación clínica.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dispensaciones">
            <Card>
              <CardHeader>
                <CardTitle>Dispensaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Fecha</th>
                      <th className="text-left py-2">Medicamento</th>
                      <th className="text-left py-2">Cantidad</th>
                      <th className="text-left py-2">Lote</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispensaciones.map((d) => (
                      <tr key={d.id} className="border-b">
                        <td className="py-2">{new Date(d.fecha_dispensacion).toLocaleString()}</td>
                        <td className="py-2">{d.medicamento_id}</td>
                        <td className="py-2">{d.cantidad_dispensada} {d.unidad_dispensacion}</td>
                        <td className="py-2">{d.lote_medicamento}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="farmacovigilancia">
            <Card>
              <CardHeader>
                <CardTitle>Eventos Adversos (Farmacovigilancia)</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Fecha</th>
                      <th className="text-left py-2">Tipo Evento</th>
                      <th className="text-left py-2">Severidad</th>
                      <th className="text-left py-2">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmacovigilancia.map((f) => (
                      <tr key={f.id} className="border-b">
                        <td className="py-2">{new Date(f.fecha_evento).toLocaleDateString()}</td>
                        <td className="py-2">{f.tipo_evento}</td>
                        <td className="py-2">
                          <span className={`text-xs px-2 py-1 rounded ${f.severidad_evento === 'grave' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {f.severidad_evento}
                          </span>
                        </td>
                        <td className="py-2">{f.resultado_evento}</td>
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
