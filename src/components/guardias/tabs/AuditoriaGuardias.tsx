// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useGuardiasStore } from "@/stores/useGuardiasStore";
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  User,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Activity,
  Database,
  Settings,
  History,
  Monitor,
  Trash2,
  Edit,
  Plus,
  RefreshCw
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuditoriaGuardiasProps {
  selectedMonth: number;
  selectedYear: number;
  selectedCenter: string | null;
  userRole: string;
}

export const AuditoriaGuardias: React.FC<AuditoriaGuardiasProps> = ({
  selectedMonth,
  selectedYear,
  selectedCenter,
  userRole
}) => {
  const { toast } = useToast();
  const {
    bitacora,
    loading,
    fetchBitacora,
    exportAuditLog
  } = useGuardiasStore();

  const [selectedTab, setSelectedTab] = useState('recientes');
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAccion, setFiltroAccion] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroFecha, setFiltroFecha] = useState<string>('hoy');

  // Estados para filtros de fecha personalizados
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    loadBitacora();
  }, [selectedMonth, selectedYear, selectedCenter, filtroFecha, fechaInicio, fechaFin]);

  const loadBitacora = async () => {
    const params: any = {
      mes: selectedMonth,
      ano: selectedYear,
      centro_id: selectedCenter
    };

    // Aplicar filtros de fecha
    if (filtroFecha === 'personalizado' && fechaInicio && fechaFin) {
      params.fecha_inicio = fechaInicio;
      params.fecha_fin = fechaFin;
    } else if (filtroFecha !== 'todos') {
      const now = new Date();
      switch (filtroFecha) {
        case 'hoy':
          params.fecha_inicio = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          params.fecha_fin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
          break;
        case 'semana':
          const semanaAtras = new Date(now);
          semanaAtras.setDate(now.getDate() - 7);
          params.fecha_inicio = semanaAtras.toISOString();
          params.fecha_fin = now.toISOString();
          break;
        case 'mes':
          const mesAtras = new Date(now);
          mesAtras.setMonth(now.getMonth() - 1);
          params.fecha_inicio = mesAtras.toISOString();
          params.fecha_fin = now.toISOString();
          break;
      }
    }

    await fetchBitacora(params);
  };

  const handleExportAuditLog = async () => {
    try {
      await exportAuditLog({
        mes: selectedMonth,
        ano: selectedYear,
        centro_id: selectedCenter,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        filtroAccion,
        filtroTipo
      });
      toast({
        title: "Exportación exitosa",
        description: "El log de auditoría ha sido exportado.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar el log de auditoría.",
        variant: "destructive",
      });
    }
  };

  // Filtrar bitácora según criterios
  const bitacoraFiltrada = bitacora.filter(entry => {
    const matchesSearch = 
      entry.accion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.ref_tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.detalle?.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAccion = filtroAccion === 'todos' || entry.accion === filtroAccion;
    const matchesTipo = filtroTipo === 'todos' || entry.ref_tipo === filtroTipo;
    
    return matchesSearch && matchesAccion && matchesTipo;
  });

  // Agrupar por tipos de actividad
  const actividadReciente = bitacoraFiltrada.slice(0, 50);
  const actividadGuardias = bitacoraFiltrada.filter(e => e.ref_tipo === 'guardia');
  const actividadNominas = bitacoraFiltrada.filter(e => e.ref_tipo === 'nomina');
  const actividadPagos = bitacoraFiltrada.filter(e => e.ref_tipo === 'pago');
  const actividadUsuarios = bitacoraFiltrada.filter(e => e.ref_tipo === 'usuario');

  const getAccionBadge = (accion: string) => {
    switch (accion.toLowerCase()) {
      case 'create':
      case 'crear':
      case 'insertar':
        return <Badge className="bg-green-100 text-green-800"><Plus className="w-3 h-3 mr-1" />Crear</Badge>;
      case 'update':
      case 'actualizar':
      case 'modificar':
        return <Badge className="bg-blue-100 text-blue-800"><Edit className="w-3 h-3 mr-1" />Actualizar</Badge>;
      case 'delete':
      case 'eliminar':
      case 'borrar':
        return <Badge className="bg-red-100 text-red-800"><Trash2 className="w-3 h-3 mr-1" />Eliminar</Badge>;
      case 'login':
      case 'iniciar_sesion':
        return <Badge className="bg-purple-100 text-purple-800"><User className="w-3 h-3 mr-1" />Login</Badge>;
      case 'export':
      case 'exportar':
        return <Badge className="bg-orange-100 text-orange-800"><Download className="w-3 h-3 mr-1" />Exportar</Badge>;
      case 'approve':
      case 'aprobar':
        return <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1" />Aprobar</Badge>;
      case 'reject':
      case 'rechazar':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rechazar</Badge>;
      default:
        return <Badge variant="outline">{accion}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'guardia':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">Guardia</Badge>;
      case 'nomina':
        return <Badge variant="outline" className="text-green-600 border-green-200">Nómina</Badge>;
      case 'pago':
        return <Badge variant="outline" className="text-purple-600 border-purple-200">Pago</Badge>;
      case 'validacion':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Validación</Badge>;
      case 'usuario':
        return <Badge variant="outline" className="text-gray-600 border-gray-200">Usuario</Badge>;
      case 'sistema':
        return <Badge variant="outline" className="text-indigo-600 border-indigo-200">Sistema</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const getPriorityBadge = (detalle: any) => {
    if (!detalle) return null;
    
    const severity = detalle.severity || detalle.prioridad;
    if (!severity) return null;

    switch (severity.toLowerCase()) {
      case 'high':
      case 'alta':
      case 'critico':
        return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
      case 'medium':
      case 'media':
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'low':
      case 'baja':
        return <Badge className="bg-green-100 text-green-800">Baja</Badge>;
      default:
        return null;
    }
  };

  const renderBitacoraCard = (entry: any) => (
    <Card key={entry.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex items-center space-x-2">
                {getAccionBadge(entry.accion)}
                {getTipoBadge(entry.ref_tipo)}
                {getPriorityBadge(entry.detalle)}
              </div>
            </div>
            
            <h3 className="font-semibold text-lg mb-2">
              {entry.accion} - {entry.ref_tipo}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{entry.fecha ? new Date(entry.fecha).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{entry.fecha ? new Date(entry.fecha).toLocaleTimeString('es-ES') : 'Sin hora'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4" />
                <span>{entry.ip_address || 'IP no registrada'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>Ref ID: {entry.ref_id}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Usuario: {entry.usuario?.nombre_completo || entry.usuario_id || 'Sistema'}</span>
              </div>
            </div>

            {entry.detalle && (
              <div className="mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm">
                    {entry.detalle.descripcion && (
                      <p className="mb-2"><strong>Descripción:</strong> {entry.detalle.descripcion}</p>
                    )}
                    {entry.detalle.cambios && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          Ver cambios realizados
                        </summary>
                        <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(entry.detalle.cambios, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            )}

            {entry.user_agent && (
              <div className="text-xs text-gray-500">
                <details>
                  <summary className="cursor-pointer hover:text-gray-700">
                    Información técnica
                  </summary>
                  <div className="mt-1 bg-gray-50 p-2 rounded text-xs">
                    <p><strong>User Agent:</strong> {entry.user_agent}</p>
                    <p><strong>IP Address:</strong> {entry.ip_address}</p>
                    <p><strong>Timestamp:</strong> {entry.fecha}</p>
                  </div>
                </details>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedEntry(entry);
                setIsDetailDialogOpen(true);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const canViewAuditLog = ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole);
  const canExportAuditLog = ['SUPER_ADMINISTRADOR'].includes(userRole);

  if (!canViewAuditLog) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Acceso Restringido
          </h3>
          <p className="text-gray-600">
            No tiene permisos para acceder al sistema de auditoría.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sistema de Auditoría</h2>
          <p className="text-gray-600">
            Registro completo de actividades del sistema de guardias para {selectedMonth}/{selectedYear}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={loadBitacora}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          {canExportAuditLog && (
            <Button
              variant="outline"
              onClick={handleExportAuditLog}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Log
            </Button>
          )}
        </div>
      </div>

      {/* Estadísticas de auditoría */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Eventos</p>
                <p className="text-2xl font-bold text-blue-600">{bitacora.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eventos Guardias</p>
                <p className="text-2xl font-bold text-green-600">{actividadGuardias.length}</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eventos Nóminas</p>
                <p className="text-2xl font-bold text-purple-600">{actividadNominas.length}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eventos Pagos</p>
                <p className="text-2xl font-bold text-orange-600">{actividadPagos.length}</p>
              </div>
              <Database className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros avanzados */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar en actividad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filtroAccion} onValueChange={setFiltroAccion}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las acciones</SelectItem>
                <SelectItem value="create">Crear</SelectItem>
                <SelectItem value="update">Actualizar</SelectItem>
                <SelectItem value="delete">Eliminar</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="export">Exportar</SelectItem>
                <SelectItem value="approve">Aprobar</SelectItem>
                <SelectItem value="reject">Rechazar</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="guardia">Guardias</SelectItem>
                <SelectItem value="nomina">Nóminas</SelectItem>
                <SelectItem value="pago">Pagos</SelectItem>
                <SelectItem value="validacion">Validaciones</SelectItem>
                <SelectItem value="usuario">Usuarios</SelectItem>
                <SelectItem value="sistema">Sistema</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filtroFecha} onValueChange={setFiltroFecha}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las fechas</SelectItem>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="semana">Última semana</SelectItem>
                <SelectItem value="mes">Último mes</SelectItem>
                <SelectItem value="personalizado">Rango personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {filtroFecha === 'personalizado' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Fecha inicio</label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Fecha fin</label>
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="recientes" className="relative">
            Actividad Reciente
            {actividadReciente.length > 0 && (
              <Badge className="ml-2 bg-blue-500 text-white">
                {actividadReciente.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="guardias">
            Guardias
            {actividadGuardias.length > 0 && (
              <Badge className="ml-2 bg-green-500 text-white">
                {actividadGuardias.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="nominas">
            Nóminas
            {actividadNominas.length > 0 && (
              <Badge className="ml-2 bg-purple-500 text-white">
                {actividadNominas.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pagos">
            Pagos
            {actividadPagos.length > 0 && (
              <Badge className="ml-2 bg-orange-500 text-white">
                {actividadPagos.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="usuarios">
            Usuarios
            {actividadUsuarios.length > 0 && (
              <Badge className="ml-2 bg-gray-500 text-white">
                {actividadUsuarios.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recientes" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando actividad...</p>
            </div>
          ) : actividadReciente.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay actividad reciente
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filtroAccion !== 'todos' || filtroTipo !== 'todos' 
                    ? 'No hay actividad que coincida con los filtros aplicados.' 
                    : 'No hay actividad registrada para el período seleccionado.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {actividadReciente.map(renderBitacoraCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="guardias" className="space-y-4">
          {actividadGuardias.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay actividad de guardias
                </h3>
                <p className="text-gray-600">
                  La actividad relacionada con guardias aparecerá aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {actividadGuardias.map(renderBitacoraCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="nominas" className="space-y-4">
          {actividadNominas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay actividad de nóminas
                </h3>
                <p className="text-gray-600">
                  La actividad relacionada con nóminas aparecerá aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {actividadNominas.map(renderBitacoraCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pagos" className="space-y-4">
          {actividadPagos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay actividad de pagos
                </h3>
                <p className="text-gray-600">
                  La actividad relacionada con pagos aparecerá aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {actividadPagos.map(renderBitacoraCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-4">
          {actividadUsuarios.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay actividad de usuarios
                </h3>
                <p className="text-gray-600">
                  La actividad relacionada con usuarios aparecerá aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {actividadUsuarios.map(renderBitacoraCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de detalle */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Detalle del Evento de Auditoría
            </DialogTitle>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Acción</h4>
                  {getAccionBadge(selectedEntry.accion)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tipo</h4>
                  {getTipoBadge(selectedEntry.ref_tipo)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Fecha y Hora</h4>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {selectedEntry.fecha ? new Date(selectedEntry.fecha).toLocaleString('es-ES') : 'Sin fecha'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Usuario</h4>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {selectedEntry.usuario?.nombre_completo || selectedEntry.usuario_id || 'Sistema'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Referencia ID</h4>
                  <p className="text-sm bg-gray-50 p-2 rounded font-mono">
                    {selectedEntry.ref_id}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">IP Address</h4>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {selectedEntry.ip_address || 'No disponible'}
                  </p>
                </div>
              </div>

              {selectedEntry.detalle && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Detalles del Evento</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(selectedEntry.detalle, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedEntry.user_agent && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">User Agent</h4>
                  <p className="text-xs bg-gray-50 p-2 rounded break-all">
                    {selectedEntry.user_agent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
