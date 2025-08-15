import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGuardias } from '@/hooks/useGuardSystem';
import { useGuardiasStore } from '@/stores/useGuardiasStore';
import { Guardia, EstadoGuardia, TipoGuardia } from '@/types/guardias';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarioGuardiasProps {
  onCreateGuard?: (date: Date) => void;
  onEditGuard?: (guard: Guardia) => void;
  readOnly?: boolean;
}

const CalendarioGuardias: React.FC<CalendarioGuardiasProps> = ({
  onCreateGuard,
  onEditGuard,
  readOnly = false
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedGuard, setSelectedGuard] = useState<Guardia | null>(null);
  const [showGuardDialog, setShowGuardDialog] = useState(false);
  
  const { selectedHospital, selectedMes, selectedAnio } = useGuardiasStore();
  
  const { data: guardias = [], isLoading } = useGuardias({
    centroId: selectedHospital,
    mes: currentDate.getMonth() + 1,
    anio: currentDate.getFullYear()
  });

  // Calendar navigation
  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = new Date(monthStart);
    const endDate = new Date(monthEnd);
    
    // Adjust to start from Monday
    const dayOfWeek = monthStart.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);
    
    // Ensure we have 6 weeks
    endDate.setDate(endDate.getDate() + (42 - ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Get guards for a specific date
  const getGuardsForDate = (date: Date): Guardia[] => {
    return guardias.filter(guard => 
      isSameDay(guard.fechaInicio, date) || 
      (guard.fechaInicio <= date && guard.fechaFin >= date)
    );
  };

  // Guard type styling
  const getGuardTypeStyle = (tipo: TipoGuardia) => {
    switch (tipo) {
      case 'fisica':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'localizable':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'administrativa':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Guard status icon
  const getStatusIcon = (estado: EstadoGuardia) => {
    switch (estado) {
      case 'realizada':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'no_presentado':
        return <XCircle className="w-3 h-3 text-red-600" />;
      case 'planificada':
        return <Clock className="w-3 h-3 text-blue-600" />;
      case 'borrador':
        return <AlertCircle className="w-3 h-3 text-yellow-600" />;
      default:
        return null;
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayGuards = getGuardsForDate(date);
    
    if (dayGuards.length === 1) {
      setSelectedGuard(dayGuards[0]);
      setShowGuardDialog(true);
    } else if (dayGuards.length > 1) {
      // Show multi-guard dialog or list
      setShowGuardDialog(true);
    } else if (!readOnly && onCreateGuard) {
      onCreateGuard(date);
    }
  };

  const handleGuardClick = (guard: Guardia, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedGuard(guard);
    setShowGuardDialog(true);
  };

  const getDayGuardsSummary = (date: Date) => {
    const dayGuards = getGuardsForDate(date);
    const fisicas = dayGuards.filter(g => g.tipo === 'fisica').length;
    const localizables = dayGuards.filter(g => g.tipo === 'localizable').length;
    const administrativas = dayGuards.filter(g => g.tipo === 'administrativa').length;
    
    return { fisicas, localizables, administrativas, total: dayGuards.length };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-guinea-teal"></div>
            <span className="ml-2">Cargando calendario...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-guinea-teal" />
              Calendario de Guardias
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="min-w-[200px] text-center font-medium">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </span>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Física</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Localizable</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Administrativa</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map(date => {
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isToday = isSameDay(date, new Date());
              const dayGuards = getGuardsForDate(date);
              const summary = getDayGuardsSummary(date);
              
              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    'min-h-[100px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors',
                    !isCurrentMonth && 'bg-gray-50 text-gray-400',
                    isToday && 'bg-blue-50 border-blue-300',
                    dayGuards.length > 0 && 'bg-guinea-light-teal/10'
                  )}
                  onClick={() => handleDateClick(date)}
                >
                  {/* Date number */}
                  <div className={cn(
                    'flex items-center justify-between mb-1',
                    isToday && 'text-blue-600 font-bold'
                  )}>
                    <span className="text-sm">{format(date, 'd')}</span>
                    {!readOnly && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateGuard?.(date);
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Guard summary */}
                  {summary.total > 0 && (
                    <div className="space-y-1">
                      {summary.fisicas > 0 && (
                        <div className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">
                          {summary.fisicas} Física{summary.fisicas > 1 ? 's' : ''}
                        </div>
                      )}
                      {summary.localizables > 0 && (
                        <div className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                          {summary.localizables} Local.
                        </div>
                      )}
                      {summary.administrativas > 0 && (
                        <div className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                          {summary.administrativas} Admin.
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Individual guards (if space allows) */}
                  {dayGuards.slice(0, 2).map((guard, index) => (
                    <div
                      key={guard.id}
                      className={cn(
                        'text-xs p-1 mt-1 rounded border cursor-pointer hover:shadow-sm',
                        getGuardTypeStyle(guard.tipo)
                      )}
                      onClick={(e) => handleGuardClick(guard, e)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate flex-1">
                          {guard.profesional?.nombre?.split(' ')[0] || 'Profesional'}
                        </span>
                        {getStatusIcon(guard.estado)}
                      </div>
                      <div className="text-xs opacity-75">
                        {format(guard.fechaInicio, 'HH:mm')} - {format(guard.fechaFin, 'HH:mm')}
                      </div>
                    </div>
                  ))}
                  
                  {/* More guards indicator */}
                  {dayGuards.length > 2 && (
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      +{dayGuards.length - 2} más
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Guard Detail Dialog */}
      <Dialog open={showGuardDialog} onOpenChange={setShowGuardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedGuard ? 'Detalles de Guardia' : 'Guardias del Día'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedGuard ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={getGuardTypeStyle(selectedGuard.tipo)}>
                  {selectedGuard.tipo.charAt(0).toUpperCase() + selectedGuard.tipo.slice(1)}
                </Badge>
                <div className="flex items-center gap-1">
                  {getStatusIcon(selectedGuard.estado)}
                  <span className="text-sm text-gray-600">{selectedGuard.estado}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{selectedGuard.profesional?.nombre || 'Profesional no asignado'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>
                    {format(selectedGuard.fechaInicio, 'dd/MM/yyyy HH:mm')} - 
                    {format(selectedGuard.fechaFin, 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{selectedGuard.centro?.nombre || 'Centro no especificado'}</span>
                </div>
                
                {selectedGuard.observaciones && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <h4 className="text-sm font-medium mb-1">Observaciones:</h4>
                    <p className="text-sm text-gray-600">{selectedGuard.observaciones}</p>
                  </div>
                )}
                
                {selectedGuard.tipo === 'localizable' && selectedGuard.localizableActivada && (
                  <div className="mt-3 p-3 bg-blue-50 rounded">
                    <h4 className="text-sm font-medium mb-1">Información de Llamada:</h4>
                    {selectedGuard.horaLlamada && (
                      <p className="text-sm">
                        <strong>Hora llamada:</strong> {format(selectedGuard.horaLlamada, 'HH:mm')}
                      </p>
                    )}
                    {selectedGuard.horaLlegada && (
                      <p className="text-sm">
                        <strong>Hora llegada:</strong> {format(selectedGuard.horaLlegada, 'HH:mm')}
                      </p>
                    )}
                    {selectedGuard.servicioAtendido && (
                      <p className="text-sm">
                        <strong>Servicio:</strong> {selectedGuard.servicioAtendido}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {!readOnly && onEditGuard && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => {
                      onEditGuard(selectedGuard);
                      setShowGuardDialog(false);
                    }}
                    className="flex-1"
                  >
                    Editar Guardia
                  </Button>
                </div>
              )}
            </div>
          ) : selectedDate && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Guardias para {format(selectedDate, 'dd/MM/yyyy', { locale: es })}
              </p>
              
              <div className="space-y-2">
                {getGuardsForDate(selectedDate).map(guard => (
                  <div
                    key={guard.id}
                    className={cn(
                      'p-3 rounded border cursor-pointer hover:shadow-sm',
                      getGuardTypeStyle(guard.tipo)
                    )}
                    onClick={() => {
                      setSelectedGuard(guard);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {guard.profesional?.nombre || 'Profesional'}
                      </span>
                      {getStatusIcon(guard.estado)}
                    </div>
                    <div className="text-sm opacity-75">
                      {guard.tipo} • {format(guard.fechaInicio, 'HH:mm')} - {format(guard.fechaFin, 'HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
              
              {!readOnly && onCreateGuard && (
                <Button 
                  onClick={() => {
                    onCreateGuard(selectedDate);
                    setShowGuardDialog(false);
                  }}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Nueva Guardia
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CalendarioGuardias;
