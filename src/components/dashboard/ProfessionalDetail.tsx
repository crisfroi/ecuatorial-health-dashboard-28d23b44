
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, GraduationCap, Building, MapPin, Calendar, FileText, X, Download, Phone, CreditCard, AlertTriangle, Globe } from 'lucide-react';

interface ProfessionalDetailProps {
  professional: any;
  onClose: () => void;
}

const ProfessionalDetail = ({ professional, onClose }: ProfessionalDetailProps) => {
  if (!professional) return null;

  // Función para calcular días hasta renovación
  const calculateDaysUntilRenewal = (validityDate: string) => {
    if (!validityDate) return null;
    const today = new Date();
    const validity = new Date(validityDate);
    const diffTime = validity.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Determinar el tipo de documento y número
  const getDocumentInfo = () => {
    if (professional.numero_dip) {
      return { type: 'DIP', number: professional.numero_dip };
    } else if (professional.numero_pasaporte) {
      return { type: 'Pasaporte', number: professional.numero_pasaporte };
    } else if (professional.numero_documento) {
      return { type: 'Documento', number: professional.numero_documento };
    }
    return { type: 'Sin especificar', number: 'Sin especificar' };
  };

  const documentInfo = getDocumentInfo();
  const daysUntilRenewal = professional.fecha_validez_carnet ? calculateDaysUntilRenewal(professional.fecha_validez_carnet) : null;
  const isRenewalSoon = daysUntilRenewal !== null && daysUntilRenewal <= 30;

  // Generar código de barras único
  const generateBarcodeUrl = (id: string) => {
    return `https://barcodeapi.org/api/128/${id}`;
  };

  // Función para descargar como PDF
  const downloadAsPDF = () => {
    window.print();
  };

  // Función para descargar como PNG
  const downloadAsPNG = () => {
    const element = document.getElementById('professional-detail-content');
    if (element) {
      import('html2canvas').then((html2canvas) => {
        html2canvas.default(element).then((canvas) => {
          const link = document.createElement('a');
          link.download = `perfil-${professional.nombre_completo}.png`;
          link.href = canvas.toDataURL();
          link.click();
        });
      });
    }
  };

  return (
    <Dialog open={!!professional} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Perfil Profesional Detallado</span>
            </span>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={downloadAsPDF}>
                    <FileText className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadAsPNG}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PNG
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div id="professional-detail-content">
          {/* Alerta de renovación próxima */}
          {isRenewalSoon && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Renovación próxima:</strong> El carnet profesional vence en {daysUntilRenewal} días ({professional.fecha_validez_carnet})
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
                      <p className="font-medium">{professional.nombre_completo || 'Sin especificar'}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-600">Nacionalidad:</span>
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <p>{professional.nacionalidad || 'Sin especificar'}</p>
                        {professional.pertenece_brigada_medica && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {professional.tipo_cooperacion || 'Brigada Médica'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-600">{documentInfo.type}:</span>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <p className="font-mono">{documentInfo.number}</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-600">Teléfono:</span>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <p>{professional.telefono || 'Sin especificar'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-600">Edad:</span>
                      <p>{professional.edad ? `${professional.edad} años` : 'Sin especificar'}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-600">Sexo:</span>
                      <p>{professional.genero === 'M' || professional.genero === 'MASCULINO' ? 'Masculino' : 
                          professional.genero === 'F' || professional.genero === 'FEMENINO' ? 'Femenino' : 'Sin especificar'}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {professional.id_profesional_unico && (
                    <div className="text-center">
                      <div className="inline-block bg-gray-100 p-4 rounded-lg">
                        <img 
                          src={generateBarcodeUrl(professional.id_profesional_unico)}
                          alt="Código de barras único"
                          className="h-12"
                        />
                        <div className="text-xs text-gray-600 mt-1">{professional.id_profesional_unico}</div>
                      </div>
                    </div>
                  )}
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
                  {professional.titulacion_especifica_1 && (
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{professional.titulacion_especifica_1}</h4>
                        <Badge variant="secondary">{professional.tipo_formacion_1 || 'Formación'}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{professional.institucion_1 || 'Sin especificar'}</p>
                      <p className="text-sm text-gray-500">Período: {professional.periodo_formacion_1 || 'Sin especificar'}</p>
                      <p className="text-sm text-gray-500">País: {professional.pais_formacion_1 || 'Sin especificar'}</p>
                    </div>
                  )}
                  
                  {professional.titulacion_especifica_2 && (
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{professional.titulacion_especifica_2}</h4>
                        <Badge variant="secondary">{professional.tipo_formacion_2 || 'Formación'}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{professional.institucion_2 || 'Sin especificar'}</p>
                      <p className="text-sm text-gray-500">Período: {professional.periodo_formacion_2 || 'Sin especificar'}</p>
                      <p className="text-sm text-gray-500">País: {professional.pais_formacion_2 || 'Sin especificar'}</p>
                    </div>
                  )}
                  
                  {!professional.titulacion_especifica_1 && !professional.titulacion_especifica_2 && (
                    <p className="text-gray-500 text-center py-4">No hay información de formación disponible</p>
                  )}
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
                    <p className="font-medium">{professional.nombre_centro || 'Sin especificar'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Área profesional:</span>
                    <p>{professional.area_profesional || 'Sin especificar'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Especialidad:</span>
                    <p>{professional.especialidad || 'Sin especificar'}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{professional.distrito || 'Sin especificar'}, {professional.provincia || 'Sin especificar'}</span>
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
                    <p className="font-mono text-lg font-bold text-blue-600">
                      {professional.numero_carnet_profesional || 'Sin especificar'}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    {professional.fecha_validez_carnet && (
                      <>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Fecha de validez:</span>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <p className={`font-medium ${isRenewalSoon ? 'text-orange-600' : 'text-green-600'}`}>
                              {professional.fecha_validez_carnet}
                            </p>
                          </div>
                        </div>
                        
                        {daysUntilRenewal !== null && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">Días hasta renovación:</span>
                            <p className={`font-bold ${isRenewalSoon ? 'text-orange-600' : 'text-green-600'}`}>
                              {daysUntilRenewal} días
                            </p>
                          </div>
                        )}
                      </>
                    )}
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
                      professional.estado_solicitud === 'Aprobado' 
                        ? 'bg-green-100 text-green-800' 
                        : professional.estado_solicitud === 'Pendiente'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {professional.estado_solicitud || 'Sin especificar'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Fecha de revisión:</span>
                      <p>{professional.fecha_revision || 'Pendiente'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Revisor:</span>
                      <p>{professional.revisor_solicitud || 'Sin asignar'}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium">Documentos</h4>
                    {professional.pdf_formulario && (
                      <Button variant="outline" className="w-full justify-start" onClick={() => window.open(professional.pdf_formulario, '_blank')}>
                        <Download className="w-4 h-4 mr-2" />
                        Ver Formulario PDF
                      </Button>
                    )}
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Carnet Profesional (PDF)
                    </Button>
                    {professional.estado_solicitud === 'Aprobado' && (
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfessionalDetail;
