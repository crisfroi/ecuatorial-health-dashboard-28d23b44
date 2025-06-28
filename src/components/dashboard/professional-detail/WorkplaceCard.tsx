
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin } from 'lucide-react';
import type { Profesional } from '@/hooks/useProfesionales';

interface WorkplaceCardProps {
  professional: Profesional;
}

const WorkplaceCard = ({ professional }: WorkplaceCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building className="w-5 h-5 text-purple-600" />
          <span>Centro de Trabajo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <span className="text-sm font-medium text-gray-600">Institución:</span>
          <p className="font-medium">{professional.nombre_centro || 'No especificado'}</p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-600">Área profesional:</span>
          <p>{professional.area_profesional || 'No especificado'}</p>
        </div>
        {professional.especialidad && (
          <div>
            <span className="text-sm font-medium text-gray-600">Especialidad:</span>
            <p>{professional.especialidad}</p>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span>{professional.distrito || 'No especificado'}, {professional.provincia || 'No especificado'}</span>
        </div>
        {professional.categoria_centro && (
          <div>
            <span className="text-sm font-medium text-gray-600">Categoría del centro:</span>
            <p>{professional.categoria_centro}</p>
          </div>
        )}
        {professional.tipo_sector && (
          <div>
            <span className="text-sm font-medium text-gray-600">Sector:</span>
            <Badge variant="outline">{professional.tipo_sector}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkplaceCard;
