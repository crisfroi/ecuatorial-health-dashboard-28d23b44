
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useEstadisticasAvanzadas } from '@/hooks/useEstadisticasAvanzadas';

interface DashboardChartsProps {
  onChartClick: (data: any, chartType: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const DashboardCharts = ({ onChartClick }: DashboardChartsProps) => {
  const { data: stats, isLoading } = useEstadisticasAvanzadas();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de barras por área profesional */}
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-guinea-teal" />
            <span>Profesionales por Área</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.datosGraficoAreas || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="area" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="cantidad" 
                fill="hsl(var(--guinea-teal))" 
                onClick={(data) => onChartClick(data, 'area_profesional')}
                className="cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico circular por provincia */}
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-guinea-teal" />
            <span>Distribución por Provincia</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={stats?.datosGraficoProvincias || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ provincia, cantidad }) => `${provincia}: ${cantidad}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="cantidad"
                onClick={(data) => onChartClick(data, 'provincia')}
                className="cursor-pointer"
              >
                {(stats?.datosGraficoProvincias || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de estados de solicitud */}
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-guinea-teal" />
            <span>Estados de Solicitud</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.datosGraficoEstados || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="estado" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="cantidad" 
                fill="#22c55e"
                onClick={(data) => onChartClick(data, 'estado_solicitud')}
                className="cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de tendencias mensuales */}
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-guinea-teal" />
            <span>Tendencia de Registros (12 meses)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.tendenciasMensuales || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="registros" 
                stroke="hsl(var(--guinea-teal))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--guinea-teal))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
