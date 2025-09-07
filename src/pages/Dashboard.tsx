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
import { GuardiasStatsWidget } from "@/components/guardias/GuardiasStatsWidget";
import { FuncionariosStatsWidget } from "@/components/dashboard/FuncionariosStatsWidget";
import ResizeObserverTestIndicator from "@/components/dashboard/ResizeObserverTestIndicator";

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
    let finalFilters: Filtros = { ...appliedFilters };

    if (activeTab !== "renewals") {
      delete finalFilters.vencimiento_proximo;
      delete finalFilters.carnet_vencido;
      delete finalFilters.prioridad_renovacion;
      console.log(
        'Dashboard: Se eliminaron filtros de renovación porque la pestaña activa no es "renewals".',
      );
    }

    if (activeTab !== "professionals") {
      delete finalFilters.genero;
      console.log(
        'Dashboard: Se eliminó el filtro de género porque la pestaña activa no es "professionals".',
      );
    }

    setDashboardFilters(finalFilters);
    console.log("Dashboard: dashboardFilters actualizado a:", finalFilters);
  }, [appliedFilters, activeTab]);

  useEffect(() => {
    if (activeTab !== "professionals") {
      try { sessionStorage.removeItem('professionals.filters'); } catch {}
      setAppliedFilters(prev => {
        const { area_profesional, provincia, genero, tipo_sector, pais_formacion, institucion, categoria_titulacion, categoria_centro, edad_minima, edad_maxima, año_graduacion, funcion_publica, ...rest } = prev as any;
        return rest as typeof prev;
      });
    }
  }, [activeTab]);

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
      console.log("Dashboard: Cerrando sesión...");

      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error al cerrar sesión:", error);
        toast({
          title: "Error al cerrar sesión",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Auth state is handled automatically by Supabase client

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente.",
      });

      // Navegar al login
      navigate("/");

    } catch (error) {
      console.error("Error inesperado al cerrar sesión:", error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al cerrar sesi��n.",
        variant: "destructive",
      });
    }
  };

  const handleUserSettings = () => {
    console.log("Dashboard: Configuración de usuario.");
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
            onValueChange={setActiveTab}
            className="space-y-0"
          >
            <TabsList className="w-full overflow-x-auto whitespace-nowrap flex gap-2 p-2 bg-muted rounded-md">
              {tabsConfig.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
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
            <GlobalSearch onNavigate={(tab, filters) => {
              setActiveTab(tab);
              if (filters) setAppliedFilters(filters as any);
            }} />
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filtros de B��squeda</CardTitle>
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

        {showStatsCards && (
          <div className="mb-6">
            <StatsCards
              onNavigateToProfessionals={handleNavigateToProfessionals}
            />
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
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
                <DashboardCharts onChartClick={handleChartClick} />
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

          <TabsContent value="professionals" className="space-y-6">
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

          <TabsContent value="requests" className="space-y-6">
            <RequestsPanel
              userRole={currentRole}
              initialStatusFilter={dashboardFilters.estado_solicitud}
              onSelectProfessional={handleSelectProfessional}
            />
          </TabsContent>

          <TabsContent value="renewals" className="space-y-6">
            <RenewalAlerts
              dashboardFilters={dashboardFilters}
              onSelectProfessional={handleSelectProfessional}
              onSendSmsNotification={sendSmsNotification}
            />
          </TabsContent>

          <TabsContent value="guardias" className="space-y-6">
            <GuardiasDashboard userRole={userRole} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AdvancedAnalyticsDashboard
              onNavigateToTab={handleNavigateFromAnalytics}
            />
          </TabsContent>

          <TabsContent value="iachat" className="space-y-6">
            <IAChatOrchestrator
              filters={dashboardFilters}
              onNavigateToTab={(tab, filters) => {
                setActiveTab(tab);
                if (filters) setAppliedFilters(filters);
              }}
            />
          </TabsContent>

          <TabsContent value="ministerial" className="space-y-6">
            {(hasPermission("view_ministerial_panel")) && (
              <MinisterialPanel />
            )}
          </TabsContent>

          <TabsContent value="incidents" className="space-y-6">
            <IncidentManagement />
          </TabsContent>

          <TabsContent value="health-centers" className="space-y-6">
            <HealthCenters dashboardFilters={dashboardFilters} />
          </TabsContent>

          <TabsContent value="establecimientos" className="space-y-6">
            <SolicitudesEstablecimientos userRole={userRole as string} />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {hasPermission("manage_users") && <AdminPanel />}
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
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
      </div>

      {/* ResizeObserver test indicator - only shown during development */}
      {import.meta.env.DEV && <ResizeObserverTestIndicator />}
    </div>
  );
};

export default Dashboard;
