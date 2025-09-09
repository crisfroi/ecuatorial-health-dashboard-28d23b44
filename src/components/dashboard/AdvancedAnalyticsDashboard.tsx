import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  Users,
  Building2,
  MapPin,
  GraduationCap,
  Globe,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Download,
  Filter,
  Eye,
  DollarSign,
} from "lucide-react";

import {
  useTopCenters,
  useAreaProfessionalStats,
  useDistrictStats,
  useAgeRangeStats,
  useGraduationYearStats,
  useCountryStats,
  useInstitutionStats,
  useCenterCategoryStats,
  useTitulacionCategoryStats,
  useWorkAgeStats,
  useServiceYearsStats,
  useRetirementRemainingStats,
} from "@/hooks/useAdvancedAnalytics";
import { useQueryClient } from "@tanstack/react-query";
import { useDistritosSanitarios } from "@/hooks/useDistritosSanitarios";
import DistrictAnalytics from "./DistrictAnalytics";
import InteractiveCharts from "./InteractiveCharts";
import AnalyticsSummary from "./AnalyticsSummary";
import ErrorBoundary from "@/components/ui/error-boundary";
import FinancialAnalytics from "./FinancialAnalytics";
import QuickDiagnostic from "./QuickDiagnostic";
import ChartActions from "./ChartActions";
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import {
  useDashboardNavigation,
  type NavigationFilters,
} from "@/hooks/useDashboardNavigation";
import { useAllCountryStats, useAllInstitutionStats } from "@/hooks/useAllFormationStats";
import { useFormationSegmentation } from "@/hooks/useFormationSegmentation";
import FuncionariosPublicosAnalytics from "./FuncionariosPublicosAnalytics";

// Color palettes for charts
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

const AREA_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7c7c",
  "#8dd1e1",
  "#d084d0",
  "#ffb347",
  "#87ceeb",
  "#dda0dd",
  "#98fb98",
];

interface AdvancedAnalyticsDashboardProps {
  onNavigateToTab?: (tab: string, filters?: NavigationFilters) => void;
  filters?: Partial<{
    area_profesional: string;
    estado_solicitud: string;
    provincia: string;
    genero: string;
    tipo_sector: string;
    distrito: string;
    distrito_sanitario: string;
    centro_id: string;
    centro_nombre: string;
    edad_minima: number;
    edad_maxima: number;
    año_graduacion: number;
    pais_formacion: string;
    institucion: string;
    funcion_publica: boolean;
  }>;
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  onNavigateToTab,
  filters,
}) => {
  const [selectedView, setSelectedView] = useState("overview");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Auto-refresh data every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["topCenters"] });
      queryClient.invalidateQueries({ queryKey: ["areaProfessionalStats"] });
      queryClient.invalidateQueries({ queryKey: ["districtStats"] });
      queryClient.invalidateQueries({ queryKey: ["ageRangeStats"] });
      queryClient.invalidateQueries({ queryKey: ["countryStats"] });
      queryClient.invalidateQueries({ queryKey: ["institutionStats"] });
      queryClient.invalidateQueries({ queryKey: ["allCountryStats"] });
      queryClient.invalidateQueries({ queryKey: ["allInstitutionStats"] });
      queryClient.invalidateQueries({ queryKey: ["centerCategoryStats"] });
      queryClient.invalidateQueries({ queryKey: ["titulacionCategoryStats"] });
      queryClient.invalidateQueries({ queryKey: ["workAgeStats"] });
      queryClient.invalidateQueries({ queryKey: ["serviceYearsStats"] });
      queryClient.invalidateQueries({ queryKey: ["retirementRemainingStats"] });
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [queryClient]);

  // Navigation hooks
  const {
    navigateToArea,
    navigateToDistrict,
    navigateToCenter,
    navigateToInstitution,
    navigateToAgeRange,
    navigateToGraduationYear,
    navigateToCountry,
    navigateToRenewals,
    navigateToProvince,
  } = useDashboardNavigation(onNavigateToTab || (() => {}));

  // Fetch all analytics data
  const { data: topCenters = [], isLoading: loadingCenters } = useTopCenters(filters as any);
  const { data: areaStats = [], isLoading: loadingAreas } =
    useAreaProfessionalStats(filters as any);
  const { data: districtStats = [], isLoading: loadingDistricts } =
    useDistrictStats(filters as any);
  const { data: allDistrictRows = [] } = useDistritosSanitarios();
  const allDistrictNames = (allDistrictRows || [])
    .map((d: any) => d.nombre_distrito)
    .filter((n: any) => !!n)
    .sort();
  const { data: ageRangeStats = [], isLoading: loadingAges } =
    useAgeRangeStats(filters as any);
  const { data: workAgeStats = [] } = useWorkAgeStats(filters as any);
  const { data: serviceYearsStats = [] } = useServiceYearsStats(filters as any);
  const { data: retirementRemainingStats = [] } = useRetirementRemainingStats(filters as any);
  const { data: graduationStats = [], isLoading: loadingGraduation } =
    useGraduationYearStats(filters as any);
  const { data: countryStats = [], isLoading: loadingCountries } =
    useCountryStats(filters as any);
  const { data: institutionStats = [], isLoading: loadingInstitutions } =
    useInstitutionStats(filters as any);
  const { data: allCountries = [] } = useAllCountryStats();
  const { data: allInstitutions = [] } = useAllInstitutionStats();

  const { data: segmentation } = useFormationSegmentation({
    country: selectedCountry || undefined,
    institution: selectedInstitution || undefined,
  });
  const { data: categoryStats = [], isLoading: loadingCategories } =
    useCenterCategoryStats({
      provincia: filters?.provincia,
      distrito_sanitario: filters?.distrito_sanitario,
      distrito: filters?.distrito,
      sector: filters?.tipo_sector,
    } as any);
  const { data: titulacionStats = [], isLoading: loadingTitulacion } =
    useTitulacionCategoryStats(filters as any);

  const isLoading =
    loadingCenters ||
    loadingAreas ||
    loadingDistricts ||
    loadingAges ||
    loadingGraduation ||
    loadingCountries ||
    loadingInstitutions ||
    loadingCategories ||
    loadingTitulacion;

  const captureCardToPng = async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `${filename}_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const exportEducationExcel = () => {
    const wb = XLSX.utils.book_new();
    try {
      const wsCountries = XLSX.utils.json_to_sheet(countryStats);
      XLSX.utils.book_append_sheet(wb, wsCountries, 'Paises');

      const wsInstitutions = XLSX.utils.json_to_sheet(institutionStats);
      XLSX.utils.book_append_sheet(wb, wsInstitutions, 'Instituciones');

      const wsGraduation = XLSX.utils.json_to_sheet(graduationStats);
      XLSX.utils.book_append_sheet(wb, wsGraduation, 'Graduacion');

      if (segmentation) {
        const wsAreas = XLSX.utils.json_to_sheet(segmentation.areas || []);
        XLSX.utils.book_append_sheet(wb, wsAreas, 'Seg_Areas');
        const wsTitul = XLSX.utils.json_to_sheet(segmentation.titulaciones || []);
        XLSX.utils.book_append_sheet(wb, wsTitul, 'Seg_Titulaciones');
      }

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Analiticas_Formacion_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Error exporting education Excel:', e);
    }
  };

  // Export functionality
  const exportData = (data: any[], filename: string) => {
    try {
      const ws = XLSX.utils.json_to_sheet(data || []);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Datos');
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

  // Summary statistics
  const totalProfessionals = areaStats.reduce(
    (sum, area) => sum + area.total,
    0,
  );
  const totalApproved = areaStats.reduce(
    (sum, area) => sum + area.aprobados,
    0,
  );
  const totalCenters =
    topCenters.length > 0
      ? categoryStats.reduce((sum, cat) => sum + cat.total_centros, 0)
      : 0;
  const totalDistricts = districtStats.length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Panel de Estadísticas Avanzadas
          </h2>
          <p className="text-gray-600 mt-2">
            Análisis completo del sistema de profesionales sanitarios
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Vista General</SelectItem>
              <SelectItem value="detailed">Vista Detallada</SelectItem>
              <SelectItem value="geographic">Vista Geográfica</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => exportData(areaStats, "estadisticas_completas")}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Quick Diagnostic Component */}
      <QuickDiagnostic />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() =>
            onNavigateToTab &&
            onNavigateToTab("professionals", { estado_solicitud: "Aprobado" })
          }
          title="Haz clic para ver todos los profesionales aprobados"
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Total Profesionales
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {totalProfessionals.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {totalApproved} aprobados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-green-100">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Centros de Salud
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {totalCenters}
                </p>
                <p className="text-xs text-gray-500">
                  {categoryStats.length} categorías
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-purple-100">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Distritos Sanitarios
                </h3>
                <p className="text-2xl font-bold text-purple-600">
                  {totalDistricts}
                </p>
                <p className="text-xs text-gray-500">
                  Con profesionales activos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-orange-100">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Países de Formación
                </h3>
                <p className="text-2xl font-bold text-orange-600">
                  {countryStats.length}
                </p>
                <p className="text-xs text-gray-500">
                  {institutionStats.length} instituciones
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger
            value="summary"
            className="flex items-center gap-2 hover:bg-teal-100 hover:text-teal-700 transition-colors duration-200 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
          >
            <BarChart3 className="w-4 h-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger
            value="areas"
            className="flex items-center gap-2 hover:bg-teal-100 hover:text-teal-700 transition-colors duration-200 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
          >
            <Activity className="w-4 h-4" />
            Áreas
          </TabsTrigger>
          <TabsTrigger
            value="centers"
            className="flex items-center gap-2 hover:bg-teal-100 hover:text-teal-700 transition-colors duration-200 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
          >
            <Building2 className="w-4 h-4" />
            Centros
          </TabsTrigger>
          <TabsTrigger
            value="districts"
            className="flex items-center gap-2 hover:bg-teal-100 hover:text-teal-700 transition-colors duration-200 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
          >
            <MapPin className="w-4 h-4" />
            Distritos
          </TabsTrigger>
          <TabsTrigger
            value="demographics"
            className="flex items-center gap-2 hover:bg-teal-100 hover:text-teal-700 transition-colors duration-200 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
          >
            <Users className="w-4 h-4" />
            Demografía
          </TabsTrigger>
          <TabsTrigger
            value="education"
            className="flex items-center gap-2 hover:bg-teal-100 hover:text-teal-700 transition-colors duration-200 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
          >
            <GraduationCap className="w-4 h-4" />
            Formación
          </TabsTrigger>
          <TabsTrigger
            value="funcionarios"
            className="flex items-center gap-2 hover:bg-teal-100 hover:text-teal-700 transition-colors duration-200 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
          >
            <Users className="w-4 h-4" />
            Funcionarios
          </TabsTrigger>
          <TabsTrigger
            value="trends"
            className="flex items-center gap-2 hover:bg-teal-100 hover:text-teal-700 transition-colors duration-200 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
          >
            <TrendingUp className="w-4 h-4" />
            Tendencias
          </TabsTrigger>
          <TabsTrigger
            value="interactive"
            className="flex items-center gap-2 hover:bg-teal-100 hover:text-teal-700 transition-colors duration-200 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
          >
            <PieChartIcon className="w-4 h-4" />
            Interactivo
          </TabsTrigger>
          <TabsTrigger
            value="financial"
            className="flex items-center gap-2 hover:bg-teal-100 hover:text-teal-700 transition-colors duration-200 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
          >
            <DollarSign className="w-4 h-4" />
            Financiero
          </TabsTrigger>
        </TabsList>

        {/* Analytics Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <AnalyticsSummary
            areaStats={areaStats}
            districtStats={districtStats}
            centerStats={categoryStats}
            onNavigateToArea={navigateToArea}
            onNavigateToDistrict={navigateToDistrict}
            onNavigateToCenter={navigateToCenter}
            onNavigateToTab={onNavigateToTab}
          />
        </TabsContent>

        {/* Professional Areas Tab */}
        <TabsContent value="areas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-blue-600" />
                  Distribución por Área Profesional
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={areaStats.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="total"
                      label={(entry) =>
                        `${entry.area_profesional} (${entry.total})`
                      }
                      onClick={(data) => navigateToArea(data.area_profesional)}
                      style={{ cursor: "pointer" }}
                    >
                      {areaStats.slice(0, 8).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          style={{ cursor: "pointer" }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-semibold">
                                {data.area_profesional}
                              </p>
                              <p className="text-sm">Total: {data.total}</p>
                              <p className="text-sm">
                                Aprobados: {data.aprobados}
                              </p>
                              <p className="text-sm">
                                Pendientes: {data.pendientes}
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                Haz clic para ver lista
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Profesionales por Área (Top 10)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={areaStats.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="area_profesional"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="aprobados"
                      stackId="a"
                      fill="#00C49F"
                      name="Aprobados"
                    />
                    <Bar
                      dataKey="pendientes"
                      stackId="a"
                      fill="#FFBB28"
                      name="Pendientes"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Áreas que Necesitan Mayor Refuerzo</CardTitle>
              <p className="text-sm text-gray-600">
                Áreas con menor número de profesionales aprobados
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {areaStats
                  .sort((a, b) => a.aprobados - b.aprobados)
                  .slice(0, 5)
                  .map((area, index) => (
                    <div
                      key={area.area_profesional}
                      className="border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow hover:border-orange-300"
                      onClick={() => navigateToArea(area.area_profesional)}
                      title={`Haz clic para ver profesionales de ${area.area_profesional}`}
                    >
                      <h4 className="font-semibold text-sm">
                        {area.area_profesional}
                      </h4>
                      <div className="mt-2 space-y-1">
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
                      <div className="mt-2 pt-2 border-t">
                        <span className="text-xs text-orange-600 font-medium">
                          Necesita refuerzo: Posición #{index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                Estadísticas por Categoría de Titulación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={titulacionStats.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="total"
                      label={(entry) =>
                        `${entry.categoria_titulacion} (${entry.total})`
                      }
                      onClick={(data) => onNavigateToTab && onNavigateToTab("professionals", { categoria_titulacion: data.categoria_titulacion })}
                      className="cursor-pointer hover:opacity-80"
                    >
                      {titulacionStats.slice(0, 8).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-semibold">
                                {data.categoria_titulacion}
                              </p>
                              <p className="text-sm">Total: {data.total}</p>
                              <p className="text-sm">
                                Aprobados: {data.aprobados}
                              </p>
                              <p className="text-sm">
                                Pendientes: {data.pendientes}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={titulacionStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="categoria_titulacion"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="aprobados"
                      stackId="a"
                      fill="#00C49F"
                      name="Aprobados"
                    />
                    <Bar
                      dataKey="pendientes"
                      stackId="a"
                      fill="#FFBB28"
                      name="Pendientes"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-3">
                  Resumen por Categoría de Titulación
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {titulacionStats.map((categoria, index) => (
                    <div
                      key={categoria.categoria_titulacion}
                      className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                    >
                      <h5 className="font-semibold text-sm">
                        {categoria.categoria_titulacion}
                      </h5>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Total:</span>
                          <span className="font-medium">{categoria.total}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Aprobados:</span>
                          <span className="font-medium text-green-600">
                            {categoria.aprobados}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Pendientes:</span>
                          <span className="font-medium text-orange-600">
                            {categoria.pendientes}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Porcentaje:</span>
                          <span className="font-medium text-blue-600">
                            {categoria.porcentaje.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Centers Tab */}
        <TabsContent value="centers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Top 10 Centros por Profesionales
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Clic en cualquier barra para ver profesionales del centro
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={topCenters} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      width={150}
                      fontSize={10}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="total_profesionales"
                      fill="#0088FE"
                      onClick={(data: any) => navigateToCenter(data.nombre)}
                      className="cursor-pointer hover:opacity-80"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-green-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-green-600" />
                  Centros por Categoría
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Clic en cualquier sector para ver centros de esa categoría
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="total_centros"
                      label={(entry) =>
                        `${entry.categoria} (${entry.total_centros})`
                      }
                      onClick={(data) => onNavigateToTab && onNavigateToTab("professionals", { categoria_centro: data.categoria })}
                      className="cursor-pointer hover:opacity-80"
                    >
                      {categoryStats.map((entry, index) => (
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
          </div>

          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-purple-300">
            <CardHeader>
              <CardTitle>Análisis de Categorías de Centros</CardTitle>
              <p className="text-sm text-gray-600">
                Clic en cualquier barra para ver profesionales de esa categoría
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="total_centros"
                    fill="#8884d8"
                    name="Total Centros"
                    onClick={(data: any) => onNavigateToTab && onNavigateToTab("professionals", { categoria_centro: data.categoria })}
                    className="cursor-pointer hover:opacity-80"
                  />
                  <Bar
                    dataKey="total_profesionales"
                    fill="#82ca9d"
                    name="Total Profesionales"
                    onClick={(data: any) => onNavigateToTab && onNavigateToTab("professionals", { categoria_centro: data.categoria })}
                    className="cursor-pointer hover:opacity-80"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Districts Tab */}
        <TabsContent value="districts" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold">
                Análisis por Distrito Sanitario
              </h3>
              <p className="text-gray-600">
                Vista general y análisis detallado por distrito
              </p>
            </div>
            <Select
              value={selectedDistrict}
              onValueChange={setSelectedDistrict}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Seleccionar distrito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Todos los distritos (Vista General)
                </SelectItem>
                {allDistrictNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDistrict === "all" ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    Estadísticas por Distrito Sanitario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={districtStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="distrito_sanitario"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={10}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="total_profesionales"
                        fill="#8884d8"
                        name="Profesionales"
                        onClick={(data: any) => navigateToDistrict(data.distrito_sanitario)}
                        className="cursor-pointer hover:opacity-80"
                      />
                      <Bar
                        dataKey="total_centros"
                        fill="#82ca9d"
                        name="Centros"
                        onClick={(data: any) => navigateToDistrict(data.distrito_sanitario)}
                        className="cursor-pointer hover:opacity-80"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {districtStats.slice(0, 9).map((district, index) => (
                  <Card
                    key={district.distrito_sanitario}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() =>
                      setSelectedDistrict(district.distrito_sanitario)
                    }
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        {district.distrito_sanitario}
                        <Eye className="w-4 h-4 text-gray-400" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Profesionales:
                          </span>
                          <Badge variant="outline">
                            {district.total_profesionales}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Centros:
                          </span>
                          <Badge variant="outline">
                            {district.total_centros}
                          </Badge>
                        </div>
                        <div className="mt-3">
                          <span className="text-sm text-gray-600 block mb-1">
                            Áreas principales:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {district.areas_mas_comunes.map((area, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="text-xs"
                              >
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t">
                          <span className="text-xs text-blue-600">
                            Haz clic para ver detalles →
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <DistrictAnalytics
              selectedDistrict={selectedDistrict}
              onDistrictChange={setSelectedDistrict}
              availableDistricts={allDistrictNames}
              onNavigateToTab={onNavigateToTab}
            />
          )}
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Distribución por Rangos de Edad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ageRangeStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rango_edad" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="cantidad"
                      fill="#8884d8"
                      onClick={(data: any) => navigateToAgeRange(data.rango_edad)}
                      className="cursor-pointer hover:opacity-80"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-green-600" />
                  Porcentaje por Edad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ageRangeStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="porcentaje"
                      label={(entry) =>
                        `${entry.rango_edad} (${entry.porcentaje.toFixed(1)}%)`
                      }
                      onClick={(data) => navigateToAgeRange(data.rango_edad)}
                      className="cursor-pointer hover:opacity-80"
                    >
                      {ageRangeStats.map((entry, index) => (
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Edad laboral (distribución)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workAgeStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rango" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="#6366F1" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-rose-600" />
                  Años de servicio (distribución)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={serviceYearsStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rango" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="#F43F5E" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen Demográfico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ageRangeStats.map((range, index) => (
                  <div
                    key={range.rango_edad}
                    className="text-center p-4 border rounded-lg"
                  >
                    <div
                      className="text-2xl font-bold"
                      style={{ color: COLORS[index % COLORS.length] }}
                    >
                      {range.cantidad}
                    </div>
                    <div className="text-sm text-gray-600">
                      {range.rango_edad}
                    </div>
                    <div className="text-xs text-gray-500">
                      {range.porcentaje.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                Años restantes hasta jubilación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={retirementRemainingStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rango" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Exportar datos de formación</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportEducationExcel} className="flex items-center gap-2">
                <Download className="w-4 h-4" /> Excel (todas las secciones)
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Países de Formación (Top 10)
                </CardTitle>
                <div className="ml-auto">
                  <Button variant="ghost" size="sm" onClick={() => exportData(countryStats as any, 'Paises_Formacion')}>Excel</Button>
                </div>
              </CardHeader>
              <CardContent>
                <ChartActions title="Paises de Formación">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={countryStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="pais_formacion"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={10}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="cantidad"
                        fill="#0088FE"
                        onClick={(data: any) => {
                          setSelectedCountry(data.pais_formacion);
                          setSelectedInstitution(null);
                        }}
                        className="cursor-pointer hover:opacity-80"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartActions>
                <div className="mt-4">
                  <Select
                    onValueChange={(value) => {
                      setSelectedCountry(value);
                      setSelectedInstitution(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ver país de formación (todas las opciones)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {allCountries.map((c) => (
                        <SelectItem key={c.pais_formacion} value={c.pais_formacion}>
                          {c.pais_formacion} ({c.cantidad})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  Instituciones de Formación (Top 10)
                </CardTitle>
                <div className="ml-auto">
                  <Button variant="ghost" size="sm" onClick={() => exportData(institutionStats as any, 'Instituciones_Formacion')}>Excel</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {institutionStats.slice(0, 10).map((inst, index) => (
                    <div
                      key={inst.institucion}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedInstitution(inst.institucion);
                        setSelectedCountry(null);
                      }}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {inst.institucion}
                        </div>
                        {inst.pais && (
                          <div className="text-xs text-gray-500">
                            {inst.pais}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline">{inst.cantidad}</Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Select
                    onValueChange={(value) => {
                      setSelectedInstitution(value);
                      setSelectedCountry(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ver institución (todas las opciones)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {allInstitutions.map((i) => (
                        <SelectItem key={i.institucion} value={i.institucion}>
                          {i.institucion} ({i.cantidad})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Años de Graduación (Últimos 20 años)
              </CardTitle>
              <div className="ml-auto">
                <Button variant="ghost" size="sm" onClick={() => exportData(graduationStats as any, 'Anios_Graduacion')}>Excel</Button>
              </div>
            </CardHeader>
            <CardContent>
              <ChartActions title="Años de Graduación">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={graduationStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="año_graduacion" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="cantidad"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartActions>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-teal-600" />
                Resumen segmentado {selectedCountry ? `- País: ${selectedCountry}` : selectedInstitution ? `- Institución: ${selectedInstitution}` : "(selecciona un país o institución)"}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const seg = segmentation || { areas: [], titulaciones: [] };
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(seg.areas || []), 'Areas');
                    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(seg.titulaciones || []), 'Titulaciones');
                    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Resumen_Segmentado_${new Date().toISOString().split('T')[0]}.xlsx`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  disabled={!segmentation}
                >
                  Excel
                </Button>
                <Button
                  variant="outline"
                  disabled={!(selectedCountry || selectedInstitution)}
                  onClick={() => {
                    if (selectedCountry) navigateToCountry(selectedCountry);
                    if (selectedInstitution) navigateToInstitution(selectedInstitution);
                  }}
                >
                  Ver profesionales
                </Button>
                <Button
                  variant="ghost"
                  disabled={!(selectedCountry || selectedInstitution)}
                  onClick={() => {
                    setSelectedCountry(null);
                    setSelectedInstitution(null);
                  }}
                >
                  Limpiar selección
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!(selectedCountry || selectedInstitution) ? (
                <div className="text-sm text-gray-500">Selecciona un país o una institución para ver el detalle.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Áreas Profesionales</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {segmentation?.areas.slice(0, 10).map((a) => (
                        <div key={a.nombre} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{a.nombre}</span>
                          <span className="text-xs text-gray-600">{a.total} ({a.porcentaje.toFixed(1)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Categorías de Titulación</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {segmentation?.titulaciones.slice(0, 10).map((t) => (
                        <div key={t.nombre} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{t.nombre}</span>
                          <span className="text-xs text-gray-600">{t.total} ({t.porcentaje.toFixed(1)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Tendencias de Graduación por Año
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={graduationStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="año_graduacion" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="cantidad"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Crecimiento por Área Profesional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {areaStats.slice(0, 8).map((area, index) => (
                    <div
                      key={area.area_profesional}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">
                        {area.area_profesional}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${area.porcentaje}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {area.porcentaje.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución Global de Formación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {countryStats.slice(0, 8).map((country, index) => (
                    <div
                      key={country.pais_formacion}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">
                        {country.pais_formacion}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${country.porcentaje}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {country.porcentaje.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Interactive Charts Tab */}
        <TabsContent value="interactive" className="space-y-6">
          <ErrorBoundary>
            <InteractiveCharts
              areaStats={areaStats}
              districtStats={districtStats}
              ageStats={ageRangeStats}
              graduationStats={graduationStats}
              centerStats={categoryStats}
              onNavigateToArea={navigateToArea}
              onNavigateToDistrict={navigateToDistrict}
              onNavigateToCenter={navigateToCenter}
              onNavigateToAgeRange={navigateToAgeRange}
              onNavigateToProvince={navigateToProvince}
            />
          </ErrorBoundary>
        </TabsContent>

        {/* Financial Analytics Tab */}
        <TabsContent value="funcionarios" className="space-y-6">
          <ErrorBoundary>
            <FuncionariosPublicosAnalytics onNavigateToTab={onNavigateToTab} />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <ErrorBoundary>
            <FinancialAnalytics onNavigateToTab={onNavigateToTab} />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
