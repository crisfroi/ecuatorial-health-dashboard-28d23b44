
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap } from 'lucide-react';
import type { Profesional } from '@/hooks/useProfesionales';

interface EducationCardProps {
  professional: Profesional;
}

const EducationCard = ({ professional }: EducationCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <GraduationCap className="w-5 h-5 text-green-600" />
          <span>Formación Académica</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {professional.titulacion_especifica_1 && (
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{professional.titulacion_especifica_1}</h4>
              <Badge variant="secondary">{professional.tipo_formacion_1 || 'Formación'}</Badge>
            </div>
            <p className="text-sm text-gray-600">{professional.institucion_1 || 'Institución no especificada'}</p>
            <p className="text-sm text-gray-500">
              Año: {professional.año_graduacion || professional.periodo_formacion_1 || 'No especificado'}
            </p>
            {professional.pais_formacion_1 && (
              <p className="text-sm text-gray-500">País: {professional.pais_formacion_1}</p>
            )}
          </div>
        )}

        {professional.titulacion_especifica_2 && (
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{professional.titulacion_especifica_2}</h4>
              <Badge variant="secondary">{professional.tipo_formacion_2 || 'Formación'}</Badge>
            </div>
            <p className="text-sm text-gray-600">{professional.institucion_2 || 'Institución no especificada'}</p>
            <p className="text-sm text-gray-500">Período: {professional.periodo_formacion_2 || 'No especificado'}</p>
            {professional.pais_formacion_2 && (
              <p className="text-sm text-gray-500">País: {professional.pais_formacion_2}</p>
            )}
          </div>
        )}

        {!professional.titulacion_especifica_1 && !professional.titulacion_especifica_2 && (
          <p className="text-sm text-gray-500">No hay información de formación académica registrada</p>
        )}
      </CardContent>
    </Card>
  );
};

export default EducationCard;
