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

// **ACTUALIZACIÓN CLAVE**: Tipo de filtros consolidado
interface Filtros {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  distrito?: string;
  anoGraduacion?: string;
  vencimiento_proximo?: boolean;
  carnet_vencido?: boolean;
  prioridad_renovacion?: 'alta' | 'media' | 'baja' | 'vencido' | 'all';
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedProfessional, setSelectedProfessional] = useState<Profesional | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Filtros>({});
  const [showFilters, setShowFilters] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState<Filtros>({}); // Filtros que se pasan a los componentes de las pestañas
  const [activeTab, setActiveTab] = useState('overview');
  const [showStatsCards, setShowStatsCards] = useState(true);

  const userRole = 'administrador'; // Hardcoded for now, replace with actual user role from auth context
  const userName = 'Admin User'; // Hardcoded for now, replace with actual user name

  const handleSelectProfessional = (professional: Profesional) => {
    setSelectedProfessional(professional);
  };

  const handleFiltersChange = (filters: Filtros) => {
    console.log('Dashboard: Applying filters from DashboardFilters component:', filters);
    setAppliedFilters(filters);
    setDashboardFilters(filters); // Sincroniza los filtros globales
  };

  // **ACTUALIZACIÓN CLAVE**: Lógica mejorada para limpiar todos los filtros
  const handleClearFilters = () => {
    console.log('Dashboard: Clearing all filters');
    setAppliedFilters({});
    setDashboardFilters({}); // Esto limpiará los filtros que se pasan a los hijos
    setShowFilters(false);
    // Nota: Los componentes hijos deben tener un useEffect para reaccionar a dashboardFilters={}
    // y resetear sus propios estados internos de filtro.
  };

  // **ACTUALIZACIÓN CLAVE**: Lógica mejorada para navegar y aplicar filtros desde StatsCards
  const handleNavigateToProfessionals = (filter: Filtros) => {
    console.log('Dashboard: Stats card clicked with filter:', filter);
    setAppliedFilters(filter); // Los filtros aplicados para mostrar en la UI de filtros activos

    if (filter.estado_solicitud && filter.estado_solicitud !== 'Aprobado' && filter.estado_solicitud !== 'todos') {
      // Es un filtro de solicitud (Pendiente, Revisando, Rechazado, Pendiente de Firma)
      setActiveTab('requests');
      setDashboardFilters({ estado_solicitud: filter.estado_solicitud });
    } else if (filter.vencimiento_proximo || filter.carnet_vencido) {
      // Es un filtro de renovación (vencimiento_proximo o carnet_vencido)
      setActiveTab('renewals');
      setDashboardFilters(filter); // Pasa el objeto completo con { vencimiento_proximo: true } o { carnet_vencido: true }
    } else {
      // Por defecto o cualquier otro filtro (ej. por área, provincia, si estado_solicitud es Aprobado o todos)
      // va a la tabla de profesionales aprobados
      setActiveTab('professionals');
      setDashboardFilters(filter);
    }
  };

  const handleChartClick = (data: any, chartType: string) => {
    console.log('Dashboard: Chart clicked:', data, chartType);
    const filter: Filtros = {};

    if (chartType === 'area_profesional' && data.area) {
      filter.area_profesional = data.area;
      filter.estado_solicitud = 'Aprobado'; // Por defecto, si se filtra por área, mostrar aprobados
    } else if (chartType === 'provincia' && data.provincia) {
      filter.provincia = data.provincia;
      filter.estado_solicitud = 'Aprobado'; // Por defecto, si se filtra por provincia, mostrar aprobados
    } else if (chartType === 'estado_solicitud' && data.estado) {
      filter.estado_solicitud = data.estado;
    }

    // Usar la misma lógica que handleNavigateToProfessionals para consistencia
    if (filter.estado_solicitud && filter.estado_solicitud !== 'Aprobado' && filter.estado_solicitud !== 'todos') {
      setActiveTab('requests');
      setDashboardFilters({ estado_solicitud: filter.estado_solicitud });
    } else {
      setActiveTab('professionals');
      setDashboardFilters(filter);
    }
    setAppliedFilters(filter);
  };

  const handleLogout = () => {
    console.log("Cerrar sesión");
    navigate('/login');
  };

  const handleUserSettings = () => {
    console.log("Configuración de usuario");
  };

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStatsCards(!showStatsCards)}
              className="flex items-center gap-2"
            >
              {showStatsCards ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showStatsCards ? 'Replegar Estadísticas' : 'Desplegar Estadísticas'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>

            {(Object.keys(appliedFilters).length > 0) && ( // Usar appliedFilters para saber si hay algo que limpiar
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

        {/* Filters (desplegables y desplazables) */}
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
                filters={appliedFilters} // Mostrar los filtros actualmente aplicados
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
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

        {/* Contenido de las pestañas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsContent value="overview" className="space-y-6">
            <DashboardCharts onChartClick={handleChartClick} />
          </TabsContent>

          <TabsContent value="professionals" className="space-y-6">
            {selectedProfessional ? (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProfessional(null)}
                  className="flex items-center gap-2"
                >
                  ← Volver a la lista
                </Button>
                <ProfessionalDetail
                  professional={selectedProfessional}
                  onClose={() => setSelectedProfessional(null)}
                />
              </div>
            ) : (
              <ProfessionalsTable
                onSelectProfessional={handleSelectProfessional}
                userRole={userRole}
                appliedFilters={appliedFilters} // Para mostrar los badges de filtros
                onClearFilters={handleClearFilters}
                dashboardFilters={dashboardFilters} // **ACTUALIZACIÓN CLAVE**: Pasa los filtros a la tabla
              />
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <RequestsPanel
              userRole={userRole}
              initialStatusFilter={dashboardFilters.estado_solicitud} // **ACTUALIZACIÓN CLAVE**: Pasa el filtro de estado
              onSelectProfessional={handleSelectProfessional} // Para poder ver detalles desde RequestsPanel
            />
          </TabsContent>

          <TabsContent value="renewals" className="space-y-6">
            <RenewalAlerts
              dashboardFilters={dashboardFilters} // **ACTUALIZACIÓN CLAVE**: Pasa los filtros de vencimiento
              onNavigateToProfessionals={handleNavigateToProfessionals} // Si RenewalAlerts necesita navegar
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

export default Dashboard;import React, { useState, useEffect } from 'react';
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

interface Filtros {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  distrito?: string;
  anoGraduacion?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedProfessional, setSelectedProfessional] = useState<Profesional | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Filtros>({});
  const [showFilters, setShowFilters] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState<Filtros>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [showStatsCards, setShowStatsCards] = useState(true);

  const userRole = 'administrador';
  const userName = 'Admin User';

  const handleSelectProfessional = (professional: Profesional) => {
    setSelectedProfessional(professional);
  };

  const handleFiltersChange = (filters: Filtros) => {
    console.log('Dashboard: Applying filters:', filters);
    setAppliedFilters(filters);
    setDashboardFilters(filters);
  };

  const handleClearFilters = () => {
    console.log('Dashboard: Clearing filters');
    setAppliedFilters({});
    setDashboardFilters({});
    setShowFilters(false);
  };

  const handleNavigateToProfessionals = (filter: Filtros) => {
    console.log('Dashboard: Stats card clicked with filter:', filter);
    setDashboardFilters(filter);
    setAppliedFilters(filter);
    setActiveTab('professionals');
  };

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

    setDashboardFilters(filter);
    setAppliedFilters(filter);
    setActiveTab('professionals');
  };

  const handleLogout = () => {
    console.log("Cerrar sesión");
    navigate('/login');
  };

  const handleUserSettings = () => {
    console.log("Configuración de usuario");
  };

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
        <div className="container mx-auto p-4"> {/* Reducido el padding para que sea más compacto */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0"> {/* Eliminado mt-6 aquí */}
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
      <div className="container mx-auto p-6 pt-0 flex-grow"> {/* Añadido pt-0 para evitar doble padding */}

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
              onClick={() => setShowStatsCards(!showStatsCards)}
              className="flex items-center gap-2"
            >
              {showStatsCards ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showStatsCards ? 'Replegar Estadísticas' : 'Desplegar Estadísticas'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>

            {(Object.keys(appliedFilters).length > 0 || Object.keys(dashboardFilters).length > 0) && (
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
          <Card className="mb-6"> {/* Ajustado a mb-6 para espacio */}
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
                onClearFilters={handleClearFilters}
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
          {/* Los TabsContent deben estar aquí */}
          <TabsContent value="overview" className="space-y-6">
            <DashboardCharts onChartClick={handleChartClick} />
          </TabsContent>

          <TabsContent value="professionals" className="space-y-6">
            {selectedProfessional ? (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProfessional(null)}
                  className="flex items-center gap-2"
                >
                  ← Volver a la lista
                </Button>
                <ProfessionalDetail
                  professional={selectedProfessional}
                  onClose={() => setSelectedProfessional(null)}
                />
              </div>
            ) : (
              <ProfessionalsTable
                onSelectProfessional={handleSelectProfessional}
                userRole={userRole}
                appliedFilters={appliedFilters}
                onClearFilters={handleClearFilters}
                dashboardFilters={dashboardFilters}
              />
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <RequestsPanel userRole={userRole} />
          </TabsContent>

          <TabsContent value="renewals" className="space-y-6">
            <RenewalAlerts />
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
