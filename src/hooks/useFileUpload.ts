import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOAD_MB = 10;

const humanSize=(bytes:number)=>bytes<1024*1024?`${Math.round(bytes/1024)} KB`:`${(bytes/(1024*1024)).toFixed(1)} MB`;

export const useFileUpload=()=>{
 const [isUploading,setIsUploading]=useState(false); const {toast}=useToast();
 const validate=(file:File)=>{
  if(file.size>MAX_UPLOAD_BYTES){toast({title:'Archivo demasiado grande',description:`“${file.name}” pesa ${humanSize(file.size)} y supera el límite de ${MAX_UPLOAD_MB} MB. Seleccione un archivo más ligero o reduzca el PDF antes de volver a intentarlo.`,variant:'destructive'});return false;}
  return true;
 };
 const uploadFile=async(file:File,bucket:string,filePath?:string):Promise<string|null>=>{
  if(!validate(file))return null; setIsUploading(true);
  try{const fileExt=file.name.split('.').pop()||'bin';const fileName=filePath||`${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;const {error}=await supabase.storage.from(bucket).upload(fileName,file,{upsert:false});if(error){const msg=/size|large|payload|413|too big/i.test(error.message||'')?`El archivo supera el límite permitido de ${MAX_UPLOAD_MB} MB.`:error.message;toast({title:'No se pudo cargar el archivo',description:msg,variant:'destructive'});return null;}return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;}
  catch(error:any){console.error('Error uploading file:',error);toast({title:'Error al cargar el archivo',description:'No se pudo completar la carga. Compruebe el tamaño y vuelva a intentarlo.',variant:'destructive'});return null;}finally{setIsUploading(false);}
 };
 const uploadPDF=async(pdfBlob:Blob,fileName:string):Promise<string|null>=>{
  if(pdfBlob.size>MAX_UPLOAD_BYTES){toast({title:'PDF demasiado grande',description:`El PDF generado pesa ${humanSize(pdfBlob.size)} y supera el límite de ${MAX_UPLOAD_MB} MB. Reduzca su tamaño antes de volver a intentarlo.`,variant:'destructive'});return null;}
  setIsUploading(true);try{const {error}=await supabase.storage.from('documentos-pdf').upload(fileName,pdfBlob,{contentType:'application/pdf',upsert:false});if(error){toast({title:'No se pudo cargar el PDF',description:/size|large|payload|413|too big/i.test(error.message||'')?`El PDF supera el límite permitido de ${MAX_UPLOAD_MB} MB.`:error.message,variant:'destructive'});return null;}return supabase.storage.from('documentos-pdf').getPublicUrl(fileName).data.publicUrl;}catch(error){console.error('Error uploading PDF:',error);toast({title:'Error al cargar el PDF',description:'No se pudo completar la carga del documento.',variant:'destructive'});return null;}finally{setIsUploading(false);}}
 return {uploadFile,uploadPDF,isUploading,maxUploadBytes:MAX_UPLOAD_BYTES,maxUploadMb:MAX_UPLOAD_MB};
};
