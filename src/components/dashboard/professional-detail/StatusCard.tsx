import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText } from 'lucide-react';
import type { Profesional } from '@/hooks/useProfesionales';

interface StatusCardProps {
  professional: Profesional;
}

const StatusCard = ({ professional }: StatusCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-orange-600" />
          <span>Estado de Solicitud</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Badge className={`text-lg px-4 py-2 ${
            professional.estado_solicitud === 'Aprobado' 
              ? 'bg-green-100 text-green-800 hover:bg-green-100/90' 
              : professional.estado_solicitud === 'Rechazado'
              ? 'bg-red-100 text-red-800 hover:bg-red-100/90'
              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100/90'
          }`}>
            {professional.estado_solicitud || 'Pendiente'}
          </Badge>
        </div>
        
        <Separator /> 
        
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-600">Fecha de solicitud:</span>
            <p className='font-medium'>{professional.fecha_solicitud || professional.created_at?.split('T')[0] || 'No especificado'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">Fecha de revisión:</span>
            <p className='font-medium'>{professional.fecha_revision || 'Pendiente'}</p>
          </div>
          {professional.fecha_aprobacion && (
            <div>
              <span className="text-sm font-medium text-gray-600">Fecha de aprobación:</span>
              <p className='font-medium'>{professional.fecha_aprobacion}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusCard;
