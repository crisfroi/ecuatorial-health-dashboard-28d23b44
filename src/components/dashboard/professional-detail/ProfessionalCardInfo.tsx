import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { CreditCard, Calendar, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Profesional } from '@/hooks/useProfesionales';

interface ProfessionalCardInfoProps {
  professional: Profesional;
  daysUntilRenewal: number | null; // Este valor se pasa como prop
  isRenewalSoon: boolean; // Este valor se pasa como prop
}

const ProfessionalCardInfo = ({ professional, daysUntilRenewal, isRenewalSoon }: ProfessionalCardInfoProps) => {
  const { toast } = useToast();

  const handleDownloadCarnet = async () => {
    if (!professional.url_carnet) {
      toast({
        title: "Carnet no disponible",
        description: "No hay una URL de carnet para descargar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. Obtener el contenido del SVG como Blob
      const response = await fetch(professional.url_carnet);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const svgBlob = await response.blob();

      // 2. Crear una URL de objeto a partir del Blob
      const url = window.URL.createObjectURL(svgBlob);

      // 3. Crear el enlace de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `carnet-${professional.nombre_completo?.replace(/\s+/g, '-') || 'profesional'}.svg`;
      document.body.appendChild(link);

      // 4. Simular clic y limpiar
      link.click();
      document.body.removeChild(link);

      // 5. Liberar la URL de objeto para liberar memoria
      window.URL.revokeObjectURL(url);

      toast({
        title: "Descarga iniciada",
        description: "El carnet profesional se está descargando.",
      });
    } catch (error) {
      console.error('Error al descargar el carnet:', error);
      toast({
        title: "Error en la descarga",
        description: "No se pudo iniciar la descarga del carnet. Verifique la URL o el origen.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <span>Carnet Profesional</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Sección para la visualización del Carnet SVG */}
        {professional.url_carnet ? (
          <div className="text-center p-2 border rounded-lg bg-gray-50">
            <p className="text-sm font-medium text-gray-600 mb-2">Vista Previa del Carnet</p>
            <img
              src={professional.url_carnet}
              alt="Carnet Profesional Completo"
              className="w-full h-auto max-w-xs object-contain mx-auto border rounded-md shadow-sm"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.alt = "Error al cargar el carnet";
                e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDI0MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd2wwdy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIyNDAiIGhlaWdodD0iMTUwIiByeD0iOCIgZmlsbD0iI0QwRTRGRiIvPjxwYXRoIGQ9Ik01MCAyNUgxOTB2MTAwSDU1UVMxMDAgNTAgNTAgMjVaTTEyMCA4NUgxNTBNOTAgODVIMTIwTTYwIDg1SDkwTTEyMCAxMTFIMTUwTTkwIDExMUgxMjBNNjAgMTExSDkwIiBzdHJva2U9IiMzRDZDQkZDIiBzdHJva2Utd2lkdGg9IjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjx0ZXh0IHg9IjEyMCIgeT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VmlzdGEgQmFzaWNhIGRlIENhcm5ldDwvdGV4dD48L3N2Zz4=";
              }}
            />
          </div>
        ) : (
          <div className="text-center p-4 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" /> Vista previa del carnet no disponible.
            </p>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm font-medium text-gray-600 mb-1">Número de Carnet</p>
          <p className="font-mono text-lg font-bold text-blue-600">
            {professional.id_profesional_unico || 'Pendiente de asignación'}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-600">Fecha de validez:</span>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <p className={`font-medium ${isRenewalSoon ? 'text-orange-600' : 'text-green-600'}`}>
                {professional.fecha_caducidad || 'No especificado'}
              </p>
            </div>
          </div>

          {/* Bloque Días hasta Renovación */}
          {daysUntilRenewal !== null ? (
            <div>
              <span className="text-sm font-medium text-gray-600">Días hasta renovación:</span>
              <p className={`font-bold ${isRenewalSoon ? 'text-orange-600' : (daysUntilRenewal <= 0 ? 'text-red-600' : 'text-green-600')}`}>
                {daysUntilRenewal > 0 ? `${daysUntilRenewal} días` : 'Vencido'}
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Información de renovación no disponible.</div>
          )}
        </div>

        {/* Botón de descarga para el Carnet SVG */}
        {professional.url_carnet ? (
          <Button
            className="w-full flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            onClick={handleDownloadCarnet}
          >
            <Download className="w-4 h-4" />
            <span>Descargar Carnet (SVG)</span>
          </Button>
        ) : (
          <div className="text-center text-gray-500 text-sm p-2 bg-gray-100 rounded-md">
            <AlertTriangle className="inline w-4 h-4 mr-1 text-orange-500" /> Carnet no disponible para descarga.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfessionalCardInfo;
