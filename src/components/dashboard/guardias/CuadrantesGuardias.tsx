import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Users, Clock, Hospital, AlertCircle } from 'lucide-react';
import { useGuardiasStore } from '@/stores/useGuardiasStore';
import { useGuardias } from '@/hooks/useGuardSystem';
import { usePublicHospitals } from '@/hooks/useRealProfesionales';
import CalendarioGuardias from './CalendarioGuardias';
import { Guardia } from '@/types/guardias';
import { toast } from 'sonner';

const CuadrantesGuardias = () => {
  const { 
    selectedMes, 
    selectedAnio, 
    selectedHospital,
    setSelectedHospital,
    loadHospitalesPublicos,
    hospitalesPublicos,
    isConnectedToSupabase,
    checkSupabaseConnection,
    loading,
    error
  } = useGuardiasStore();
  
  const [vistaActual, setVistaActual] = useState<'calendario' | 'lista'>('calendario');
  const [showFormulario, setShowFormulario] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingGuard, setEditingGuard] = useState<Guardia | null>(null);

  // Load public hospitals on component mount
  useEffect(() => {
    const initializeData = async () => {
      await checkSupabaseConnection();
      if (isConnectedToSupabase) {
        await loadHospitalesPublicos();
      }
    };
    
    initializeData();
  }, []);

  // Fetch guards data
  const { data: guardias = [], isLoading: loadingGuardias, error: guardiasError } = useGuardias({
    centroId: selectedHospital,
    mes: selectedMes,
    anio: selectedAnio
  });

  // Show warning if database tables don't exist yet
  React.useEffect(() => {
    if (guardiasError) {
      console.warn('Guardias error in CuadrantesGuardias:', guardiasError);
    }
  }, [guardiasError]);

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
    if (!selectedHospital) {
      toast.error('Debe seleccionar un hospital primero');
      return;
    }
    
    setSelectedDate(date || new Date());
    setEditingGuard(null);
    setShowFormulario(true);
  };

  const handleEditGuard = (guard: Guardia) => {
    setEditingGuard(guard);
    setSelectedDate(guard.fechaInicio);
    setShowFormulario(true);
  };

  const handleCloseFormulario = () => {
    setShowFormulario(false);
    setEditingGuard(null);
    setSelectedDate(null);
  };

  if (!isConnectedToSupabase) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error de Conexión</h3>
              <p className="text-gray-600 mb-4">
                No se pudo conectar con la base de datos.
              </p>
              <Button onClick={checkSupabaseConnection}>
                Reintentar Conexión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cuadrantes de Guardias</h2>
          <p className="text-gray-600">
            Gestión y programación de guardias médicas
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
          <Button onClick={() => handleCreateGuard()}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Guardia
          </Button>
        </div>
      </div>

      {/* Hospital Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Hospital className="w-5 h-5 text-guinea-teal" />
            <div className="flex-1 max-w-md">
              <Select
                value={selectedHospital}
                onValueChange={setSelectedHospital}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar hospital..." />
                </SelectTrigger>
                <SelectContent>
                  {hospitalesPublicos.map((hospital) => (
                    <SelectItem key={hospital.id} value={hospital.id}>
                      {hospital.nombre} - {hospital.distrito_sanitario}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedHospital && (
              <Badge variant="outline" className="bg-guinea-light-teal/10">
                Hospital Seleccionado
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
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
                <p className="text-sm font-medium text-gray-600">Profesionales</p>
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
      {selectedHospital ? (
        vistaActual === 'calendario' ? (
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
        )
      ) : (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-gray-500">
              <Hospital className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Seleccione un Hospital</p>
              <p>Para gestionar las guardias, primero debe seleccionar un hospital público.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CuadrantesGuardias;
