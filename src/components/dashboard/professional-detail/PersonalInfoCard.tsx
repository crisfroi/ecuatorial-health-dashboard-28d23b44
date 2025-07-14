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
          {/* AQUI ESTÁ EL CAMBIO: Mostrar foto_carnet o icono User */}
          {professional.foto_carnet ? (
            <img
              src={professional.foto_carnet}
              alt="Foto del Carnet Profesional"
              className="w-[162px] h-[212px] object-contain border-3 border-gray-300 rounded-lg mx-auto mb-2 shadow-lg"
              onError={(e) => {
                // Fallback en caso de que la imagen no cargue
                e.currentTarget.onerror = null; // Evita bucles infinitos
                e.currentTarget.src = 'https://via.placeholder.com/128/f0f4f8/888888?text=No+Foto'; // Puedes usar un placeholder más genérico o un icono
                e.currentTarget.className = "w-32 h-32 rounded-full flex items-center justify-center bg-gray-200 text-gray-400";
              }}
            />
          ) : (
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-16 h-16 text-gray-400" />
            </div>
          )}
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
            <span className="text-sm font-medium text-gray-600">ID Profesional:</span>
            <p>{professional.genero || 'No especificado'}</p>
          </div>
          
        </div>
          <div>
            <span className="text-sm font-medium text-gray-600">Teléfono:</span>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <p>{professional.id_profesional_unico || 'No especificado'}</p>
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
            {/* AQUI ESTÁ EL CAMBIO: Mostrar el código de barras como imagen */}
            {professional.url_codigo_barras ? (
              <img
                src={professional.url_codigo_barras}
                alt="Código de Barras"
                className="w-full h-auto max-w-[200px] mx-auto"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.alt = "Error al cargar código de barras";
                  e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjUwIiB2aWV3Qm94PSIwIDAgMjAwIDUwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iNTAiIHJ4PSI0IiBmaWxsPSIjRjNGNEY4Ii8+PHRleHQgeD0iMTAwIiB5PSIzMCIgZm9udC1mYW1pbHk9ImFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjc2NzY3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObwogY2w0ZGlndW88L3RleHQ+PC9zdmc+"
                }}
              />
            ) : (
              <div className="font-mono text-sm">{professional.codigo_barras || 'No generado'}</div>
            )}
            <div className="text-xs text-gray-600 mt-1">Código de barras único</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoCard;
