import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
