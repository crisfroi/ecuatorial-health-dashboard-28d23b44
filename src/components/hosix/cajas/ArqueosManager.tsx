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
import { Loader2, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function ArqueosManager() {
  const { cajas, arqueos, crearArqueo, actualizarArqueo, crearArqueoLoading, error, setError, calcularTotalArqueo } = useHosixCajas();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    caja_id: '',
    billetes_100: '0',
    billetes_50: '0',
    billetes_20: '0',
    billetes_10: '0',
    billetes_5: '0',
    billetes_1: '0',
    monedas_1: '0',
    monedas_otros: '0',
    cheques_cantidad: '0',
    cheques_monto: '0',
    tarjetas_cantidad: '0',
    tarjetas_monto: '0',
    saldo_esperado: '0',
    observaciones: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.caja_id) {
      setError('Debe seleccionar una caja');
      return;
    }

    const totalEfectivo = 
      parseFloat(formData.billetes_100) * 100 +
      parseFloat(formData.billetes_50) * 50 +
      parseFloat(formData.billetes_20) * 20 +
      parseFloat(formData.billetes_10) * 10 +
      parseFloat(formData.billetes_5) * 5 +
      parseFloat(formData.billetes_1) * 1 +
      parseFloat(formData.monedas_1) +
      parseFloat(formData.monedas_otros);

    const totalArqueo = totalEfectivo + parseFloat(formData.cheques_monto) + parseFloat(formData.tarjetas_monto);
    const saldoEsperado = parseFloat(formData.saldo_esperado);
    const diferencia = totalArqueo - saldoEsperado;

    crearArqueo({
      caja_id: formData.caja_id,
      fecha_arqueo: new Date().toISOString(),
      usuario_responsable_id: '',
      billetes_100: parseFloat(formData.billetes_100),
      billetes_50: parseFloat(formData.billetes_50),
      billetes_20: parseFloat(formData.billetes_20),
      billetes_10: parseFloat(formData.billetes_10),
      billetes_5: parseFloat(formData.billetes_5),
      billetes_1: parseFloat(formData.billetes_1),
      monedas_1: parseFloat(formData.monedas_1),
      monedas_otros: parseFloat(formData.monedas_otros),
      total_efectivo: totalEfectivo,
      cheques_cantidad: parseInt(formData.cheques_cantidad),
      cheques_monto: parseFloat(formData.cheques_monto),
      tarjetas_cantidad: parseInt(formData.tarjetas_cantidad),
      tarjetas_monto: parseFloat(formData.tarjetas_monto),
      total_arqueo: totalArqueo,
      saldo_esperado: saldoEsperado,
      diferencia: diferencia,
      observaciones: formData.observaciones,
      aprobado_por: '',
      estado: 'borrador',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      id: ''
    });

    setFormData({
      caja_id: '',
      billetes_100: '0',
      billetes_50: '0',
      billetes_20: '0',
      billetes_10: '0',
      billetes_5: '0',
      billetes_1: '0',
      monedas_1: '0',
      monedas_otros: '0',
      cheques_cantidad: '0',
      cheques_monto: '0',
      tarjetas_cantidad: '0',
      tarjetas_monto: '0',
      saldo_esperado: '0',
      observaciones: '',
    });
    setOpen(false);
  };

  // Cálculo en tiempo real para preview
  const totalEfectivoPreview = 
    parseFloat(formData.billetes_100 || 0) * 100 +
    parseFloat(formData.billetes_50 || 0) * 50 +
    parseFloat(formData.billetes_20 || 0) * 20 +
    parseFloat(formData.billetes_10 || 0) * 10 +
    parseFloat(formData.billetes_5 || 0) * 5 +
    parseFloat(formData.billetes_1 || 0) * 1 +
    parseFloat(formData.monedas_1 || 0) +
    parseFloat(formData.monedas_otros || 0);

  const totalArqueoPreview = totalEfectivoPreview + 
    parseFloat(formData.cheques_monto || 0) + 
    parseFloat(formData.tarjetas_monto || 0);

  const diferenciasPreview = totalArqueoPreview - parseFloat(formData.saldo_esperado || 0);

  const arqueosRecientes = arqueos.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Crear Arqueo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Realizar Arqueo de Caja</CardTitle>
              <CardDescription>Conteo físico de efectivo y documentos</CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>+ Nuevo Arqueo</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Realizar Arqueo de Caja</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Seleccionar Caja */}
                  <div className="space-y-2">
                    <Label htmlFor="caja">Caja *</Label>
                    <Select value={formData.caja_id} onValueChange={(value) => setFormData(prev => ({ ...prev, caja_id: value }))}>
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

                  {/* Efectivo */}
                  <div>
                    <h4 className="font-semibold mb-3">Efectivo</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Billetes de $100', name: 'billetes_100', value: 100 },
                        { label: 'Billetes de $50', name: 'billetes_50', value: 50 },
                        { label: 'Billetes de $20', name: 'billetes_20', value: 20 },
                        { label: 'Billetes de $10', name: 'billetes_10', value: 10 },
                        { label: 'Billetes de $5', name: 'billetes_5', value: 5 },
                        { label: 'Billetes de $1', name: 'billetes_1', value: 1 },
                      ].map((bill) => (
                        <div key={bill.name} className="space-y-1">
                          <Label className="text-xs">{bill.label}</Label>
                          <div className="flex items-end gap-2">
                            <Input
                              type="number"
                              step="1"
                              value={formData[bill.name as keyof typeof formData] || 0}
                              onChange={(e) => setFormData(prev => ({ ...prev, [bill.name]: e.target.value }))}
                              className="flex-1"
                              placeholder="0"
                            />
                            <span className="text-xs text-muted-foreground">=</span>
                            <span className="text-sm font-mono min-w-16 text-right">
                              ${(parseFloat(formData[bill.name as keyof typeof formData] || 0) * bill.value).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Monedas de $1</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.monedas_1}
                          onChange={(e) => setFormData(prev => ({ ...prev, monedas_1: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Otras Monedas</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.monedas_otros}
                          onChange={(e) => setFormData(prev => ({ ...prev, monedas_otros: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Documentos */}
                  <div>
                    <h4 className="font-semibold mb-3">Documentos</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cantidad de Cheques</Label>
                        <Input
                          type="number"
                          step="1"
                          value={formData.cheques_cantidad}
                          onChange={(e) => setFormData(prev => ({ ...prev, cheques_cantidad: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Monto en Cheques</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.cheques_monto}
                          onChange={(e) => setFormData(prev => ({ ...prev, cheques_monto: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cantidad de Tarjetas</Label>
                        <Input
                          type="number"
                          step="1"
                          value={formData.tarjetas_cantidad}
                          onChange={(e) => setFormData(prev => ({ ...prev, tarjetas_cantidad: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Monto en Tarjetas</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.tarjetas_monto}
                          onChange={(e) => setFormData(prev => ({ ...prev, tarjetas_monto: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Saldo Esperado */}
                  <div className="space-y-2">
                    <Label htmlFor="saldo_esperado">Saldo Esperado</Label>
                    <Input
                      id="saldo_esperado"
                      type="number"
                      step="0.01"
                      value={formData.saldo_esperado}
                      onChange={(e) => setFormData(prev => ({ ...prev, saldo_esperado: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Preview de Totales */}
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Efectivo:</span>
                      <span className="font-mono font-bold">${totalEfectivoPreview.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Cheques:</span>
                      <span className="font-mono">${parseFloat(formData.cheques_monto || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Tarjetas:</span>
                      <span className="font-mono">${parseFloat(formData.tarjetas_monto || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-blue-200 pt-2 flex justify-between font-bold">
                      <span>Total Arqueo:</span>
                      <span className="font-mono">${totalArqueoPreview.toFixed(2)}</span>
                    </div>
                    <div className={`text-right font-bold ${diferenciasPreview === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      Diferencia: ${diferenciasPreview.toFixed(2)}
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                      placeholder="Observaciones del arqueo"
                      className="w-full px-3 py-2 border rounded-md"
                      rows={2}
                    />
                  </div>

                  <Button type="submit" disabled={crearArqueoLoading} className="w-full">
                    {crearArqueoLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creando Arqueo...
                      </>
                    ) : (
                      'Crear Arqueo'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Histórico de Arqueos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Arqueos</CardTitle>
          <CardDescription>Arqueos realizados recientemente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Caja</TableHead>
                  <TableHead className="text-right">Efectivo</TableHead>
                  <TableHead className="text-right">Cheques</TableHead>
                  <TableHead className="text-right">Tarjetas</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arqueosRecientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No hay arqueos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  arqueosRecientes.map(arqueo => {
                    const caja = cajas.find(c => c.id === arqueo.caja_id);
                    return (
                      <TableRow key={arqueo.id}>
                        <TableCell>{caja?.codigo || '-'}</TableCell>
                        <TableCell className="text-right font-mono">${arqueo.total_efectivo.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">${arqueo.cheques_monto.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">${arqueo.tarjetas_monto.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono font-bold">${arqueo.total_arqueo.toFixed(2)}</TableCell>
                        <TableCell className={`text-right font-mono font-bold ${
                          Math.abs(arqueo.diferencia) < 0.01 ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          ${arqueo.diferencia.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            arqueo.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                            arqueo.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {arqueo.estado.charAt(0).toUpperCase() + arqueo.estado.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(arqueo.fecha_arqueo), 'dd/MM/yyyy HH:mm', { locale: es })}
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
