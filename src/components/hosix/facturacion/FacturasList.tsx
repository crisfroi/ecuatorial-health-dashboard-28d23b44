import React, { useState } from 'react';
import { useHosixFacturacion } from '@/hooks/useHosixFacturacion';
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
import { FileText, Eye, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function FacturasList() {
  const {
    facturas,
    isLoadingFacturas,
    filtros,
    setFiltros,
    cambiarEstadoFactura,
    isChangingFacturaStatus,
    registrarPago,
    isRegisteringPago,
    obtenerLineasFactura,
  } = useHosixFacturacion();

  const [showDetalles, setShowDetalles] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<any>(null);
  const [lineasFactura, setLineasFactura] = useState<any[]>([]);
  const [isLoadingLineas, setIsLoadingLineas] = useState(false);

  const [showPago, setShowPago] = useState(false);
  const [montoPago, setMontoPago] = useState('');
  const [formaPago, setFormaPago] = useState('');

  const handleVerDetalles = async (factura: any) => {
    setFacturaSeleccionada(factura);
    setIsLoadingLineas(true);
    try {
      const lineas = await obtenerLineasFactura(factura.id);
      setLineasFactura(lineas);
    } catch (error) {
      toast.error('Error al cargar líneas');
    } finally {
      setIsLoadingLineas(false);
    }
    setShowDetalles(true);
  };

  const handleCambiarEstado = (id: string, nuevoEstado: string) => {
    cambiarEstadoFactura(
      { id, estado: nuevoEstado },
      {
        onSuccess: () => {
          toast.success(`Factura ${nuevoEstado}`);
        },
        onError: (error: any) => {
          toast.error(`Error: ${error.message}`);
        },
      }
    );
  };

  const handleRechazar = () => {
    if (facturaSeleccionada) {
      const motivo = prompt('Ingrese el motivo del rechazo:');
      if (motivo) {
        cambiarEstadoFactura(
          {
            id: facturaSeleccionada.id,
            estado: 'rechazada',
            concepto_rechazo: motivo,
          },
          {
            onSuccess: () => {
              toast.success('Factura rechazada');
              setShowDetalles(false);
            },
            onError: (error: any) => {
              toast.error(`Error: ${error.message}`);
            },
          }
        );
      }
    }
  };

  const handleRegistrarPago = () => {
    if (!montoPago || !formaPago) {
      toast.error('Complete monto y forma de pago');
      return;
    }

    registrarPago(
      {
        factura_id: facturaSeleccionada.id,
        monto: parseFloat(montoPago),
        forma_pago: formaPago,
      },
      {
        onSuccess: () => {
          toast.success('Pago registrado');
          setShowPago(false);
          setMontoPago('');
          setFormaPago('');
        },
        onError: (error: any) => {
          toast.error(`Error: ${error.message}`);
        },
      }
    );
  };

  const filteredFacturas = facturas.filter((factura) => {
    if (filtros.estado && factura.estado !== filtros.estado) return false;
    if (filtros.busqueda) {
      const search = filtros.busqueda.toLowerCase();
      return factura.numero_factura.toLowerCase().includes(search);
    }
    return true;
  });

  const getEstadoBadge = (estado: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      emitida: 'default',
      pagada: 'default',
      parcialmente_pagada: 'outline',
      rechazada: 'destructive',
    };
    return variants[estado] || 'secondary';
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold">Facturas</h2>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por número de factura..."
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
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="emitida">Emitida</SelectItem>
                <SelectItem value="pagada">Pagada</SelectItem>
                <SelectItem value="parcialmente_pagada">
                  Parcialmente Pagada
                </SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
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

      {/* Tabla de facturas */}
      <Card>
        <CardContent>
          {isLoadingFacturas ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Cargando facturas...</p>
            </div>
          ) : filteredFacturas.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay facturas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>N° Factura</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Impuesto</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFacturas.map((factura) => (
                    <TableRow key={factura.id}>
                      <TableCell className="font-mono font-medium">
                        {factura.numero_factura}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(factura.fecha_emision).toLocaleDateString(
                          'es-ES'
                        )}
                      </TableCell>
                      <TableCell>${factura.subtotal.toFixed(2)}</TableCell>
                      <TableCell>${factura.impuesto.toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        ${factura.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadge(factura.estado)}>
                          {factura.estado.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerDetalles(factura)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog - Detalles de Factura */}
      <Dialog open={showDetalles} onOpenChange={setShowDetalles}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Factura: {facturaSeleccionada?.numero_factura}
            </DialogTitle>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha Emisión</p>
                  <p className="font-medium">
                    {new Date(
                      facturaSeleccionada.fecha_emision
                    ).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <p>
                    <Badge
                      variant={getEstadoBadge(facturaSeleccionada.estado)}
                    >
                      {facturaSeleccionada.estado}
                    </Badge>
                  </p>
                </div>
                {facturaSeleccionada.fecha_vencimiento && (
                  <div>
                    <p className="text-sm text-gray-600">Fecha Vencimiento</p>
                    <p className="font-medium">
                      {new Date(
                        facturaSeleccionada.fecha_vencimiento
                      ).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                )}
              </div>

              {/* Líneas de Factura */}
              <div>
                <h3 className="font-semibold mb-3">Líneas</h3>
                {isLoadingLineas ? (
                  <p className="text-gray-500">Cargando...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="w-20">Cantidad</TableHead>
                        <TableHead className="w-32">Precio Unit.</TableHead>
                        <TableHead className="w-32">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineasFactura.map((linea) => (
                        <TableRow key={linea.id}>
                          <TableCell>
                            {linea.concepto_texto ||
                              linea.concepto_id ||
                              'Sin concepto'}
                          </TableCell>
                          <TableCell>{linea.cantidad}</TableCell>
                          <TableCell>
                            ${linea.precio_unitario.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-medium">
                            ${linea.subtotal.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Totales */}
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${facturaSeleccionada.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impuesto (15%):</span>
                      <span>${facturaSeleccionada.impuesto.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-green-600">
                        ${facturaSeleccionada.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {facturaSeleccionada.concepto_rechazo && (
                <div className="bg-red-50 border border-red-200 rounded p-3 flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Motivo Rechazo</p>
                    <p className="text-sm text-red-700">
                      {facturaSeleccionada.concepto_rechazo}
                    </p>
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2 justify-end">
                {facturaSeleccionada.estado === 'emitida' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowPago(true)}
                      className="gap-2"
                    >
                      <DollarSign className="h-4 w-4" />
                      Registrar Pago
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRechazar}
                    >
                      Rechazar
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowDetalles(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog - Registrar Pago */}
      <Dialog open={showPago} onOpenChange={setShowPago}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Factura</p>
                <p className="font-medium">{facturaSeleccionada.numero_factura}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Total a Pagar</p>
                <p className="text-lg font-bold text-green-600">
                  ${facturaSeleccionada.total.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Monto a Pagar *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Forma de Pago *
                </label>
                <Select
                  value={formaPago}
                  onValueChange={setFormaPago}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar forma de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta_credito">Tarjeta de Crédito</SelectItem>
                    <SelectItem value="tarjeta_debito">Tarjeta de Débito</SelectItem>
                    <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowPago(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRegistrarPago}
                  disabled={isRegisteringPago}
                >
                  Registrar Pago
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
