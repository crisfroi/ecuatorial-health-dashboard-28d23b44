import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Calculator,
  PieChart as PieChartIcon,
  BarChart3,
  Target,
  Users,
  Calendar,
  Settings,
} from "lucide-react";
import { useEstadisticasAvanzadas } from "@/hooks/useEstadisticasAvanzadas";

interface FinancialAnalyticsProps {
  onNavigateToTab?: (tab: string) => void;
}

const FinancialAnalytics: React.FC<FinancialAnalyticsProps> = ({
  onNavigateToTab,
}) => {
  const { data: stats } = useEstadisticasAvanzadas();

  // Financial configuration state
  const [applicationFee, setApplicationFee] = useState<number>(25000); // XAF
  const [renewalFee, setRenewalFee] = useState<number>(15000); // XAF
  const [projectedProfessionals, setProjectedProfessionals] =
    useState<number>(1000);
  const [projectedPeriod, setProjectedPeriod] = useState<string>("yearly");
  const [showSimulation, setShowSimulation] = useState<boolean>(false);

  // Current statistics from database
  const currentData = useMemo(() => {
    if (!stats) return null;

    const approved = stats.aprobados || 0;
    const pending = stats.recibidos + stats.revisando || 0;
    const expired = stats.carnetVencidos || 0;
    const nearExpiry = stats.vencimientosProximos || 0;

    return {
      approved,
      pending,
      expired,
      nearExpiry,
      total: approved + pending,
      currentRevenue: approved * applicationFee,
      pendingRevenue: pending * applicationFee,
      renewalRevenue: (expired + nearExpiry) * renewalFee,
    };
  }, [stats, applicationFee, renewalFee]);

  // Projection calculations
  const projectionData = useMemo(() => {
    if (!currentData) return null;

    const months =
      projectedPeriod === "yearly"
        ? 12
        : projectedPeriod === "quarterly"
          ? 3
          : 1;
    const monthlyGrowth = projectedProfessionals / months;

    const projections = [];
    let cumulativeApproved = currentData.approved;
    let cumulativeRevenue = currentData.currentRevenue;

    for (let i = 1; i <= months; i++) {
      const newApprovals = Math.round(monthlyGrowth);
      const renewals = Math.round((cumulativeApproved * 0.15) / 12); // 15% annual renewal rate

      cumulativeApproved += newApprovals;
      const monthRevenue =
        newApprovals * applicationFee + renewals * renewalFee;
      cumulativeRevenue += monthRevenue;

      const monthName = new Date(2024, i - 1).toLocaleDateString("es-ES", {
        month: "short",
      });

      projections.push({
        month: monthName,
        monthNumber: i,
        newApprovals,
        renewals,
        monthRevenue,
        cumulativeRevenue,
        cumulativeApproved,
        revenueXAF: monthRevenue.toLocaleString("fr-FR") + " XAF",
        cumulativeXAF: cumulativeRevenue.toLocaleString("fr-FR") + " XAF",
      });
    }

    return projections;
  }, [
    currentData,
    applicationFee,
    renewalFee,
    projectedProfessionals,
    projectedPeriod,
  ]);

  // Revenue breakdown for current state
  const revenueBreakdown = useMemo(() => {
    if (!currentData) return [];

    return [
      {
        name: "Ingresos Actuales",
        value: currentData.currentRevenue,
        color: "#22c55e",
      },
      {
        name: "Ingresos Pendientes",
        value: currentData.pendingRevenue,
        color: "#f59e0b",
      },
      {
        name: "Renovaciones Potenciales",
        value: currentData.renewalRevenue,
        color: "#3b82f6",
      },
    ];
  }, [currentData]);

  const formatXAF = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!currentData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">
          Cargando análisis financiero...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Análisis Financiero
          </h2>
          <p className="text-gray-600 mt-2">
            Proyecciones de ingresos en Francos CFA (XAF) del sistema de
            profesionales sanitarios
          </p>
        </div>
        <Button
          variant={showSimulation ? "default" : "outline"}
          onClick={() => setShowSimulation(!showSimulation)}
        >
          <Calculator className="w-4 h-4 mr-2" />
          {showSimulation ? "Ver Datos Reales" : "Activar Simulación"}
        </Button>
      </div>

      {/* Financial Configuration Panel */}
      {showSimulation && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Configuración Financiera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="applicationFee">Precio Solicitud (XAF)</Label>
                <Input
                  id="applicationFee"
                  type="number"
                  value={applicationFee}
                  onChange={(e) => setApplicationFee(Number(e.target.value))}
                  min={0}
                />
              </div>
              <div>
                <Label htmlFor="renewalFee">Precio Renovación (XAF)</Label>
                <Input
                  id="renewalFee"
                  type="number"
                  value={renewalFee}
                  onChange={(e) => setRenewalFee(Number(e.target.value))}
                  min={0}
                />
              </div>
              <div>
                <Label htmlFor="projectedProfessionals">
                  Nuevos Profesionales Proyectados
                </Label>
                <Input
                  id="projectedProfessionals"
                  type="number"
                  value={projectedProfessionals}
                  onChange={(e) =>
                    setProjectedProfessionals(Number(e.target.value))
                  }
                  min={0}
                />
              </div>
              <div>
                <Label htmlFor="projectedPeriod">Período de Proyección</Label>
                <Select
                  value={projectedPeriod}
                  onValueChange={setProjectedPeriod}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-green-100">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Ingresos Actuales
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatXAF(currentData.currentRevenue)}
                </p>
                <p className="text-xs text-gray-500">
                  {currentData.approved} profesionales aprobados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-orange-100">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Ingresos Pendientes
                </h3>
                <p className="text-2xl font-bold text-orange-600">
                  {formatXAF(currentData.pendingRevenue)}
                </p>
                <p className="text-xs text-gray-500">
                  {currentData.pending} solicitudes en proceso
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-blue-100">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Renovaciones Potenciales
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {formatXAF(currentData.renewalRevenue)}
                </p>
                <p className="text-xs text-gray-500">
                  {currentData.expired + currentData.nearExpiry} carnets a
                  renovar
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-purple-100">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Ingresos Totales Potenciales
                </h3>
                <p className="text-2xl font-bold text-purple-600">
                  {formatXAF(
                    currentData.currentRevenue +
                      currentData.pendingRevenue +
                      currentData.renewalRevenue,
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  Incluyendo todas las fuentes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <Tabs defaultValue="breakdown" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="breakdown">Desglose Actual</TabsTrigger>
          <TabsTrigger value="projections">Proyecciones</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="comparison">Comparación</TabsTrigger>
        </TabsList>

        {/* Revenue Breakdown */}
        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-blue-600" />
                  Distribución de Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) =>
                        `${name}: ${formatXAF(value)}`
                      }
                    >
                      {revenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatXAF(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Ingresos por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        `${(value / 1000000).toFixed(1)}M`
                      }
                    />
                    <Tooltip formatter={(value) => formatXAF(Number(value))} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projections */}
        <TabsContent value="projections" className="space-y-6">
          {projectionData && (
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Proyección de Ingresos -{" "}
                    {projectedPeriod === "yearly"
                      ? "Anual"
                      : projectedPeriod === "quarterly"
                        ? "Trimestral"
                        : "Mensual"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={projectionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis
                        tickFormatter={(value) =>
                          `${(value / 1000000).toFixed(1)}M`
                        }
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          name === "monthRevenue" ||
                          name === "cumulativeRevenue"
                            ? formatXAF(Number(value))
                            : value,
                          name === "monthRevenue"
                            ? "Ingresos del Mes"
                            : name === "cumulativeRevenue"
                              ? "Ingresos Acumulados"
                              : name === "newApprovals"
                                ? "Nuevas Aprobaciones"
                                : name === "renewals"
                                  ? "Renovaciones"
                                  : name,
                        ]}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="cumulativeRevenue"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                        name="Ingresos Acumulados"
                      />
                      <Area
                        type="monotone"
                        dataKey="monthRevenue"
                        stackId="2"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                        name="Ingresos Mensuales"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalles de Proyección</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Mes</th>
                          <th className="text-right p-2">
                            Nuevas Aprobaciones
                          </th>
                          <th className="text-right p-2">Renovaciones</th>
                          <th className="text-right p-2">Ingresos del Mes</th>
                          <th className="text-right p-2">
                            Ingresos Acumulados
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectionData.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{item.month}</td>
                            <td className="text-right p-2">
                              {item.newApprovals}
                            </td>
                            <td className="text-right p-2">{item.renewals}</td>
                            <td className="text-right p-2">
                              {formatXAF(item.monthRevenue)}
                            </td>
                            <td className="text-right p-2 font-medium">
                              {formatXAF(item.cumulativeRevenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Tendencias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {(
                      (currentData.approved /
                        (currentData.approved + currentData.pending)) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                  <div className="text-sm text-gray-600">
                    Tasa de Aprobación
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatXAF(applicationFee)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Precio por Solicitud
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatXAF(
                      currentData.currentRevenue / currentData.approved || 0,
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    Ingreso Promedio por Profesional
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison */}
        <TabsContent value="comparison" className="space-y-6">
          {projectionData && (
            <Card>
              <CardHeader>
                <CardTitle>Comparación: Actual vs Proyectado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Situación Actual</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Profesionales Aprobados:</span>
                        <Badge>{currentData.approved}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Ingresos Generados:</span>
                        <Badge variant="outline">
                          {formatXAF(currentData.currentRevenue)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Ingresos Potenciales:</span>
                        <Badge variant="outline">
                          {formatXAF(
                            currentData.currentRevenue +
                              currentData.pendingRevenue,
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Proyección Final</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Profesionales Proyectados:</span>
                        <Badge>
                          {
                            projectionData[projectionData.length - 1]
                              .cumulativeApproved
                          }
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Ingresos Proyectados:</span>
                        <Badge variant="outline">
                          {formatXAF(
                            projectionData[projectionData.length - 1]
                              .cumulativeRevenue,
                          )}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Crecimiento Esperado:</span>
                        <Badge className="bg-green-100 text-green-800">
                          +
                          {(
                            ((projectionData[projectionData.length - 1]
                              .cumulativeRevenue -
                              currentData.currentRevenue) /
                              currentData.currentRevenue) *
                            100
                          ).toFixed(1)}
                          %
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialAnalytics;
