import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import { MapPin, Users, TrendingUp, Activity, Calendar, Filter, Eye, ArrowRight } from 'lucide-react';

interface AdvancedStatsProps {
  onNavigateToProfessionals?: (filters: any) => void;
}

const AdvancedStats = ({ onNavigateToProfessionals }: AdvancedStatsProps) => {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [activeFilter, setActiveFilter] = useState('provincia');
  const [filteredData, setFilteredData] = useState([]);

  const provinceData = [
    { provincia: 'Malabo', profesionales: 245, publico: 180, privado: 65, distrito: 'Distrito Malabo Norte' },
    { provincia: 'Bata', profesionales: 198, publico: 150, privado: 48, distrito: 'Distrito Bata Centro' },
    { provincia: 'Ebebiyín', profesionales: 87, publico: 70, privado: 17, distrito: 'Distrito Ebebiyín' },
    { provincia: 'Mongomo', profesionales: 56, publico: 45, privado: 11, distrito: 'Distrito Mongomo' },
    { provincia: 'Evinayong', profesionales: 78, publico: 62, privado: 16, distrito: 'Distrito Evinayong' }
  ];

  const districtData = [
    { distrito: 'Distrito Malabo Norte', profesionales: 145, medicos: 45, enfermeria: 78, farmacia: 22 },
    { distrito: 'Distrito Malabo Sur', profesionales: 100, medicos: 32, enfermeria: 55, farmacia: 13 },
    { distrito: 'Distrito Bata Centro', profesionales: 120, medicos: 38, enfermeria: 65, farmacia: 17 },
    { distrito: 'Distrito Bata Este', profesionales: 78, medicos: 25, enfermeria: 40, farmacia: 13 },
    { distrito: 'Distrito Ebebiyín', profesionales: 87, medicos: 28, enfermeria: 45, farmacia: 14 },
    { distrito: 'Distrito Mongomo', profesionales: 56, medicos: 18, enfermeria: 30, farmacia: 8 },
    { distrito: 'Distrito Evinayong', profesionales: 78, medicos: 25, enfermeria: 40, farmacia: 13 }
  ];

  const ageData = [
    { rango: '20-30', cantidad: 156, genero_m: 68, genero_f: 88 },
    { rango: '31-40', cantidad: 234, genero_m: 98, genero_f: 136 },
    { rango: '41-50', cantidad: 189, genero_m: 85, genero_f: 104 },
    { rango: '51-60', cantidad: 98, genero_m: 45, genero_f: 53 },
    { rango: '+60', cantidad: 43, genero_m: 20, genero_f: 23 }
  ];

  const specialtyData = [
    { especialidad: 'Medicina General', cantidad: 156, publico: 120, privado: 36 },
    { especialidad: 'Enfermería', cantidad: 243, publico: 190, privado: 53 },
    { especialidad: 'Farmacia', cantidad: 87, publico: 65, privado: 22 },
    { especialidad: 'Laboratorio', cantidad: 45, publico: 38, privado: 7 },
    { especialidad: 'Radiología', cantidad: 32, publico: 28, privado: 4 }
  ];

  const genderData = [
    { name: 'Mujeres', value: 58.3, fill: '#8b5cf6' },
    { name: 'Hombres', value: 41.7, fill: '#06b6d4' }
  ];

  const sectorData = [
    { name: 'Público', value: 72.4, fill: '#10b981' },
    { name: 'Privado', value: 27.6, fill: '#f59e0b' }
  ];

  const monthlyData = [
    { mes: 'Enero', solicitudes: 45, aprobadas: 38, pendientes: 7 },
    { mes: 'Febrero', solicitudes: 52, aprobadas: 44, pendientes: 8 },
    { mes: 'Marzo', solicitudes: 48, aprobadas: 41, pendientes: 7 },
    { mes: 'Abril', solicitudes: 61, aprobadas: 52, pendientes: 9 },
    { mes: 'Mayo', solicitudes: 55, aprobadas: 47, pendientes: 8 },
    { mes: 'Junio', solicitudes: 67, aprobadas: 58, pendientes: 9 }
  ];

  const handleChartClick = (data: any, filterType: string) => {
    setActiveFilter(filterType);
    let newFilteredData = [];
    
    switch (filterType) {
      case 'provincia':
        newFilteredData = provinceData.filter(item => item.provincia === data.provincia);
        break;
      case 'edad':
        newFilteredData = ageData.filter(item => item.rango === data.rango);
        break;
      case 'especialidad':
        newFilteredData = specialtyData.filter(item => item.especialidad === data.especialidad);
        break;
      case 'distrito':
        newFilteredData = districtData.filter(item => item.distrito === data.distrito);
        break;
      default:
        newFilteredData = [];
    }
    
    setFilteredData(newFilteredData);
  };

  const handleNavigateToProfessionals = (filterData: any, filterType: string) => {
    if (onNavigateToProfessionals) {
      const filters = {
        type: filterType,
        value: filterData[Object.keys(filterData)[0]], // primer valor del objeto
        data: filterData
      };
      onNavigateToProfessionals(filters);
    }
  };

  const getTableData = () => {
    if (filteredData.length > 0) return filteredData;
    
    switch (activeFilter) {
      case 'provincia':
        return provinceData;
      case 'edad':
        return ageData;
      case 'especialidad':
        return specialtyData;
      case 'distrito':
        return districtData;
      default:
        return provinceData;
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

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="1">Enero</SelectItem>
              <SelectItem value="2">Febrero</SelectItem>
              <SelectItem value="3">Marzo</SelectItem>
              <SelectItem value="4">Abril</SelectItem>
              <SelectItem value="5">Mayo</SelectItem>
              <SelectItem value="6">Junio</SelectItem>
              <SelectItem value="7">Julio</SelectItem>
              <SelectItem value="8">Agosto</SelectItem>
              <SelectItem value="9">Septiembre</SelectItem>
              <SelectItem value="10">Octubre</SelectItem>
              <SelectItem value="11">Noviembre</SelectItem>
              <SelectItem value="12">Diciembre</SelectItem>
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
              <SelectItem value="radiologia">Radiología</SelectItem>
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
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>Distribución por Provincia</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleNavigateToProfessionals({ filter: 'provincia' }, 'provincia')}
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver Todos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={provinceData} onClick={(data: any) => {
                const payload = data?.payload || data;
                if (payload) {
                  handleChartClick(payload, 'provincia');
                  handleNavigateToProfessionals(payload, 'provincia');
                }
              }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="provincia" />
                <YAxis />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.1)' }} />
                <Bar dataKey="publico" stackId="a" fill="#10b981" name="Sector Público" />
                <Bar dataKey="privado" stackId="a" fill="#f59e0b" name="Sector Privado" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-600" />
                <span>Distribución por Distrito Sanitario</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleNavigateToProfessionals({ filter: 'distrito' }, 'distrito')}
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver Todos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={districtData} onClick={(data: any) => {
                const payload = data?.payload || data;
                if (payload) {
                  handleChartClick(payload, 'distrito');
                  handleNavigateToProfessionals(payload, 'distrito');
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

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span>Distribución por Edad</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleNavigateToProfessionals({ filter: 'edad' }, 'edad')}
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver Todos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData} onClick={(data: any) => {
                const payload = data?.payload || data;
                if (payload) {
                  handleChartClick(payload, 'edad');
                  handleNavigateToProfessionals(payload, 'edad');
                }
              }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rango" />
                <YAxis />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.1)' }} />
                <Bar dataKey="cantidad" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span>Distribución por Especialidad</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleNavigateToProfessionals({ filter: 'especialidad' }, 'especialidad')}
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver Todos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={specialtyData} onClick={(data: any) => {
                const payload = data?.payload || data;
                if (payload) {
                  handleChartClick(payload, 'especialidad');
                  handleNavigateToProfessionals(payload, 'especialidad');
                }
              }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="especialidad" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.1)' }} />
                <Bar dataKey="publico" stackId="a" fill="#10b981" name="Sector Público" />
                <Bar dataKey="privado" stackId="a" fill="#f59e0b" name="Sector Privado" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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
                  label={({ name, value }) => `${name}: ${value}%`}
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

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <span>Sector Público vs Privado</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart innerRadius="30%" outerRadius="90%" data={sectorData}>
                <RadialBar dataKey="value" cornerRadius={10} fill="#10b981" />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Interactiva Mejorada */}
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
                onClick={() => handleNavigateToProfessionals({ filter: activeFilter }, activeFilter)}
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
                  {activeFilter === 'provincia' && (
                    <>
                      <TableHead>Provincia</TableHead>
                      <TableHead>Total Profesionales</TableHead>
                      <TableHead>Sector Público</TableHead>
                      <TableHead>Sector Privado</TableHead>
                      <TableHead>Distrito Sanitario</TableHead>
                      <TableHead>Acciones</TableHead>
                    </>
                  )}
                  {activeFilter === 'distrito' && (
                    <>
                      <TableHead>Distrito Sanitario</TableHead>
                      <TableHead>Total Profesionales</TableHead>
                      <TableHead>Médicos</TableHead>
                      <TableHead>Enfermería</TableHead>
                      <TableHead>Farmacia</TableHead>
                      <TableHead>Acciones</TableHead>
                    </>
                  )}
                  {activeFilter === 'edad' && (
                    <>
                      <TableHead>Rango de Edad</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Hombres</TableHead>
                      <TableHead>Mujeres</TableHead>
                      <TableHead>Acciones</TableHead>
                    </>
                  )}
                  {activeFilter === 'especialidad' && (
                    <>
                      <TableHead>Especialidad</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Sector Público</TableHead>
                      <TableHead>Sector Privado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {getTableData().map((item, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    {activeFilter === 'provincia' && (
                      <>
                        <TableCell className="font-medium">{item.provincia}</TableCell>
                        <TableCell>{item.profesionales}</TableCell>
                        <TableCell>{item.publico}</TableCell>
                        <TableCell>{item.privado}</TableCell>
                        <TableCell>{item.distrito}</TableCell>
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
                    {activeFilter === 'distrito' && (
                      <>
                        <TableCell className="font-medium">{item.distrito}</TableCell>
                        <TableCell>{item.profesionales}</TableCell>
                        <TableCell>{item.medicos}</TableCell>
                        <TableCell>{item.enfermeria}</TableCell>
                        <TableCell>{item.farmacia}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleNavigateToProfessionals(item, 'distrito')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </>
                    )}
                    {activeFilter === 'edad' && (
                      <>
                        <TableCell className="font-medium">{item.rango}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>{item.genero_m}</TableCell>
                        <TableCell>{item.genero_f}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleNavigateToProfessionals(item, 'edad')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </>
                    )}
                    {activeFilter === 'especialidad' && (
                      <>
                        <TableCell className="font-medium">{item.especialidad}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>{item.publico}</TableCell>
                        <TableCell>{item.privado}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleNavigateToProfessionals(item, 'especialidad')}
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

      {/* Resumen por Distritos Sanitarios Mejorado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-guinea-teal" />
            <span>Resumen por Distritos Sanitarios</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {districtData.map((distrito) => (
              <div key={distrito.distrito} className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
                   onClick={() => handleNavigateToProfessionals(distrito, 'distrito')}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-guinea-dark-teal group-hover:text-guinea-teal transition-colors">
                    {distrito.distrito}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-guinea-teal transition-colors" />
                </div>
                <p className="text-2xl font-bold text-guinea-teal">{distrito.profesionales}</p>
                <p className="text-xs text-gray-600 mb-2">profesionales totales</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-600">Médicos:</span>
                    <span className="font-medium">{distrito.medicos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Enfermería:</span>
                    <span className="font-medium">{distrito.enfermeria}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-600">Farmacia:</span>
                    <span className="font-medium">{distrito.farmacia}</span>
                  </div>
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
