import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Check, CheckCircle } from 'lucide-react';
import ApplicationProcedureContent from '@/components/registration/ApplicationProcedureSection';

interface ProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProcedureModal = ({ isOpen, onClose }: ProcedureModalProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleUnderstandingConfirm = () => {
    alert('¡Gracias por confirmar! Has entendido el procedimiento.');
    onClose();
  };

  // Descarga el archivo PDF de guía estático con manejo de errores
  const handleDownloadGuide = async () => {
    try {
      const downloadUrl = "https://wdieynendfjbkbhfovrx.supabase.co/storage/v1/object/public/documentos-descargas/procedimientos/Procedimiento%20Solicitud.pdf";

      // Verificar si el archivo existe
      const response = await fetch(downloadUrl, { method: 'HEAD' });

      if (!response.ok) {
        throw new Error('El archivo no está disponible en este momento');
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'Procedimiento_Solicitud_Carnet_Profesional.pdf');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('Se ha iniciado la descarga de la guía del procedimiento.');
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      alert('Error al descargar el archivo. Por favor, inténtelo de nuevo más tarde o contacte con soporte.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center">
            <CheckCircle className="inline-block mr-2 w-6 h-6 text-green-600" />
            ¡Solicitud Enviada! Siguientes Pasos
          </DialogTitle>
          <DialogDescription className="mt-2">
            Hemos registrado tu solicitud exitosamente. A continuación, te detallamos el procedimiento para la obtención de tu carnet profesional.
          </DialogDescription>
        </DialogHeader>

        {/* Contenido a exportar como PDF */}
        <div ref={contentRef}>
          <ApplicationProcedureContent />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-4 border-t border-gray-200">
          <Button
            onClick={handleUnderstandingConfirm}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-md transition-colors duration-200"
          >
            <Check className="w-5 h-5" />
            Confirmar Entendimiento
          </Button>
         
          <Button
            onClick={handleDownloadGuide}
            variant="outline"
            className="flex items-center gap-2 px-6 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-semibold rounded-md shadow-md transition-colors duration-200"
          >
            <Download className="w-5 h-5" />
            Descargar Guía del Procedimiento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProcedureModal;
