import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Shield, 
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  Building2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useGuardiasStore } from '@/stores/useGuardiasStore';
import { toast } from 'sonner';

// Importar componentes de las pestañas
import { RegistroGuardias } from './tabs/RegistroGuardias';
import { CuadrantesGuardias } from './tabs/CuadrantesGuardias';
import { ValidacionGuardias } from './tabs/ValidacionGuardias';
import { NominaGuardias } from './tabs/NominaGuardias';
import { PagosGuardias } from './tabs/PagosGuardias';
import { ReportesGuardias } from './tabs/ReportesGuardias';
import { AuditoriaGuardias } from './tabs/AuditoriaGuardias';
import { AjustesGuardias } from './tabs/AjustesGuardias';

interface GuardiasDashboardProps {
  className?: string;
}

export const GuardiasDashboard: React.FC<GuardiasDashboardProps> = ({ className = '' }) => {
  const { user, userRole, hasPermission } = useAuth();
  const {
    filtros,
    setFiltros,
    fetchProfesionales,
    fetchGuardias,
    fetchNominas,
    fetchBaremos,
    isLoading,
    error,
    configuracion
  } = useGuardiasStore();

  const [activeTab, setActiveTab] = useState('registro');
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedAnio, setSelectedAnio] = useState(new Date().getFullYear());
  const [selectedCentro, setSelectedCentro] = useState<string>(user?.assigned_center_id || 'all');

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Aplicar filtros basados en el rol del usuario
        const filtrosIniciales = {
          mes: selectedMes,
          anio: selectedAnio,
          ...(userRole === 'DIRECTIVO_CENTRO_SANITARIO' && user?.assigned_center_id 
            ? { centro_salud_id: user.assigned_center_id }
            : selectedCentro !== 'all' ? { centro_salud_id: selectedCentro } : {})
        };

        setFiltros(filtrosIniciales);

        await Promise.all([
          fetchProfesionales(filtrosIniciales.centro_salud_id),
          fetchGuardias(filtrosIniciales),
          fetchNominas(filtrosIniciales.centro_salud_id),
          fetchBaremos()
        ]);
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        toast.error('Error al cargar los datos del sistema de guardias');
      }
    };

    loadInitialData();
  }, [selectedMes, selectedAnio, selectedCentro, user?.assigned_center_id, userRole]);

  // Configuración de pestañas según permisos
  const availableTabs = [
    {
      id: 'registro',
      label: 'Registro',
      icon: Plus,
      component: RegistroGuardias,
      permission: 'create_guardias',
      description: 'Registrar nuevas guardias médicas'
    },
    {
      id: 'cuadrantes',
      label: 'Cuadrantes',
      icon: Calendar,
      component: CuadrantesGuardias,
      permission: 'view_cuadrantes',
      description: 'Vista de calendario y planificación'
    },
    {
      id: 'validacion',
      label: 'Validación',
      icon: Shield,
      component: ValidacionGuardias,
      permission: 'validate_guardias',
      description: 'Aprobar y validar guardias'
    },
    {
      id: 'nomina',
      label: 'Nómina',
      icon: FileText,
      component: NominaGuardias,
      permission: 'generate_nominas',
      description: 'Generar y gestionar nóminas'
    },
    {
      id: 'pagos',
      label: 'Pagos',
      icon: CreditCard,
      component: PagosGuardias,
      permission: 'manage_payments',
      description: 'Gestionar pagos de guardias'
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: BarChart3,
      component: ReportesGuardias,
      permission: 'view_reports',
      description: 'Estadísticas y reportes'
    },
    {
      id: 'auditoria',
      label: 'Auditoría',
      icon: Search,
      component: AuditoriaGuardias,
      permission: 'view_audit',
      description: 'Logs y auditoría del sistema'
    },
    {
      id: 'ajustes',
      label: 'Ajustes',
      icon: Settings,
      component: AjustesGuardias,
      permission: 'manage_settings',
      description: 'Configuración del sistema'
    }
  ].filter(tab => {
    // Para super administrador, mostrar todas las pestañas
    if (userRole === 'SUPER_ADMINISTRADOR') return true;
    
    // Para directivos de centro, permitir registro, cuadrantes, y reportes
    if (userRole === 'DIRECTIVO_CENTRO_SANITARIO') {
      return ['registro', 'cuadrantes', 'reportes'].includes(tab.id);
    }
    
    // Para otros roles, verificar permisos específicos
    return hasPermission(tab.permission);
  });

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleFiltersChange = () => {
    const nuevos_filtros = {
      mes: selectedMes,
      anio: selectedAnio,
      ...(selectedCentro !== 'all' ? { centro_salud_id: selectedCentro } : {})
    };
    
    setFiltros(nuevos_filtros);
    fetchGuardias(nuevos_filtros);
    fetchNominas(nuevos_filtros.centro_salud_id);
  };

  // Generar años disponibles
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Meses del año
  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="text-center">
            <div className="text-red-600 mb-2">Error en el Sistema de Guardias</div>
            <div className="text-sm text-red-500">{error}</div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              Recargar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-8 h-8 text-blue-600" />
            Gestión de Guardias Médicas
          </h1>
          <p className="text-gray-600 mt-1">
            Sistema integral de gestión de guardias hospitalarias
          </p>
        </div>

        {/* Filtros de fecha y centro */}
        <div className="flex items-center gap-3">
          <Select value={selectedMes.toString()} onValueChange={(value) => setSelectedMes(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedAnio.toString()} onValueChange={(value) => setSelectedAnio(parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Selector de centro (solo para super admin y roles ministeriales) */}
          {userRole !== 'DIRECTIVO_CENTRO_SANITARIO' && (
            <Select value={selectedCentro} onValueChange={setSelectedCentro}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Centro de Salud" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los centros</SelectItem>
                {/* TODO: Cargar centros dinámicamente */}
                <SelectItem value="centro-1">Hospital Regional Malabo</SelectItem>
                <SelectItem value="centro-2">Centro de Salud Bata</SelectItem>
                <SelectItem value="centro-3">Hospital La Paz</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button onClick={handleFiltersChange} size="sm" variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Aplicar
          </Button>
        </div>
      </div>

      {/* Indicadores de restricción por rol */}
      {userRole === 'DIRECTIVO_CENTRO_SANITARIO' && user?.assigned_center_id && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-blue-800 text-sm">
              <Building2 className="w-4 h-4" />
              <span>Vista restringida: Solo se muestran guardias de su centro asignado</span>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                Centro ID: {user.assigned_center_id}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información de configuración */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 text-sm">
              <Settings className="w-4 h-4" />
              <span>Fuente de baremos: <strong>{configuracion.fuenteBaremo === 'protocol' ? 'Protocolo Institucional' : 'Hoja Excel'}</strong></span>
            </div>
            <div className="flex items-center gap-4 text-xs text-amber-700">
              <span>Freq. mensual: {configuracion.frecuenciaMinima}-{configuracion.frecuenciaMaxima} días</span>
              <span>Duración: {configuracion.horasMinimas}-{configuracion.horasMaximas}h</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pestañas principales */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-1.5 px-3 py-2"
                title={tab.description}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline text-xs font-medium">
                  {tab.label}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Contenido de las pestañas */}
        {availableTabs.map((tab) => {
          const Component = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              <Component />
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Estado de carga */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Cargando datos de guardias...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GuardiasDashboard;
