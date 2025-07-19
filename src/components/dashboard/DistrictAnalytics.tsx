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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  MapPin,
  Users,
  Building2,
  TrendingUp,
  Activity,
  Download,
  Eye,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DistrictDetailStats {
  distrito_sanitario: string;
  total_profesionales: number;
  profesionales_por_area: Array<{
    area: string;
    cantidad: number;
    porcentaje: number;
  }>;
  centros_por_categoria: Array<{
    categoria: string;
    cantidad: number;
  }>;
  distribucion_edad: Array<{
    rango_edad: string;
    cantidad: number;
  }>;
  formacion_internacional: Array<{
    pais: string;
    cantidad: number;
  }>;
  tendencia_graduacion: Array<{
    año: number;
    cantidad: number;
  }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const useDistrictDetailStats = (distrito: string) => {
  return useQuery({
    queryKey: ["districtDetailStats", distrito],
    queryFn: async (): Promise<DistrictDetailStats> => {
      if (!distrito || distrito === "all") {
        throw new Error("Distrito no seleccionado");
      }

      // Get professionals in this district
      const { data: professionals, error } = await supabase
        .from("profesionales_sanitarios")
        .select("*")
        .eq("distrito_sanitario", distrito)
        .eq("estado_solicitud", "Aprobado");

      if (error) throw error;

      // Get centers in this district
      const { data: centers, error: centersError } = await supabase
        .from("centros_salud")
        .select("categoria")
        .eq("distrito_sanitario", distrito);

      if (centersError) throw centersError;

      // Process area distribution
      const areaDistribution = professionals.reduce(
        (acc, prof) => {
          if (prof.area_profesional) {
            acc[prof.area_profesional] = (acc[prof.area_profesional] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      const profesionales_por_area = Object.entries(areaDistribution)
        .map(([area, cantidad]) => ({
          area,
          cantidad,
          porcentaje: (cantidad / professionals.length) * 100,
        }))
        .sort((a, b) => b.cantidad - a.cantidad);

      // Process center categories
      const centerCategories = centers.reduce(
        (acc, center) => {
          acc[center.categoria] = (acc[center.categoria] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const centros_por_categoria = Object.entries(centerCategories)
        .map(([categoria, cantidad]) => ({ categoria, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);

      // Process age distribution
      const ageDistribution = professionals
        .filter((prof) => prof.edad)
        .reduce(
          (acc, prof) => {
            const edad = prof.edad!;
            let rango = "";
            if (edad < 30) rango = "< 30";
            else if (edad < 40) rango = "30-39";
            else if (edad < 50) rango = "40-49";
            else if (edad < 60) rango = "50-59";
            else rango = "60+";

            acc[rango] = (acc[rango] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

      const distribucion_edad = Object.entries(ageDistribution).map(
        ([rango_edad, cantidad]) => ({ rango_edad, cantidad }),
      );

      // Process international formation
      const internationalFormation = professionals.reduce(
        (acc, prof) => {
          [prof.pais_formacion_1, prof.pais_formacion_2].forEach((pais) => {
            if (pais && pais.trim() && pais !== "Guinea Ecuatorial") {
              acc[pais] = (acc[pais] || 0) + 1;
            }
          });
          return acc;
        },
        {} as Record<string, number>,
      );

      const formacion_internacional = Object.entries(internationalFormation)
        .map(([pais, cantidad]) => ({ pais, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);

      // Process graduation trends
      const graduationTrends = professionals
        .filter((prof) => prof.año_graduacion && prof.año_graduacion >= 2015)
        .reduce(
          (acc, prof) => {
            const año = prof.año_graduacion!;
            acc[año] = (acc[año] || 0) + 1;
            return acc;
          },
          {} as Record<number, number>,
        );

      const tendencia_graduacion = Object.entries(graduationTrends)
        .map(([año, cantidad]) => ({ año: parseInt(año), cantidad }))
        .sort((a, b) => a.año - b.año);

      return {
        distrito_sanitario: distrito,
        total_profesionales: professionals.length,
        profesionales_por_area,
        centros_por_categoria,
        distribucion_edad,
        formacion_internacional,
        tendencia_graduacion,
      };
    },
    enabled: !!distrito && distrito !== "all",
  });
};

interface DistrictAnalyticsProps {
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
  availableDistricts: string[];
}

const DistrictAnalytics: React.FC<DistrictAnalyticsProps> = ({
  selectedDistrict,
  onDistrictChange,
  availableDistricts,
}) => {
  const {
    data: stats,
    isLoading,
    error,
  } = useDistrictDetailStats(selectedDistrict);

  const exportDistrictData = () => {
    if (!stats) return;

    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Área Profesional,Cantidad,Porcentaje\n" +
      stats.profesionales_por_area
        .map(
          (area) =>
            `${area.area},${area.cantidad},${area.porcentaje.toFixed(2)}`,
        )
        .join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `distrito_${selectedDistrict}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (selectedDistrict === "all") {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">
            Selecciona un Distrito Sanitario
          </h3>
          <p className="text-gray-600 mb-4">
            Elige un distrito específico para ver análisis detallados
          </p>
          <Select value={selectedDistrict} onValueChange={onDistrictChange}>
            <SelectTrigger className="w-64 mx-auto">
              <SelectValue placeholder="Seleccionar distrito" />
            </SelectTrigger>
            <SelectContent>
              {availableDistricts.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas del distrito...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <h3 className="text-lg font-semibold mb-2 text-red-600">
            Error al cargar datos
          </h3>
          <p className="text-gray-600">
            No se pudieron cargar las estadísticas del distrito
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            {stats.distrito_sanitario}
          </h3>
          <p className="text-gray-600">
            Análisis detallado del distrito sanitario
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedDistrict} onValueChange={onDistrictChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los distritos</SelectItem>
              {availableDistricts.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={exportDistrictData}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-500">
                  Total Profesionales
                </h4>
                <p className="text-xl font-bold text-blue-600">
                  {stats.total_profesionales}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-500">Centros</h4>
                <p className="text-xl font-bold text-green-600">
                  {stats.centros_por_categoria.reduce(
                    (sum, cat) => sum + cat.cantidad,
                    0,
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-500">
                  Áreas Profesionales
                </h4>
                <p className="text-xl font-bold text-purple-600">
                  {stats.profesionales_por_area.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-500">
                  Formación Internacional
                </h4>
                <p className="text-xl font-bold text-orange-600">
                  {stats.formacion_internacional.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profesionales por Área</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.profesionales_por_area.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="cantidad"
                  label={(entry) => `${entry.area} (${entry.cantidad})`}
                >
                  {stats.profesionales_por_area
                    .slice(0, 6)
                    .map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Centros por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.centros_por_categoria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" fontSize={10} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Edad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.distribucion_edad}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rango_edad" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#8884D8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formación Internacional</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.formacion_internacional.length > 0 ? (
              <div className="space-y-3">
                {stats.formacion_internacional.map((country, index) => (
                  <div
                    key={country.pais}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">{country.pais}</span>
                    <Badge variant="outline">{country.cantidad}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No hay datos de formación internacional
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis Detallado por Área Profesional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.profesionales_por_area.map((area, index) => (
              <div key={area.area} className="border rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">{area.area}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Cantidad:</span>
                    <span className="font-medium">{area.cantidad}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Porcentaje:</span>
                    <span className="font-medium">
                      {area.porcentaje.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${area.porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Graduation Trends */}
      {stats.tendencia_graduacion.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Graduaciones (2015-presente)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.tendencia_graduacion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="año" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DistrictAnalytics;
