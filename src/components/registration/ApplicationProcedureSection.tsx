import React from 'react';
import { Banknote, FileText, Upload, Wallet } from 'lucide-react'; // Importa los íconos

// Este componente ahora solo contiene el CONTENIDO del procedimiento
const ApplicationProcedureContent = () => {
  return (
    <div className="space-y-6"> {/* Mantener el div para el espaciado general */}
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

      {/* --- Consideraciones Importantes --- */}
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
    </div>
  );
};

export default ApplicationProcedureContent; // Cambiamos el nombre para reflejar que es solo contenido
