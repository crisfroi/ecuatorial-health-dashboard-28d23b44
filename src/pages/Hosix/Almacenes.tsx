import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AlmacenesManager from '@/components/hosix/almacenes/AlmacenesManager';
import DepositosManager from '@/components/hosix/almacenes/DepositosManager';
import StockManager from '@/components/hosix/almacenes/StockManager';
import MovimientosManager from '@/components/hosix/almacenes/MovimientosManager';
import InventarioManager from '@/components/hosix/almacenes/InventarioManager';
import { useHosixAlmacenes } from '@/hooks/useHosixAlmacenes';
import { Package, Warehouse, TrendingUp, ArrowRightLeft, ClipboardList } from 'lucide-react';

export default function Almacenes() {
  const {
    almacenes,
    depositos,
    stock,
    movimientos,
    inventarios,
  } = useHosixAlmacenes();

  const [activeTab, setActiveTab] = useState('resumen');

  // Cálculos de KPIs
  const stockBajo = stock.filter(
    (s) => s.stock_minimo && s.cantidad_disponible < s.stock_minimo
  ).length;

  const movimientosHoy = movimientos.filter((m) => {
    const today = new Date().toLocaleDateString();
    const movDate = new Date(m.created_at).toLocaleDateString();
    return today === movDate;
  }).length;

  const inventariosActivos = inventarios.filter(
    (i) => i.estado === 'en_proceso'
  ).length;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Warehouse className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Gestión de Almacenes</h1>
          <p className="text-gray-600">ADM 11.0 - Administración de depósitos y control de stock</p>
        </div>
      </div>

      {/* Dashboard de Resumen */}
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Almacenes</p>
                  <p className="text-3xl font-bold">{almacenes.length}</p>
                </div>
                <Warehouse className="h-10 w-10 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Depósitos</p>
                  <p className="text-3xl font-bold">{depositos.length}</p>
                </div>
                <Package className="h-10 w-10 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Items en Stock</p>
                  <p className="text-3xl font-bold">{stock.length}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stock Bajo</p>
                  <p className="text-3xl font-bold text-yellow-600">{stockBajo}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-yellow-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mov. Hoy</p>
                  <p className="text-3xl font-bold">{movimientosHoy}</p>
                </div>
                <ArrowRightLeft className="h-10 w-10 text-orange-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Información de Inventarios Activos */}
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Últimos Movimientos</p>
              <p className="text-3xl font-bold text-blue-600">
                {movimientos.slice(0, 10).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">de los últimos 10</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Inventarios Activos</p>
              <p className="text-3xl font-bold text-orange-600">{inventariosActivos}</p>
              <p className="text-xs text-gray-500 mt-1">en proceso</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Almacenes Refrigerados</p>
              <p className="text-3xl font-bold text-green-600">
                {almacenes.filter((a) => a.requiere_refrigeracion).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">con control de temperatura</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="almacenes">Almacenes</TabsTrigger>
          <TabsTrigger value="depositos">Depósitos</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
        </TabsList>

        <TabsList className="grid w-full grid-cols-1 lg:w-auto mt-2">
          <TabsTrigger value="inventarios">Inventarios</TabsTrigger>
        </TabsList>

        {/* Tab: Almacenes */}
        <TabsContent value="almacenes" className="space-y-6">
          <AlmacenesManager />
        </TabsContent>

        {/* Tab: Depósitos */}
        <TabsContent value="depositos" className="space-y-6">
          <DepositosManager />
        </TabsContent>

        {/* Tab: Stock */}
        <TabsContent value="stock" className="space-y-6">
          <StockManager />
        </TabsContent>

        {/* Tab: Movimientos */}
        <TabsContent value="movimientos" className="space-y-6">
          <MovimientosManager />
        </TabsContent>

        {/* Tab: Inventarios */}
        <TabsContent value="inventarios" className="space-y-6">
          <InventarioManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
