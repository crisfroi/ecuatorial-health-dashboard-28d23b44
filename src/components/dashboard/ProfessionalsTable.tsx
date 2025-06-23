
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Download, Eye, Filter, X } from 'lucide-react';

interface ProfessionalsTableProps {
  onSelectProfessional: (professional: any) => void;
  userRole: string;
  appliedFilters?: any;
  onClearFilters?: () => void;
}

const ProfessionalsTable = ({ onSelectProfessional, userRole, appliedFilters, onClearFilters }: ProfessionalsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [provinceFilter, setProvinceFilter] = useState('todos');
  const [districtFilter, setDistrictFilter] = useState('todos');

  const professionals = [
    {
      id: 1,
      nombreCompleto: 'Dr. María José Nsue Ela',
      nacionalidad: 'Ecuatoguineana',
      edad: 34,
      sexo: 'F',
      profesion: 'Médico General',
      centroTrabajo: 'Hospital Regional de Malabo',
      distrito: 'Distrito Malabo Norte',
      provincia: 'Malabo',
      estado: 'Aprobado',
      fechaRevision: '2024-01-20',
      codigoBarras: 'EQG001234567',
      sector: 'Público'
    },
    {
      id: 2,
      nombreCompleto: 'Enfermera Carmen Obiang Nguema',
      nacionalidad: 'Ecuatoguineana',
      edad: 28,
      sexo: 'F',
      profesion: 'Enfermería',
      centroTrabajo: 'Centro de Salud de Bata',
      distrito: 'Distrito Bata Centro',
      provincia: 'Bata',
      estado: 'Pendiente',
      fechaRevision: null,
      codigoBarras: 'EQG001234568',
      sector: 'Público'
    },
    {
      id: 3,
      nombreCompleto: 'Farm. José Antonio Mba',
      nacionalidad: 'Ecuatoguineana',
      edad: 42,
      sexo: 'M',
      profesion: 'Farmacia',
      centroTrabajo: 'Farmacia Central',
      distrito: 'Distrito Malabo Norte',
      provincia: 'Malabo',
      estado: 'Aprobado',
      fechaRevision: '2024-01-18',
      codigoBarras: 'EQG001234569',
      sector: 'Privado'
    },
    {
      id: 4,
      nombreCompleto: 'Dr. Pedro Ondo Bile',
      nacionalidad: 'Ecuatoguineana',
      edad: 38,
      sexo: 'M',
      profesion: 'Médico General',
      centroTrabajo: 'Hospital de Ebebiyín',
      distrito: 'Distrito Ebebiyín',
      provincia: 'Ebebiyín',
      estado: 'Aprobado',
      fechaRevision: '2024-02-10',
      codigoBarras: 'EQG001234570',
      sector: 'Público'
    },
    {
      id: 5,
      nombreCompleto: 'Enfermera Ana Nguema Esono',
      nacionalidad: 'Ecuatoguineana',
      edad: 31,
      sexo: 'F',
      profesion: 'Enfermería',
      centroTrabajo: 'Centro de Salud Mongomo',
      distrito: 'Distrito Mongomo',
      provincia: 'Mongomo',
      estado: 'Aprobado',
      fechaRevision: '2024-03-05',
      codigoBarras: 'EQG001234571',
      sector: 'Público'
    }
  ];

  // Aplicar filtros desde estadísticas
  useEffect(() => {
    if (appliedFilters) {
      const { type, data } = appliedFilters;
      
      switch (type) {
        case 'provincia':
          setProvinceFilter(data.provincia || 'todos');
          break;
        case 'distrito':
          setDistrictFilter(data.distrito || 'todos');
          break;
        case 'especialidad':
          setCategoryFilter(data.especialidad || 'todos');
          break;
        case 'edad':
          // Para edad podríamos implementar un filtro específico
          break;
        default:
          break;
      }
    }
  }, [appliedFilters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprobado':
        return 'bg-green-100 text-green-800';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSectorColor = (sector: string) => {
    return sector === 'Público' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800';
  };

  const filteredProfessionals = professionals.filter(professional => {
    const matchesSearch = professional.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         professional.profesion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         professional.centroTrabajo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'todos' || professional.profesion === categoryFilter;
    const matchesStatus = statusFilter === 'todos' || professional.estado === statusFilter;
    const matchesProvince = provinceFilter === 'todos' || professional.provincia === provinceFilter;
    const matchesDistrict = districtFilter === 'todos' || professional.distrito === districtFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesProvince && matchesDistrict;
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setCategoryFilter('todos');
    setStatusFilter('todos');
    setProvinceFilter('todos');
    setDistrictFilter('todos');
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const hasActiveFilters = searchTerm || categoryFilter !== 'todos' || statusFilter !== 'todos' || 
                          provinceFilter !== 'todos' || districtFilter !== 'todos' || appliedFilters;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Registro de Profesionales Sanitarios</span>
            </CardTitle>
            {appliedFilters && (
              <Badge variant="outline" className="bg-guinea-light-teal text-guinea-dark-teal">
                Filtrado por: {appliedFilters.type}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtros superiores */}
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, profesión o centro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoría profesional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las categorías</SelectItem>
                  <SelectItem value="Médico General">Médico General</SelectItem>
                  <SelectItem value="Enfermería">Enfermería</SelectItem>
                  <SelectItem value="Farmacia">Farmacia</SelectItem>
                  <SelectItem value="Laboratorio">Laboratorio</SelectItem>
                  <SelectItem value="Radiología">Radiología</SelectItem>
                </SelectContent>
              </Select>

              <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Provincia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="Malabo">Malabo</SelectItem>
                  <SelectItem value="Bata">Bata</SelectItem>
                  <SelectItem value="Ebebiyín">Ebebiyín</SelectItem>
                  <SelectItem value="Mongomo">Mongomo</SelectItem>
                  <SelectItem value="Evinayong">Evinayong</SelectItem>
                </SelectContent>
              </Select>

              <Select value={districtFilter} onValueChange={setDistrictFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Distrito" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los distritos</SelectItem>
                  <SelectItem value="Distrito Malabo Norte">Distrito Malabo Norte</SelectItem>
                  <SelectItem value="Distrito Malabo Sur">Distrito Malabo Sur</SelectItem>
                  <SelectItem value="Distrito Bata Centro">Distrito Bata Centro</SelectItem>
                  <SelectItem value="Distrito Bata Este">Distrito Bata Este</SelectItem>
                  <SelectItem value="Distrito Ebebiyín">Distrito Ebebiyín</SelectItem>
                  <SelectItem value="Distrito Mongomo">Distrito Mongomo</SelectItem>
                  <SelectItem value="Distrito Evinayong">Distrito Evinayong</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Aprobado">Aprobado</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Limpiar Filtros
                  </Button>
                )}
                <Badge variant="secondary">
                  {filteredProfessionals.length} de {professionals.length} profesionales
                </Badge>
              </div>
              
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>

          {/* Tabla */}
          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Profesión</TableHead>
                  <TableHead>Centro de Trabajo</TableHead>
                  <TableHead>Distrito</TableHead>
                  <TableHead>Provincia</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfessionals.map((professional) => (
                  <TableRow key={professional.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div>
                        <div>{professional.nombreCompleto}</div>
                        <div className="text-sm text-gray-500">
                          {professional.sexo} • {professional.edad} años
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{professional.profesion}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{professional.centroTrabajo}</div>
                        <div className="text-gray-500">{professional.codigoBarras}</div>
                      </div>
                    </TableCell>
                    <TableCell>{professional.distrito}</TableCell>
                    <TableCell>{professional.provincia}</TableCell>
                    <TableCell>
                      <Badge className={getSectorColor(professional.sector)}>
                        {professional.sector}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(professional.estado)}>
                        {professional.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onSelectProfessional(professional)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredProfessionals.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron profesionales con los criterios seleccionados</p>
                {hasActiveFilters && (
                  <Button variant="outline" className="mt-2" onClick={clearAllFilters}>
                    Limpiar filtros
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalsTable;
