import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  WifiOff,
  RefreshCw
} from "lucide-react";
import { useGuardiasStore } from "@/stores/useGuardiasStore";
import { GuardiasConnectivityTest } from "./GuardiasConnectivityTest";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface GuardiasStatsWidgetProps {
  onNavigateToGuardias?: () => void;
  userRole: string;
}

export const GuardiasStatsWidget: React.FC<GuardiasStatsWidgetProps> = ({
  onNavigateToGuardias,
  userRole
}) => {
  const {
    guardias,
    nominas,
    pagos,
    validaciones,
    loading,
    error,
    fetchGuardias,
    fetchNominas,
    fetchPagos,
    fetchValidaciones
  } = useGuardiasStore();

  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());
  const [showConnectivityTest, setShowConnectivityTest] = useState(false);
  const networkStatus = useNetworkStatus();

  useEffect(() => {
    // Solo cargar datos si el usuario tiene permisos para ver guardias
    if (['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO', 'REVISOR_SOLICITUDES'].includes(userRole)) {
      fetchGuardias(currentMonth, currentYear);
      fetchNominas(currentMonth, currentYear);
      fetchPagos(currentMonth, currentYear);
      fetchValidaciones(currentMonth, currentYear);
    }
  }, [currentMonth, currentYear, userRole]);

  // Si el usuario no tiene permisos, no mostrar el widget
  if (!['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO', 'REVISOR_SOLICITUDES'].includes(userRole)) {
    return null;
  }

  // Cálculos estadísticos
  const totalGuardias = guardias.length;
  const guardiasHoy = guardias.filter(g => {
    const hoy = new Date().toISOString().split('T')[0];
    return g.fecha === hoy;
  }).length;

  const guardiasManana = guardias.filter(g => g.turno === 'MAÑANA').length;
  const guardiasTarde = guardias.filter(g => g.turno === 'TARDE').length;
  const guardiasNoche = guardias.filter(g => g.turno === 'NOCHE').length;

  const profesionalesActivos = new Set(guardias.map(g => g.profesional_id)).size;

  const nominasMes = nominas.filter(n => n.mes === currentMonth && n.ano === currentYear);
  const totalNominas = nominasMes.reduce((sum, n) => sum + n.total, 0);
  const nominasPendientes = nominasMes.filter(n => n.estado === 'GENERADA').length;

  const pagosPendientes = pagos.filter(p => p.estado === 'PENDIENTE').length;
  const pagosAprobados = pagos.filter(p => p.estado === 'APROBADO').length;

  const validacionesPendientes = validaciones.filter(v => v.estado === 'PENDIENTE').length;

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} XAF`;
  };

  const retryFetch = () => {
    if (['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO', 'REVISOR_SOLICITUDES'].includes(userRole)) {
      fetchGuardias(currentMonth, currentYear);
      fetchNominas(currentMonth, currentYear);
      fetchPagos(currentMonth, currentYear);
      fetchValidaciones(currentMonth, currentYear);
    }
  };

  const handleConnectionRestored = () => {
    setShowConnectivityTest(false);
    retryFetch();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Guardias Médicas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando datos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state with connectivity options
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <WifiOff className="w-5 h-5 text-red-600" />
            <span>Error de Conexión</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error.includes('conectividad') || error.includes('Failed to fetch') ?
                'Error de conectividad: No se pudo conectar al servidor.' :
                error
              }
            </AlertDescription>
          </Alert>

          {!networkStatus.isOnline && (
            <Alert>
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                Su dispositivo está sin conexión a internet. Verifique su conexión de red.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={retryFetch}
              size="sm"
              disabled={!networkStatus.isOnline}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            <Button
              onClick={() => setShowConnectivityTest(!showConnectivityTest)}
              variant="outline"
              size="sm"
            >
              Diagnosticar Conexión
            </Button>
          </div>

          {showConnectivityTest && (
            <GuardiasConnectivityTest onConnectionRestored={handleConnectionRestored} />
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Guardias Médicas</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalGuardias}</div>
            <div className="text-xs text-gray-500">Total Mes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{guardiasHoy}</div>
            <div className="text-xs text-gray-500">Hoy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{profesionalesActivos}</div>
            <div className="text-xs text-gray-500">Profesionales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{validacionesPendientes}</div>
            <div className="text-xs text-gray-500">Validaciones</div>
          </div>
        </div>

        {/* Distribución por turnos */}
        {totalGuardias > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Distribución por Turnos</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Mañana</span>
                </div>
                <span className="font-medium">{guardiasManana}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>Tarde</span>
                </div>
                <span className="font-medium">{guardiasTarde}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span>Noche</span>
                </div>
                <span className="font-medium">{guardiasNoche}</span>
              </div>
            </div>
          </div>
        )}

        {/* Información financiera (solo para roles autorizados) */}
        {['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole) && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Resumen Financiero</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>Total Nóminas</span>
                </div>
                <span className="font-medium text-green-600">
                  {formatCurrency(totalNominas)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span>Pagos Pendientes</span>
                </div>
                <span className="font-medium text-yellow-600">{pagosPendientes}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Pagos Aprobados</span>
                </div>
                <span className="font-medium text-green-600">{pagosAprobados}</span>
              </div>
            </div>
          </div>
        )}

        {/* Alertas importantes */}
        {(nominasPendientes > 0 || validacionesPendientes > 0 || pagosPendientes > 0) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Acciones Pendientes:</p>
                <ul className="text-yellow-700 text-xs mt-1 space-y-1">
                  {nominasPendientes > 0 && (
                    <li>• {nominasPendientes} nómina(s) por aprobar</li>
                  )}
                  {validacionesPendientes > 0 && (
                    <li>• {validacionesPendientes} validación(es) pendiente(s)</li>
                  )}
                  {pagosPendientes > 0 && (
                    <li>• {pagosPendientes} pago(s) por procesar</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay datos */}
        {totalGuardias === 0 && (
          <div className="text-center py-4">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No hay guardias registradas este mes</p>
            <p className="text-xs text-gray-400">Comience registrando las primeras guardias</p>
          </div>
        )}

        {/* Botón para ir a guardias */}
        {onNavigateToGuardias && (
          <Button 
            onClick={onNavigateToGuardias}
            className="w-full"
            variant="outline"
            size="sm"
          >
            <span>Ver Sistema Completo</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
