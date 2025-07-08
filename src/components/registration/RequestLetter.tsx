import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RequestLetterProps {
  formData: any;
}

const RequestLetter = ({ formData }: RequestLetterProps) => {
  const today = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-4"> {/* Reducido space-y-6 a space-y-4 */}
      <Card>
        <CardHeader className="py-3 px-4"> {/* Reducido padding */}
          <CardTitle className="flex items-center justify-between text-base"> {/* Reducido text-lg a text-base */}
            <span>Carta de Instancia de Solicitud</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 px-4 pb-4"> {/* Reducido padding */}
          {/* Ajuste de padding para reducir el espacio superior y general */}
          <div id="letter-content" className="max-w-[210mm] mx-auto bg-white" style={{ padding: '15mm 20mm', minHeight: '297mm', fontSize: '10.5px', lineHeight: '1.4' }}> {/* Ajustado padding de 20mm 25mm a 15mm 20mm, fontSize a 10.5px, lineHeight a 1.4 */}
            
            {/* Membrete */}
            <div className="text-center mb-4 mt-0"> {/* Reducido mb-6 a mb-4 */}
              <h className="text-sm font-semibold">CARTA DE INSTANCIA DE SOLICITUD DE REGISTRO DE PRODESIONAL SANITARIO</h2> {/* Reducido text-base a text-sm */}
              <div className="border-b-2 border-black mt-2 mb-3"></div> {/* Reducido mt-3 mb-4 a mt-2 mb-3 */}
            </div>

            {/* Fecha y lugar */}
            <div className="text-right mb-4"> {/* Reducido mb-6 a mb-4 */}
              <p className="text-sm">Malabo, {today}</p> {/* Reducido text-base a text-sm */}
            </div>

            {/* Destinatario */}
            <div className="mb-3"> {/* Reducido mb-4 a mb-3 */}
              <p className="font-semibold text-sm">AL SEÑOR MINISTRO DE SANIDAD Y BIENESTAR SOCIAL</p> {/* Reducido text-base a text-sm */}
              <p className="text-sm">REPÚBLICA DE GUINEA ECUATORIAL</p>
              <p className="mt-0.5 text-sm"> {/* Reducido mt-1 a mt-0.5 */}
                <span className="font-semibold">ASUNTO:</span> Solicitud de Acreditación Profesional Sanitaria
              </p>
            </div>

            {/* Saludo */}
            <div className="mb-3"> {/* Reducido mb-4 a mb-3 */}
              <p className="text-sm">Muy respetuosamente me dirijo a usted para lo siguiente:</p> {/* Reducido text-base a text-sm */}
            </div>

            {/* Cuerpo de la carta */}
            <div className="mb-5 space-y-2.5 text-justify"> {/* Reducido mb-6 a mb-5, space-y-3 a space-y-2.5 */}
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
            <div className="mb-12"> {/* Reducido mb-6 a mb-5 */}
              <p className="text-sm">Sin otro particular, aprovecho la oportunidad para expresarle las muestras de mi más alta consideración y estima.</p> {/* Reducido text-base a text-sm */}
            </div>

            {/* Firma */}
            <div className="text-center">
              <p className="mb-8 text-sm">Atentamente,</p> {/* Reducido mb-10 a mb-8, text-base a text-sm */}
              
              <div className="border-t border-black w-60 mx-auto mb-1"></div> {/* Reducido w-64 a w-60 */}
              <p className="font-semibold text-sm">{formData.nombre} {formData.apellidos}</p>
              <p className="text-xs">{formData.area_profesional}</p>
              <p className="text-xs">{formData.numero_dip ? `DIP: ${formData.numero_dip}` : `Pasaporte: ${formData.numero_pasaporte}`}</p>
              <p className="text-xs">Tel: {formData.telefono}</p>
            </div>

            {/* Pie de página */}
            <div className="mt-8 text-xs text-gray-600 text-center"> {/* Reducido mt-8 a mt-6 */}
              <p>Solicitud generada el {today} através del Sistema RENAPROSA</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestLetter;
