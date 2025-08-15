import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  CreditCard, 
  Receipt, 
  Upload, 
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  Building,
  User,
  Calendar,
  Filter,
  Search,
  Eye
} from 'lucide-react';
import { useNominas } from '@/hooks/useGuardSystem';
import { useGuardiasStore } from '@/stores/useGuardiasStore';
import { usePublicHospitals } from '@/hooks/useRealProfesionales';
import { 
  Nomina,
  Pago,
  FormaPago 
} from '@/types/guardias';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface PaymentRecord {
  id: string;
  profesionalId: string;
  profesionalNombre: string;
  categoria: string;
  monto: number;
  formaPago: FormaPago;
  fecha?: Date;
  comprobante?: string;
  estado: 'pendiente' | 'procesando' | 'pagado' | 'fallido';
  observaciones?: string;
  nominaId: string;
  mes: number;
  anio: number;
}

const FORMAS_PAGO: { value: FormaPago; label: string; icon: any }[] = [
  { value: 'transfer_trabajador', label: 'Transferencia a Trabajador', icon: CreditCard },
  { value: 'transfer_hospital', label: 'Transferencia Hospital', icon: Building },
  { value: 'otro', label: 'Otro Método', icon: Receipt }
];

const ESTADOS_PAGO = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  { value: 'procesando', label: 'Procesando', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  { value: 'pagado', label: 'Pagado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'fallido', label: 'Fallido', color: 'bg-red-100 text-red-800', icon: XCircle }
];

const PagosGuardias: React.FC = () => {
  const { selectedHospital } = useGuardiasStore();
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedAnio, setSelectedAnio] = useState(new Date().getFullYear());
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    formaPago: '' as FormaPago,
    fecha: '',
    observacion: '',
    comprobante: null as File | null
  });

  const { data: nominas = [], isLoading, error: nominasError } = useNominas({
    centroId: selectedHospital,
    mes: selectedMes,
    anio: selectedAnio
  });

  // Show warning if database tables don't exist yet
  React.useEffect(() => {
    if (nominasError) {
      console.warn('Nominas error in PagosGuardias:', nominasError);
    }
  }, [nominasError]);

  const { data: hospitales = [] } = usePublicHospitals();
  const selectedHospitalData = hospitales.find(h => h.id === selectedHospital);

  // Mock payment records (in real implementation, fetch from Supabase)
  const mockPaymentRecords: PaymentRecord[] = useMemo(() => {
    if (nominas.length === 0) return [];

    const records: PaymentRecord[] = [];
    nominas.forEach(nomina => {
      // Simulate payment records for each professional in the payroll
      const professionals = [
        { id: '1', nombre: 'Dr. García López', categoria: 'Especialista', monto: 150000 },
        { id: '2', nombre: 'Dra. María Santos', categoria: 'General', monto: 120000 },
        { id: '3', nombre: 'Enfermero José Mbomio', categoria: 'Técnico', monto: 80000 },
        { id: '4', nombre: 'Aux. Carmen Nguema', categoria: 'Auxiliar', monto: 60000 },
      ];

      professionals.forEach((prof, index) => {
        const estados = ['pendiente', 'procesando', 'pagado', 'fallido'];
        const estado = estados[index % estados.length] as 'pendiente' | 'procesando' | 'pagado' | 'fallido';
        
        records.push({
          id: `${nomina.id}-${prof.id}`,
          profesionalId: prof.id,
          profesionalNombre: prof.nombre,
          categoria: prof.categoria,
          monto: prof.monto,
          formaPago: 'transfer_trabajador',
          fecha: estado === 'pagado' ? new Date() : undefined,
          estado,
          observaciones: estado === 'fallido' ? 'Error en datos bancarios' : undefined,
          nominaId: nomina.id,
          mes: nomina.mes,
          anio: nomina.anio
        });
      });
    });

    return records;
  }, [nominas]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    let filtered = mockPaymentRecords;

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
  }, [mockPaymentRecords, filterEstado, searchTerm]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = mockPaymentRecords.length;
    const pendientes = mockPaymentRecords.filter(p => p.estado === 'pendiente').length;
    const procesando = mockPaymentRecords.filter(p => p.estado === 'procesando').length;
    const pagados = mockPaymentRecords.filter(p => p.estado === 'pagado').length;
    const fallidos = mockPaymentRecords.filter(p => p.estado === 'fallido').length;

    const totalMonto = mockPaymentRecords.reduce((sum, p) => sum + p.monto, 0);
    const montoPagado = mockPaymentRecords
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
  }, [mockPaymentRecords]);

  const handleProcessPayment = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setPaymentForm({
      formaPago: payment.formaPago,
      fecha: payment.fecha ? format(payment.fecha, 'yyyy-MM-dd') : '',
      observacion: payment.observaciones || '',
      comprobante: null
    });
    setShowPaymentDialog(true);
  };

  const handleSavePayment = async () => {
    if (!selectedPayment) return;

    setIsUploading(true);
    try {
      // Here you would update the payment in Supabase
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Pago actualizado exitosamente');
      setShowPaymentDialog(false);
      setSelectedPayment(null);
    } catch (error: any) {
      toast.error('Error al actualizar el pago');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadReceipt = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('El archivo no puede exceder 5MB');
        return;
      }
      setPaymentForm(prev => ({ ...prev, comprobante: file }));
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estadoInfo = ESTADOS_PAGO.find(e => e.value === estado);
    if (!estadoInfo) return null;

    const Icon = estadoInfo.icon;
    return (
      <Badge variant="outline" className={estadoInfo.color}>
        <Icon className="w-3 h-3 mr-1" />
        {estadoInfo.label}
      </Badge>
    );
  };

  const getFormaPagoLabel = (forma: FormaPago) => {
    const formaInfo = FORMAS_PAGO.find(f => f.value === forma);
    return formaInfo?.label || forma;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-guinea-teal mx-auto"></div>
          <p className="mt-2">Cargando información de pagos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pagos de Guardias</h2>
          <p className="text-gray-600">
            Seguimiento y gestión de pagos por guardias médicas
          </p>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label>Hospital</Label>
              <Select value={selectedHospital} disabled>
                <SelectTrigger>
                  <SelectValue placeholder="No seleccionado" />
                </SelectTrigger>
              </Select>
            </div>
            
            <div>
              <Label>Mes</Label>
              <Select value={selectedMes.toString()} onValueChange={(value) => setSelectedMes(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {format(new Date(2024, i), 'MMMM', { locale: es })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Año</Label>
              <Input
                type="number"
                value={selectedAnio}
                onChange={(e) => setSelectedAnio(parseInt(e.target.value))}
                min="2024"
                max="2030"
              />
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-guinea-teal" />
              <span className="text-sm">
                {filteredPayments.length} pagos
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total a Pagar</p>
                <p className="text-2xl font-bold text-guinea-teal">
                  {statistics.totalMonto.toLocaleString('es-ES')} XAF
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-guinea-teal" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pagado</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.montoPagado.toLocaleString('es-ES')} XAF
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.pendientes}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progreso</p>
                <p className="text-2xl font-bold text-blue-600">
                  {statistics.progresoPago.toFixed(1)}%
                </p>
              </div>
              <div className="w-full mt-2">
                <Progress value={statistics.progresoPago} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por profesional o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por estado..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {ESTADOS_PAGO.map(estado => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status Distribution */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ESTADOS_PAGO.map(estado => {
          const count = statistics[estado.value as keyof typeof statistics] as number;
          const Icon = estado.icon;
          return (
            <Card key={estado.value}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${estado.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{estado.label}</p>
                    <p className="text-xl font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay pagos para mostrar</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Forma de Pago</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{payment.profesionalNombre}</div>
                          {payment.observaciones && (
                            <div className="text-xs text-gray-500 mt-1">
                              {payment.observaciones}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.categoria}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {payment.monto.toLocaleString('es-ES')} XAF
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(payment.estado)}
                      </TableCell>
                      <TableCell>
                        {getFormaPagoLabel(payment.formaPago)}
                      </TableCell>
                      <TableCell>
                        {payment.fecha 
                          ? format(payment.fecha, 'dd/MM/yyyy', { locale: es })
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessPayment(payment)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          {payment.estado !== 'pagado' && (
                            <Button
                              size="sm"
                              onClick={() => handleProcessPayment(payment)}
                              className="bg-guinea-teal hover:bg-guinea-dark-teal"
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              Procesar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Processing Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded">
                <h3 className="font-medium">{selectedPayment.profesionalNombre}</h3>
                <p className="text-sm text-gray-600">
                  {selectedPayment.categoria} • {selectedPayment.monto.toLocaleString('es-ES')} XAF
                </p>
              </div>

              <div className="space-y-2">
                <Label>Forma de Pago</Label>
                <Select 
                  value={paymentForm.formaPago} 
                  onValueChange={(value) => setPaymentForm(prev => ({ ...prev, formaPago: value as FormaPago }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar forma de pago..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGO.map((forma) => {
                      const Icon = forma.icon;
                      return (
                        <SelectItem key={forma.value} value={forma.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {forma.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha de Pago</Label>
                <Input
                  type="date"
                  value={paymentForm.fecha}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, fecha: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Comprobante de Pago</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleUploadReceipt}
                />
                {paymentForm.comprobante && (
                  <p className="text-xs text-green-600">
                    Archivo seleccionado: {paymentForm.comprobante.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={paymentForm.observacion}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, observacion: e.target.value }))}
                  placeholder="Observaciones sobre el pago..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPaymentDialog(false)}
                  disabled={isUploading}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSavePayment}
                  disabled={isUploading}
                  className="bg-guinea-teal hover:bg-guinea-dark-teal"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Guardando...' : 'Guardar Pago'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PagosGuardias;
