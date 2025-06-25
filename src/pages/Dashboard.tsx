
import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import StatsCards from '@/components/dashboard/StatsCards';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import ProfessionalsTable from '@/components/dashboard/ProfessionalsTable';
import RequestsPanel from '@/components/dashboard/RequestsPanel';
import AdvancedStats from '@/components/dashboard/AdvancedStats';
import AIChat from '@/components/dashboard/AIChat';
import HospitalIncidents from '@/components/dashboard/HospitalIncidents';
import UserRoleManagement from '@/components/dashboard/UserRoleManagement';
import MinisterialPanel from '@/components/dashboard/MinisterialPanel';
import ProfessionalDetail from '@/components/dashboard/ProfessionalDetail';
import TestDataButton from '@/components/TestDataButton';
import { useEstadisticasProfesionales } from '@/hooks/useEstadisticas';

const Dashboard = () => {
  const [userRole, setUserRole] = useState('administrador');
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [dashboardFilters, setDashboardFilters] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats } = useEstadisticasProfesionales();

  const handleSelectProfessional = (professional: any) => {
    setSelectedProfessional(professional);
  };

  const handleNavigateToProfessionals = (filters: any) => {
    console.log('Dashboard: Navigating to professionals with filters:', filters);
    setDashboardFilters(filters);
    setActiveTab('professionals');
  };

  const handleChartClick = (data: any, chartType: string) => {
    console.log('Dashboard: Chart clicked:', data, chartType);
    let filters = {};
    
    if (chartType === 'profession') {
      filters = { area_profesional: data.profesion };
    } else if (chartType === 'provincia') {
      filters = { provincia: data.provincia };
    }
    
    handleNavigateToProfessionals(filters);
  };

  // Preparar datos para los gráficos
  const professionData = stats?.porArea ? 
    Object.entries(stats.porArea).map(([profesion, cantidad]) => ({
      profesion,
      cantidad: cantidad as number
    })) : [];

  const provinciaData = stats?.porProvincia ? 
    Object.entries(stats.porProvincia).map(([provincia, cantidad]) => ({
      provincia,
      cantidad: cantidad as number
    })) : [];

  if (selectedProfessional) {
    return (
      <ProfessionalDetail 
        professional={selectedProfessional}
        onClose={() => setSelectedProfessional(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userRole={userRole} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Panel de Control</h2>
          <TestDataButton />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <DashboardTabs userRole={userRole} />
          
          <TabsContent value="overview" className="space-y-6">
            <StatsCards onNavigateToProfessionals={handleNavigateToProfessionals} />
            <DashboardCharts 
              professionData={professionData}
              provinciaData={provinciaData}
              onChartClick={handleChartClick}
            />
          </TabsContent>

          <TabsContent value="requests">
            <RequestsPanel userRole={userRole} />
          </TabsContent>

          <TabsContent value="professionals">
            <ProfessionalsTable 
              onSelectProfessional={handleSelectProfessional}
              userRole={userRole}
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
      </div>
    </div>
  );
};

export default Dashboard;
