import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { CreditCard, Calendar, Download, User, AlertTriangle, CheckCircle } from 'lucide-react'; // Añadí AlertTriangle y CheckCircle para futuros estados, si se necesitan.
import { useToast } from '@/hooks/use-toast'; // Asumo que tienes este hook para notificaciones
import type { Profesional } from '@/hooks/useProfesionales';

interface ProfessionalCardInfoProps {
  professional: Profesional;
  daysUntilRenewal: number | null;
  isRenewalSoon: boolean;
}

const ProfessionalCardInfo = ({ professional, daysUntilRenewal, isRenewalSoon }: ProfessionalCardInfoProps) => {
  const { toast } = useToast(); // Inicializamos el hook de toast

  const handleDownloadCarnet = () => {
    if (!professional.url_carnet) {
      toast({
        title: "Carnet no disponible",
        description: "No hay una URL de carnet para descargar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = professional.url_carnet;
      // Define un nombre de archivo sugerido para la descarga
      link.download = `carnet-${professional.nombre_completo?.replace(/\s+/g, '-') || 'profesional'}.svg`;
      document.body.appendChild(link); // Necesario para Firefox
      link.click();
      document.body.removeChild(link); // Limpia el DOM

      toast({
        title: "Descarga iniciada",
        description: "El carnet profesional se está descargando.",
      });
    } catch (error) {
      console.error('Error al descargar el carnet:', error);
      toast({
        title: "Error en la descarga",
        description: "No se pudo iniciar la descarga del carnet.",
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
        {professional.url_carnet && (
          <div className="text-center p-2 border rounded-lg bg-gray-50">
            <p className="text-sm font-medium text-gray-600 mb-2">Vista Previa del Carnet</p>
            <img
              src={professional.url_carnet}
              alt="Carnet Profesional Completo"
              // Ajusta las clases para el tamaño deseado. max-w-full asegura que no se desborde.
              className="w-full h-auto max-w-xs object-contain mx-auto border rounded-md shadow-sm"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.alt = "Error al cargar el carnet";
                // SVG de placeholder si el carnet no carga.
                e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDI0MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI0MCIgaGVpZ2h0PSIxNTAiIHJ4PSI4IiBmaWxsPSIjRDBFNEZGIi8+PHBhdGggZD0iTTUwIDI1SDE5MHYxMDBINVNVMTAwIDUwIDUwIDI1Wk0xMjAgODVIMTUwTTkwIDg1SDEyME02MCA4NUg5ME0xMjAgMTExSDE1ME05MCAxMTFIMTIwTTYwIDExMUg5MCIgc3Ryb2tlPSIjM0Q2Q0JGQyIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48dGV4dCB4PSIxMjAiIHk9IjMwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlZpc3RhIEJhc2ljYSBkZSBDYXJuZXQ8L3RleHQ+PC9zdmc+";
              }}
            />
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
          
          {daysUntilRenewal !== null && (
            <div>
              <span className="text-sm font-medium text-gray-600">Días hasta renovación:</span>
              <p className={`font-bold ${isRenewalSoon ? 'text-orange-600' : 'text-green-600'}`}>
                {daysUntilRenewal > 0 ? `${daysUntilRenewal} días` : 'Vencido'}
              </p>
            </div>
          )}
        </div>

        {/* Botón de descarga para el Carnet SVG */}
        {professional.url_carnet ? ( // Mostrar el botón si hay una URL de carnet
          <Button 
            className="w-full flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            onClick={handleDownloadCarnet}
          >
            <Download className="w-4 h-4" />
            <span>Descargar Carnet (SVG)</span>
          </Button>
        ) : (
          // Opcional: un mensaje si el carnet no está disponible para descarga
          <div className="text-center text-gray-500 text-sm p-2 bg-gray-100 rounded-md">
            <AlertTriangle className="inline w-4 h-4 mr-1 text-orange-500" /> Carnet no disponible para descarga
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfessionalCardInfo;
