import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHosixCompras } from '@/hooks/useHosixCompras';
import { PresupuestosManager } from '@/components/hosix/compras/PresupuestosManager';
import { LicitacionesManager } from '@/components/hosix/compras/LicitacionesManager';
import { OfertasManager } from '@/components/hosix/compras/OfertasManager';
import { AdjudicacionesManager } from '@/components/hosix/compras/AdjudicacionesManager';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, FileText, TrendingUp, CheckCircle } from 'lucide-react';

export default function ComprasPage() {
  const { usePresupuestosQuery, useLicitacionesQuery, useOfertasQuery, useAdjudicacionesQuery } = useHosixCompras();
  const { data: presupuestos = [] } = usePresupuestosQuery();
  const { data: licitaciones = [] } = useLicitacionesQuery();
  const { data: ofertas = [] } = useOfertasQuery();
  const { data: adjudicaciones = [] } = useAdjudicacionesQuery();
  const [selectedTab, setSelectedTab] = useState('dashboard');

  // KPIs
  const totalPresupuesto = presupuestos.reduce((sum: number, p: any) => sum + (p.monto_total || 0), 0);
  const presupuestoUtilizado = presupuestos.reduce((sum: number, p: any) => sum + (p.monto_utilizado || 0), 0);
  const presupuestoDisponible = presupuestos.reduce((sum: number, p: any) => sum + (p.monto_disponible || 0), 0);

  const licitacionesPorEstado = {
    borrador: licitaciones.filter((l: any) => l.estado === 'borrador').length,
    publicada: licitaciones.filter((l: any) => l.estado === 'publicada').length,
    evaluacion: licitaciones.filter((l: any) => l.estado === 'evaluacion').length,
    adjudicada: licitaciones.filter((l: any) => l.estado === 'adjudicada').length,
  };

  const estadoData = [
    { name: 'Borrador', value: licitacionesPorEstado.borrador },
    { name: 'Publicada', value: licitacionesPorEstado.publicada },
    { name: 'Evaluación', value: licitacionesPorEstado.evaluacion },
    { name: 'Adjudicada', value: licitacionesPorEstado.adjudicada },
  ];

  const montoData = presupuestos.slice(0, 5).map((p: any) => ({
    nombre: p.numero_presupuesto,
    total: p.monto_total,
    utilizado: p.monto_utilizado,
    disponible: p.monto_disponible,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestión de Compras (ADM 12.0)</h1>
          <p className="text-gray-600">Presupuestos, licitaciones, ofertas y adjudicaciones</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Presupuesto Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                ${(totalPresupuesto / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {presupuestos.length} presupuestos activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Utilizado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${(presupuestoUtilizado / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {totalPresupuesto > 0 ? ((presupuestoUtilizado / totalPresupuesto) * 100).toFixed(0) : 0}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Disponible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${(presupuestoDisponible / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {totalPresupuesto > 0 ? (100 - ((presupuestoUtilizado / totalPresupuesto) * 100)).toFixed(0) : 0}% restante
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Adjudicaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {adjudicaciones.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {adjudicaciones.filter((a: any) => a.estado === 'vigente').length} vigentes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="presupuestos">Presupuestos</TabsTrigger>
            <TabsTrigger value="licitaciones">Licitaciones</TabsTrigger>
            <TabsTrigger value="ofertas">Ofertas</TabsTrigger>
            <TabsTrigger value="adjudicaciones">Adjudicaciones</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Licitaciones por Estado */}
              <Card>
                <CardHeader>
                  <CardTitle>Licitaciones por Estado</CardTitle>
                  <CardDescription>Distribución de licitaciones activas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={estadoData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" name="Cantidad" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Presupuestos - Disponibilidad */}
              <Card>
                <CardHeader>
                  <CardTitle>Presupuestos - Disponibilidad</CardTitle>
                  <CardDescription>Montos por centro de coste</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={montoData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#ef4444" name="Total" />
                      <Line type="monotone" dataKey="utilizado" stroke="#f59e0b" name="Utilizado" />
                      <Line type="monotone" dataKey="disponible" stroke="#10b981" name="Disponible" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Estadísticas Generales */}
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas Generales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Presupuestos</p>
                      <p className="text-lg font-semibold">{presupuestos.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-500">Licitaciones</p>
                      <p className="text-lg font-semibold">{licitaciones.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-500">Ofertas</p>
                      <p className="text-lg font-semibold">{ofertas.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Adjudicadas</p>
                      <p className="text-lg font-semibold">{adjudicaciones.length}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Presupuestos Tab */}
          <TabsContent value="presupuestos">
            <PresupuestosManager />
          </TabsContent>

          {/* Licitaciones Tab */}
          <TabsContent value="licitaciones">
            <LicitacionesManager />
          </TabsContent>

          {/* Ofertas Tab */}
          <TabsContent value="ofertas">
            <OfertasManager />
          </TabsContent>

          {/* Adjudicaciones Tab */}
          <TabsContent value="adjudicaciones">
            <AdjudicacionesManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
