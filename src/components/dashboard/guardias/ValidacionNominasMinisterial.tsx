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
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Building, 
  DollarSign,
  AlertTriangle,
  Download,
  Eye,
  MessageSquare,
  Filter,
  Search
} from 'lucide-react';
import { useNominas } from '@/hooks/useGuardSystem';
import { usePublicHospitals } from '@/hooks/useRealProfesionales';
import { useAuth } from '@/contexts/AuthContext';
import { Nomina } from '@/types/guardias';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
];

const ESTADOS_NOMINA = [
  { value: 'pendiente', label: 'Pendiente Revisión', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  { value: 'enviada_seaf', label: 'Enviada a SEAF', color: 'bg-blue-100 text-blue-800', icon: FileText },
  { value: 'aprobada', label: 'Aprobada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'pagada', label: 'Pagada', color: 'bg-purple-100 text-purple-800', icon: DollarSign }
];

const ValidacionNominasMinisterial: React.FC = () => {
  const { user } = useAuth();
  const [selectedNomina, setSelectedNomina] = useState<Nomina | null>(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterHospital, setFilterHospital] = useState<string>('all');
  const [filterMes, setFilterMes] = useState<number>(new Date().getMonth() + 1);
  const [filterAnio, setFilterAnio] = useState<number>(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');

  const [validationForm, setValidationForm] = useState({
    accion: '' as 'aprobar' | 'rechazar' | 'enviar_seaf',
    observaciones: '',
    requiereAjustes: false
  });

  // Check if user has ministerial permissions
  const isMinisterialUser = user?.role === 'PERSONALIDAD_MINISTERIAL' || user?.role === 'SUPER_ADMINISTRADOR';

  const { data: hospitales = [] } = usePublicHospitals();
  const { data: nominas = [], isLoading } = useNominas({
    centroId: filterHospital === 'all' ? undefined : filterHospital,
    mes: filterMes,
    anio: filterAnio
  });

  // Filter payrolls based on search and filters
  const filteredNominas = useMemo(() => {
    let filtered = nominas;

    if (filterEstado !== 'all') {
      filtered = filtered.filter(n => n.estado === filterEstado);
    }

    if (searchTerm) {
      filtered = filtered.filter(n => {
        const hospitalName = hospitales.find(h => h.id === n.hospitalId)?.nombre?.toLowerCase() || '';
        return hospitalName.includes(searchTerm.toLowerCase());
      });
    }

    return filtered.sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());
  }, [nominas, filterEstado, searchTerm, hospitales]);

  // Calculate statistics
  const estadisticas = useMemo(() => {
    const total = filteredNominas.length;
    const pendientes = filteredNominas.filter(n => n.estado === 'pendiente').length;
    const enviadasSeaf = filteredNominas.filter(n => n.estado === 'enviada_seaf').length;
    const aprobadas = filteredNominas.filter(n => n.estado === 'aprobada').length;
    const pagadas = filteredNominas.filter(n => n.estado === 'pagada').length;

    const montoTotal = filteredNominas.reduce((sum, n) => sum + n.totalGeneral, 0);
    const montoAprobado = filteredNominas
      .filter(n => n.estado === 'aprobada' || n.estado === 'pagada')
      .reduce((sum, n) => sum + n.totalGeneral, 0);

    return {
      total,
      pendientes,
      enviadasSeaf,
      aprobadas,
      pagadas,
      montoTotal,
      montoAprobado
    };
  }, [filteredNominas]);

  const handleValidatePayroll = (nomina: Nomina) => {
    setSelectedNomina(nomina);
    setValidationForm({
      accion: nomina.estado === 'pendiente' ? 'aprobar' : 'enviar_seaf',
      observaciones: '',
      requiereAjustes: false
    });
    setShowValidationDialog(true);
  };

  const handleSaveValidation = async () => {
    if (!selectedNomina || !validationForm.accion) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    try {
      // Here you would call the mutation to update nomina status
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let mensaje = '';
      switch (validationForm.accion) {
        case 'aprobar':
          mensaje = 'Nómina aprobada exitosamente';
          break;
        case 'rechazar':
          mensaje = 'Nómina rechazada';
          break;
        case 'enviar_seaf':
          mensaje = 'Nómina enviada a SEAF';
          break;
      }
      
      toast.success(mensaje);
      setShowValidationDialog(false);
      setSelectedNomina(null);
    } catch (error: any) {
      toast.error('Error al procesar la validación');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estadoInfo = ESTADOS_NOMINA.find(e => e.value === estado);
    if (!estadoInfo) return null;

    const Icon = estadoInfo.icon;
    return (
      <Badge variant="outline" className={estadoInfo.color}>
        <Icon className="w-3 h-3 mr-1" />
        {estadoInfo.label}
      </Badge>
    );
  };

  const getHospitalName = (hospitalId: string) => {
    return hospitales.find(h => h.id === hospitalId)?.nombre || 'Hospital no identificado';
  };

  // Access control
  if (!isMinisterialUser) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
            <p className="text-gray-600 mb-4">
              Solo las personalidades ministeriales pueden acceder a la validación de nóminas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Validación de Nóminas - Ministerio</h2>
          <p className="text-gray-600">
            Revisión y aprobación de nóminas de guardias médicas de hospitales públicos
          </p>
        </div>

        <Badge variant="outline" className="bg-purple-100 text-purple-800">
          Vista Ministerial
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <Label>Hospital</Label>
              <Select value={filterHospital} onValueChange={setFilterHospital}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Hospitales</SelectItem>
                  {hospitales.map(hospital => (
                    <SelectItem key={hospital.id} value={hospital.id}>
                      {hospital.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mes</Label>
              <Select value={filterMes.toString()} onValueChange={(value) => setFilterMes(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map(mes => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Año</Label>
              <Input
                type="number"
                value={filterAnio}
                onChange={(e) => setFilterAnio(parseInt(e.target.value))}
                min="2024"
                max="2030"
              />
            </div>

            <div>
              <Label>Estado</Label>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  {ESTADOS_NOMINA.map(estado => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar hospital..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Nóminas</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes Revisión</p>
                <p className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.aprobadas}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monto Total</p>
                <p className="text-2xl font-bold text-guinea-teal">
                  {estadisticas.montoTotal.toLocaleString('es-ES')} XAF
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-guinea-teal" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll List */}
      <Card>
        <CardHeader>
          <CardTitle>Nóminas para Validación</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-guinea-teal mx-auto"></div>
              <p className="mt-2">Cargando nóminas...</p>
            </div>
          ) : filteredNominas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay nóminas para mostrar con los filtros aplicados</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Monto Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNominas.map((nomina) => (
                    <TableRow key={nomina.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">
                            {getHospitalName(nomina.hospitalId)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {MESES.find(m => m.value === nomina.mes)?.label} {nomina.anio}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {nomina.totalGeneral.toLocaleString('es-ES')} XAF
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(nomina.estado)}
                      </TableCell>
                      <TableCell>
                        {format(nomina.fechaCreacion, 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // View details functionality
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          
                          {nomina.estado === 'pendiente' && (
                            <Button
                              size="sm"
                              onClick={() => handleValidatePayroll(nomina)}
                              className="bg-guinea-teal hover:bg-guinea-dark-teal"
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Validar
                            </Button>
                          )}

                          {nomina.archivoXlsx && (
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-1" />
                              Excel
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

      {/* Validation Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Validar Nómina</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedNomina && (
              <div className="p-3 bg-gray-50 rounded">
                <h3 className="font-medium">{getHospitalName(selectedNomina.hospitalId)}</h3>
                <p className="text-sm text-gray-600">
                  {MESES.find(m => m.value === selectedNomina.mes)?.label} {selectedNomina.anio} • 
                  {selectedNomina.totalGeneral.toLocaleString('es-ES')} XAF
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Acción *</Label>
              <Select 
                value={validationForm.accion} 
                onValueChange={(value) => setValidationForm(prev => ({ ...prev, accion: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar acción..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aprobar">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Aprobar Nómina
                    </div>
                  </SelectItem>
                  <SelectItem value="enviar_seaf">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Enviar a SEAF
                    </div>
                  </SelectItem>
                  <SelectItem value="rechazar">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Rechazar (Requiere Ajustes)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={validationForm.observaciones}
                onChange={(e) => setValidationForm(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Observaciones sobre la validación..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowValidationDialog(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveValidation}
                disabled={!validationForm.accion}
                className="bg-guinea-teal hover:bg-guinea-dark-teal"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Procesar Validación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ValidacionNominasMinisterial;
