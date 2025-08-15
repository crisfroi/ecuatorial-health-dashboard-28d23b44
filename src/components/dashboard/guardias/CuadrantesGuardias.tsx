import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Users, Clock, Hospital, AlertCircle, Building2 } from 'lucide-react';
import { useHospitalGuardSystem } from '@/hooks/useHospitalGuardSystem';
import CalendarioGuardias from './CalendarioGuardias';
import FormularioGuardia from './FormularioGuardia';
import { Guardia } from '@/types/guardias';
import { toast } from 'sonner';

const CuadrantesGuardias = () => {
  const {
    userHospital,
    userHospitalId,
    isHospitalUser,
    canManageGuards,
    hospitalProfessionals,
    guardProfessionals,
    loadingProfessionals,
    useHospitalGuards,
    hospitalContext
  } = useHospitalGuardSystem();
  
  const [vistaActual, setVistaActual] = useState<'calendario' | 'lista'>('calendario');
  const [showFormulario, setShowFormulario] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingGuard, setEditingGuard] = useState<Guardia | null>(null);
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());

  // Fetch guards for current hospital
  const { data: guardias = [], isLoading: loadingGuardias, error: guardiasError } = useHospitalGuards({
    mes: currentMonth,
    anio: currentYear
  });

  // Calculate statistics
  const estadisticas = React.useMemo(() => {
    const programadas = guardias.filter(g => g.estado === 'planificada').length;
    const activas = guardias.filter(g => g.estado === 'realizada').length;
    const pendientesValidacion = guardias.filter(g => g.validacionEstado === 'pendiente').length;
    const profesionalesUnicos = new Set(guardias.map(g => g.profesionalId)).size;
    
    return {
      programadas,
      activas,
      pendientesValidacion,
      profesionales: profesionalesUnicos
    };
  }, [guardias]);

  const handleCreateGuard = (date?: Date) => {
    if (!canManageGuards) {
      toast.error('No tiene permisos para gestionar guardias');
      return;
    }
    
    setSelectedDate(date || new Date());
    setEditingGuard(null);
    setShowFormulario(true);
  };

  const handleEditGuard = (guard: Guardia) => {
    if (!canManageGuards) {
      toast.error('No tiene permisos para editar guardias');
      return;
    }
    
    setEditingGuard(guard);
    setSelectedDate(guard.fechaInicio);
    setShowFormulario(true);
  };

  const handleCloseFormulario = () => {
    setShowFormulario(false);
    setEditingGuard(null);
    setSelectedDate(null);
  };

  // Check access permissions
  if (!isHospitalUser) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
              <p className="text-gray-600 mb-4">
                Solo los directivos de centros sanitarios pueden acceder a la gestión de guardias.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userHospitalId || !userHospital) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Hospital className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Centro No Asignado</h3>
              <p className="text-gray-600 mb-4">
                Su cuenta no tiene asignado un centro sanitario. 
                Contacte al administrador del sistema para completar la configuración.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Hospital Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cuadrantes de Guardias</h2>
          <div className="flex items-center gap-2 mt-1">
            <Building2 className="w-4 h-4 text-guinea-teal" />
            <span className="text-gray-600">{hospitalContext.hospitalName}</span>
            <Badge variant="outline" className="bg-guinea-light-teal/10">
              {hospitalContext.hospitalCategory}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {hospitalContext.districtName}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={vistaActual === 'calendario' ? 'default' : 'outline'}
            onClick={() => setVistaActual('calendario')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Vista Calendario
          </Button>
          <Button 
            variant={vistaActual === 'lista' ? 'default' : 'outline'}
            onClick={() => setVistaActual('lista')}
          >
            <Users className="w-4 h-4 mr-2" />
            Vista Lista
          </Button>
          <Button 
            onClick={() => handleCreateGuard()}
            className="bg-guinea-teal hover:bg-guinea-dark-teal"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Guardia
          </Button>
        </div>
      </div>

      {/* Hospital Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Profesionales Activos</p>
                <p className="text-xl font-bold text-blue-600">
                  {loadingProfessionals ? '...' : hospitalProfessionals.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Hospital className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">En Sistema Guardias</p>
                <p className="text-xl font-bold text-purple-600">
                  {guardProfessionals.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Guardias Este Mes</p>
                <p className="text-xl font-bold text-green-600">
                  {loadingGuardias ? '...' : guardias.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes Validación</p>
                <p className="text-xl font-bold text-orange-600">
                  {loadingGuardias ? '...' : estadisticas.pendientesValidacion}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Guardias Programadas</p>
                <p className="text-2xl font-bold text-guinea-teal">
                  {loadingGuardias ? '...' : estadisticas.programadas}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-guinea-teal" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Guardias Realizadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {loadingGuardias ? '...' : estadisticas.activas}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes Validación</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {loadingGuardias ? '...' : estadisticas.pendientesValidacion}
                </p>
              </div>
              <Badge variant="outline" className="bg-yellow-50">Pendiente</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profesionales Asignados</p>
                <p className="text-2xl font-bold text-blue-600">
                  {loadingGuardias ? '...' : estadisticas.profesionales}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal */}
      {vistaActual === 'calendario' ? (
        <CalendarioGuardias
          onCreateGuard={handleCreateGuard}
          onEditGuard={handleEditGuard}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Guardias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Vista de lista en desarrollo</p>
              <p className="text-sm">Próximamente: Lista detallada de guardias</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario de Guardia */}
      {showFormulario && (
        <FormularioGuardia
          isOpen={showFormulario}
          onClose={handleCloseFormulario}
          selectedDate={selectedDate}
          editingGuard={editingGuard}
          hospitalId={userHospitalId}
        />
      )}
    </div>
  );
};

export default CuadrantesGuardias;
