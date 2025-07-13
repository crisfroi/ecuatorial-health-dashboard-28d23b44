
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Globe, CreditCard, Phone } from 'lucide-react';
import type { Profesional } from '@/hooks/useProfesionales';

interface PersonalInfoCardProps {
  professional: Profesional;
}

const PersonalInfoCard = ({ professional }: PersonalInfoCardProps) => {
  // Determinar qué documento mostrar
  const getDocumentInfo = () => {
    if (professional.numero_dip) {
      return { tipo: 'DIP', numero: professional.numero_dip };
    } else if (professional.numero_pasaporte) {
      return { tipo: 'Pasaporte', numero: professional.numero_pasaporte };
    } else if (professional.numero_documento) {
      return { tipo: professional.tipo_documento || 'Documento', numero: professional.numero_documento };
    }
    return { tipo: 'No especificado', numero: 'No especificado' };
  };

  const documentInfo = getDocumentInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Datos Personales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center mb-4">
          <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-16 h-16 text-gray-400" />
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-600">Nombre completo:</span>
            <p className="font-medium">{professional.nombre_completo || 'No especificado'}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-600">Nacionalidad:</span>
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <p>{professional.nacionalidad || 'No especificado'}</p>
              {professional.pertenece_brigada_medica && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {professional.tipo_cooperacion || 'Cooperación Internacional'}
                </Badge>
              )}
            </div>
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-600">{documentInfo.tipo}:</span>
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <p className="font-mono">{documentInfo.numero}</p>
            </div>
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-600">Teléfono:</span>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <p>{professional.telefono || 'No especificado'}</p>
            </div>
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-600">Edad:</span>
            <p>{professional.edad || 'No especificado'} años</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-600">Género:</span>
            <p>{professional.genero || 'No especificado'}</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="text-center">
          <div className="inline-block bg-gray-100 p-4 rounded-lg">
            <div className="font-mono text-sm">{professional.url_codigo_barras || 'No generado'}</div>
            <div className="text-xs text-gray-600 mt-1">Código de barras único</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoCard;
