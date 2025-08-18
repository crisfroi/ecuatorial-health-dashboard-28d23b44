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
  History
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

  const [selectedTab, setSelectedTab] = useState('actividad');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAccion, setFiltroAccion] = useState<string>('todos');
  const [filtroUsuario, setFiltroUsuario] = useState<string>('todos');
  const [filtroEntidad, setFiltroEntidad] = useState<string>('todos');
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    fetchBitacora({
      mes: selectedMonth,
      ano: selectedYear,
      centro_id: selectedCenter,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    });
  }, [selectedMonth, selectedYear, selectedCenter, fechaInicio, fechaFin]);

  const bitacoraFiltrada = bitacora.filter(entry => {
    const matchesSearch = 
      entry.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.usuario_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.entidad_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAccion = filtroAccion === 'todos' || entry.accion === filtroAccion;
    const matchesUsuario = filtroUsuario === 'todos' || entry.usuario_email === filtroUsuario;
    const matchesEntidad = filtroEntidad === 'todos' || entry.entidad_tipo === filtroEntidad;
    
    return matchesSearch && matchesAccion && matchesUsuario && matchesEntidad;
  });

  // Agrupar por tipo de acción
  const accionesPorTipo = bitacora.reduce((acc, entry) => {
    acc[entry.accion] = (acc[entry.accion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Agrupar por entidad
  const entidadesPorTipo = bitacora.reduce((acc, entry) => {
    acc[entry.entidad_tipo] = (acc[entry.entidad_tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Usuarios más activos
  const usuariosActivos = Object.entries(
    bitacora.reduce((acc, entry) => {
      acc[entry.usuario_email] = (acc[entry.usuario_email] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).sort(([,a], [,b]) => b - a).slice(0, 10);

  const handleExportAudit = async () => {
    try {
      await exportAuditLog({
        mes: selectedMonth,
        ano: selectedYear,
        centro_id: selectedCenter,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        filtros: {
          accion: filtroAccion !== 'todos' ? filtroAccion : undefined,
          usuario: filtroUsuario !== 'todos' ? filtroUsuario : undefined,
          entidad_tipo: filtroEntidad !== 'todos' ? filtroEntidad : undefined
        }
      });
      
      toast({
        title: "Log exportado",
        description: "El log de auditoría ha sido exportado exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar el log de auditoría.",
        variant: "destructive",
      });
    }
  };

  const getAccionBadge = (accion: string) => {
    switch (accion) {
      case 'CREATE':
        return <Badge className="bg-green-100 text-green-800">Crear</Badge>;
      case 'UPDATE':
        return <Badge className="bg-blue-100 text-blue-800">Actualizar</Badge>;
      case 'DELETE':
        return <Badge className="bg-red-100 text-red-800">Eliminar</Badge>;
      case 'APPROVE':
        return <Badge className="bg-purple-100 text-purple-800">Aprobar</Badge>;
      case 'REJECT':
        return <Badge className="bg-orange-100 text-orange-800">Rechazar</Badge>;
      case 'EXPORT':
        return <Badge className="bg-indigo-100 text-indigo-800">Exportar</Badge>;
      case 'LOGIN':
        return <Badge className="bg-teal-100 text-teal-800">Login</Badge>;
      case 'LOGOUT':
        return <Badge className="bg-gray-100 text-gray-800">Logout</Badge>;
      default:
        return <Badge variant="secondary">{accion}</Badge>;
    }
  };

  const getEntidadIcon = (entidad: string) => {
    switch (entidad) {
      case 'GUARDIA':
        return <Calendar className="w-4 h-4" />;
      case 'CUADRANTE':
        return <FileText className="w-4 h-4" />;
      case 'NOMINA':
        return <Database className="w-4 h-4" />;
      case 'PAGO':
        return <Database className="w-4 h-4" />;
      case 'VALIDACION':
        return <CheckCircle className="w-4 h-4" />;
      case 'PROFESIONAL':
        return <User className="w-4 h-4" />;
      case 'CENTRO':
        return <Activity className="w-4 h-4" />;
      case 'BAREMO':
        return <Settings className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const canViewAudit = ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole);

  if (!canViewAudit) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Acceso Restringido
          </h3>
          <p className="text-gray-600">
            No tiene permisos para ver la auditoría del sistema.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Auditoría del Sistema</h2>
          <p className="text-gray-600">
            Registro completo de actividades y cambios en el sistema de guardias
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={handleExportAudit}
        >
          <Download className="w-4 h-4 mr-1" />
          Exportar Log
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar en logs..."
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
                <SelectItem value="CREATE">Crear</SelectItem>
                <SelectItem value="UPDATE">Actualizar</SelectItem>
                <SelectItem value="DELETE">Eliminar</SelectItem>
                <SelectItem value="APPROVE">Aprobar</SelectItem>
                <SelectItem value="REJECT">Rechazar</SelectItem>
                <SelectItem value="EXPORT">Exportar</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filtroEntidad} onValueChange={setFiltroEntidad}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por entidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las entidades</SelectItem>
                <SelectItem value="GUARDIA">Guardias</SelectItem>
                <SelectItem value="CUADRANTE">Cuadrantes</SelectItem>
                <SelectItem value="NOMINA">Nóminas</SelectItem>
                <SelectItem value="PAGO">Pagos</SelectItem>
                <SelectItem value="VALIDACION">Validaciones</SelectItem>
                <SelectItem value="PROFESIONAL">Profesionales</SelectItem>
                <SelectItem value="CENTRO">Centros</SelectItem>
                <SelectItem value="BAREMO">Baremos</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              placeholder="Fecha inicio"
            />
            
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              placeholder="Fecha fin"
            />
            
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFiltroAccion('todos');
                setFiltroUsuario('todos');
                setFiltroEntidad('todos');
                setFechaInicio('');
                setFechaFin('');
              }}
            >
              <Filter className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="actividad">Log de Actividad</TabsTrigger>
          <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios Activos</TabsTrigger>
          <TabsTrigger value="entidades">Por Entidad</TabsTrigger>
        </TabsList>

        <TabsContent value="actividad" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando logs de auditoría...</p>
            </div>
          ) : bitacoraFiltrada.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay registros
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filtroAccion !== 'todos' || filtroEntidad !== 'todos' || fechaInicio || fechaFin
                    ? 'No hay registros que coincidan con los filtros aplicados.'
                    : 'No hay actividad registrada para este período.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {bitacoraFiltrada.map((entry) => (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-1">
                          {getEntidadIcon(entry.entidad_tipo)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getAccionBadge(entry.accion)}
                            <span className="text-sm font-medium text-gray-900">
                              {entry.entidad_tipo}
                            </span>
                            <span className="text-sm text-gray-500">
                              por {entry.usuario_email}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-2">{entry.descripcion}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDateTime(entry.fecha_hora)}</span>
                            </span>
                            {entry.ip_address && (
                              <span>IP: {entry.ip_address}</span>
                            )}
                            {entry.entidad_id && (
                              <span>ID: {entry.entidad_id}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="estadisticas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Eventos</p>
                    <p className="text-2xl font-bold">{bitacora.length}</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Usuarios Únicos</p>
                    <p className="text-2xl font-bold">
                      {new Set(bitacora.map(b => b.usuario_email)).size}
                    </p>
                  </div>
                  <User className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tipos de Acción</p>
                    <p className="text-2xl font-bold">{Object.keys(accionesPorTipo).length}</p>
                  </div>
                  <Settings className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tipos de Entidad</p>
                    <p className="text-2xl font-bold">{Object.keys(entidadesPorTipo).length}</p>
                  </div>
                  <Database className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Acciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(accionesPorTipo)
                    .sort(([,a], [,b]) => b - a)
                    .map(([accion, cantidad]) => (
                      <div key={accion} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          {getAccionBadge(accion)}
                        </div>
                        <span className="font-bold">{cantidad}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actividad por Entidad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(entidadesPorTipo)
                    .sort(([,a], [,b]) => b - a)
                    .map(([entidad, cantidad]) => (
                      <div key={entidad} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          {getEntidadIcon(entidad)}
                          <span className="font-medium">{entidad}</span>
                        </div>
                        <span className="font-bold">{cantidad}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios Más Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usuariosActivos.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No hay actividad de usuarios registrada</p>
                ) : (
                  usuariosActivos.map(([email, actividad], index) => (
                    <div key={email} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{email}</p>
                          <p className="text-sm text-gray-600">{actividad} acciones</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFiltroUsuario(email)}
                      >
                        Ver Actividad
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entidades" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(entidadesPorTipo)
              .sort(([,a], [,b]) => b - a)
              .map(([entidad, cantidad]) => (
                <Card key={entidad}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        {getEntidadIcon(entidad)}
                        <div>
                          <h3 className="font-semibold">{entidad}</h3>
                          <p className="text-sm text-gray-600">{cantidad} eventos registrados</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setFiltroEntidad(entidad)}
                      >
                        Filtrar por {entidad}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de detalle */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Evento de Auditoría</DialogTitle>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Acción</h4>
                  {getAccionBadge(selectedEntry.accion)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Entidad</h4>
                  <div className="flex items-center space-x-2">
                    {getEntidadIcon(selectedEntry.entidad_tipo)}
                    <span>{selectedEntry.entidad_tipo}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Usuario</h4>
                <p className="text-sm">{selectedEntry.usuario_email}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Descripción</h4>
                <p className="text-sm bg-gray-50 p-3 rounded">{selectedEntry.descripcion}</p>
              </div>

              {selectedEntry.datos_anteriores && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Datos Anteriores</h4>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                    {JSON.stringify(selectedEntry.datos_anteriores, null, 2)}
                  </pre>
                </div>
              )}

              {selectedEntry.datos_nuevos && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Datos Nuevos</h4>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                    {JSON.stringify(selectedEntry.datos_nuevos, null, 2)}
                  </pre>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-2 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>Fecha/Hora:</strong> {formatDateTime(selectedEntry.fecha_hora)}</p>
                    <p><strong>ID Entidad:</strong> {selectedEntry.entidad_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p><strong>IP Address:</strong> {selectedEntry.ip_address || 'N/A'}</p>
                    <p><strong>User Agent:</strong> {selectedEntry.user_agent || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
