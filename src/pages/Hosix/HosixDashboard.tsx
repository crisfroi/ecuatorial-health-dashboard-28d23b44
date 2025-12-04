import React from 'react';
import {
  Users,
  AlertCircle,
  Calendar,
  Hospital,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const HosixDashboard: React.FC = () => {
  const kpis = [
    {
      title: 'Pacientes Totales',
      value: '2,847',
      icon: Users,
      trend: '+12.5%',
      color: 'bg-blue-500',
    },
    {
      title: 'Urgencias Hoy',
      value: '34',
      icon: AlertCircle,
      trend: '+5.2%',
      color: 'bg-red-500',
    },
    {
      title: 'Citas Programadas',
      value: '156',
      icon: Calendar,
      trend: '+2.1%',
      color: 'bg-green-500',
    },
    {
      title: 'Camas Ocupadas',
      value: '45/60',
      icon: Hospital,
      trend: '-3.5%',
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard HOSIX</h1>
        <p className="text-gray-500 mt-1">
          Bienvenido al Sistema de Gestión Hospitalaria
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {kpi.title}
                  </CardTitle>
                  <div className={`${kpi.color} rounded-full p-2`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                <p className="text-xs text-green-600 mt-1">{kpi.trend} desde el mes anterior</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 pb-4 border-b">
                <div className="bg-blue-100 rounded-full p-2 mt-1">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Nuevo paciente registrado</p>
                  <p className="text-xs text-gray-500">Juan Carlos López - Hace 2 horas</p>
                </div>
              </div>

              <div className="flex items-start gap-4 pb-4 border-b">
                <div className="bg-green-100 rounded-full p-2 mt-1">
                  <AlertCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Urgencia asignada a Dr. González</p>
                  <p className="text-xs text-gray-500">Triage Nivel 2 - Hace 30 minutos</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-purple-100 rounded-full p-2 mt-1">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Cita confirmada para mañana</p>
                  <p className="text-xs text-gray-500">María Rodríguez - 09:30 AM - Hace 15 minutos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Atajos útiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Nuevo Paciente
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <AlertCircle className="w-4 h-4 mr-2" />
              Registrar Urgencia
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Programar Cita
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Hospital className="w-4 h-4 mr-2" />
              Nuevo Ingreso
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Ver Reportes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas del Mes</CardTitle>
          <CardDescription>Indicadores principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">892</div>
              <p className="text-sm text-gray-600 mt-2">Pacientes Atendidos</p>
              <p className="text-xs text-gray-500 mt-1">+15% que el mes anterior</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">156</div>
              <p className="text-sm text-gray-600 mt-2">Intervenciones</p>
              <p className="text-xs text-gray-500 mt-1">+8% que el mes anterior</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">45</div>
              <p className="text-sm text-gray-600 mt-2">Promedio Estancia (días)</p>
              <p className="text-xs text-gray-500 mt-1">-2% que el mes anterior</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HosixDashboard;
