import { useState } from 'react';
import { useHosixCajas } from '@/hooks/useHosixCajas';
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
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function CierresCajaManager() {
  const { cajas, turnos, cierres, crearCierre, actualizarCierre, crearCierreLoading, error, setError, calcularSaldoTeorico, calcularDiferencia } = useHosixCajas();
  const [open, setOpen] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<string>('');
  const [formData, setFormData] = useState({
    saldo_real: '',
    observaciones: '',
  });

  const turnoSeleccionado = turnos.find(t => t.id === selectedTurno);
  const turnosAbiertos = turnos.filter(t => t.estado === 'abierto');

  const handleCreateCierre = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTurno) {
      setError('Debe seleccionar un turno');
      return;
    }

    if (!turnoSeleccionado) {
      setError('Turno no encontrado');
      return;
    }

    const saldoReal = parseFloat(formData.saldo_real);
    if (isNaN(saldoReal)) {
      setError('El saldo real debe ser un número válido');
      return;
    }

    const saldoTeorico = calcularSaldoTeorico(
      turnoSeleccionado.saldo_apertura,
      turnoSeleccionado.total_cobros,
      turnoSeleccionado.total_pagos
    );

    const diferencia = calcularDiferencia(saldoReal, saldoTeorico);

    const caja = cajas.find(c => c.id === turnoSeleccionado.caja_id);

    crearCierre({
      caja_id: turnoSeleccionado.caja_id,
      turno_id: selectedTurno,
      fecha_cierre: new Date().toISOString(),
      usuario_responsable_id: turnoSeleccionado.usuario_id,
      saldo_apertura: turnoSeleccionado.saldo_apertura,
      total_cobros: turnoSeleccionado.total_cobros,
      total_pagos: turnoSeleccionado.total_pagos,
      saldo_teorico: saldoTeorico,
      saldo_real: saldoReal,
      diferencia: diferencia,
      estado: Math.abs(diferencia) < 0.01 ? 'cuadrado' : 'descuadre_reportado',
      observaciones: formData.observaciones || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      id: ''
    });

    setSelectedTurno('');
    setFormData({
      saldo_real: '',
      observaciones: '',
    });
    setOpen(false);
  };

  const cierresRecientes = cierres.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Crear Cierre */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Crear Cierre de Caja</CardTitle>
              <CardDescription>Realizar cierre de turno diario</CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>+ Crear Cierre</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Crear Cierre de Turno</DialogTitle>
                </DialogHeader>
                
                {turnoSeleccionado ? (
                  <form onSubmit={handleCreateCierre} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Resumen del Turno */}
                    <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                      <h4 className="font-semibold">Resumen del Turno</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Turno</p>
                          <p className="font-mono font-bold">{turnoSeleccionado.numero_turno}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Saldo Apertura</p>
                          <p className="font-mono">${turnoSeleccionado.saldo_apertura.toFixed(2)}</p>
                        </div>
                        <div className="text-green-600">
                          <p className="text-muted-foreground">Cobros</p>
                          <p className="font-mono font-bold">+${turnoSeleccionado.total_cobros.toFixed(2)}</p>
                        </div>
                        <div className="text-red-600">
                          <p className="text-muted-foreground">Pagos</p>
                          <p className="font-mono font-bold">-${turnoSeleccionado.total_pagos.toFixed(2)}</p>
                        </div>
                        <div className="col-span-2 border-t pt-3">
                          <p className="text-muted-foreground">Saldo Teórico</p>
                          <p className="text-lg font-bold font-mono">
                            ${(turnoSeleccionado.saldo_apertura + turnoSeleccionado.total_cobros - turnoSeleccionado.total_pagos).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Saldo Real */}
                    <div className="space-y-2">
                      <Label htmlFor="saldo_real">Saldo Real (contado) *</Label>
                      <Input
                        id="saldo_real"
                        type="number"
                        step="0.01"
                        value={formData.saldo_real}
                        onChange={(e) => setFormData(prev => ({ ...prev, saldo_real: e.target.value }))}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    {/* Diferencia */}
                    {formData.saldo_real && (
                      <div className={`p-3 rounded-lg ${
                        Math.abs(parseFloat(formData.saldo_real) - (turnoSeleccionado.saldo_apertura + turnoSeleccionado.total_cobros - turnoSeleccionado.total_pagos)) < 0.01
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-orange-50 border border-orange-200'
                      }`}>
                        <p className="text-sm text-muted-foreground">Diferencia</p>
                        <p className={`text-lg font-bold font-mono ${
                          Math.abs(parseFloat(formData.saldo_real) - (turnoSeleccionado.saldo_apertura + turnoSeleccionado.total_cobros - turnoSeleccionado.total_pagos)) < 0.01
                            ? 'text-green-600'
                            : 'text-orange-600'
                        }`}>
                          ${(parseFloat(formData.saldo_real) - (turnoSeleccionado.saldo_apertura + turnoSeleccionado.total_cobros - turnoSeleccionado.total_pagos)).toFixed(2)}
                        </p>
                      </div>
                    )}

                    {/* Observaciones */}
                    <div className="space-y-2">
                      <Label htmlFor="observaciones">Observaciones</Label>
                      <textarea
                        id="observaciones"
                        value={formData.observaciones}
                        onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                        placeholder="Observaciones del cierre"
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                      />
                    </div>

                    <Button type="submit" disabled={crearCierreLoading} className="w-full">
                      {crearCierreLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creando Cierre...
                        </>
                      ) : (
                        'Crear Cierre'
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="turno">Seleccione un Turno Abierto *</Label>
                      <Select value={selectedTurno} onValueChange={setSelectedTurno}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar turno" />
                        </SelectTrigger>
                        <SelectContent>
                          {turnosAbiertos.length === 0 ? (
                            <div className="px-2 py-1 text-sm text-muted-foreground">
                              No hay turnos abiertos
                            </div>
                          ) : (
                            turnosAbiertos.map(turno => (
                              <SelectItem key={turno.id} value={turno.id}>
                                {turno.numero_turno}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Histórico de Cierres */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Cierres</CardTitle>
          <CardDescription>Cierres de caja realizados recientemente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turno</TableHead>
                  <TableHead>Caja</TableHead>
                  <TableHead>Saldo Teórico</TableHead>
                  <TableHead>Saldo Real</TableHead>
                  <TableHead>Diferencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Cierre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cierresRecientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No hay cierres registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  cierresRecientes.map(cierre => {
                    const turno = turnos.find(t => t.id === cierre.turno_id);
                    const caja = cajas.find(c => c.id === cierre.caja_id);
                    const esCuadrado = Math.abs(cierre.diferencia) < 0.01;
                    
                    return (
                      <TableRow key={cierre.id}>
                        <TableCell className="font-mono text-sm">{turno?.numero_turno || '-'}</TableCell>
                        <TableCell>{caja?.codigo || '-'}</TableCell>
                        <TableCell className="text-right font-mono">${cierre.saldo_teorico.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">${cierre.saldo_real.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className={`flex items-center justify-end font-bold font-mono ${
                            esCuadrado ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {esCuadrado ? (
                              <TrendingUp className="h-4 w-4 mr-1" />
                            ) : (
                              <TrendingDown className="h-4 w-4 mr-1" />
                            )}
                            ${cierre.diferencia.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            esCuadrado ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {esCuadrado ? 'Cuadrado' : 'Descuadre'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(cierre.fecha_cierre), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
