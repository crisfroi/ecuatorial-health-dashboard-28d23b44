import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Download, FileText, Home, Layers3, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PdfViewerModal from "./PdfViewerModal";
import type { NotaIngresoData } from "./NotaIngresoPage";

interface ConfirmationStepProps { formData:any; isSubmitting:boolean; solicitudEnviada?:boolean; errorEnvio?:string; }

const ConfirmationStep=({formData,isSubmitting,solicitudEnviada=false,errorEnvio}:ConfirmationStepProps)=>{
  const [showPdfPreviewModal,setShowPdfPreviewModal]=useState(false);
  const [pdfTypeToPreview,setPdfTypeToPreview]=useState<"bundle"|null>(null);
  const [notaIngreso,setNotaIngreso]=useState<NotaIngresoData|null>(null);
  const [notaLoading,setNotaLoading]=useState(false);
  const navigate=useNavigate();

  useEffect(()=>{
    if(!solicitudEnviada||!formData.codigo_expediente)return;
    let cancelled=false;let timer:ReturnType<typeof setTimeout>|undefined;
    const load=async(attempt=0)=>{
      setNotaLoading(true);
      try{
        let solicitudId=formData.solicitud_id||null;
        if(!solicitudId){const {data:sello}=await supabase.from("sellos_expedientes").select("solicitud_id").eq("codigo_expediente",formData.codigo_expediente).order("created_at",{ascending:false}).limit(1).maybeSingle();solicitudId=sello?.solicitud_id||null;}
        let query=supabase.from("notas_ingreso").select("numero_nota,tipo_solicitud,concepto_descripcion,monto,moneda,cuenta_tesoreria,beneficiario_nombre,beneficiario_documento,hash,algoritmo,pdf_url,created_at").order("created_at",{ascending:false}).limit(1);
        if(solicitudId)query=query.eq("solicitud_id",solicitudId);else query=query.eq("beneficiario_documento",formData.numero_dip||formData.numero_pasaporte||"__NO_DOCUMENT__");
        const {data,error}=await query.maybeSingle();
        if(!cancelled&&!error&&data)setNotaIngreso(data);
        if(!cancelled&&!data&&attempt<8)timer=setTimeout(()=>load(attempt+1),1500);
      }finally{if(!cancelled)setNotaLoading(false);}
    };
    load();return()=>{cancelled=true;if(timer)clearTimeout(timer);};
  },[solicitudEnviada,formData.codigo_expediente,formData.solicitud_id,formData.numero_dip,formData.numero_pasaporte]);

  if(isSubmitting)return <div className="flex flex-col items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-guinea-teal mb-4"/><h3 className="text-lg font-semibold text-gray-900 mb-2">Enviando solicitud...</h3><p className="text-gray-600 text-center">Por favor espere mientras procesamos su solicitud.</p></div>;
  if(errorEnvio)return <div className="flex flex-col items-center justify-center py-12"><AlertCircle className="h-16 w-16 text-red-500 mb-4"/><h3 className="text-xl font-bold text-red-600 mb-4">Error al enviar la solicitud</h3><div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-md"><p className="text-red-700 text-center">{errorEnvio}</p></div><p className="text-gray-600 text-center mb-4">Por favor, revise los datos e intente nuevamente.</p></div>;
  if(!solicitudEnviada)return <div className="space-y-6"><Card className="border-amber-200 bg-amber-50"><CardHeader><CardTitle className="flex items-center space-x-2 text-amber-700"><AlertCircle className="w-5 h-5"/><span>Solicitud pendiente de envío</span></CardTitle></CardHeader><CardContent><p className="text-amber-700 mb-4">Su solicitud aún no ha sido enviada. Para acceder a los documentos PDF, debe completar el envío de la solicitud.</p></CardContent></Card></div>;

  return <div className="space-y-6">
    <Card className="border-green-200 bg-green-50"><CardHeader><CardTitle className="flex items-center space-x-2 text-green-700"><CheckCircle className="w-5 h-5"/><span>¡Solicitud enviada exitosamente!</span></CardTitle></CardHeader><CardContent><p className="text-green-700">Su solicitud ha sido procesada correctamente y se le ha asignado el código de expediente:</p><div className="bg-green-100 p-3 rounded border border-green-200 text-center"><span className="text-lg font-mono font-bold text-green-800">{formData.codigo_expediente}</span></div><p className="text-sm text-green-600 mt-3">Guarde este código para futuras consultas sobre el estado de su solicitud.</p></CardContent></Card>

    <Card className="border-guinea-teal/30"><CardHeader><CardTitle className="flex items-center gap-2"><Layers3 className="w-5 h-5 text-guinea-teal"/><span>Expediente documental completo</span></CardTitle></CardHeader><CardContent><p className="text-gray-600 mb-5">Se genera <strong>un único PDF</strong>. Cada documento ocupa su propia página, evitando múltiples descargas y manteniendo el expediente unido.</p><div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5"><div className="border rounded-lg p-4 bg-gray-50"><FileText className="w-5 h-5 text-guinea-teal mb-2"/><div className="font-semibold">Página 1</div><div className="text-sm text-gray-600 mt-1">Resumen de la solicitud</div></div><div className="border rounded-lg p-4 bg-gray-50"><FileText className="w-5 h-5 text-guinea-teal mb-2"/><div className="font-semibold">Página 2</div><div className="text-sm text-gray-600 mt-1">Instancia de solicitud + sello de expediente</div></div><div className="border rounded-lg p-4 bg-gray-50"><ReceiptText className="w-5 h-5 text-guinea-teal mb-2"/><div className="font-semibold">Página 3</div><div className="text-sm text-gray-600 mt-1">Nota de Ingreso {notaIngreso?.numero_nota?`· ${notaIngreso.numero_nota}`:''}</div></div></div><Button onClick={()=>{setPdfTypeToPreview("bundle");setShowPdfPreviewModal(true);}} className="w-full md:w-auto flex items-center gap-2"><Download className="w-4 h-4"/>Descargar expediente completo (PDF)</Button><div className="mt-4 text-sm">{notaLoading?<span className="text-gray-500">Localizando la Nota de Ingreso generada...</span>:notaIngreso?<span className="text-green-700"><strong>Nota de Ingreso disponible:</strong> {notaIngreso.numero_nota}</span>:<span className="text-amber-700">La Nota de Ingreso todavía está en proceso de generación. El expediente se actualizará cuando esté disponible.</span>}</div></CardContent></Card>

    <Card className="bg-blue-50 border-blue-200"><CardContent className="pt-6"><h4 className="font-semibold text-blue-900 mb-2">Próximos pasos</h4><ul className="text-sm text-blue-800 space-y-1"><li>• Su solicitud será revisada por el comité evaluador</li><li>• Recibirá notificaciones sobre el estado de su solicitud</li><li>• Conserve el código de expediente para consultas futuras</li></ul></CardContent></Card>
    <Card className="bg-green-50 border-green-200"><CardContent className="pt-6"><div className="flex flex-col items-center text-center space-y-4"><div className="p-3 bg-green-100 rounded-full"><Home className="w-6 h-6 text-green-600"/></div><div><h4 className="font-semibold text-green-900 mb-2">¡Registro completado exitosamente!</h4><p className="text-sm text-green-800 mb-4">Su solicitud ha sido enviada correctamente.</p></div><Button onClick={()=>navigate("/")} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2" size="lg"><Home className="w-4 h-4 mr-2"/>Ir a la Página Principal</Button></div></CardContent></Card>
    <PdfViewerModal isOpen={showPdfPreviewModal} onClose={()=>setShowPdfPreviewModal(false)} formData={formData} pdfType={pdfTypeToPreview} notaIngreso={notaIngreso}/>
  </div>;
};
export default ConfirmationStep;
