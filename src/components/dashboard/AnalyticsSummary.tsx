import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Building2,
  MapPin,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Eye,
  Download,
} from "lucide-react";
import * as XLSX from 'xlsx';

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

interface AnalyticsSummaryProps {
  areaStats: any[];
  districtStats: any[];
  centerStats: any[];
  onNavigateToArea?: (area: string) => void;
  onNavigateToDistrict?: (district: string) => void;
  onNavigateToCenter?: (center: string) => void;
  onNavigateToTab?: (tab: string, filters?: any) => void;
}

const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({
  areaStats,
  districtStats,
  centerStats,
  onNavigateToArea,
  onNavigateToDistrict,
  onNavigateToCenter,
  onNavigateToTab,
}) => {
  const totalProfessionals = areaStats.reduce(
    (sum, area) => sum + area.total,
    0,
  );
  const totalApproved = areaStats.reduce(
    (sum, area) => sum + area.aprobados,
    0,
  );
  const totalPending = areaStats.reduce(
    (sum, area) => sum + area.pendientes,
    0,
  );
  const approvalRate =
    totalProfessionals > 0 ? (totalApproved / totalProfessionals) * 100 : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
          <p className="text-xs text-blue-600 mt-1">
            Haz clic para ver detalles
          </p>
        </div>
      );
    }
    return null;
  };

  const exportData = (data: any[], filename: string) => {
    try {
      const ws = XLSX.utils.json_to_sheet(data || []);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Datos');

      const meta = [["Generado en", new Date().toLocaleString('es-ES')]];
      const wsMeta = XLSX.utils.aoa_to_sheet([["Clave","Valor"], ...meta]);
      XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadatos');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Error exporting analytics data:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-blue-500"
          onClick={() =>
            onNavigateToTab &&
            onNavigateToTab("professionals", { estado_solicitud: "Aprobado" })
          }
          title="Haz clic para ver todos los profesionales aprobados"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Profesionales</p>
                <p className="text-3xl font-bold text-blue-600">
                  {totalProfessionals.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    {totalApproved} aprobados
                  </span>
                </div>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-green-500"
          onClick={() => onNavigateToTab && onNavigateToTab("health-centers")}
          title="Haz clic para ver todos los centros de salud"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Centros de Salud</p>
                <p className="text-3xl font-bold text-green-600">
                  {centerStats.reduce((sum, cat) => sum + cat.total_centros, 0)}
                </p>
                <div className="flex items-center mt-2">
                  <Building2 className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    {centerStats.length} categorías
                  </span>
                </div>
              </div>
              <Building2 className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-orange-500"
          onClick={() =>
            onNavigateToTab &&
            onNavigateToTab("requests", { estado_solicitud: "todos" })
          }
          title="Haz clic para ver todas las solicitudes pendientes"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Solicitudes Pendientes</p>
                <p className="text-3xl font-bold text-orange-600">
                  {totalPending.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-600">
                    Requiere atención
                  </span>
                </div>
              </div>
              <Activity className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-purple-500"
          title="Información sobre distritos sanitarios"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Distritos Sanitarios</p>
                <p className="text-3xl font-bold text-purple-600">
                  {districtStats.length}
                </p>
                <div className="flex items-center mt-2">
                  <MapPin className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600">
                    Cobertura nacional
                  </span>
                </div>
              </div>
              <MapPin className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Areas and Districts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Top 5 Áreas Profesionales
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData(areaStats, "areas_profesionales")}
                className="flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaStats.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="area_profesional"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={10}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="aprobados"
                  fill="#00C49F"
                  name="Aprobados"
                  onClick={(data) =>
                    onNavigateToArea && onNavigateToArea(data.area_profesional)
                  }
                  style={{ cursor: "pointer" }}
                />
                <Bar
                  dataKey="pendientes"
                  fill="#FFBB28"
                  name="Pendientes"
                  onClick={(data) =>
                    onNavigateToArea && onNavigateToArea(data.area_profesional)
                  }
                  style={{ cursor: "pointer" }}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {areaStats.slice(0, 5).map((area, index) => (
                <div
                  key={area.area_profesional}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() =>
                    onNavigateToArea && onNavigateToArea(area.area_profesional)
                  }
                  title={`Haz clic para ver profesionales de ${area.area_profesional}`}
                >
                  <span className="text-sm font-medium">
                    {area.area_profesional}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{area.total}</Badge>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                Top 5 Distritos Sanitarios
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportData(districtStats, "distritos_sanitarios")
                }
                className="flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={districtStats.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="distrito_sanitario"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={10}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="total_profesionales"
                  fill="#8884d8"
                  name="Profesionales"
                  onClick={(data) =>
                    onNavigateToDistrict &&
                    onNavigateToDistrict(data.distrito_sanitario)
                  }
                  style={{ cursor: "pointer" }}
                />
                <Bar
                  dataKey="total_centros"
                  fill="#82ca9d"
                  name="Centros"
                  style={{ cursor: "pointer" }}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {districtStats.slice(0, 5).map((district, index) => (
                <div
                  key={district.distrito_sanitario}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-purple-50 transition-colors"
                  onClick={() =>
                    onNavigateToDistrict &&
                    onNavigateToDistrict(district.distrito_sanitario)
                  }
                  title={`Haz clic para ver profesionales de ${district.distrito_sanitario}`}
                >
                  <span className="text-sm font-medium">
                    {district.distrito_sanitario}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {district.total_profesionales}
                    </Badge>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Areas that need attention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Áreas que Necesitan Mayor Refuerzo
          </CardTitle>
          <p className="text-sm text-gray-600">
            Áreas con menor número de profesionales aprobados
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {areaStats
              .sort((a, b) => a.aprobados - b.aprobados)
              .slice(0, 6)
              .map((area, index) => (
                <div
                  key={area.area_profesional}
                  className="border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow hover:border-orange-300"
                  onClick={() =>
                    onNavigateToArea && onNavigateToArea(area.area_profesional)
                  }
                  title={`Haz clic para ver profesionales de ${area.area_profesional}`}
                >
                  <h4 className="font-semibold text-sm mb-2">
                    {area.area_profesional}
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Aprobados:</span>
                      <span className="font-medium text-red-600">
                        {area.aprobados}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Pendientes:</span>
                      <span className="font-medium text-orange-600">
                        {area.pendientes}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Total:</span>
                      <span className="font-medium">{area.total}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{
                        width: `${(area.pendientes / area.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center gap-2"
              onClick={() =>
                onNavigateToTab &&
                onNavigateToTab("professionals", {
                  estado_solicitud: "Aprobado",
                })
              }
            >
              <Users className="w-6 h-6" />
              Ver Todos los Profesionales
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center gap-2"
              onClick={() =>
                onNavigateToTab &&
                onNavigateToTab("requests", { estado_solicitud: "Pendiente" })
              }
            >
              <AlertTriangle className="w-6 h-6" />
              Solicitudes Pendientes
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center gap-2"
              onClick={() => onNavigateToTab && onNavigateToTab("renewals")}
            >
              <Activity className="w-6 h-6" />
              Alertas de Renovación
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center gap-2"
              onClick={() =>
                onNavigateToTab && onNavigateToTab("health-centers")
              }
            >
              <Building2 className="w-6 h-6" />
              Centros de Salud
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsSummary;
