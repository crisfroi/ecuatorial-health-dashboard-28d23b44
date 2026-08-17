import React from "react";
import type { Profesional } from '@/hooks/useProfesionales';
import { useSelloProfesional, useSelloExpediente } from '@/hooks/useSellos';
import SelloDisplay from '@/components/registration/SelloDisplay';

interface ApprovalLetterProps {
  professional?: Profesional | null;
  formData?: Partial<Profesional> | null;
  documentDate?: string;
}

const ApprovalLetter = ({ professional, formData, documentDate }: ApprovalLetterProps) => {
  const source = professional || formData;
  if (!source) return null;
  const p = source as Profesional;
  const safeId = p.id || undefined;
  const resolvedDocumentDate = documentDate || (p.fecha_generacion_resolucion
    ? new Date(p.fecha_generacion_resolucion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }));
  const { data: selloProfesional } = useSelloProfesional(safeId, p.id_profesional_unico);
  const { data: selloExpediente } = useSelloExpediente(safeId, (p as any).codigo_expediente);

  return (
    <div id="approval-letter-content-capture-target" className="bg-white" style={{ fontSize: "11px", lineHeight: "1.4", width: '210mm', minHeight: '297mm' }}>
      <div className="mb-4">
        <div className="flex justify-between items-start">
          <div className="flex-shrink-0 -mt-2">
            <img src="https://cdn.builder.io/api/v1/image/assets%2F696aeb7245c24fa8957a85fb78836206%2F9f0f84e2fe5c4ac7bf20d675db3ea3cc?format=webp&width=800" alt="Guinea Ecuatorial Salud" className="h-16 w-auto" />
          </div>
          <div className="flex-1 text-right">
            <h1 className="text-lg font-bold mb-2 text-center">REPÚBLICA DE GUINEA ECUATORIAL</h1>
            <h2 className="text-base font-semibold text-center">MINISTERIO DE SANIDAD Y BIENESTAR SOCIAL</h2>
            <h3 className="text-sm font-medium text-center">DIRECCIÓN GENERAL DE RECURSOS HUMANOS</h3>
          </div>
        </div>
        <div className="border-b-2 border-black mt-4 mb-3"></div>
      </div>

      <div className="text-right mb-4"><p>{p.distrito || "Malabo"}, {resolvedDocumentDate}</p></div>
      <div className="mb-3">
        <p className="font-semibold">EXPEDIENTE: {p.codigo_expediente || '—'}</p>
        <p className="font-semibold">ASUNTO: Aprobación de Acreditación Profesional Sanitaria</p>
      </div>

      <div className="mb-4 space-y-3 text-justify">
        <p className="font-semibold text-center mb-4">RESOLUCIÓN MINISTERIAL DE ACREDITACIÓN PROFESIONAL</p>
        <p>En virtud de las atribuciones conferidas por la Ley de Ejercicio Profesional de las Ciencias de la Salud de la República de Guinea Ecuatorial, y tras el análisis y evaluación exhaustiva de la documentación presentada por {p.genero === "Femenino" ? "la" : "el"} solicitante:</p>

        <div className="bg-gray-50 p-4" style={{borderLeft: "4px solid #14b8a6"}}>
          <p><strong>Nombre Completo:</strong> {p.nombre} {p.apellidos}</p>
          <p><strong>Nacionalidad:</strong> {p.nacionalidad}</p>
          <p><strong>Documento de Identidad:</strong> {p.numero_dip ? `DIP: ${p.numero_dip}` : `Pasaporte: ${p.numero_pasaporte || '—'}`}</p>
          <p><strong>Área Profesional:</strong> {p.area_profesional}</p>
          <p><strong>Especialidad:</strong> {p.especialidad || "No especificada"}</p>
          <p><strong>Titulación:</strong> {p.titulacion_especifica_1}</p>
          <p><strong>Institución de Formación:</strong> {p.institucion_1}</p>
          <p><strong>País de Formación:</strong> {p.pais_formacion_1}</p>
          {p.funcion_publica && (
            <>
              <p><strong>Condición Laboral:</strong> {p.estatus_funcionario === 'nombrado' ? 'Funcionario Público Nombrado del Sistema Sanitario Nacional' : 'Personal Contratado del Sector Público Sanitario'}</p>
              {p.estatus_funcionario === 'nombrado' && p.fecha_nombramiento && <p><strong>Fecha de Nombramiento Oficial:</strong> {new Date(p.fecha_nombramiento).toLocaleDateString('es-ES')}</p>}
              {p.numero_funcionario && <p><strong>Número de Registro de Funcionario:</strong> {p.numero_funcionario}</p>}
              {p.estatus_funcionario === 'no_nombrado' && <p><strong>Régimen de Contratación:</strong> Temporal - Sector Público</p>}
            </>
          )}
        </div>

        <p><strong>RESUELVO:</strong></p>
        <p><strong>PRIMERO:</strong> APROBAR la solicitud de acreditación profesional sanitaria presentada por {p.genero === "Femenino" ? " la señora " : " el señor "}<span className="font-semibold">{p.nombre} {p.apellidos}</span>, reconociendo su competencia profesional en el área de <span className="font-semibold">{p.area_profesional}</span>.</p>
        <p><strong>SEGUNDO:</strong> AUTORIZAR el ejercicio profesional en el territorio nacional de Guinea Ecuatorial, con todas las responsabilidades y derechos que ello conlleva, en estricto cumplimiento del código deontológico de su profesión{p.funcion_publica && p.estatus_funcionario === 'nombrado' && (<>, del régimen estatutario del funcionario público de carrera del sistema sanitario nacional, y de las obligaciones inherentes a su condición de servidor público nombrado</>)}{p.funcion_publica && p.estatus_funcionario === 'no_nombrado' && (<>, del marco regulatorio del personal contratado del sector público sanitario, conforme a la normativa laboral vigente</>)}.</p>
        <p><strong>TERCERO:</strong> OTORGAR el número de carnet profesional <span className="font-semibold">{p.id_profesional_unico || p.codigo_expediente || '—'}</span>, el cual será emitido por la Dirección General de Recursos Humanos del Ministerio de Sanidad y Bienestar Social.</p>
        <p><strong>CUARTO:</strong> Esta acreditación tendrá una validez de 365 días a partir de la fecha de emisión, sujeta a las renovaciones periódicas establecidas por la normativa vigente y al cumplimiento de los requisitos de formación continuada.</p>
        <p><strong>QUINTO:</strong> Notifíquese la presente resolución al interesado y procédase a su inscripción en el Registro Nacional de Profesionales Sanitarios Acreditados (RENAPROSA).</p>
        <p>Esta resolución será efectiva a partir de la fecha de su firma y podrá ser impugnada ante la jurisdicción contencioso-administrativa en el plazo establecido por la ley.</p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-8">
        <div className="text-center"><div className="border-t border-black w-48 mx-auto mb-2 mt-16"></div><p className="font-semibold">DIRECTOR GENERAL</p><p className="text-sm">Recursos Humanos Sanitarios</p></div>
        <div className="text-center"><div className="border-t border-black w-48 mx-auto mb-2 mt-16"></div><p className="font-semibold">MINISTRO DE SANIDAD</p><p className="font-semibold">Y BIENESTAR SOCIAL</p><p className="text-sm">República de Guinea Ecuatorial</p></div>
      </div>

      {(selloProfesional || selloExpediente) && (
        <div className="mt-6 flex items-start justify-center gap-12">
          <SelloDisplay sello={selloExpediente} titulo="Sello de expediente" compact size={100} />
          <SelloDisplay sello={selloProfesional} titulo="Sello profesional" compact size={100} />
        </div>
      )}

      <div className="mt-8 text-xs text-gray-600 text-center border-t pt-4">
        <p>Ministerio de Sanidad y Bienestar Social - República de Guinea Ecuatorial</p>
        <p>Dirección General de Recursos Humanos - Sistema RENAPROSA</p>
        <p>Generado el {resolvedDocumentDate}</p>
      </div>
    </div>
  );
};

export default ApprovalLetter;
