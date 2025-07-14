import React, { useState, useEffect, useCallback } from 'react';
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
import { useAuth } from '@/context/AuthContext'; // Importar useAuth para el rol del usuario

type Profesional = Tables<'profesionales_sanitarios'>;

// Definición de tipos para los filtros. Incluimos todos los posibles para el dashboard.
interface Filtros {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  distrito?: string;
  anoGraduacion?: string;
  search?: string; // Filtro de búsqueda global
  // Filtros específicos para RenewalAlerts que Dashboard podría pasar
  vencimiento_proximo?: boolean;
  carnet_vencido?: boolean;
  prioridad_renovacion?: 'alta' | 'media' | 'baja' | 'vencido' | 'todos';
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Obtener el usuario del contexto de autenticación

  // Determinar el rol del usuario. Si no hay usuario o rol, por defecto 'profesional'.
  const userRole = user?.user_metadata?.role || 'profesional';
  const userName = user?.user_metadata?.nombre || 'Usuario'; // Nombre del usuario logueado

  const [selectedProfessional, setSelectedProfessional] = useState<Profesional | null>(null);
  // appliedFilters: Los filtros que se muestran en el componente DashboardFilters
  const [appliedFilters, setAppliedFilters] = useState<Filtros>({});
  const [showFilters, setShowFilters] = useState(false);
  // dashboardFilters: Los filtros finales que se pasan a los componentes de tabla/panel
  const [dashboardFilters, setDashboardFilters] = useState<Filtros>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [showStatsCards, setShowStatsCards] = useState(true);
  const [globalSearchText, setGlobalSearchText] = useState<string>(''); // Nuevo estado para la búsqueda global

  // Callback para seleccionar un profesional y mostrar su detalle
  const handleSelectProfessional = useCallback((professional: Profesional) => {
    console.log('Dashboard: Professional selected for detail view:', professional.id);
    setSelectedProfessional(professional);
  }, []);

  // Callback para cerrar la vista de detalle del profesional
  const handleCloseProfessionalDetail = useCallback(() => {
    console.log('Dashboard: Closing professional detail view.');
    setSelectedProfessional(null);
  }, []);

  // Función para consolidar y aplicar los filtros
  const applyCurrentFilters = useCallback(() => {
    console.log('Dashboard: Applying current filters...');
    const currentCombinedFilters: Filtros = { ...appliedFilters };

    // Si la búsqueda global tiene texto, añadirlo a los filtros combinados
    if (globalSearchText.trim() !== '') {
      currentCombinedFilters.search = globalSearchText.trim();
      console.log('Dashboard: Global search text applied:', globalSearchText.trim());
    } else {
      // Asegurarse de que el campo de búsqueda se limpia si el texto está vacío
      delete currentCombinedFilters.search;
    }

    // Asegurarse de que `estado_solicitud: 'todos'` no se pase como filtro real
    if (currentCombinedFilters.estado_solicitud === 'todos') {
      delete currentCombinedFilters.estado_solicitud;
      console.log('Dashboard: Removed "todos" from estado_solicitud filter.');
    }

    // Los filtros de vencimiento y prioridad solo se pasan a RenewalAlerts.
    // Aquí nos aseguramos de que no se mezclen si no son relevantes para la pestaña.
    if (activeTab !== 'renewals') {
        delete currentCombinedFilters.vencimiento_proximo;
        delete currentCombinedFilters.carnet_vencido;
        delete currentCombinedFilters.prioridad_renovacion;
        console.log('Dashboard: Cleared renewal-specific filters as not on renewals tab.');
    }

    setDashboardFilters(currentCombinedFilters);
    console.log('Dashboard: Final dashboardFilters set:', currentCombinedFilters);
  }, [appliedFilters, globalSearchText, activeTab]);


  // useEffect para aplicar filtros cuando `appliedFilters`, `globalSearchText` o `activeTab` cambian
  useEffect(() => {
    console.log('Dashboard: Effect triggered due to filter/tab change. Recalculating dashboardFilters...');
    applyCurrentFilters();
  }, [appliedFilters, globalSearchText, activeTab, applyCurrentFilters]); // Dependencia de applyCurrentFilters es importante para useCallback


  // Manejador para los cambios en DashboardFilters
  const handleFiltersChange = useCallback((filters: Filtros) => {
    console.log('Dashboard: Filters changed by DashboardFilters component:', filters);
    setAppliedFilters(filters);
    // applyCurrentFilters se llamará por el useEffect
  }, []);

  // Manejador para limpiar todos los filtros
  const handleClearFilters = useCallback(() => {
    console.log('Dashboard: Clearing all filters.');
    setAppliedFilters({});
    setGlobalSearchText(''); // Limpiar también la búsqueda global
    // applyCurrentFilters se llamará por el useEffect
    setShowFilters(false); // Opcional: Ocultar los filtros al limpiar
  }, []);

  // Manejador para la navegación desde las StatsCards
  const handleNavigateToProfessionals = useCallback((filter: Filtros) => {
    console.log('Dashboard: Stats card clicked with filter:', filter);

    // Reinicia los filtros y aplica los de la tarjeta, manteniendo la búsqueda global
    const newAppliedFilters: Filtros = {
      ...filter,
      search: globalSearchText // Mantiene la búsqueda global
    };
    setAppliedFilters(newAppliedFilters);

    // Decide a qué pestaña ir según el filtro de la tarjeta
    if (filter.estado_solicitud && filter.estado_solicitud !== 'Aprobado') {
      console.log(`Dashboard: Navigating to 'requests' tab for status: ${filter.estado_solicitud}`);
      setActiveTab('requests');
    } else if (filter.vencimiento_proximo || filter.carnet_vencido || filter.prioridad_renovacion) {
      console.log('Dashboard: Navigating to "renewals" tab for expiration/priority filter.');
      setActiveTab('renewals');
    } else {
      console.log('Dashboard: Navigating to "professionals" tab for general filter.');
      setActiveTab('professionals');
    }
    // applyCurrentFilters se llamará por el useEffect
  }, [globalSearchText]);

  // Manejador para clics en los gráficos (para aplicar filtros)
  const handleChartClick = useCallback((data: any, chartType: string) => {
    console.log('Dashboard: Chart clicked:', data, 'Type:', chartType);
    const filter: Filtros = {};

    if (chartType === 'area_profesional' && data.area) {
      filter.area_profesional = data.area;
    } else if (chartType === 'provincia' && data.provincia) {
      filter.provincia = data.provincia;
    } else if (chartType === 'estado_solicitud' && data.estado) {
      // Si el gráfico es de estado de solicitud, se aplica al filtro
      filter.estado_solicitud = data.estado;
    }

    const newAppliedFilters: Filtros = {
      ...filter,
      search: globalSearchText // Mantiene la búsqueda global
    };

    setAppliedFilters(newAppliedFilters);
    // Si el filtro es de estado de solicitud y no es 'Aprobado', ir a la pestaña de solicitudes
    if (filter.estado_solicitud && filter.estado_solicitud !== 'Aprobado') {
      setActiveTab('requests');
      console.log(`Dashboard: Chart click navigating to 'requests' tab for status: ${filter.estado_solicitud}`);
    } else {
      setActiveTab('professionals');
      console.log('Dashboard: Chart click navigating to "professionals" tab.');
    }
    // applyCurrentFilters se llamará por el useEffect
  }, [globalSearchText]);

  // Funciones de usuario
  const handleLogout = useCallback(() => {
    console.log("Dashboard: User logging out.");
    navigate('/login'); // O la ruta de cierre de sesión de tu aplicación
  }, [navigate]);

  const handleUserSettings = useCallback(() => {
    console.log("Dashboard: User settings accessed.");
    // Lógica para navegar a la configuración de usuario o abrir un modal
  }, []);

  // Determinar si hay algún filtro activo para mostrar el botón de "Limpiar filtros"
  const hasActiveFilters = useCallback(() => {
    const isAppliedFiltersEmpty = Object.keys(appliedFilters).every(key => {
      const value = (appliedFilters as any)[key];
      return value === undefined || value === '' || value === 'todos' || value === null;
    });
    return !isAppliedFiltersEmpty || globalSearchText.trim() !== '';
  }, [appliedFilters, globalSearchText]);


  // Configuración de las pestañas
  const tabsConfig = [
    { id: 'overview', label: 'General', icon: BarChart3 },
    { id: 'professionals', label: 'Profesionales', icon: Users },
    // Las pestañas de 'requests' y 'users' solo se muestran para roles específicos
    ...(userRole === 'administrador' || userRole === 'comite' ? [{ id: 'requests', label: 'Solicitudes', icon: FileText }] : []),
    { id: 'renewals', label: 'Renovaciones', icon: Calendar },
    { id: 'analytics', label: 'Analíticas', icon: TrendingUp },
    { id: 'ai-chat', label: 'IA Chat', icon: MessageSquare },
    { id: 'ministerial', label: 'Ministerial', icon: Settings },
    { id: 'incidents', label: 'Incidencias', icon: Activity },
    { id: 'health-centers', label: 'Centros', icon: Building2 }, // Icono cambiado de MapPin a Building2
    ...(userRole === 'administrador' ? [{ id: 'users', label: 'Usuarios', icon: UserCog }] : []) // Icono cambiado de Users a UserCog
  ];


  // Si hay un profesional seleccionado, muestra el detalle en lugar del dashboard completo
  if (selectedProfessional) {
    console.log('Dashboard: Rendering ProfessionalDetail component.');
    return (
      <ProfessionalDetail
        professional={selectedProfessional}
        onClose={handleCloseProfessionalDetail}
      />
    );
  }

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
                console.log(`Dashboard: Toggling StatsCards visibility to: ${!showStatsCards}`);
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
                console.log(`Dashboard: Toggling filters visibility to: ${!showFilters}`);
              }}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>

            {/* Botón Limpiar Filtros */}
            {hasActiveFilters() && (
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
              {/* Nuevo Input de búsqueda global dentro de DashboardFilters */}
              <div className="mb-4">
                <label htmlFor="global-search-input" className="text-sm font-medium sr-only">Búsqueda Global</label>
                <Input
                  id="global-search-input"
                  placeholder="Buscar por nombre, DNI, número de colegiado..."
                  value={globalSearchText}
                  onChange={(e) => {
                    setGlobalSearchText(e.target.value);
                    console.log('Dashboard: Global search text changed:', e.target.value);
                  }}
                  className="mb-4" // Espacio entre este input y los filtros de DashboardFilters
                />
              </div>
              <DashboardFilters
                filters={appliedFilters}
                onFiltersChange={handleFiltersChange}
                // onClearFilters se manejará por el botón global de Limpiar Filtros
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
            {/* ProfessionalsTable recibe dashboardFilters, que incluye search y los filtros de DashboardFilters */}
            <ProfessionalsTable
              onSelectProfessional={handleSelectProfessional}
              userRole={userRole}
              appliedFilters={dashboardFilters} // Pass dashboardFilters here
            />
          </TabsContent>

          {(userRole === 'administrador' || userRole === 'comite') && (
            <TabsContent value="requests" className="space-y-6">
              {/* RequestsPanel recibe initialStatusFilter del dashboardFilters */}
              <RequestsPanel
                userRole={userRole}
                initialStatusFilter={dashboardFilters.estado_solicitud}
                onSelectProfessional={handleSelectProfessional}
              />
            </TabsContent>
          )}

          <TabsContent value="renewals" className="space-y-6">
            {/* RenewalAlerts recibe los filtros de vencimiento del dashboardFilters */}
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

          {userRole === 'administrador' && (
            <TabsContent value="users" className="space-y-6">
              <UserRoleManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
