import React from 'react';
import { BarChart3, TrendingUp, PieChart, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BiPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Intelligence</h1>
          <p className="text-gray-500 mt-1">
            Reportes y análisis del sistema HOSIX
          </p>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <BarChart3 className="w-4 h-4" />
          Generar Reporte
        </Button>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Pacientes Atendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">892</div>
            <p className="text-xs text-green-600 mt-1">↑ 12.5% este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Ocupación Camas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">75%</div>
            <p className="text-xs text-gray-600 mt-1">45 de 60 camas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Ingresos Mensuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$45.2K</div>
            <p className="text-xs text-green-600 mt-1">↑ 8.3% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Satisfacción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4.6/5</div>
            <p className="text-xs text-gray-600 mt-1">842 evaluaciones</p>
          </CardContent>
        </Card>
      </div>

      {/* Reportes */}
      <Tabs defaultValue="actividad">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
          <TabsTrigger value="financiero">Financiero</TabsTrigger>
          <TabsTrigger value="clinico">Clínico</TabsTrigger>
          <TabsTrigger value="operativo">Operativo</TabsTrigger>
        </TabsList>

        {/* Actividad */}
        <TabsContent value="actividad" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reporte de Actividad</CardTitle>
              <CardDescription>Resumen de actividades del mes actual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Citas Realizadas</p>
                  <div className="text-2xl font-bold">234</div>
                  <p className="text-xs text-gray-500 mt-1">De 250 programadas</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Urgencias Atendidas</p>
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-xs text-gray-500 mt-1">Tiempo promedio: 45 min</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Intervenciones</p>
                  <div className="text-2xl font-bold">47</div>
                  <p className="text-xs text-gray-500 mt-1">Tasa éxito: 98.9%</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Altas Realizadas</p>
                  <div className="text-2xl font-bold">89</div>
                  <p className="text-xs text-gray-500 mt-1">Estancia promedio: 4.2 días</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financiero */}
        <TabsContent value="financiero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reporte Financiero</CardTitle>
              <CardDescription>Análisis de ingresos y gastos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Ingresos Totales</p>
                  <div className="text-2xl font-bold">$45,240</div>
                  <p className="text-xs text-green-600 mt-1">↑ 8.3% este mes</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Gastos Operativos</p>
                  <div className="text-2xl font-bold">$28,950</div>
                  <p className="text-xs text-gray-500 mt-1">64% de ingresos</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Margen Neto</p>
                  <div className="text-2xl font-bold">$16,290</div>
                  <p className="text-xs text-green-600 mt-1">↑ 12.1% este mes</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Facturas Pendientes</p>
                  <div className="text-2xl font-bold">$8,450</div>
                  <p className="text-xs text-orange-600 mt-1">18.7% del total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clínico */}
        <TabsContent value="clinico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reporte Clínico</CardTitle>
              <CardDescription>Indicadores de calidad clínica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Tasa de Mortalidad</p>
                  <div className="text-2xl font-bold">0.8%</div>
                  <p className="text-xs text-gray-500 mt-1">Dentro de estándares</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Complicaciones</p>
                  <div className="text-2xl font-bold">2.3%</div>
                  <p className="text-xs text-gray-500 mt-1">Mejora continua</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Infecciones Hospitalarias</p>
                  <div className="text-2xl font-bold">0.5%</div>
                  <p className="text-xs text-green-600 mt-1">↓ 0.2% desde mes anterior</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Satisfacción Pacientes</p>
                  <div className="text-2xl font-bold">4.6/5</div>
                  <p className="text-xs text-green-600 mt-1">↑ 0.2 puntos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operativo */}
        <TabsContent value="operativo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reporte Operativo</CardTitle>
              <CardDescription>Indicadores de operación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Disponibilidad Sistema</p>
                  <div className="text-2xl font-bold">99.8%</div>
                  <p className="text-xs text-green-600 mt-1">SLA cumplido</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Tiempo Respuesta Promedio</p>
                  <div className="text-2xl font-bold">245ms</div>
                  <p className="text-xs text-gray-500 mt-1">Excelente</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Usuarios Activos</p>
                  <div className="text-2xl font-bold">87</div>
                  <p className="text-xs text-gray-500 mt-1">Pico: 156 hoy</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">Transacciones</p>
                  <div className="text-2xl font-bold">12,456</div>
                  <p className="text-xs text-gray-500 mt-1">Hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BiPage;
