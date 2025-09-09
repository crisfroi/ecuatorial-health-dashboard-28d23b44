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
    funcion_publica: true 
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando datos de funcionarios...</span>
      </div>
    );
  }

  // Función para calcular edad laboral
  const calcularEdadLaboral = (profesional: any) => {
    const inicioTrabajo = profesional.fecha_inicio_trabajo ? new Date(profesional.fecha_inicio_trabajo) : null;
    const nombramiento = profesional.fecha_nombramiento ? new Date(profesional.fecha_nombramiento) : null;
    const fechaRef = nombramiento || inicioTrabajo;
    if (!fechaRef) return null;
    const años = Math.floor((new Date().getTime() - fechaRef.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return Math.max(0, años);
  };

  // Función para calcular años restantes hasta jubilación
  const calcularAñosRestantesJubilacion = (profesional: any) => {
    if (!profesional.edad) return null;
    return Math.max(0, 65 - profesional.edad);
  };

  // Procesamiento de datos
  const funcionariosProcesados = funcionarios.map(f => ({
    ...f,
    edadLaboral: calcularEdadLaboral(f),
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
    if (!f.añosRestantesJubilacion) return acc;
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

  // Exportar datos a Excel
  const exportToExcel = () => {
    try {
      const funcionariosExport = funcionariosProcesados.map(f => ({
        'Nombre Completo': f.nombre_completo,
        'Área Profesional': f.area_profesional,
        'Estatus': f.estatus_funcionario,
        'Fecha Nombramiento': f.fecha_nombramiento ? new Date(f.fecha_nombramiento).toLocaleDateString('es-ES') : '',
        'Edad': f.edad,
        'Edad Laboral': f.edadLaboral,
        'Años Restantes Jubilación': f.añosRestantesJubilacion,
        'Distrito Sanitario': f.distrito_sanitario,
        'Centro de Trabajo': f.nombre_centro,
        'Provincia': f.provincia,
        'Estado Solicitud': f.estado_solicitud,
        'Número Funcionario': f.numero_funcionario,
      }));

      const ws = XLSX.utils.json_to_sheet(funcionariosExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Funcionarios Públicos');
      
      // Agregar hoja de estadísticas
      const estadisticas = [
        ['Métrica', 'Valor'],
        ['Total Funcionarios', totalFuncionarios],
        ['Nombrados', nombrados],
        ['No Nombrados', noNombrados],
        ['Próximos a Jubilación (60+)', proximosJubilacion],
        ['Edad Promedio', Math.round(funcionarios.filter(f => f.edad).reduce((sum, f) => sum + f.edad, 0) / funcionarios.filter(f => f.edad).length)],
      ];
      
      const wsStats = XLSX.utils.aoa_to_sheet(estadisticas);
      XLSX.utils.book_append_sheet(wb, wsStats, 'Estadísticas');

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

        <Card>
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
                <Bar dataKey="value" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={edadLaboralData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
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
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de áreas profesionales */}
      <Card>
        <CardHeader>  
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Funcionarios por Área Profesional
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              <Bar dataKey="nombrados" stackId="a" fill="#0088FE" name="Nombrados" />
              <Bar dataKey="noNombrados" stackId="a" fill="#00C49F" name="No Nombrados" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default FuncionariosPublicosAnalytics;