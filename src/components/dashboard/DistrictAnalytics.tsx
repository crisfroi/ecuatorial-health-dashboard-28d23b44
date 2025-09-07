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
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { useRef } from 'react';

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
  instituciones_formacion: Array<{
    institucion: string;
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

      // Process training institutions (both institucion_1 and institucion_2)
      const institutionCounts = professionals.reduce((acc, prof) => {
        [prof.institucion_1, prof.institucion_2].forEach((inst) => {
          if (inst && inst.trim()) {
            acc[inst] = (acc[inst] || 0) + 1;
          }
        });
        return acc;
      }, {} as Record<string, number>);

      const instituciones_formacion = Object.entries(institutionCounts)
        .map(([institucion, cantidad]) => ({ institucion, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10);

      return {
        distrito_sanitario: distrito,
        total_profesionales: professionals.length,
        profesionales_por_area,
        centros_por_categoria,
        distribucion_edad,
        formacion_internacional,
        tendencia_graduacion,
        instituciones_formacion,
      };
    },
    enabled: !!distrito && distrito !== "all",
  });
};

interface DistrictAnalyticsProps {
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
  availableDistricts: string[];
  onNavigateToTab?: (tab: string, filters?: any) => void;
}

const DistrictAnalytics: React.FC<DistrictAnalyticsProps> = ({
  selectedDistrict,
  onDistrictChange,
  availableDistricts,
  onNavigateToTab,
}) => {
  const {
    data: stats,
    isLoading,
    error,
  } = useDistrictDetailStats(selectedDistrict);

  const exportDistrictData = () => {
    if (!stats) return;

    const wb = XLSX.utils.book_new();

    // Profesionales por Área
    const headerArea = [["Área Profesional","Cantidad","Porcentaje"]];
    const rowsArea = stats.profesionales_por_area.map((area) => [area.area, area.cantidad, Number(area.porcentaje.toFixed(2))]);
    const wsArea = XLSX.utils.aoa_to_sheet([...headerArea, ...rowsArea]);
    XLSX.utils.book_append_sheet(wb, wsArea, 'Profesionales_por_Area');

    // Centros por Categoría
    const headerCentros = [["Categoría","Cantidad"]];
    const rowsCentros = stats.centros_por_categoria.map((c) => [c.categoria, c.cantidad]);
    const wsCentros = XLSX.utils.aoa_to_sheet([...headerCentros, ...rowsCentros]);
    XLSX.utils.book_append_sheet(wb, wsCentros, 'Centros_por_Categoria');

    // Distribución por Edad
    const headerEdad = [["Rango Edad","Cantidad"]];
    const rowsEdad = stats.distribucion_edad.map((r) => [r.rango_edad, r.cantidad]);
    const wsEdad = XLSX.utils.aoa_to_sheet([...headerEdad, ...rowsEdad]);
    XLSX.utils.book_append_sheet(wb, wsEdad, 'Distribucion_por_Edad');

    // Formación / Instituciones
    const headerForm = [["Institución","Cantidad"]];
    const rowsForm = stats.instituciones_formacion.map((i) => [i.institucion, i.cantidad]);
    const wsForm = XLSX.utils.aoa_to_sheet([...headerForm, ...rowsForm]);
    XLSX.utils.book_append_sheet(wb, wsForm, 'Formacion_Instituciones');

    // Metadatos
    const meta = [["Generado en", new Date().toLocaleString('es-ES')],["Distrito", selectedDistrict]];
    const wsMeta = XLSX.utils.aoa_to_sheet([["Clave","Valor"], ...meta]);
    XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadatos');

    // Build filename with applied filters included (currently only distrito)
    const filename = `analiticas_distrito_${selectedDistrict}_${new Date().toISOString().split('T')[0]}.xlsx`;

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const rootRef = useRef<HTMLDivElement | null>(null);

  const captureViewAsImage = async (filename = 'district_analytics') => {
    if (!rootRef.current) return;
    try {
      const canvas = await html2canvas(rootRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `${filename}_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Error capturing district analytics image:', e);
    }
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
    <div className="space-y-6" ref={rootRef}>
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

          <Button variant="ghost" size="sm" onClick={() => captureViewAsImage(`analiticas_distrito_${selectedDistrict}`)} className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Capturar imagen
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow" onClick={() => onNavigateToTab && onNavigateToTab("professionals", { distrito_sanitario: selectedDistrict, estado_solicitud: "Aprobado" })}>
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

        <Card className="cursor-pointer hover:shadow" onClick={() => onNavigateToTab && onNavigateToTab("health-centers", { distrito_sanitario: selectedDistrict }) }>
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
                  onClick={(data: any) => onNavigateToTab && onNavigateToTab("professionals", { area_profesional: data.area, distrito_sanitario: selectedDistrict, estado_solicitud: "Aprobado" })}
                  className="cursor-pointer hover:opacity-80"
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
                <Bar dataKey="cantidad" fill="#00C49F" onClick={(data: any) => onNavigateToTab && onNavigateToTab("health-centers", { categoria_centro: data.categoria, distrito_sanitario: selectedDistrict })} className="cursor-pointer hover:opacity-80" />
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
                <Bar dataKey="cantidad" fill="#8884D8" onClick={(data: any) => {
                  const range = data.rango_edad as string;
                  let edad_minima: number | undefined;
                  let edad_maxima: number | undefined;
                  if (range.includes("<")) {
                    edad_maxima = parseInt(range.replace(/[^0-9]/g, ""), 10) - 1;
                  } else if (range.includes("+")) {
                    edad_minima = parseInt(range.replace(/[^0-9]/g, ""), 10);
                  } else if (range.includes("-")) {
                    const [min, max] = range.split("-").map(v => parseInt(v.replace(/[^0-9]/g, ""), 10));
                    edad_minima = min;
                    edad_maxima = max;
                  }
                  onNavigateToTab && onNavigateToTab("professionals", { distrito_sanitario: selectedDistrict, estado_solicitud: "Aprobado", edad_minima, edad_maxima });
                }} className="cursor-pointer hover:opacity-80" />
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
                    className="flex items-center justify-between cursor-pointer hover:opacity-80"
                    onClick={() => onNavigateToTab && onNavigateToTab("professionals", { pais_formacion: country.pais, distrito_sanitario: selectedDistrict, estado_solicitud: "Aprobado" })}
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

      <Card>
        <CardHeader>
          <CardTitle>Instituciones de Formación (Top 10)</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.instituciones_formacion.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.instituciones_formacion.map((inst) => (
                <div key={inst.institucion} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => onNavigateToTab && onNavigateToTab("professionals", { institucion: inst.institucion, distrito_sanitario: selectedDistrict, estado_solicitud: "Aprobado" })}>
                  <div className="font-medium text-sm">{inst.institucion}</div>
                  <Badge variant="outline">{inst.cantidad}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No hay datos de instituciones de formación</p>
          )}
        </CardContent>
      </Card>

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
