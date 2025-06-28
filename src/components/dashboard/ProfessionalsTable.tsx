
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Filter, Download, RefreshCw, Search, X } from 'lucide-react';
import { useProfesionales } from '@/hooks/useProfesionales';

interface ProfessionalsTableProps {
  onSelectProfessional: (professional: any) => void;
  userRole: string;
  dashboardFilters?: any;
}

const ProfessionalsTable = ({ onSelectProfessional, userRole, dashboardFilters }: ProfessionalsTableProps) => {
  const [filters, setFilters] = useState({
    search: '',
    area_profesional: 'todos',
    estado_solicitud: 'todos',
    distrito_sanitario: 'todos',
    genero: 'todos',
    tipo_sector: 'todos',
    ...dashboardFilters
  });

  const { data: professionals = [], isLoading, refetch } = useProfesionales(filters);

  useEffect(() => {
    if (dashboardFilters) {
      setFilters(prev => ({ ...prev, ...dashboardFilters }));
    }
  }, [dashboardFilters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      area_profesional: 'todos',
      estado_solicitud: 'todos',
      distrito_sanitario: 'todos',
      genero: 'todos',
      tipo_sector: 'todos'
    });
  };

  const filteredProfessionals = professionals.filter(prof => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        prof.nombre_completo?.toLowerCase().includes(searchTerm) ||
        prof.numero_documento?.toLowerCase().includes(searchTerm) ||
        prof.id_profesional_unico?.toLowerCase().includes(searchTerm) ||
        prof.codigo_expediente?.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Aprobado': 'bg-green-100 text-green-800',
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Revisando': 'bg-blue-100 text-blue-800',
      'Rechazado': 'bg-red-100 text-red-800'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Cargando profesionales...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtros de Búsqueda</span>
            </span>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, documento o código..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.area_profesional} onValueChange={(value) => handleFilterChange('area_profesional', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Área profesional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las áreas</SelectItem>
                <SelectItem value="Medicina">Medicina</SelectItem>
                <SelectItem value="Enfermería">Enfermería</SelectItem>
                <SelectItem value="Farmacia">Farmacia</SelectItem>
                <SelectItem value="Odontología">Odontología</SelectItem>
                <SelectItem value="Laboratorio">Laboratorio</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.estado_solicitud} onValueChange={(value) => handleFilterChange('estado_solicitud', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Revisando">Revisando</SelectItem>
                <SelectItem value="Aprobado">Aprobado</SelectItem>
                <SelectItem value="Rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.distrito_sanitario} onValueChange={(value) => handleFilterChange('distrito_sanitario', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Distrito sanitario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los distritos</SelectItem>
                <SelectItem value="Malabo">Malabo</SelectItem>
                <SelectItem value="Bata">Bata</SelectItem>
                <SelectItem value="Ebebiyin">Ebebiyin</SelectItem>
                <SelectItem value="Mongomo">Mongomo</SelectItem>
                <SelectItem value="Evinayong">Evinayong</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Profesionales Sanitarios ({filteredProfessionals.length})</span>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Único</TableHead>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Área Profesional</TableHead>
                  <TableHead>Distrito Sanitario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfessionals.map((professional) => (
                  <TableRow key={professional.id}>
                    <TableCell className="font-mono text-sm">
                      {professional.id_profesional_unico || professional.codigo_expediente || 'Sin asignar'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {professional.nombre_completo}
                    </TableCell>
                    <TableCell>{professional.area_profesional}</TableCell>
                    <TableCell>{professional.distrito_sanitario || professional.distrito}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(professional.estado_solicitud)}>
                        {professional.estado_solicitud}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectProfessional(professional)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredProfessionals.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No se encontraron profesionales con los filtros aplicados</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalsTable;
