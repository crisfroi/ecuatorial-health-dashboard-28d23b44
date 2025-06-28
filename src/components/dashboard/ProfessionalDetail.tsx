
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, GraduationCap, Building, MapPin, Calendar, FileText, X, Download, Phone, CreditCard, AlertTriangle, Globe, MessageSquare, ChevronDown } from 'lucide-react';
import { useNotificationCount, useSendSMSNotification } from '@/hooks/useSMSNotifications';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import type { Profesional } from '@/hooks/useProfesionales';

interface ProfessionalDetailProps {
  professional: Profesional;
  onClose: () => void;
}

const ProfessionalDetail = ({ professional, onClose }: ProfessionalDetailProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const { data: notificationCount } = useNotificationCount(professional.id);
  const sendSMSMutation = useSendSMSNotification();

  if (!professional) return null;

  // Función para calcular días hasta renovación
  const calculateDaysUntilRenewal = (validityDate?: string) => {
    if (!validityDate) return null;
    const today = new Date();
    const validity = new Date(validityDate);
    const diffTime = validity.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilRenewal = calculateDaysUntilRenewal(professional.fecha_validez_carnet);
  const isRenewalSoon = daysUntilRenewal !== null && daysUntilRenewal <= 30;

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

  const handleDownload = async (format: 'pdf' | 'png') => {
    setIsDownloading(true);
    try {
      const element = document.getElementById('professional-detail-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `perfil-${professional.nombre_completo?.replace(/\s+/g, '-') || 'profesional'}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } else {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`perfil-${professional.nombre_completo?.replace(/\s+/g, '-') || 'profesional'}.pdf`);
      }

      toast({
        title: "Descarga completada",
        description: `El perfil se ha descargado en formato ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error al descargar:', error);
      toast({
        title: "Error en la descarga",
        description: "No se pudo completar la descarga",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendSMS = async (tipoNotificacion: string) => {
    if (!professional.telefono) {
      toast({
        title: "Sin teléfono",
        description: "Este profesional no tiene número de teléfono registrado",
        variant: "destructive",
      });
      return;
    }

    let mensaje = '';
    if (tipoNotificacion === '30_dias_antes') {
      mensaje = `Estimado/a ${professional.nombre_completo}, su carnet profesional vence el ${professional.fecha_validez_carnet || 'pronto'}. Por favor, renueve antes del vencimiento. Ministerio de Sanidad - Guinea Ecuatorial`;
    } else if (tipoNotificacion === '10_dias_despues') {
      mensaje = `Estimado/a ${professional.nombre_completo}, su carnet profesional venció el ${professional.fecha_validez_carnet || 'recientemente'}. Debe renovar urgentemente. Contacte al Ministerio de Sanidad - Guinea Ecuatorial`;
    }

    try {
      await sendSMSMutation.mutateAsync({
        profesionalId: professional.id,
        telefono: professional.telefono,
        tipoNotificacion,
        mensaje
      });

      toast({
        title: "SMS enviado",
        description: "La notificación SMS ha sido enviada exitosamente",
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el SMS",
        variant: "destructive",
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
                  <Button variant="outline" size="sm" disabled={isDownloading}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleDownload('pdf')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('png')}>
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
                <strong>Renovación próxima:</strong> El carnet profesional vence en {daysUntilRenewal} días ({professional.fecha_validez_carnet || 'No especificado'})
              </AlertDescription>
            </Alert>
          )}

          {/* Información de notificaciones SMS */}
          {notificationCount && notificationCount.total_notificaciones > 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="flex items-center justify-between">
                  <span>
                    <strong>Notificaciones SMS:</strong> {notificationCount.total_notificaciones} enviadas
                    {notificationCount.ultima_notificacion && 
                      ` (última: ${new Date(notificationCount.ultima_notificacion).toLocaleDateString('es-ES')})`
                    }
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Enviar SMS
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleSendSMS('30_dias_antes')}>
                        Recordatorio de renovación
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendSMS('10_dias_despues')}>
                        Aviso de vencimiento
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
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
                      <div className="font-mono text-sm">{professional.codigo_barras || 'No generado'}</div>
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfessionalDetail;
