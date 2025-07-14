import { useState } from 'react'; // Importar useState para el estado del diálogo
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar, User, Phone, Mail, MapPin, ChevronDown } from 'lucide-react'; // Importar MapPin y ChevronDown
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client'; // Tu cliente de Supabase
import type { Profesional } from '@/hooks/useProfesionales'; // Tu tipo Profesional

// Importar componentes de Shadcn UI para el diálogo y el dropdown
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

// Asume que ProfessionalDetail está en esta ruta. Ajusta si es diferente.
import ProfessionalDetail from '@/components/dashboard/ProfessionalDetail'; 

interface RenewalAlertsProps {
  onNavigateToProfessionals?: (filters: any) => void;
}

// Extender el tipo Profesional para incluir los campos calculados para las alertas
interface ProfesionalAlert extends Profesional {
  diasRestantes: number;
  prioridad: 'alta' | 'media' | 'baja' | 'vencido';
}

const RenewalAlerts = ({ onNavigateToProfessionals }: RenewalAlertsProps) => {
  // Estado para el filtro de prioridad seleccionado en el Dropdown
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<ProfesionalAlert['prioridad'] | 'all' | undefined>('all');

  // Estado para el diálogo del detalle del profesional
  const [selectedProfessional, setSelectedProfessional] = useState<Profesional | null>(null);

  // Función para calcular los días restantes y la prioridad de renovación
  const calculateRenewalInfo = (professional: Profesional): ProfesionalAlert | null => {
    if (!professional.fecha_caducidad) {
      return null; // No se puede calcular si no hay fecha de caducidad
    }

    const today = new Date();
    // Asegurarse de que la fecha de caducidad se trate al final del día para un cálculo inclusivo
    const expiryDate = new Date(professional.fecha_caducidad);
    expiryDate.setHours(23, 59, 59, 999); // Establecer al final del día

    // Calcular la diferencia en milisegundos y luego convertir a días
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Redondeamos hacia arriba para incluir el día actual

    let prioridad: 'alta' | 'media' | 'baja' | 'vencido';
    if (diffDays <= 0) {
      prioridad = 'vencido';
    } else if (diffDays < 30) {
      prioridad = 'alta';
    } else if (diffDays >= 30 && diffDays < 60) {
      prioridad = 'media';
    } else { // diffDays >= 60 && diffDays <= 90
      prioridad = 'baja';
    }

    // Solo devolver si está dentro del rango de interés (hasta 90 días o vencido)
    if (diffDays <= 90 || diffDays <= 0) { // Importante incluir vencidos aquí
      return {
        ...professional,
        diasRestantes: diffDays,
        prioridad: prioridad,
      };
    }
    return null;
  };

  // Hook de React Query para obtener los profesionales con alerta de renovación
  const { data: professionalsData = [], isLoading, isError } = useQuery<ProfesionalAlert[]>({
    queryKey: ['renewalAlerts'],
    queryFn: async () => {
      const today = new Date();
      // Calcular la fecha límite (hoy + 90 días)
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 90);

      // Formatear fechas a ISO string para la consulta de Supabase (ej. 'YYYY-MM-DD')
      const todayIso = today.toISOString().split('T')[0];
      const futureDateIso = futureDate.toISOString().split('T')[0];

      // Consulta a Supabase para obtener profesionales cuya fecha de caducidad
      // esté entre hoy y los próximos 90 días, Y CON ESTADO 'Aprobado'
      const { data, error } = await supabase
        .from('profesionales_sanitarios') // Tu tabla de profesionales
        .select('*')
        .lte('fecha_caducidad', futureDateIso) // Menor o igual a la fecha futura
        .gte('fecha_caducidad', todayIso)    // Mayor o igual a hoy (incluye vencidos hoy)
        .eq('estado_solicitud', 'Aprobado')
        .order('fecha_caducidad', { ascending: true }); // Ordenar por fecha de caducidad

      if (error) {
        console.error('Error fetching renewal alerts:', error);
        throw error;
      }

      // Procesar los datos para calcular diasRestantes y prioridad
      const processedAlerts: ProfesionalAlert[] = [];
      data.forEach(prof => {
        const alertInfo = calculateRenewalInfo(prof);
        if (alertInfo) {
          processedAlerts.push(alertInfo);
        }
      });
      return processedAlerts;
    }
  });

  // Filtrar las alertas mostradas basándose en selectedPriorityFilter
  const filteredRenewalAlerts = renewalAlerts.filter(alert => {
    if (selectedPriorityFilter === 'all') {
      return true; // Mostrar todas las alertas
    }
    return alert.prioridad === selectedPriorityFilter;
  });

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'baja':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'vencido':
        return 'bg-gray-200 text-gray-700 border-gray-300 line-through';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewAll = (prioridad?: ProfesionalAlert['prioridad'] | 'all') => {
    setSelectedPriorityFilter(prioridad || 'all'); // Actualiza el filtro local
    if (onNavigateToProfessionals) {
      console.log('Navigating to all renewal alerts with priority:', prioridad);
      // Pasa el filtro al componente padre si lo necesita
      onNavigateToProfessionals({
        type: 'renewal',
        value: prioridad || 'all_upcoming_renewals'
      });
    }
  };

  // Esta función ahora solo establece el profesional seleccionado para el Dialog
  const handleViewProfessionalDetail = (professional: ProfesionalAlert) => {
    setSelectedProfessional(professional);
  };

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

            {/* Dropdown para el botón "Ver Todos" con filtro de prioridad */}
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
              // El onClick principal de la alerta ya no abre el detalle, lo hace el botón dentro
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

                    {/* NUEVO CAMPO: Distrito Sanitario */}
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
                  {/* Botón "Ver Detalle" ahora abre el Dialog */}
                  <Dialog onOpenChange={(open) => {
                    // Si el diálogo se cierra, limpia el profesional seleccionado
                    if (!open) setSelectedProfessional(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleViewProfessionalDetail(alert)} // Establece el profesional al hacer clic
                      >
                        Ver Detalle
                      </Button>
                    </DialogTrigger>
                    {selectedProfessional && ( // Renderiza el DialogContent solo si hay un profesional seleccionado
                      <DialogContent className="sm:max-w-[700px] h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detalles del Profesional</DialogTitle>
                          <DialogDescription>
                            Información completa de {selectedProfessional.nombre_completo}.
                          </DialogDescription>
                        </DialogHeader>
                        {/* Aquí renderizamos el componente ProfessionalDetail */}
                        <ProfessionalDetail professionalId={selectedProfessional.id_profesional_unico} />
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

export default RenewalAlerts;import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar, User, Phone, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client'; // Tu cliente de Supabase
import type { Profesional } from '@/hooks/useProfesionales'; // Tu tipo Profesional

interface RenewalAlertsProps {
  onNavigateToProfessionals?: (filters: any) => void;
}

// Extender el tipo Profesional para incluir los campos calculados para las alertas
interface ProfesionalAlert extends Profesional {
  diasRestantes: number;
  prioridad: 'alta' | 'media' | 'baja' | 'vencido';
}

const RenewalAlerts = ({ onNavigateToProfessionals }: RenewalAlertsProps) => {

  // Función para calcular los días restantes y la prioridad de renovación
  const calculateRenewalInfo = (professional: Profesional): ProfesionalAlert | null => {
    if (!professional.fecha_caducidad) {
      return null; // No se puede calcular si no hay fecha de caducidad
    }

    const today = new Date();
    // Asegurarse de que la fecha de caducidad se trate al final del día para un cálculo inclusivo
    const expiryDate = new Date(professional.fecha_caducidad);
    expiryDate.setHours(23, 59, 59, 999); // Establecer al final del día

    // Calcular la diferencia en milisegundos y luego convertir a días
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Redondeamos hacia arriba para incluir el día actual

    let prioridad: 'alta' | 'media' | 'baja' | 'vencido';
    if (diffDays <= 0) {
      prioridad = 'vencido';
    } else if (diffDays < 30) {
      prioridad = 'alta';
    } else if (diffDays >= 30 && diffDays < 60) {
      prioridad = 'media';
    } else { // diffDays >= 60 && diffDays <= 90
      prioridad = 'baja';
    }

    // Solo devolver si está dentro del rango de interés (hasta 90 días o vencido)
    if (diffDays <= 90) {
      return {
        ...professional,
        diasRestantes: diffDays,
        prioridad: prioridad,
      };
    }
    return null;
  };

  // Hook de React Query para obtener los profesionales con alerta de renovación
  const { data: renewalAlerts = [], isLoading, isError } = useQuery<ProfesionalAlert[]>({
    queryKey: ['renewalAlerts'],
    queryFn: async () => {
      const today = new Date();
      // Calcular la fecha límite (hoy + 90 días)
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 90);

      // Formatear fechas a ISO string para la consulta de Supabase (ej. 'YYYY-MM-DD')
      const todayIso = today.toISOString().split('T')[0];
      const futureDateIso = futureDate.toISOString().split('T')[0];

      // Consulta a Supabase para obtener profesionales cuya fecha de caducidad
      // esté entre hoy y los próximos 90 días, Y CON ESTADO 'Aprobado'
      const { data, error } = await supabase
        .from('profesionales_sanitarios') // Tu tabla de profesionales
        .select('*')
        .lte('fecha_caducidad', futureDateIso) // Menor o igual a la fecha futura
        .gte('fecha_caducidad', todayIso)    // Mayor o igual a hoy (incluye vencidos hoy)
        .eq('estado_solicitud', 'Aprobado') // <--- ¡NUEVO FILTRO AQUÍ!
        .order('fecha_caducidad', { ascending: true }); // Ordenar por fecha de caducidad

      if (error) {
        console.error('Error fetching renewal alerts:', error);
        throw error;
      }

      // Procesar los datos para calcular diasRestantes y prioridad
      const processedAlerts: ProfesionalAlert[] = [];
      data.forEach(prof => {
        const alertInfo = calculateRenewalInfo(prof);
        if (alertInfo) {
          processedAlerts.push(alertInfo);
        }
      });
      return processedAlerts;
    }
  });

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'baja':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'vencido': // Nuevo color para vencidos
        return 'bg-gray-200 text-gray-700 border-gray-300 line-through'; // Tachado para indicar que está vencido
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewAll = () => {
    if (onNavigateToProfessionals) {
      console.log('Navigating to all renewal alerts');
      onNavigateToProfessionals({
        type: 'renewal',
        value: 'all_upcoming_renewals'
      });
    }
  };

  const handleViewProfessional = (professionalId: string) => {
    if (onNavigateToProfessionals) {
      console.log('Navigating to specific professional with ID:', professionalId);
      onNavigateToProfessionals({
        type: 'detail',
        id: professionalId
      });
    }
  };

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
              {renewalAlerts.length} pendientes
            </Badge>
            <Button variant="outline" size="sm" onClick={handleViewAll}>
              Ver Todos
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-center text-gray-500">Cargando alertas...</p>}
        {isError && <p className="text-center text-red-500">Error al cargar las alertas.</p>}
        {!isLoading && !isError && renewalAlerts.length === 0 && (
          <p className="text-center text-gray-500">No hay alertas de renovación próximas.</p>
        )}
        <div className="space-y-4">
          {renewalAlerts.map((alert) => (
            <Alert
              key={alert.id_profesional_unico}
              className={`${getPriorityColor(alert.prioridad)} cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => handleViewProfessional(alert.id_profesional_unico!)}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewProfessional(alert.id_profesional_unico!);
                    }}
                  >
                    Ver Detalle
                  </Button>
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
