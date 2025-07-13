import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Mantendremos TabsList y TabsTrigger si no usas el componente DashboardTabs directamente aquí para las Tabs
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
  User, // Añadido para el botón de usuario
  LogOut, // Añadido para cerrar sesión
  UserCog // Añadido para configuración de usuario
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Importar componentes de DropdownMenu
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

// Suponiendo que has movido el componente de pestañas a su propio archivo
import DashboardTabsComponent from '@/components/dashboard/DashboardTabs'; // Importamos tu nuevo componente de pestañas

// Types - using the full database type
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
  const [activeTab, setActiveTab] = useState('overview'); // **Nuevo estado para la pestaña activa**

  // Simular rol de usuario (en una app real vendría de auth)
  const userRole = 'administrador'; // o 'comite', 'revisor'
  const userName = 'Admin User'; // Simulación del nombre de usuario logueado

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
    // **Ahora cambiamos la pestaña activa a través del estado**
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
    // **Ahora cambiamos la pestaña activa a través del estado**
    setActiveTab('professionals');
  };

  // Funciones para el botón de usuario (simuladas)
  const handleLogout = () => {
    console.log("Cerrar sesión");
    // Lógica para cerrar sesión (e.g., limpiar token, redirigir)
    navigate('/login'); // Redirigir a la página de login
  };

  const handleUserSettings = () => {
    console.log("Configuración de usuario");
    // Lógica para abrir modal o redirigir a página de configuración
    // navigate('/user-settings');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Contenedor del encabezado y la barra de pestañas para hacerla fija */}
      <div className="sticky top-0 z-50 bg-gray-50 pb-4 shadow-md"> {/* AÑADIDO: sticky top-0 z-50 y pb-4 shadow-md */}
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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

              {/* AÑADIDO: Dropdown de usuario */}
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

          {/* Filters */}
          {showFilters && (
            <Card>
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

          {/* Stats Cards (Mantenemos aquí o mueves fuera del sticky si prefieres) */}
          <StatsCards onNavigateToProfessionals={handleNavigateToProfessionals} />

          {/* **Nuevo componente de pestañas (DashboardTabsComponent) para la fijeza** */}
          <DashboardTabsComponent
            activeTab={activeTab}
            onTabChange={setActiveTab}
            userRole={userRole}
          />
        </div>
      </div>

      {/* Contenido principal del dashboard (Fuera del contenedor fijo) */}
      <div className="container mx-auto p-6 pt-0 space-y-6"> {/* Añadido pt-0 para compensar el padding del sticky */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Ya no necesitamos TabsList y TabsTrigger aquí porque los maneja DashboardTabsComponent */}
          {/* <TabsList className="grid w-full grid-cols-10">...</TabsList> */}

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
            {/* Solo se muestra si el rol lo permite */}
            {(userRole === 'administrador' || userRole === 'comite') && <MinisterialPanel />}
          </TabsContent>

          <TabsContent value="incidents" className="space-y-6">
            <HospitalIncidents />
          </TabsContent>

          <TabsContent value="health-centers" className="space-y-6">
            <HealthCenters />
          </TabsContent>

          <TabsContent value="user-management" className="space-y-6">
            {/* Solo se muestra si el rol lo permite */}
            {userRole === 'administrador' && <UserRoleManagement />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
