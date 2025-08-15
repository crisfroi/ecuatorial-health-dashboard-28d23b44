import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useNominas, useBaremos, useGuardias } from '@/hooks/useGuardSystem';

const ErrorVerification: React.FC = () => {
  const { error: nominasError, isLoading: nominasLoading } = useNominas({});
  const { error: baremosError, isLoading: baremosLoading } = useBaremos();
  const { error: guardiasError, isLoading: guardiasLoading } = useGuardias({});

  const getErrorStatus = (error: any, loading: boolean) => {
    if (loading) {
      return { status: 'loading', message: 'Cargando...', color: 'bg-blue-100 text-blue-800' };
    }
    
    if (error) {
      if (error.type === 'database_missing') {
        return { 
          status: 'db_missing', 
          message: 'Tablas no creadas',
          color: 'bg-yellow-100 text-yellow-800',
          detail: error.message
        };
      }
      
      return { 
        status: 'error', 
        message: 'Error',
        color: 'bg-red-100 text-red-800',
        detail: error.message || 'Error desconocido'
      };
    }
    
    return { status: 'ok', message: 'OK', color: 'bg-green-100 text-green-800' };
  };

  const services = [
    { name: 'Guardias', error: guardiasError, loading: guardiasLoading },
    { name: 'Nóminas', error: nominasError, loading: nominasLoading },
    { name: 'Baremos', error: baremosError, loading: baremosLoading },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Verificación de Errores - Sistema de Guardias</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map(service => {
            const status = getErrorStatus(service.error, service.loading);
            return (
              <div key={service.name} className="flex items-start justify-between p-3 border rounded">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{service.name}</span>
                    <Badge variant="outline" className={status.color}>
                      {status.status === 'loading' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {status.status === 'ok' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {(status.status === 'error' || status.status === 'db_missing') && <XCircle className="w-3 h-3 mr-1" />}
                      {status.message}
                    </Badge>
                  </div>
                  {status.detail && (
                    <p className="text-xs text-gray-600 mt-1">{status.detail}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="text-xs text-blue-700">
            ℹ️ Este componente verifica que los errores se manejen correctamente y no aparezcan como "[object Object]".
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorVerification;
