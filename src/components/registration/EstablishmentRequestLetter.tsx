import React from "react";

interface EstablishmentRequestLetterProps { solicitud: any; }
const labels: Record<string,string> = { REGISTRO:'Registro inicial y autorización de apertura', RENOVACION:'Renovación de licencia sanitaria', DUPLICADO:'Duplicado de licencia sanitaria', ACTUALIZACION:'Actualización de datos del establecimiento' };
const EstablishmentRequestLetter: React.FC<EstablishmentRequestLetterProps> = ({ solicitud }) => {
  let tipo = solicitud.tipo_solicitud;
  try { tipo = tipo || localStorage.getItem('establishment_request_type') || 'REGISTRO'; } catch (_) { tipo = tipo || 'REGISTRO'; }
  tipo = String(tipo).toUpperCase();
  const label = labels[tipo] || labels.REGISTRO;
  const today = new Date().toLocaleDateString('es-ES');
  const personas = solicitud.personal_apertura?.personas || [];
  const categorias = solicitud.personal_apertura?.categorias || {};
  const intro = tipo === 'RENOVACION' ? 'solicito respetuosamente la renovación de la licencia sanitaria del establecimiento indicado' : tipo === 'DUPLICADO' ? 'solicito la expedición de un duplicado de la licencia sanitaria correspondiente al establecimiento indicado' : tipo === 'ACTUALIZACION' ? 'solicito la actualización de los datos y antecedentes administrativos del establecimiento indicado' : 'solicito la autorización de apertura y funcionamiento del establecimiento indicado';
  return <div id="establishment-request-letter" className="max-w-[210mm] mx-auto bg-white" style={{padding:'15mm 20mm',minHeight:'297mm',fontSize:'11px',lineHeight:1.4}}>
    <div className="text-center mb-4"><h1 className="text-base font-bold">REPÚBLICA DE GUINEA ECUATORIAL</h1><h2 className="text-sm font-semibold">MINISTERIO DE SANIDAD, BIENESTAR SOCIAL E INFRAESTRUCTURAS SANITARIAS</h2><div className="border-b-2 border-black mt-2 mb-3"/><div className="inline-block border border-gray-400 px-3 py-1 text-xs font-bold">EXPEDIENTE: {solicitud.numero_solicitud || 'PENDIENTE'}</div></div>
    <div className="text-right mb-4"><p className="text-sm">Malabo, {solicitud.fecha_solicitud ? new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES') : today}</p></div>
    <div className="mb-3"><p className="font-semibold text-sm">AL SEÑOR MINISTRO DE SANIDAD, BIENESTAR SOCIAL E INFRAESTRUCTURAS SANITARIAS</p><p className="text-sm">REPÚBLICA DE GUINEA ECUATORIAL</p><p className="mt-1 text-sm"><span className="font-semibold">ASUNTO:</span> {label}</p></div>
    <div className="mb-5 space-y-3 text-justify">
      <p>Yo, <span className="font-semibold">{solicitud.director_responsable || '________________'}</span>, en calidad de responsable del establecimiento <span className="font-semibold">{solicitud.nombre_establecimiento}</span>, ubicado en <span className="font-semibold">{solicitud.direccion}</span>, provincia de <span className="font-semibold">{solicitud.provincia}</span>{solicitud.distrito_sanitario ? <> (Distrito Sanitario <span className="font-semibold">{solicitud.distrito_sanitario}</span>)</> : null}, por medio de la presente {intro}.</p>
      <p>Establecimiento de categoría <span className="font-semibold">{solicitud.categoria}</span>, sector <span className="font-semibold">{solicitud.tipo_servicio}</span>.</p>
      {(tipo === 'REGISTRO' || tipo === 'ACTUALIZACION') && <><p>Para la puesta en marcha se presenta el plan de personal:</p><ul className="list-disc ml-6">{Object.keys(categorias).length ? Object.entries(categorias).map(([k,v])=><li key={k}>{k}: <span className="font-semibold">{v as number}</span></li>) : <li>—</li>}</ul>{personas.length>0&&<table className="w-full text-xs mt-2" style={{borderCollapse:'collapse'}}><thead><tr><th style={{borderBottom:'1px solid #000',textAlign:'left'}}>Nombre</th><th style={{borderBottom:'1px solid #000',textAlign:'left'}}>Teléfono</th><th style={{borderBottom:'1px solid #000',textAlign:'left'}}>Categoría</th></tr></thead><tbody>{personas.map((p:any,i:number)=><tr key={i}><td>{p.nombre}</td><td>{p.telefono}</td><td>{p.categoria||''}</td></tr>)}</tbody></table>}</>}
      {tipo === 'RENOVACION' && <p>Se solicita mantener la autorización administrativa y sanitaria, quedando el establecimiento sujeto a la comprobación de que continúan cumpliéndose las condiciones y requisitos vigentes.</p>}
      {tipo === 'DUPLICADO' && <p>La nueva licencia deberá quedar vinculada al expediente y registro administrativo existente, sin crear un establecimiento nuevo.</p>}
      <p>Asesor técnico: <span className="font-semibold">{solicitud.asesor_tecnico?.nombre || '________________'}</span>{solicitud.asesor_tecnico?.formacion ? <>; formación: <span className="font-semibold">{solicitud.asesor_tecnico.formacion}</span></> : null}{solicitud.asesor_tecnico?.telefono ? <>; teléfono: <span className="font-semibold">{solicitud.asesor_tecnico.telefono}</span></> : null}.</p>
    </div>
    <div className="mt-8 flex justify-between items-end"><div className="text-xs text-gray-600">Trámite: <b>{label}</b><br/>Solicitud: {solicitud.numero_solicitud || 'PENDIENTE'}</div>{solicitud.url_sello_expediente ? <img src={solicitud.url_sello_expediente} alt="Sello de expediente" className="w-28 h-28 object-contain"/> : <div className="w-28 h-28 border border-dashed border-gray-400 flex items-center justify-center text-[9px] text-gray-500 text-center">SELLO DE EXPEDIENTE</div>}<div className="text-center"><p className="mb-8">Atentamente,</p><div className="border-t border-black w-60 mx-auto mb-1"/><p className="font-semibold">{solicitud.director_responsable || '________________'}</p><p className="text-sm">Director/Responsable</p></div></div>
  </div>;
};
export default EstablishmentRequestLetter;
