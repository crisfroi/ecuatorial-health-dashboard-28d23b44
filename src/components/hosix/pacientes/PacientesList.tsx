import React, { useState } from 'react';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Users, Plus, Edit2, Trash2, Eye, AlertCircle } from 'lucide-react';
import PacienteForm from './PacienteForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function PacientesList() {
  const { pacientes, isLoadingPacientes, filtros, setFiltros, eliminarPaciente, isEliminingPaciente } = useHosixPacientes();
  const [showForm, setShowForm] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(pacientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPacientes = pacientes.slice(startIndex, startIndex + itemsPerPage);

  const handleEliminar = (id: string) => {
    if (window.confirm('¿Está seguro de que desea desactivar este paciente?')) {
      eliminarPaciente(id, {
        onSuccess: () => {
          toast.success('Paciente desactivado correctamente');
        },
        onError: (error: any) => {
          toast.error(`Error: ${error.message}`);
        },
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingPaciente(null);
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Gestión de Pacientes</h2>
        </div>
        <Button onClick={() => { setEditingPaciente(null); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Paciente
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por PPI, nombre, documento..."
              value={filtros.busqueda || ''}
              onChange={(e) => {
                setFiltros({ ...filtros, busqueda: e.target.value });
                setCurrentPage(1);
              }}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de pacientes */}
      <Card>
        <CardContent>
          {isLoadingPacientes ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Cargando pacientes...</p>
            </div>
          ) : pacientes.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay pacientes registrados</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>PPI</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPacientes.map((paciente) => (
                    <TableRow key={paciente.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono font-bold text-blue-600">{paciente.ppi}</TableCell>
                      <TableCell className="font-medium">
                        {paciente.primer_nombre} {paciente.primer_apellido}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {paciente.tipo_documento}: {paciente.numero_documento || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-1">
                          {paciente.telefono_movil && <p>📱 {paciente.telefono_movil}</p>}
                          {paciente.email && <p>✉️ {paciente.email}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {paciente.fallecido ? (
                          <Badge variant="destructive">Fallecido</Badge>
                        ) : paciente.activo ? (
                          <Badge variant="default" className="bg-green-600">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPaciente(paciente);
                              setShowForm(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEliminar(paciente.id)}
                            disabled={isEliminingPaciente}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              <div className="flex justify-center mt-6">
                <Pagination>
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious onClick={() => setCurrentPage(currentPage - 1)} />
                      </PaginationItem>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationNext onClick={() => setCurrentPage(currentPage + 1)} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog para formulario */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPaciente ? 'Editar Paciente' : 'Nuevo Paciente'}</DialogTitle>
          </DialogHeader>
          <PacienteForm 
            paciente={editingPaciente} 
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
