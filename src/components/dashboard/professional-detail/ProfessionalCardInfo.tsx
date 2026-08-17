import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { CreditCard, Calendar, Download, AlertTriangle, Stamp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Profesional } from '@/hooks/useProfesionales';
import { useSelloProfesional } from '@/hooks/useSellos';
import ProfessionalSealCard from '@/components/dashboard/ProfessionalSealCard';

interface ProfessionalCardInfoProps { professional: Profesional; daysUntilRenewal: number | null; isRenewalSoon: boolean; }

const ProfessionalCardInfo=({professional,daysUntilRenewal,isRenewalSoon}:ProfessionalCardInfoProps)=>{
 const {toast}=useToast();
 const {data:selloProfesional}=useSelloProfesional(professional.id,professional.id_profesional_unico);
 const nombre=professional.nombre_completo || `${professional.nombre||''} ${professional.apellidos||''}`.trim();
 const profesionalId=professional.id_profesional_unico || professional.id;
 const sealUrl=selloProfesional?.url || null;
 const handleDownloadCarnet=async()=>{
  if(!professional.url_carnet){toast({title:'Carnet no disponible',description:'No hay una URL de carnet para descargar.',variant:'destructive'});return;}
  try{const response=await fetch(professional.url_carnet);if(!response.ok)throw new Error(`HTTP ${response.status}`);const blob=await response.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`carnet-${nombre.replace(/\s+/g,'-')||'profesional'}.svg`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast({title:'Descarga iniciada',description:'El carnet profesional se está descargando.'});}
  catch(error){console.error(error);toast({title:'Error en la descarga',description:'No se pudo descargar el carnet profesional.',variant:'destructive'});}
 };
 return <Card>
  <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600"/><span>Identidad y sello profesional</span></CardTitle></CardHeader>
  <CardContent className="space-y-5">
   <div className="text-center p-2 border rounded-lg bg-gray-50">
    {professional.url_carnet?<img src={professional.url_carnet} alt="Carnet profesional" className="w-full h-auto max-w-xs object-contain mx-auto border rounded-md shadow-sm" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.alt='Carnet no disponible';}}/>:<div className="p-5 text-sm text-gray-500 flex items-center justify-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500"/>Carnet no disponible.</div>}
   </div>
   <div className="text-center"><p className="text-sm font-medium text-gray-600 mb-1">Número profesional</p><p className="font-mono text-lg font-bold text-blue-600">{profesionalId}</p></div>
   <Separator/>
   <div><div className="flex items-center gap-2 mb-3"><Stamp className="w-4 h-4 text-[#167f94]"/><p className="text-sm font-semibold text-gray-700">Sello profesional</p></div><ProfessionalSealCard name={nombre} professionalId={profesionalId}/>{sealUrl&&<p className="mt-2 text-xs text-green-700 text-center">Sello oficial almacenado en el expediente.</p>}</div>
   <Separator/>
   <div className="space-y-2"><div><span className="text-sm font-medium text-gray-600">Fecha de validez:</span><div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500"/><p className={`font-medium ${isRenewalSoon?'text-orange-600':'text-green-600'}`}>{professional.fecha_caducidad||'No especificado'}</p></div></div>{daysUntilRenewal!==null?<div><span className="text-sm font-medium text-gray-600">Días hasta renovación:</span><p className={`font-bold ${isRenewalSoon?'text-orange-600':daysUntilRenewal<=0?'text-red-600':'text-green-600'}`}>{daysUntilRenewal>0?`${daysUntilRenewal} días`:'Vencido'}</p></div>:<div className="text-sm text-gray-500">Información de renovación no disponible.</div>}</div>
   {professional.url_carnet?<Button className="w-full flex items-center gap-2" onClick={handleDownloadCarnet}><Download className="w-4 h-4"/>Descargar Carnet (SVG)</Button>:null}
  </CardContent>
 </Card>;
};
export default ProfessionalCardInfo;
