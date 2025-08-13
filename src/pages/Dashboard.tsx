import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
import StatsCardsSimple from "@/components/dashboard/StatsCardsSimple";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import ProfessionalsTable from "@/components/dashboard/ProfessionalsTable";
import ProfessionalDetail from "@/components/dashboard/ProfessionalDetail";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import RequestsPanel from "@/components/dashboard/RequestsPanel";
import RenewalAlerts from "@/components/dashboard/RenewalAlerts";
import AIAdvancedAnalyticsChat from "@/components/dashboard/AIAdvancedAnalyticsChat";
import MinisterialPanel from "@/components/dashboard/MinisterialPanel";
import IncidentManagement from "@/components/dashboard/IncidentManagement";
import HealthCenters from "@/components/dashboard/HealthCenters";
import AdminPanel from "@/components/dashboard/AdminPanel";
import AdvancedAnalyticsDashboard from "@/components/dashboard/AdvancedAnalyticsDashboard";
import ProfessionalSearch from "@/components/dashboard/ProfessionalSearch";
import ErrorBoundary from "@/components/ui/error-boundary";
import ConnectionDebugPanel from "@/components/dashboard/ConnectionDebugPanel";
import { OfflineNotification } from "@/components/ui/offline-notification";
import { DatabaseDiagnostic } from "@/components/dashboard/DatabaseDiagnostic";
import { DiagnosticPanel } from "@/components/dashboard/DiagnosticPanel";

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
  anoGraduacion?: string;
  vencimiento_proximo?: boolean;
  carnet_vencido?: boolean;
  prioridad_renovacion?: "alta" | "media" | "baja" | "vencido" | "all";
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedProfessional, setSelectedProfessional] =
    useState<Profesional | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Filtros>({});
  const [showFilters, setShowFilters] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState<Filtros>({});
  const [showStatsCards, setShowStatsCards] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, userRole, logout: authLogout, canAccessTab } = useAuth();

  // Establecer tab inicial basado en permisos del rol
  const getDefaultTab = () => {
    if (!userRole) return "overview";

    switch (userRole) {
      case 'REVISOR_SOLICITUDES':
        return "requests";
      case 'PERSONALIDAD_MINISTERIAL':
        return "analytics";
      case 'HOSPITAL':
        return "overview";
      case 'DIRECTIVO_CENTRO_SANITARIO':
        return "health-centers";
      case 'OBSERVADOR':
        return "overview";
      default:
        return "overview";
    }
  };

  const [activeTab, setActiveTab] = useState("overview");

  const userName = user?.full_name || user?.email?.split('@')[0] || "Usuario";
  const userEmail = user?.email || "";

  // Establecer tab inicial cuando userRole esté disponible
  useEffect(() => {
    if (userRole && activeTab === "overview") {
      const defaultTab = getDefaultTab();
      if (defaultTab !== "overview") {
        setActiveTab(defaultTab);
      }
    }
  }, [userRole]);

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

      await authLogout();

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
        description: "Ocurrió un error al cerrar sesión.",
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
            to: telefono,
            body: messageBody,
            profesionalId: profesionalId,
            notificationType: tipoNotificacion,
          }),
          method: "POST",
        },
      );

      if (error) {
        console.error("Error al invocar Edge Function para SMS:", error);
        toast({
          title: "Error al Enviar SMS",
          description: `No se pudo enviar el SMS a ${nombreCompleto}. Detalles: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log("Respuesta de Edge Function para SMS:", data);
        if (data && data.success) {
          toast({
            title: "SMS Enviado Exitosamente",
            description: `Se ha enviado un SMS a ${nombreCompleto}.`,
          });
        } else {
          toast({
            title: "Error al Enviar SMS",
            description: `Hubo un problema al enviar el SMS a ${nombreCompleto}: ${data?.message || "Error desconocido"}`,
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

  // Filtrar tabs disponibles según los permisos del rol
  const allTabs = [
    { id: "overview", label: "General", icon: BarChart3, permission: "view_dashboard" },
    { id: "professionals", label: "Profesionales", icon: Users, permission: "view_professionals" },
    { id: "requests", label: "Solicitudes", icon: FileText, permission: "view_requests" },
    { id: "renewals", label: "Renovaciones", icon: Calendar, permission: "view_renewals" },
    { id: "analytics", label: "Analíticas", icon: TrendingUp, permission: "view_analytics" },
    { id: "ai-chat", label: "IA Chat", icon: MessageSquare, permission: "view_ai_chat" },
    { id: "ministerial", label: "Ministerial", icon: Settings, permission: "view_ministerial_panel" },
    { id: "incidents", label: "Incidencias", icon: Activity, permission: "view_incidents" },
    { id: "health-centers", label: "Centros", icon: MapPin, permission: "view_centers" },
    { id: "admin", label: "Administración", icon: UserCog, permission: "view_admin_panel" },
  ];

  // SIMPLIFICACIÓN: Forzar todas las pestañas para SUPER_ADMINISTRADOR
  let availableTabs = allTabs; // Por defecto, mostrar todas

  // Solo restringir si NO es SUPER_ADMINISTRADOR
  if (userRole !== 'SUPER_ADMINISTRADOR') {
    const filteredTabs = allTabs.filter(tab => {
      // Si no hay userRole, mostrar tabs básicas
      if (!userRole) {
        return ['overview', 'professionals', 'analytics'].includes(tab.id);
      }

      // Lógica para otros roles
      switch (userRole) {
        case 'REVISOR_SOLICITUDES':
          return !['ministerial', 'admin'].includes(tab.id);
        case 'PERSONALIDAD_MINISTERIAL':
          return ['overview', 'analytics', 'ministerial', 'professionals', 'health-centers', 'ai-chat'].includes(tab.id);
        case 'HOSPITAL':
          return ['overview', 'professionals', 'requests', 'health-centers', 'incidents', 'renewals', 'ai-chat'].includes(tab.id);
        case 'DIRECTIVO_CENTRO_SANITARIO':
          return ['overview', 'professionals', 'health-centers', 'incidents', 'ai-chat'].includes(tab.id);
        case 'OBSERVADOR':
          return ['overview', 'professionals', 'analytics', 'health-centers', 'ai-chat'].includes(tab.id);
        default:
          return ['overview', 'professionals'].includes(tab.id);
      }
    });

    availableTabs = filteredTabs.length > 0 ? filteredTabs : allTabs.filter(tab => ['overview', 'professionals'].includes(tab.id));
  }

  console.log('🎭 ROLE DEBUG:', {
    userRole,
    email: user?.email,
    fullName: user?.full_name,
    isSuperAdmin: userRole === 'SUPER_ADMINISTRADOR',
    allTabsCount: allTabs.length,
    availableTabsCount: availableTabs.length,
    availableTabIds: availableTabs.map(t => t.id),
    forcedAllTabs: userRole === 'SUPER_ADMINISTRADOR'
  });

  const tabsConfig = availableTabs;

  // Validar tab activo cuando cambie el rol (después de que availableTabs esté definido)
  useEffect(() => {
    const validTabs = availableTabs.map(tab => tab.id);
    if (!validTabs.includes(activeTab)) {
      setActiveTab(getDefaultTab());
    }
  }, [userRole, activeTab, availableTabs]);

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
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(tabsConfig.length, 10)}, 1fr)` }}>
              {tabsConfig.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={`
                      flex items-center gap-1.5 px-2 py-2
                      ${
                        activeTab === tab.id
                          ? ""
                          : "hover:bg-primary/10 hover:text-primary"
                      }
                    `}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="hidden sm:inline text-xs font-medium">
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
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground">{userEmail}</p>
                    <p className="text-xs text-blue-600">{userRole?.replace('_', ' ')}</p>
                  </div>
                </DropdownMenuLabel>
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

        {/* Panel de diagnóstico temporal */}
        <DiagnosticPanel />

        {showStatsCards && (
          <div className="mb-6">
            <StatsCardsSimple
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
            <DashboardCharts onChartClick={handleChartClick} />
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
                userRole={userRole || 'OBSERVADOR'}
                appliedFilters={dashboardFilters}
                onClearFilters={handleClearFilters}
              />
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <RequestsPanel
              userRole={userRole}
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

          <TabsContent value="analytics" className="space-y-6">
            <AdvancedAnalyticsDashboard
              onNavigateToTab={handleNavigateFromAnalytics}
            />
          </TabsContent>

          <TabsContent value="ai-chat" className="space-y-6">
            <AIAdvancedAnalyticsChat
              onNavigateToTab={(tab, filters) => {
                setActiveTab(tab);
                if (filters) {
                  setAppliedFilters(filters);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="ministerial" className="space-y-6">
            {(userRole === "SUPER_ADMINISTRADOR" || userRole === "PERSONALIDAD_MINISTERIAL") && (
              <MinisterialPanel />
            )}
          </TabsContent>

          <TabsContent value="incidents" className="space-y-6">
            <IncidentManagement />
          </TabsContent>

          <TabsContent value="health-centers" className="space-y-6">
            <HealthCenters />
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            {userRole === "SUPER_ADMINISTRADOR" && <AdminPanel />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
