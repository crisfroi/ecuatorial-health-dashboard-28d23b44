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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function MovimientosCajaForm() {
  const { turnos, formasPago, movimientos, registrarMovimiento, registrarMovimientoLoading, error, setError } = useHosixCajas();
  const [selectedTurno, setSelectedTurno] = useState<string>('');
  const [formData, setFormData] = useState({
    tipo_movimiento: 'cobro',
    forma_pago_id: '',
    monto: '',
    referencia_pago: '',
    observaciones: '',
  });

  const turnosAbiertos = turnos.filter(t => t.estado === 'abierto');
  const turnoSeleccionado = turnosAbiertos.find(t => t.id === selectedTurno);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTurno) {
      setError('Debe seleccionar un turno abierto');
      return;
    }

    if (!formData.forma_pago_id || !formData.monto) {
      setError('Forma de pago y monto son requeridos');
      return;
    }

    const monto = parseFloat(formData.monto);
    if (monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    registrarMovimiento({
      numero_movimiento: `MOV-${Date.now()}`,
      factura_id: null,
      turno_id: selectedTurno,
      tipo_movimiento: formData.tipo_movimiento,
      forma_pago_id: formData.forma_pago_id,
      referencia_pago: formData.referencia_pago || '',
      caja_id: turnoSeleccionado?.caja_id || '',
      usuario_responsable_id: turnoSeleccionado?.usuario_id || '',
      monto: monto,
      observaciones: formData.observaciones || '',
      fecha_movimiento: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

    setFormData({
      tipo_movimiento: 'cobro',
      forma_pago_id: '',
      monto: '',
      referencia_pago: '',
      observaciones: '',
    });
  };

  const movimientosDelTurno = selectedTurno 
    ? movimientos.filter(m => m.turno_id === selectedTurno)
    : [];

  const totalCobros = movimientosDelTurno
    .filter(m => m.tipo_movimiento === 'cobro')
    .reduce((sum, m) => sum + m.monto, 0);

  const totalPagos = movimientosDelTurno
    .filter(m => m.tipo_movimiento === 'pago')
    .reduce((sum, m) => sum + m.monto, 0);

  const formasPagoAtivas = formasPago.filter(f => f.activo);

  return (
    <div className="space-y-6">
      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar Movimiento de Caja</CardTitle>
          <CardDescription>Registre cobros, pagos y otras transacciones</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="turno">Turno Abierto *</Label>
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

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Movimiento *</Label>
                <Select value={formData.tipo_movimiento} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_movimiento: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cobro">Cobro</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="devolucion">Devolución</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="forma_pago">Forma de Pago *</Label>
                <Select value={formData.forma_pago_id} onValueChange={(value) => setFormData(prev => ({ ...prev, forma_pago_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar forma de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {formasPagoAtivas.map(forma => (
                      <SelectItem key={forma.id} value={forma.id}>
                        {forma.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monto">Monto *</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  value={formData.monto}
                  onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referencia">Referencia (si aplica)</Label>
              <Input
                id="referencia"
                value={formData.referencia_pago}
                onChange={(e) => setFormData(prev => ({ ...prev, referencia_pago: e.target.value }))}
                placeholder="ej. Número de cheque, referencia de transferencia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Observaciones adicionales"
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
              />
            </div>

            <Button type="submit" disabled={registrarMovimientoLoading || !selectedTurno} className="w-full">
              {registrarMovimientoLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar Movimiento'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Resumen del Turno */}
      {turnoSeleccionado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen del Turno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Saldo Apertura</p>
                <p className="text-2xl font-bold">${turnoSeleccionado.saldo_apertura.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Cobros</p>
                <p className="text-2xl font-bold text-green-600">+${totalCobros.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Pagos</p>
                <p className="text-2xl font-bold text-red-600">-${totalPagos.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Saldo Teórico</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${(turnoSeleccionado.saldo_apertura + totalCobros - totalPagos).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Movimientos del Turno */}
      {selectedTurno && (
        <Card>
          <CardHeader>
            <CardTitle>Movimientos del Turno</CardTitle>
            <CardDescription>Todas las transacciones registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Forma de Pago</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientosDelTurno.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay movimientos registrados en este turno.
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimientosDelTurno.map(movimiento => {
                      const forma = formasPago.find(f => f.id === movimiento.forma_pago_id);
                      return (
                        <TableRow key={movimiento.id}>
                          <TableCell className="font-mono text-sm">{movimiento.numero_movimiento}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              movimiento.tipo_movimiento === 'cobro' ? 'bg-green-100 text-green-800' :
                              movimiento.tipo_movimiento === 'pago' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {movimiento.tipo_movimiento === 'cobro' ? 'Cobro' : 
                               movimiento.tipo_movimiento === 'pago' ? 'Pago' : 'Devolución'}
                            </span>
                          </TableCell>
                          <TableCell>{forma?.nombre || '-'}</TableCell>
                          <TableCell className="text-sm">{movimiento.referencia_pago || '-'}</TableCell>
                          <TableCell className={`text-right font-mono font-bold ${
                            movimiento.tipo_movimiento === 'cobro' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {movimiento.tipo_movimiento === 'cobro' ? '+' : '-'}${movimiento.monto.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(movimiento.fecha_movimiento), 'HH:mm', { locale: es })}
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
      )}
    </div>
  );
}
