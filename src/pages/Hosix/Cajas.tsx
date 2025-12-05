import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CajasManager } from '@/components/hosix/cajas/CajasManager';
import { TurnosCajaManager } from '@/components/hosix/cajas/TurnosCajaManager';
import { MovimientosCajaForm } from '@/components/hosix/cajas/MovimientosCajaForm';
import { CierresCajaManager } from '@/components/hosix/cajas/CierresCajaManager';
import { ArqueosManager } from '@/components/hosix/cajas/ArqueosManager';
import { useHosixCajas } from '@/hooks/useHosixCajas';
import { CreditCard, Clock, Zap, CheckCircle, Percent } from 'lucide-react';

export default function CajasPage() {
  const { cajas, turnos, movimientos, cierres, arqueos } = useHosixCajas();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Cálculos para dashboard
  const cajasActivas = cajas.filter(c => c.estado === 'abierta' && c.activo).length;
  const turnosActivos = turnos.filter(t => t.estado === 'abierto').length;
  const movimientosHoy = movimientos.filter(m => {
    const hoy = new Date();
    const fecha = new Date(m.fecha_movimiento);
    return fecha.toDateString() === hoy.toDateString();
  }).length;
  
  const cierresHoy = cierres.filter(c => {
    const hoy = new Date();
    const fecha = new Date(c.fecha_cierre);
    return fecha.toDateString() === hoy.toDateString();
  }).length;

  const totalMovimientosHoy = movimientos
    .filter(m => {
      const hoy = new Date();
      const fecha = new Date(m.fecha_movimiento);
      return fecha.toDateString() === hoy.toDateString();
    })
    .reduce((sum, m) => {
      if (m.tipo_movimiento === 'cobro') return sum + m.monto;
      if (m.tipo_movimiento === 'pago') return sum - m.monto;
      return sum;
    }, 0);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold">Módulo de Cajas</h1>
        <p className="text-muted-foreground mt-2">
          Gestione cajas, turnos, movimientos y arqueos del hospital
        </p>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cajas Activas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cajasActivas}</div>
            <p className="text-xs text-muted-foreground">cajas disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Abiertos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{turnosActivos}</div>
            <p className="text-xs text-muted-foreground">turnos en proceso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimientos Hoy</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{movimientosHoy}</div>
            <p className="text-xs text-muted-foreground">transacciones registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cierres Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cierresHoy}</div>
            <p className="text-xs text-muted-foreground">cierres completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Movido</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalMovimientosHoy >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalMovimientosHoy.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">hoy</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="cajas">Cajas</TabsTrigger>
          <TabsTrigger value="turnos">Turnos</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="cierres">Cierres</TabsTrigger>
          <TabsTrigger value="arqueos">Arqueos</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen Diario de Cajas</CardTitle>
              <CardDescription>
                Estado actual del sistema de cajas del hospital
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cajas */}
                <div>
                  <h4 className="font-semibold mb-4">Cajas por Estado</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Abiertas</span>
                      <span className="font-bold text-lg text-green-600">
                        {cajas.filter(c => c.estado === 'abierta').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cerradas</span>
                      <span className="font-bold text-lg text-red-600">
                        {cajas.filter(c => c.estado === 'cerrada').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">En Mantenimiento</span>
                      <span className="font-bold text-lg text-yellow-600">
                        {cajas.filter(c => c.estado === 'mantenimiento').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Turnos */}
                <div>
                  <h4 className="font-semibold mb-4">Turnos por Estado</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Abiertos</span>
                      <span className="font-bold text-lg text-green-600">
                        {turnos.filter(t => t.estado === 'abierto').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cerrados</span>
                      <span className="font-bold text-lg text-slate-600">
                        {turnos.filter(t => t.estado === 'cerrado').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Movimientos */}
                <div>
                  <h4 className="font-semibold mb-4">Movimientos Hoy</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cobros</span>
                      <span className="font-bold text-lg text-green-600">
                        {movimientosHoy > 0 ? (
                          <>+${movimientos
                            .filter(m => {
                              const hoy = new Date();
                              const fecha = new Date(m.fecha_movimiento);
                              return fecha.toDateString() === hoy.toDateString() && m.tipo_movimiento === 'cobro';
                            })
                            .reduce((sum, m) => sum + m.monto, 0)
                            .toFixed(2)}
                          </>
                        ) : (
                          '$0.00'
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pagos</span>
                      <span className="font-bold text-lg text-red-600">
                        -{movimientos
                          .filter(m => {
                            const hoy = new Date();
                            const fecha = new Date(m.fecha_movimiento);
                            return fecha.toDateString() === hoy.toDateString() && m.tipo_movimiento === 'pago';
                          })
                          .reduce((sum, m) => sum + m.monto, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cierres */}
                <div>
                  <h4 className="font-semibold mb-4">Cierres Hoy</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cuadrados</span>
                      <span className="font-bold text-lg text-green-600">
                        {cierres.filter(c => {
                          const hoy = new Date();
                          const fecha = new Date(c.fecha_cierre);
                          return fecha.toDateString() === hoy.toDateString() && Math.abs(c.diferencia) < 0.01;
                        }).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Descuadres</span>
                      <span className="font-bold text-lg text-orange-600">
                        {cierres.filter(c => {
                          const hoy = new Date();
                          const fecha = new Date(c.fecha_cierre);
                          return fecha.toDateString() === hoy.toDateString() && Math.abs(c.diferencia) >= 0.01;
                        }).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cajas Tab */}
        <TabsContent value="cajas">
          <CajasManager />
        </TabsContent>

        {/* Turnos Tab */}
        <TabsContent value="turnos">
          <TurnosCajaManager />
        </TabsContent>

        {/* Movimientos Tab */}
        <TabsContent value="movimientos">
          <MovimientosCajaForm />
        </TabsContent>

        {/* Cierres Tab */}
        <TabsContent value="cierres">
          <CierresCajaManager />
        </TabsContent>

        {/* Arqueos Tab */}
        <TabsContent value="arqueos">
          <ArqueosManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
