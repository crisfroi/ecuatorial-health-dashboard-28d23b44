
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
  X
} from 'lucide-react';

// Import components
import StatsCards from '@/components/dashboard/StatsCards';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import ProfessionalsTable from '@/components/dashboard/ProfessionalsTable';
import ProfessionalDetail from '@/components/dashboard/ProfessionalDetail';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import RequestsPanel from '@/components/dashboard/RequestsPanel';
import RenewalAlerts from '@/components/dashboard/RenewalAlerts';
import OpenAIChat from '@/components/dashboard/OpenAIChat';

// Types
interface Profesional {
  id: string;
  nombre_completo: string;
  area_profesional: string;
  estado_solicitud: string;
  numero_carnet_profesional?: string;
}

const Dashboard = () => {
  const [selectedProfessional, setSelectedProfessional] = useState<Profesional | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<any>({});
  const [showFilters, setShowFilters] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState<any>({});

  // Simular rol de usuario (en una app real vendría de auth)
  const userRole = 'administrador'; // o 'comite', 'revisor'

  const handleSelectProfessional = (professional: Profesional) => {
    setSelectedProfessional(professional);
  };

  const handleApplyFilters = (filters: any) => {
    console.log('Dashboard: Applying filters:', filters);
    setAppliedFilters(filters);
    setDashboardFilters(filters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    console.log('Dashboard: Clearing filters');
    setAppliedFilters({});
    setDashboardFilters({});
  };

  const handleStatsCardClick = (filter: any) => {
    console.log('Dashboard: Stats card clicked with filter:', filter);
    setDashboardFilters(filter);
    setAppliedFilters(filter);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <DashboardFilters onApplyFilters={handleApplyFilters} />
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <StatsCards onCardClick={handleStatsCardClick} />

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="professionals" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Profesionales</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Solicitudes</span>
            </TabsTrigger>
            <TabsTrigger value="renewals" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Renovaciones</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analíticas</span>
            </TabsTrigger>
            <TabsTrigger value="ai-chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">IA Chat</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardCharts />
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
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
