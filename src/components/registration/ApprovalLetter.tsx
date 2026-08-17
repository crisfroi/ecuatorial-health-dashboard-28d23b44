import React from "react";
// Importar el tipo Profesional actualizado
import type { Profesional } from '@/hooks/useProfesionales'; 

interface ApprovalLetterProps {
  professional: Profesional; // Usamos el tipo Profesional
  documentDate: string; // Usamos la fecha calculada y fija
}

// Renombrado de formData a professional para consistencia con el hook
const ApprovalLetter = ({ professional, documentDate }: ApprovalLetterProps) => {

  // La variable 'today' se reemplaza por 'documentDate'

  return (
    // ID esencial para la captura con html2canvas
    <div 
      id="approval-letter-content-capture-target"
      className="bg-white"
      style={{
        fontSize: "11px",
        lineHeight: "1.4",
        width: '210mm', // Aseguramos el ancho A4 para la captura
        minHeight: '297mm', // Aseguramos la altura A4 para la captura
      }}
    >
      {/* Membrete Oficial */}
      <div className="mb-4">
        <div className="flex justify-between items-start">
          {/* Logo en esquina superior izquierda */}
          <div className="flex-shrink-0 -mt-2">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F696aeb7245c24fa8957a85fb78836206%2F9f0f84e2fe5c4ac7bf20d675db3ea3cc?format=webp&width=800"
              alt="Guinea Ecuatorial Salud"
              className="h-16 w-auto"
            />
          </div>
          <div className="flex-1 text-right">
            <h1 className="text-lg font-bold mb-2 text-center">
              REPÚBLICA DE GUINEA ECUATORIAL
            </h1>
            <h2 className="text-base font-semibold text-center">
              MINISTERIO DE SANIDAD Y BIENESTAR SOCIAL
            </h2>
            <h3 className="text-sm font-medium text-center">
              DIRECCIÓN GENERAL DE RECURSOS HUMANOS
            </h3>
          </div>
        </div>
        <div className="border-b-2 border-black mt-4 mb-3"></div>
      </div>

      {/* Fecha y lugar */}
      <div className="text-right mb-4">
        {/* Usamos documentDate en lugar de today */}
        <p>{professional.distrito || "Malabo"}, {documentDate}</p> 
      </div>

      {/* Número de expediente */}
      <div className="mb-3">
        <p className="font-semibold">
          EXPEDIENTE: {professional.codigo_expediente}
        </p>
        <p className="font-semibold">
          ASUNTO: Aprobación de Acreditación Profesional Sanitaria
        </p>
      </div>

      {/* Cuerpo de la carta */}
      <div className="mb-4 space-y-3 text-justify">
        <p className="font-semibold text-center mb-4">
          RESOLUCIÓN MINISTERIAL DE ACREDITACIÓN PROFESIONAL
        </p>

        <p>
          En virtud de las atribuciones conferidas por la Ley de Ejercicio
          Profesional de las Ciencias de la Salud de la República de Guinea
          Ecuatorial, y tras el análisis y evaluación exhaustiva de la
          documentación presentada por {professional.genero === "Femenino" ? "la" : "el"} solicitante:
        </p>

        <div className="bg-gray-50 p-4" style={{borderLeft: "4px solid #14b8a6"}}>
          {/* Usamos el objeto professional */}
          <p>
            <strong>Nombre Completo:</strong> {professional.nombre}{" "}
            {professional.apellidos}
          </p>
          <p>
            <strong>Nacionalidad:</strong> {professional.nacionalidad}
          </p>
          <p>
            <strong>Documento de Identidad:</strong>{" "}
            {professional.numero_dip
              ? `DIP: ${professional.numero_dip}`
              : `Pasaporte: ${professional.numero_pasaporte}`}
          </p>
          <p>
            <strong>Área Profesional:</strong> {professional.area_profesional}
          </p>
          <p>
            <strong>Especialidad:</strong>{" "}
            {professional.especialidad || "No especificada"}
          </p>
          <p>
            <strong>Titulación:</strong>{" "}
            {professional.titulacion_especifica_1}
          </p>
          <p>
            <strong>Institución de Formación:</strong>{" "}
            {professional.institucion_1}
          </p>
          <p>
            <strong>País de Formación:</strong>{" "}
            {professional.pais_formacion_1}
          </p>
          {professional.funcion_publica && (
            <>
              <p>
                <strong>Condición Laboral:</strong> {professional.estatus_funcionario === 'nombrado' ? 'Funcionario Público Nombrado del Sistema Sanitario Nacional' : 'Personal Contratado del Sector Público Sanitario'}
              </p>
              {professional.estatus_funcionario === 'nombrado' && professional.fecha_nombramiento && (
                <p>
                  <strong>Fecha de Nombramiento Oficial:</strong>{" "}
                  {new Date(professional.fecha_nombramiento).toLocaleDateString('es-ES')}
                </p>
              )}
              {professional.numero_funcionario && (
                <p>
                  <strong>Número de Registro de Funcionario:</strong> {professional.numero_funcionario}
                </p>
              )}
              {professional.estatus_funcionario === 'no_nombrado' && (
                <p>
                  <strong>Régimen de Contratación:</strong> Temporal - Sector Público
                </p>
              )}
            </>
          )}
        </div>

        <p>
          <strong>RESUELVO:</strong>
        </p>

        <p>
          <strong>PRIMERO:</strong> APROBAR la solicitud de acreditación
          profesional sanitaria presentada por
          {professional.genero === "Femenino" ? " la señora " : " el señor "}
          <span className="font-semibold">
            {professional.nombre} {professional.apellidos}
          </span>
          , reconociendo su competencia profesional en el área de{" "}
          <span className="font-semibold">
            {professional.area_profesional}
          </span>
          .
        </p>

        <p>
          <strong>SEGUNDO:</strong> AUTORIZAR el ejercicio profesional en el
          territorio nacional de Guinea Ecuatorial, con todas las
          responsabilidades y derechos que ello conlleva, en estricto
          cumplimiento del código deontológico de su profesión
          {professional.funcion_publica && professional.estatus_funcionario === 'nombrado' && (
            <>, del régimen estatutario del funcionario público de carrera del sistema sanitario nacional, y de las obligaciones inherentes a su condición de servidor público nombrado</>
          )}
          {professional.funcion_publica && professional.estatus_funcionario === 'no_nombrado' && (
            <>, del marco regulatorio del personal contratado del sector público sanitario, conforme a la normativa laboral vigente</>
          )}.
        </p>

        <p>
          <strong>TERCERO:</strong> OTORGAR el número de carnet profesional{" "}
          <span className="font-semibold">{professional.id_profesional_unico || professional.codigo_expediente}</span>, el cual será emitido por la
          Dirección General de Recursos Humanos del Ministerio de Sanidad y
          Bienestar Social.
        </p>

        <p>
          <strong>CUARTO:</strong> Esta acreditación tendrá una validez de
          365 días a partir de la fecha de emisión, sujeta a las renovaciones
          periódicas establecidas por la normativa vigente y al cumplimiento
          de los requisitos de formación continuada.
        </p>

        <p>
          <strong>QUINTO:</strong> Notifíquese la presente resolución al
          interesado y procédase a su inscripción en el Registro Nacional de
          Profesionales Sanitarios Acreditados (RENAPROSA).
        </p>

        <p>
          Esta resolución será efectiva a partir de la fecha de su firma y
          podrá ser impugnada ante la jurisdicción
          contencioso-administrativa en el plazo establecido por la ley.
        </p>
      </div>

      {/* Firmas y sellos */}
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div className="text-center">
          <div className="border-t border-black w-48 mx-auto mb-2 mt-16"></div>
          <p className="font-semibold">DIRECTOR GENERAL</p>
          <p className="text-sm">Recursos Humanos Sanitarios</p>
        </div>

        <div className="text-center">
          <div className="border-t border-black w-48 mx-auto mb-2 mt-16"></div>
          <p className="font-semibold">MINISTRO DE SANIDAD</p>
          <p className="font-semibold">Y BIENESTAR SOCIAL</p>
          <p className="text-sm">República de Guinea Ecuatorial</p>
        </div>
      </div>

      {(selloProfesional || selloExpediente) && (
        <div className="mt-6 flex items-start justify-center gap-12">
          <SelloDisplay sello={selloExpediente} titulo="Sello de expediente" compact size={100} />
          <SelloDisplay sello={selloProfesional} titulo="Sello profesional" compact size={100} />
        </div>
      )}


      {/* Pie de página */}
      <div className="mt-8 text-xs text-gray-600 text-center border-t pt-4">
        <p>
          Ministerio de Sanidad y Bienestar Social - República de Guinea
          Ecuatorial
        </p>
        <p>Dirección General de Recursos Humanos - Sistema RENAPROSA</p>
        {/* Usamos documentDate en lugar de today */}
        <p>Generado el {documentDate}</p> 
      </div>
    </div>
  );
};

export default ApprovalLetter;
