
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Building
} from 'lucide-react';

import { useProfesionales } from '@/hooks/useProfesionales';
import { useProfesionalesMutations } from '@/hooks/useProfesionalesMutations';

// Types
interface Profesional {
  id: string;
  nombre_completo: string;
  nombre?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  area_profesional?: string;
  especialidad?: string;
  estado_solicitud: string;
  fecha_solicitud?: string;
  fecha_revision?: string;
  fecha_aprobacion?: string;
  motivo_rechazo?: string;
  notas_revision?: string;
  categoria_titulacion?: string;
  institucion_1?: string;
  pais_formacion_1?: string;
  periodo_formacion_1?: string;
  nombre_centro?: string;
  categoria_centro?: string;
  tipo_sector?: string;
  distrito_sanitario?: string;
  provincia?: string;
  distrito?: string;
  nacionalidad?: string;
  genero?: string;
  fecha_nacimiento?: string;
  edad?: number;
  numero_dip?: string;
  numero_pasaporte?: string;
  domicilio?: string;
  urgencia_solicitud?: string;
  revisor_solicitud?: string;
  id_profesional_unico?: string;
  codigo_expediente?: string;
  pdf_formulario?: string;
  copia_dip?: string;
  copia_pasaporte?: string;
  foto_carnet?: string;
  documentos_adicionales?: string[];
  url_carnet?: string;
  fecha_caducidad?: string;
  [key: string]: any;
}

interface FilterState {
  busqueda: string;
  estado: string;
  area: string;
  urgencia: string;
  fechaDesde: string;
  fechaHasta: string;
  revisor: string;
}

const ESTADOS_SOLICITUD = [
  'Todos',
  'Recibido', 
  'En Revisión',
  'Pendiente de Firma',
  'Aprobado',
  'Rechazado'
];

const NIVELES_URGENCIA = [
  'Todos',
  'Alta',
  'Media',
  'Baja'
];

const RequestsPanel: React.FC = () => {
  const [selectedProfesional, setSelectedProfesional] = useState<Profesional | null>(null);
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    busqueda: '',
    estado: 'Todos',
    area: 'Todos',
    urgencia: 'Todos',
    fechaDesde: '',
    fechaHasta: '',
    revisor: 'Todos'
  });

  const { toast } = useToast();
  const { 
    data: profesionales = [], 
    isLoading, 
    error,
    refetch 
  } = useProfesionales();

  const { 
    actualizarProfesional, 
    aprobarSolicitud, 
    rechazarSolicitud 
  } = useProfesionalesMutations();

  console.log("RequestsPanel - Datos recibidos:", {
    count: profesionales.length,
    isLoading,
    error: error?.message,
    sample: profesionales[0]
  });

  // Filter professionals based on current filters
  const profesionalesFiltrados = useMemo(() => {
    if (!Array.isArray(profesionales)) {
      console.warn("RequestsPanel - profesionales no es un array:", profesionales);
      return [];
    }

    return profesionales.filter((prof: Profesional) => {
      // Search filter
      if (filters.busqueda) {
        const searchTerm = filters.busqueda.toLowerCase();
        const searchableFields = [
          prof.nombre_completo,
          prof.nombre,
          prof.apellidos,
          prof.email,
          prof.telefono,
          prof.id_profesional_unico,
          prof.codigo_expediente
        ];
        
        const matches = searchableFields.some(field => 
          field && field.toLowerCase().includes(searchTerm)
        );
        
        if (!matches) return false;
      }

      // State filter
      if (filters.estado !== 'Todos' && prof.estado_solicitud !== filters.estado) {
        return false;
      }

      // Area filter
      if (filters.area !== 'Todos' && prof.area_profesional !== filters.area) {
        return false;
      }

      // Urgency filter
      if (filters.urgencia !== 'Todos' && prof.urgencia_solicitud !== filters.urgencia) {
        return false;
      }

      // Date filters
      if (filters.fechaDesde && prof.fecha_solicitud) {
        if (new Date(prof.fecha_solicitud) < new Date(filters.fechaDesde)) {
          return false;
        }
      }

      if (filters.fechaHasta && prof.fecha_solicitud) {
        if (new Date(prof.fecha_solicitud) > new Date(filters.fechaHasta)) {
          return false;
        }
      }

      // Revisor filter
      if (filters.revisor !== 'Todos' && prof.revisor_solicitud !== filters.revisor) {
        return false;
      }

      return true;
    });
  }, [profesionales, filters]);

  // Get unique areas for filter
  const areasUnicas = useMemo(() => {
    if (!Array.isArray(profesionales)) return ['Todos'];
    
    const areas = profesionales
      .map((p: Profesional) => p.area_profesional)
      .filter(Boolean)
      .filter((area, index, arr) => arr.indexOf(area) === index)
      .sort();
    
    return ['Todos', ...areas];
  }, [profesionales]);

  // Get unique revisors for filter
  const revisoresUnicos = useMemo(() => {
    if (!Array.isArray(profesionales)) return ['Todos'];
    
    const revisores = profesionales
      .map((p: Profesional) => p.revisor_solicitud)
      .filter(Boolean)
      .filter((revisor, index, arr) => arr.indexOf(revisor) === index)
      .sort();
    
    return ['Todos', ...revisores];
  }, [profesionales]);

  // Handle bulk selection
  const handleBulkSelect = (profesionalId: string, isSelected: boolean) => {
    if (isSelected) {
      setBulkSelection(prev => [...prev, profesionalId]);
    } else {
      setBulkSelection(prev => prev.filter(id => id !== profesionalId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setBulkSelection(profesionalesFiltrados.map((p: Profesional) => p.id));
    } else {
      setBulkSelection([]);
    }
  };

  // Handle individual actions
  const handleAprobar = async (profesional: Profesional) => {
    try {
      await aprobarSolicitud.mutateAsync({
        id: profesional.id,
        notas: `Solicitud aprobada el ${new Date().toLocaleDateString()}`
      });
      
      toast({
        title: "Solicitud aprobada",
        description: `La solicitud de ${profesional.nombre_completo} ha sido aprobada.`,
        variant: "default"
      });
      
      refetch();
    } catch (error) {
      console.error("Error al aprobar solicitud:", error);
      toast({
        title: "Error",
        description: "No se pudo aprobar la solicitud. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handleRechazar = async (profesional: Profesional, motivo: string) => {
    try {
      await rechazarSolicitud.mutateAsync({
        id: profesional.id,
        motivo,
        notas: `Solicitud rechazada el ${new Date().toLocaleDateString()}: ${motivo}`
      });
      
      toast({
        title: "Solicitud rechazada",
        description: `La solicitud de ${profesional.nombre_completo} ha sido rechazada.`,
        variant: "default"
      });
      
      refetch();
    } catch (error) {
      console.error("Error al rechazar solicitud:", error);
      toast({
        title: "Error",
        description: "No se pudo rechazar la solicitud. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handleEnviarRevision = async (profesional: Profesional) => {
    try {
      await actualizarProfesional.mutateAsync({
        id: profesional.id,
        data: {
          estado_solicitud: 'En Revisión',
          fecha_revision: new Date().toISOString(),
          revisor_solicitud: 'Sistema'
        }
      });
      
      toast({
        title: "Solicitud enviada a revisión",
        description: `La solicitud de ${profesional.nombre_completo} ha sido enviada a revisión.`,
        variant: "default"
      });
      
      refetch();
    } catch (error) {
      console.error("Error al enviar a revisión:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud a revisión. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  // Handle bulk actions
  const handleBulkApproval = async () => {
    try {
      const promises = bulkSelection.map(id => {
        const prof = profesionalesFiltrados.find((p: Profesional) => p.id === id);
        if (prof) {
          return aprobarSolicitud.mutateAsync({
            id: prof.id,
            notas: `Aprobación masiva el ${new Date().toLocaleDateString()}`
          });
        }
      });

      await Promise.all(promises);
      
      toast({
        title: "Solicitudes aprobadas",
        description: `Se aprobaron ${bulkSelection.length} solicitudes exitosamente.`,
        variant: "default"
      });
      
      setBulkSelection([]);
      setShowBulkActions(false);
      refetch();
    } catch (error) {
      console.error("Error en aprobación masiva:", error);
      toast({
        title: "Error",
        description: "No se pudieron aprobar todas las solicitudes. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestión de Solicitudes</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    console.error("RequestsPanel - Error:", error);
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestión de Solicitudes</h1>
        </div>
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Error al cargar las solicitudes</h3>
            <p className="text-red-600 mb-4">{error.message}</p>
            <Button onClick={() => refetch()} variant="outline">
              Intentar de nuevo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Solicitudes</h1>
          <p className="text-gray-600 mt-1">
            {profesionalesFiltrados.length} de {profesionales.length} solicitudes
          </p>
        </div>
        
        {bulkSelection.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {bulkSelection.length} seleccionados
            </Badge>
            <Button 
              onClick={() => setShowBulkActions(!showBulkActions)}
              variant="outline"
              size="sm"
            >
              Acciones masivas
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="busqueda">Búsqueda</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="busqueda"
                  placeholder="Buscar por nombre, ID, teléfono..."
                  value={filters.busqueda}
                  onChange={(e) => setFilters(prev => ({ ...prev, busqueda: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select 
                value={filters.estado} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, estado: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_SOLICITUD.map(estado => (
                    <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="area">Área Profesional</Label>
              <Select 
                value={filters.area} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, area: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {areasUnicas.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="urgencia">Urgencia</Label>
              <Select 
                value={filters.urgencia} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, urgencia: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NIVELES_URGENCIA.map(urgencia => (
                    <SelectItem key={urgencia} value={urgencia}>{urgencia}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <Label htmlFor="fechaDesde">Desde</Label>
              <Input
                id="fechaDesde"
                type="date"
                value={filters.fechaDesde}
                onChange={(e) => setFilters(prev => ({ ...prev, fechaDesde: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="fechaHasta">Hasta</Label>
              <Input
                id="fechaHasta"
                type="date"
                value={filters.fechaHasta}
                onChange={(e) => setFilters(prev => ({ ...prev, fechaHasta: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="revisor">Revisor</Label>
              <Select 
                value={filters.revisor} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, revisor: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {revisoresUnicos.map(revisor => (
                    <SelectItem key={revisor} value={revisor}>{revisor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Panel */}
      {showBulkActions && bulkSelection.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">
              Acciones masivas ({bulkSelection.length} seleccionados)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button 
                onClick={handleBulkApproval} 
                className="bg-green-600 hover:bg-green-700"
                disabled={aprobarSolicitud.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar seleccionados
              </Button>
              
              <Button variant="outline" onClick={() => setBulkSelection([])}>
                Limpiar selección
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowBulkActions(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {/* Select All Checkbox */}
        {profesionalesFiltrados.length > 0 && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
            <Checkbox
              checked={bulkSelection.length === profesionalesFiltrados.length && profesionalesFiltrados.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <Label className="text-sm text-gray-600">
              Seleccionar todos ({profesionalesFiltrados.length})
            </Label>
          </div>
        )}

        {profesionalesFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron solicitudes
              </h3>
              <p className="text-gray-600">
                {filters.busqueda || filters.estado !== 'Todos' || filters.area !== 'Todos' 
                  ? "Intenta ajustar los filtros para ver más resultados."
                  : "No hay solicitudes pendientes en este momento."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          profesionalesFiltrados.map((profesional: Profesional) => (
            <Card key={profesional.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <Checkbox
                      checked={bulkSelection.includes(profesional.id)}
                      onCheckedChange={(checked) => handleBulkSelect(profesional.id, checked as boolean)}
                    />
                    
                    <div className="flex-1 space-y-3">
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {profesional.nombre_completo || `${profesional.nombre || ''} ${profesional.apellidos || ''}`.trim()}
                          </h3>
                          <Badge 
                            variant={
                              profesional.estado_solicitud === 'Aprobado' ? 'default' :
                              profesional.estado_solicitud === 'Rechazado' ? 'destructive' :
                              profesional.estado_solicitud === 'En Revisión' ? 'secondary' :
                              profesional.estado_solicitud === 'Pendiente de Firma' ? 'outline' :
                              'secondary'
                            }
                          >
                            {profesional.estado_solicitud}
                          </Badge>
                          
                          {profesional.urgencia_solicitud && profesional.urgencia_solicitud !== 'Media' && (
                            <Badge 
                              variant={profesional.urgencia_solicitud === 'Alta' ? 'destructive' : 'secondary'}
                            >
                              {profesional.urgencia_solicitud}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedProfesional(profesional)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Detalles de {profesional.nombre_completo}
                                </DialogTitle>
                              </DialogHeader>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Personal Information */}
                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-900 flex items-center">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Información Personal
                                  </h4>
                                  
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">ID Único:</span>
                                      <span className="font-medium">{profesional.id_profesional_unico || 'No asignado'}</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Expediente:</span>
                                      <span className="font-medium">{profesional.codigo_expediente || 'No asignado'}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Email:</span>
                                      <span className="font-medium">{profesional.email || 'No disponible'}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Teléfono:</span>
                                      <span className="font-medium">{profesional.telefono || 'No disponible'}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Género:</span>
                                      <span className="font-medium">{profesional.genero || 'No especificado'}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Edad:</span>
                                      <span className="font-medium">
                                        {profesional.edad ? `${profesional.edad} años` : 'No especificada'}
                                      </span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Nacionalidad:</span>
                                      <span className="font-medium">{profesional.nacionalidad || 'No especificada'}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">DIP:</span>
                                      <span className="font-medium">{profesional.numero_dip || 'No disponible'}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Pasaporte:</span>
                                      <span className="font-medium">{profesional.numero_pasaporte || 'No disponible'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Professional Information */}
                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-900 flex items-center">
                                    <GraduationCap className="h-4 w-4 mr-2" />
                                    Información Profesional
                                  </h4>
                                  
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Área:</span>
                                      <span className="font-medium">{profesional.area_profesional || 'No especificada'}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Especialidad:</span>
                                      <span className="font-medium">{profesional.especialidad || 'No especificada'}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Categoría:</span>
                                      <span className="font-medium">{profesional.categoria_titulacion || 'No especificada'}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Institución:</span>
                                      <span className="font-medium">{profesional.institucion_1 || 'No especificada'}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">País de formación:</span>
                                      <span className="font-medium">{profesional.pais_formacion_1 || 'No especificado'}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Período:</span>
                                      <span className="font-medium">{profesional.periodo_formacion_1 || 'No especificado'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Workplace Information */}
                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-900 flex items-center">
                                    <Building className="h-4 w-4 mr-2" />
                                    Centro de Trabajo
                                  </h4>
                                  
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Centro:</span>
                                      <span className="font-medium">{profesional.nombre_centro || 'No asignado'}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Categoría:</span>
                                      <span className="font-medium">{profesional.categoria_centro || 'No especificada'}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Sector:</span>
                                      <span className="font-medium">{profesional.tipo_sector || 'No especificado'}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Distrito sanitario:</span>
                                      <span className="font-medium">{profesional.distrito_sanitario || 'No especificado'}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Provincia:</span>
                                      <span className="font-medium">{profesional.provincia || 'No especificada'}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Distrito:</span>
                                      <span className="font-medium">{profesional.distrito || 'No especificado'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Documents */}
                                <div className="space-y-4">
                                  <h4 className="font-medium text-gray-900 flex items-center">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Documentos
                                  </h4>
                                  
                                  <div className="space-y-2">
                                    {profesional.pdf_formulario && (
                                      <Button variant="outline" size="sm" className="w-full justify-start">
                                        <Download className="h-4 w-4 mr-2" />
                                        Formulario PDF
                                      </Button>
                                    )}

                                    {profesional.copia_dip && (
                                      <Button variant="outline" size="sm" className="w-full justify-start">
                                        <Download className="h-4 w-4 mr-2" />
                                        Copia DIP
                                      </Button>
                                    )}

                                    {profesional.copia_pasaporte && (
                                      <Button variant="outline" size="sm" className="w-full justify-start">
                                        <Download className="h-4 w-4 mr-2" />
                                        Copia Pasaporte
                                      </Button>
                                    )}

                                    {profesional.foto_carnet && (
                                      <Button variant="outline" size="sm" className="w-full justify-start">
                                        <Download className="h-4 w-4 mr-2" />
                                        Foto Carnet
                                      </Button>
                                    )}

                                    {profesional.documentos_adicionales && profesional.documentos_adicionales.length > 0 && (
                                      <div>
                                        <p className="text-sm text-gray-600 mb-2">Documentos adicionales:</p>
                                        {profesional.documentos_adicionales.map((doc, index) => (
                                          <Button key={index} variant="outline" size="sm" className="w-full justify-start mb-1">
                                            <Download className="h-4 w-4 mr-2" />
                                            Documento {index + 1}
                                          </Button>
                                        ))}
                                      </div>
                                    )}

                                    {profesional.url_carnet && (
                                      <Button variant="outline" size="sm" className="w-full justify-start">
                                        <Download className="h-4 w-4 mr-2" />
                                        Carnet Generado
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Status Information */}
                              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-3">Estado de la Solicitud</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Estado actual:</span>
                                    <Badge className="ml-2" 
                                      variant={
                                        profesional.estado_solicitud === 'Aprobado' ? 'default' :
                                        profesional.estado_solicitud === 'Rechazado' ? 'destructive' :
                                        'secondary'
                                      }
                                    >
                                      {profesional.estado_solicitud}
                                    </Badge>
                                  </div>

                                  {profesional.fecha_solicitud && (
                                    <div>
                                      <span className="text-gray-600">Fecha solicitud:</span>
                                      <span className="ml-2 font-medium">
                                        {new Date(profesional.fecha_solicitud).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}

                                  {profesional.fecha_revision && (
                                    <div>
                                      <span className="text-gray-600">Fecha revisión:</span>
                                      <span className="ml-2 font-medium">
                                        {new Date(profesional.fecha_revision).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}

                                  {profesional.fecha_aprobacion && (
                                    <div>
                                      <span className="text-gray-600">Fecha aprobación:</span>
                                      <span className="ml-2 font-medium">
                                        {new Date(profesional.fecha_aprobacion).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}

                                  {profesional.revisor_solicitud && (
                                    <div>
                                      <span className="text-gray-600">Revisor:</span>
                                      <span className="ml-2 font-medium">{profesional.revisor_solicitud}</span>
                                    </div>
                                  )}

                                  {profesional.urgencia_solicitud && (
                                    <div>
                                      <span className="text-gray-600">Urgencia:</span>
                                      <Badge className="ml-2" 
                                        variant={profesional.urgencia_solicitud === 'Alta' ? 'destructive' : 'secondary'}
                                      >
                                        {profesional.urgencia_solicitud}
                                      </Badge>
                                    </div>
                                  )}
                                </div>

                                {profesional.motivo_rechazo && (
                                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                                    <h5 className="font-medium text-red-800 mb-2">Motivo de rechazo:</h5>
                                    <p className="text-red-700 text-sm">{profesional.motivo_rechazo}</p>
                                  </div>
                                )}

                                {profesional.notas_revision && (
                                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <h5 className="font-medium text-blue-800 mb-2">Notas de revisión:</h5>
                                    <p className="text-blue-700 text-sm">{profesional.notas_revision}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          {profesional.area_profesional || 'Área no especificada'}
                        </div>

                        {profesional.telefono && (
                          <div className="flex items-center text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {profesional.telefono}
                          </div>
                        )}

                        {profesional.email && (
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {profesional.email}
                          </div>
                        )}

                        {profesional.nombre_centro && (
                          <div className="flex items-center text-gray-600">
                            <Building className="h-4 w-4 mr-2" />
                            {profesional.nombre_centro}
                          </div>
                        )}

                        {profesional.provincia && (
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {profesional.provincia}
                          </div>
                        )}

                        {profesional.fecha_solicitud && (
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(profesional.fecha_solicitud).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {/* Additional Info */}
                      {(profesional.id_profesional_unico || profesional.codigo_expediente) && (
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {profesional.id_profesional_unico && (
                            <span>ID: {profesional.id_profesional_unico}</span>
                          )}
                          {profesional.codigo_expediente && (
                            <span>Exp: {profesional.codigo_expediente}</span>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {(profesional.notas_revision || profesional.motivo_rechazo) && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {profesional.motivo_rechazo && (
                            <div className="text-red-700 text-sm">
                              <strong>Motivo de rechazo:</strong> {profesional.motivo_rechazo}
                            </div>
                          )}
                          {profesional.notas_revision && (
                            <div className="text-gray-700 text-sm mt-1">
                              <strong>Notas:</strong> {profesional.notas_revision}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {profesional.estado_solicitud === 'Recibido' && (
                      <Button
                        onClick={() => handleEnviarRevision(profesional)}
                        size="sm"
                        variant="outline"
                        disabled={actualizarProfesional.isPending}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Enviar a Revisión
                      </Button>
                    )}

                    {(profesional.estado_solicitud === 'En Revisión' || profesional.estado_solicitud === 'Recibido') && (
                      <>
                        <Button
                          onClick={() => handleAprobar(profesional)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={aprobarSolicitud.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprobar
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rechazar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Rechazar Solicitud</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="motivo">Motivo del rechazo</Label>
                                <Textarea
                                  id="motivo"
                                  placeholder="Describe el motivo del rechazo..."
                                  onChange={(e) => {
                                    const motivo = e.target.value;
                                    // Store motivo in a way that can be accessed when confirming
                                    (e.target as any).dataset.motivo = motivo;
                                  }}
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline">Cancelar</Button>
                                <Button
                                  variant="destructive"
                                  onClick={(e) => {
                                    const motivo = ((e.target as any).closest('.space-y-4').querySelector('textarea') as HTMLTextAreaElement)?.value || 'No especificado';
                                    handleRechazar(profesional, motivo);
                                  }}
                                  disabled={rechazarSolicitud.isPending}
                                >
                                  Confirmar Rechazo
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RequestsPanel;
