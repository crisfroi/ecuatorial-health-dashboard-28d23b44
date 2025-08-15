
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Plus, Download, CheckCircle, Clock, AlertCircle, Euro } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { useCentrosSalud } from '@/hooks/useCentrosSalud';
import { useNominas } from '@/hooks/useGuardSystem';
import { toast } from 'sonner';

const NominasManagement = () => {
  const { user, userRole } = useAuth();
  const { centerContext } = useRoleBasedAccess();
  const { data: centros = [] } = useCentrosSalud();
  
  const [filters, setFilters] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    centroId: centerContext?.centerId || '',
    estado: ''
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

  const { data: nominas = [], isLoading } = useNominas({
    mes: filters.mes,
    anio: filters.anio,
    centroId: filters.centroId || undefined
  });

  const handleFilterChange = (field: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateNomina = () => {
    if (!filters.centroId) {
      toast.error('Debe seleccionar un centro para generar la nómina');
      return;
    }
    
    toast.success('Funcionalidad de generación de nómina en desarrollo');
  };

  const handleValidateNomina = (nominaId: string) => {
    if (!centerContext?.canValidatePayrolls) {
      toast.error('No tienes permisos para validar nóminas');
      return;
    }
    
    toast.success('Funcionalidad de validación en desarrollo');
  };

  const getEstadoBadge = (estado: string) => {
    const colors = {
      'borrador': 'bg-gray-100 text-gray-800',
      'enviada': 'bg-blue-100 text-blue-800',
      'aprobada': 'bg-green-100 text-green-800',
      'rechazada': 'bg-red-100 text-red-800',
      'pagada': 'bg-purple-100 text-purple-800'
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'aprobada':
        return <CheckCircle className="w-4 h-4" />;
      case 'enviada':
        return <Clock className="w-4 h-4" />;
      case 'rechazada':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Calculator className="w-4 h-4" />;
    }
  };

  if (!userRole || !['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO', 'HOSPITAL'].includes(userRole)) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-gray-500">No tienes permisos para acceder a la gestión de nóminas.</p>
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
          <h2 className="text-2xl font-bold">Nóminas de Guardias</h2>
          <p className="text-gray-600">
            {centerContext?.isRestricted 
              ? 'Gestión de nóminas para tu centro asignado'
              : 'Gestión de nóminas del sistema'
            }
          </p>
        </div>
        {(centerContext?.canManageGuards || ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole || '')) && (
          <Button onClick={handleGenerateNomina}>
            <Plus className="w-4 h-4 mr-2" />
            Generar Nómina
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="aprobada">Aprobada</SelectItem>
                  <SelectItem value="rechazada">Rechazada</SelectItem>
                  <SelectItem value="pagada">Pagada</SelectItem>
                </SelectContent>
              </Select>
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
                <Calculator className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Nóminas</p>
                <p className="text-2xl font-bold">{nominas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold">
                  {nominas.filter(n => n.estado === 'aprobada').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold">
                  {nominas.filter(n => ['borrador', 'enviada'].includes(n.estado)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Euro className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Importe Total</p>
                <p className="text-2xl font-bold">
                  {nominas.reduce((sum, n) => sum + n.totalGeneral, 0).toLocaleString()}€
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de nóminas */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Nóminas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Cargando nóminas...</p>
            </div>
          ) : nominas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron nóminas con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Período</th>
                    <th className="text-left p-3">Centro</th>
                    <th className="text-left p-3">Profesionales</th>
                    <th className="text-left p-3">Guardias</th>
                    <th className="text-left p-3">Importe</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="text-left p-3">Fecha Creación</th>
                    <th className="text-left p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {nominas.map((nomina) => (
                    <tr key={nomina.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">
                          {new Date(nomina.anio, nomina.mes - 1).toLocaleDateString('es-ES', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="font-medium">{nomina.centro?.nombre || 'No especificado'}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-medium">{nomina.totalesPorCategoria}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-medium">{nomina.totalesPorTipo}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-medium">
                          {nomina.totalGeneral.toLocaleString()}€
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge className={getEstadoBadge(nomina.estado)}>
                          <div className="flex items-center gap-1">
                            {getEstadoIcon(nomina.estado)}
                            {nomina.estado}
                          </div>
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">
                          {nomina.fechaCreacion.toLocaleDateString('es-ES')}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3 mr-1" />
                            PDF
                          </Button>
                          {centerContext?.canValidatePayrolls && nomina.estado === 'enviada' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleValidateNomina(nomina.id)}
                            >
                              Validar
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

export default NominasManagement;
