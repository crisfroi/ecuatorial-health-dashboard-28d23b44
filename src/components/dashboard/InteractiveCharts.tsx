import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap,
  Cell,
  ScatterChart,
  Scatter,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Target,
} from "lucide-react";

interface InteractiveChartsProps {
  areaStats: any[];
  districtStats: any[];
  ageStats: any[];
  graduationStats: any[];
  centerStats: any[];
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
  "#8DD1E1",
  "#D084D0",
];

const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  areaStats,
  districtStats,
  ageStats,
  graduationStats,
  centerStats,
}) => {
  const [selectedView, setSelectedView] = useState("performance");
  const [selectedMetric, setSelectedMetric] = useState("total");

  // Process data for different visualizations
  const performanceData = areaStats.map((area) => ({
    name: area.area_profesional,
    aprobados: area.aprobados,
    pendientes: area.pendientes,
    total: area.total,
    eficiencia: area.total > 0 ? (area.aprobados / area.total) * 100 : 0,
    porcentaje: area.porcentaje,
  }));

  const districtPerformance = districtStats.map((district) => ({
    name: district.distrito_sanitario,
    profesionales: district.total_profesionales,
    centros: district.total_centros,
    ratio:
      district.total_centros > 0
        ? district.total_profesionales / district.total_centros
        : 0,
  }));

  const graduationTrends = graduationStats.map((grad) => ({
    año: grad.año_graduacion,
    cantidad: grad.cantidad,
    acumulado: graduationStats
      .filter((g) => g.año_graduacion <= grad.año_graduacion)
      .reduce((sum, g) => sum + g.cantidad, 0),
  }));

  const ageDistributionScatter = ageStats.map((age, index) => ({
    x: index + 1,
    y: age.cantidad,
    z: age.porcentaje,
    name: age.rango_edad,
  }));

  // Funnel data for application process
  const applicationFunnel = [
    {
      name: "Solicitudes Recibidas",
      value: areaStats.reduce((sum, area) => sum + area.total, 0),
      fill: "#8884d8",
    },
    {
      name: "En Revisión",
      value: areaStats.reduce((sum, area) => sum + area.pendientes, 0),
      fill: "#83a6ed",
    },
    {
      name: "Aprobadas",
      value: areaStats.reduce((sum, area) => sum + area.aprobados, 0),
      fill: "#8dd1e1",
    },
  ];

  // Treemap data for areas
  const treemapData = areaStats.slice(0, 10).map((area, index) => ({
    name: area.area_profesional,
    size: area.total,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const TreemapTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p>Profesionales: {data.size}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">
            Visualizaciones Interactivas
          </h3>
          <p className="text-gray-600">
            Análisis avanzados con múltiples perspectivas
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo de visualización" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="performance">Rendimiento</SelectItem>
              <SelectItem value="comparison">Comparación</SelectItem>
              <SelectItem value="trends">Tendencias</SelectItem>
              <SelectItem value="distribution">Distribución</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Métrica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="total">Total</SelectItem>
              <SelectItem value="aprobados">Aprobados</SelectItem>
              <SelectItem value="eficiencia">Eficiencia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance View */}
      {selectedView === "performance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Rendimiento por Área Profesional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={performanceData.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={10}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="aprobados"
                    fill="#00C49F"
                    name="Aprobados"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="pendientes"
                    fill="#FFBB28"
                    name="Pendientes"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="eficiencia"
                    stroke="#FF8042"
                    strokeWidth={3}
                    name="% Eficiencia"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Embudo de Procesamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <FunnelChart>
                  <Tooltip />
                  <Funnel
                    dataKey="value"
                    data={applicationFunnel}
                    isAnimationActive
                  >
                    <LabelList position="center" fill="#fff" stroke="none" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparison View */}
      {selectedView === "comparison" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Comparación de Distritos Sanitarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={districtPerformance.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={10}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="profesionales"
                    fill="#8884d8"
                    name="Profesionales"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="centros"
                    fill="#82ca9d"
                    name="Centros"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ratio"
                    stroke="#ff7300"
                    strokeWidth={3}
                    name="Ratio Prof/Centro"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-orange-600" />
                Mapa de Calor - Áreas Profesionales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  ratio={4 / 3}
                  stroke="#fff"
                  fill="#8884d8"
                  content={<CustomizedContent />}
                >
                  <Tooltip content={<TreemapTooltip />} />
                </Treemap>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trends View */}
      {selectedView === "trends" && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Tendencias de Graduación con Acumulado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={graduationTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="año" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="cantidad"
                    fill="#8884d8"
                    name="Graduados por Año"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="acumulado"
                    stroke="#82ca9d"
                    strokeWidth={3}
                    name="Acumulado"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Distribution View */}
      {selectedView === "distribution" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Distribución por Edad (Scatter Plot)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart data={ageDistributionScatter}>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="x" name="Índice" />
                  <YAxis type="number" dataKey="y" name="Cantidad" />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                            <p className="font-semibold">{data.name}</p>
                            <p>Cantidad: {data.y}</p>
                            <p>Porcentaje: {data.z.toFixed(1)}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                    name="Distribución por Edad"
                    dataKey="y"
                    fill="#8884d8"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Métricas Clave</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {areaStats.reduce((sum, area) => sum + area.total, 0)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Total Profesionales
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {areaStats.reduce((sum, area) => sum + area.aprobados, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Aprobados</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {areaStats.length}
                    </div>
                    <div className="text-sm text-gray-600">
                      Áreas Profesionales
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {districtStats.length}
                    </div>
                    <div className="text-sm text-gray-600">
                      Distritos Sanitarios
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Top 5 Áreas por Eficiencia</h4>
                  {performanceData
                    .sort((a, b) => b.eficiencia - a.eficiencia)
                    .slice(0, 5)
                    .map((area, index) => (
                      <div
                        key={area.name}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm font-medium">{area.name}</span>
                        <Badge variant="outline">
                          {area.eficiencia.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights y Recomendaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-green-600 mb-2">
                Áreas de Alto Rendimiento
              </h4>
              <ul className="text-sm space-y-1">
                {performanceData
                  .filter((area) => area.eficiencia > 80)
                  .slice(0, 3)
                  .map((area) => (
                    <li key={area.name}>
                      • {area.name} ({area.eficiencia.toFixed(1)}%)
                    </li>
                  ))}
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-orange-600 mb-2">
                Áreas que Necesitan Atención
              </h4>
              <ul className="text-sm space-y-1">
                {performanceData
                  .filter((area) => area.pendientes > area.aprobados)
                  .slice(0, 3)
                  .map((area) => (
                    <li key={area.name}>
                      • {area.name} ({area.pendientes} pendientes)
                    </li>
                  ))}
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-blue-600 mb-2">
                Distritos con Mayor Capacidad
              </h4>
              <ul className="text-sm space-y-1">
                {districtPerformance
                  .sort((a, b) => b.ratio - a.ratio)
                  .slice(0, 3)
                  .map((district) => (
                    <li key={district.name}>
                      • {district.name} ({district.ratio.toFixed(1)}{" "}
                      prof/centro)
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Custom content component for Treemap
const CustomizedContent: React.FC<any> = (props) => {
  const {
    root,
    depth,
    x,
    y,
    width,
    height,
    index,
    payload,
    colors,
    rank,
    name,
  } = props;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill:
            depth < 2
              ? colors[Math.floor((index / root.children.length) * 6)]
              : "#ffffff00",
          stroke: "#fff",
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {depth === 1 ? (
        <text
          x={x + width / 2}
          y={y + height / 2 + 7}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
        >
          {name}
        </text>
      ) : null}
      {depth === 1 ? (
        <text
          x={x + width / 2}
          y={y + height / 2 + 21}
          textAnchor="middle"
          fill="#fff"
          fontSize={10}
        >
          {payload.size}
        </text>
      ) : null}
    </g>
  );
};

export default InteractiveCharts;
