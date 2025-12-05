import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Building2, TrendingUp, FileText } from 'lucide-react';
import AseguradorasList from '@/components/hosix/facturacion/AseguradorasList';
import TarifasManager from '@/components/hosix/facturacion/TarifasManager';
import CuentasManager from '@/components/hosix/facturacion/CuentasManager';
import FacturasGenerator from '@/components/hosix/facturacion/FacturasGenerator';
import FacturasList from '@/components/hosix/facturacion/FacturasList';
import { useHosixFacturacion } from '@/hooks/useHosixFacturacion';

export default function Facturacion() {
  const {
    aseguradoras,
    cuentas,
    facturas,
    isLoadingAseguradoras,
    isLoadingCuentas,
    isLoadingFacturas,
  } = useHosixFacturacion();

  const cuentasAbiertas = cuentas.filter((c) => c.estado === 'abierta').length;
  const facturasEmitidas = facturas.filter((f) => f.estado === 'emitida').length;
  const totalFacturado = facturas.reduce((sum, f) => sum + f.total, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold">Facturación</h1>
          </div>
          <p className="text-gray-600">
            Gestión integral de aseguradoras, tarifas, cuentas y facturas
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Aseguradoras Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {isLoadingAseguradoras ? '-' : aseguradoras.filter((a) => a.activo).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Cuentas Abiertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {isLoadingCuentas ? '-' : cuentasAbiertas}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Facturas Emitidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">
                {isLoadingFacturas ? '-' : facturasEmitidas}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Facturado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                ${isLoadingFacturas ? '-' : totalFacturado.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Gestión */}
        <Tabs defaultValue="cuentas" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="cuentas" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Cuentas</span>
            </TabsTrigger>
            <TabsTrigger value="facturas" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Facturas</span>
            </TabsTrigger>
            <TabsTrigger value="generar" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Generar</span>
            </TabsTrigger>
            <TabsTrigger value="aseguradoras" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Aseguradoras</span>
            </TabsTrigger>
            <TabsTrigger value="tarifas" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Tarifas</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Cuentas */}
          <TabsContent value="cuentas" className="space-y-4">
            <CuentasManager />
          </TabsContent>

          {/* Tab: Facturas */}
          <TabsContent value="facturas" className="space-y-4">
            <FacturasList />
          </TabsContent>

          {/* Tab: Generar Facturas */}
          <TabsContent value="generar" className="space-y-4">
            <FacturasGenerator />
          </TabsContent>

          {/* Tab: Aseguradoras */}
          <TabsContent value="aseguradoras" className="space-y-4">
            <AseguradorasList />
          </TabsContent>

          {/* Tab: Tarifas */}
          <TabsContent value="tarifas" className="space-y-4">
            <TarifasManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
