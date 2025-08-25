import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useGuardiasStore } from "@/stores/useGuardiasStore";
import { 
  CreditCard, 
  Download, 
  FileText, 
  DollarSign, 
  TrendingUp,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Plus,
  Search,
  Filter
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PagosGuardiasProps {
  selectedMonth: number;
  selectedYear: number;
  selectedCenter: string | null;
  userRole: string;
}

export const PagosGuardias: React.FC<PagosGuardiasProps> = ({
  selectedMonth,
  selectedYear,
  selectedCenter,
  userRole
}) => {
  const { toast } = useToast();
  const {
    pagos,
    nominas,
    profesionales,
    profesionalesGuardias,
    loading,
    fetchPagos,
    fetchNominas,
    fetchProfesionalesGuardias,
    createPago,
    updatePago,
    aprobarPago,
    rechazarPago,
    exportPagos,
    procesarPagoMasivo
  } = useGuardiasStore();

  const [selectedTab, setSelectedTab] = useState('pendientes');
  const [selectedPago, setSelectedPago] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroMetodo, setFiltroMetodo] = useState<string>('todos');
  const [selectedPagos, setSelectedPagos] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    nomina_id: '',
    profesional_guardia_id: '',
    profesional_id: '',
    importe: 0,
    monto: 0,
    forma_pago: 'transfer_trabajador' as string,
    metodo_pago: 'transfer_trabajador' as string,
    comprobante_url: '',
    referencia_pago: '',
    observaciones: ''
  });

  useEffect(() => {
    fetchPagos(selectedMonth, selectedYear, selectedCenter);
    fetchNominas(selectedMonth, selectedYear, selectedCenter);
    fetchProfesionalesGuardias(selectedCenter);
  }, [selectedMonth, selectedYear, selectedCenter]);

  const pagosPendientes = pagos.filter(p => p.estado === 'pendiente');
  const pagosRealizados = pagos.filter(p => p.estado === 'realizado');
  const pagosConfirmados = pagos.filter(p => p.estado === 'confirmado');
  // Note: 'rechazado' is not in DB constraints, but keeping for backwards compatibility
  const pagosRechazados = pagos.filter(p => p.estado === 'rechazado');

  const pagosFiltrados = pagos.filter(pago => {
    const matchesSearch = pago.profesional?.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pago.comprobante_url?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filtroEstado === 'todos' || pago.estado === filtroEstado;
    const matchesMetodo = filtroMetodo === 'todos' || pago.forma_pago === filtroMetodo;
    
    return matchesSearch && matchesEstado && matchesMetodo;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedPago) {
        await updatePago(selectedPago.id, formData);
        toast({
          title: "Pago actualizado",
          description: "El pago ha sido actualizado correctamente.",
        });
      } else {
        await createPago(formData);
        toast({
          title: "Pago registrado",
          description: "El nuevo pago ha sido registrado correctamente.",
        });
      }
      
      setIsCreateDialogOpen(false);
      setSelectedPago(null);
      resetForm();
      fetchPagos(selectedMonth, selectedYear, selectedCenter);
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al procesar la solicitud.",
        variant: "destructive",
      });
    }
  };

  const handleAprobar = async (pagoId: string) => {
    try {
      await aprobarPago(pagoId);
      toast({
        title: "Pago aprobado",
        description: "El pago ha sido aprobado correctamente.",
      });
      fetchPagos(selectedMonth, selectedYear, selectedCenter);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aprobar el pago.",
        variant: "destructive",
      });
    }
  };

  const handleRechazar = async (pagoId: string) => {
    try {
      await rechazarPago(pagoId);
      toast({
        title: "Pago rechazado",
        description: "El pago ha sido rechazado.",
      });
      fetchPagos(selectedMonth, selectedYear, selectedCenter);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo rechazar el pago.",
        variant: "destructive",
      });
    }
  };

  const handlePagoMasivo = async () => {
    if (selectedPagos.length === 0) {
      toast({
        title: "Selección requerida",
        description: "Debe seleccionar al menos un pago para procesar.",
        variant: "destructive",
      });
      return;
    }

    try {
      await procesarPagoMasivo(selectedPagos);
      toast({
        title: "Pagos confirmados",
        description: `Se han confirmado ${selectedPagos.length} pagos exitosamente.`,
      });
      setSelectedPagos([]);
      fetchPagos(selectedMonth, selectedYear, selectedCenter);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron confirmar los pagos masivos.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (pago: any) => {
    setSelectedPago(pago);
    setFormData({
      nomina_id: pago.nomina_id || '',
      profesional_guardia_id: pago.profesional_guardia_id || '',
      profesional_id: pago.profesional_guardia_id || '', // Use profesional_guardia_id as primary
      importe: pago.importe || 0,
      monto: pago.monto || pago.importe || 0,
      forma_pago: pago.forma_pago || 'transfer_trabajador',
      metodo_pago: pago.metodo_pago || pago.forma_pago || 'transfer_trabajador',
      comprobante_url: pago.comprobante_url || '',
      referencia_pago: pago.referencia_pago || '',
      observaciones: pago.observaciones || ''
    });
    setIsCreateDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nomina_id: '',
      profesional_guardia_id: '',
      profesional_id: '',
      importe: 0,
      monto: 0,
      forma_pago: 'transfer_trabajador',
      metodo_pago: 'transfer_trabajador',
      comprobante_url: '',
      referencia_pago: '',
      observaciones: ''
    });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'realizado':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Realizado</Badge>;
      case 'confirmado':
        return <Badge className="bg-green-100 text-green-800"><CreditCard className="w-3 h-3 mr-1" />Confirmado</Badge>;
      // Backwards compatibility
      case 'aprobado':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>;
      case 'procesado':
        return <Badge className="bg-green-100 text-green-800"><CreditCard className="w-3 h-3 mr-1" />Procesado</Badge>;
      case 'rechazado':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge variant="secondary">{estado || 'Sin estado'}</Badge>;
    }
  };

  const getMetodoPagoBadge = (metodo: string) => {
    switch (metodo) {
      case 'transfer_trabajador':
        return <Badge variant="outline">Transferencia al Trabajador</Badge>;
      case 'transfer_hospital':
        return <Badge variant="outline">Transferencia al Hospital</Badge>;
      case 'efectivo':
        return <Badge variant="outline">Efectivo</Badge>;
      case 'cheque':
        return <Badge variant="outline">Cheque</Badge>;
      // Backwards compatibility for old values
      case 'TRANSFERENCIA':
        return <Badge variant="outline">Transferencia</Badge>;
      case 'CHEQUE':
        return <Badge variant="outline">Cheque</Badge>;
      case 'EFECTIVO':
        return <Badge variant="outline">Efectivo</Badge>;
      default:
        return <Badge variant="outline">{metodo}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'XAF'
    }).format(amount);
  };

  const canCreatePagos = ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole);
  const canApprovePagos = ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole);
  const canProcessPagos = ['SUPER_ADMINISTRADOR'].includes(userRole);

  const togglePagoSelection = (pagoId: string) => {
    setSelectedPagos(prev => 
      prev.includes(pagoId) 
        ? prev.filter(id => id !== pagoId)
        : [...prev, pagoId]
    );
  };

  const renderPagoCard = (pago: any) => (
    <Card key={pago.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={selectedPagos.includes(pago.id)}
              onChange={() => togglePagoSelection(pago.id)}
              className="mt-1 rounded border-gray-300"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h3 className="font-semibold text-lg">
                  {pago.profesional?.nombre_completo}
                </h3>
                {getEstadoBadge(pago.estado)}
                {getMetodoPagoBadge(pago.metodo_pago)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatCurrency(pago.importe)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Comprobante: {pago.comprobante_url ? 'Disponible' : 'Sin comprobante'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{pago.created_at ? new Date(pago.created_at).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
                </div>
              </div>

              {pago.observaciones && (
                <div className="mb-4">
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {pago.observaciones}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedPago(pago);
                setIsDetailDialogOpen(true);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            
            {canCreatePagos && pago.estado === 'PENDIENTE' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(pago)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            
            {canApprovePagos && pago.estado === 'PENDIENTE' && (
              <Button
                size="sm"
                onClick={() => handleAprobar(pago.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
            
            {canApprovePagos && ['PENDIENTE', 'APROBADO'].includes(pago.estado) && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRechazar(pago.id)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h2>
          <p className="text-gray-600">
            Administración de pagos de guardias médicas para {selectedMonth}/{selectedYear}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedPagos.length > 0 && canProcessPagos && (
            <Button
              onClick={handlePagoMasivo}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Confirmar {selectedPagos.length} Pagos
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => exportPagos(selectedMonth, selectedYear, selectedCenter)}
          >
            <Download className="w-4 h-4 mr-1" />
            Exportar
          </Button>

          {canCreatePagos && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setSelectedPago(null); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Pago
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedPago ? 'Editar Pago' : 'Registrar Nuevo Pago'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nómina</label>
                      <Select
                        value={formData.nomina_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, nomina_id: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar nómina" />
                        </SelectTrigger>
                        <SelectContent>
                          {nominas.map((nomina) => (
                            <SelectItem key={nomina.id} value={nomina.id}>
                              Nómina {nomina.mes}/{nomina.ano} - {formatCurrency(nomina.total)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Profesional</label>
                      <Select
                        value={formData.profesional_guardia_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, profesional_guardia_id: value, profesional_id: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar profesional" />
                        </SelectTrigger>
                        <SelectContent>
                          {profesionalesGuardias.map((prof) => (
                            <SelectItem key={prof.id} value={prof.id}>
                              {prof.nombre_completo} - {prof.categoria} ({prof.unidad_servicio})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Monto</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.monto}
                        onChange={(e) => setFormData(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Método de Pago</label>
                      <Select
                        value={formData.metodo_pago}
                        onValueChange={(value: 'transfer_trabajador' | 'transfer_hospital' | 'efectivo' | 'cheque') =>
                          setFormData(prev => ({ ...prev, metodo_pago: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transfer_trabajador">Transferencia al Trabajador</SelectItem>
                          <SelectItem value="transfer_hospital">Transferencia al Hospital</SelectItem>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Referencia de Pago</label>
                    <Input
                      value={formData.referencia_pago}
                      onChange={(e) => setFormData(prev => ({ ...prev, referencia_pago: e.target.value }))}
                      placeholder="Número de referencia, cheque, etc."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Observaciones</label>
                    <Textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                      placeholder="Observaciones adicionales..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {selectedPago ? 'Actualizar' : 'Registrar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Estadísticas de pagos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{pagosPendientes.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Realizados</p>
                <p className="text-2xl font-bold text-blue-600">{pagosRealizados.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmados</p>
                <p className="text-2xl font-bold text-green-600">{pagosConfirmados.length}</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Monto</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(pagos.reduce((sum, p) => sum + (p.importe || 0), 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar profesional o referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="realizado">Realizados</SelectItem>
                <SelectItem value="confirmado">Confirmados</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filtroMetodo} onValueChange={setFiltroMetodo}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los métodos</SelectItem>
                <SelectItem value="transfer_trabajador">Transferencia al Trabajador</SelectItem>
                <SelectItem value="transfer_hospital">Transferencia al Hospital</SelectItem>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="pendientes" className="relative">
            Pendientes
            {pagosPendientes.length > 0 && (
              <Badge className="ml-2 bg-yellow-500 text-white">
                {pagosPendientes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="realizados">Realizados</TabsTrigger>
          <TabsTrigger value="confirmados">Confirmados</TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando pagos...</p>
            </div>
          ) : pagosPendientes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay pagos pendientes
                </h3>
                <p className="text-gray-600">
                  Todos los pagos han sido confirmados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pagosPendientes.map(renderPagoCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="realizados" className="space-y-4">
          {pagosRealizados.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay pagos realizados
                </h3>
                <p className="text-gray-600">
                  Los pagos realizados aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pagosRealizados.map(renderPagoCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="confirmados" className="space-y-4">
          {pagosConfirmados.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay pagos confirmados
                </h3>
                <p className="text-gray-600">
                  Los pagos confirmados aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pagosConfirmados.map(renderPagoCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="todos" className="space-y-4">
          {pagosFiltrados.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No se encontraron pagos
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filtroEstado !== 'todos' || filtroMetodo !== 'todos' 
                    ? 'No hay resultados que coincidan con los filtros aplicados.' 
                    : 'No hay pagos registrados para este período.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pagosFiltrados.map(renderPagoCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de detalle */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalle del Pago
            </DialogTitle>
          </DialogHeader>
          
          {selectedPago && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Profesional</h4>
                  <p className="text-sm">{selectedPago.profesional?.nombre_completo}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Estado</h4>
                  {getEstadoBadge(selectedPago.estado)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Monto</h4>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(selectedPago.monto)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">M��todo</h4>
                  {getMetodoPagoBadge(selectedPago.metodo_pago)}
                </div>
              </div>

              {selectedPago.referencia_pago && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Referencia</h4>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedPago.referencia_pago}</p>
                </div>
              )}

              {selectedPago.observaciones && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Observaciones</h4>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedPago.observaciones}</p>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-2 border-t">
                <p>Creado: {new Date(selectedPago.fecha_creacion).toLocaleString('es-ES')}</p>
                {selectedPago.fecha_aprobacion && (
                  <p>Aprobado: {new Date(selectedPago.fecha_aprobacion).toLocaleString('es-ES')}</p>
                )}
                {selectedPago.fecha_procesamiento && (
                  <p>Procesado: {new Date(selectedPago.fecha_procesamiento).toLocaleString('es-ES')}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
