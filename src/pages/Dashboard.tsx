
import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
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
import { useEstadisticasProfesionales } from '@/hooks/useEstadisticas';

const Dashboard = () => {
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userRole, setUserRole] = useState('administrador');
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [dashboardFilters, setDashboardFilters] = useState({});

  const { data: stats } = useEstadisticasProfesionales();

  const handleNavigateToProfessionals = (filters: any) => {
    console.log('Dashboard: Navigating with filters:', filters);
    setAppliedFilters(filters);
    setActiveTab('professionals');
  };

  const handleClearFilters = () => {
    setAppliedFilters(null);
    setDashboardFilters({});
  };

  const handleDashboardFiltersChange = (filters: any) => {
    console.log('Dashboard: Filters changed:', filters);
    setDashboardFilters(filters);
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
      <DashboardHeader userRole={userRole} />

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <DashboardTabs userRole={userRole} />

          <TabsContent value="overview" className="space-y-6">
            <DashboardFilters 
              onFiltersChange={handleDashboardFiltersChange}
              activeFilters={dashboardFilters}
            />
            <StatsCards onNavigateToProfessionals={handleNavigateToProfessionals} />
            
            <RenewalAlerts onNavigateToProfessionals={handleNavigateToProfessionals} />
            
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
