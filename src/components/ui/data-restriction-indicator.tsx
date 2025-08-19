import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Building2, Shield, Eye, Filter } from 'lucide-react';
import { useRoleBasedData } from '@/hooks/useRoleBasedData';
import { useAuth } from '@/contexts/AuthContext';

interface DataRestrictionIndicatorProps {
  dataType: 'profesionales' | 'centros' | 'incidencias';
  originalCount?: number;
  filteredCount?: number;
  className?: string;
}

export const DataRestrictionIndicator: React.FC<DataRestrictionIndicatorProps> = ({
  dataType,
  originalCount = 0,
  filteredCount = 0,
  className = ''
}) => {
  const { user, userRole } = useAuth();
  const { getAssignedCenterInfo, isRestricted } = useRoleBasedData();

  // No mostrar si no hay userRole (aún cargando)
  if (!userRole) {
    return null;
  }

  const centerInfo = getAssignedCenterInfo();
  const isDataFiltered = originalCount > 0 && filteredCount < originalCount;

  // No mostrar si no hay restricciones
  if (!isRestricted && !isDataFiltered) {
    return null;
  }

  const getDataTypeLabel = () => {
    switch (dataType) {
      case 'profesionales': return 'profesionales';
      case 'centros': return 'centros de salud';
      case 'incidencias': return 'incidencias';
      default: return 'datos';
    }
  };

  const getRoleDescription = () => {
    switch (userRole) {
      case 'DIRECTIVO_CENTRO_SANITARIO':
        return `Como Director de Centro, solo ve ${getDataTypeLabel()} de su centro asignado`;
      case 'OBSERVADOR':
        return `Como Observador, tiene acceso limitado a ${getDataTypeLabel()}`;
      case 'PERSONALIDAD_MINISTERIAL':
        return `Los datos personales sensibles han sido ocultados`;
      default:
        return `Vista filtrada de ${getDataTypeLabel()}`;
    }
  };

  const getIcon = () => {
    switch (userRole) {
      case 'DIRECTIVO_CENTRO_SANITARIO':
        return <Building2 className="w-4 h-4" />;
      case 'OBSERVADOR':
        return <Eye className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
      <div className="flex items-center gap-2">
        {getIcon()}
        <div className="flex-1">
          <AlertDescription className="text-amber-800">
            <div className="flex items-center justify-between">
              <span>{getRoleDescription()}</span>
              <div className="flex items-center gap-2">
                {isDataFiltered && (
                  <Badge variant="outline" className="text-amber-700 border-amber-300">
                    <Filter className="w-3 h-3 mr-1" />
                    {filteredCount} de {originalCount}
                  </Badge>
                )}
                {centerInfo && (
                  <Badge variant="outline" className="text-amber-700 border-amber-300">
                    <Building2 className="w-3 h-3 mr-1" />
                    Centro: {centerInfo.centerId}
                  </Badge>
                )}
              </div>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default DataRestrictionIndicator;
