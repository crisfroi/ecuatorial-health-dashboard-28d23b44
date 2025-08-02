import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";

import {
  Search,
  Filter,
  Download,
  Send,
  Eye,
  Edit,
  Check,
  X,
  Clock,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Building,
  RefreshCw,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { supabase } from "@/integrations/supabase/client";
import { useProfesionales } from "@/hooks/useProfesionales";
import { useProfesionalesMutations } from "@/hooks/useProfesionalesMutations";
import type { Profesional } from "@/hooks/useProfesionales";

// Tipo para las alertas de renovación
export interface ProfesionalAlert {
  id: string;
  nombre_completo: string;
  area_profesional: string;
  fecha_caducidad: string;
  estado_solicitud: string;
  numero_carnet_profesional?: string;
  lugar_trabajo?: string;
  email?: string;
  telefono?: string;
}

// Tipo para Professional (compatibilidad) - ahora incluye todos los campos necesarios
export type Professional = Profesional;

interface Filtros {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  distrito?: string;
  distrito_sanitario?: string;
  anoGraduacion?: string;
  lugar_trabajo?: string;
  edad_minima?: number;
  edad_maxima?: number;
  año_graduacion?: number;
  categoria_titulacion?: string;
  categoria_centro?: string;
  // Filtros de fecha
  fecha_solicitud_gte?: string;
  fecha_solicitud_lte?: string;
}

// Tipo para filtros de navegación - incluye todas las propiedades necesarias
export interface NavigationFilters {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  search?: string;
  distrito?: string;
  distrito_sanitario?: string;
  anoGraduacion?: string;
  lugar_trabajo?: string;
  edad_minima?: number;
  edad_maxima?: number;
  año_graduacion?: number;
  categoria_titulacion?: string;
  categoria_centro?: string;
  fecha_solicitud_gte?: string;
  fecha_solicitud_lte?: string;
}

const RequestsPanel = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [areaFilter, setAreaFilter] = useState("todos");
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProfessional, setSelectedProfessional] = useState<Profesional | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [bulkActionDialog, setBulkActionDialog] = useState<'approve' | 'reject' | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("todos");
  
  const itemsPerPage = 10;

  // Fetch professionals
  const { data: profesionales = [], isLoading, error, refetch } = useProfesionales({
    estado_solicitud: statusFilter === "todos" ? undefined : statusFilter,
    area_profesional: areaFilter === "todos" ? undefined : areaFilter,
  });

  const { updateProfesionalMutation, isUpdating } = useProfesionalesMutations();

  // Filter and paginate data
  const filteredRequests = useMemo(() => {
    return profesionales.filter(prof => {
      const matchesSearch = prof.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           prof.area_profesional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           prof.id_profesional_unico?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesUrgency = urgencyFilter === "todos" || prof.urgencia_solicitud === urgencyFilter;
      
      return matchesSearch && matchesUrgency;
    });
  }, [profesionales, searchTerm, urgencyFilter]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  // Handlers
  const handleSelectAll = useCallback(() => {
    if (selectedRequests.length === paginatedRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(paginatedRequests.map(req => req.id));
    }
  }, [selectedRequests.length, paginatedRequests]);

  const handleSelectRequest = useCallback((id: string) => {
    setSelectedRequests(prev =>
      prev.includes(id) ? prev.filter(reqId => reqId !== id) : [...prev, id]
    );
  }, []);

  const handleApproval = async () => {
    if (!selectedProfessional) return;

    try {
      await updateProfesionalMutation.mutateAsync({
        id: selectedProfessional.id,
        estado_solicitud: 'Aprobado',
        fecha_aprobacion: new Date().toISOString().split('T')[0],
        notas_aprobacion: approvalNotes
      });

      setShowApprovalDialog(false);
      setSelectedProfessional(null);
      setApprovalNotes("");
      
      toast({
        title: "Solicitud aprobada",
        description: "La solicitud ha sido aprobada exitosamente.",
      });
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleRejection = async () => {
    if (!selectedProfessional) return;

    try {
      await updateProfesionalMutation.mutateAsync({
        id: selectedProfessional.id,
        estado_solicitud: 'Rechazado',
        fecha_rechazo: new Date().toISOString(),
        motivo_rechazo: rejectionReason
      });

      setShowRejectionDialog(false);
      setSelectedProfessional(null);
      setRejectionReason("");
      
      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido rechazada.",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    const updates = selectedRequests.map(id => ({
      id,
      estado_solicitud: action === 'approve' ? 'Aprobado' : 'Rechazado',
      ...(action === 'approve' 
        ? { fecha_aprobacion: new Date().toISOString().split('T')[0], notas_aprobacion: approvalNotes }
        : { fecha_rechazo: new Date().toISOString(), motivo_rechazo: rejectionReason }
      )
    }));

    try {
      await Promise.all(
        updates.map(update => updateProfesionalMutation.mutateAsync(update))
      );
      
      setBulkActionDialog(null);
      setSelectedRequests([]);
      setApprovalNotes("");
      setRejectionReason("");
      
      toast({
        title: `Solicitudes ${action === 'approve' ? 'aprobadas' : 'rechazadas'}`,
        description: `${updates.length} solicitudes han sido procesadas.`,
      });
    } catch (error) {
      console.error('Error in bulk action:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Recibido': { variant: 'secondary' as const, icon: FileText },
      'En Revisión': { variant: 'default' as const, icon: Clock },
      'Aprobado': { variant: 'default' as const, icon: Check, className: 'bg-green-100 text-green-800' },
      'Pendiente de Firma': { variant: 'default' as const, icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
      'Rechazado': { variant: 'destructive' as const, icon: X }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Recibido'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      'Alta': { className: 'bg-red-100 text-red-800', icon: AlertTriangle },
      'Media': { className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Baja': { className: 'bg-green-100 text-green-800', icon: Clock }
    };

    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || urgencyConfig['Media'];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {urgency}
      </Badge>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando solicitudes...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error al cargar solicitudes</CardTitle>
          <CardDescription>
            No se pudieron cargar las solicitudes. Intenta recargar la página.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Solicitudes</h2>
          <p className="text-muted-foreground">
            Revisa y procesa las solicitudes de los profesionales sanitarios
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Búsqueda</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre, área o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="Recibido">Recibido</SelectItem>
                  <SelectItem value="En Revisión">En Revisión</SelectItem>
                  <SelectItem value="Aprobado">Aprobado</SelectItem>
                  <SelectItem value="Pendiente de Firma">Pendiente de Firma</SelectItem>
                  <SelectItem value="Rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Área Profesional</Label>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las áreas</SelectItem>
                  <SelectItem value="Medicina">Medicina</SelectItem>
                  <SelectItem value="Enfermería">Enfermería</SelectItem>
                  <SelectItem value="Farmacia">Farmacia</SelectItem>
                  <SelectItem value="Odontología">Odontología</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgencia</Label>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por urgencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las urgencias</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedRequests.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary">
                  {selectedRequests.length} solicitud(es) seleccionada(s)
                </Badge>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    onClick={() => setBulkActionDialog('approve')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Aprobar Seleccionadas
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => setBulkActionDialog('reject')}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Rechazar Seleccionadas
                  </Button>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setSelectedRequests([])}
              >
                Limpiar Selección
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Solicitudes ({filteredRequests.length})
            </CardTitle>
            {paginatedRequests.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedRequests.length === paginatedRequests.length && paginatedRequests.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm text-muted-foreground">
                  Seleccionar todo
                </Label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {paginatedRequests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron solicitudes</h3>
              <p className="text-muted-foreground">
                {filteredRequests.length === 0 
                  ? "No hay solicitudes que coincidan con los filtros seleccionados."
                  : "Modifica los filtros para ver más resultados."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedRequests.map((request) => (
                <div
                  key={request.id}
                  className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                    selectedRequests.includes(request.id) ? 'border-blue-500 bg-blue-50/50' : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedRequests.includes(request.id)}
                      onCheckedChange={() => handleSelectRequest(request.id)}
                    />
                    
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{request.nombre_completo}</h4>
                            {request.urgencia_solicitud && getUrgencyBadge(request.urgencia_solicitud)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              ID: {request.id_profesional_unico || 'Sin asignar'}
                            </span>
                            <span className="flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              {request.area_profesional}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Graduación: {request.año_graduacion || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.estado_solicitud)}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building className="h-3 w-3" />
                            <span>Lugar de Trabajo:</span>
                          </div>
                          <p className="text-foreground">{request.nombre_centro || 'No especificado'}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>Contacto:</span>
                          </div>
                          <div className="space-y-1">
                            {request.telefono && <p className="text-foreground">{request.telefono}</p>}
                            {request.email && <p className="text-foreground text-xs">{request.email}</p>}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>Ubicación:</span>
                          </div>
                          <div className="space-y-1">
                            {request.provincia && <p className="text-foreground">{request.provincia}</p>}
                            {request.distrito_sanitario && <p className="text-foreground text-xs">{request.distrito_sanitario}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedProfessional(request)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                        
                        {request.estado_solicitud === 'Recibido' || request.estado_solicitud === 'En Revisión' ? (
                          <>
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedProfessional(request);
                                setShowApprovalDialog(true);
                              }}
                              className="bg-green-600 hover:bg-green-700"
                              disabled={isUpdating}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                setSelectedProfessional(request);
                                setShowRejectionDialog(true);
                              }}
                              disabled={isUpdating}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredRequests.length)} de {filteredRequests.length} resultados
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Aprobar Solicitud</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea aprobar esta solicitud?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="approval-notes" className="text-right">
                Notas:
              </Label>
              <Textarea 
                id="approval-notes" 
                className="col-span-3"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowApprovalDialog(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleApproval} disabled={isUpdating}>
              Aprobar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea rechazar esta solicitud?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rejection-reason" className="text-right">
                Motivo:
              </Label>
              <Textarea 
                id="rejection-reason" 
                className="col-span-3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowRejectionDialog(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleRejection} variant="destructive" disabled={isUpdating}>
              Rechazar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialog !== null} onOpenChange={() => setBulkActionDialog(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {bulkActionDialog === 'approve' ? 'Aprobar Solicitudes' : 'Rechazar Solicitudes'}
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea {bulkActionDialog === 'approve' ? 'aprobar' : 'rechazar'} las solicitudes seleccionadas?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bulk-notes" className="text-right">
                Notas:
              </Label>
              <Textarea 
                id="bulk-notes" 
                className="col-span-3"
                placeholder="Opcional"
                value={bulkActionDialog === 'approve' ? approvalNotes : rejectionReason}
                onChange={(e) => {
                  if (bulkActionDialog === 'approve') {
                    setApprovalNotes(e.target.value);
                  } else {
                    setRejectionReason(e.target.value);
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setBulkActionDialog(null)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              onClick={() => handleBulkAction(bulkActionDialog === 'approve' ? 'approve' : 'reject')} 
              className={bulkActionDialog === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              disabled={isUpdating}
            >
              {bulkActionDialog === 'approve' ? 'Aprobar Solicitudes' : 'Rechazar Solicitudes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestsPanel;
