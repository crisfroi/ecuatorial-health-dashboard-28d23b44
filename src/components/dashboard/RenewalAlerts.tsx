import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar, User, Phone, Mail, MapPin, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Profesional } from '@/hooks/useProfesionales';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ProfessionalDetail from '@/components/dashboard/ProfessionalDetail.tsx'; 

interface RenewalAlertsProps {
  onNavigateToProfessionals?: (filters: any) => void;
}

interface ProfesionalAlert extends Profesional {
  diasRestantes: number;
  prioridad: 'alta' | 'media' | 'baja' | 'vencido';
  distrito_sanitario?: string | null;
  area_profesional?: string | null;
  email?: string | null;
}

const RenewalAlerts = ({ onNavigateToProfessionals }: RenewalAlertsProps) => {
  console.log('RenewalAlerts component rendered.'); // Log de renderizado inicial
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<ProfesionalAlert['prioridad'] | 'all' | undefined>('all');
  const [selectedProfessional, setSelectedProfessional] = useState<ProfesionalAlert | null>(null);

  const calculateRenewalInfo = (professional: Profesional): ProfesionalAlert | null => {
    console.log('Calculating renewal info for professional:', professional.id_profesional_unico); // Log de inicio de cálculo
    if (!professional.fecha_caducidad) {
      console.log('Professional has no fecha_caducidad. Skipping.'); // Log si no hay fecha de caducidad
      return null;
    }

    const today = new Date();
    const expiryDate = new Date(professional.fecha_caducidad);
    expiryDate.setHours(23, 59, 59, 999);

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let prioridad: 'alta' | 'media' | 'baja' | 'vencido';
    if (diffDays <= 0) {
      prioridad = 'vencido';
    } else if (diffDays < 30) {
      prioridad = 'alta';
    } else if (diffDays >= 30 && diffDays < 60) {
      prioridad = 'media';
    } else {
      prioridad = 'baja';
    }

    if (diffDays <= 90 || diffDays <= 0) {
      console.log(`Professional ${professional.id_profesional_unico} - Days remaining: ${diffDays}, Priority: ${prioridad}`); // Log de resultado de cálculo
      return {
        ...professional,
        diasRestantes: diffDays,
        prioridad: prioridad,
      };
    }
    console.log('Professional not within 90-day alert range. Skipping.'); // Log si está fuera del rango
    return null;
  };

  const { data: professionalsData = [], isLoading, isError } = useQuery<ProfesionalAlert[]>({
    queryKey: ['renewalAlerts'],
    queryFn: async () => {
      console.log('Starting Supabase data fetch for renewal alerts...'); // Log de inicio de fetch
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 90);

      const todayIso = today.toISOString().split('T')[0];
      const futureDateIso = futureDate.toISOString().split('T')[0];

      console.log(`Fetching data from Supabase for fecha_caducidad between ${todayIso} and ${futureDateIso}, and estado_solicitud = 'Aprobado'.`); // Log de parámetros de consulta

      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select('*')
        .lte('fecha_caducidad', futureDateIso)
        .gte('fecha_caducidad', todayIso)
        .eq('estado_solicitud', 'Aprobado')
        .order('fecha_caducidad', { ascending: true });

      if (error) {
        console.error('Error fetching renewal alerts from Supabase:', error); // Log de error de Supabase
        throw error;
      }
      console.log(`Successfully fetched ${data ? data.length : 0} raw professionals from Supabase.`); // Log de datos brutos obtenidos

      const processedAlerts: ProfesionalAlert[] = [];
      data.forEach(prof => {
        const alertInfo = calculateRenewalInfo(prof);
        if (alertInfo) {
          processedAlerts.push(alertInfo);
        }
      });
      console.log(`Finished processing raw data. ${processedAlerts.length} alerts generated.`); // Log de procesamiento de alertas
      return processedAlerts;
    }
  });

  const filteredRenewalAlerts = professionalsData.filter(alert => {
    console.log(`Filtering alert for ${alert.nombre_completo}: current priority ${alert.prioridad}, selected filter ${selectedPriorityFilter}`); // Log de filtrado por alerta
    if (selectedPriorityFilter === 'all') {
      return true;
    }
    return alert.prioridad === selectedPriorityFilter;
  });
  console.log(`Displaying ${filteredRenewalAlerts.length} alerts after filter by priority.`); // Log de alertas finales a mostrar

  const getPriorityColor = (prioridad: string) => {
    // console.log('Getting color for priority:', prioridad); // Este log puede ser muy ruidoso, úsalo si es necesario
    switch (prioridad) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'media': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'baja': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'vencido': return 'bg-gray-200 text-gray-700 border-gray-300 line-through';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewAll = (prioridad?: ProfesionalAlert['prioridad'] | 'all') => {
    console.log('Handle View All clicked. Setting filter to:', prioridad || 'all'); // Log de clic en "Ver Todos"
    setSelectedPriorityFilter(prioridad || 'all');
    if (onNavigateToProfessionals) {
      console.log('Calling onNavigateToProfessionals with:', { type: 'renewal', value: prioridad || 'all_upcoming_renewals' }); // Log de navegación
      onNavigateToProfessionals({
        type: 'renewal',
        value: prioridad || 'all_upcoming_renewals'
      });
    }
  };

  const handleViewProfessionalDetail = (professional: ProfesionalAlert) => {
    console.log('Opening professional detail for:', professional.id_profesional_unico); // Log de apertura de detalles
    setSelectedProfessional(professional);
  };

  console.log(`Component rendering complete. Is loading: ${isLoading}, Is error: ${isError}.`); // Log antes del return final

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span>Alertas de Renovación</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {filteredRenewalAlerts.length} pendientes
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Ver Todos <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filtrar por Urgencia</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleViewAll('all')}>
                  Todas las alertas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewAll('alta')}>
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span> Alta Urgencia
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewAll('media')}>
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-2"></span> Media Urgencia
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewAll('baja')}>
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span> Baja Urgencia
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewAll('vencido')}>
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-gray-500 mr-2"></span> Vencidos
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-center text-gray-500">Cargando alertas...</p>}
        {isError && <p className="text-center text-red-500">Error al cargar las alertas.</p>}
        {!isLoading && !isError && filteredRenewalAlerts.length === 0 && (
          <p className="text-center text-gray-500">No hay alertas de renovación próximas con este filtro.</p>
        )}
        <div className="space-y-4">
          {filteredRenewalAlerts.map((alert) => (
            <Alert
              key={alert.id_profesional_unico}
              className={`${getPriorityColor(alert.prioridad)} cursor-pointer hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{alert.nombre_completo}</span>
                    <Badge variant="outline" className="text-xs">
                      {alert.area_profesional || 'Sin profesión'}
                    </Badge>
                  </div>

                  <AlertDescription className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Vence: {alert.fecha_caducidad ? new Date(alert.fecha_caducidad).toLocaleDateString('es-ES') : 'N/A'}
                      </span>
                      <span className="font-medium">
                        {alert.diasRestantes <= 0 ? '(Vencido)' : `(${alert.diasRestantes} días)`}
                      </span>
                    </div>

                    {alert.distrito_sanitario && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>Distrito: {alert.distrito_sanitario}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      {alert.telefono && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{alert.telefono}</span>
                        </div>
                      )}
                      {alert.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>{alert.email}</span>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </div>

                <div className="flex flex-col space-y-1">
                  <Button variant="outline" size="sm" className="text-xs">
                    Notificar
                  </Button>
                  <Dialog onOpenChange={(open) => {
                    if (!open) setSelectedProfessional(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleViewProfessionalDetail(alert)}
                      >
                        Ver Detalle
                      </Button>
                    </DialogTrigger>
                    {selectedProfessional && (
                      <DialogContent className="sm:max-w-[700px] h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detalles del Profesional</DialogTitle>
                          <DialogDescription>
                            Información completa de {selectedProfessional.nombre_completo}.
                          </DialogDescription>
                        </DialogHeader>
                        <ProfessionalDetail professionalId={selectedProfessional.id_profesional_unico!} />
                      </DialogContent>
                    )}
                  </Dialog>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RenewalAlerts;
