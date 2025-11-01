import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Shield,
  BarChart3
} from "lucide-react";

interface GuardiasSummaryCardProps {
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

export const GuardiasSummaryCard: React.FC<GuardiasSummaryCardProps> = ({
  stats,
  userRole
}) => {
  // Calcular porcentajes
  const tasaAprobacion = stats.totalGuardias > 0 
    ? (stats.guardiasAprobadas / stats.totalGuardias) * 100 
    : 0;

  const pagoAprobado = stats.pagosPendientes > 0 || stats.nominasPendientes > 0;

  // Determinar estado general del sistema
  const getStatusHealth = () => {
    if (stats.validacionesPendientes > 0 || stats.pagosPendientes > 0) {
      return { label: 'Requiere Atención', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle };
    }
    if (stats.guardiasPendientes > 0 || stats.nominasPendientes > 0) {
      return { label: 'En Proceso', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock };
    }
    return { label: 'Sistema Óptimo', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
  };

  const health = getStatusHealth();
  const HealthIcon = health.icon;

  return (
    <div className="space-y-4">
      {/* Header Status */}
      <Card className={health.bg}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${health.bg}`}>
                <HealthIcon className={`w-6 h-6 ${health.color}`} />
              </div>
              <div>
                <h3 className={`font-semibold text-lg ${health.color}`}>
                  {health.label}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.validacionesPendientes > 0 && `${stats.validacionesPendientes} validaciones pendientes. `}
                  {stats.pagosPendientes > 0 && `${stats.pagosPendientes} pagos por procesar. `}
                  {stats.nominasPendientes > 0 && `${stats.nominasPendientes} nóminas por generar.`}
                </p>
              </div>
            </div>
            <Shield className={`w-8 h-8 ${health.color} opacity-20`} />
          </div>
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Guardias */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Guardias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold text-blue-600">{stats.totalGuardias}</div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Aprobadas:</span>
                <span className="font-bold text-green-600">{stats.guardiasAprobadas}</span>
              </div>
              <Progress value={tasaAprobacion} className="h-2" />
              <p className="text-xs text-gray-500">{tasaAprobacion.toFixed(0)}% aprobación</p>
            </div>
          </CardContent>
        </Card>

        {/* Profesionales */}
        <Card className="border-l-4 border-l-purple-500 bg-purple-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Profesionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.profesionalesActivos}</div>
            <p className="text-xs text-gray-600 mt-2">Con guardias asignadas</p>
            {stats.profesionalesActivos === 0 && (
              <Badge variant="outline" className="mt-2 text-xs">
                Sin asignaciones
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Validaciones */}
        <Card className={`border-l-4 ${stats.validacionesPendientes > 0 ? 'border-l-yellow-500 bg-yellow-50/30' : 'border-l-green-500 bg-green-50/30'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-2">
              <Shield className="w-4 h-4" style={{color: stats.validacionesPendientes > 0 ? '#dc2626' : '#16a34a'}} />
              Validaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.validacionesPendientes > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {stats.validacionesPendientes}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {stats.validacionesPendientes > 0 ? 'Requieren atención' : 'Todas validadas'}
            </p>
          </CardContent>
        </Card>

        {/* Finanzas (solo para roles autorizados) */}
        {['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole) && (
          <Card className={`border-l-4 ${stats.pagosPendientes > 0 ? 'border-l-red-500 bg-red-50/30' : 'border-l-green-500 bg-green-50/30'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" style={{color: stats.pagosPendientes > 0 ? '#dc2626' : '#16a34a'}} />
                Pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.pagosPendientes > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.pagosPendientes}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {stats.pagosPendientes > 0 ? 'Por procesar' : 'Al día'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Análisis Detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pendencias Críticas */}
        {(stats.validacionesPendientes > 0 || stats.pagosPendientes > 0 || stats.nominasPendientes > 0) && (
          <Card className="border-l-4 border-l-red-500 bg-red-50/30">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Pendencias Críticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.validacionesPendientes > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-200">
                  <div>
                    <p className="font-medium text-red-900">Validaciones</p>
                    <p className="text-xs text-red-700">Requieren revisión</p>
                  </div>
                  <Badge variant="destructive">{stats.validacionesPendientes}</Badge>
                </div>
              )}
              {stats.pagosPendientes > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-200">
                  <div>
                    <p className="font-medium text-red-900">Pagos Pendientes</p>
                    <p className="text-xs text-red-700">Esperando procesamiento</p>
                  </div>
                  <Badge variant="destructive">{stats.pagosPendientes}</Badge>
                </div>
              )}
              {stats.nominasPendientes > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
                  <div>
                    <p className="font-medium text-yellow-900">Nóminas Generadas</p>
                    <p className="text-xs text-yellow-700">Esperando aprobación</p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    {stats.nominasPendientes}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resumen de Guardias */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Resumen Ejecutivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Tasa de Aprobación</span>
                <span className="text-sm font-bold text-blue-600">{tasaAprobacion.toFixed(1)}%</span>
              </div>
              <Progress value={tasaAprobacion} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <div className="p-2 bg-white rounded">
                <p className="text-xs text-gray-600">Guardias Aprobadas</p>
                <p className="text-lg font-bold text-green-600">{stats.guardiasAprobadas}</p>
              </div>
              <div className="p-2 bg-white rounded">
                <p className="text-xs text-gray-600">Pendientes de Aprobación</p>
                <p className="text-lg font-bold text-yellow-600">{stats.guardiasPendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
