
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Download, Eye } from 'lucide-react';

interface ProfessionalsTableProps {
  onSelectProfessional: (professional: any) => void;
  userRole: string;
}

const ProfessionalsTable = ({ onSelectProfessional, userRole }: ProfessionalsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');

  const professionals = [
    {
      id: 1,
      nombreCompleto: 'Dr. María José Nsue Ela',
      nacionalidad: 'Ecuatoguineana',
      edad: 34,
      sexo: 'F',
      profesion: 'Médico General',
      centroTrabajo: 'Hospital Regional de Malabo',
      distrito: 'Distrito 1',
      provincia: 'Malabo',
      estado: 'Aprobado',
      fechaRevision: '2024-01-20',
      codigoBarras: 'EQG001234567'
    },
    {
      id: 2,
      nombreCompleto: 'Enfermera Carmen Obiang Nguema',
      nacionalidad: 'Ecuatoguineana',
      edad: 28,
      sexo: 'F',
      profesion: 'Enfermería',
      centroTrabajo: 'Centro de Salud de Bata',
      distrito: 'Distrito 2',
      provincia: 'Bata',
      estado: 'Pendiente',
      fechaRevision: null,
      codigoBarras: 'EQG001234568'
    },
    {
      id: 3,
      nombreCompleto: 'Farm. José Antonio Mba',
      nacionalidad: 'Ecuatoguineana',
      edad: 42,
      sexo: 'M',
      profesion: 'Farmacia',
      centroTrabajo: 'Farmacia Central',
      distrito: 'Distrito 1',
      provincia: 'Malabo',
      estado: 'Aprobado',
      fechaRevision: '2024-01-18',
      codigoBarras: 'EQG001234569'
    }
  ];

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

  const filteredProfessionals = professionals.filter(professional => {
    const matchesSearch = professional.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         professional.profesion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'todos' || professional.profesion === categoryFilter;
    const matchesStatus = statusFilter === 'todos' || professional.estado === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Registro de Profesionales Sanitarios</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o profesión..."
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

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Profesión</TableHead>
                <TableHead>Centro de Trabajo</TableHead>
                <TableHead>Distrito</TableHead>
                <TableHead>Provincia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfessionals.map((professional) => (
                <TableRow key={professional.id}>
                  <TableCell className="font-medium">{professional.nombreCompleto}</TableCell>
                  <TableCell>{professional.profesion}</TableCell>
                  <TableCell>{professional.centroTrabajo}</TableCell>
                  <TableCell>{professional.distrito}</TableCell>
                  <TableCell>{professional.provincia}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalsTable;
