
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Download } from 'lucide-react';
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
              ? 'bg-green-100 text-green-800' 
              : professional.estado_solicitud === 'Rechazado'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {professional.estado_solicitud || 'Pendiente'}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-600">Fecha de solicitud:</span>
            <p>{professional.fecha_solicitud || professional.created_at?.split('T')[0] || 'No especificado'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">Fecha de revisión:</span>
            <p>{professional.fecha_revision || 'Pendiente'}</p>
          </div>
          {professional.fecha_aprobacion && (
            <div>
              <span className="text-sm font-medium text-gray-600">Fecha de aprobación:</span>
              <p>{professional.fecha_aprobacion}</p>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="font-medium">Documentos</h4>
          <Button variant="outline" className="w-full justify-start" disabled>
            <Download className="w-4 h-4 mr-2" />
            Carnet Profesional (PDF)
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <Download className="w-4 h-4 mr-2" />
            Ficha de Solicitud (PDF)
          </Button>
          {professional.estado_solicitud === 'Aprobado' && (
            <Button variant="outline" className="w-full justify-start" disabled>
              <Download className="w-4 h-4 mr-2" />
              Carta de Resolución (PDF)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusCard;
