import React, { useState } from 'react';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { useHosixAuth } from '@/hooks/useHosixAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useHosixAuditoria } from '@/hooks/useHosixAuditoria';

const PacientesList: React.FC = () => {
  const { user } = useHosixAuth();
  const { pacientes, isLoadingPacientes, buscarPacientes, desactivarPaciente } = useHosixPacientes();
  const { auditarAcceso, auditarEliminacion } = useHosixAuditoria();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPacientes, setFilteredPacientes] = useState(pacientes);

  // Registrar acceso
  React.useEffect(() => {
    auditarAcceso('hosix_pacientes');
  }, []);

  // Filtrar pacientes
  React.useEffect(() => {
    if (!searchTerm) {
      setFilteredPacientes(pacientes);
    } else {
      const filtered = pacientes.filter(p =>
        p.primer_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.primer_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ppi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.numero_documento?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      );
      setFilteredPacientes(filtered);
    }
  }, [searchTerm, pacientes]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      try {
        const resultados = await buscarPacientes({ busqueda: searchTerm });
        setFilteredPacientes(resultados);
      } catch (err) {
        console.error('Error searching patients:', err);
      }
    }
  };

  const handleDelete = async (id: string, nombrePaciente: string) => {
    if (window.confirm(`¿Desactivar a ${nombrePaciente}?`)) {
      try {
        await desactivarPaciente(id);
        auditarEliminacion('hosix_pacientes', id, { nombre: nombrePaciente });
      } catch (err) {
        console.error('Error deleting patient:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Pacientes</CardTitle>
          <CardDescription>
            Centro de Salud: {user?.nombre_completo || 'Cargando...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de búsqueda */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, PPI o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Buscar</Button>
            <Button variant="outline" type="button">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Paciente
            </Button>
          </form>

          {/* Tabla de pacientes */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>PPI</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Grupo Sanguíneo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingPacientes ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredPacientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-gray-500">No hay pacientes registrados</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPacientes.map(paciente => (
                    <TableRow key={paciente.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">{paciente.ppi}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {paciente.primer_nombre} {paciente.primer_apellido}
                        </div>
                        <div className="text-sm text-gray-500">
                          {paciente.segundo_nombre} {paciente.segundo_apellido}
                        </div>
                      </TableCell>
                      <TableCell>{paciente.numero_documento || '-'}</TableCell>
                      <TableCell>{paciente.telefono_movil || '-'}</TableCell>
                      <TableCell>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {paciente.grupo_sanguineo || 'N/D'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          paciente.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {paciente.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0"
                            title="Desactivar"
                            onClick={() =>
                              handleDelete(
                                paciente.id,
                                `${paciente.primer_nombre} ${paciente.primer_apellido}`
                              )
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Total de Pacientes</p>
              <p className="text-2xl font-bold">{filteredPacientes.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pacientes Activos</p>
              <p className="text-2xl font-bold">
                {filteredPacientes.filter(p => p.activo).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pacientes Inactivos</p>
              <p className="text-2xl font-bold">
                {filteredPacientes.filter(p => !p.activo).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PacientesList;
