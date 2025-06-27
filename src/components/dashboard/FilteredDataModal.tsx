
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, BarChart3 } from 'lucide-react';

interface FilteredDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  chartType?: 'bar' | 'pie' | 'stats';
  filters?: Record<string, any>;
}

const COLORS = ['#00BFAA', '#00A693', '#008B7A', '#007063', '#00544C'];

const FilteredDataModal = ({ isOpen, onClose, title, data, chartType = 'stats', filters }: FilteredDataModalProps) => {
  const renderChart = () => {
    if (chartType === 'bar' && data.length > 0) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--guinea-teal))" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'pie' && data.length > 0) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-guinea-teal text-xl font-bold flex items-center space-x-2">
            <BarChart3 className="w-6 h-6" />
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Filtros aplicados */}
          {filters && Object.keys(filters).length > 0 && (
            <Card className="border-guinea-teal/30 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-guinea-teal">Filtros Aplicados</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                      {key.replace('_', ' ')}: {String(value)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas resumidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-guinea-teal flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Total Registros</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-guinea-dark-teal">{data.length}</div>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-guinea-teal flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Promedio</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-guinea-dark-teal">
                  {data.length > 0 ? Math.round(data.reduce((acc, item) => acc + (item.value || 1), 0) / data.length) : 0}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-guinea-teal flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Máximo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-guinea-dark-teal">
                  {data.length > 0 ? Math.max(...data.map(item => item.value || 1)) : 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico */}
          {chartType !== 'stats' && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-guinea-teal">Visualización de Datos</CardTitle>
              </CardHeader>
              <CardContent>
                {renderChart()}
              </CardContent>
            </Card>
          )}

          {/* Tabla de datos */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-guinea-teal">Datos Detallados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-guinea-teal/30">
                      <th className="text-left p-2 text-guinea-teal font-semibold">Elemento</th>
                      <th className="text-left p-2 text-guinea-teal font-semibold">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-guinea-light-teal/10 transition-colors">
                        <td className="p-2 text-guinea-dark-teal">{item.name || item.label || `Elemento ${index + 1}`}</td>
                        <td className="p-2 text-guinea-dark-teal font-medium">{item.value || item.cantidad || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilteredDataModal;
