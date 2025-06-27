
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Heart, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DashboardHeaderProps {
  userRole: string;
  onProfileClick?: () => void;
}

const DashboardHeader = ({ userRole, onProfileClick }: DashboardHeaderProps) => {
  const { user } = useAuth();
  
  const getRoleBadgeColor = (role: string) => {
    const colors = {
      'administrador': 'bg-red-100 text-red-800',
      'visualizer': 'bg-blue-100 text-blue-800',
      'hospital': 'bg-green-100 text-green-800',
      'comite': 'bg-purple-100 text-purple-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      'administrador': 'Administrador',
      'visualizer': 'Visualizador',
      'hospital': 'Hospital',
      'comite': 'Comité'
    };
    return roleNames[role] || role;
  };

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'US';
  };

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Heart className="w-8 h-8 text-guinea-teal" />
          <div>
            <h1 className="text-2xl font-bold text-guinea-dark-teal">RENAPROSA</h1>
            <p className="text-sm text-gray-600">Sistema de Registro Nacional de Profesionales Sanitarios</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Badge className={getRoleBadgeColor(userRole)}>
          {getRoleDisplayName(userRole)}
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-guinea-teal text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{user?.email}</p>
                <p className="text-xs text-gray-500">{getRoleDisplayName(userRole)}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Mi Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default DashboardHeader;
