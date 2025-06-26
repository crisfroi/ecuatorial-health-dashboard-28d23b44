
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, BarChart3, PieChart, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { useEstadisticasAvanzadas } from '@/hooks/useEstadisticasAvanzadas';
import ChartActions from './ChartActions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface DashboardChartsProps {
  onChartClick: (data: any, chartType: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B9D', '#95E1D3'];

const DashboardCharts = ({ onChartClick }: DashboardChartsProps) => {
  const { data: stats, isLoading } = useEstadisticasAvanzadas();
  const { toast } = useToast();

  const handleDownloadAllCharts = async () => {
    try {
      const chartsElement = document.getElementById('dashboard-charts-container');
      if (!chartsElement) {
        toast({
          title: "Error",
          description: "No se pudieron encontrar los gráficos para descargar",
          variant: "destructive",
        });
        return;
      }

      const canvas = await html2canvas(chartsElement, {
        backgroundColor: '#f9fafb',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: chartsElement.offsetWidth,
        height: chartsElement.offsetHeight
      });

      const link = document.createElement('a');
      link.download = `dashboard-graficos-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      toast({
        title: "Gráficos descargados",
        description: "Los gráficos del dashboard se han descargado correctamente",
        variant: "default",
      });
    } catch (error) {
      console.error('Error downloading charts:', error);
      toast({
        title: "Error",
        description: "No se pudieron descargar los gráficos",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse shadow-xl">
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Análisis Visual</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadAllCharts}
          className="flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Descargar Todos</span>
        </Button>
      </div>

      <div id="dashboard-charts-container" className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
        {/* Gráfico de barras por área profesional */}
        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Profesionales por Área</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ChartActions title="Profesionales por Área">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.datosGraficoAreas || []} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--guinea-teal))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--guinea-teal))" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis 
                    dataKey="area" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                    stroke="#6b7280"
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="cantidad" 
                    fill="url(#barGradient)"
                    onClick={(data) => onChartClick(data, 'area_profesional')}
                    className="cursor-pointer"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartActions>
          </CardContent>
        </Card>

        {/* Gráfico circular por provincia */}
        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
              <span>Distribución por Provincia</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ChartActions title="Distribución por Provincia">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <defs>
                    {COLORS.map((color, index) => (
                      <linearGradient key={index} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0.4}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={stats?.datosGraficoProvincias || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ provincia, cantidad }) => `${provincia}: ${cantidad}`}
                    outerRadius={100}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="cantidad"
                    onClick={(data) => onChartClick(data, 'provincia')}
                    className="cursor-pointer"
                  >
                    {(stats?.datosGraficoProvincias || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#pieGradient${index % COLORS.length})`} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </ChartActions>
          </CardContent>
        </Card>

        {/* Gráfico de estados de solicitud */}
        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Estados de Solicitud</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ChartActions title="Estados de Solicitud">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.datosGraficoEstados || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="stateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
                  <XAxis dataKey="estado" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="cantidad" 
                    fill="url(#stateGradient)"
                    onClick={(data) => onChartClick(data, 'estado_solicitud')}
                    className="cursor-pointer"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartActions>
          </CardContent>
        </Card>

        {/* Gráfico de tendencias mensuales */}
        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Tendencia de Registros (12 meses)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ChartActions title="Tendencia de Registros">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats?.tendenciasMensuales || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--guinea-teal))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--guinea-teal))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                  <XAxis dataKey="mes" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="registros" 
                    stroke="hsl(var(--guinea-teal))" 
                    fillOpacity={1}
                    fill="url(#trendGradient)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartActions>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardCharts;
