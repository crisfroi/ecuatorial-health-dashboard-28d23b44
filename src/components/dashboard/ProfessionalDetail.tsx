
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, GraduationCap, Building, MapPin, Calendar, FileText, X, Download, Phone, CreditCard, AlertTriangle, Globe } from 'lucide-react';

interface ProfessionalDetailProps {
  professional: any;
  onClose: () => void;
}

const ProfessionalDetail = ({ professional, onClose }: ProfessionalDetailProps) => {
  if (!professional) return null;

  // Función para calcular días hasta renovación
  const calculateDaysUntilRenewal = (validityDate: string) => {
    const today = new Date();
    const validity = new Date(validityDate);
    const diffTime = validity.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Datos simulados mejorados
  const professionalData = {
    ...professional,
    telefono: '+240 222 123 456',
    documentoId: professional.nacionalidad === 'Guinea Ecuatorial' ? '12345678A' : 'P12345678',
    tipoDocumento: professional.nacionalidad === 'Guinea Ecuatorial' ? 'DNI' : 'Pasaporte',
    fechaValidezCarnet: '2024-12-15',
    esBrigadaMedica: professional.nacionalidad !== 'Guinea Ecuatorial' ? true : false,
    tipoCooperacion: professional.nacionalidad !== 'Guinea Ecuatorial' ? 'Brigada Médica Cubana' : null,
    numeroCarnetProfesional: 'PROF-2024-001234'
  };

  const daysUntilRenewal = calculateDaysUntilRenewal(professionalData.fechaValidezCarnet);
  const isRenewalSoon = daysUntilRenewal <= 30;

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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

        {/* Alerta de renovación próxima */}
        {isRenewalSoon && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Renovación próxima:</strong> El carnet profesional vence en {daysUntilRenewal} días ({professionalData.fechaValidezCarnet})
            </AlertDescription>
          </Alert>
        )}

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
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Nombre completo:</span>
                    <p className="font-medium">{professionalData.nombreCompleto}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">Nacionalidad:</span>
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <p>{professionalData.nacionalidad}</p>
                      {professionalData.esBrigadaMedica && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {professionalData.tipoCooperacion}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">{professionalData.tipoDocumento}:</span>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <p className="font-mono">{professionalData.documentoId}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">Teléfono:</span>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <p>{professionalData.telefono}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">Edad:</span>
                    <p>{professionalData.edad} años</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">Sexo:</span>
                    <p>{professionalData.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
                  </div>
                </div>
                
                <Separator />
                
                 <div className="image">
                  <div className="inline-block bg-gray-100 p-4 rounded-lg">
                    <div src={`https://barcodeapi.org/api/128/${professionalData.idProfesionalUnico}`}
                    <div alt="text-xs text-gray-600 mt-1">Código de barras único</div>
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
                  <p className="font-medium">{professionalData.centroTrabajo}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Profesión:</span>
                  <p>{professionalData.profesion}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{professionalData.distrito}, {professionalData.provincia}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha: Estado y documentos */}
          <div className="space-y-4">
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
                  <p className="font-mono text-lg font-bold text-blue-600">{professionalData.numeroCarnetProfesional}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Fecha de validez:</span>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <p className={`font-medium ${isRenewalSoon ? 'text-orange-600' : 'text-green-600'}`}>
                        {professionalData.fechaValidezCarnet}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">Días hasta renovación:</span>
                    <p className={`font-bold ${isRenewalSoon ? 'text-orange-600' : 'text-green-600'}`}>
                      {daysUntilRenewal} días
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    professionalData.estado === 'Aprobado' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {professionalData.estado}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Fecha de revisión:</span>
                    <p>{professionalData.fechaRevision || 'Pendiente'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Estado final:</span>
                    <p>{professionalData.estado}</p>
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
                  {professionalData.estado === 'Aprobado' && (
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
