import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// … resto de imports …
import DashboardTabs from '@/components/dashboard/DashboardTabs';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedProfessional, setSelectedProfessional] = useState<Profesional | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Filtros>({});
  const [showFilters, setShowFilters] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState<Filtros>({});
  
  // 🔄 NUEVO estado para pestañas
  const [activeTab, setActiveTab] = useState<string>('overview');

  const userRole = 'administrador';

  const handleFiltersChange = (filters: Filtros) => { /* … */ };
  const handleClearFilters = () => { /* … */ };
  const handleChartClick = (data: any, chartType: string) => { /* … */ };

  // 🔄 NUEVA función para cambiar pestañas y limpiar selectedProfessional
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'professionals') setSelectedProfessional(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header, StatsCards, filtros, etc. */}
        <DashboardTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          userRole={userRole}
        />

        {/* 🔄 Reemplazamos TabsContent por condicionales */}
        {/* Mantenemos el mismo espaciado */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <DashboardCharts onChartClick={handleChartClick} />
          )}

          {activeTab === 'professionals' && (
            selectedProfessional ? (
              <div className="space-y-4">
                <Button variant="outline" onClick={() => setSelectedProfessional(null)}>
                  ← Volver a la lista
                </Button>
                <ProfessionalDetail
                  professional={selectedProfessional}
                  onClose={() => setSelectedProfessional(null)}
                />
              </div>
            ) : (
              <ProfessionalsTable
                onSelectProfessional={setSelectedProfessional}
                userRole={userRole}
                appliedFilters={appliedFilters}
                onClearFilters={handleClearFilters}
                dashboardFilters={dashboardFilters}
              />
            )
          )}

          {activeTab === 'requests' && <RequestsPanel userRole={userRole} />}

          {activeTab === 'renewals' && <RenewalAlerts />}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* … contenido analíticas … */}
            </div>
          )}

          {activeTab === 'ai-chat' && <OpenAIChat />}

          {activeTab === 'ministerial' && <MinisterialPanel />}

          {activeTab === 'incidents' && <HospitalIncidents />}

          {activeTab === 'health-centers' && <HealthCenters />}

          {activeTab === 'users' && <UserRoleManagement />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
