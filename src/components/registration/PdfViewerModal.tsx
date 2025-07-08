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
  // Ref para el contenido que se va a convertir a PDF
  const contentToRenderRef = useRef<HTMLDivElement>(null);
  // Estado para la URL del PDF generado (para el iframe)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  // Estado para el spinner de carga
  const [isLoading, setIsLoading] = useState(true);
  // Estado para almacenar el blob del PDF para la descarga directa
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  // Función para generar el PDF y obtener su URL/Blob
  const generatePdfContent = useCallback(async () => {
    setIsLoading(true);
    setPdfUrl(null);
    setPdfBlob(null);

    // Renderizamos el componente de contenido en un div oculto para que html2canvas lo capture
    // Se renderiza directamente en el DOM para que html2canvas pueda acceder a él.
    // Podríamos usar un portal o renderizarlo condicionalmente en el modal.
    // Para simplificar, lo renderizamos aquí y lo capturamos.
    // Nota: En un entorno de producción, para renderizar componentes React en un div temporal
    // y luego destruirlos, se usaría ReactDOM.render y ReactDOM.unmountComponentAtNode
    // o un enfoque más avanzado como un portal. Para este ejemplo, confiamos en el ref.

    // Creamos un elemento temporal para renderizar el contenido y capturarlo
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px'; // Lo movemos fuera de la vista
    tempDiv.style.width = '210mm'; // Ancho A4 para la captura
    document.body.appendChild(tempDiv);

    // Renderizamos el componente React dentro del div temporal
    // No podemos renderizar JSX directamente en un div creado con document.createElement
    // Necesitaríamos ReactDOM.render, pero eso complica el ejemplo en un solo archivo.
    // En su lugar, vamos a pasar el ref directamente al componente que se renderiza en el modal.
    // Y el componente del modal tendrá el ref.

    // La lógica de captura se hará directamente sobre el contenido del modal,
    // que es donde `contentToRenderRef` apuntará.

    if (!contentToRenderRef.current) {
      console.error('No se encontró el elemento para generar el PDF.');
      setIsLoading(false);
      return;
    }

    try {
      const canvas = await html2canvas(contentToRenderRef.current, {
        scale: 2, // Aumenta la escala para mejor calidad de texto e imágenes
        useCORS: true, // Habilita el uso de CORS para imágenes externas
        allowTaint: true, // Permite "taint" el canvas con contenido de origen cruzado (puede limitar toDataURL)
        backgroundColor: '#ffffff', // Fondo blanco para el PDF
        // Ignorar el botón de descarga si está dentro del área a capturar
        ignoreElements: (element) => {
          return element.classList.contains('pdf-download-button');
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // Ancho A4 en mm
      const pageHeight = 295; // Alto A4 en mm
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

      const pdfOutput = pdf.output('blob'); // Obtiene el PDF como un Blob
      const url = URL.createObjectURL(pdfOutput); // Crea una URL para el Blob
      
      setPdfUrl(url);
      setPdfBlob(pdfOutput); // Guarda el Blob para la descarga directa
    } catch (error) {
      console.error('Error generando PDF para previsualización:', error);
      setPdfUrl(null);
    } finally {
      setIsLoading(false);
      // No necesitamos eliminar tempDiv si usamos contentToRenderRef directamente en el modal
    }
  }, [formData, pdfType]); // Regenerar cuando cambien los datos o el tipo de PDF

  // Efecto para generar el PDF cuando el modal se abre o cambia el tipo de PDF
  useEffect(() => {
    if (isOpen && pdfType) {
      generatePdfContent();
    } else {
      // Limpiar URL y Blob cuando el modal se cierra
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
        setPdfBlob(null);
      }
    }
  }, [isOpen, pdfType, generatePdfContent, pdfUrl]);

  // Función para descargar el PDF directamente desde el Blob
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
      URL.revokeObjectURL(url); // Limpiar la URL del Blob
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
        {/* Este div contendrá el componente PDF real para que html2canvas lo capture */}
        <div ref={contentToRenderRef} style={{
          position: 'absolute',
          left: '-9999px', // Mueve el div fuera de la vista
          width: '210mm', // Ancho A4 para la captura
          height: '297mm', // Alto A4 para la captura
          overflow: 'hidden', // Evita barras de desplazamiento si el contenido es grande
          backgroundColor: 'white' // Asegura un fondo blanco para la captura
        }}>
          {pdfType === 'summary' && <PDFSummary formData={formData} />}
          {pdfType === 'letter' && <RequestLetter formData={formData} />}
        </div>

        {/* Área de visualización del PDF */}
        <div className="flex-grow flex items-center justify-center bg-gray-100 rounded-md overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-700">Cargando previsualización...</p>
            </div>
          ) : pdfUrl ? (
            <iframe src={pdfUrl} className="w-full h-full border-none" title="Previsualización PDF"></iframe>
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
