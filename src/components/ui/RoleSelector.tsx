import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Eye, Building2, Crown } from 'lucide-react';
import { UserRole, ROLE_DEFINITIONS } from '@/types/roles';
import { useAuth } from '@/contexts/AuthContext';

const RoleSelector: React.FC = () => {
  const { userRole, switchRole, user } = useAuth();

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMINISTRADOR':
        return <Crown className="w-4 h-4" />;
      case 'REVISOR_SOLICITUDES':
        return <Users className="w-4 h-4" />;
      case 'PERSONALIDAD_MINISTERIAL':
        return <Shield className="w-4 h-4" />;
      case 'OBSERVADOR':
        return <Eye className="w-4 h-4" />;
      case 'DIRECTIVO_CENTRO_SANITARIO':
        return <Building2 className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMINISTRADOR':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'REVISOR_SOLICITUDES':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PERSONALIDAD_MINISTERIAL':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'OBSERVADOR':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'DIRECTIVO_CENTRO_SANITARIO':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!userRole) return null;

  const currentRoleDefinition = ROLE_DEFINITIONS[userRole];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {getRoleIcon(userRole)}
          Selector de Rol (Demo)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Rol Actual:</label>
          <Badge 
            variant="outline" 
            className={`${getRoleColor(userRole)} flex items-center gap-2 justify-center py-2`}
          >
            {getRoleIcon(userRole)}
            {currentRoleDefinition.name}
          </Badge>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Cambiar Rol:</label>
          <Select value={userRole} onValueChange={(value: UserRole) => switchRole(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_DEFINITIONS).map(([roleId, roleDefinition]) => (
                <SelectItem key={roleId} value={roleId}>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(roleId as UserRole)}
                    {roleDefinition.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Descripción:</label>
          <p className="text-xs text-gray-600">
            {currentRoleDefinition.description}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Pestañas Disponibles:</label>
          <div className="flex flex-wrap gap-1">
            {currentRoleDefinition.dashboardTabs.map((tab) => (
              <Badge key={tab} variant="secondary" className="text-xs">
                {tab}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Permisos ({currentRoleDefinition.permissions.length}):</label>
          <div className="max-h-32 overflow-y-auto">
            <div className="space-y-1">
              {currentRoleDefinition.permissions.slice(0, 5).map((permission) => (
                <div key={permission} className="text-xs text-gray-600">
                  • {permission.replace(/_/g, ' ')}
                </div>
              ))}
              {currentRoleDefinition.permissions.length > 5 && (
                <div className="text-xs text-gray-500 italic">
                  ... y {currentRoleDefinition.permissions.length - 5} más
                </div>
              )}
            </div>
          </div>
        </div>

        {currentRoleDefinition.restrictions && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-orange-600">Restricciones:</label>
            <div className="text-xs text-orange-700 space-y-1">
              {currentRoleDefinition.restrictions.dataFilters && (
                <div>• Filtros de datos aplicados</div>
              )}
              {currentRoleDefinition.restrictions.exportLimits && (
                <div>• Límite de exportación: {currentRoleDefinition.restrictions.exportLimits} registros</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleSelector;
