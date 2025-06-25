
import { Badge } from '@/components/ui/badge';

interface DashboardHeaderProps {
  userRole: string;
}

const DashboardHeader = ({ userRole }: DashboardHeaderProps) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img 
            src="/lovable-uploads/f55481fd-c077-4825-921a-3c48a3b6b852.png" 
            alt="Guinea Ecuatorial Salud" 
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sistema de Gestión de Profesionales Sanitarios
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Ministerio de Sanidad y Bienestar Social - Guinea Ecuatorial
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </Badge>
          <div className="w-8 h-8 bg-guinea-teal rounded-full flex items-center justify-center text-white text-sm font-medium">
            U
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
