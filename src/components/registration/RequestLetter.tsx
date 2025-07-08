import React from 'react'; // Eliminamos Button, Download, jsPDF, html2canvas
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Eliminamos: import { Download } from 'lucide-react';
// Eliminamos: import jsPDF from 'jspdf';
// Eliminamos: import html2canvas from 'html2canvas';

interface RequestLetterProps {
  formData: any;
  // Eliminamos onDownload, ya no se usa aquí directamente
}

const RequestLetter = ({ formData }: RequestLetterProps) => {
  // Eliminamos generatePDF
  // const generatePDF = async () => { ... };

  const today = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Carta de Instancia de Solicitud</span>
            {/* Eliminamos el botón de descarga aquí */}
            {/* <Button onClick={generatePDF} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Descargar Carta
            </Button> */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mantenemos el contenido que será capturado por html2canvas */}
          <div id="letter-content" className="max-w-[210mm] mx-auto bg-white" style={{ padding: '30mm', minHeight: '297mm', fontSize: '12px', lineHeight: '1.6' }}>
            
            {/* Membrete */}
            <div className="text-center mb-8">
              <h1 className="text-lg font-bold mb-2">REPÚBLICA DE GUINEA ECUATORIAL</h1>
              <h2 className="text-base font-semibold">MINISTERIO DE SANIDAD Y BIENESTAR SOCIAL</h2>
              <div className="border-b-2 border-black mt-4 mb-6"></div>
            </div>

            {/* Fecha y lugar */}
            <div className="text-right mb-8">
              <p>Malabo, {today}</p>
            </div>

            {/* Destinatario */}
            <div className="mb-6">
              <p className="font-semibold">AL SEÑOR MINISTRO DE SANIDAD Y BIENESTAR SOCIAL</p>
              <p>REPÚBLICA DE GUINEA ECUATORIAL</p>
              <p className="mt-2">
                <span className="font-semibold">ASUNTO:</span> Solicitud de Acreditación Profesional Sanitaria
              </p>
            </div>

            {/* Saludo */}
            <div className="mb-6">
              <p>Muy respetuosamente me dirijo a usted para lo siguiente:</p>
            </div>

            {/* Cuerpo de la carta */}
            <div className="mb-8 space-y-4 text-justify">
              <p>
                Yo, <span className="font-semibold">{formData.nombre} {formData.apellidos}</span>, 
                de nacionalidad <span className="font-semibold">{formData.nacionalidad}</span>, 
                con {formData.numero_dip ? `número de DIP ${formData.numero_dip}` : `número de pasaporte ${formData.numero_pasaporte}`}, 
                con domicilio en <span className="font-semibold">{formData.domicilio}, {formData.distrito}, {formData.provincia}</span>, 
                y teléfono de contacto <span className="font-semibold">{formData.telefono}</span>, 
                me presento ante usted con el debido respeto para solicitar formalmente la 
                <span className="font-semibold"> acreditación profesional sanitaria</span> correspondiente a mi área de especialización.
              </p>

              <p>
                Soy profesional en el área de <span className="font-semibold">{formData.area_profesional}</span>
                {formData.especialidad && (
                  <>, con especialización en <span className="font-semibold">{formData.especialidad}</span></>
                )}, 
                habiendo obtenido mi titulación de <span className="font-semibold">{formData.titulacion_especifica_1}</span> 
                en la institución <span className="font-semibold">{formData.institucion_1}</span> 
                en <span className="font-semibold">{formData.pais_formacion_1}</span>, 
                durante el período <span className="font-semibold">{formData.periodo_formacion}</span>.
              </p>

              <p>
                Actualmente, mi situación laboral es <span className="font-semibold">{formData.situacion_laboral}</span>
                {formData.nombre_centro && (
                  <>, prestando servicios en <span className="font-semibold">{formData.nombre_centro}</span> 
                  ({formData.categoria_centro}) en el sector <span className="font-semibold">{formData.tipo_sector}</span>
                  {formData.distrito_sanitario && (
                    <>, correspondiente al distrito sanitario de <span className="font-semibold">{formData.distrito_sanitario}</span></>
                  )}</>
                )}.
              </p>

              {formData.pertenece_brigada_medica && (
                <p>
                  Además, formo parte de una brigada médica de cooperación internacional, 
                  específicamente en el tipo de cooperación <span className="font-semibold">{formData.tipo_cooperacion}</span>, 
                  contribuyendo al fortalecimiento del sistema sanitario nacional y a la colaboración 
                  internacional en materia de salud.
                </p>
              )}

              <p>
                Mi formación académica en el campo de la salud y mi compromiso con el ejercicio ético y 
                profesional de la medicina me motivan a solicitar esta acreditación oficial, que me permitirá 
                continuar contribuyendo al desarrollo del sistema sanitario de Guinea Ecuatorial con la 
                debida autorización y reconocimiento profesional.
              </p>

              <p>
                Adjunto a la presente solicitud toda la documentación requerida para el proceso de evaluación, 
                incluyendo mis certificados académicos, documentos de identificación, fotografía tamaño carnet, 
                y cualquier otra documentación que el Ministerio considere necesaria para el procedimiento.
              </p>

              <p>
                Quedo a la espera de una respuesta favorable a mi solicitud y me comprometo a cumplir con 
                todos los requisitos y procedimientos establecidos por el Ministerio de Sanidad y Bienestar Social 
                para el ejercicio profesional en el territorio nacional.
              </p>
            </div>

            {/* Despedida */}
            <div className="mb-8">
              <p>Sin otro particular, aprovecho la oportunidad para expresarle las muestras de mi más alta consideración y estima.</p>
            </div>

            {/* Firma */}
            <div className="text-center">
              <p className="mb-12">Atentamente,</p>
              
              <div className="border-t border-black w-64 mx-auto mb-2"></div>
              <p className="font-semibold">{formData.nombre} {formData.apellidos}</p>
              <p className="text-sm">{formData.area_profesional}</p>
              <p className="text-sm">{formData.numero_dip ? `DIP: ${formData.numero_dip}` : `Pasaporte: ${formData.numero_pasaporte}`}</p>
              <p className="text-sm">Tel: {formData.telefono}</p>
            </div>

            {/* Pie de página */}
            <div className="mt-12 text-xs text-gray-600 text-center">
              <p>Solicitud generada el {today} através del Sistema RENAPROSA</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestLetter;
