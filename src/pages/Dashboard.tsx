
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Clock, FileText, TrendingUp, Activity, MessageCircle, AlertTriangle, Settings } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import StatsCards from '@/components/dashboard/StatsCards';
import ProfessionalsTable from '@/components/dashboard/ProfessionalsTable';
import RequestsPanel from '@/components/dashboard/RequestsPanel';
import ProfessionalDetail from '@/components/dashboard/ProfessionalDetail';
import AdvancedStats from '@/components/dashboard/AdvancedStats';
import MinisterialPanel from '@/components/dashboard/MinisterialPanel';
import AIChat from '@/components/dashboard/AIChat';
import HospitalIncidents from '@/components/dashboard/HospitalIncidents';
import UserRoleManagement from '@/components/dashboard/UserRoleManagement';
import RenewalAlerts from '@/components/dashboard/RenewalAlerts';
import { useEstadisticasProfesionales } from '@/hooks/useProfesionales';

const Dashboard = () => {
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userRole, setUserRole] = useState('administrador'); // administrador, comite, visualizador
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [dashboardFilters, setDashboardFilters] = useState({});

  const { data: stats } = useEstadisticasProfesionales();

  // Función para manejar navegación desde estadísticas a profesionales
  const handleNavigateToProfessionals = (filters: any) => {
    console.log('Dashboard: Navigating with filters:', filters);
    setAppliedFilters(filters);
    setActiveTab('professionals');
  };

  // Función para limpiar filtros aplicados
  const handleClearFilters = () => {
    setAppliedFilters(null);
    setDashboardFilters({});
  };

  // Función para manejar filtros del dashboard principal
  const handleDashboardFiltersChange = (filters: any) => {
    console.log('Dashboard: Filters changed:', filters);
    setDashboardFilters(filters);
    if (activeTab === 'professionals') {
      // Si estamos en la vista de profesionales, aplicar filtros inmediatamente
    }
  };

  // Preparar datos para gráficas
  const professionData = stats?.porArea ? Object.entries(stats.porArea).map(([profesion, cantidad]) => ({
    profesion,
    cantidad: cantidad as number
  })) : [];

  const provinciaData = stats?.porProvincia ? Object.entries(stats.porProvincia).map(([provincia, cantidad]) => ({
    provincia,
    cantidad: cantidad as number
  })) : [];

  // Función para manejar clicks en gráficas
  const handleChartClick = (data: any, chartType: string) => {
    console.log('Chart clicked:', chartType, data);
    if (chartType === 'profession') {
      handleNavigateToProfessionals({
        area_profesional: data.profesion
      });
    } else if (chartType === 'provincia') {
      handleNavigateToProfessionals({
        provincia: data.provincia
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="/lovable-uploads/f55481fd-c077-4825-921a-3c48a3b6b852.png" 
              alt="Guinea Ecuatorial Salud" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sistema de Gestión de Profesionales Sanitarios
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Ministerio de Sanidad y Bienestar Social - Guinea Ecuatorial
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
            <div className="w-8 h-8 bg-guinea-teal rounded-full flex items-center justify-center text-white text-sm font-medium">
              U
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 lg:w-auto lg:grid-cols-9">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Panel Principal</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Solicitudes</span>
            </TabsTrigger>
            <TabsTrigger value="professionals" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Profesionales</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Estadísticas</span>
            </TabsTrigger>
            <TabsTrigger value="ai-chat" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Análisis IA</span>
            </TabsTrigger>
            <TabsTrigger value="incidents" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Incidencias</span>
            </TabsTrigger>
            {userRole === 'administrador' && (
              <TabsTrigger value="user-management" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Usuarios</span>
              </TabsTrigger>
            )}
            {(userRole === 'administrador' || userRole === 'comite') && (
              <TabsTrigger value="ministerial" className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4" />
                <span>Panel Ministerial</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardFilters 
              onFiltersChange={handleDashboardFiltersChange}
              activeFilters={dashboardFilters}
            />
            <StatsCards onNavigateToProfessionals={handleNavigateToProfessionals} />
            
            {/* Alertas de Renovación */}
            <RenewalAlerts onNavigateToProfessionals={handleNavigateToProfessionals} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-guinea-teal" />
                    <span>Profesionales por Área</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={professionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="profesion" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey="cantidad" 
                        fill="hsl(var(--guinea-teal))" 
                        onClick={(data) => handleChartClick(data, 'profession')}
                        className="cursor-pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-guinea-teal" />
                    <span>Distribución por Provincia</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={provinciaData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ provincia, cantidad }) => `${provincia}: ${cantidad}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="cantidad"
                        onClick={(data) => handleChartClick(data, 'provincia')}
                        className="cursor-pointer"
                      >
                        {provinciaData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <RequestsPanel userRole={userRole} />
          </TabsContent>

          <TabsContent value="professionals">
            <ProfessionalsTable 
              onSelectProfessional={setSelectedProfessional}
              userRole={userRole}
              appliedFilters={appliedFilters}
              onClearFilters={handleClearFilters}
              dashboardFilters={dashboardFilters}
            />
          </TabsContent>

          <TabsContent value="stats">
            <AdvancedStats onNavigateToProfessionals={handleNavigateToProfessionals} />
          </TabsContent>

          <TabsContent value="ai-chat">
            <AIChat />
          </TabsContent>

          <TabsContent value="incidents">
            <HospitalIncidents />
          </TabsContent>

          {userRole === 'administrador' && (
            <TabsContent value="user-management">
              <UserRoleManagement />
            </TabsContent>
          )}

          {(userRole === 'administrador' || userRole === 'comite') && (
            <TabsContent value="ministerial">
              <MinisterialPanel />
            </TabsContent>
          )}
        </Tabs>

        {selectedProfessional && (
          <ProfessionalDetail 
            professional={selectedProfessional}
            onClose={() => setSelectedProfessional(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
