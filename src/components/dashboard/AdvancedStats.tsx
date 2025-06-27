
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapPin, Users, TrendingUp, Activity, Filter, Eye, ArrowRight } from 'lucide-react';
import { useEstadisticasReales } from '@/hooks/useEstadisticasReales';

interface AdvancedStatsProps {
  onNavigateToProfessionals?: (filters: any) => void;
}

const AdvancedStats = ({ onNavigateToProfessionals }: AdvancedStatsProps) => {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [activeFilter, setActiveFilter] = useState('distrito');
  
  const { data: stats, isLoading } = useEstadisticasReales();

  const handleChartClick = (data: any, filterType: string) => {
    setActiveFilter(filterType);
    if (onNavigateToProfessionals) {
      const filters = {
        [filterType]: data[Object.keys(data)[0]]
      };
      onNavigateToProfessionals(filters);
    }
  };

  const handleNavigateToProfessionals = (filterData: any, filterType: string) => {
    if (onNavigateToProfessionals) {
      const filters = {
        [filterType]: filterData[Object.keys(filterData)[0]]
      };
      onNavigateToProfessionals(filters);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Datos por distrito sanitario
  const districtData = Object.entries(stats?.porDistrito || {}).map(([distrito, cantidad]) => ({
    distrito,
    profesionales: cantidad
  }));

  // Datos por área profesional
  const areaData = Object.entries(stats?.porArea || {}).map(([area, cantidad]) => ({
    area,
    cantidad
  }));

  // Datos por provincia
  const provinciaData = Object.entries(stats?.porProvincia || {}).map(([provincia, cantidad]) => ({
    provincia,
    cantidad
  }));

  // Datos por género
  const genderData = Object.entries(stats?.porGenero || {}).map(([genero, cantidad]) => ({
    name: genero === 'Masculino' ? 'Hombres' : genero === 'Femenino' ? 'Mujeres' : genero,
    value: cantidad,
    fill: genero === 'Masculino' ? '#06b6d4' : '#8b5cf6'
  }));

  // Datos por sector
  const sectorData = Object.entries(stats?.porTipoSector || {}).map(([sector, cantidad]) => ({
    name: sector === 'Público' ? 'Público' : 'Privado',
    value: cantidad,
    fill: sector === 'Público' ? '#10b981' : '#f59e0b'
  }));

  const getTableData = () => {
    switch (activeFilter) {
      case 'distrito':
        return districtData;
      case 'area':
        return areaData;
      case 'provincia':
        return provinciaData;
      default:
        return districtData;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Estadísticas Avanzadas</h2>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Especialidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="medicina">Medicina General</SelectItem>
              <SelectItem value="enfermeria">Enfermería</SelectItem>
              <SelectItem value="farmacia">Farmacia</SelectItem>
              <SelectItem value="laboratorio">Laboratorio</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="publico">Público</SelectItem>
              <SelectItem value="privado">Privado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Distrito Sanitario */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>Distribución por Distrito Sanitario</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveFilter('distrito')}
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver Todos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={districtData} onClick={(data) => {
                const payload = data.activePayload?.[0]?.payload;
                if (payload) {
                  handleChartClick(payload, 'distrito_sanitario');
                }
              }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="distrito" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.1)' }} />
                <Bar dataKey="profesionales" fill="hsl(var(--guinea-teal))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por Área Profesional */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-600" />
                <span>Distribución por Área Profesional</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveFilter('area')}
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver Todos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaData} onClick={(data) => {
                const payload = data.activePayload?.[0]?.payload;
                if (payload) {
                  handleChartClick(payload, 'area_profesional');
                }
              }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="area" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.1)' }} />
                <Bar dataKey="cantidad" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por Provincia */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span>Distribución por Provincia</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveFilter('provincia')}
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver Todos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={provinciaData} onClick={(data) => {
                const payload = data.activePayload?.[0]?.payload;
                if (payload) {
                  handleChartClick(payload, 'provincia');
                }
              }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="provincia" />
                <YAxis />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.1)' }} />
                <Bar dataKey="cantidad" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por Género */}
        <Card className="hover:shadow-lg transition-shadow">
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
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Interactiva */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-guinea-teal" />
              <span>Datos Detallados - {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                {getTableData().length} registros
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onNavigateToProfessionals && onNavigateToProfessionals({ filter: activeFilter })}
              >
                <ArrowRight className="w-4 h-4 mr-1" />
                Ver Profesionales
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {activeFilter === 'distrito' && (
                    <>
                      <TableHead>Distrito Sanitario</TableHead>
                      <TableHead>Total Profesionales</TableHead>
                      <TableHead>Acciones</TableHead>
                    </>
                  )}
                  {activeFilter === 'area' && (
                    <>
                      <TableHead>Área Profesional</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Acciones</TableHead>
                    </>
                  )}
                  {activeFilter === 'provincia' && (
                    <>
                      <TableHead>Provincia</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Acciones</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {getTableData().map((item, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    {activeFilter === 'distrito' && (
                      <>
                        <TableCell className="font-medium">{item.distrito}</TableCell>
                        <TableCell>{item.profesionales}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleNavigateToProfessionals(item, 'distrito_sanitario')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </>
                    )}
                    {activeFilter === 'area' && (
                      <>
                        <TableCell className="font-medium">{item.area}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleNavigateToProfessionals(item, 'area_profesional')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </>
                    )}
                    {activeFilter === 'provincia' && (
                      <>
                        <TableCell className="font-medium">{item.provincia}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleNavigateToProfessionals(item, 'provincia')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedStats;
