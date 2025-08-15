
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Filter, Download, Clock, User, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { useCentrosSalud } from '@/hooks/useCentrosSalud';
import { useGuardias } from '@/hooks/useGuardSystem';
import { toast } from 'sonner';

const GuardiasManagement = () => {
  const { user, userRole } = useAuth();
  const { centerContext, canAccessCenter } = useRoleBasedAccess();
  const { data: centros = [] } = useCentrosSalud();
  
  const [filters, setFilters] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    centroId: centerContext?.centerId || '',
    estado: '',
    profesionalId: ''
  });

  // Filtrar centros según el rol del usuario
  const availableCenters = useMemo(() => {
    if (!userRole) return [];

    if (['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole)) {
      return centros;
    }

    if (centerContext?.centerId) {
      return centros.filter(centro => centro.id === centerContext.centerId);
    }

    return [];
  }, [centros, userRole, centerContext]);

  const { data: guardias = [], isLoading } = useGuardias({
    mes: filters.mes,
    anio: filters.anio,
    centroId: filters.centroId,
    estado: filters.estado || undefined,
    profesionalId: filters.profesionalId || undefined
  });

  const handleFilterChange = (field: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleExportData = () => {
    if (!guardias.length) {
      toast.error('No hay datos para exportar');
      return;
    }
    
    // Implementar exportación
    toast.success('Funcionalidad de exportación en desarrollo');
  };

  const getEstadoBadge = (estado: string) => {
    const colors = {
      'planificada': 'bg-blue-100 text-blue-800',
      'en_curso': 'bg-yellow-100 text-yellow-800',
      'completada': 'bg-green-100 text-green-800',
      'cancelada': 'bg-red-100 text-red-800'
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getValidacionBadge = (estado: string) => {
    const colors = {
      'pendiente': 'bg-gray-100 text-gray-800',
      'validada': 'bg-green-100 text-green-800',
      'rechazada': 'bg-red-100 text-red-800'
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!userRole || !['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO', 'HOSPITAL'].includes(userRole)) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-gray-500">No tienes permisos para acceder a la gestión de guardias.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Guardias</h2>
          <p className="text-gray-600">
            {centerContext?.isRestricted 
              ? `Gestión de guardias para tu centro asignado`
              : `Gestión de guardias del sistema`
            }
          </p>
        </div>
        {centerContext?.canManageGuards && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Guardia
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium">Mes</label>
              <Select
                value={filters.mes.toString()}
                onValueChange={(value) => handleFilterChange('mes', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2024, i).toLocaleDateString('es-ES', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Año</label>
              <Select
                value={filters.anio.toString()}
                onValueChange={(value) => handleFilterChange('anio', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {!centerContext?.isRestricted && (
              <div>
                <label className="text-sm font-medium">Centro</label>
                <Select
                  value={filters.centroId}
                  onValueChange={(value) => handleFilterChange('centroId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los centros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los centros</SelectItem>
                    {availableCenters.map((centro) => (
                      <SelectItem key={centro.id} value={centro.id}>
                        {centro.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Estado</label>
              <Select
                value={filters.estado}
                onValueChange={(value) => handleFilterChange('estado', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  <SelectItem value="planificada">Planificada</SelectItem>
                  <SelectItem value="en_curso">En Curso</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleExportData} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Guardias</p>
                <p className="text-2xl font-bold">{guardias.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold">
                  {guardias.filter(g => g.estado === 'completada').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <User className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">En Curso</p>
                <p className="text-2xl font-bold">
                  {guardias.filter(g => g.estado === 'en_curso').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Centros</p>
                <p className="text-2xl font-bold">{availableCenters.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de guardias */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Guardias</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Cargando guardias...</p>
            </div>
          ) : guardias.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron guardias con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Fecha</th>
                    <th className="text-left p-3">Profesional</th>
                    <th className="text-left p-3">Centro</th>
                    <th className="text-left p-3">Tipo</th>
                    <th className="text-left p-3">Horas</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="text-left p-3">Validación</th>
                    <th className="text-left p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {guardias.map((guardia) => (
                    <tr key={guardia.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="font-medium">
                            {guardia.fechaInicio.toLocaleDateString('es-ES')}
                          </div>
                          <div className="text-gray-500">
                            {guardia.fechaInicio.toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} - {guardia.fechaFin.toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="font-medium">{guardia.profesional?.nombre || 'No asignado'}</div>
                          <div className="text-gray-500">{guardia.profesional?.area}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="font-medium">{guardia.centro?.nombre || 'No asignado'}</div>
                          <div className="text-gray-500">{guardia.centro?.categoria}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {guardia.tipo}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-medium">{guardia.horas}h</span>
                      </td>
                      <td className="p-3">
                        <Badge className={getEstadoBadge(guardia.estado)}>
                          {guardia.estado}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={getValidacionBadge(guardia.validacionEstado)}>
                          {guardia.validacionEstado}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            Ver
                          </Button>
                          {centerContext?.canManageGuards && (
                            <Button size="sm" variant="outline">
                              Editar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GuardiasManagement;
