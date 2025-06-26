
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, User, FileText, MapPin, Calendar, GraduationCap, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface ProfessionalDetailProps {
  professional: any;
  onClose: () => void;
}

const ProfessionalDetail = ({ professional, onClose }: ProfessionalDetailProps) => {
  const { toast } = useToast();

  const downloadAsImage = async () => {
    try {
      const element = document.getElementById('professional-detail-card');
      if (!element) return;

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      const link = document.createElement('a');
      link.download = `profesional-${professional.nombre_completo?.replace(/\s+/g, '-')}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: "Imagen descargada",
        description: "Los detalles del profesional se han descargado como imagen",
        variant: "default",
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Error",
        description: "No se pudo descargar la imagen",
        variant: "destructive",
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, string> = {
      'Aprobado': 'bg-green-100 text-green-800',
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Rechazado': 'bg-red-100 text-red-800',
      'Revisando': 'bg-blue-100 text-blue-800',
      'Pendiente de Firma': 'bg-orange-100 text-orange-800'
    };
    return variants[estado] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onClose} className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </Button>
        <Button onClick={downloadAsImage} className="flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Descargar como Imagen</span>
        </Button>
      </div>

      <Card id="professional-detail-card" className="max-w-4xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-8 h-8" />
              <div>
                <CardTitle className="text-2xl">{professional.nombre_completo}</CardTitle>
                <p className="text-blue-100">{professional.area_profesional}</p>
              </div>
            </div>
            <Badge className={getEstadoBadge(professional.estado_solicitud || 'Pendiente')}>
              {professional.estado_solicitud || 'Pendiente'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Información Personal */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <User className="w-5 h-5" />
                  <span>Información Personal</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nombre</p>
                    <p className="text-sm">{professional.nombre || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Apellidos</p>
                    <p className="text-sm">{professional.apellidos || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Género</p>
                    <p className="text-sm">{professional.genero || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Edad</p>
                    <p className="text-sm">{professional.edad || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nacionalidad</p>
                    <p className="text-sm">{professional.nacionalidad || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Teléfono</p>
                    <p className="text-sm">{professional.telefono || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Domicilio</p>
                  <p className="text-sm">{professional.domicilio || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <FileText className="w-5 h-5" />
                  <span>Documentación</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Número de DIP</p>
                  <p className="text-sm">{professional.numero_dip || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Número de Pasaporte</p>
                  <p className="text-sm">{professional.numero_pasaporte || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Carnet Profesional</p>
                  <p className="text-sm font-mono">{professional.numero_carnet_profesional || 'Pendiente'}</p>
                </div>
                {professional.id_profesional_unico && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">ID Profesional Único</p>
                    <p className="text-sm font-mono bg-blue-50 px-2 py-1 rounded">{professional.id_profesional_unico}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Información Profesional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Building className="w-5 h-5" />
                <span>Información Profesional</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Área Profesional</p>
                  <p className="text-sm">{professional.area_profesional || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Especialidad</p>
                  <p className="text-sm">{professional.especialidad || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Puesto</p>
                  <p className="text-sm">{professional.puesto_responsabilidad || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Lugar de Trabajo</p>
                  <p className="text-sm">{professional.lugar_trabajo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Tipo de Sector</p>
                  <p className="text-sm">{professional.tipo_sector || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Categoría Centro</p>
                  <p className="text-sm">{professional.categoria_centro || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <MapPin className="w-5 h-5" />
                <span>Ubicación</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Provincia</p>
                  <p className="text-sm">{professional.provincia || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Distrito</p>
                  <p className="text-sm">{professional.distrito || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Distrito Sanitario</p>
                  <p className="text-sm">{professional.distrito_sanitario || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <GraduationCap className="w-5 h-5" />
                <span>Formación Académica</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Año de Graduación</p>
                <p className="text-sm">{professional.año_graduacion || 'N/A'}</p>
              </div>
              
              {professional.titulacion_especifica_1 && (
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-sm text-gray-800">Formación Principal</h4>
                  <p className="text-sm"><strong>Titulación:</strong> {professional.titulacion_especifica_1}</p>
                  <p className="text-sm"><strong>Institución:</strong> {professional.institucion_1 || 'N/A'}</p>
                  <p className="text-sm"><strong>Período:</strong> {professional.periodo_formacion_1 || 'N/A'}</p>
                  <p className="text-sm"><strong>País:</strong> {professional.pais_formacion_1 || 'N/A'}</p>
                </div>
              )}
              
              {professional.titulacion_especifica_2 && (
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-sm text-gray-800">Formación Adicional</h4>
                  <p className="text-sm"><strong>Titulación:</strong> {professional.titulacion_especifica_2}</p>
                  <p className="text-sm"><strong>Institución:</strong> {professional.institucion_2 || 'N/A'}</p>
                  <p className="text-sm"><strong>Período:</strong> {professional.periodo_formacion_2 || 'N/A'}</p>
                  <p className="text-sm"><strong>País:</strong> {professional.pais_formacion_2 || 'N/A'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fechas Importantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Calendar className="w-5 h-5" />
                <span>Fechas Importantes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fecha de Solicitud</p>
                  <p className="text-sm">{formatDate(professional.fecha_solicitud)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Fecha de Revisión</p>
                  <p className="text-sm">{formatDate(professional.fecha_revision)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Fecha de Aprobación</p>
                  <p className="text-sm">{formatDate(professional.fecha_aprobacion)}</p>
                </div>
                {professional.fecha_validez_carnet && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Validez del Carnet</p>
                    <p className="text-sm">{formatDate(professional.fecha_validez_carnet)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalDetail;
