import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PDFSummary from './PDFSummary';
import RequestLetter from './RequestLetter';
import NotaIngresoPage, { NotaIngresoData } from './NotaIngresoPage';

interface PdfViewerModalProps { isOpen:boolean; onClose:()=>void; formData:any; pdfType:'summary'|'letter'|'bundle'|null; notaIngreso?:NotaIngresoData|null; }

const PdfViewerModal=({isOpen,onClose,formData,pdfType,notaIngreso}:PdfViewerModalProps)=>{
  const contentToRenderRef=useRef<HTMLDivElement>(null);
  const [pdfUrl,setPdfUrl]=useState<string|null>(null);
  const [isLoading,setIsLoading]=useState(true);
  const [pdfBlob,setPdfBlob]=useState<Blob|null>(null);

  const generatePdfContent=useCallback(async()=>{
    setIsLoading(true); if(pdfUrl)URL.revokeObjectURL(pdfUrl); setPdfUrl(null); setPdfBlob(null);
    await new Promise(resolve=>setTimeout(resolve,250));
    const root=contentToRenderRef.current; if(!root){setIsLoading(false);return;}
    try{
      const targets=pdfType==='bundle'
        ? Array.from(root.children).filter((el):el is HTMLElement=>el instanceof HTMLElement)
        : Array.from(root.querySelectorAll<HTMLElement>('.pdf-page')).length
          ? Array.from(root.querySelectorAll<HTMLElement>('.pdf-page'))
          : [root];
      const pdf=new jsPDF('p','mm','a4');
      for(let i=0;i<targets.length;i++){
        const canvas=await html2canvas(targets[i],{scale:2,useCORS:true,allowTaint:false,backgroundColor:'#ffffff',imageTimeout:15000,ignoreElements:element=>element.classList.contains('pdf-download-button')});
        const imgData=canvas.toDataURL('image/png'); if(i>0)pdf.addPage(); pdf.addImage(imgData,'PNG',0,0,210,297,undefined,'FAST');
      }
      const output=pdf.output('blob'); const url=URL.createObjectURL(output); setPdfBlob(output); setPdfUrl(url);
    }catch(error){console.error('Error generando PDF:',error);setPdfUrl(null);}finally{setIsLoading(false);}
  },[formData,pdfType,notaIngreso]);

  useEffect(()=>{if(isOpen&&pdfType)generatePdfContent();return()=>{if(pdfUrl)URL.revokeObjectURL(pdfUrl);};},[isOpen,pdfType,generatePdfContent]);
  const handleDownloadPdf=()=>{if(!pdfBlob)return;const name=pdfType==='bundle'?'Expediente_Completo':pdfType==='summary'?'Resumen_Solicitud':'Instancia_Solicitud';const url=URL.createObjectURL(pdfBlob);const link=document.createElement('a');link.href=url;link.download=`${name}_${formData.codigo_expediente||'expediente'}.pdf`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);};
  const renderPages=()=>{if(pdfType==='summary')return <PDFSummary formData={formData}/>;if(pdfType==='letter')return <RequestLetter formData={formData}/>;if(pdfType==='bundle')return <><PDFSummary formData={formData}/><RequestLetter formData={formData}/><NotaIngresoPage data={notaIngreso} codigoExpediente={formData.codigo_expediente}/></>;return null;};
  const title=pdfType==='bundle'?'Expediente completo':pdfType==='summary'?'Resumen de solicitud':'Instancia de solicitud';
  return <Dialog open={isOpen} onOpenChange={onClose}><DialogContent className="max-w-5xl h-[90vh] flex flex-col"><DialogHeader><DialogTitle>{title}{isLoading&&<span className="ml-2 text-sm text-gray-500">Generando PDF...</span>}</DialogTitle></DialogHeader>{pdfType&&<div ref={contentToRenderRef} className="absolute -left-[10000px] top-0" style={{width:'210mm',background:'#fff'}}>{renderPages()}</div>}<div className="flex-grow flex items-center justify-center bg-gray-100 rounded-md overflow-hidden">{isLoading?<div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"/><p className="text-gray-700">Preparando las páginas del documento...</p></div>:pdfUrl?<iframe key={pdfUrl} src={pdfUrl} className="w-full h-full border-none" title="Previsualización PDF"/>:<div className="text-center text-red-600"><XCircle className="w-12 h-12 mx-auto mb-4"/><p>No se pudo generar la previsualización.</p></div>}</div><div className="flex justify-end gap-2 mt-4"><Button onClick={handleDownloadPdf} disabled={!pdfBlob||isLoading} className="flex items-center gap-2 pdf-download-button"><Download className="w-4 h-4"/>Descargar PDF</Button><Button onClick={onClose} variant="outline" className="pdf-download-button">Cerrar</Button></div></DialogContent></Dialog>;
};
export default PdfViewerModal;
