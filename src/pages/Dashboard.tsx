
import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
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
  const { userRole } = useAuth();
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
    <div className="min-h-screen bg-gradient-to-br from-guinea-light-teal/10 via-white to-guinea-teal/5">
      <div className="flex flex-col min-h-screen">
        <header className="bg-white border-b shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <DashboardHeader userRole={userRole || 'usuario'} />
              <TestDataButton />
            </div>
          </div>
          <DashboardTabs 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            userRole={userRole || 'usuario'}
          />
        </header>
        
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="overview" className="space-y-6">
              <div>
                <StatsCards onNavigateToProfessionals={handleNavigateToProfessionals} />
                <div className="mt-6">
                  <DashboardCharts onChartClick={handleChartClick} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="requests">
              <RequestsPanel userRole={userRole || 'usuario'} />
            </TabsContent>

            <TabsContent value="professionals">
              <ProfessionalsTable 
                onSelectProfessional={handleSelectProfessional}
                userRole={userRole || 'usuario'}
                dashboardFilters={dashboardFilters}
              />
            </TabsContent>

            <TabsContent value="health-centers">
              <HealthCenters userRole={userRole || 'usuario'} />
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
