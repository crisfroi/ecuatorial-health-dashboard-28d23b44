
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Calendar } from 'lucide-react';
import type { Profesional } from '@/hooks/useProfesionales';

interface ProfessionalCardInfoProps {
  professional: Profesional;
  daysUntilRenewal: number | null;
  isRenewalSoon: boolean;
}

const ProfessionalCardInfo = ({ professional, daysUntilRenewal, isRenewalSoon }: ProfessionalCardInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <span>Carnet Profesional</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600 mb-1">Número de Carnet</p>
          <p className="font-mono text-lg font-bold text-blue-600">
            {professional.numero_carnet_profesional || 'Pendiente de asignación'}
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-600">Fecha de validez:</span>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <p className={`font-medium ${isRenewalSoon ? 'text-orange-600' : 'text-green-600'}`}>
                {professional.fecha_validez_carnet || 'No especificado'}
              </p>
            </div>
          </div>
          
          {daysUntilRenewal !== null && (
            <div>
              <span className="text-sm font-medium text-gray-600">Días hasta renovación:</span>
              <p className={`font-bold ${isRenewalSoon ? 'text-orange-600' : 'text-green-600'}`}>
                {daysUntilRenewal > 0 ? `${daysUntilRenewal} días` : 'Vencido'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalCardInfo;
