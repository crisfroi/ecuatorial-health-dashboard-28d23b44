
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File, bucket: string, filePath?: string): Promise<string | null> => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = filePath || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Error",
          description: `Error al subir archivo: ${error.message}`,
          variant: "destructive",
        });
        return null;
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Error inesperado al subir archivo",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadPDF = async (pdfBlob: Blob, fileName: string): Promise<string | null> => {
    setIsUploading(true);
    try {
      const { data, error } = await supabase.storage
        .from('documentos-pdf')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
        });

      if (error) {
        console.error('Error uploading PDF:', error);
        return null;
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('documentos-pdf')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    uploadPDF,
    isUploading
  };
};
