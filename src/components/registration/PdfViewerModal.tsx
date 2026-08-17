import React,{useRef,useState,useEffect,useCallback} from 'react';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Download,XCircle} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import SolicitudSummaryPage from './SolicitudSummaryPage';
import RequestLetter from './RequestLetter';
import NotaIngresoPage,{NotaIngresoData} from './NotaIngresoPage';

interface Props{isOpen:boolean;onClose:()=>void;formData:any;pdfType:'bundle'|null;notaIngreso?:NotaIngresoData|null;}
const PdfViewerModal=({isOpen,onClose,formData,pdfType,notaIngreso}:Props)=>{
 const ref=useRef<HTMLDivElement>(null);const urlRef=useRef<string|null>(null);const [pdfUrl,setPdfUrl]=useState<string|null>(null);const [loading,setLoading]=useState(true);const [blob,setBlob]=useState<Blob|null>(null);
 const generate=useCallback(async()=>{setLoading(true);if(urlRef.current){URL.revokeObjectURL(urlRef.current);urlRef.current=null;}setPdfUrl(null);setBlob(null);await new Promise(r=>setTimeout(r,250));const root=ref.current;if(!root){setLoading(false);return;}try{const targets=Array.from(root.children).filter((el):el is HTMLElement=>el instanceof HTMLElement);const pdf=new jsPDF('p','mm','a4');for(let i=0;i<targets.length;i++){const canvas=await html2canvas(targets[i],{scale:2,useCORS:true,allowTaint:false,backgroundColor:'#fff',imageTimeout:15000});if(i>0)pdf.addPage();pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,210,297,undefined,'FAST');}const out=pdf.output('blob');const url=URL.createObjectURL(out);urlRef.current=url;setBlob(out);setPdfUrl(url);}catch(e){console.error('Error generando expediente PDF',e);setPdfUrl(null);}finally{setLoading(false);}},[formData,notaIngreso]);
 useEffect(()=>{if(isOpen&&pdfType)generate();return()=>{if(urlRef.current){URL.revokeObjectURL(urlRef.current);urlRef.current=null;}};},[isOpen,pdfType,generate]);
 const download=()=>{if(!blob)return;const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=`Expediente_Completo_${formData.codigo_expediente||'expediente'}.pdf`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u);};
 return <Dialog open={isOpen} onOpenChange={onClose}><DialogContent className="max-w-5xl h-[90vh] flex flex-col"><DialogHeader><DialogTitle>Expediente completo{loading&&<span className="ml-2 text-sm text-gray-500">Generando PDF...</span>}</DialogTitle></DialogHeader><div ref={ref} className="absolute -left-[10000px] top-0" style={{width:'210mm',background:'#fff'}}><SolicitudSummaryPage formData={formData}/><RequestLetter formData={formData}/><NotaIngresoPage data={notaIngreso} codigoExpediente={formData.codigo_expediente}/></div><div className="flex-grow flex items-center justify-center bg-gray-100 rounded-md overflow-hidden">{loading?<div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"/><p className="text-gray-700">Preparando las 3 páginas del expediente...</p></div>:pdfUrl?<iframe key={pdfUrl} src={pdfUrl} className="w-full h-full border-none" title="Previsualización del expediente PDF"/>:<div className="text-center text-red-600"><XCircle className="w-12 h-12 mx-auto mb-4"/><p>No se pudo generar la previsualización.</p></div>}</div><div className="flex justify-end gap-2 mt-4"><Button onClick={download} disabled={!blob||loading} className="flex items-center gap-2"><Download className="w-4 h-4"/>Descargar expediente completo</Button><Button onClick={onClose} variant="outline">Cerrar</Button></div></DialogContent></Dialog>;
};
export default PdfViewerModal;
