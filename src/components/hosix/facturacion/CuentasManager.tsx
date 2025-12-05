import React, { useState } from 'react';
import { useHosixFacturacion } from '@/hooks/useHosixFacturacion';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface CuentaFormState {
  paciente_id: string;
  episodio_id: string;
  aseguradora_id: string;
}

export default function CuentasManager() {
  const {
    cuentas,
    isLoadingCuentas,
    aseguradoras,
    isLoadingAseguradoras,
    filtros,
    setFiltros,
    crearCuenta,
    isCreatingCuenta,
    cerrarCuenta,
    isClosingCuenta,
  } = useHosixFacturacion();

  const { pacientes, isLoadingPacientes } = useHosixPacientes();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CuentaFormState>({
    paciente_id: '',
    episodio_id: '',
    aseguradora_id: '',
  });

  const handleOpenForm = () => {
    setFormData({
      paciente_id: '',
      episodio_id: '',
      aseguradora_id: '',
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.paciente_id.trim()) {
      toast.error('Seleccione un paciente');
      return;
    }

    const dataToSubmit = {
      ...formData,
      aseguradora_id: formData.aseguradora_id === 'sin-aseguradora' ? '' : formData.aseguradora_id,
    };

    crearCuenta(dataToSubmit, {
      onSuccess: () => {
        toast.success('Cuenta de facturación creada');
        setShowForm(false);
      },
      onError: (error: any) => {
        toast.error(`Error: ${error.message}`);
      },
    });
  };

  const handleCerrar = (id: string) => {
    if (window.confirm('¿Está seguro de que desea cerrar esta cuenta?')) {
      cerrarCuenta(id, {
        onSuccess: () => {
          toast.success('Cuenta cerrada');
        },
        onError: (error: any) => {
          toast.error(`Error: ${error.message}`);
        },
      });
    }
  };

  const filteredCuentas = cuentas.filter((cuenta) => {
    if (filtros.estado && cuenta.estado !== filtros.estado) return false;
    if (filtros.aseguradora_id && cuenta.aseguradora_id !== filtros.aseguradora_id) {
      return false;
    }
    if (filtros.busqueda) {
      const search = filtros.busqueda.toLowerCase();
      const paciente = pacientes.find((p) => p.id === cuenta.paciente_id);
      return (
        cuenta.numero_cuenta.toLowerCase().includes(search) ||
        paciente?.primer_nombre.toLowerCase().includes(search) ||
        paciente?.primer_apellido.toLowerCase().includes(search) ||
        paciente?.ppi.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getPacienteInfo = (pacienteId: string) => {
    return pacientes.find((p) => p.id === pacienteId);
  };

  const getAseguradoraNombre = (aseguradoraId?: string) => {
    if (!aseguradoraId) return '-';
    return aseguradoras.find((a) => a.id === aseguradoraId)?.nombre || '-';
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold">Cuentas de Facturación</h2>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Cuenta
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
              placeholder="Buscar por número de cuenta, paciente o PPI..."
              value={filtros.busqueda || ''}
              onChange={(e) => {
                setFiltros({ ...filtros, busqueda: e.target.value });
              }}
              className="flex-1"
            />
            <Select
              value={filtros.estado || 'todos'}
              onValueChange={(value) => {
                setFiltros({ ...filtros, estado: value === 'todos' ? undefined : value });
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="abierta">Abierta</SelectItem>
                <SelectItem value="cerrada">Cerrada</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setFiltros({ busqueda: undefined, estado: undefined });
              }}
            >
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de cuentas */}
      <Card>
        <CardContent>
          {isLoadingCuentas ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Cargando cuentas...</p>
            </div>
          ) : filteredCuentas.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay cuentas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>N° Cuenta</TableHead>
                    <TableHead>Paciente (PPI)</TableHead>
                    <TableHead>Aseguradora</TableHead>
                    <TableHead>Facturado</TableHead>
                    <TableHead>Pagado</TableHead>
                    <TableHead>Saldo Pendiente</TableHead>
                    <TableHead>Fecha Apertura</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCuentas.map((cuenta) => {
                    const paciente = getPacienteInfo(cuenta.paciente_id);
                    return (
                      <TableRow key={cuenta.id}>
                        <TableCell className="font-mono font-medium">
                          {cuenta.numero_cuenta}
                        </TableCell>
                        <TableCell className="text-sm">
                          {paciente ? (
                            <div>
                              <div className="font-medium">
                                {paciente.primer_nombre} {paciente.primer_apellido}
                              </div>
                              <div className="text-gray-500">{paciente.ppi}</div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getAseguradoraNombre(cuenta.aseguradora_id)}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${cuenta.total_facturado.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${cuenta.total_pagado.toFixed(2)}
                        </TableCell>
                        <TableCell
                          className={`font-medium ${
                            cuenta.saldo_pendiente > 0
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          ${cuenta.saldo_pendiente.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(cuenta.fecha_apertura).toLocaleDateString(
                            'es-ES'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              cuenta.estado === 'abierta'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {cuenta.estado === 'abierta'
                              ? 'Abierta'
                              : 'Cerrada'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {cuenta.estado === 'abierta' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCerrar(cuenta.id)}
                              disabled={isClosingCuenta}
                              className="text-red-600"
                            >
                              Cerrar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Cuenta de Facturación</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Paciente *
              </label>
              <Select
                value={formData.paciente_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, paciente_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.filter((p) => p.activo).map((paciente) => (
                    <SelectItem key={paciente.id} value={paciente.id}>
                      {paciente.ppi} - {paciente.primer_nombre}{' '}
                      {paciente.primer_apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Aseguradora
              </label>
              <Select
                value={formData.aseguradora_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, aseguradora_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar aseguradora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin-aseguradora">Sin aseguradora</SelectItem>
                  {aseguradoras.map((aseg) => (
                    <SelectItem key={aseg.id} value={aseg.id}>
                      {aseg.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Episodio (Opcional)
              </label>
              <Input
                placeholder="ID del episodio (cita, urgencia, hospitalización)"
                value={formData.episodio_id}
                onChange={(e) =>
                  setFormData({ ...formData, episodio_id: e.target.value })
                }
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isCreatingCuenta}
              >
                Crear Cuenta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
