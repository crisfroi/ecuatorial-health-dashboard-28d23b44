
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PDFSummary from './PDFSummary';

interface ConfirmationStepProps {
  formData: any;
  isSubmitting: boolean;
  solicitudEnviada?: boolean;
  errorEnvio?: string;
}

const ConfirmationStep = ({ formData, isSubmitting, solicitudEnviada = false, errorEnvio }: ConfirmationStepProps) => {
  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-guinea-teal mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Enviando solicitud...</h3>
        <p className="text-gray-600 text-center">
          Por favor espere mientras procesamos su solicitud.
        </p>
      </div>
    );
  }

  if (errorEnvio) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-red-600 mb-4">Error al enviar la solicitud</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-md">
          <p className="text-red-700 text-center">
            {errorEnvio}
          </p>
        </div>
        <p className="text-gray-600 text-center mb-4">
          Por favor, revise los datos e intente nuevamente.
        </p>
      </div>
    );
  }

  if (!solicitudEnviada) {
    return (
      <div className="space-y-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-amber-700">
              <AlertCircle className="w-5 h-5" />
              <span>Solicitud pendiente de envío</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 mb-4">
              Su solicitud aún no ha sido enviada. Para acceder a los documentos PDF, 
              debe completar el envío de la solicitud.
            </p>
            <div className="bg-amber-100 p-3 rounded border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Importante:</strong> Una vez enviada la solicitud, recibirá un código de expediente único 
                y podrá descargar los documentos correspondientes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Solicitud enviada exitosamente
  return (
    <div className="space-y-6">
      {/* Mensaje de éxito */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>¡Solicitud enviada exitosamente!</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-green-700">
              Su solicitud ha sido procesada correctamente y se le ha asignado el código de expediente:
            </p>
            <div className="bg-green-100 p-3 rounded border border-green-200 text-center">
              <span className="text-lg font-mono font-bold text-green-800">
                {formData.codigo_expediente}
              </span>
            </div>
            <p className="text-sm text-green-600">
              Guarde este código para futuras consultas sobre el estado de su solicitud.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Opciones de descarga */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-guinea-teal" />
            <span>Documentos disponibles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Ya puede descargar los siguientes documentos relacionados con su solicitud:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Resumen de Solicitud</h4>
              <p className="text-sm text-gray-600 mb-3">
                Documento completo con todos los datos de su solicitud.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Carta de Solicitud</h4>
              <p className="text-sm text-gray-600 mb-3">
                Documento oficial para presentar en el Ministerio.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Componente PDF para descarga */}
      <PDFSummary formData={formData} />

      {/* Información adicional */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 mb-2">Próximos pasos</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Su solicitud será revisada por el comité evaluador</li>
            <li>• Recibirá notificaciones sobre el estado de su solicitud</li>
            <li>• El proceso de evaluación puede tomar de 15 a 30 días hábiles</li>
            <li>• Conserve el código de expediente para consultas futuras</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmationStep;
