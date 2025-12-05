import React, { useState } from 'react';
import { useHosixFacturacion } from '@/hooks/useHosixFacturacion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface LineaFacturaForm {
  concepto_id: string;
  concepto_texto: string;
  cantidad: string;
  precio_unitario: string;
}

export default function FacturasGenerator() {
  const {
    cuentas,
    isLoadingCuentas,
    conceptos,
    isLoadingConceptos,
    crearFactura,
    isCreatingFactura,
  } = useHosixFacturacion();

  const [showForm, setShowForm] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [lineas, setLineas] = useState<LineaFacturaForm[]>([
    {
      concepto_id: '',
      concepto_texto: '',
      cantidad: '1',
      precio_unitario: '',
    },
  ]);

  const handleOpenForm = () => {
    setCuentaSeleccionada('');
    setFechaVencimiento('');
    setLineas([
      {
        concepto_id: '',
        concepto_texto: '',
        cantidad: '1',
        precio_unitario: '',
      },
    ]);
    setShowForm(true);
  };

  const handleAgregarLinea = () => {
    setLineas([
      ...lineas,
      {
        concepto_id: '',
        concepto_texto: '',
        cantidad: '1',
        precio_unitario: '',
      },
    ]);
  };

  const handleEliminarLinea = (index: number) => {
    setLineas(lineas.filter((_, i) => i !== index));
  };

  const handleActualizarLinea = (index: number, field: string, value: string) => {
    const nuevasLineas = [...lineas];
    if (field === 'concepto_id') {
      const concepto = conceptos.find((c) => c.id === value);
      nuevasLineas[index] = {
        ...nuevasLineas[index],
        concepto_id: value,
        concepto_texto: concepto?.descripcion || '',
        precio_unitario: concepto?.precio_base?.toString() || '',
      };
    } else {
      nuevasLineas[index] = {
        ...nuevasLineas[index],
        [field]: value,
      };
    }
    setLineas(nuevasLineas);
  };

  const handleSubmit = () => {
    if (!cuentaSeleccionada) {
      toast.error('Seleccione una cuenta de facturación');
      return;
    }

    if (lineas.length === 0) {
      toast.error('Agregue al menos una línea');
      return;
    }

    const lineasValidas = lineas.every(
      (linea) =>
        (linea.concepto_id || linea.concepto_texto) &&
        linea.cantidad &&
        linea.precio_unitario
    );

    if (!lineasValidas) {
      toast.error('Complete todos los campos de las líneas');
      return;
    }

    const facturaData = {
      cuenta_id: cuentaSeleccionada,
      fecha_vencimiento: fechaVencimiento || undefined,
      lineas: lineas.map((linea) => ({
        concepto_id: linea.concepto_id || undefined,
        concepto_texto: linea.concepto_texto || undefined,
        cantidad: parseFloat(linea.cantidad),
        precio_unitario: parseFloat(linea.precio_unitario),
      })),
    };

    crearFactura(facturaData, {
      onSuccess: () => {
        toast.success('Factura creada correctamente');
        setShowForm(false);
      },
      onError: (error: any) => {
        toast.error(`Error: ${error.message}`);
      },
    });
  };

  const calcularSubtotal = () => {
    return lineas.reduce(
      (sum, linea) =>
        sum +
        (parseFloat(linea.cantidad || '0') * parseFloat(linea.precio_unitario || '0')),
      0
    );
  };

  const subtotal = calcularSubtotal();
  const impuesto = subtotal * 0.15;
  const total = subtotal + impuesto;

  const cuentasAbiertas = cuentas.filter((c) => c.estado === 'abierta');

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Generar Facturas</h2>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Factura
        </Button>
      </div>

      {/* Info */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-600">
            Cuentas abiertas disponibles: <strong>{cuentasAbiertas.length}</strong>
          </p>
        </CardContent>
      </Card>

      {/* Dialog Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generar Nueva Factura</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Selección de Cuenta */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Cuenta de Facturación *
              </label>
              <Select
                value={cuentaSeleccionada}
                onValueChange={setCuentaSeleccionada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {cuentasAbiertas.map((cuenta) => (
                    <SelectItem key={cuenta.id} value={cuenta.id}>
                      {cuenta.numero_cuenta} - Saldo: ${cuenta.saldo_pendiente.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha de Vencimiento */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Fecha de Vencimiento (Opcional)
              </label>
              <Input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
              />
            </div>

            {/* Líneas de Factura */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium">
                  Líneas de Factura *
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAgregarLinea}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Línea
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-1/3">Concepto</TableHead>
                      <TableHead className="w-24">Cantidad</TableHead>
                      <TableHead className="w-32">Precio Unitario</TableHead>
                      <TableHead className="w-32">Subtotal</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineas.map((linea, index) => {
                      const subtotalLinea =
                        parseFloat(linea.cantidad || '0') *
                        parseFloat(linea.precio_unitario || '0');

                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={linea.concepto_id}
                              onValueChange={(value) =>
                                handleActualizarLinea(index, 'concepto_id', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {conceptos.map((concepto) => (
                                  <SelectItem
                                    key={concepto.id}
                                    value={concepto.id}
                                  >
                                    {concepto.descripcion}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!linea.concepto_id && (
                              <Input
                                placeholder="O descripción manual"
                                value={linea.concepto_texto}
                                onChange={(e) =>
                                  handleActualizarLinea(
                                    index,
                                    'concepto_texto',
                                    e.target.value
                                  )
                                }
                                className="mt-1"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={linea.cantidad}
                              onChange={(e) =>
                                handleActualizarLinea(
                                  index,
                                  'cantidad',
                                  e.target.value
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={linea.precio_unitario}
                              onChange={(e) =>
                                handleActualizarLinea(
                                  index,
                                  'precio_unitario',
                                  e.target.value
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            ${subtotalLinea.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminarLinea(index)}
                              className="text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Resumen de Totales */}
            <Card className="bg-gray-50">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impuesto (15% IVA):</span>
                    <span className="font-medium">${impuesto.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-green-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botones */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isCreatingFactura}
              >
                Generar Factura
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
