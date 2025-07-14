import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Users,
  FileText,
  Settings,
  TrendingUp,
  Calendar,
  MapPin,
  Activity,
  MessageSquare,
  Filter,
  X,
  User,
  LogOut,
  UserCog,
  Building2,
  AlertTriangle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import components
import StatsCards from '@/components/dashboard/StatsCards';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import ProfessionalsTable from '@/components/dashboard/ProfessionalsTable';
import ProfessionalDetail from '@/components/dashboard/ProfessionalDetail';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import RequestsPanel from '@/components/dashboard/RequestsPanel';
import RenewalAlerts from '@/components/dashboard/RenewalAlerts';
import OpenAIChat from '@/components/dashboard/OpenAIChat';
import MinisterialPanel from '@/components/dashboard/MinisterialPanel';
import HospitalIncidents from '@/components/dashboard/HospitalIncidents';
import HealthCenters from '@/components/dashboard/HealthCenters';
import UserRoleManagement from '@/components/dashboard/UserRoleManagement';

import type { Tables } from '@/integrations/supabase/types';

type Profesional = Tables<'profesionales_sanitarios'>;

// Definición de tipos para los filtros
// Ampliamos Filtros para incluir los campos específicos de las StatsCards (vencimiento/prioridad)
interface Filtros {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  distrito?: string;
  anoGraduacion?: string;
  // Añadimos los filtros que pueden venir de StatsCards para RenewalAlerts
  vencimiento_proximo?: boolean;
  carnet_vencido?: boolean;
  prioridad_renovacion?: 'alta' | 'media' | 'baja' | 'vencido' | 'todos';
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedProfessional, setSelectedProfessional] = useState<Profesional | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Filtros>({});
  const [showFilters, setShowFilters] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState<Filtros>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [showStatsCards, setShowStatsCards] = useState(true);

  // Manteniendo userRole y userName como están en tu código original
  const userRole = 'administrador';
  const userName = 'Admin User';

  const handleSelectProfessional = (professional: Profesional) => {
    console.log('Dashboard: Profesional seleccionado para ver detalle:', professional.id);
    setSelectedProfessional(professional);
  };

  // Esta función se llama cuando DashboardFilters cambia sus filtros
  const handleFiltersChange = (filters: Filtros) => {
    console.log('Dashboard: handleFiltersChange llamado. Nuevos filtros recibidos:', filters);
    setAppliedFilters(filters);
    // dashboardFilters se actualizará en el useEffect que observa appliedFilters
  };

  const handleClearFilters = () => {
    console.log('Dashboard: Limpiando todos los filtros.');
    setAppliedFilters({});
    // dashboardFilters se actualizará en el useEffect
    setShowFilters(false);
  };

  // **FUNCIÓN CLAVE: handleNavigateToProfessionals**
  // Se invoca cuando se hace clic en una StatsCard.
  const handleNavigateToProfessionals = (filter: Filtros) => {
    console.log('Dashboard: Stats card clicked. Filtro recibido:', filter);

    // 1. Establecer los filtros visuales (appliedFilters) con los filtros de la tarjeta
    setAppliedFilters(filter);

    // 2. Determinar la pestaña activa basada en el tipo de filtro de la tarjeta
    if (filter.estado_solicitud && filter.estado_solicitud !== 'Aprobado') {
      // Si el filtro es sobre el estado de una solicitud (ej. Pendiente, Rechazado)
      console.log(`Dashboard: Navegando a la pestaña 'requests' para estado: ${filter.estado_solicitud}`);
      setActiveTab('requests');
    } else if (filter.vencimiento_proximo || filter.carnet_vencido || filter.prioridad_renovacion) {
      // Si el filtro es sobre vencimiento o prioridad de renovación
      console.log('Dashboard: Navegando a la pestaña "renewals" por filtro de vencimiento/prioridad.');
      setActiveTab('renewals');
    } else {
      // Para cualquier otro filtro (ej. area_profesional, o estado_solicitud 'Aprobado')
      console.log('Dashboard: Navegando a la pestaña "professionals" por filtro general.');
      setActiveTab('professionals');
    }
    // NOTA: dashboardFilters se actualizará gracias al useEffect que observa appliedFilters.
  };

  // **useEffect para sincronizar appliedFilters con dashboardFilters**
  // Este useEffect es vital para que dashboardFilters (lo que se pasa a las tablas)
  // siempre refleje el estado actual de appliedFilters.
  useEffect(() => {
    console.log('Dashboard: useEffect activado. Sincronizando appliedFilters con dashboardFilters.');
    // Creamos una copia para evitar mutaciones directas y para limpiar filtros si es necesario
    let finalFilters: Filtros = { ...appliedFilters };

    // Lógica para asegurar que los filtros de renovación solo se pasen a RenewalAlerts
    if (activeTab !== 'renewals') {
        // Si no estamos en la pestaña de renovaciones, eliminamos estos filtros del objeto final
        // para que no afecten a ProfessionalsTable o RequestsPanel innecesariamente.
        delete finalFilters.vencimiento_proximo;
        delete finalFilters.carnet_vencido;
        delete finalFilters.prioridad_renovacion;
        console.log('Dashboard: Se eliminaron filtros de renovación porque la pestaña activa no es "renewals".');
    }

    setDashboardFilters(finalFilters);
    console.log('Dashboard: dashboardFilters actualizado a:', finalFilters);
  }, [appliedFilters, activeTab]); // Se ejecuta cuando appliedFilters o activeTab cambian


  const handleChartClick = (data: any, chartType: string) => {
    console.log('Dashboard: Chart clicked:', data, chartType);
    const filter: Filtros = {};

    if (chartType === 'area_profesional' && data.area) {
      filter.area_profesional = data.area;
    } else if (chartType === 'provincia' && data.provincia) {
      filter.provincia = data.provincia;
    } else if (chartType === 'estado_solicitud' && data.estado) {
      filter.estado_solicitud = data.estado;
    }

    // Aplicar los filtros del gráfico a appliedFilters
    setAppliedFilters(filter);

    // Navegar a la pestaña correspondiente
    if (filter.estado_solicitud && filter.estado_solicitud !== 'Aprobado') {
      console.log(`Dashboard: Chart click: Navegando a la pestaña 'requests' para estado: ${filter.estado_solicitud}`);
      setActiveTab('requests');
    } else {
      console.log('Dashboard: Chart click: Navegando a la pestaña "professionals" por filtro general.');
      setActiveTab('professionals');
    }
    // dashboardFilters se actualizará en el useEffect
  };

  const handleLogout = () => {
    console.log("Dashboard: Cerrar sesión.");
    navigate('/login');
  };

  const handleUserSettings = () => {
    console.log("Dashboard: Configuración de usuario.");
  };

  // Determinar si hay filtros activos para el botón "Limpiar Filtros"
  const hasActiveFilters = Object.keys(appliedFilters).length > 0;


  const tabsConfig = [
    { id: 'overview', label: 'General', icon: BarChart3 },
    { id: 'professionals', label: 'Profesionales', icon: Users },
    { id: 'requests', label: 'Solicitudes', icon: FileText },
    { id: 'renewals', label: 'Renovaciones', icon: Calendar },
    { id: 'analytics', label: 'Analíticas', icon: TrendingUp },
    { id: 'ai-chat', label: 'IA Chat', icon: MessageSquare },
    { id: 'ministerial', label: 'Ministerial', icon: Settings },
    { id: 'incidents', label: 'Incidencias', icon: Activity },
    { id: 'health-centers', label: 'Centros', icon: MapPin },
    ...(userRole === 'administrador' ? [
        { id: 'users', label: 'Usuarios', icon: Users }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Contenedor del TabsList (único elemento fijo) */}
      <div className="sticky top-0 z-50 bg-gray-50 shadow-md">
        <div className="container mx-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
            <TabsList className="grid w-full grid-cols-5 md:grid-cols-10">
              {tabsConfig.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={`
                      flex items-center gap-2
                      ${activeTab === tab.id
                        ? ''
                        : 'hover:bg-primary/10 hover:text-primary'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Contenido principal de la página (desplazable) */}
      <div className="container mx-auto p-6 pt-0 flex-grow">

        {/* Header y Botones de acción (ahora desplazables) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Gestión</h1>
            <p className="text-gray-600 mt-1">
              Sistema de gestión de profesionales sanitarios
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón para desplegar/replegar StatsCards */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowStatsCards(!showStatsCards);
                console.log(`Dashboard: Alternando visibilidad de StatsCards a: ${!showStatsCards}`);
              }}
              className="flex items-center gap-2"
            >
              {showStatsCards ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showStatsCards ? 'Replegar Estadísticas' : 'Desplegar Estadísticas'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowFilters(!showFilters);
                console.log(`Dashboard: Alternando visibilidad de Filtros a: ${!showFilters}`);
              }}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
                Limpiar Filtros
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{userName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleUserSettings}>
                  <UserCog className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters (ahora desplazables) */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
              <CardDescription>
                Filtra los datos del dashboard según tus criterios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardFilters
                filters={appliedFilters}
                onFiltersChange={handleFiltersChange}
                // onClearFilters se maneja a nivel de Dashboard ahora
              />
            </CardContent>
          </Card>
        )}

        {/* Stats Cards (desplegables y desplazables) */}
        {showStatsCards && (
          <div className="mb-6">
            <StatsCards onNavigateToProfessionals={handleNavigateToProfessionals} />
          </div>
        )}

        {/* Contenido de las pestañas (se mantiene en el mismo componente Tabs) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsContent value="overview" className="space-y-6">
            <DashboardCharts onChartClick={handleChartClick} />
          </TabsContent>

          <TabsContent value="professionals" className="space-y-6">
            {selectedProfessional ? (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedProfessional(null);
                    console.log('Dashboard: Volviendo a la lista de profesionales.');
                  }}
                  className="flex items-center gap-2"
                >
                  ← Volver a la lista
                </Button>
                <ProfessionalDetail
                  professional={selectedProfessional}
                  onClose={() => {
                    setSelectedProfessional(null);
                    console.log('Dashboard: Cerrando detalle de profesional.');
                  }}
                />
              </div>
            ) : (
              <ProfessionalsTable
                onSelectProfessional={handleSelectProfessional}
                userRole={userRole}
                appliedFilters={dashboardFilters} // ProfessionalsTable usa dashboardFilters
                onClearFilters={handleClearFilters}
                // dashboardFilters ya está establecido en el estado, no es necesario pasarlo explícitamente de nuevo si appliedFilters es el que se observa.
              />
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            {/* RequestsPanel necesita el filtro de estado_solicitud de dashboardFilters */}
            <RequestsPanel
                userRole={userRole}
                initialStatusFilter={dashboardFilters.estado_solicitud} // Pasa el filtro de estado específico
                onSelectProfessional={handleSelectProfessional}
            />
          </TabsContent>

          <TabsContent value="renewals" className="space-y-6">
            {/* RenewalAlerts necesita los filtros de vencimiento/prioridad de dashboardFilters */}
            <RenewalAlerts
                initialPriorityFilter={dashboardFilters.prioridad_renovacion}
                initialVencimientoProximo={dashboardFilters.vencimiento_proximo}
                initialCarnetVencido={dashboardFilters.carnet_vencido}
                onSelectProfessional={handleSelectProfessional}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Métricas Avanzadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Análisis detallado de tendencias y patrones en el registro de profesionales.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Distribución Geográfica
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Mapa de calor mostrando la distribución de profesionales por provincia.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai-chat" className="space-y-6">
            <OpenAIChat />
          </TabsContent>

          <TabsContent value="ministerial" className="space-y-6">
            {(userRole === 'administrador' || userRole === 'comite') && <MinisterialPanel />}
          </TabsContent>

          <TabsContent value="incidents" className="space-y-6">
            <HospitalIncidents />
          </TabsContent>

          <TabsContent value="health-centers" className="space-y-6">
            <HealthCenters />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {userRole === 'administrador' && <UserRoleManagement />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
