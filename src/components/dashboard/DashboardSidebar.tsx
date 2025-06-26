
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Activity, FileText, Users, TrendingUp, MessageCircle, AlertTriangle, Settings, UserCheck } from 'lucide-react';

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: string;
}

const DashboardSidebar = ({ activeTab, onTabChange, userRole }: DashboardSidebarProps) => {
  const menuItems = [
    { id: 'overview', label: 'Panel Principal', icon: Activity },
    { id: 'requests', label: 'Solicitudes', icon: FileText },
    { id: 'professionals', label: 'Profesionales', icon: Users },
    { id: 'stats', label: 'Estadísticas', icon: TrendingUp },
    { id: 'ai-chat', label: 'Análisis IA', icon: MessageCircle },
    { id: 'incidents', label: 'Incidencias', icon: AlertTriangle },
    ...(userRole === 'administrador' ? [
      { id: 'user-management', label: 'Usuarios', icon: Settings }
    ] : []),
    ...((userRole === 'administrador' || userRole === 'comite') ? [
      { id: 'ministerial', label: 'Panel Ministerial', icon: UserCheck }
    ] : [])
  ];

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-guinea-teal rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-guinea-dark-teal">Dashboard</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeTab === item.id}
                      onClick={() => onTabChange(item.id)}
                      className="w-full justify-start"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default DashboardSidebar;
