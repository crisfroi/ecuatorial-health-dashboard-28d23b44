
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import { MapPin, Users, TrendingUp, Activity } from 'lucide-react';

const AdvancedStats = () => {
  const provinceData = [
    { provincia: 'Malabo', profesionales: 245, publico: 180, privado: 65 },
    { provincia: 'Bata', profesionales: 198, publico: 150, privado: 48 },
    { provincia: 'Ebebiyín', profesionales: 87, publico: 70, privado: 17 },
    { provincia: 'Mongomo', profesionales: 56, publico: 45, privado: 11 },
    { provincia: 'Evinayong', profesionales: 78, publico: 62, privado: 16 }
  ];

  const ageData = [
    { rango: '20-30', cantidad: 156 },
    { rango: '31-40', cantidad: 234 },
    { rango: '41-50', cantidad: 189 },
    { rango: '51-60', cantidad: 98 },
    { rango: '+60', cantidad: 43 }
  ];

  const genderData = [
    { name: 'Mujeres', value: 58.3, color: '#8b5cf6' },
    { name: 'Hombres', value: 41.7, color: '#06b6d4' }
  ];

  const sectorData = [
    { name: 'Público', value: 72.4, fill: '#10b981' },
    { name: 'Privado', value: 27.6, fill: '#f59e0b' }
  ];

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Estadísticas Avanzadas</h2>
        <Select defaultValue="2024">
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Distribución por Provincia</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={provinceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="provincia" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="publico" stackId="a" fill="#10b981" name="Sector Público" />
                <Bar dataKey="privado" stackId="a" fill="#f59e0b" name="Sector Privado" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span>Distribución por Edad</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rango" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Distribución por Género</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <span>Sector Público vs Privado</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart innerRadius="30%" outerRadius="90%" data={sectorData}>
                <RadialBar dataKey="value" cornerRadius={10} />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen Estadístico Regional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {provinceData.map((provincia) => (
              <div key={provincia.provincia} className="text-center p-4 border rounded-lg">
                <h3 className="font-bold text-lg">{provincia.provincia}</h3>
                <p className="text-2xl font-bold text-blue-600">{provincia.profesionales}</p>
                <p className="text-sm text-gray-600">profesionales</p>
                <div className="mt-2 text-xs">
                  <span className="text-green-600">Público: {provincia.publico}</span>
                  <br />
                  <span className="text-orange-600">Privado: {provincia.privado}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedStats;
