
import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import StatsCards from '@/components/dashboard/StatsCards';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import ProfessionalsTable from '@/components/dashboard/ProfessionalsTable';
import HealthCenters from '@/components/dashboard/HealthCenters';
import RequestsPanel from '@/components/dashboard/RequestsPanel';
import AdvancedStats from '@/components/dashboard/AdvancedStats';
import AIChat from '@/components/dashboard/AIChat';
import HospitalIncidents from '@/components/dashboard/HospitalIncidents';
import UserRoleManagement from '@/components/dashboard/UserRoleManagement';
import MinisterialPanel from '@/components/dashboard/MinisterialPanel';
import ProfessionalDetail from '@/components/dashboard/ProfessionalDetail';
import TestDataButton from '@/components/TestDataButton';
import { useEstadisticasAvanzadas } from '@/hooks/useEstadisticasAvanzadas';

const Dashboard = () => {
  const [userRole, setUserRole] = useState('administrador');
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [dashboardFilters, setDashboardFilters] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats } = useEstadisticasAvanzadas();

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
    
    if (chartType === 'area_profesional') {
      filters = { area_profesional: data.area };
    } else if (chartType === 'provincia') {
      filters = { provincia: data.provincia };
    } else if (chartType === 'estado_solicitud') {
      filters = { estado_solicitud: data.estado };
    }
    
    handleNavigateToProfessionals(filters);
  };

  if (selectedProfessional) {
    return (
      <ProfessionalDetail 
        professional={selectedProfessional}
        onClose={() => setSelectedProfessional(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex flex-col min-h-screen">
        <header className="bg-white border-b shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <DashboardHeader userRole={userRole} />
              <TestDataButton />
            </div>
          </div>
          <DashboardTabs 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            userRole={userRole}
          />
        </header>
        
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="overview" className="space-y-6">
              <div className="space-y-8">
                <StatsCards onNavigateToProfessionals={handleNavigateToProfessionals} />
                <DashboardCharts onChartClick={handleChartClick} />
              </div>
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

            <TabsContent value="health-centers">
              <HealthCenters userRole={userRole} />
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
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
