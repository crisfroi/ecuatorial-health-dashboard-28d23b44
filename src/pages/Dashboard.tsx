
import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
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
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <DashboardSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={userRole}
        />
        
        <SidebarInset className="flex-1">
          <div className="flex flex-col min-h-screen">
            <header className="h-16 bg-white border-b flex items-center px-6">
              <SidebarTrigger className="mr-4" />
              <DashboardHeader userRole={userRole} />
              <div className="ml-auto">
                <TestDataButton />
              </div>
            </header>
            
            <main className="flex-1 p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsContent value="overview" className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Panel Principal</h2>
                    <StatsCards onNavigateToProfessionals={handleNavigateToProfessionals} />
                    <div className="mt-6">
                      <DashboardCharts onChartClick={handleChartClick} />
                    </div>
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
