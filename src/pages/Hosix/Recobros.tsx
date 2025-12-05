import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RecobrosManager } from '@/components/hosix/recobros/RecobrosManager';
import { NotasCargoCredito } from '@/components/hosix/recobros/NotasCargoCredito';
import { MorosidadAnalytics } from '@/components/hosix/recobros/MorosidadAnalytics';
import { useHosixRecobros } from '@/hooks/useHosixRecobros';
import { TrendingDown, FileText, AlertTriangle, PieChart } from 'lucide-react';

export default function RecobrosPage() {
  const { recobros, notasCargo, notasCredito, solicitudes, morosidad } = useHosixRecobros();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Cálculos para dashboard
  const recobrosPendientes = recobros.filter(r => r.estado === 'pendiente').length;
  const recobrosEnProceso = recobros.filter(r => r.estado === 'en_proceso').length;
  const totalRecobros = recobros.reduce((sum, r) => sum + r.monto_original, 0);
  const totalRecobrado = recobros.reduce((sum, r) => sum + r.monto_recobrado, 0);
  const notasCargoPendientes = notasCargo.filter(n => n.estado === 'emitida').length;
  const notasCreditoPendientes = notasCredito.filter(n => n.estado === 'emitida').length;
  const totalDeudor = morosidad.reduce((sum, m) => sum + m.saldo_deudor, 0);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold">Módulo de Recobros</h1>
        <p className="text-muted-foreground mt-2">
          Gestione recobros de facturas, notas de cargo/crédito y análisis de morosidad
        </p>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recobros Pendientes</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recobrosPendientes}</div>
            <p className="text-xs text-muted-foreground">solicitudes activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recobros</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRecobrado.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">de ${totalRecobros.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notas Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notasCargoPendientes + notasCreditoPendientes}</div>
            <p className="text-xs text-muted-foreground">cargo y crédito</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Deudor</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalDeudor.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">pendiente de cobro</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="recobros">Recobros</TabsTrigger>
          <TabsTrigger value="notas">Notas C/C</TabsTrigger>
          <TabsTrigger value="morosidad">Morosidad</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resumen Recobros */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen de Recobros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pendientes</span>
                    <span className="font-bold text-lg text-red-600">{recobrosPendientes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">En Proceso</span>
                    <span className="font-bold text-lg text-blue-600">{recobrosEnProceso}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Solicitado</span>
                    <span className="font-bold text-lg">${totalRecobros.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="text-sm font-semibold">Total Recobrado</span>
                    <span className="font-bold text-lg text-green-600">${totalRecobrado.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumen Notas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notas de Cargo y Crédito</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Notas de Cargo Pendientes</span>
                    <span className="font-bold text-lg text-orange-600">{notasCargoPendientes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Notas de Cargo Aprobadas</span>
                    <span className="font-bold text-lg text-green-600">
                      {notasCargo.filter(n => n.estado === 'aprobada').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Notas de Crédito Pendientes</span>
                    <span className="font-bold text-lg text-blue-600">{notasCreditoPendientes}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="text-sm font-semibold">Total Notas</span>
                    <span className="font-bold text-lg">{notasCargo.length + notasCredito.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recobros Tab */}
        <TabsContent value="recobros">
          <RecobrosManager />
        </TabsContent>

        {/* Notas Tab */}
        <TabsContent value="notas">
          <NotasCargoCredito />
        </TabsContent>

        {/* Morosidad Tab */}
        <TabsContent value="morosidad">
          <MorosidadAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
