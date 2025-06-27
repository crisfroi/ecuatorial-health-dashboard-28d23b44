
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  Building2, 
  ClipboardList, 
  TrendingUp, 
  MessageCircle, 
  AlertTriangle,
  UserCog,
  Crown
} from 'lucide-react';

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: string;
}

const DashboardTabs = ({ activeTab, onTabChange, userRole }: DashboardTabsProps) => {
  const isAdmin = userRole === 'administrador';
  const isHospital = userRole === 'hospital';
  const isVisualizer = userRole === 'visualizer';
  const isCommittee = userRole === 'comite';

  return (
    <div className="border-b bg-white/80 backdrop-blur-sm">
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="grid w-full bg-transparent p-0 h-auto">
            {/* Todos los roles pueden ver el resumen */}
            <TabsTrigger 
              value="overview" 
              className="flex items-center space-x-2 py-4 px-6 data-[state=active]:bg-guinea-teal/10 data-[state=active]:text-guinea-dark-teal data-[state=active]:border-b-2 data-[state=active]:border-guinea-teal hover:bg-guinea-light-teal/5 transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Resumen</span>
            </TabsTrigger>

            {/* Solo admin puede ver solicitudes */}
            {isAdmin && (
              <TabsTrigger 
                value="requests" 
                className="flex items-center space-x-2 py-4 px-6 data-[state=active]:bg-guinea-teal/10 data-[state=active]:text-guinea-dark-teal data-[state=active]:border-b-2 data-[state=active]:border-guinea-teal hover:bg-guinea-light-teal/5 transition-all duration-200"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Solicitudes</span>
              </TabsTrigger>
            )}

            {/* Admin y visualizer pueden ver profesionales */}
            {(isAdmin || isVisualizer) && (
              <TabsTrigger 
                value="professionals" 
                className="flex items-center space-x-2 py-4 px-6 data-[state=active]:bg-guinea-teal/10 data-[state=active]:text-guinea-dark-teal data-[state=active]:border-b-2 data-[state=active]:border-guinea-teal hover:bg-guinea-light-teal/5 transition-all duration-200"
              >
                <Users className="w-4 h-4" />
                <span>Profesionales</span>
              </TabsTrigger>
            )}

            {/* Admin y visualizer pueden ver centros de salud */}
            {(isAdmin || isVisualizer) && (
              <TabsTrigger 
                value="health-centers" 
                className="flex items-center space-x-2 py-4 px-6 data-[state=active]:bg-guinea-teal/10 data-[state=active]:text-guinea-dark-teal data-[state=active]:border-b-2 data-[state=active]:border-guinea-teal hover:bg-guinea-light-teal/5 transition-all duration-200"
              >
                <Building2 className="w-4 h-4" />
                <span>Centros de Salud</span>
              </TabsTrigger>
            )}

            {/* Todos pueden ver estadísticas */}
            <TabsTrigger 
              value="stats" 
              className="flex items-center space-x-2 py-4 px-6 data-[state=active]:bg-guinea-teal/10 data-[state=active]:text-guinea-dark-teal data-[state=active]:border-b-2 data-[state=active]:border-guinea-teal hover:bg-guinea-light-teal/5 transition-all duration-200"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Estadísticas</span>
            </TabsTrigger>

            {/* Todos pueden acceder a la IA */}
            <TabsTrigger 
              value="ai-chat" 
              className="flex items-center space-x-2 py-4 px-6 data-[state=active]:bg-guinea-teal/10 data-[state=active]:text-guinea-dark-teal data-[state=active]:border-b-2 data-[state=active]:border-guinea-teal hover:bg-guinea-light-teal/5 transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Análisis IA</span>
            </TabsTrigger>

            {/* Solo hospital puede ver incidencias */}
            {isHospital && (
              <TabsTrigger 
                value="incidents" 
                className="flex items-center space-x-2 py-4 px-6 data-[state=active]:bg-guinea-teal/10 data-[state=active]:text-guinea-dark-teal data-[state=active]:border-b-2 data-[state=active]:border-guinea-teal hover:bg-guinea-light-teal/5 transition-all duration-200"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Incidencias</span>
              </TabsTrigger>
            )}

            {/* Solo admin puede ver gestión de usuarios */}
            {isAdmin && (
              <TabsTrigger 
                value="user-management" 
                className="flex items-center space-x-2 py-4 px-6 data-[state=active]:bg-guinea-teal/10 data-[state=active]:text-guinea-dark-teal data-[state=active]:border-b-2 data-[state=active]:border-guinea-teal hover:bg-guinea-light-teal/5 transition-all duration-200"
              >
                <UserCog className="w-4 h-4" />
                <span>Usuarios</span>
              </TabsTrigger>
            )}

            {/* Admin y comité pueden ver panel ministerial */}
            {(isAdmin || isCommittee) && (
              <TabsTrigger 
                value="ministerial" 
                className="flex items-center space-x-2 py-4 px-6 data-[state=active]:bg-guinea-teal/10 data-[state=active]:text-guinea-dark-teal data-[state=active]:border-b-2 data-[state=active]:border-guinea-teal hover:bg-guinea-light-teal/5 transition-all duration-200"
              >
                <Crown className="w-4 h-4" />
                <span>Panel Ministerial</span>
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardTabs;
