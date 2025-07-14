import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar, User, Phone, Mail } from 'lucide-react';
// Importamos el hook y el tipo que devuelve
import { useProfesionales, type ProfesionalAlert } from '@/hooks/useProfesionales'; 

interface RenewalAlertsProps {
  onNavigateToProfessionals?: (filters: any) => void;
}

const RenewalAlerts = ({ onNavigateToProfessionals }: RenewalAlertsProps) => {

  // Usa el hook con el nuevo filtro para obtener solo las alertas
  const { data: renewalAlerts = [], isLoading, isError } = useProfesionales({
    filterByRenewalAlerts: true, // ¡Activa el filtro de alertas en el hook!
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
