import React from 'react';

type FuncionarioStatus = 'nombrado' | 'no_nombrado';
type NullableString = string | null | undefined;

type TipoSolicitud = 'REGISTRO' | 'RENOVACION' | 'EXTRAVIO' | 'DETERIORO' | 'ACTUALIZACION' | 'DUPLICADO' | string;

interface RequestLetterData {
  nombre: string;
  apellidos: string;
  nacionalidad: string;
  numero_dip?: NullableString;
  numero_pasaporte?: NullableString;
  domicilio?: NullableString;
  distrito?: NullableString;
  provincia?: NullableString;
  telefono?: NullableString;
  area_profesional?: NullableString;
  especialidad?: NullableString;
  titulacion_especifica_1?: NullableString;
  institucion_1?: NullableString;
  pais_formacion_1?: NullableString;
  periodo_formacion?: NullableString;
  situacion_laboral?: NullableString;
  funcion_publica?: boolean | null;
  estatus_funcionario?: FuncionarioStatus | null;
  numero_funcionario?: NullableString;
  fecha_nombramiento?: NullableString;
  fecha_inicio_trabajo?: NullableString;
  nombre_centro?: NullableString;
  categoria_centro?: NullableString;
  tipo_sector?: NullableString;
  distrito_sanitario?: NullableString;
  pertenece_brigada_medica?: boolean | null;
  tipo_cooperacion?: NullableString;
  tipo_solicitud?: TipoSolicitud | null;
  codigo_expediente?: NullableString;
  sello_expediente_url?: NullableString;
}

interface RequestLetterProps { formData: RequestLetterData; }

const normalizeTipo = (value?: NullableString): TipoSolicitud => {
  const raw = String(value || 'REGISTRO').trim().toUpperCase();
  if (raw.includes('RENOV')) return 'RENOVACION';
  if (raw.includes('EXTRAV')) return 'EXTRAVIO';
  if (raw.includes('DETER')) return 'DETERIORO';
  if (raw.includes('DUPLIC')) return 'DUPLICADO';
  if (raw.includes('ACTUAL')) return 'ACTUALIZACION';
  return 'REGISTRO';
};

const tipoLabel = (tipo: TipoSolicitud) => ({
  REGISTRO: 'Registro inicial de acreditación profesional sanitaria',
  RENOVACION: 'Renovación de acreditación profesional sanitaria',
  EXTRAVIO: 'Solicitud de duplicado por extravío del documento profesional',
  DETERIORO: 'Solicitud de duplicado por deterioro del documento profesional',
  DUPLICADO: 'Solicitud de duplicado de acreditación profesional sanitaria',
  ACTUALIZACION: 'Actualización de datos de acreditación profesional sanitaria',
}[tipo as keyof Record<string, string>] || 'Solicitud de acreditación profesional sanitaria');

const purposeText = (tipo: TipoSolicitud) => {
  switch (tipo) {
    case 'RENOVACION': return 'la renovación de mi acreditación profesional sanitaria';
    case 'EXTRAVIO': return 'la expedición de un duplicado de mi acreditación profesional sanitaria por extravío';
    case 'DETERIORO': return 'la expedición de un duplicado de mi acreditación profesional sanitaria por deterioro';
    case 'DUPLICADO': return 'la expedición de un duplicado de mi acreditación profesional sanitaria';
    case 'ACTUALIZACION': return 'la actualización de mis datos de acreditación profesional sanitaria';
    default: return 'mi acreditación profesional sanitaria';
  }
};

const formatDateLong = (value?: NullableString) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
};

const removeDiacritics = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getCenterArticle = (category?: NullableString) => {
  if (!category) return null;
  const normalized = removeDiacritics(category).toUpperCase().trim();
  if (new Set(['CLINICA', 'CLINICAS', 'FARMACIA', 'FARMACIAS']).has(normalized)) return 'la';
  if (new Set(['CONSULTORIO', 'CONSULTORIOS', 'HOSPITAL', 'HOSPITALES', 'CENTRO DE SALUD', 'CENTROS DE SALUD', 'LABORATORIO', 'LABORATORIOS']).has(normalized)) return 'el';
  return null;
};

const RequestLetter = ({ formData }: RequestLetterProps) => {
  const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const tipo = normalizeTipo(formData.tipo_solicitud);
  const nombramientoDate = formatDateLong(formData.fecha_nombramiento);
  const inicioTrabajoDate = formatDateLong(formData.fecha_inicio_trabajo);
  const centerArticle = getCenterArticle(formData.categoria_centro);
  const identificacion = formData.numero_dip ? `número de DIP ${formData.numero_dip}` : formData.numero_pasaporte ? `número de pasaporte ${formData.numero_pasaporte}` : 'documento de identificación vigente';

  return (
    <div className="space-y-4">
      <div id="letter-content" className="max-w-[210mm] mx-auto bg-white" style={{ padding: '15mm 20mm', minHeight: '297mm', fontSize: '10.5px', lineHeight: '1.4' }}>
        <div className="text-center mb-4">
          <h1 className="text-base font-bold mb-0.5">REPÚBLICA DE GUINEA ECUATORIAL</h1>
          <h2 className="text-sm font-semibold">MINISTERIO DE SANIDAD Y BIENESTAR SOCIAL</h2>
          <div className="border-b-2 border-black mt-2 mb-3" />
          <div className="inline-block border border-gray-400 px-3 py-1 mt-1 text-xs font-bold">EXPEDIENTE: {formData.codigo_expediente || 'PENDIENTE'}</div>
        </div>

        <div className="text-right mb-4"><p className="text-sm">Malabo, {today}</p></div>

        <div className="mb-3">
          <p className="font-semibold text-sm">AL SEÑOR MINISTRO DE SANIDAD Y BIENESTAR SOCIAL</p>
          <p className="text-sm">REPÚBLICA DE GUINEA ECUATORIAL</p>
          <p className="mt-0.5 text-sm"><span className="font-semibold">ASUNTO:</span> {tipoLabel(tipo)}</p>
        </div>

        <div className="mb-5 space-y-2.5 text-justify">
          <p>Yo, <span className="font-semibold">{formData.nombre} {formData.apellidos}</span>, de nacionalidad <span className="font-semibold">{formData.nacionalidad}</span>, con {identificacion}, con domicilio en <span className="font-semibold">{formData.domicilio}{formData.distrito ? `, ${formData.distrito}` : ''}{formData.provincia ? `, ${formData.provincia}` : ''}</span>, y teléfono de contacto <span className="font-semibold">{formData.telefono}</span>, comparezco respetuosamente ante usted para solicitar <span className="font-semibold">{purposeText(tipo)}</span>.</p>

          {(tipo === 'REGISTRO' || tipo === 'RENOVACION' || tipo === 'ACTUALIZACION') && (
            <p>Soy profesional en el área de <span className="font-semibold">{formData.area_profesional}</span>{formData.especialidad ? <> , con especialización en <span className="font-semibold">{formData.especialidad}</span></> : null}, habiendo obtenido mi titulación de <span className="font-semibold">{formData.titulacion_especifica_1}</span> en <span className="font-semibold">{formData.institucion_1}</span>, en <span className="font-semibold">{formData.pais_formacion_1}</span>, durante el período <span className="font-semibold">{formData.periodo_formacion}</span>.</p>
          )}

          {(tipo === 'EXTRAVIO' || tipo === 'DETERIORO' || tipo === 'DUPLICADO') && (
            <p>La presente solicitud tiene por objeto la sustitución del documento profesional anterior. El motivo declarado para el duplicado es <span className="font-semibold">{tipo === 'EXTRAVIO' ? 'extravío' : tipo === 'DETERIORO' ? 'deterioro' : 'duplicado'}</span>, quedando la nueva expedición vinculada al mismo expediente profesional.</p>
          )}

          <p>Actualmente, mi situación laboral es <span className="font-semibold">{formData.situacion_laboral}</span>{formData.estatus_funcionario ? <>, desempeñándome como funcionario público {formData.estatus_funcionario === 'nombrado' ? <>nombrado{nombramientoDate ? <>, con nombramiento oficial de fecha <span className="font-semibold">{nombramientoDate}</span></> : null}{formData.numero_funcionario ? <>, número <span className="font-semibold">{formData.numero_funcionario}</span></> : null}</> : <>no nombrado{inicioTrabajoDate ? <>, desempeñándome desde el <span className="font-semibold">{inicioTrabajoDate}</span></> : null}</>}</> : null}{formData.nombre_centro ? <>, prestando mis servicios profesionales en {centerArticle ? `${centerArticle} ` : ''}<span className="font-semibold">{formData.nombre_centro}</span>{formData.categoria_centro ? <> (categoría: <span className="font-semibold">{formData.categoria_centro}</span>)</> : null}{formData.tipo_sector ? <>, sector <span className="font-semibold">{formData.tipo_sector}</span></> : null}{formData.distrito_sanitario ? <>, distrito sanitario <span className="font-semibold">{formData.distrito_sanitario}</span></> : null}</> : null}.</p>

          {formData.pertenece_brigada_medica ? <p>Formo parte de una brigada médica de cooperación internacional, específicamente en el tipo de cooperación <span className="font-semibold">{formData.tipo_cooperacion}</span>.</p> : null}

          <p>Adjunto la documentación requerida para el trámite y me comprometo a cumplir los requisitos establecidos por el Ministerio de Sanidad y Bienestar Social para el ejercicio profesional sanitario.</p>
        </div>

        <div className="mt-8 flex justify-between items-end">
          <div className="text-xs text-gray-600">Solicitud generada el {today}<br />Tipo: <span className="font-semibold">{tipoLabel(tipo)}</span></div>
          {formData.sello_expediente_url ? <img src={formData.sello_expediente_url} alt="Sello de expediente" className="w-28 h-28 object-contain" /> : <div className="w-28 h-28 border border-dashed border-gray-400 flex items-center justify-center text-[9px] text-gray-500 text-center">SELLO DE EXPEDIENTE</div>}
          <div className="text-center"><p className="mb-8 text-sm">Atentamente,</p><div className="border-t border-black w-60 mx-auto mb-1" /><p className="font-semibold text-sm">{formData.nombre} {formData.apellidos}</p><p className="text-xs">{formData.area_profesional || 'Profesional sanitario'}</p><p className="text-xs">{formData.numero_dip ? `DIP: ${formData.numero_dip}` : formData.numero_pasaporte ? `Pasaporte: ${formData.numero_pasaporte}` : ''}</p></div>
        </div>
      </div>
    </div>
  );
};

export default RequestLetter;
