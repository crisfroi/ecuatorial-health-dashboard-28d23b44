import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Monitor,
  Database,
  Settings,
  LogOut,
  Moon,
  Sun,
  User,
  Shield,
  Bell,
  Download,
  RefreshCw,
  Power,
  Activity,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Import diagnostic components
import ConnectionStatus from "@/components/dashboard/ConnectionStatus";
import DatabaseDiagnostics from "@/components/dashboard/DatabaseDiagnostics";
import ErrorAnalysis from "@/components/dashboard/ErrorAnalysis";
import SimpleConnectionTest from "@/components/dashboard/SimpleConnectionTest";
import SupabaseConnectionTest from "@/components/dashboard/SupabaseConnectionTest";
import UserRoleManagement from "@/components/dashboard/UserRoleManagement";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [systemStatus, setSystemStatus] = useState("operational");
  const [systemStats, setSystemStats] = useState({
    uptime: "99.8%",
    activeUsers: 42,
    totalRequests: 1247,
    errorRate: "0.2%",
  });

  useEffect(() => {
    // Check if dark mode is enabled in localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    toast({
      title: `Tema ${!darkMode ? "oscuro" : "claro"} activado`,
      description: "La configuración se ha guardado automáticamente.",
    });
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error al cerrar sesión",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sesión cerrada",
          description: "Has cerrado sesión exitosamente.",
        });
        navigate("/");
      }
    } catch (err) {
      console.error("Error during logout:", err);
      navigate("/");
    }
  };

  const handleSystemRestart = () => {
    toast({
      title: "Reinicio del sistema solicitado",
      description: "El sistema se reiniciará en 30 segundos...",
      variant: "destructive",
    });
  };

  const handleDatabaseMaintenance = () => {
    toast({
      title: "Mantenimiento de base de datos",
      description: "Iniciando tareas de mantenimiento programado...",
    });
  };

  const handleExportLogs = () => {
    toast({
      title: "Exportando logs",
      description: "Se descargará un archivo con los logs del sistema...",
    });
  };

  const handleClearCache = () => {
    // Clear React Query cache
    window.location.reload();
    toast({
      title: "Caché limpiado",
      description: "La caché del sistema ha sido limpiada exitosamente.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-600" />
            Panel de Administración
          </h2>
          <p className="text-gray-600 mt-1">
            Configuración avanzada y herramientas de diagnóstico
          </p>
        </div>
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Solo Administradores
        </Badge>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
            <Button
              onClick={handleClearCache}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Limpiar Caché
            </Button>
            <Button
              onClick={handleExportLogs}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar Logs
            </Button>
            <Button
              onClick={handleSystemRestart}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Power className="w-4 h-4" />
              Reiniciar Sistema
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Estado del Sistema</h3>
                <Badge className={getStatusColor(systemStatus)}>
                  {systemStatus === "operational"
                    ? "Operacional"
                    : systemStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Tiempo Activo</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {systemStats.uptime}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Usuarios Activos</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {systemStats.activeUsers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Monitor className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Tasa de Error</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {systemStats.errorRate}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="settings" className="flex items-center gap-1">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configuración</span>
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="flex items-center gap-1">
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">Diagnósticos</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-1">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Base de Datos</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Mantenimiento</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Configuración del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium flex items-center gap-2">
                      {darkMode ? (
                        <Moon className="w-4 h-4" />
                      ) : (
                        <Sun className="w-4 h-4" />
                      )}
                      Tema Oscuro
                    </Label>
                    <p className="text-sm text-gray-500">
                      Cambia entre tema claro y oscuro
                    </p>
                  </div>
                  <Switch
                    checked={darkMode}
                    onCheckedChange={handleThemeToggle}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Notificaciones
                    </Label>
                    <p className="text-sm text-gray-500">
                      Recibir notificaciones del sistema
                    </p>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Actualización Automática
                    </Label>
                    <p className="text-sm text-gray-500">
                      Actualizar datos automáticamente cada 30 segundos
                    </p>
                  </div>
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics">
          <div className="space-y-6">
            <SupabaseConnectionTest />
            <SimpleConnectionTest />
            <ConnectionStatus />
            <ErrorAnalysis />
          </div>
        </TabsContent>

        <TabsContent value="database">
          <div className="space-y-6">
            <DatabaseDiagnostics />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-600" />
                  Mantenimiento de Base de Datos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={handleDatabaseMaintenance}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Optimizar Índices
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Backup Manual
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Analizar Rendimiento
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Ver Métricas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UserRoleManagement />
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Herramientas de Mantenimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">
                    ⚠️ Zona de Peligro
                  </h3>
                  <p className="text-orange-700 text-sm mb-4">
                    Las siguientes acciones pueden afectar el funcionamiento del
                    sistema. Usar con precaución.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      onClick={handleSystemRestart}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Power className="w-4 h-4" />
                      Reiniciar Sistema
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Database className="w-4 h-4" />
                      Reset Base de Datos
                    </Button>
                    <Button
                      onClick={handleClearCache}
                      variant="outline"
                      className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Limpiar Todo Cache
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      <Download className="w-4 h-4" />
                      Backup Completo
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
