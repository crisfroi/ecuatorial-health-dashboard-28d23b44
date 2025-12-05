import { useState } from 'react';
import { useHosixRecobros } from '@/hooks/useHosixRecobros';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotasCargoCredito() {
  const {
    notasCargo,
    notasCredito,
    notasCargoLoading,
    notasCreditoLoading,
    crearNotaCargo,
    crearNotaCredito,
    aprobarNotaCargo,
    aprobarNotaCredito,
    crearNotaCargoLoading,
    crearNotaCreditoLoading,
    error,
    setError
  } = useHosixRecobros();

  const [openCargo, setOpenCargo] = useState(false);
  const [openCredito, setOpenCredito] = useState(false);
  const [formCargo, setFormCargo] = useState({
    numero_factura: '',
    concepto: '',
    descripcion: '',
    monto: '',
    razon: 'error_datos',
  });
  const [formCredito, setFormCredito] = useState({
    numero_factura: '',
    concepto: '',
    descripcion: '',
    monto: '',
    razon: 'devolucion',
  });

  const handleCrearCargo = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formCargo.numero_factura || !formCargo.monto) {
      setError('Factura y monto son requeridos');
      return;
    }

    crearNotaCargo({
      numero_nota: `NC-${Date.now()}`,
      recobro_id: null,
      factura_id: formCargo.numero_factura,
      concepto: formCargo.concepto,
      descripcion: formCargo.descripcion,
      monto: parseFloat(formCargo.monto),
      razon_cargo: formCargo.razon,
      documentos_adjuntos: [],
      estado: 'emitida',
      fecha_emision: new Date().toISOString(),
      fecha_aprovacion: null,
      aprobado_por: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      id: ''
    });

    setFormCargo({ numero_factura: '', concepto: '', descripcion: '', monto: '', razon: 'error_datos' });
    setOpenCargo(false);
  };

  const handleCrearCredito = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formCredito.numero_factura || !formCredito.monto) {
      setError('Factura y monto son requeridos');
      return;
    }

    crearNotaCredito({
      numero_nota: `NCA-${Date.now()}`,
      factura_id: formCredito.numero_factura,
      concepto: formCredito.concepto,
      descripcion: formCredito.descripcion,
      monto: parseFloat(formCredito.monto),
      razon_credito: formCredito.razon,
      documentos_adjuntos: [],
      estado: 'emitida',
      fecha_emision: new Date().toISOString(),
      fecha_aprovacion: null,
      aprobado_por: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      id: ''
    });

    setFormCredito({ numero_factura: '', concepto: '', descripcion: '', monto: '', razon: 'devolucion' });
    setOpenCredito(false);
  };

  return (
    <Tabs defaultValue="cargo" className="space-y-6">
      <TabsList>
        <TabsTrigger value="cargo">Notas de Cargo</TabsTrigger>
        <TabsTrigger value="credito">Notas de Crédito</TabsTrigger>
      </TabsList>

      {/* NOTAS DE CARGO */}
      <TabsContent value="cargo">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Notas de Cargo</CardTitle>
                <CardDescription>Cargos adicionales a facturas</CardDescription>
              </div>
              <Dialog open={openCargo} onOpenChange={setOpenCargo}>
                <DialogTrigger asChild>
                  <Button>+ Nueva Nota de Cargo</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nota de Cargo</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCrearCargo} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label>Factura *</Label>
                      <Input
                        value={formCargo.numero_factura}
                        onChange={(e) => setFormCargo(prev => ({ ...prev, numero_factura: e.target.value }))}
                        placeholder="Número de factura"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Concepto</Label>
                      <Input
                        value={formCargo.concepto}
                        onChange={(e) => setFormCargo(prev => ({ ...prev, concepto: e.target.value }))}
                        placeholder="Concepto del cargo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <textarea
                        value={formCargo.descripcion}
                        onChange={(e) => setFormCargo(prev => ({ ...prev, descripcion: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Monto *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formCargo.monto}
                        onChange={(e) => setFormCargo(prev => ({ ...prev, monto: e.target.value }))}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Razón del Cargo</Label>
                      <Select value={formCargo.razon} onValueChange={(value) => setFormCargo(prev => ({ ...prev, razon: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="error_datos">Error en Datos</SelectItem>
                          <SelectItem value="servicio_adicional">Servicio Adicional</SelectItem>
                          <SelectItem value="interes_mora">Interés por Mora</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" disabled={crearNotaCargoLoading} className="w-full">
                      {crearNotaCargoLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        'Crear Nota'
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
                    <TableHead>Factura</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notasCargoLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : notasCargo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No hay notas de cargo creadas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    notasCargo.map(nota => (
                      <TableRow key={nota.id}>
                        <TableCell className="font-mono text-sm">{nota.numero_nota}</TableCell>
                        <TableCell className="font-mono text-sm">{nota.factura_id}</TableCell>
                        <TableCell className="text-sm">{nota.concepto}</TableCell>
                        <TableCell className="text-right font-mono text-red-600">+${nota.monto.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            nota.estado === 'aprobada' ? 'bg-green-100 text-green-800' :
                            nota.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {nota.estado.charAt(0).toUpperCase() + nota.estado.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(nota.fecha_emision), 'dd/MM/yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>
                          {nota.estado === 'emitida' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => aprobarNotaCargo({ id: nota.id, aprobado_por: '' })}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* NOTAS DE CRÉDITO */}
      <TabsContent value="credito">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Notas de Crédito</CardTitle>
                <CardDescription>Devoluciones y ajustes de facturas</CardDescription>
              </div>
              <Dialog open={openCredito} onOpenChange={setOpenCredito}>
                <DialogTrigger asChild>
                  <Button>+ Nueva Nota de Crédito</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nota de Crédito</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCrearCredito} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label>Factura *</Label>
                      <Input
                        value={formCredito.numero_factura}
                        onChange={(e) => setFormCredito(prev => ({ ...prev, numero_factura: e.target.value }))}
                        placeholder="Número de factura"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Concepto</Label>
                      <Input
                        value={formCredito.concepto}
                        onChange={(e) => setFormCredito(prev => ({ ...prev, concepto: e.target.value }))}
                        placeholder="Concepto del crédito"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <textarea
                        value={formCredito.descripcion}
                        onChange={(e) => setFormCredito(prev => ({ ...prev, descripcion: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Monto *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formCredito.monto}
                        onChange={(e) => setFormCredito(prev => ({ ...prev, monto: e.target.value }))}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Razón del Crédito</Label>
                      <Select value={formCredito.razon} onValueChange={(value) => setFormCredito(prev => ({ ...prev, razon: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="devolucion">Devolución</SelectItem>
                          <SelectItem value="descuento">Descuento</SelectItem>
                          <SelectItem value="ajuste">Ajuste</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" disabled={crearNotaCreditoLoading} className="w-full">
                      {crearNotaCreditoLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        'Crear Nota'
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
                    <TableHead>Factura</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notasCreditoLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : notasCredito.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No hay notas de crédito creadas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    notasCredito.map(nota => (
                      <TableRow key={nota.id}>
                        <TableCell className="font-mono text-sm">{nota.numero_nota}</TableCell>
                        <TableCell className="font-mono text-sm">{nota.factura_id}</TableCell>
                        <TableCell className="text-sm">{nota.concepto}</TableCell>
                        <TableCell className="text-right font-mono text-green-600">-${nota.monto.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            nota.estado === 'aprobada' ? 'bg-green-100 text-green-800' :
                            nota.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {nota.estado.charAt(0).toUpperCase() + nota.estado.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(nota.fecha_emision), 'dd/MM/yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>
                          {nota.estado === 'emitida' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => aprobarNotaCredito({ id: nota.id, aprobado_por: '' })}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
