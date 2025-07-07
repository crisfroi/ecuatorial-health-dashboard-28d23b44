import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Asegúrate de importar Button
import { CheckCircle, Banknote, FileText, Upload, Wallet, Download, Check } from 'lucide-react'; // Importa los íconos Download y Check

const ApplicationProcedureSection = () => {
  // Función para manejar la confirmación de entendimiento
  const handleUnderstandingConfirm = () => {
    alert('¡Gracias por confirmar! Has entendido el procedimiento.');
    // Aquí puedes añadir lógica adicional, como enviar un evento a Google Analytics,
    // cambiar el estado de un usuario, etc.
  };

  // Función para manejar la descarga del documento
  const handleDownloadGuide = () => {
    // URL de tu documento PDF, Word, etc.
    const downloadUrl = '/path/to/your/procedure_guide.pdf'; // <<< ¡IMPORTANTE: Cambia esta URL!
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', 'Guia_Procedimiento_Carnet_Profesional.pdf'); // Nombre del archivo al descargar
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('Se ha iniciado la descarga de la guía del procedimiento.');
    // Puedes añadir lógica para rastrear descargas aquí
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-2xl font-bold text-gray-800">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <span>Procedimiento de Solicitud: Carnet Profesional</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-gray-700 leading-relaxed">
          Para obtener tu **Carnet Profesional**, debes seguir dos fases clave: primero, realizar el pago de las tasas y honorarios en el banco, y luego, depositar toda la documentación requerida en la Delegación del Ministerio de Sanidad.
        </p>

        {/* --- Paso 1: Pago Bancario --- */}
        <div>
          <h3 className="flex items-center text-xl font-semibold text-blue-700 mb-3">
            <Banknote className="w-5 h-5 mr-2" />
            <span>Paso 1: Realización del Pago Bancario</span>
          </h3>
          <p className="text-gray-600 mb-2">
            Dirígete a cualquiera de las **entidades bancarias autorizadas** para efectuar el pago de las tasas y honorarios:
          </p>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>
              **Concepto de Pago:** Tasas (<strong>45.000 XAF</strong>), honorarios de servicios, impresión de carnet profesional y sello.
            </li>
            <li>
              **Modalidad:** Pago en **efectivo**.
            </li>
            <li>
              **Comprobante:** El banco emitirá un **comprobante de pago** a tu favor. Este documento es crucial; asegúrate de conservarlo.
            </li>
          </ul>
        </div>

        {/* --- Paso 2: Depósito de Documentación --- */}
        <div>
          <h3 className="flex items-center text-xl font-semibold text-blue-700 mb-3">
            <Upload className="w-5 h-5 mr-2" />
            <span>Paso 2: Depósito de la Documentación en la Delegación</span>
          </h3>
          <p className="text-gray-600 mb-2">
            Una vez realizado el pago, deposita tu expediente completo en la **Delegación Provincial o Regional del Ministerio de Sanidad** que te corresponda. Asegúrate de incluir:
          </p>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>
              **Comprobante de Pago:** El original emitido por el banco.
            </li>
            <li>
              **Formulario de Solicitud:** Una **copia** debidamente cumplimentada (el banco se quedará con el original).
            </li>
            <li>
              **Títulos Legalizados:** Copias autenticadas de todos tus títulos académicos.
            </li>
            <li>
              **Copia de Identificación:** Fotocopia legible de tu **Pasaporte** o **Documento de Identidad Personal (DIP)**.
            </li>
            <li>
              **Póliza:** Una (1) póliza de **1.500 XAF**.
            </li>
          </ul>
        </div>

        {/* --- Consideraciones Finales --- */}
        <div>
          <h3 className="flex items-center text-xl font-semibold text-blue-700 mb-3">
            <Wallet className="w-5 h-5 mr-2" />
            <span>Consideraciones Importantes</span>
          </h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Verifica que todos los documentos estén completos y sean legibles para evitar demoras en tu solicitud.</li>
            <li>Es recomendable guardar una copia de todos los documentos entregados para tu propio registro.</li>
            <li>Para cualquier duda, contacta directamente con la Delegación del Ministerio de Sanidad.</li>
          </ul>
        </div>

        ---

        {/* --- Botones de Acción --- */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-4 border-t border-gray-200">
          <Button
            onClick={handleUnderstandingConfirm}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-md transition-colors duration-200"
          >
            <Check className="w-5 h-5" />
            Confirmar Entendimiento
          </Button>
          <Button
            onClick={handleDownloadGuide}
            variant="outline" // Usa la variante outline para diferenciarlo
            className="flex items-center gap-2 px-6 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-semibold rounded-md shadow-md transition-colors duration-200"
          >
            <Download className="w-5 h-5" />
            Descargar Guía del Procedimiento
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationProcedureSection;
