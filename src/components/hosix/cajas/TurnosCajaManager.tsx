import { useState } from 'react';
import { useHosixCajas, Caja } from '@/hooks/useHosixCajas';
import { useHosixUsers } from '@/hooks/useHosixUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function TurnosCajaManager() {
  const { cajas, turnos, turnosLoading, abrirTurno, cerrarTurno, abrirTurnoLoading, cerrarTurnoLoading, error, setError } = useHosixCajas();
  const { usuarios = [] } = useHosixUsers();
  const [openApertura, setOpenApertura] = useState(false);
  const [openCierre, setOpenCierre] = useState(false);
  const [selectedTurnoId, setSelectedTurnoId] = useState<string | null>(null);
  const [formApertura, setFormApertura] = useState({
    caja_id: '',
    usuario_id: '',
    saldo_apertura: '0',
  });
  const [formCierre, setFormCierre] = useState({
    saldo_cierre: '0',
    observaciones: '',
  });

  const handleAbrirTurno = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formApertura.caja_id || !formApertura.usuario_id) {
      setError('Caja y usuario son requeridos');
      return;
    }

    const numeroTurno = `TRN-${Date.now()}`;
    const now = new Date().toISOString();

    abrirTurno({
      caja_id: formApertura.caja_id,
      usuario_id: formApertura.usuario_id,
      numero_turno: numeroTurno,
      fecha_inicio: now,
      saldo_apertura: parseFloat(formApertura.saldo_apertura),
      total_cobros: 0,
      total_pagos: 0,
      observaciones: '',
      estado: 'abierto',
      created_at: now,
      updated_at: now,
      id: '',
      fecha_cierre: null,
      saldo_cierre: null
    });

    setFormApertura({
      caja_id: '',
      usuario_id: '',
      saldo_apertura: '0',
    });
    setOpenApertura(false);
  };

  const handleCerrarTurno = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTurnoId) {
      setError('Turno no seleccionado');
      return;
    }

    const turno = turnos.find(t => t.id === selectedTurnoId);
    if (!turno) {
      setError('Turno no encontrado');
      return;
    }

    cerrarTurno({
      id: selectedTurnoId,
      saldo_cierre: parseFloat(formCierre.saldo_cierre),
      fecha_cierre: new Date().toISOString(),
      estado: 'cerrado'
    });

    setFormCierre({
      saldo_cierre: '0',
      observaciones: '',
    });
    setOpenCierre(false);
    setSelectedTurnoId(null);
  };

  const turnosAbiertos = turnos.filter(t => t.estado === 'abierto');
  const turnosCerrados = turnos.filter(t => t.estado === 'cerrado');

  if (turnosLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Turnos Abiertos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Turnos Abiertos</CardTitle>
              <CardDescription>Turnos de caja activos en este momento</CardDescription>
            </div>
            <Dialog open={openApertura} onOpenChange={setOpenApertura}>
              <DialogTrigger asChild>
                <Button>+ Abrir Turno</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Abrir Nuevo Turno</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAbrirTurno} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="caja">Caja *</Label>
                    <Select value={formApertura.caja_id} onValueChange={(value) => setFormApertura(prev => ({ ...prev, caja_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar caja" />
                      </SelectTrigger>
                      <SelectContent>
                        {cajas.filter(c => c.activo).map(caja => (
                          <SelectItem key={caja.id} value={caja.id}>
                            {caja.codigo} - {caja.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usuario">Usuario Responsable *</Label>
                    <Select value={formApertura.usuario_id} onValueChange={(value) => setFormApertura(prev => ({ ...prev, usuario_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar usuario" />
                      </SelectTrigger>
                      <SelectContent>
                        {usuarios.map(usuario => (
                          <SelectItem key={usuario.id} value={usuario.id}>
                            {usuario.nombre_completo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="saldo_apertura">Saldo de Apertura</Label>
                    <Input
                      id="saldo_apertura"
                      type="number"
                      step="0.01"
                      value={formApertura.saldo_apertura}
                      onChange={(e) => setFormApertura(prev => ({ ...prev, saldo_apertura: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>

                  <Button type="submit" disabled={abrirTurnoLoading} className="w-full">
                    {abrirTurnoLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Abriendo...
                      </>
                    ) : (
                      'Abrir Turno'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Caja</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Saldo Apertura</TableHead>
                  <TableHead>Cobros</TableHead>
                  <TableHead>Pagos</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turnosAbiertos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No hay turnos abiertos actualmente.
                    </TableCell>
                  </TableRow>
                ) : (
                  turnosAbiertos.map(turno => (
                    <TableRow key={turno.id}>
                      <TableCell className="font-medium">{turno.numero_turno}</TableCell>
                      <TableCell>{cajas.find(c => c.id === turno.caja_id)?.codigo || '-'}</TableCell>
                      <TableCell>{usuarios.find(u => u.id === turno.usuario_id)?.nombre_completo || '-'}</TableCell>
                      <TableCell className="text-right font-mono">${turno.saldo_apertura.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">+${turno.total_cobros.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-red-600">-${turno.total_pagos.toFixed(2)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(turno.fecha_inicio), 'HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Dialog open={openCierre && selectedTurnoId === turno.id} onOpenChange={(open) => {
                          if (open) {
                            setSelectedTurnoId(turno.id);
                            setOpenCierre(true);
                          } else {
                            setOpenCierre(false);
                            setSelectedTurnoId(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Cerrar</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cerrar Turno</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCerrarTurno} className="space-y-4">
                              {error && (
                                <Alert variant="destructive">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription>{error}</AlertDescription>
                                </Alert>
                              )}

                              <div className="space-y-2">
                                <Label>Número de Turno</Label>
                                <p className="font-mono font-bold">{turno.numero_turno}</p>
                              </div>

                              <div className="space-y-2">
                                <Label>Saldo Apertura</Label>
                                <p className="font-mono">${turno.saldo_apertura.toFixed(2)}</p>
                              </div>

                              <div className="space-y-2">
                                <Label>Cobros</Label>
                                <p className="font-mono text-green-600">+${turno.total_cobros.toFixed(2)}</p>
                              </div>

                              <div className="space-y-2">
                                <Label>Pagos</Label>
                                <p className="font-mono text-red-600">-${turno.total_pagos.toFixed(2)}</p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="saldo_cierre">Saldo de Cierre *</Label>
                                <Input
                                  id="saldo_cierre"
                                  type="number"
                                  step="0.01"
                                  value={formCierre.saldo_cierre}
                                  onChange={(e) => setFormCierre(prev => ({ ...prev, saldo_cierre: e.target.value }))}
                                  placeholder="0.00"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="observaciones">Observaciones</Label>
                                <textarea
                                  id="observaciones"
                                  value={formCierre.observaciones}
                                  onChange={(e) => setFormCierre(prev => ({ ...prev, observaciones: e.target.value }))}
                                  placeholder="Observaciones del cierre"
                                  className="w-full px-3 py-2 border rounded-md"
                                  rows={3}
                                />
                              </div>

                              <Button type="submit" disabled={cerrarTurnoLoading} className="w-full">
                                {cerrarTurnoLoading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Cerrando...
                                  </>
                                ) : (
                                  'Cerrar Turno'
                                )}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Turnos Cerrados */}
      <Card>
        <CardHeader>
          <CardTitle>Turnos Cerrados</CardTitle>
          <CardDescription>Historial de turnos completados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Saldo Apertura</TableHead>
                  <TableHead>Saldo Cierre</TableHead>
                  <TableHead>Fecha Cierre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turnosCerrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No hay turnos cerrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  turnosCerrados.slice(0, 10).map(turno => (
                    <TableRow key={turno.id}>
                      <TableCell className="font-medium">{turno.numero_turno}</TableCell>
                      <TableCell>{usuarios.find(u => u.id === turno.usuario_id)?.nombre_completo || '-'}</TableCell>
                      <TableCell className="text-right font-mono">${turno.saldo_apertura.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">${turno.saldo_cierre?.toFixed(2) || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {turno.fecha_cierre ? format(new Date(turno.fecha_cierre), 'dd/MM/yyyy HH:mm', { locale: es }) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
