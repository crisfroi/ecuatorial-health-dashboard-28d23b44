
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardChartsProps {
  professionData: Array<{ profesion: string; cantidad: number }>;
  provinciaData: Array<{ provincia: string; cantidad: number }>;
  onChartClick: (data: any, chartType: string) => void;
}

const DashboardCharts = ({ professionData, provinciaData, onChartClick }: DashboardChartsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-guinea-teal" />
            <span>Profesionales por Área</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={professionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="profesion" 
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
                onClick={(data) => onChartClick(data, 'profession')}
                className="cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-guinea-teal" />
            <span>Distribución por Provincia</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={provinciaData}
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
                {provinciaData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
