
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, FileText, Users, TrendingUp, MessageCircle, AlertTriangle, Settings, UserCheck } from 'lucide-react';

interface DashboardTabsProps {
  userRole: string;
}

const DashboardTabs = ({ userRole }: DashboardTabsProps) => {
  return (
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
  );
};

export default DashboardTabs;
