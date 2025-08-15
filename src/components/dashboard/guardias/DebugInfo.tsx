import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useGuardias, useNominas, useBaremos, useConfiguracion } from '@/hooks/useGuardSystem';

const DebugInfo: React.FC = () => {
  const { error: guardiasError, isLoading: guardiasLoading } = useGuardias({});
  const { error: nominasError, isLoading: nominasLoading } = useNominas({});
  const { error: baremosError, isLoading: baremosLoading } = useBaremos();
  const { error: configError, isLoading: configLoading } = useConfiguracion();

  const getStatus = (error: any, loading: boolean) => {
    if (loading) return { status: 'loading', color: 'bg-blue-100 text-blue-800', icon: AlertCircle };
    if (error) {
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return { status: 'tables_missing', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
      }
      return { status: 'error', color: 'bg-red-100 text-red-800', icon: XCircle };
    }
    return { status: 'ok', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const services = [
    { name: 'Guardias', error: guardiasError, loading: guardiasLoading },
    { name: 'Nóminas', error: nominasError, loading: nominasLoading },
    { name: 'Baremos', error: baremosError, loading: baremosLoading },
    { name: 'Configuración', error: configError, loading: configLoading },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Estado del Sistema de Guardias</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {services.map(service => {
            const { status, color, icon: Icon } = getStatus(service.error, service.loading);
            return (
              <div key={service.name} className="flex items-center justify-between">
                <span className="text-sm">{service.name}</span>
                <Badge variant="outline" className={color}>
                  <Icon className="w-3 h-3 mr-1" />
                  {status === 'loading' && 'Cargando'}
                  {status === 'ok' && 'OK'}
                  {status === 'tables_missing' && 'Tablas no creadas'}
                  {status === 'error' && 'Error'}
                </Badge>
              </div>
            );
          })}
        </div>
        
        {services.some(s => getStatus(s.error, s.loading).status === 'tables_missing') && (
          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-xs text-yellow-700">
              ℹ️ Las tablas del sistema de guardias no existen aún. Ejecute la migración de base de datos.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DebugInfo;
