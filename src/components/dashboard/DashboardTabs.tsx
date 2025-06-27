
import { Button } from '@/components/ui/button';

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: string;
}

const DashboardTabs = ({ activeTab, onTabChange, userRole }: DashboardTabsProps) => {
  const tabs = [
    { id: 'overview', label: 'Resumen', roles: ['administrador', 'visualizer', 'hospital', 'comite'] },
    { id: 'requests', label: 'Gestión de Solicitudes', roles: ['administrador'] },
    { id: 'professionals', label: 'Profesionales', roles: ['administrador', 'visualizer'] },
    { id: 'health-centers', label: 'Centros de Salud', roles: ['administrador', 'visualizer'] },
    { id: 'incidents', label: 'Incidencias', roles: ['hospital'] },
    { id: 'stats', label: 'Estadísticas', roles: ['administrador', 'visualizer', 'hospital', 'comite'] },
    { id: 'ai-chat', label: 'IA Asistente', roles: ['administrador', 'visualizer', 'hospital', 'comite'] },
    { id: 'user-management', label: 'Gestión de Usuarios', roles: ['administrador'] },
    { id: 'ministerial', label: 'Panel Ministerial', roles: ['administrador', 'comite'] },
  ];

  const availableTabs = tabs.filter(tab => tab.roles.includes(userRole));

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex space-x-1 min-w-max px-6 py-3 bg-gray-50 border-b">
        {availableTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => onTabChange(tab.id)}
            className={`whitespace-nowrap ${
              activeTab === tab.id 
                ? "bg-guinea-teal text-white hover:bg-guinea-dark-teal" 
                : "text-guinea-dark-teal hover:bg-guinea-light-teal/20"
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DashboardTabs;
