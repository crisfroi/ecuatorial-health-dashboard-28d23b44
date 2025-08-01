import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Download, 
  RefreshCw,
  FileImage
} from "lucide-react";
import { useGenerateCarnet } from "@/hooks/useGenerateCarnet";

interface CarnetGenerationStatusProps {
  profesionalId: string;
  estadoSolicitud: string;
  urlCarnet?: string;
  nombreCompleto?: string;
}

const CarnetGenerationStatus = ({
  profesionalId,
  estadoSolicitud,
  urlCarnet,
  nombreCompleto
}: CarnetGenerationStatusProps) => {
  const generateCarnet = useGenerateCarnet();

  const handleGenerateCarnet = () => {
    generateCarnet.mutate(profesionalId);
  };

  const handleDownloadCarnet = () => {
    if (urlCarnet) {
      window.open(urlCarnet, '_blank');
    }
  };

  // Solo mostrar el componente si el estado es "Pendiente de Firma" o "Aprobado"
  if (!["Pendiente de Firma", "Aprobado"].includes(estadoSolicitud)) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileImage className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900">
                Carnet Profesional
              </h4>
              <p className="text-xs text-blue-700">
                {nombreCompleto || `Profesional ${profesionalId}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Estado de generación */}
            {generateCarnet.isPending && (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  Generando...
                </Badge>
              </div>
            )}

            {urlCarnet && !generateCarnet.isPending && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <Badge className="bg-green-100 text-green-800">
                  Disponible
                </Badge>
              </div>
            )}

            {!urlCarnet && !generateCarnet.isPending && estadoSolicitud === "Pendiente de Firma" && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                  Pendiente
                </Badge>
              </div>
            )}

            {generateCarnet.isError && (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <Badge variant="outline" className="text-red-700 border-red-300">
                  Error
                </Badge>
              </div>
            )}

            {/* Botones de acción */}
            {urlCarnet ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadCarnet}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <Download className="w-3 h-3 mr-1" />
                Descargar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateCarnet}
                disabled={generateCarnet.isPending}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                {generateCarnet.isPending ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileImage className="w-3 h-3 mr-1" />
                    Generar Carnet
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Mensaje de error */}
        {generateCarnet.isError && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-xs text-red-700">
                Error al generar carnet. Puede intentar nuevamente o contactar soporte.
              </p>
            </div>
          </div>
        )}

        {/* Mensaje de éxito */}
        {generateCarnet.isSuccess && urlCarnet && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-700">
                Carnet generado exitosamente y listo para descarga.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CarnetGenerationStatus;
