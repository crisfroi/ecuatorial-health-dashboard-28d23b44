import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle,
  Users,
  Calendar,
  DollarSign,
  FileText
} from "lucide-react";

interface StatusIndicatorProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  status: 'success' | 'warning' | 'error' | 'info';
  description?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  title,
  value,
  icon,
  status,
  description
}) => {
  const getStatusColors = () => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      case 'info':
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`border-l-4 ${getStatusColors()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getStatusColors()}`}>
              {icon}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{title}</h3>
              {description && (
                <p className="text-sm text-gray-600">{description}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="flex items-center space-x-1">
              {getStatusIcon()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface GuardiasStatusIndicatorsProps {
  stats: {
    totalGuardias: number;
    guardiasAprobadas: number;
    guardiasPendientes: number;
    profesionalesActivos: number;
    nominasPendientes: number;
    pagosPendientes: number;
    validacionesPendientes: number;
    totalNominas: number;
  };
  userRole: string;
}

export const GuardiasStatusIndicators: React.FC<GuardiasStatusIndicatorsProps> = ({
  stats,
  userRole
}) => {
  const indicators = [
    {
      title: 'Guardias Registradas',
      value: stats.totalGuardias,
      icon: <Calendar className="w-5 h-5" />,
      status: stats.totalGuardias > 0 ? 'success' : 'info' as const,
      description: 'Total del mes actual'
    },
    {
      title: 'Profesionales Activos',
      value: stats.profesionalesActivos,
      icon: <Users className="w-5 h-5" />,
      status: stats.profesionalesActivos > 0 ? 'success' : 'warning' as const,
      description: 'Con guardias asignadas'
    },
    {
      title: 'Validaciones Pendientes',
      value: stats.validacionesPendientes,
      icon: <FileText className="w-5 h-5" />,
      status: stats.validacionesPendientes === 0 ? 'success' : 'warning' as const,
      description: 'Requieren atención'
    }
  ];

  // Agregar indicadores financieros para roles autorizados
  if (['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole)) {
    indicators.push(
      {
        title: 'Nóminas Pendientes',
        value: stats.nominasPendientes,
        icon: <FileText className="w-5 h-5" />,
        status: stats.nominasPendientes === 0 ? 'success' : 'warning' as const,
        description: 'Por aprobar'
      },
      {
        title: 'Pagos Pendientes',
        value: stats.pagosPendientes,
        icon: <DollarSign className="w-5 h-5" />,
        status: stats.pagosPendientes === 0 ? 'success' : 'error' as const,
        description: 'Por procesar'
      }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Estado del Sistema</h3>
        <Badge variant="outline" className="text-xs">
          Actualizado: {new Date().toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indicators.map((indicator, index) => (
          <StatusIndicator
            key={index}
            title={indicator.title}
            value={indicator.value}
            icon={indicator.icon}
            status={indicator.status}
            description={indicator.description}
          />
        ))}
      </div>

      {/* Resumen de estado general */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Estado General del Sistema</h4>
              <p className="text-sm text-blue-700">
                {getSystemStatusMessage(stats)}
              </p>
            </div>
            <div className="text-right">
              <Badge className={getSystemStatusBadge(stats)}>
                {getSystemStatus(stats)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const getSystemStatus = (stats: any): string => {
  const totalPendientes = stats.validacionesPendientes + stats.nominasPendientes + stats.pagosPendientes;
  
  if (totalPendientes === 0 && stats.totalGuardias > 0) {
    return 'Óptimo';
  } else if (totalPendientes <= 5) {
    return 'Bueno';
  } else if (totalPendientes <= 10) {
    return 'Atención';
  } else {
    return 'Crítico';
  }
};

const getSystemStatusBadge = (stats: any): string => {
  const status = getSystemStatus(stats);
  
  switch (status) {
    case 'Óptimo':
      return 'bg-green-100 text-green-800';
    case 'Bueno':
      return 'bg-blue-100 text-blue-800';
    case 'Atención':
      return 'bg-yellow-100 text-yellow-800';
    case 'Crítico':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getSystemStatusMessage = (stats: any): string => {
  const totalPendientes = stats.validacionesPendientes + stats.nominasPendientes + stats.pagosPendientes;
  
  if (stats.totalGuardias === 0) {
    return 'No hay guardias registradas este mes';
  } else if (totalPendientes === 0) {
    return 'Todas las tareas están al día';
  } else if (totalPendientes <= 5) {
    return `${totalPendientes} tarea(s) pendiente(s)`;
  } else {
    return `${totalPendientes} tareas requieren atención urgente`;
  }
};
