import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Shield, 
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useGuardiasStore } from '@/stores/useGuardiasStore';
import { useToast } from '@/hooks/use-toast';

// Import tab components
import { RegistroGuardias } from './tabs/RegistroGuardias';
import { CuadrantesGuardias } from './tabs/CuadrantesGuardias';
import { ValidacionGuardias } from './tabs/ValidacionGuardias';
import { NominaGuardias } from './tabs/NominaGuardias';
import { PagosGuardias } from './tabs/PagosGuardias';
import { ReportesGuardias } from './tabs/ReportesGuardias';
import { AuditoriaGuardias } from './tabs/AuditoriaGuardias';
import { AjustesGuardias } from './tabs/AjustesGuardias';
import { AsistenciaBiometrica } from './tabs/AsistenciaBiometrica';
import { TurnosBiometricos } from './tabs/TurnosBiometricos';
import { CuadrantesBiometricos } from './tabs/CuadrantesBiometricos';
import { NetworkStatusSimple } from '@/components/ui/network-status-simple';
import { GuardiasStatusIndicators } from './GuardiasStatusIndicators';
import { GuardiasNotificationSystem } from './GuardiasNotificationSystem';
import { GuardiasHelpSystem } from './GuardiasHelpSystem';
import { GuardiasOnboardingTour } from './GuardiasOnboardingTour';

interface GuardiasDashboardProps {
  userRole: string;
}

export const GuardiasDashboard: React.FC<GuardiasDashboardProps> = ({ userRole }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    centros,
    guardias,
    validaciones,
    nominas,
    pagos,
    loading,
    fetchCentros
  } = useGuardiasStore();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCenter, setSelectedCenter] = useState<string | null>(user?.assigned_center_id || null);
  const [activeTab, setActiveTab] = useState('registro');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    fetchCentros(true); // Solo centros públicos para guardias

    // Verificar si es la primera vez que el usuario accede al sistema de guardias
    const hasVisitedBefore = localStorage.getItem(`guardias-visited-${userRole}`);
    if (!hasVisitedBefore) {
      setShowOnboarding(true);
      localStorage.setItem(`guardias-visited-${userRole}`, 'true');
    }
  }, [userRole]);

  // Auto-select user's assigned center when available
  useEffect(() => {
    if (user?.assigned_center_id && !selectedCenter) {
      setSelectedCenter(user.assigned_center_id);
    }
  }, [user?.assigned_center_id, selectedCenter]);

  // Configuración de pestañas basada en roles
  const getVisibleTabs = () => {
    const allTabs = [
      { id: 'registro', label: 'Registro', icon: Calendar, permissions: ['SUPER_ADMINISTRADOR', 'DIRECTIVO_CENTRO_SANITARIO'] },
      { id: 'asistencia', label: 'Asistencia', icon: Clock, permissions: ['SUPER_ADMINISTRADOR', 'DIRECTIVO_CENTRO_SANITARIO'] },
      { id: 'cuadrantes', label: 'Cuadrantes', icon: FileText, permissions: ['SUPER_ADMINISTRADOR', 'DIRECTIVO_CENTRO_SANITARIO', 'REVISOR_SOLICITUDES'] },
      { id: 'validacion', label: 'Validación', icon: Shield, permissions: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'REVISOR_SOLICITUDES'] },
      { id: 'nomina', label: 'Nómina', icon: FileText, permissions: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO', 'REVISOR_SOLICITUDES'] },
      { id: 'pagos', label: 'Pagos', icon: CreditCard, permissions: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'REVISOR_SOLICITUDES'] },
      { id: 'reportes', label: 'Reportes', icon: BarChart3, permissions: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO', 'REVISOR_SOLICITUDES'] },
      { id: 'auditoria', label: 'Auditoría', icon: Shield, permissions: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'] },
      { id: 'ajustes', label: 'Ajustes', icon: Settings, permissions: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO'] }
    ];

    return allTabs.filter(tab => 
      tab.permissions.includes(userRole) || userRole === 'SUPER_ADMINISTRADOR'
    );
  };

  const visibleTabs = getVisibleTabs();

  // Si el usuario no tiene acceso a ninguna pestaña, mostrar mensaje
  if (visibleTabs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Acceso Restringido
          </h3>
          <p className="text-gray-600">
            No tiene permisos para acceder al sistema de gestión de guardias médicas.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Si la pestaña activa no está en las pestañas visibles, cambiar a la primera disponible
  useEffect(() => {
    if (!visibleTabs.find(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || 'registro');
    }
  }, [activeTab, visibleTabs]);

  const getMonthName = (month: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1];
  };

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const isCurrentPeriod = selectedMonth === currentMonth && selectedYear === currentYear;

  return (
    <div className="space-y-6">
      {/* Header con controles de período */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sistema de Gestión de Guardias Médicas</h2>
              <p className="text-gray-600">
                Administración integral de guardias, cuadrantes, nóminas y pagos
              </p>
              <NetworkStatusSimple className="mt-2" />
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Sistema de ayuda */}
              <GuardiasHelpSystem
                userRole={userRole}
                onNavigateToTab={setActiveTab}
              />

              {/* Sistema de notificaciones */}
              <GuardiasNotificationSystem
                userRole={userRole}
                onNavigateToTab={setActiveTab}
              />

              {/* Control de período */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousMonth}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="text-center min-w-[140px]">
                  <div className="font-semibold text-lg">
                    {getMonthName(selectedMonth)} {selectedYear}
                  </div>
                  {isCurrentPeriod && (
                    <Badge variant="outline" className="text-xs">
                      Período Actual
                    </Badge>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Selector de centro (si aplica según el rol) */}
              {userRole === 'SUPER_ADMINISTRADOR' && (
                <div className="min-w-[200px]">
                  <Select
                    value={selectedCenter || 'todos'}
                    onValueChange={(value) => setSelectedCenter(value === 'todos' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar centro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los centros</SelectItem>
                      {centros.map((centro) => (
                        <SelectItem key={centro.id} value={centro.id}>
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4" />
                            <span>{centro.nombre}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Indicadores de estado */}
      <GuardiasStatusIndicators
        stats={{
          totalGuardias: guardias.length,
          guardiasAprobadas: guardias.filter(g => g.observaciones?.includes('aprobad')).length,
          guardiasPendientes: guardias.filter(g => !g.observaciones?.includes('aprobad')).length,
          profesionalesActivos: new Set(guardias.map(g => g.profesional_id)).size,
          nominasPendientes: nominas.filter(n => n.estado === 'GENERADA').length,
          pagosPendientes: pagos.filter(p => p.estado === 'PENDIENTE').length,
          validacionesPendientes: validaciones.filter(v => v.estado === 'PENDIENTE').length,
          totalNominas: nominas.reduce((sum, n) => sum + n.total, 0)
        }}
        userRole={userRole}
      />

      {/* Pestañas principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-1">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-1.5 px-2 py-2 text-xs"
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline font-medium">
                  {tab.label}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Contenido de las pestañas */}
        <div className="mt-6">
          <TabsContent value="registro">
            <RegistroGuardias
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              selectedCenter={selectedCenter}
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="asistencia">
            <AsistenciaBiometrica selectedCenter={selectedCenter} />
          </TabsContent>

          <TabsContent value="cuadrantes">
            <CuadrantesGuardias
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              selectedCenter={selectedCenter}
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="validacion">
            <ValidacionGuardias
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              selectedCenter={selectedCenter}
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="nomina">
            <NominaGuardias
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              selectedCenter={selectedCenter}
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="pagos">
            <PagosGuardias
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              selectedCenter={selectedCenter}
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="reportes">
            <ReportesGuardias
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              selectedCenter={selectedCenter}
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="auditoria">
            <AuditoriaGuardias
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              selectedCenter={selectedCenter}
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="ajustes">
            <AjustesGuardias
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              selectedCenter={selectedCenter}
              userRole={userRole}
            />
          </TabsContent>
        </div>
      </Tabs>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-700">Procesando...</p>
            </div>
          </Card>
        </div>
      )}

      {/* Tour de bienvenida */}
      <GuardiasOnboardingTour
        userRole={userRole}
        isFirstTime={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
        onNavigateToTab={setActiveTab}
      />
    </div>
  );
};
