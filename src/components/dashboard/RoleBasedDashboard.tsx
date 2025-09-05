import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, 
  Users, 
  Shield, 
  Eye, 
  Building2, 
  BarChart3, 
  AlertTriangle,
  TrendingUp,
  FileText,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_DASHBOARD_VIEWS, UserRole } from '@/types/roles';
import useRoleBasedData from '@/hooks/useRoleBasedData';
import RoleSelector from '@/components/ui/RoleSelector';

interface RoleBasedDashboardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

const RoleBasedDashboard: React.FC<RoleBasedDashboardProps> = ({ 
  activeTab, 
  onTabChange, 
  children 
}) => {
  const { userRole, user, hasPermission, canAccessTab } = useAuth();
  const { getAllowedMetrics, restrictions, isRestricted } = useRoleBasedData();

  if (!userRole) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Acceso Requerido</h3>
              <p className="text-gray-600">
                Por favor, inicia sesión para acceder al dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleView = ROLE_DASHBOARD_VIEWS[userRole];
  const baseTabs = [
    { id: 'overview', label: 'Vista General', icon: BarChart3 },
    { id: 'professionals', label: 'Profesionales', icon: Users },
    { id: 'requests', label: 'Solicitudes', icon: FileText },
    { id: 'analytics', label: 'Analíticas', icon: TrendingUp },
    { id: 'health-centers', label: 'Centros', icon: Building2 },
    { id: 'incidents', label: 'Incidencias', icon: AlertTriangle },
    { id: 'renewals', label: 'Renovaciones', icon: Shield },
    { id: 'iachat', label: 'IA Chat', icon: Users },
    { id: 'admin', label: 'Admin', icon: Settings },
    { id: 'ministerial', label: 'Ministerial', icon: Crown }
  ];

  // Agregar pestaña de traslados si es necesario
  if (userRole === 'ADMIN_CENTRO_SANITARIO' || userRole === 'RRHH_MINISTERIO' || userRole === 'SUPER_ADMINISTRADOR') {
    baseTabs.push({ 
      id: 'traslados', 
      label: 'Traslados', 
      icon: Users 
    });
  }

  const availableTabs = baseTabs.filter(tab => canAccessTab(tab.id));

  const getRoleWelcomeMessage = () => {
    switch (userRole) {
      case 'SUPER_ADMINISTRADOR':
        return {
          title: '👑 Panel de Super Administrador',
          message: 'Tienes acceso completo a todas las funcionalidades del sistema. Puedes gestionar usuarios, aprobar solicitudes, y configurar el sistema.',
          priority: ['Solicitudes pendientes', 'Salud del sistema', 'Actividad reciente']
        };

      case 'RRHH_MINISTERIO':
        return {
          title: '🏛️ Panel de Recursos Humanos',
          message: 'Administra usuarios, roles y centros de salud. Puedes crear usuarios y asignar permisos específicos.',
          priority: ['Gestión de usuarios', 'Asignación de roles', 'Solicitudes de traslado']
        };

      case 'MIEMBRO_GOBIERNO':
        return {
          title: '🏛️ Panel de Gobierno',
          message: 'Acceso ejecutivo a información estratégica con capacidad de aprobación y firma de autorizaciones.',
          priority: ['Autorizaciones pendientes', 'Métricas estratégicas', 'Reportes ejecutivos']
        };

      case 'HABILITACION':
        return {
          title: '💰 Panel de Habilitación',
          message: 'Valida nóminas de guardias y aprueba pagos del sistema. Control financiero completo.',
          priority: ['Nóminas pendientes', 'Aprobación de pagos', 'Control financiero']
        };

      case 'ADMIN_CENTRO_SANITARIO':
        return {
          title: '🏥 Panel de Admin Centro',
          message: 'Administra tu centro de salud, gestiona usuarios del centro y solicita traslados de profesionales.',
          priority: ['Usuarios del centro', 'Solicitar traslados', 'Gestión local']
        };

      case 'REVISOR_SOLICITUDES':
        return {
          title: '✅ Panel de Revisor / Comité Evaluador',
          message: 'Tu rol principal es revisar y aprobar solicitudes de profesionales. Tienes acceso a herramientas de análisis para tomar decisiones informadas.',
          priority: ['Solicitudes urgentes', 'Profesionales pendientes', 'Renovaciones próximas']
        };

      case 'PERSONALIDAD_MINISTERIAL':
        return {
          title: '🏛️ Panel Ministerial Ejecutivo',
          message: 'Accede a información estratégica y reportes ejecutivos. Los datos personales están protegidos por privacidad.',
          priority: ['Métricas estratégicas', 'Tendencias nacionales', 'Cobertura sanitaria']
        };

      case 'OBSERVADOR':
        return {
          title: '👁️ Panel de Observador',
          message: 'Tienes acceso de solo lectura para consultar información y estadísticas públicas del sistema.',
          priority: ['Estadísticas públicas', 'Información general', 'Consultas básicas']
        };

      case 'DIRECTIVO_CENTRO_SANITARIO':
        return {
          title: '🏥 Panel de Directivo de Centro',
          message: 'Gestiona tu centro de salud y los profesionales asignados. Puedes reportar incidencias y ver estadísticas específicas.',
          priority: ['Profesionales del centro', 'Incidencias', 'Estadísticas locales']
        };

      default:
        return {
          title: '📊 Dashboard del Sistema',
          message: 'Bienvenido al sistema de gestión de profesionales sanitarios.',
          priority: ['Información general']
        };
    }
  };

  const welcomeInfo = getRoleWelcomeMessage();

  return (
    <div className="space-y-6">
      {/* Header con información del rol */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {welcomeInfo.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  {welcomeInfo.message}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {availableTabs.length} pestañas disponibles
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    {getAllowedMetrics().length} métricas
                  </Badge>
                  {isRestricted && (
                    <Badge variant="outline" className="flex items-center gap-1 text-orange-600">
                      <AlertTriangle className="w-3 h-3" />
                      Con restricciones
                    </Badge>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Prioridades de tu rol:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {welcomeInfo.priority.map((item, index) => (
                      <div key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selector de rol para demo */}
        <div className="lg:col-span-1">
          <RoleSelector />
        </div>
      </div>

      {/* Pestañas filtradas por rol */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <div className="border-b px-6 pt-6">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1 h-auto p-1">
                {availableTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger 
                      key={tab.id} 
                      value={tab.id}
                      className="flex items-center gap-2 text-xs px-3 py-2"
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden md:inline">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Contenido de las pestañas */}
            <div className="p-6">
              {children}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Información adicional específica del rol */}
      {isRestricted && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800 mb-1">
                  Restricciones Aplicadas
                </h4>
                <div className="text-sm text-orange-700 space-y-1">
                  {restrictions.dataFilters?.hidePersonalDetails && (
                    <div>• Datos personales ocultos por privacidad</div>
                  )}
                  {restrictions.dataFilters?.centerRestricted && (
                    <div>• Vista limitada a centros asignados</div>
                  )}
                  {restrictions.dataFilters?.readOnly && (
                    <div>• Acceso de solo lectura</div>
                  )}
                  {restrictions.exportLimits && (
                    <div>• Límite de exportación: {restrictions.exportLimits} registros</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoleBasedDashboard;
