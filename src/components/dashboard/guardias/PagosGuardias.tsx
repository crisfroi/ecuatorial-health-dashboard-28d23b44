import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Download, Upload, Search, Plus, CheckCircle, Clock, AlertTriangle, XCircle, FileText } from 'lucide-react';
import { useNominas, usePagos, useCreatePago } from '@/hooks/useGuardSystem';
import { usePublicHospitals } from '@/hooks/useHospitals';
import { useToast } from '@/hooks/use-toast';
import { Pago } from '@/types/guardias';

interface PaymentFormData {
  profesionalGuardiaId: string;
  formaPago: 'transfer_trabajador' | 'transfer_hospital' | 'otro';
  monto: number;
  comprobanteUrl?: string;
  observacion?: string;
}

const PagosGuardias: React.FC = () => {
  const { toast } = useToast();
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<'all' | 'pendiente' | 'procesando' | 'pagado' | 'fallido'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedNomina, setSelectedNomina] = useState<string>('');
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
    profesionalGuardiaId: '',
    formaPago: 'transfer_trabajador',
    monto: 0
  });

  // Fetch data
  const { data: nominas = [] } = useNominas(selectedHospital ? { centroId: selectedHospital } : {});
  const { data: pagos = [], isLoading: loadingPagos } = usePagos(selectedNomina ? { nominaId: selectedNomina } : {});
  const { data: hospitales = [] } = usePublicHospitals();
  const createPago = useCreatePago();

  const selectedHospitalData = hospitales.find(h => h.id === selectedHospital);

  // Transform payments for display
  const paymentRecords = useMemo(() => {
    return pagos.map(pago => ({
      id: pago.id,
      profesionalId: pago.profesionalId,
      profesionalNombre: pago.profesional?.nombre || 'N/A',
      categoria: pago.profesional?.categoria || 'N/A',
      monto: pago.monto,
      formaPago: pago.formaPago,
      fecha: pago.fecha,
      estado: mapEstadoPago(pago.formaPago), // Map form of payment to status
      observaciones: pago.observacion,
      nominaId: pago.nominaId,
      mes: pago.nomina?.mes || 0,
      anio: pago.nomina?.anio || 0
    }));
  }, [pagos]);

  // Map forma_pago to display status
  function mapEstadoPago(formaPago: string): 'pendiente' | 'procesando' | 'pagado' | 'fallido' {
    switch (formaPago) {
      case 'transfer_trabajador':
      case 'transfer_hospital':
        return 'pagado';
      case 'otro':
        return 'pendiente';
      default:
        return 'pendiente';
    }
  }

  // Filter payments
  const filteredPayments = useMemo(() => {
    let filtered = paymentRecords;

    if (filterEstado !== 'all') {
      filtered = filtered.filter(p => p.estado === filterEstado);
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.profesionalNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [paymentRecords, filterEstado, searchTerm]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = paymentRecords.length;
    const pendientes = paymentRecords.filter(p => p.estado === 'pendiente').length;
    const procesando = paymentRecords.filter(p => p.estado === 'procesando').length;
    const pagados = paymentRecords.filter(p => p.estado === 'pagado').length;
    const fallidos = paymentRecords.filter(p => p.estado === 'fallido').length;

    const totalMonto = paymentRecords.reduce((sum, p) => sum + p.monto, 0);
    const montoPagado = paymentRecords
      .filter(p => p.estado === 'pagado')
      .reduce((sum, p) => sum + p.monto, 0);
    
    const progresoPago = total > 0 ? (pagados / total) * 100 : 0;

    return {
      total,
      pendientes,
      procesando,
      pagados,
      fallidos,
      totalMonto,
      montoPagado,
      progresoPago
    };
  }, [paymentRecords]);

  const handleCreatePayment = async () => {
    if (!selectedNomina || !paymentFormData.profesionalGuardiaId) {
      toast({
        title: "Error",
        description: "Selecciona una nómina y un profesional",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPago.mutateAsync({
        nominaId: selectedNomina,
        profesionalGuardiaId: paymentFormData.profesionalGuardiaId,
        formaPago: paymentFormData.formaPago,
        monto: paymentFormData.monto,
        fecha: new Date(),
        comprobanteUrl: paymentFormData.comprobanteUrl,
        observacion: paymentFormData.observacion
      });

      toast({
        title: "Pago creado",
        description: "El registro de pago se ha creado exitosamente",
      });

      setShowCreateDialog(false);
      setPaymentFormData({
        profesionalGuardiaId: '',
        formaPago: 'transfer_trabajador',
        monto: 0
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el registro de pago",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      pendiente: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      procesando: { variant: 'default' as const, icon: Upload, color: 'text-blue-600' },
      pagado: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      fallido: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' }
    };

    const config = variants[estado as keyof typeof variants] || variants.pendiente;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className={`h-3 w-3 ${config.color}`} />
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Gestión de Pagos
          </h2>
          <p className="text-gray-600">
            Control y seguimiento de pagos de guardias médicas
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Pago
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Pago</DialogTitle>
                <DialogDescription>
                  Crear un nuevo registro de pago para un profesional
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nómina</Label>
                  <Select value={selectedNomina} onValueChange={setSelectedNomina}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar nómina" />
                    </SelectTrigger>
                    <SelectContent>
                      {nominas.map(nomina => (
                        <SelectItem key={nomina.id} value={nomina.id}>
                          {nomina.centro?.nombre} - {nomina.mes}/{nomina.anio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Forma de Pago</Label>
                  <Select 
                    value={paymentFormData.formaPago} 
                    onValueChange={(value) => setPaymentFormData(prev => ({ 
                      ...prev, 
                      formaPago: value as 'transfer_trabajador' | 'transfer_hospital' | 'otro' 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer_trabajador">Transferencia al Trabajador</SelectItem>
                      <SelectItem value="transfer_hospital">Transferencia vía Hospital</SelectItem>
                      <SelectItem value="otro">Otro Método</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    value={paymentFormData.monto}
                    onChange={(e) => setPaymentFormData(prev => ({ 
                      ...prev, 
                      monto: parseFloat(e.target.value) || 0 
                    }))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>URL del Comprobante (opcional)</Label>
                  <Input
                    value={paymentFormData.comprobanteUrl || ''}
                    onChange={(e) => setPaymentFormData(prev => ({ 
                      ...prev, 
                      comprobanteUrl: e.target.value 
                    }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observaciones (opcional)</Label>
                  <Textarea
                    value={paymentFormData.observacion || ''}
                    onChange={(e) => setPaymentFormData(prev => ({ 
                      ...prev, 
                      observacion: e.target.value 
                    }))}
                    placeholder="Notas adicionales..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreatePayment} disabled={createPago.isPending}>
                    {createPago.isPending ? 'Creando...' : 'Crear Pago'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Hospital</Label>
          <Select value={selectedHospital} onValueChange={setSelectedHospital}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los hospitales" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los hospitales</SelectItem>
              {hospitales.map(hospital => (
                <SelectItem key={hospital.id} value={hospital.id}>
                  {hospital.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Estado de Pago</Label>
          <Select value={filterEstado} onValueChange={(value) => setFilterEstado(value as typeof filterEstado)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="procesando">En Proceso</SelectItem>
              <SelectItem value="pagado">Pagados</SelectItem>
              <SelectItem value="fallido">Fallidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Buscar</Label>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Buscar por profesional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pagos</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monto Total</p>
                <p className="text-2xl font-bold">{formatCurrency(statistics.totalMonto)}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pagados</p>
                <p className="text-2xl font-bold text-green-600">{statistics.pagados}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.pendientes}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso de Pagos</CardTitle>
          <CardDescription>
            {selectedHospitalData ? `${selectedHospitalData.nombre}` : 'Todos los hospitales'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Progreso total</span>
              <span>{statistics.progresoPago.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${statistics.progresoPago}%` }}
              />
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-orange-600">{statistics.pendientes}</div>
                <div className="text-gray-500">Pendientes</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-blue-600">{statistics.procesando}</div>
                <div className="text-gray-500">Procesando</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">{statistics.pagados}</div>
                <div className="text-gray-500">Pagados</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-600">{statistics.fallidos}</div>
                <div className="text-gray-500">Fallidos</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Pagos</CardTitle>
          <CardDescription>
            {filteredPayments.length} de {paymentRecords.length} pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profesional</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Forma de Pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPagos ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      {paymentRecords.length === 0 ? 'No hay registros de pagos' : 'No se encontraron pagos con los filtros aplicados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell className="font-medium">{pago.profesionalNombre}</TableCell>
                      <TableCell>{pago.categoria}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(pago.monto)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {pago.formaPago.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>{getEstadoBadge(pago.estado)}</TableCell>
                      <TableCell>
                        {pago.fecha ? pago.fecha.toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{pago.mes}/{pago.anio}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
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
};

export default PagosGuardias;
