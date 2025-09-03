import { Button } from '@/components/ui/button';
import { Activity, FileText, Users, TrendingUp, MessageCircle, AlertTriangle, Settings, UserCheck, Building2 } from 'lucide-react';

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: string;
}

const DashboardTabs = ({ activeTab, onTabChange, userRole }: DashboardTabsProps) => {
  const tabs = [
    { id: 'overview', label: 'Panel Principal', icon: Activity },
    { id: 'requests', label: 'Solicitudes', icon: FileText },
    { id: 'professionals', label: 'Profesionales', icon: Users },
    { id: 'health-centers', label: 'Centros de Salud', icon: Building2 },
    { id: 'stats', label: 'Estadísticas', icon: TrendingUp },
    { id: 'iachat', label: 'Análisis IA', icon: MessageCircle },
    { id: 'incidents', label: 'Incidencias', icon: AlertTriangle },
    ...(userRole === 'administrador' ? [
      { id: 'user-management', label: 'Usuarios', icon: Settings }
    ] : []),
    ...((userRole === 'administrador' || userRole === 'comite') ? [
      { id: 'ministerial', label: 'Panel Ministerial', icon: UserCheck }
    ] : [])
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6 p-4 bg-white rounded-lg shadow-sm border">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => onTabChange(tab.id)}
            // AQUI ESTÁ EL CAMBIO: Añadimos clases para el hover
            className={`
              flex items-center space-x-2 h-10
              ${activeTab === tab.id
                ? '' // No clases adicionales si es la pestaña activa (ya tiene variant="default")
                : 'hover:bg-primary/10 hover:text-primary' // Clases para hover si no es la pestaña activa
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Button>
        );
      })}
    </div>
  );
};

export default DashboardTabs;
