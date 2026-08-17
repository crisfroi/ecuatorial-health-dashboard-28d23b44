import React from 'react';
import { supabase } from '@/integrations/supabase/client';

type FuncionarioStatus = 'nombrado' | 'no_nombrado';
type NullableString = string | null | undefined;
interface RequestLetterData { nombre:string; apellidos:string; nacionalidad:string; numero_dip?:NullableString; numero_pasaporte?:NullableString; domicilio?:NullableString; distrito?:NullableString; provincia?:NullableString; telefono?:NullableString; area_profesional?:NullableString; especialidad?:NullableString; titulacion_especifica_1?:NullableString; institucion_1?:NullableString; pais_formacion_1?:NullableString; periodo_formacion?:NullableString; situacion_laboral?:NullableString; funcion_publica?:boolean|null; estatus_funcionario?:FuncionarioStatus|null; numero_funcionario?:NullableString; fecha_nombramiento?:NullableString; fecha_inicio_trabajo?:NullableString; nombre_centro?:NullableString; categoria_centro?:NullableString; tipo_sector?:NullableString; distrito_sanitario?:NullableString; pertenece_brigada_medica?:boolean|null; tipo_cooperacion?:NullableString; tipo_solicitud?:NullableString; codigo_expediente?:NullableString; sello_expediente_url?:NullableString; }
const normalizeTipo=(value?:NullableString)=>{const raw=String(value||'REGISTRO').trim().toUpperCase();if(raw.includes('RENOV'))return'RENOVACION';if(raw.includes('EXTRAV'))return'EXTRAVIO';if(raw.includes('DETER'))return'DETERIORO';if(raw.includes('DUPLIC'))return'DUPLICADO';if(raw.includes('ACTUAL'))return'ACTUALIZACION';return'REGISTRO';};
const labels:any={REGISTRO:'Registro inicial de acreditación profesional sanitaria',RENOVACION:'Renovación de acreditación profesional sanitaria',EXTRAVIO:'Solicitud de duplicado por extravío del documento profesional',DETERIORO:'Solicitud de duplicado por deterioro del documento profesional',DUPLICADO:'Solicitud de duplicado de acreditación profesional sanitaria',ACTUALIZACION:'Actualización de datos de acreditación profesional sanitaria'};
const purpose:any={REGISTRO:'mi acreditación profesional sanitaria',RENOVACION:'la renovación de mi acreditación profesional sanitaria',EXTRAVIO:'la expedición de un duplicado de mi acreditación profesional sanitaria por extravío',DETERIORO:'la expedición de un duplicado de mi acreditación profesional sanitaria por deterioro',DUPLICADO:'la expedición de un duplicado de mi acreditación profesional sanitaria',ACTUALIZACION:'la actualización de mis datos de acreditación profesional sanitaria'};
const dateLong=(v?:NullableString)=>{if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'});};

const RequestLetter=({formData}: {formData:RequestLetterData})=>{
  const [sello,setSello]=React.useState(formData.sello_expediente_url||'');
  const [tipo,setTipo]=React.useState(normalizeTipo(formData.tipo_solicitud));

  React.useEffect(()=>{
    let cancelled=false;
    const load=async()=>{
      try { const stored=localStorage.getItem('professional_request_type'); if(!formData.tipo_solicitud&&stored&&!cancelled)setTipo(normalizeTipo(stored)); } catch(_) {}
      if(!formData.codigo_expediente)return;
      const {data}=await supabase.from('sellos_expedientes').select('url_sello').eq('codigo_expediente',formData.codigo_expediente).order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(!cancelled&&data?.url_sello){
        try {
          const response=await fetch(data.url_sello,{cache:'no-store'});
          const svg=await response.text();
          const encoded=`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
          if(!cancelled)setSello(encoded);
        } catch { if(!cancelled)setSello(data.url_sello); }
      }
    };
    load();
    return()=>{cancelled=true;};
  },[formData.codigo_expediente,formData.tipo_solicitud]);

  const today=new Date().toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'});
  const identificacion=formData.numero_dip?`número de DIP ${formData.numero_dip}`:formData.numero_pasaporte?`número de pasaporte ${formData.numero_pasaporte}`:'documento de identificación vigente';
  const nombramiento=dateLong(formData.fecha_nombramiento);const inicio=dateLong(formData.fecha_inicio_trabajo);

  return <div className="pdf-page bg-white" style={{width:'210mm',minHeight:'297mm',boxSizing:'border-box',padding:'16mm 20mm',fontFamily:'Arial, Helvetica, sans-serif',color:'#1d3036',fontSize:'11.5px',lineHeight:1.55}}>
    <div className="flex flex-col min-h-[265mm]">
      <header className="text-center">
        <h1 className="text-[16px] font-bold tracking-wide">REPÚBLICA DE GUINEA ECUATORIAL</h1>
        <h2 className="text-[17px] font-bold text-[#0d7085] mt-1">MINISTERIO DE SANIDAD E INFRAESTRUCTURAS SANITARIAS</h2>
        <div className="border-b-2 border-[#16859a] mt-4 mb-5"/>
        <div className="inline-block border border-[#9bbcc2] rounded px-4 py-1.5 text-[12px] font-bold tracking-wide">EXPEDIENTE: {formData.codigo_expediente||'PENDIENTE'}</div>
      </header>

      <div className="text-right mt-7 mb-6">Malabo, {today}</div>
      <div className="mb-6"><p className="font-bold text-[14px]">AL SEÑOR MINISTRO DE SANIDAD E INFRAESTRUCTURAS SANITARIAS</p><p className="text-[12px] mt-1">REPÚBLICA DE GUINEA ECUATORIAL</p><p className="mt-3 text-[13px]"><b>ASUNTO:</b> {labels[tipo]}</p></div>

      <div className="space-y-4 text-justify" style={{textAlign:'justify',textJustify:'inter-word'}}>
        <p>Yo, <b>{formData.nombre} {formData.apellidos}</b>, de nacionalidad <b>{formData.nacionalidad}</b>, con {identificacion}, con domicilio en <b>{formData.domicilio}{formData.distrito?`, ${formData.distrito}`:''}{formData.provincia?`, ${formData.provincia}`:''}</b>, y teléfono <b>{formData.telefono}</b>, comparezco ante usted para solicitar <b>{purpose[tipo]}</b>.</p>
        {(tipo==='REGISTRO'||tipo==='RENOVACION'||tipo==='ACTUALIZACION')&&<p>Soy profesional en el área de <b>{formData.area_profesional}</b>{formData.especialidad?<>, con especialización en <b>{formData.especialidad}</b></>:null}, con titulación de <b>{formData.titulacion_especifica_1}</b> obtenida en <b>{formData.institucion_1}</b>, <b>{formData.pais_formacion_1}</b>, período <b>{formData.periodo_formacion}</b>.</p>}
        {(tipo==='EXTRAVIO'||tipo==='DETERIORO'||tipo==='DUPLICADO')&&<p>La presente solicitud tiene por objeto sustituir el documento profesional anterior. Motivo del duplicado: <b>{tipo==='EXTRAVIO'?'extravío':tipo==='DETERIORO'?'deterioro':'duplicado'}</b>.</p>}
        <p>Mi situación laboral es <b>{formData.situacion_laboral}</b>{formData.estatus_funcionario?<> y soy funcionario público {formData.estatus_funcionario==='nombrado'?<>nombrado{nombramiento?`, con nombramiento de fecha ${nombramiento}`:''}{formData.numero_funcionario?`, número ${formData.numero_funcionario}`:''}</>:<>no nombrado{inicio?`, desempeñándome desde el ${inicio}`:''}</>}</>:null}{formData.nombre_centro?<>, prestando servicios en <b>{formData.nombre_centro}</b></>:null}.</p>
        <p>Adjunto la documentación requerida y me comprometo a cumplir los requisitos establecidos por el Ministerio de Sanidad e Infraestructuras Sanitarias.</p>
      </div>

      <div className="mt-auto pt-12 border-t border-[#c8d6d9]">
        <div className="grid grid-cols-[1fr_150px_1.5fr] gap-7 items-end">
          <div className="text-[10px] text-[#55717a] leading-5">Trámite:<br/><b>{labels[tipo]}</b><br/>Generado: {today}</div>
          <div className="flex justify-center"><div className="w-[135px] h-[105px] flex items-center justify-center overflow-hidden">{sello?<img src={sello} alt="Sello de expediente" className="max-w-full max-h-full object-contain"/>:<div className="w-full h-full border border-dashed border-[#9bbcc2] rounded flex items-center justify-center text-[9px] text-[#55717a] text-center">SELLO DE EXPEDIENTE</div>}</div></div>
          <div className="text-center text-[11px]"><p className="mb-10">Atentamente,</p><div className="border-t border-black w-60 mx-auto mb-1"/><b>{formData.nombre} {formData.apellidos}</b><p className="text-[10px] mt-1">{formData.area_profesional||'Profesional sanitario'}</p></div>
        </div>
        <div className="mt-6 flex justify-between text-[9px] text-[#6a7f84]"><span>Documento oficial · expediente {formData.codigo_expediente||'PENDIENTE'}</span><span>Guinea Ecuatorial Salud</span></div>
      </div>
    </div>
  </div>;
};
export default RequestLetter;
