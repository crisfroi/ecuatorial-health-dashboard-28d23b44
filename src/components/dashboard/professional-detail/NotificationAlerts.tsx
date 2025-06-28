
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertTriangle, MessageSquare } from 'lucide-react';

interface NotificationAlertsProps {
  isRenewalSoon: boolean;
  daysUntilRenewal: number | null;
  validityDate?: string;
  notificationCount?: {
    total_notificaciones: number;
    ultima_notificacion?: string;
  };
  onSendSMS: (type: string) => void;
}

const NotificationAlerts = ({ 
  isRenewalSoon, 
  daysUntilRenewal, 
  validityDate, 
  notificationCount,
  onSendSMS 
}: NotificationAlertsProps) => {
  return (
    <>
      {/* Alerta de renovación próxima */}
      {isRenewalSoon && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Renovación próxima:</strong> El carnet profesional vence en {daysUntilRenewal} días ({validityDate || 'No especificado'})
          </AlertDescription>
        </Alert>
      )}

      {/* Información de notificaciones SMS */}
      {notificationCount && notificationCount.total_notificaciones > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <span>
                <strong>Notificaciones SMS:</strong> {notificationCount.total_notificaciones} enviadas
                {notificationCount.ultima_notificacion && 
                  ` (última: ${new Date(notificationCount.ultima_notificacion).toLocaleDateString('es-ES')})`
                }
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Enviar SMS
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onSendSMS('30_dias_antes')}>
                    Recordatorio de renovación
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSendSMS('10_dias_despues')}>
                    Aviso de vencimiento
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default NotificationAlerts;
