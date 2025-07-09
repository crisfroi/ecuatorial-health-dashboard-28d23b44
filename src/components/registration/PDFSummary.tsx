import React from 'react';
import { BarcodeGenerator } from '@/components/BarcodeGenerator'; // Importa ang iyong BarcodeGenerator component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Ipinapalagay na ginagamit mo ang mga UI component na ito

interface PDFSummaryProps {
  formData: any; // Ang data ng buong form
}

const PDFSummary: React.FC<PDFSummaryProps> = ({ formData }) => {
  // Siguraduhin na ang formData.codigo_expediente ay umiiral bago subukang gamitin ito
  const codigoExpediente = formData?.codigo_expediente;
  const fotoCarnetUrl = formData?.foto_carnet; // Ang URL ng larawang na-upload sa Supabase
  const documentosAdicionalesUrls = formData?.documentos_adicionales_urls || []; // Mga URL ng karagdagang dokumento

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto my-8">
      <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">Resumen de Solicitud</h1>
      <p className="text-center text-gray-600 mb-8">
        Dito mo maaaring suriin ang lahat ng data ng iyong aplikasyon bago magtapos.
      </p>

      {/* Seksyon ng Código de Expediente at Barcode */}
      {codigoExpediente && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Código de Expediente</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-2xl font-mono font-bold text-blue-700 mb-4">{codigoExpediente}</p>
            <div className="flex justify-center">
              {/* Ginagamit ang iyong BarcodeGenerator dito, ipinapasa ang codigoExpediente */}
              <BarcodeGenerator code={codigoExpediente} width={250} height={80} className="border p-2 rounded" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Ito ang iyong natatanging identifier ng aplikasyon.</p>
          </CardContent>
        </Card>
      )}

      {/* Personal Data */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Datos Personales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <p><strong>Nombre Completo:</strong> {formData.nombre_completo}</p>
          <p><strong>Género:</strong> {formData.genero}</p>
          <p><strong>Fecha de Nacimiento:</strong> {formData.fecha_nacimiento}</p>
          <p><strong>Edad:</strong> {formData.edad} años</p>
          <p><strong>Nacionalidad:</strong> {formData.nacionalidad}</p>
          {formData.numero_dip && <p><strong>Número DIP:</strong> {formData.numero_dip}</p>}
          {formData.numero_pasaporte && <p><strong>Número Pasaporte:</strong> {formData.numero_pasaporte}</p>}
          <p><strong>Teléfono:</strong> {formData.telefono}</p>
        </CardContent>
      </Card>

      {/* Address */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Domicilio</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <p><strong>Domicilio:</strong> {formData.domicilio}</p>
          <p><strong>Provincia:</strong> {formData.provincia}</p>
          <p><strong>Distrito:</strong> {formData.distrito}</p>
        </CardContent>
      </Card>

      {/* Education */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Formación</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <p><strong>Área Profesional:</strong> {formData.area_profesional}</p>
          {formData.especialidad && <p><strong>Especialidad:</strong> {formData.especialidad}</p>}
          <p><strong>Categoría Titulación:</strong> {formData.categoria_titulacion}</p>
          <p><strong>Titulación Específica:</strong> {formData.titulacion_especifica_1}</p>
          <p><strong>Institución:</strong> {formData.institucion_1}</p>
          <p><strong>Período de Formación:</strong> {formData.periodo_formacion}</p>
          <p><strong>País de Formación:</strong> {formData.pais_formacion_1}</p>
        </CardContent>
      </Card>

      {/* Work Situation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Situación Laboral</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <p><strong>Situación Laboral:</strong> {formData.situacion_laboral}</p>
          {formData.nombre_centro && <p><strong>Nombre del Centro:</strong> {formData.nombre_centro}</p>}
          {formData.categoria_centro && <p><strong>Categoría del Centro:</strong> {formData.categoria_centro}</p>}
          {formData.tipo_sector && <p><strong>Tipo de Sector:</strong> {formData.tipo_sector}</p>}
          {formData.distrito_sanitario && <p><strong>Distrito Sanitario:</strong> {formData.distrito_sanitario}</p>}
          <p><strong>Pertenece a Brigada Médica:</strong> {formData.pertenece_brigada_medica ? 'Sí' : 'No'}</p>
          {formData.tipo_cooperacion && <p><strong>Tipo de Cooperación:</strong> {formData.tipo_cooperacion}</p>}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Documentos</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-700">
          <p className="mb-3"><strong>Foto de Carnet:</strong></p>
          {fotoCarnetUrl ? (
            <img src={fotoCarnetUrl} alt="Foto de Carnet" className="max-w-[150px] max-h-[150px] rounded-md shadow-sm mb-4" />
          ) : (
            <p className="text-red-500">Hindi na-load ang larawan ng ID.</p>
          )}

          <p className="mb-3 mt-4"><strong>Karagdagang Dokumento:</strong></p>
          {documentosAdicionalesUrls.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {documentosAdicionalesUrls.map((url: string, index: number) => (
                <li key={index}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Dokumento {index + 1}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>Walang karagdagang dokumento na nakalakip.</p>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-gray-500 text-sm mt-8">
        Pagtanggap ng mga patakaran: {formData.acepta_politicas ? 'Oo' : 'Hindi'}
      </p>
    </div>
  );
};

export default PDFSummary;
