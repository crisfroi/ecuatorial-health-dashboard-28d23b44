import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  X,
  Calendar,
  DollarSign,
  Users,
  FileText
} from "lucide-react";
import { useGuardiasStore } from "@/stores/useGuardiasStore";

interface Notification {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  actionRequired?: boolean;
  relatedEntity?: {
    type: 'guardia' | 'nomina' | 'pago' | 'validacion';
    id: string;
  };
}

interface GuardiasNotificationSystemProps {
  userRole: string;
  onNavigateToTab?: (tab: string) => void;
}

export const GuardiasNotificationSystem: React.FC<GuardiasNotificationSystemProps> = ({
  userRole,
  onNavigateToTab
}) => {
  const {
    guardias,
    nominas,
    pagos,
    validaciones
  } = useGuardiasStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    generateNotifications();
  }, [guardias, nominas, pagos, validaciones, userRole]);

  const generateNotifications = () => {
    const newNotifications: Notification[] = [];
    const now = new Date();

    // Notificaciones para validaciones pendientes
    const validacionesPendientes = validaciones.filter(v => v.estado === 'PENDIENTE');
    if (validacionesPendientes.length > 0 && ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'REVISOR_SOLICITUDES'].includes(userRole)) {
      newNotifications.push({
        id: 'validaciones-pendientes',
        type: 'warning',
        title: 'Validaciones Pendientes',
        message: `${validacionesPendientes.length} validación(es) requieren su atención`,
        timestamp: now,
        actionRequired: true,
        relatedEntity: {
          type: 'validacion',
          id: 'validaciones'
        }
      });
    }

    // Notificaciones para nóminas pendientes de aprobación
    const nominasPendientes = nominas.filter(n => n.estado === 'GENERADA');
    if (nominasPendientes.length > 0 && ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole)) {
      newNotifications.push({
        id: 'nominas-pendientes',
        type: 'warning',
        title: 'Nóminas por Aprobar',
        message: `${nominasPendientes.length} nómina(s) esperan aprobación`,
        timestamp: now,
        actionRequired: true,
        relatedEntity: {
          type: 'nomina',
          id: 'nomina'
        }
      });
    }

    // Notificaciones para pagos pendientes
    const pagosPendientes = pagos.filter(p => p.estado === 'PENDIENTE');
    if (pagosPendientes.length > 0 && ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole)) {
      newNotifications.push({
        id: 'pagos-pendientes',
        type: 'error',
        title: 'Pagos Pendientes',
        message: `${pagosPendientes.length} pago(s) requieren procesamiento`,
        timestamp: now,
        actionRequired: true,
        relatedEntity: {
          type: 'pago',
          id: 'pagos'
        }
      });
    }

    // Notificaciones para guardias de hoy
    const hoy = now.toISOString().split('T')[0];
    const guardiasHoy = guardias.filter(g => g.fecha === hoy);
    if (guardiasHoy.length > 0) {
      newNotifications.push({
        id: 'guardias-hoy',
        type: 'info',
        title: 'Guardias de Hoy',
        message: `${guardiasHoy.length} guardia(s) programada(s) para hoy`,
        timestamp: now,
        actionRequired: false,
        relatedEntity: {
          type: 'guardia',
          id: 'registro'
        }
      });
    }

    // Notificación de bienvenida si no hay datos
    if (guardias.length === 0 && nominas.length === 0 && ['SUPER_ADMINISTRADOR', 'DIRECTIVO_CENTRO_SANITARIO'].includes(userRole)) {
      newNotifications.push({
        id: 'bienvenida',
        type: 'info',
        title: 'Comience Registrando Guardias',
        message: 'El sistema está listo. Registre las primeras guardias del mes.',
        timestamp: now,
        actionRequired: false,
        relatedEntity: {
          type: 'guardia',
          id: 'registro'
        }
      });
    }

    setNotifications(newNotifications);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationAction = (notification: Notification) => {
    if (notification.relatedEntity && onNavigateToTab) {
      onNavigateToTab(notification.relatedEntity.id);
    }
    dismissNotification(notification.id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'info':
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getNotificationBorderColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'info':
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getEntityIcon = (entityType?: string) => {
    switch (entityType) {
      case 'nomina':
        return <DollarSign className="w-4 h-4" />;
      case 'pago':
        return <DollarSign className="w-4 h-4" />;
      case 'validacion':
        return <FileText className="w-4 h-4" />;
      case 'guardia':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const importantNotifications = notifications.filter(n => n.actionRequired);
  const totalNotifications = notifications.length;

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative"
        >
          <Bell className="w-4 h-4" />
          {totalNotifications > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 px-1 py-0 text-xs min-w-[1.2rem] h-5"
              variant={importantNotifications.length > 0 ? "destructive" : "default"}
            >
              {totalNotifications}
            </Badge>
          )}
        </Button>
        
        {importantNotifications.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            {importantNotifications.length} urgente(s)
          </Badge>
        )}
      </div>

      {/* Panel de notificaciones */}
      {showNotifications && (
        <Card className="absolute top-12 right-0 w-96 max-h-96 overflow-y-auto z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notificaciones</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No hay notificaciones</p>
                <p className="text-xs text-gray-500">Todo está al día</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-l-4 p-3 rounded-r-lg ${getNotificationBorderColor(notification.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getNotificationIcon(notification.type)}
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        {notification.actionRequired && (
                          <Badge className="text-xs" variant="destructive">
                            Acción requerida
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {notification.timestamp.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <div className="flex items-center space-x-1">
                          {notification.relatedEntity && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleNotificationAction(notification)}
                              className="text-xs h-6 px-2"
                            >
                              {getEntityIcon(notification.relatedEntity.type)}
                              <span className="ml-1">Ver</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissNotification(notification.id)}
                            className="text-xs h-6 px-1"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
