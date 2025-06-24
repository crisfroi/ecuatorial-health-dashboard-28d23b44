
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar, User, Phone, Mail } from 'lucide-react';

interface RenewalAlertsProps {
  onNavigateToProfessionals?: (filters: any) => void;
}

const RenewalAlerts = ({ onNavigateToProfessionals }: RenewalAlertsProps) => {
  // Datos simulados de profesionales con renovaciones próximas
  const renewalAlerts = [
    {
      id: 1,
      nombre: 'Dr. Carlos Mendez',
      profesion: 'Médico Especialista',
      fechaVencimiento: '2024-07-15',
      diasRestantes: 15,
      telefono: '+240 222 123 456',
      email: 'carlos.mendez@salud.gq',
      prioridad: 'alta'
    },
    {
      id: 2,
      nombre: 'Enf. María González',
      profesion: 'Enfermera',
      fechaVencimiento: '2024-07-28',
      diasRestantes: 28,
      telefono: '+240 222 234 567',
      email: 'maria.gonzalez@salud.gq',
      prioridad: 'media'
    },
    {
      id: 3,
      nombre: 'Farm. José Martín',
      profesion: 'Farmacéutico',
      fechaVencimiento: '2024-08-05',
      diasRestantes: 36,
      telefono: '+240 222 345 678',
      email: 'jose.martin@salud.gq',
      prioridad: 'baja'
    }
  ];

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'baja':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewAll = () => {
    if (onNavigateToProfessionals) {
      console.log('Navigating to renewals');
      onNavigateToProfessionals({
        type: 'renewal',
        value: 'proxima'
      });
    }
  };

  const handleViewProfessional = (professional: any) => {
    if (onNavigateToProfessionals) {
      console.log('Navigating to specific professional:', professional.nombre);
      onNavigateToProfessionals({
        type: 'search',
        value: professional.nombre
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
        <div className="space-y-4">
          {renewalAlerts.map((alert) => (
            <Alert 
              key={alert.id} 
              className={`${getPriorityColor(alert.prioridad)} cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => handleViewProfessional(alert)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{alert.nombre}</span>
                    <Badge variant="outline" className="text-xs">
                      {alert.profesion}
                    </Badge>
                  </div>
                  
                  <AlertDescription className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-3 h-3" />
                      <span>Vence: {alert.fechaVencimiento}</span>
                      <span className="font-medium">({alert.diasRestantes} días)</span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{alert.telefono}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>{alert.email}</span>
                      </div>
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
                      handleViewProfessional(alert);
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
