import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Users,
  Building2,
  Calendar,
  TrendingUp,
  Download,
  UserCheck,
  Clock,
  Award,
  MapPin,
} from "lucide-react";
import { useProfesionales } from "@/hooks/useProfesionales";
import * as XLSX from 'xlsx';
import ChartActions from "./ChartActions";

// Colores para los gráficos
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
];

interface FuncionariosPublicosAnalyticsProps {
  onNavigateToTab?: (tab: string, filters?: any) => void;
}

const FuncionariosPublicosAnalytics: React.FC<FuncionariosPublicosAnalyticsProps> = ({
  onNavigateToTab
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState("all");

  // Obtener datos de funcionarios públicos
  const { data: funcionarios = [], isLoading } = useProfesionales({
    funcion_publica: true,
    estado_solicitud: 'Aprobado'
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando datos de funcionarios...</span>
      </div>
    );
  }

  // Utilidades de cálculo
  const calcularEdadLaboral = (profesional: any) => {
    const inicioTrabajo = profesional.fecha_inicio_trabajo ? new Date(profesional.fecha_inicio_trabajo) : null;
    const nombramiento = profesional.fecha_nombramiento ? new Date(profesional.fecha_nombramiento) : null;
    const fechaRef = nombramiento || inicioTrabajo;
    if (!fechaRef) return null;
    const años = Math.floor((new Date().getTime() - fechaRef.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return Math.max(0, años);
  };

  const calcularAñosServicio = (profesional: any) => {
    const nombramiento = profesional.fecha_nombramiento ? new Date(profesional.fecha_nombramiento) : null;
    if (!nombramiento) return null;
    const años = Math.floor((new Date().getTime() - nombramiento.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return Math.max(0, años);
  };

  const calcularAñosRestantesJubilacion = (profesional: any) => {
    if (!profesional.edad) return null;
    return Math.max(0, 65 - profesional.edad);
  };

  // Procesamiento de datos
  const funcionariosProcesados = funcionarios.map(f => ({
    ...f,
    edadLaboral: calcularEdadLaboral(f),
    añosServicio: calcularAñosServicio(f),
    añosRestantesJubilacion: calcularAñosRestantesJubilacion(f)
  }));

  // Estadísticas básicas
  const totalFuncionarios = funcionarios.length;
  const nombrados = funcionarios.filter(f => f.estatus_funcionario === 'nombrado').length;
  const noNombrados = funcionarios.filter(f => f.estatus_funcionario === 'no_nombrado').length;
  const proximosJubilacion = funcionarios.filter(f => f.edad && f.edad >= 60).length;

  // Datos para gráficos
  const estatusData = [
    { name: 'Nombrados', value: nombrados, color: '#0088FE' },
    { name: 'No Nombrados', value: noNombrados, color: '#00C49F' },
  ];

  const areaProfesionalData = funcionarios.reduce((acc: any[], f) => {
    const area = f.area_profesional || 'Sin especificar';
    const existing = acc.find(item => item.name === area);
    if (existing) {
      existing.nombrados += f.estatus_funcionario === 'nombrado' ? 1 : 0;
      existing.noNombrados += f.estatus_funcionario === 'no_nombrado' ? 1 : 0;
      existing.total += 1;
    } else {
      acc.push({
        name: area,
        nombrados: f.estatus_funcionario === 'nombrados' ? 1 : 0,
        noNombrados: f.estatus_funcionario === 'no_nombrado' ? 1 : 0,
        total: 1
      });
    }
    return acc;
  }, []).sort((a, b) => b.total - a.total).slice(0, 10);

  // Distribución por edad laboral
  const edadLaboralData = funcionariosProcesados.reduce((acc: any[], f) => {
    if (!f.edadLaboral) return acc;
    const rango = f.edadLaboral < 5 ? '0-5 años' :
                  f.edadLaboral < 10 ? '5-10 años' :
                  f.edadLaboral < 15 ? '10-15 años' :
                  f.edadLaboral < 20 ? '15-20 años' :
                  f.edadLaboral < 25 ? '20-25 años' : '25+ años';

    const existing = acc.find(item => item.name === rango);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: rango, value: 1 });
    }
    return acc;
  }, []);

  // Distribución por distrito sanitario
  const distritoData = funcionarios.reduce((acc: any[], f) => {
    const distrito = f.distrito_sanitario || 'Sin asignar';
    const existing = acc.find(item => item.name === distrito);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: distrito, value: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 8);

  // Años restantes para jubilación
  const jubilacionData = funcionariosProcesados.reduce((acc: any[], f) => {
    if (typeof f.añosRestantesJubilacion !== 'number') return acc;
    const rango = f.añosRestantesJubilacion <= 5 ? '0-5 años' :
                  f.añosRestantesJubilacion <= 10 ? '5-10 años' :
                  f.añosRestantesJubilacion <= 15 ? '10-15 años' :
                  f.añosRestantesJubilacion <= 20 ? '15-20 años' :
                  f.añosRestantesJubilacion <= 25 ? '20-25 años' : '25+ años';

    const existing = acc.find(item => item.name === rango);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: rango, value: 1 });
    }
    return acc;
  }, []);

  // Derivados para "próximos a jubilación" y 30+ años servicio
  const proximos = funcionariosProcesados.filter(f => typeof f.añosRestantesJubilacion === 'number' && f.añosRestantesJubilacion <= 5);
  const servicio30Mas = funcionariosProcesados
    .filter(f => f.estatus_funcionario === 'nombrado' && typeof f.añosServicio === 'number' && f.añosServicio >= 30)
    .sort((a,b) => (b.añosServicio || 0) - (a.añosServicio || 0));

  const topAreasProximos = proximos.reduce((acc: Record<string, number>, f) => {
    const area = f.area_profesional || 'Sin especificar';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topAreasProximosArr = Object.entries(topAreasProximos)
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a,b) => b.total - a.total)
    .slice(0,3);

  const topDistritosProximos = proximos.reduce((acc: Record<string, number>, f) => {
    const d = f.distrito_sanitario || 'Sin asignar';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topDistritosProximosArr = Object.entries(topDistritosProximos)
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a,b) => b.total - a.total)
    .slice(0,3);

  // Exportar datos a Excel (extendido)
  const exportToExcel = () => {
    try {
      const funcionariosExport = funcionariosProcesados.map(f => ({
        'Nombre Completo': f.nombre_completo,
        'Género': f.genero || '',
        'Área Profesional': f.area_profesional,
        'Estatus': f.estatus_funcionario,
        'Fecha Nombramiento': f.fecha_nombramiento ? new Date(f.fecha_nombramiento).toLocaleDateString('es-ES') : '',
        'Edad': f.edad,
        'Edad Laboral': f.edadLaboral,
        'Años Servicio (si nombrado)': f.añosServicio,
        'Años Restantes Jubilación': f.añosRestantesJubilacion,
        'Distrito Sanitario': f.distrito_sanitario,
        'Centro de Trabajo': f.nombre_centro,
        'Provincia': f.provincia,
        'Estado Solicitud': f.estado_solicitud,
        'Número Funcionario': f.numero_funcionario,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(funcionariosExport);
      XLSX.utils.book_append_sheet(wb, ws, 'Funcionarios Públicos');

      // Estadísticas generales
      const estadisticas = [
        ['Métrica', 'Valor'],
        ['Total Funcionarios', totalFuncionarios],
        ['Nombrados', nombrados],
        ['No Nombrados', noNombrados],
        ['Próximos a Jubilación (60+)', proximosJubilacion],
        ['Edad Promedio', Math.round(funcionarios.filter(f => f.edad).reduce((sum, f) => sum + f.edad, 0) / (funcionarios.filter(f => f.edad).length || 1))],
      ];
      const wsStats = XLSX.utils.aoa_to_sheet(estadisticas);
      XLSX.utils.book_append_sheet(wb, wsStats, 'Estadísticas');

      // Desglose por género
      const generoMap = funcionarios.reduce((acc: Record<string, number>, f) => {
        const g = f.genero || 'Sin especificar';
        acc[g] = (acc[g] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const generoRows = [['Género','Cantidad'], ...Object.entries(generoMap)];
      const wsGenero = XLSX.utils.aoa_to_sheet(generoRows);
      XLSX.utils.book_append_sheet(wb, wsGenero, 'Género');

      // Áreas con más profesionales (Top 10)
      const wsAreas = XLSX.utils.json_to_sheet(areaProfesionalData.map(a => ({
        'Área Profesional': a.name,
        'Total': a.total,
        'Nombrados': a.nombrados,
        'No Nombrados': a.noNombrados
      })));
      XLSX.utils.book_append_sheet(wb, wsAreas, 'Areas_Top');

      XLSX.writeFile(wb, `Funcionarios_Publicos_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exportando Excel:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Análisis de Funcionarios Públicos
          </h2>
          <p className="text-gray-600 mt-1">
            Estadísticas detalladas del personal funcionario del sistema sanitario
          </p>
        </div>
        <Button onClick={exportToExcel} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Tarjetas de métricas clave */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigateToTab && onNavigateToTab("professionals", { funcion_publica: true })}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Total Funcionarios
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {totalFuncionarios.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigateToTab && onNavigateToTab("professionals", { funcion_publica: true, estatus_funcionario: 'nombrado' })}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-green-100">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Nombrados
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {nombrados}
                </p>
                <p className="text-xs text-gray-500">
                  {totalFuncionarios > 0 ? Math.round((nombrados / totalFuncionarios) * 100) : 0}% del total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigateToTab && onNavigateToTab("professionals", { funcion_publica: true, estatus_funcionario: 'no_nombrado' })}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-orange-100">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  No Nombrados
                </h3>
                <p className="text-2xl font-bold text-orange-600">
                  {noNombrados}
                </p>
                <p className="text-xs text-gray-500">
                  {totalFuncionarios > 0 ? Math.round((noNombrados / totalFuncionarios) * 100) : 0}% del total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigateToTab && onNavigateToTab("professionals", { funcion_publica: true, años_restantes_jubilacion_min: 0, años_restantes_jubilacion_max: 5 })}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-red-100">
                <Award className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Próximos a Jubilación
                </h3>
                <p className="text-2xl font-bold text-red-600">
                  {proximosJubilacion}
                </p>
                <p className="text-xs text-gray-500">
                  Mayores de 60 años
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carta detallada de Próximos a Jubilación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Award className="w-5 h-5 text-red-600" /> Detalle Próximos a Jubilación (≤ 5 años)</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToTab && onNavigateToTab('professionals', { funcion_publica: true, años_restantes_jubilacion_min: 0, años_restantes_jubilacion_max: 5 })}
            >
              Ver profesionales
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600">Total próximos</div>
              <div className="text-2xl font-bold text-red-600">{proximos.length}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Áreas principales</div>
              <div className="flex flex-wrap gap-2">
                {topAreasProximosArr.map(a => (
                  <Badge key={a.nombre} variant="secondary" className="text-xs">{a.nombre} ({a.total})</Badge>
                ))}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Distritos principales</div>
              <div className="flex flex-wrap gap-2">
                {topDistritosProximosArr.map(d => (
                  <Badge key={d.nombre} variant="secondary" className="text-xs">{d.nombre} ({d.total})</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por estatus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Distribución por Estatus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartActions title="Distribución por Estatus">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={estatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {estatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartActions>
          </CardContent>
        </Card>

        {/* Distribución por distrito sanitario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Distribución por Distrito Sanitario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartActions title="Distribución por Distrito Sanitario">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distritoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    fill="#0088FE"
                    className="cursor-pointer hover:opacity-80"
                    onClick={(d: any) => onNavigateToTab && onNavigateToTab('professionals', { funcion_publica: true, distrito_sanitario: d.name, estado_solicitud: 'Aprobado' })}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartActions>
          </CardContent>
        </Card>

        {/* Edad laboral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Distribución por Edad Laboral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartActions title="Distribución por Edad Laboral">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={edadLaboralData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    fill="#00C49F"
                    className="cursor-pointer hover:opacity-80"
                    onClick={(d: any) => {
                      const map: Record<string, {min?: number; max?: number}> = {
                        '0-5 años': { min: 0, max: 5 },
                        '5-10 años': { min: 5, max: 10 },
                        '10-15 años': { min: 10, max: 15 },
                        '15-20 años': { min: 15, max: 20 },
                        '20-25 años': { min: 20, max: 25 },
                        '25+ años': { min: 25 },
                      };
                      const r = map[d.name] || {};
                      onNavigateToTab && onNavigateToTab('professionals', { funcion_publica: true, edad_laboral_min: r.min, edad_laboral_max: r.max });
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartActions>
          </CardContent>
        </Card>

        {/* Años restantes para jubilación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Años Restantes para Jubilación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartActions title="Años Restantes para Jubilación">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={jubilacionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#FF8042"
                    fill="#FF8042"
                    fillOpacity={0.6}
                    onClick={(d: any) => {
                      const map: Record<string, {min?: number; max?: number}> = {
                        '0-5 años': { min: 0, max: 5 },
                        '5-10 años': { min: 5, max: 10 },
                        '10-15 años': { min: 10, max: 15 },
                        '15-20 años': { min: 15, max: 20 },
                        '20-25 años': { min: 20, max: 25 },
                        '25+ años': { min: 25 },
                      };
                      const r = map[d.activeLabel as string] || {};
                      onNavigateToTab && onNavigateToTab('professionals', { funcion_publica: true, años_restantes_jubilacion_min: r.min, años_restantes_jubilacion_max: r.max });
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartActions>
          </CardContent>
        </Card>
      </div>

      {/* Áreas profesionales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Funcionarios por Área Profesional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartActions title="Funcionarios por Área Profesional">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={areaProfesionalData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={120}
                />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="nombrados"
                  stackId="a"
                  fill="#0088FE"
                  name="Nombrados"
                  className="cursor-pointer hover:opacity-80"
                  onClick={(d: any) => onNavigateToTab && onNavigateToTab('professionals', { funcion_publica: true, area_profesional: d.name, estado_solicitud: 'Aprobado' })}
                />
                <Bar
                  dataKey="noNombrados"
                  stackId="a"
                  fill="#00C49F"
                  name="No Nombrados"
                  className="cursor-pointer hover:opacity-80"
                  onClick={(d: any) => onNavigateToTab && onNavigateToTab('professionals', { funcion_publica: true, area_profesional: d.name })}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartActions>
        </CardContent>
      </Card>

      {/* Lista de funcionarios nombrados con 30+ años de servicio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Funcionarios nombrados con 30+ años de servicio
          </CardTitle>
        </CardHeader>
        <CardContent>
          {servicio30Mas.length === 0 ? (
            <div className="text-sm text-gray-500">No hay funcionarios con más de 30 años de servicio.</div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y">
              {servicio30Mas.slice(0, 20).map((f) => (
                <div key={f.id} className="py-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{f.nombre_completo}</div>
                    <div className="text-xs text-gray-500 truncate">{f.area_profesional || 'Sin área'} • {f.nombre_centro || 'Sin centro'} • {f.distrito_sanitario || 'Sin distrito'}</div>
                  </div>
                  <Badge variant="outline" className="ml-4 whitespace-nowrap">{f.añosServicio} años</Badge>
                </div>
              ))}
              {servicio30Mas.length > 20 && (
                <div className="text-xs text-gray-500 py-2">... y {servicio30Mas.length - 20} más</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FuncionariosPublicosAnalytics;
