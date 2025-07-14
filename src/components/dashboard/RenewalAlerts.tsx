import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar, User, Phone, Mail, MapPin, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Profesional } from '@/hooks/useProfesionales'; // Tu tipo Profesional

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

// ***************************************************************
// REVISADO: Asegúrate que esta ruta sea la correcta para tu proyecto
// y que el componente ProfessionalDetail acepte 'professional: Profesional'
// y 'onClose: () => void' como props.
import ProfessionalDetail from '@/components/dashboard/ProfessionalDetail.tsx'; 
// ***************************************************************

interface RenewalAlertsProps {
  onNavigateToProfessionals?: (filters: any) => void;
}

// Extender el tipo Profesional para incluir los campos calculados para las alertas
// y asegurar que los campos usados existan (ya sea por tu DB o aquí temporalmente)
interface ProfesionalAlert extends Profesional {
  diasRestantes: number;
  prioridad: 'alta' | 'media' | 'baja' | 'vencido';
  // Estos campos deben venir de tu tipo base 'Profesional' si están en Supabase.
  // Los incluimos aquí solo como un recordatorio si tu tipo Profesional no los tuviera aún.
  distrito_sanitario?: string | null; 
  area_profesional?: string | null;
  telefono?: string | null;
  fecha_caducidad?: string | null; // Usado aquí, asegúrate que esté en tu DB
}

const RenewalAlerts = ({ onNavigateToProfessionals }: RenewalAlertsProps) => {
  console.log('RenewalAlerts component rendered.');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<ProfesionalAlert['prioridad'] | 'all' | undefined>('all');
  // ***************************************************************
  // REVISADO: El estado debe guardar el objeto completo 'ProfesionalAlert'
  // para pasarlo a ProfessionalDetail.
  const [selectedProfessional, setSelectedProfessional] = useState<ProfesionalAlert | null>(null);
  // ***************************************************************

  const calculateRenewalInfo = (professional: Profesional): ProfesionalAlert | null => {
    console.log('Calculating renewal info for professional ID:', professional.id_profesional_unico);
    // Usar 'fecha_caducidad' que es la que se consulta en este componente.
    if (!professional.fecha_caducidad) {
      console.log('Professional has no fecha_caducidad. Skipping.');
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
      console.log(`Professional ${professional.id_profesional_unico} - Days remaining: ${diffDays}, Priority: ${prioridad}`);
      return {
        ...professional,
        diasRestantes: diffDays,
        prioridad: prioridad,
      };
    }
    console.log('Professional not within 90-day alert range. Skipping.');
    return null;
  };

  const { data: professionalsData = [], isLoading, isError } = useQuery<ProfesionalAlert[]>({
    queryKey: ['renewalAlerts'],
    queryFn: async () => {
      console.log('Starting Supabase data fetch for renewal alerts...');
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 90);

      const todayIso = today.toISOString().split('T')[0];
      const futureDateIso = futureDate.toISOString().split('T')[0];

      console.log(`Fetching data from Supabase for fecha_caducidad between ${todayIso} and ${futureDateIso}, and estado_solicitud = 'Aprobado'.`);

      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select('*') // Select all columns to ensure you get all needed fields
        .lte('fecha_caducidad', futureDateIso)
        .gte('fecha_caducidad', todayIso)
        .eq('estado_solicitud', 'Aprobado')
        .order('fecha_caducidad', { ascending: true });

      if (error) {
        console.error('Error fetching renewal alerts from Supabase:', error);
        throw error;
      }
      console.log(`Successfully fetched ${data ? data.length : 0} raw professionals from Supabase.`);

      const processedAlerts: ProfesionalAlert[] = [];
      data.forEach(prof => {
        const alertInfo = calculateRenewalInfo(prof);
        if (alertInfo) {
          processedAlerts.push(alertInfo);
        }
      });
      console.log(`Finished processing raw data. ${processedAlerts.length} alerts generated.`);
      return processedAlerts;
    }
  });

  const filteredRenewalAlerts = professionalsData.filter(alert => {
    console.log(`Filtering alert for ${alert.nombre_completo}: current priority ${alert.prioridad}, selected filter ${selectedPriorityFilter}`);
    if (selectedPriorityFilter === 'all') {
      return true;
    }
    return alert.prioridad === selectedPriorityFilter;
  });
  console.log(`Displaying ${filteredRenewalAlerts.length} alerts after filter by priority.`);

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'media': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'baja': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'vencido': return 'bg-gray-200 text-gray-700 border-gray-300 line-through';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewAll = (prioridad?: ProfesionalAlert['prioridad'] | 'all') => {
    console.log('Handle View All clicked. Setting filter to:', prioridad || 'all');
    setSelectedPriorityFilter(prioridad || 'all');
    if (onNavigateToProfessionals) {
      console.log('Calling onNavigateToProfessionals with:', { type: 'renewal', value: prioridad || 'all_upcoming_renewals' });
      onNavigateToProfessionals({
        type: 'renewal',
        value: prioridad || 'all_upcoming_renewals'
      });
    }
  };

  const handleViewProfessionalDetail = (professional: ProfesionalAlert) => {
    console.log('Opening professional detail for:', professional.id_profesional_unico);
    setSelectedProfessional(professional);
  };

  console.log(`Component rendering complete. Is loading: ${isLoading}, Is error: ${isError}.`);

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
                    {/* *************************************************************** */}
                    {/* REVISADO: Pasar el objeto 'professional' completo y la función 'onClose' */}
                    {selectedProfessional && (
                      <DialogContent className="sm:max-w-[700px] h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detalles del Profesional</DialogTitle>
                          <DialogDescription>
                            Información completa de {selectedProfessional.nombre_completo}.
                          </DialogDescription>
                        </DialogHeader>
                        <ProfessionalDetail 
                          professional={selectedProfessional} // Pasar el objeto completo
                          onClose={() => setSelectedProfessional(null)} // Función para cerrar el diálogo desde ProfessionalDetail (opcional si ya manejas con onOpenChange)
                        />
                      </DialogContent>
                    )}
                    {/* *************************************************************** */}
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
