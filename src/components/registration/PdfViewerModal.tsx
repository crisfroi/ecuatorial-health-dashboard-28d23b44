import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Importamos los componentes de contenido que se convertirán a PDF
import PDFSummary from './PDFSummary';
import RequestLetter from './RequestLetter';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any; // Los datos del formulario que se pasarán a los componentes PDF
  pdfType: 'summary' | 'letter' | null; // Para saber qué tipo de PDF mostrar
}

const PdfViewerModal = ({ isOpen, onClose, formData, pdfType }: PdfViewerModalProps) => {
  const contentToRenderRef = useRef<HTMLDivElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  // Función para generar el PDF y obtener su URL/Blob
  const generatePdfContent = useCallback(async () => {
    setIsLoading(true);
    setPdfUrl(null);
    setPdfBlob(null);

    // Añadimos un pequeño retraso para asegurar que el contenido se ha renderizado
    // Aumentado a 200ms para mayor robustez
    await new Promise(resolve => setTimeout(resolve, 200)); 

    if (!contentToRenderRef.current) {
      console.warn('contentToRenderRef.current no está disponible aún para generar el PDF.');
      setIsLoading(false); 
      return;
    }

    try {
      const canvas = await html2canvas(contentToRenderRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        ignoreElements: (element) => {
          return element.classList.contains('pdf-download-button');
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; 
      const pageHeight = 295; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const pdfOutput = pdf.output('blob'); 
      const url = URL.createObjectURL(pdfOutput); 
      
      setPdfUrl(url);
      setPdfBlob(pdfOutput); 
    } catch (error) {
      console.error('Error generando PDF para previsualización:', error);
      setPdfUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [formData, pdfType]); 

  // Efecto para generar el PDF cuando el modal se abre O cuando el contenido del ref está listo
  useEffect(() => {
    if (isOpen && pdfType) {
      generatePdfContent();
    } else if (!isOpen && pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
      setPdfBlob(null);
    }
  }, [isOpen, pdfType, generatePdfContent]); 

  const handleDownloadPdf = () => {
    if (pdfBlob) {
      const fileName = `${pdfType === 'summary' ? 'Resumen_Solicitud' : 'Carta_Solicitud'}_${formData.codigo_expediente || 'pendiente'}.pdf`;
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); 
    } else {
      alert('El PDF no está listo para descargar. Por favor, espere o intente de nuevo.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {pdfType === 'summary' ? 'Previsualizar Resumen de Solicitud' : 'Previsualizar Carta de Solicitud'}
            {isLoading && <span className="ml-2 text-sm text-gray-500">Generando PDF...</span>}
          </DialogTitle>
        </DialogHeader>

        {/* Contenido oculto para html2canvas */}
        {pdfType && ( 
          <div ref={contentToRenderRef} style={{
            position: 'absolute',
            left: '-9999px', 
            width: '210mm', 
            overflow: 'hidden', 
            backgroundColor: 'white' 
          }}>
            {pdfType === 'summary' && <PDFSummary formData={formData} />}
            {pdfType === 'letter' && <RequestLetter formData={formData} />}
          </div>
        )}

        {/* Área de visualización del PDF */}
        <div className="flex-grow flex items-center justify-center bg-gray-100 rounded-md overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-700">Cargando previsualización...</p>
            </div>
          ) : pdfUrl ? (
            <iframe 
              key={pdfUrl} // <-- ¡Añadido para forzar el re-montaje del iframe!
              src={pdfUrl} 
              className="w-full h-full border-none" 
              title="Previsualización PDF"
            ></iframe>
          ) : (
            <div className="text-center text-red-600">
              <XCircle className="w-12 h-12 mx-auto mb-4" />
              <p>No se pudo generar la previsualización del PDF.</p>
              <p className="text-sm text-gray-500">Por favor, intente de nuevo.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={handleDownloadPdf} disabled={!pdfBlob || isLoading} className="flex items-center gap-2 pdf-download-button">
            <Download className="w-4 h-4" />
            Descargar PDF
          </Button>
          <Button onClick={onClose} variant="outline" className="pdf-download-button">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfViewerModal;
