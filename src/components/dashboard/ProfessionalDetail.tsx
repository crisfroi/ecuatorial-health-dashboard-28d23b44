
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { User, GraduationCap, Building, MapPin, Calendar, FileText, X, Download } from 'lucide-react';

interface ProfessionalDetailProps {
  professional: any;
  onClose: () => void;
}

const ProfessionalDetail = ({ professional, onClose }: ProfessionalDetailProps) => {
  if (!professional) return null;

  const formaciones = [
    {
      titulo: 'Licenciatura en Medicina',
      año: '2018',
      tipo: 'Pregrado',
      institucion: 'Universidad Nacional de Guinea Ecuatorial'
    },
    {
      titulo: 'Especialización en Medicina Interna',
      año: '2020',
      tipo: 'Postgrado',
      institucion: 'Hospital Universitario de Barcelona'
    }
  ];

  return (
    <Dialog open={!!professional} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Perfil Profesional Detallado</span>
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Datos personales y foto */}
          <div className="space-y-4">
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
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Nombre completo:</span>
                    <p className="font-medium">{professional.nombreCompleto}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Nacionalidad:</span>
                    <p>{professional.nacionalidad}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Edad:</span>
                    <p>{professional.edad} años</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Sexo:</span>
                    <p>{professional.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="text-center">
                  <div className="inline-block bg-gray-100 p-4 rounded-lg">
                    <div className="font-mono text-sm">{professional.codigoBarras}</div>
                    <div className="text-xs text-gray-600 mt-1">Código de barras único</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna central: Formación y trabajo */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  <span>Formación Académica</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formaciones.map((formacion, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{formacion.titulo}</h4>
                      <Badge variant="secondary">{formacion.tipo}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{formacion.institucion}</p>
                    <p className="text-sm text-gray-500">Año: {formacion.año}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

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
                  <p className="font-medium">{professional.centroTrabajo}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Profesión:</span>
                  <p>{professional.profesion}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{professional.distrito}, {professional.provincia}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha: Estado y documentos */}
          <div className="space-y-4">
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
                    professional.estado === 'Aprobado' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {professional.estado}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Fecha de revisión:</span>
                    <p>{professional.fechaRevision || 'Pendiente'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Estado final:</span>
                    <p>{professional.estado}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Documentos</h4>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Carnet Profesional (PDF)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Ficha de Solicitud (PDF)
                  </Button>
                  {professional.estado === 'Aprobado' && (
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Carta de Resolución (PDF)
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfessionalDetail;
