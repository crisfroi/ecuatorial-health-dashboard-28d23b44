
import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfesionales, type Profesional } from "@/hooks/useProfesionales";
import { useProfesionalesMutations } from "@/hooks/useProfesionalesMutations";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  MapPin,
  GraduationCap,
  Building,
  Phone,
  Mail,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Download,
  MoreVertical,
  AlertCircle,
  CheckCheck,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const RequestsPanel = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [areaFilter, setAreaFilter] = useState("todos");
  const [provinceFilter, setProvinceFilter] = useState("todos");
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Profesional | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState("");

  const { toast } = useToast();

  // Fetch all professionals with filters
  const filtros = useMemo(() => ({
    area_profesional: areaFilter !== "todos" ? areaFilter : undefined,
    estado_solicitud: statusFilter !== "todos" ? statusFilter : undefined,
    provincia: provinceFilter !== "todos" ? provinceFilter : undefined,
  }), [areaFilter, statusFilter, provinceFilter]);

  const { data: professionals = [], isLoading, error } = useProfesionales(filtros);
  const { updateProfesional, bulkUpdate } = useProfesionalesMutations();

  // Filter professionals based on search term
  const filteredProfessionals = useMemo(() => {
    if (!Array.isArray(professionals)) return [];
    
    return professionals.filter((prof) => {
      const matchesSearch = !searchTerm || 
        prof.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.numero_documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [professionals, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    if (!Array.isArray(professionals)) return { total: 0, pending: 0, approved: 0, rejected: 0 };
    
    return {
      total: professionals.length,
      pending: professionals.filter(p => p.estado_solicitud === "Recibido" || p.estado_solicitud === "En Revisión").length,
      approved: professionals.filter(p => p.estado_solicitud === "Aprobado").length,
      rejected: professionals.filter(p => p.estado_solicitud === "Rechazado").length,
    };
  }, [professionals]);

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Aprobado":
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Aprobado</Badge>;
      case "Rechazado":
        return <Badge variant="destructive">Rechazado</Badge>;
      case "En Revisión":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">En Revisión</Badge>;
      case "Recibido":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Recibido</Badge>;
      case "Pendiente de Firma":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">Pendiente de Firma</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Handle status change
  const handleStatusChange = async (professionalId: string, newStatus: string) => {
    try {
      await updateProfesional.mutateAsync({
        id: professionalId,
        updates: { 
          estado_solicitud: newStatus,
          motivo_rechazo: newStatus === "Rechazado" ? rejectionReason : null
        }
      });

      toast({
        title: "Estado actualizado",
        description: `La solicitud ha sido ${newStatus.toLowerCase()}.`,
      });

      if (newStatus === "Rechazado") {
        setRejectionReason("");
        setRejectDialogOpen(false);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedRequests.length === 0) return;

    const updates = selectedRequests.map(id => ({
      id,
      changes: { 
        estado_solicitud: bulkAction,
        motivo_rechazo: bulkAction === "Rechazado" ? rejectionReason : null
      }
    }));

    try {
      await bulkUpdate.mutateAsync(updates);
      
      toast({
        title: "Actualización masiva completada",
        description: `Se actualizaron ${selectedRequests.length} solicitudes.`,
      });

      setSelectedRequests([]);
      setBulkAction("");
      if (bulkAction === "Rechazado") {
        setRejectionReason("");
      }
    } catch (error) {
      console.error("Error in bulk update:", error);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    const currentPageIds = filteredProfessionals.map(p => p.id);
    if (selectedRequests.length === currentPageIds.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(currentPageIds);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvData = filteredProfessionals.map(prof => ({
      'Nombres': prof.nombres,
      'Apellidos': prof.apellidos,
      'Documento': prof.numero_documento,
      'Email': prof.email,
      'Area Profesional': prof.area_profesional,
      'Estado': prof.estado_solicitud,
      'Provincia': prof.provincia,
      'Fecha Solicitud': prof.created_at ? new Date(prof.created_at).toLocaleDateString() : ''
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'solicitudes.csv';
    a.click();
  };

  // Find professional by ID for actions
  const findProfessional = (id: string) => {
    if (!Array.isArray(professionals)) return null;
    return professionals.find((p: any) => p.id === id);
  };

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>Error al cargar las solicitudes</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Solicitudes</h2>
          <p className="text-muted-foreground">
            Administra las solicitudes de registro de profesionales sanitarios
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aprobadas</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rechazadas</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, documento, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="Recibido">Recibido</SelectItem>
                <SelectItem value="En Revisión">En Revisión</SelectItem>
                <SelectItem value="Aprobado">Aprobado</SelectItem>
                <SelectItem value="Rechazado">Rechazado</SelectItem>
                <SelectItem value="Pendiente de Firma">Pendiente de Firma</SelectItem>
              </SelectContent>
            </Select>

            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Área profesional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las áreas</SelectItem>
                <SelectItem value="Medicina General">Medicina General</SelectItem>
                <SelectItem value="Enfermería">Enfermería</SelectItem>
                <SelectItem value="Odontología">Odontología</SelectItem>
                <SelectItem value="Farmacia">Farmacia</SelectItem>
                <SelectItem value="Psicología">Psicología</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedRequests.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <span className="text-sm font-medium">
                {selectedRequests.length} solicitud(es) seleccionada(s)
              </span>
              
              <div className="flex gap-2">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Acción masiva" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="En Revisión">Poner en revisión</SelectItem>
                    <SelectItem value="Aprobado">Aprobar</SelectItem>
                    <SelectItem value="Rechazado">Rechazar</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleBulkAction}
                  disabled={!bulkAction || bulkUpdate.isPending}
                >
                  {bulkUpdate.isPending ? "Procesando..." : "Aplicar"}
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => setSelectedRequests([])}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Solicitudes</CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={selectedRequests.length === filteredProfessionals.length && filteredProfessionals.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label className="text-sm">Seleccionar todo</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Cargando solicitudes...</span>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredProfessionals.map((professional) => (
                  <Card key={professional.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Checkbox 
                            checked={selectedRequests.includes(professional.id)}
                            onCheckedChange={(isChecked) => {
                              if (isChecked) {
                                setSelectedRequests([...selectedRequests, professional.id]);
                              } else {
                                setSelectedRequests(selectedRequests.filter(id => id !== professional.id));
                              }
                            }}
                          />
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-lg">
                                {professional.nombres} {professional.apellidos}
                              </h3>
                              {getStatusBadge(professional.estado_solicitud)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>{professional.numero_documento}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4" />
                                <span>{professional.email}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <GraduationCap className="w-4 h-4" />
                                <span>{professional.area_profesional}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4" />
                                <span>{professional.provincia}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {professional.created_at ? 
                                    new Date(professional.created_at).toLocaleDateString() : 
                                    'N/A'
                                  }
                                </span>
                              </div>
                            </div>

                            {professional.motivo_rechazo && (
                              <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                                <p className="text-red-800 text-sm">
                                  <strong>Motivo de rechazo:</strong> {professional.motivo_rechazo}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedProfessional(professional);
                              setDetailsOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          
                          {professional.estado_solicitud === "Recibido" && (
                            <Button 
                              size="sm"
                              onClick={() => handleStatusChange(professional.id, "En Revisión")}
                              disabled={updateProfesional.isPending}
                            >
                              <CheckCheck className="w-4 h-4 mr-1" />
                              Revisar
                            </Button>
                          )}
                          
                          {professional.estado_solicitud === "En Revisión" && (
                            <div className="flex space-x-1">
                              <Button 
                                size="sm"
                                onClick={() => handleStatusChange(professional.id, "Aprobado")}
                                disabled={updateProfesional.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprobar
                              </Button>
                              
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => {
                                  setSelectedProfessional(professional);
                                  setRejectDialogOpen(true);
                                }}
                                disabled={updateProfesional.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredProfessionals.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron solicitudes que coincidan con los filtros aplicados.
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Professional Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalles de la Solicitud - {selectedProfessional?.nombres} {selectedProfessional?.apellidos}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProfessional && (
            <div className="space-y-6">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="professional">Profesional</TabsTrigger>
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
                  <TabsTrigger value="status">Estado</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Nombres</Label>
                      <p className="text-sm text-muted-foreground">{selectedProfessional.nombres}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Apellidos</Label>
                      <p className="text-sm text-muted-foreground">{selectedProfessional.apellidos}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Documento</Label>
                      <p className="text-sm text-muted-foreground">{selectedProfessional.numero_documento}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">{selectedProfessional.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Teléfono</Label>
                      <p className="text-sm text-muted-foreground">{selectedProfessional.telefono}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Género</Label>
                      <p className="text-sm text-muted-foreground">{selectedProfessional.genero}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="professional" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Área Profesional</Label>
                      <p className="text-sm text-muted-foreground">{selectedProfessional.area_profesional}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Especialidad</Label>
                      <p className="text-sm text-muted-foreground">{selectedProfessional.especialidad}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Universidad</Label>
                      <p className="text-sm text-muted-foreground">{selectedProfessional.universidad}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">País de Formación</Label>
                      <p className="text-sm text-muted-foreground">{selectedProfessional.pais_formacion}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Año de Graduación</Label>
                      <p className="text-sm text-muted-foreground">{selectedProfessional.año_graduacion}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Lugar de Trabajo</Label>
                      <p className="text-sm text-muted-foreground">{selectedProfessional.lugar_trabajo}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="documents" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Documentos Adjuntos</Label>
                      <div className="space-y-2 mt-2">
                        {selectedProfessional.url_titulo && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedProfessional.url_titulo} target="_blank" rel="noopener noreferrer">
                              <FileText className="w-4 h-4 mr-2" />
                              Ver Título
                            </a>
                          </Button>
                        )}
                        {selectedProfessional.url_cedula && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedProfessional.url_cedula} target="_blank" rel="noopener noreferrer">
                              <FileText className="w-4 h-4 mr-2" />
                              Ver Cédula
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="status" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Estado Actual</Label>
                      <div className="mt-1">
                        {getStatusBadge(selectedProfessional.estado_solicitud)}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Fecha de Solicitud</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedProfessional.created_at ? 
                          new Date(selectedProfessional.created_at).toLocaleDateString() : 
                          'N/A'
                        }
                      </p>
                    </div>
                    
                    {selectedProfessional.motivo_rechazo && (
                      <div>
                        <Label className="text-sm font-medium">Motivo de Rechazo</Label>
                        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {selectedProfessional.motivo_rechazo}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Motivo del rechazo</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Describa el motivo por el cual se rechaza esta solicitud..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => selectedProfessional && handleStatusChange(selectedProfessional.id, "Rechazado")}
                disabled={!rejectionReason.trim() || updateProfesional.isPending}
              >
                {updateProfesional.isPending ? "Procesando..." : "Rechazar Solicitud"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestsPanel;
