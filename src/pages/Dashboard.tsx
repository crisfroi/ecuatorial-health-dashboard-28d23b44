import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRole } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  ChevronDown,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import components
import StatsCards from "@/components/dashboard/StatsCards";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import ProfessionalsTable from "@/components/dashboard/ProfessionalsTable";
import PanelRRHH from "@/components/dashboard/PanelRRHH";
import TrasladosProfesionalesPanel from "@/components/dashboard/TrasladosProfesionalesPanel";
import ProfessionalDetail from "@/components/dashboard/ProfessionalDetail";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import RequestsPanel from "@/components/dashboard/RequestsPanel";
import RenewalAlerts from "@/components/dashboard/RenewalAlerts";
import IAChatOrchestrator from "@/components/dashboard/IAChatOrchestrator";
import MinisterialPanel from "@/components/dashboard/MinisterialPanel";
import IncidentManagement from "@/components/dashboard/IncidentManagement";
import HealthCenters from "@/components/dashboard/HealthCenters";
import SolicitudesEstablecimientos from "@/components/dashboard/SolicitudesEstablecimientos";
import AdminPanel from "@/components/dashboard/AdminPanel";
import AdvancedAnalyticsDashboard from "@/components/dashboard/AdvancedAnalyticsDashboard";
import ProfessionalSearch from "@/components/dashboard/ProfessionalSearch";
import GlobalSearch from "@/components/dashboard/GlobalSearch";
import ErrorBoundary from "@/components/ui/error-boundary";
import ConnectionDebugPanel from "@/components/dashboard/ConnectionDebugPanel";
import { OfflineNotification } from "@/components/ui/offline-notification";
import { DatabaseDiagnostic } from "@/components/dashboard/DatabaseDiagnostic";
import { GuardiasDashboard } from "@/components/guardias/GuardiasDashboard";
import AsistenciaDashboard from "@/components/asistencia/AsistenciaDashboard";
import { GuardiasStatsWidget } from "@/components/guardias/GuardiasStatsWidget";
import { FuncionariosStatsWidget } from "@/components/dashboard/FuncionariosStatsWidget";
import ResizeObserverTestIndicator from "@/components/dashboard/ResizeObserverTestIndicator";
import CoachMarks, { CoachMarkStep } from "@/components/onboarding/CoachMarks";
import { ENABLE_INTERACTIVE_TOURS, isTourCompleted, setTourCompleted } from "@/config/featureFlags";

import type { Tables } from "@/integrations/supabase/types";

type Profesional = Tables<"profesionales_sanitarios">;

// Definición de tipos para los filtros
interface Filtros {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  distrito?: string;
  distrito_sanitario?: string;
  centro_id?: string;
  centro_nombre?: string;
  edad_minima?: number;
  edad_maxima?: number;
  año_graduacion?: number;
  vencimiento_proximo?: boolean;
  carnet_vencido?: boolean;
  prioridad_renovacion?: "alta" | "media" | "baja" | "vencido" | "all";
  pais_formacion?: string;
  institucion?: string;
  funcion_publica?: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedProfessional, setSelectedProfessional] =
    useState<Profesional | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Filtros>({});
  const [showFilters, setShowFilters] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState<Filtros>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [showStatsCards, setShowStatsCards] = useState(true);
  const [openTour, setOpenTour] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Usar sistema de autenticación real
  const { user, userRole, isLoading, canAccessTab, hasPermission } = useAuth();
  const { currentRole, isAdmin, isRevisor, isMinisterial, isObserver, isCenterDirector } = useRole();

  const userName = user?.full_name || user?.email?.split('@')[0] || "Usuario";

  const handleSelectProfessional = (professional: Profesional) => {
    console.log(
      "Dashboard: Profesional seleccionado para ver detalle:",
      professional.id,
    );
    setSelectedProfessional(professional);
  };

  const handleFiltersChange = (filters: Filtros) => {
    console.log(
      "Dashboard: handleFiltersChange llamado. Nuevos filtros recibidos:",
      filters,
    );
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    console.log("Dashboard: Limpiando todos los filtros.");
    setAppliedFilters({});
    setShowFilters(false);
  };

  const handleNavigateToProfessionals = (filter: Filtros) => {
    console.log("Dashboard: Stats card clicked. Filtro recibido:", filter);
    let newAppliedFilters: Filtros = {};

    if (filter.vencimiento_proximo) {
      newAppliedFilters.vencimiento_proximo = true;
      setActiveTab("renewals");
      console.log(
        'Dashboard: Navegando a la pestaña "renewals" por filtro de "Próximos a Vencer".',
      );
      queryClient.invalidateQueries({ queryKey: ["renewalAlerts"] });
    } else if (filter.carnet_vencido) {
      newAppliedFilters.carnet_vencido = true;
      setActiveTab("renewals");
      console.log(
        'Dashboard: Navegando a la pestaña "renewals" por filtro de "Carnets Vencidos".',
      );
      queryClient.invalidateQueries({ queryKey: ["renewalAlerts"] });
    } else if (filter.prioridad_renovacion) {
      newAppliedFilters.prioridad_renovacion = filter.prioridad_renovacion;
      setActiveTab("renewals");
      console.log(
        'Dashboard: Navegando a la pestaña "renewals" por filtro de "Prioridad de Renovación".',
      );
      queryClient.invalidateQueries({ queryKey: ["renewalAlerts"] });
    } else if (filter.genero) {
      newAppliedFilters.genero = filter.genero;
      setActiveTab("professionals");
      console.log(
        `Dashboard: Navegando a la pestaña "professionals" por filtro de género: ${filter.genero}`,
      );
    } else if (
      filter.estado_solicitud &&
      filter.estado_solicitud !== "Aprobado"
    ) {
      newAppliedFilters.estado_solicitud = filter.estado_solicitud;
      setActiveTab("requests");
      console.log(
        `Dashboard: Navegando a la pestaña 'requests' para estado: ${filter.estado_solicitud}`,
      );
    } else {
      newAppliedFilters = { ...filter };
      setActiveTab("professionals");
      console.log(
        'Dashboard: Navegando a la pestaña "professionals" por filtro general.',
      );
    }

    setAppliedFilters(newAppliedFilters);
    console.log("Dashboard: appliedFilters actualizado a:", newAppliedFilters);
  };

  const handleNavigateFromAnalytics = (tab: string, filters?: any) => {
    console.log("Dashboard: Navegando desde analytics:", tab, filters);
    setActiveTab(tab);
    if (filters) {
      setAppliedFilters(filters);
    }
  };

  const handleNavigateToFuncionarios = () => {
    console.log("Dashboard: Navegando a funcionarios públicos");
    setActiveTab("professionals");
    setAppliedFilters({
      estado_solicitud: "Aprobado",
      funcion_publica: true // Boolean correcto en lugar de string
    });
  };

  useEffect(() => {
    console.log(
      "Dashboard: useEffect activado. Sincronizando appliedFilters con dashboardFilters.",
    );

    // Mantener filtros globales aunque cambie la pestaña, no limpiar automáticamente
    let finalFilters: Filtros = { ...appliedFilters };

    // Solo limpiar filtros muy específicos si perjudican otras vistas (comentado para respetar filtro global)
    // if (activeTab !== "renewals") {
    //   delete finalFilters.vencimiento_proximo;
    //   delete finalFilters.carnet_vencido;
    //   delete finalFilters.prioridad_renovacion;
    // }

    // if (activeTab !== "professionals") {
    //   delete finalFilters.genero;
    // }

    setDashboardFilters(finalFilters);
    console.log("Dashboard: dashboardFilters actualizado a:", finalFilters);
  }, [appliedFilters, activeTab]);


  const handleChartClick = (data: any, chartType: string) => {
    console.log("Dashboard: Chart clicked:", data, chartType);
    const filter: Filtros = {};

    if (chartType === "area_profesional" && data.area) {
      filter.area_profesional = data.area;
    } else if (chartType === "provincia" && data.provincia) {
      filter.provincia = data.provincia;
    } else if (chartType === "estado_solicitud" && data.estado) {
      filter.estado_solicitud = data.estado;
    }

    setAppliedFilters(filter);

    if (filter.estado_solicitud && filter.estado_solicitud !== "Aprobado") {
      console.log(
        `Dashboard: Chart click: Navegando a la pestaña 'requests' para estado: ${filter.estado_solicitud}`,
      );
      setActiveTab("requests");
    } else {
      console.log(
        'Dashboard: Chart click: Navegando a la pestaña "professionals" por filtro general.',
      );
      setActiveTab("professionals");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: 'Sesión cerrada', description: 'Has cerrado sesión exitosamente.' });
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      navigate('/');
    }
  };

  const handleUserSettings = () => {
    console.log("Dashboard: Configuración de usuario.");
  };

  const handleTabChange = (tab: string) => {
    if (tab !== activeTab) {
      setAppliedFilters({});
      setShowFilters(false);
      try { sessionStorage.removeItem('professionals.filters'); } catch {}
      console.log(`Dashboard: Filtros limpiados al cambiar a la pestaña: ${tab}`);
    }
    setActiveTab(tab);
  };

  const handleFullPageScreenshot = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const element = document.body;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `captura_dashboard_${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Error generating screenshot:", e);
      toast({ title: "Error al capturar pantalla", description: "Intenta nuevamente.", variant: "destructive" });
    }
  };

  const sendSmsNotification = async (
    profesionalId: string,
    telefono: string | null,
    nombreCompleto: string,
    fechaValidezCarnet: string | null,
    tipoNotificacion: "manual_proximo" | "manual_vencido",
  ) => {
    console.log(
      `Dashboard: Intentando enviar SMS a ${nombreCompleto} (${telefono}) para ${tipoNotificacion}.`,
    );

    if (!telefono) {
      toast({
        title: "Error de Notificación",
        description:
          "El profesional no tiene un número de teléfono registrado.",
        variant: "destructive",
      });
      return;
    }
    // Validación de formato E.164
    const e164 = /^\+[1-9]\d{6,14}$/;
    if (!e164.test(telefono)) {
      toast({
        title: "Teléfono inv��lido",
        description: "Use formato internacional E.164 (ej.: +240XXXXXXXX)",
        variant: "destructive",
      });
      return;
    }
    console.log("Teléfono recibido:", telefono);

    const formattedDate = fechaValidezCarnet
      ? new Date(fechaValidezCarnet).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "una fecha desconocida";

    let messageBody = "";
    if (tipoNotificacion === "manual_proximo") {
      messageBody = `Recordatorio de Renovación: Estimado/a ${nombreCompleto}, su carnet profesional vence el ${formattedDate}. Por favor, inicie su proceso de renovación.`;
    } else if (tipoNotificacion === "manual_vencido") {
      messageBody = `Alerta de Carnet Vencido: Estimado/a ${nombreCompleto}, su carnet profesional venció el ${formattedDate}. Por favor, renueve su carnet lo antes posible.`;
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "send-sms-notification",
        {
          body: JSON.stringify({
            profesionalId,
            telefono,
            tipoNotificacion,
            mensaje: messageBody,
          }),
          method: "POST",
        },
      );

      if (error) {
        console.error("Error al invocar Edge Function para SMS:", error);
        const contextBody = (error as any)?.context?.body;
        const serverDetail = typeof contextBody === 'string' ? contextBody : (contextBody?.error || contextBody?.message);
        toast({
          title: "Error al Enviar SMS",
          description: `No se pudo enviar el SMS a ${nombreCompleto}. ${serverDetail || error.message}`,
          variant: "destructive",
        });
      } else {
        console.log("Respuesta de Edge Function para SMS:", data);
        if (data && (data as any).success) {
          toast({
            title: "SMS Enviado Exitosamente",
            description: `Se ha enviado un SMS a ${nombreCompleto}.`,
          });
        } else {
          const errMsg = (data as any)?.error || (data as any)?.message || "Error desconocido";
          toast({
            title: "Error al Enviar SMS",
            description: `Hubo un problema al enviar el SMS a ${nombreCompleto}: ${errMsg}`,
            variant: "destructive",
          });
        }
      }
    } catch (apiError: any) {
      console.error("Error general al enviar SMS:", apiError);
      toast({
        title: "Error de Conexión",
        description: `No se pudo conectar con el servicio de SMS. ${apiError.message || ""}`,
        variant: "destructive",
      });
    }
  };

  const hasActiveFilters = Object.keys(appliedFilters).length > 0;

  // Early return if still loading authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // If no user is authenticated, redirect to login
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Requerido
            </h1>
            <p className="text-gray-600">
              Necesitas iniciar sesión para acceder al dashboard.
            </p>
          </div>
          <Button
            onClick={() => navigate('/')}
            className="w-full"
          >
            Ir al Login
          </Button>
        </div>
      </div>
    );
  }

  // If no role is assigned, show error
  if (!userRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Sin Permisos Asignados
            </h1>
            <p className="text-gray-600">
              Tu cuenta no tiene un rol asignado. Contacta al administrador del sistema.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Usuario: {user.email}
            </p>
          </div>
          <div className="space-y-2">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Configuración de pestañas basada en roles reales (con verificaciones de seguridad)
  const tabsConfig = [
    { id: "overview", label: "General", icon: BarChart3 },
    { id: "professionals", label: "Profesionales", icon: Users },
    ...(userRole && canAccessTab("requests") ? [{ id: "requests", label: "Solicitudes", icon: FileText }] : []),
    ...(userRole && canAccessTab("renewals") ? [{ id: "renewals", label: "Renovaciones", icon: Calendar }] : []),
    ...(userRole && canAccessTab("guardias") ? [{ id: "guardias", label: "Guardias", icon: Clock }] : []),
    ...(userRole && canAccessTab("asistencia") ? [{ id: "asistencia", label: "Asistencia", icon: Clock }] : []),
    ...(userRole && canAccessTab("analytics") ? [{ id: "analytics", label: "Analíticas", icon: TrendingUp }] : []),
    ...(userRole && canAccessTab("iachat") ? [{ id: "iachat", label: "IA Chat", icon: MessageSquare }] : []),
    ...(userRole && canAccessTab("ministerial") ? [{ id: "ministerial", label: "Ministerial", icon: Settings }] : []),
    ...(userRole && canAccessTab("incidents") ? [{ id: "incidents", label: "Incidencias", icon: Activity }] : []),
    ...(userRole && canAccessTab("health-centers") ? [{ id: "health-centers", label: "Centros", icon: MapPin }] : []),
    ...(userRole && canAccessTab("establecimientos") ? [{ id: "establecimientos", label: "Solicitudes Establecimientos", icon: Building2 }] : []),
    ...(userRole && canAccessTab("traslados") ? [{ id: "traslados", label: "Traslados", icon: ArrowRight }] : []),
    ...(userRole && hasPermission("manage_users") ? [{ id: "users", label: "Usuarios", icon: UserCog }] : []),
    ...(userRole && hasPermission("system_configuration") ? [{ id: "admin", label: "Admin", icon: Settings }] : []),
  ].filter(tab => userRole ? canAccessTab(tab.id) : tab.id === "overview" || tab.id === "professionals");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <OfflineNotification />
      <div className="sticky top-0 z-50 bg-gray-50 shadow-md">
        <div className="container mx-auto p-4">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-0"
          >
            <div className="w-full overflow-x-auto whitespace-nowrap" data-tour="dashboard-tabs">
              <TabsList className="min-w-max flex gap-2 p-2 bg-muted rounded-md no-scrollbar">
              {tabsConfig.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    data-tour={`tab-${tab.id}`}
                    className={`
                      whitespace-nowrap flex items-center gap-2 px-3 py-2 text-sm
                      ${
                        activeTab === tab.id
                          ? ""
                          : "hover:bg-primary/10 hover:text-primary"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline font-medium">
                      {tab.label}
                    </span>
                  </TabsTrigger>
                );
              })}
              </TabsList>
            </div>
          </Tabs>
        </div>
      </div>

      <div className="container mx-auto p-6 pt-0 flex-grow">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard de Gestión
            </h1>
            <p className="text-gray-600 mt-1">
              Sistema de gestión de profesionales sanitarios
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div data-tour="dashboard-global-search">
              <GlobalSearch onNavigate={(tab, filters) => {
                setActiveTab(tab);
                if (filters) setAppliedFilters(filters as any);
              }} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowStatsCards(!showStatsCards);
                console.log(
                  `Dashboard: Alternando visibilidad de StatsCards a: ${!showStatsCards}`,
                );
              }}
              className="flex items-center gap-2"
              data-tour="dashboard-stats-toggle"
            >
              {showStatsCards ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {showStatsCards
                ? "Replegar Estadísticas"
                : "Desplegar Estadísticas"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowFilters(!showFilters);
                console.log(
                  `Dashboard: Alternando visibilidad de Filtros a: ${!showFilters}`,
                );
              }}
              className="flex items-center gap-2"
              data-tour="dashboard-filters-toggle"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
                data-tour="dashboard-filters-clear"
              >
                <X className="w-4 h-4" />
                Limpiar Filtros
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
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
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-6" data-tour="dashboard-filters">
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
              />
            </CardContent>
          </Card>
        )}

        {showStatsCards && activeTab === "overview" && (
          <div className="mb-6" data-tour="dashboard-stats-cards">
            <StatsCards
              filters={dashboardFilters}
              onNavigateToProfessionals={handleNavigateToProfessionals}
            />
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsContent value="overview" className="space-y-6">
            <ErrorBoundary>
              <ProfessionalSearch
                onSelectProfessional={(professional) => {
                  setSelectedProfessional(professional);
                  setActiveTab("professionals");
                }}
                onNavigateToProfessionals={() => setActiveTab("professionals")}
              />
            </ErrorBoundary>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DashboardCharts onChartClick={handleChartClick} filters={dashboardFilters} />
              </div>
              <div className="space-y-6">
                <GuardiasStatsWidget
                  userRole={userRole}
                  onNavigateToGuardias={() => setActiveTab("guardias")}
                />
                <FuncionariosStatsWidget
                  userRole={userRole}
                  onNavigateToFuncionarios={handleNavigateToFuncionarios}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="professionals" className="space-y-6" data-tour="dashboard-professionals">
            {selectedProfessional ? (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedProfessional(null);
                    console.log(
                      "Dashboard: Volviendo a la lista de profesionales.",
                    );
                  }}
                  className="flex items-center gap-2"
                >
                  ← Volver a la lista
                </Button>
                <ProfessionalDetail
                  professional={selectedProfessional}
                  onClose={() => {
                    setSelectedProfessional(null);
                    console.log("Dashboard: Cerrando detalle de profesional.");
                  }}
                />
              </div>
            ) : (
              <ProfessionalsTable
                onSelectProfessional={handleSelectProfessional}
                userRole={currentRole}
                appliedFilters={dashboardFilters}
                onClearFilters={handleClearFilters}
              />
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6" data-tour="dashboard-requests">
            <RequestsPanel
              userRole={currentRole}
              initialStatusFilter={dashboardFilters.estado_solicitud}
              onSelectProfessional={handleSelectProfessional}
            />
          </TabsContent>

          <TabsContent value="renewals" className="space-y-6" data-tour="dashboard-renewals">
            <RenewalAlerts
              dashboardFilters={dashboardFilters}
              onSelectProfessional={handleSelectProfessional}
              onSendSmsNotification={sendSmsNotification}
            />
          </TabsContent>

          <TabsContent value="guardias" className="space-y-6" data-tour="dashboard-guardias">
            <GuardiasDashboard userRole={userRole} />
          </TabsContent>

          <TabsContent value="asistencia" className="space-y-6" data-tour="dashboard-asistencia">
            <AsistenciaDashboard />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6" data-tour="dashboard-analytics">
            <AdvancedAnalyticsDashboard
              onNavigateToTab={handleNavigateFromAnalytics}
              filters={dashboardFilters}
            />
          </TabsContent>

          <TabsContent value="iachat" className="space-y-6" data-tour="dashboard-iachat">
            <IAChatOrchestrator
              filters={dashboardFilters}
              onNavigateToTab={(tab, filters) => {
                setActiveTab(tab);
                if (filters) setAppliedFilters(filters);
              }}
            />
          </TabsContent>

          <TabsContent value="ministerial" className="space-y-6" data-tour="dashboard-ministerial">
            {(hasPermission("view_ministerial_panel")) && (
              <MinisterialPanel />
            )}
          </TabsContent>

          <TabsContent value="incidents" className="space-y-6" data-tour="dashboard-incidents">
            <IncidentManagement />
          </TabsContent>

          <TabsContent value="health-centers" className="space-y-6" data-tour="dashboard-centros">
            <HealthCenters dashboardFilters={dashboardFilters} />
          </TabsContent>

          <TabsContent value="establecimientos" className="space-y-6" data-tour="dashboard-establecimientos">
            <SolicitudesEstablecimientos userRole={userRole as string} />
          </TabsContent>

          <TabsContent value="users" className="space-y-6" data-tour="dashboard-users">
            {hasPermission("manage_users") && <AdminPanel />}
          </TabsContent>

          <TabsContent value="admin" className="space-y-6" data-tour="dashboard-admin">
            {(userRole === 'RRHH_MINISTERIO' || userRole === 'SUPER_ADMINISTRADOR') && (
              <PanelRRHH userRole={userRole} />
            )}
            {userRole === 'ADMIN_CENTRO_SANITARIO' && <AdminPanel />}
            {hasPermission("system_configuration") && userRole === 'SUPER_ADMINISTRADOR' && <AdminPanel />}
          </TabsContent>

          <TabsContent value="traslados" className="space-y-6">
            <TrasladosProfesionalesPanel userRole={userRole} />
          </TabsContent>
        </Tabs>

        <button
          onClick={handleFullPageScreenshot}
          aria-label="Capturar pantalla"
          className="fixed bottom-6 right-6 z-50 rounded-full bg-guinea-teal text-white shadow-lg hover:opacity-90 transition-opacity p-4"
          title="Capturar pantalla"
        >
          📷
        </button>

        {ENABLE_INTERACTIVE_TOURS && !isTourCompleted('dashboard') && (
          <>
            <button
              onClick={() => setOpenTour(true)}
              className="fixed bottom-24 right-6 z-50 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors p-3"
              aria-label="Ayuda"
              title="Guía rápida"
            >
              ?
            </button>
            <CoachMarks
              open={openTour}
              steps={[
                { id: 'tabs', target: '[data-tour="dashboard-tabs"]', title: 'Módulos del Dashboard', content: 'Navega entre módulos: General, Profesionales, Renovaciones, Analíticas, IA, y más según tus permisos.' },
                { id: 'search', target: '[data-tour="dashboard-global-search"]', title: 'Búsqueda Global', content: 'Busca profesionales o datos en todo el sistema y navega directamente a los resultados.' },
                { id: 'filters-toggle', target: '[data-tour="dashboard-filters-toggle"]', title: 'Filtros Globales', content: 'Muestra u oculta los filtros. Los filtros aplican a múltiples módulos.' },
                { id: 'stats-toggle', target: '[data-tour="dashboard-stats-toggle"]', title: 'Tarjetas de Estadísticas', content: 'Muestra/oculta el resumen general y navega con un clic aplicando filtros.' },
                ...(activeTab === 'overview' ? [{ id: 'stats-cards', target: '[data-tour="dashboard-stats-cards"]', title: 'Resumen General', content: 'Panel con métricas clave y acceso rápido a vistas filtradas.' } as CoachMarkStep] : []),
                ...(canAccessTab('professionals') ? [{ id: 'tab-prof', target: '[data-tour="tab-professionals"]', title: 'Profesionales', content: 'Lista y detalle de profesionales. Aplica filtros y selecciona para ver información completa.' } as CoachMarkStep] : []),
                ...(canAccessTab('requests') ? [{ id: 'tab-req', target: '[data-tour="tab-requests"]', title: 'Solicitudes', content: 'Gestiona solicitudes en trámite y estados pendientes.' } as CoachMarkStep] : []),
                ...(canAccessTab('renewals') ? [{ id: 'tab-ren', target: '[data-tour="tab-renewals"]', title: 'Renovaciones', content: 'Gestiona carnets próximos a vencer y vencidos. Envía recordatorios por SMS.' } as CoachMarkStep] : []),
                ...(canAccessTab('analytics') ? [{ id: 'tab-ana', target: '[data-tour="tab-analytics"]', title: 'Analíticas', content: 'Explora estadísticas avanzadas y navega aplicando filtros desde los gráficos.' } as CoachMarkStep] : []),
                ...(canAccessTab('iachat') ? [{ id: 'tab-ia', target: '[data-tour="tab-iachat"]', title: 'IA Chat', content: 'Asistente de IA para consultas y acciones dentro del sistema.' } as CoachMarkStep] : []),
                ...(canAccessTab('ministerial') ? [{ id: 'tab-min', target: '[data-tour="tab-ministerial"]', title: 'Ministerial', content: 'Panel para autoridades con indicadores y acciones ministeriales.' } as CoachMarkStep] : []),
                ...(canAccessTab('incidents') ? [{ id: 'tab-inc', target: '[data-tour="tab-incidents"]', title: 'Incidencias', content: 'Registro y seguimiento de incidencias del sistema.' } as CoachMarkStep] : []),
                ...(canAccessTab('health-centers') ? [{ id: 'tab-cent', target: '[data-tour="tab-health-centers"]', title: 'Centros de Salud', content: 'Gestión y directorio de centros de salud.' } as CoachMarkStep] : []),
                ...(canAccessTab('establecimientos') ? [{ id: 'tab-est', target: '[data-tour="tab-establecimientos"]', title: 'Solicitudes Establecimientos', content: 'Gestiona solicitudes de establecimientos sanitarios.' } as CoachMarkStep] : []),
                ...(hasPermission('manage_users') ? [{ id: 'tab-users', target: '[data-tour="tab-users"]', title: 'Usuarios', content: 'Administración de usuarios del sistema.' } as CoachMarkStep] : []),
                ...(hasPermission('system_configuration') ? [{ id: 'tab-admin', target: '[data-tour="tab-admin"]', title: 'Admin', content: 'Configuración avanzada del sistema.' } as CoachMarkStep] : []),
              ]}
              onClose={() => setOpenTour(false)}
              onFinish={() => setTourCompleted('dashboard')}
            />
          </>
        )}

        <button
          onClick={handleFullPageScreenshot}
          aria-label="Capturar pantalla"
          className="fixed bottom-6 right-6 z-50 rounded-full bg-guinea-teal text-white shadow-lg hover:opacity-90 transition-opacity p-4"
          title="Capturar pantalla"
        >
          📷
        </button>
      </div>

      {/* ResizeObserver test indicator - only shown during development */}
      {import.meta.env.DEV && <ResizeObserverTestIndicator />}
    </div>
  );
};

export default Dashboard;
