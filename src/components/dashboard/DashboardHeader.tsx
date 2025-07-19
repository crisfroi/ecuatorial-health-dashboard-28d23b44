import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  userRole: string;
}

const DashboardHeader = ({ userRole }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F696aeb7245c24fa8957a85fb78836206%2F9f0f84e2fe5c4ac7bf20d675db3ea3cc?format=webp&width=800"
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
          <Button
            onClick={() => navigate("/register")}
            className="bg-guinea-teal hover:bg-guinea-dark-teal"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Registrar Profesional
          </Button>
          <Badge
            variant="secondary"
            className="bg-guinea-light-teal text-guinea-dark-teal"
          >
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
