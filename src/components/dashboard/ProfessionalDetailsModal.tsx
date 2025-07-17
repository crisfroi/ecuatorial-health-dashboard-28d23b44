import React, { useRef, useCallback } from 'react'; // Eliminamos useState y useEffect
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import ApprovalLetter from '@/components/registration/ApprovalLetter';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { type Profesional } from '@/hooks/useProfesionales';

interface ProfessionalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  professional: Profesional | null;
}

const ProfessionalDetailsModal = ({ isOpen, onClose, professional }: ProfessionalDetailsModalProps) => {
  const approvalLetterRef = useRef<HTMLDivElement>(null);
  // Eliminamos const [svgContent, setSvgContent] = useState<string | null>(null);
  // Eliminamos el useEffect para fetchSvg

  if (!professional) {
    return null; // No renderizar si no hay profesional seleccionado
  }

  const generatePdfFromHtml = useCallback(async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with ID '${elementId}' not found for PDF generation.`);
      toast({
        title: "Error de Generación",
        description: "No se pudo encontrar el contenido para generar el PDF.",
        variant: "destructive",
      });
      return;
    }

    try {
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.height = '297mm'; // A4 height
      tempContainer.style.overflow = 'hidden';
      const contentToPrint = element.cloneNode(true) as HTMLElement;
      tempContainer.appendChild(contentToPrint);
      document.body.appendChild(tempContainer);

      await new Promise(resolve => setTimeout(resolve, 50));

      const canvas = await html2canvas(contentToPrint, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
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

      pdf.save(filename);
      toast({
        title: "Descarga Exitosa",
        description: `"${filename}" ha sido generado y descargado.`,
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error de Generación",
        description: "Hubo un problema al generar el PDF. Inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      if (tempContainer && tempContainer.parentNode) {
        document.body.removeChild(tempContainer);
      }
    }
  }, []);

  const handleDownloadLetter = () => {
    toast({
      title: "Generando Carta",
      description: "Por favor, espere mientras se genera la carta de aprobación...",
      duration: 3000,
    });
    generatePdfFromHtml(
      'approval-letter-content-modal',
      `carta-aprobacion-${professional.nombre || ''}-${professional.apellidos?.replace(/\s+/g, '-') || 'profesional'}.pdf`
    );
  };

  const handleDownloadCarnetAsPdf = useCallback(async () => {
    toast({
        title: "Generando Carnet PDF",
        description: "Por favor, espere mientras se genera el Carnet Digital en formato PDF...",
        duration: 3000,
    });

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm'; // A4 width for rendering
    tempDiv.style.height = '297mm'; // A4 height for rendering
    tempDiv.style.overflow = 'hidden';
    document.body.appendChild(tempDiv);

    let root = null;
    let renderedContent;

    if (professional.url_carnet) {
      // Simplemente usa la etiqueta img para la captura, ya que html2canvas puede procesarla
      // con el SVG referenciado directamente.
      renderedContent = (
          <img
              src={professional.url_carnet}
              alt="Carnet Digital del Profesional"
              style={{ width: '210mm', height: '297mm', objectFit: 'contain' }}
              onError={(e) => {
                // Fallback si la imagen no carga, similar a ProfessionalCardInfo
                e.currentTarget.onerror = null;
                e.currentTarget.alt = "Error al cargar el carnet para PDF";
                e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDI0MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI0MC”IGhlaWdodD0iMTUwIiByeD0iOCIgZmlsbD0iI0QwRTRGRiIvPjxwYXRoIGQ9Ik01MCAyNUgxOTB2MTAwSDU1UVMxMDAgNTAgNTAgMjVaTTEyMCA4NUgxNTBNOTAgODVIMTIwTTYwIDg1SDkwTTEyMCAxMTFIMTUwTTkwIDExMUgxMjBNNjAgMTExSDkwIiBzdHJva2U9IiMzRDZDQkJGQyIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48dGV4dCB4PSIxMjAiIHk9IjkwIiBmb250LWZhbi1taWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UHJldmlzdWFsaXphY2kmbmE7biBmYWxsaWRhPC90ZXh0PjwvZ3ZAPjwvdmc+";
              }}
          />
      );
    } else {
        renderedContent = <p>Carnet no disponible para PDF.</p>;
    }

    if ((window as any).ReactDOM && (window as any).ReactDOM.createRoot) {
        root = (window as any).ReactDOM.createRoot(tempDiv);
        root.render(renderedContent);
    } else if ((window as any).ReactDOM) {
        (window as any).ReactDOM.render(renderedContent, tempDiv);
    } else {
        console.error("ReactDOM no está disponible globalmente. La generación de PDF puede fallar.");
        toast({ title: "Error", description: "Configuración de React incompleta para PDF.", variant: "destructive" });
        if (tempDiv.parentNode === document.body) {
            document.body.removeChild(tempDiv);
        }
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 50)); // Give time for rendering

    try {
        const canvas = await html2canvas(tempDiv, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295; // A4 height
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

        pdf.save(`carnet-${professional.nombre || ''}-${professional.apellidos?.replace(/\s+/g, '-') || 'profesional'}.pdf`);
        toast({
            title: "Descarga Exitosa",
            description: "El Carnet Digital ha sido generado y descargado como PDF.",
        });
    } catch (error) {
        console.error("Error generating carnet PDF:", error);
        toast({
            title: "Error de Generación",
            description: "Hubo un problema al generar el Carnet Digital como PDF. Inténtelo de nuevo.",
            variant: "destructive",
        });
    } finally {
        if (root) {
            root.unmount();
        } else {
            (window as any).ReactDOM.unmountComponentAtNode(tempDiv);
        }
        if (tempDiv.parentNode === document.body) {
            document.body.removeChild(tempDiv);
        }
    }
  }, [professional]); // Se eliminó svgContent de las dependencias

  // Función para descarga directa de SVG usando Blob (ahora hace su propio fetch)
  const handleDownloadCarnetSvg = useCallback(async () => {
    if (!professional.url_carnet) {
      toast({
        title: "Carnet No Disponible",
        description: "La URL del carnet no está disponible para este profesional.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Realizar un fetch en el momento de la descarga para obtener el contenido del SVG
      const response = await fetch(professional.url_carnet);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const svgBlob = await response.blob();

      const url = window.URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `carnet-${professional.nombre || ''}-${professional.apellidos?.replace(/\s+/g, '-') || 'profesional'}.svg`;
      link.download = filename; // Forzar descarga
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // Limpiar la URL del objeto Blob

      toast({
        title: "Descarga Iniciada",
        description: "El carnet digital (SVG) se está descargando.",
      });
    } catch (error) {
      console.error("Error al descargar el carnet SVG:", error);
      toast({
        title: "Error de Descarga",
        description: "Hubo un problema al descargar el Carnet Digital (SVG). Inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  }, [professional]);


  const formDataForDocuments = {
    ...professional,
    nombre: professional.nombre || '',
    apellidos: professional.apellidos || '',
    numero_dip: professional.numero_dip || '',
    numero_pasaporte: professional.numero_pasaporte || '',
    area_profesional: professional.area_profesional || '',
    especialidad: professional.especialidad || 'No especificada',
    titulacion_especifica_1: professional.titulacion_especifica_1 || '',
    institucion_1: professional.institucion_1 || '',
    pais_formacion_1: professional.pais_formacion_1 || '',
    genero: professional.genero || '',
    nacionalidad: professional.nacionalidad || '',
    fecha_nacimiento: professional.fecha_nacimiento ? new Date(professional.fecha_nacimiento).toLocaleDateString('es-ES') : 'N/A',
    edad: professional.fecha_nacimiento ? Math.floor((new Date().getTime() - new Date(professional.fecha_nacimiento).getTime()) / (31557600000)) : 'N/A',
    telefono: professional.telefono || '',
    domicilio: professional.domicilio || '',
    provincia: professional.provincia || '',
    distrito: professional.distrito || '',
    categoria_titulacion: professional.categoria_titulacion || '',
    periodo_formacion: professional.periodo_formacion || '',
    situacion_laboral: professional.situacion_laboral || '',
    nombre_centro: professional.nombre_centro || '',
    categoria_centro: professional.categoria_centro || '',
    tipo_sector: professional.tipo_sector || '',
    distrito_sanitario: professional.distrito_sanitario || '',
    pertenece_brigada_medica: professional.pertenece_brigada_medica,
    tipo_cooperacion: professional.tipo_cooperacion || '',
    codigo_expediente: professional.codigo_expediente,
    foto_carnet_base64: professional.foto_carnet_base64,
    codigo_barras: professional.url_codigo_barras_expediente,
    foto_carnet: professional.foto_carnet,
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Detalles y Documentos de Solicitud</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-grow flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="approval-letter" disabled={professional.estado_solicitud !== 'Pendiente de Firma'}>Carta Aprobación</TabsTrigger>
            <TabsTrigger value="carnet" disabled={!professional.url_carnet || professional.estado_solicitud !== 'Pendiente de Firma'}>Carnet Digital</TabsTrigger>
          </TabsList>

          {/* Eliminado overflow-hidden de este div para permitir que ScrollArea gestione su propio desbordamiento */}
          <div className="flex-grow mt-4">
            <TabsContent value="details" className="h-full">
              <ScrollArea className="h-full p-4 rounded-md border min-h-0 max-h-[calc(90vh-200px)]">
                <h3 className="text-lg font-semibold mb-3">Información Completa del Profesional</h3>
                {professional.foto_carnet && (
                  <div className="mb-4 text-center">
                    <p className="font-semibold mb-2">Foto del Carnet:</p>
                    <img
                      src={professional.foto_carnet}
                      alt="Foto del Profesional"
                      className="mx-auto border border-gray-300 shadow-md object-contain"
                      style={{ maxWidth: '200px', maxHeight: '250px' }}
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                   <p><strong>Código de Expediente:</strong> {formDataForDocuments.codigo_expediente}</p>
                   <p><strong>Nombre Completo:</strong> {formDataForDocuments.nombre} {formDataForDocuments.apellidos}</p>
                   <p><strong>Nacionalidad:</strong> {formDataForDocuments.nacionalidad}</p>
                   <p><strong>DIP/Pasaporte:</strong> {formDataForDocuments.numero_dip || formDataForDocuments.numero_pasaporte}</p>
                   <p><strong>Fecha de Nacimiento:</strong> {formDataForDocuments.fecha_nacimiento}</p>
                   <p><strong>Género:</strong> {formDataForDocuments.genero}</p>
                   <p><strong>Teléfono:</strong> {formDataForDocuments.telefono}</p>
                   <p><strong>Email:</strong> {professional.email}</p>
                   <p><strong>Domicilio:</strong> {formDataForDocuments.domicilio}, {formDataForDocuments.distrito}, {formDataForDocuments.provincia}</p>
                   <p><strong>Área Profesional:</strong> {formDataForDocuments.area_profesional}</p>
                   <p><strong>Especialidad:</strong> {formDataForDocuments.especialidad}</p>
                   <p><strong>Titulación:</strong> {formDataForDocuments.titulacion_especifica_1}</p>
                   <p><strong>Institución:</strong> {formDataForDocuments.institucion_1}</p>
                   <p><strong>País de Formación:</strong> {formDataForDocuments.pais_formacion_1}</p>
                   <p><strong>Situación Laboral:</strong> {formDataForDocuments.situacion_laboral}</p>
                   <p><strong>Centro de Trabajo:</strong> {formDataForDocuments.nombre_centro}</p>
                   <p><strong>Estado de Solicitud:</strong> {professional.estado_solicitud}</p>
                   {professional.motivo_rechazo && (
                     <p className="col-span-2 text-red-600"><strong>Motivo de Rechazo:</strong> {professional.motivo_rechazo}</p>
                   )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="approval-letter" className="h-full flex flex-col">
              <div className="flex justify-end mb-2">
                <Button onClick={handleDownloadLetter} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Descargar Carta
                </Button>
              </div>
              <ScrollArea className="flex-grow p-4 rounded-md border bg-gray-50 min-h-0 max-h-[calc(90vh-200px)]">
                <div id="approval-letter-content-modal" className="max-w-[210mm] mx-auto bg-white" style={{ padding: '20mm', minHeight: '297mm', fontSize: '11px', lineHeight: '1.4' }}>
                  <ApprovalLetter formData={formDataForDocuments} onDownload={() => {}} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="carnet" className="h-full flex flex-col">
              <div className="flex justify-end mb-2">
                <Button onClick={handleDownloadCarnetAsPdf} className="flex items-center gap-2" disabled={!professional.url_carnet}>
                  <Download className="w-4 h-4" />
                  Descargar Carnet (PDF)
                </Button>
                {/* Botón para descargar el SVG directamente */}
                <Button onClick={handleDownloadCarnetSvg} className="ml-2 flex items-center gap-2" disabled={!professional.url_carnet}>
                  <Download className="w-4 h-4" />
                  Descargar Carnet (SVG)
                </Button>
              </div>
              <ScrollArea className="flex-grow p-4 rounded-md border bg-gray-50 flex items-center justify-center min-h-0 max-h-[calc(90vh-200px)]">
                {professional.url_carnet ? (
                    // Siempre usar la etiqueta img para la previsualización directa
                    <img
                      src={professional.url_carnet}
                      alt="Carnet Digital del Profesional"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        // Fallback SVG si hay un error de carga, similar a ProfessionalCardInfo
                        e.currentTarget.onerror = null; // Evita bucle infinito si la URL de fallback también falla
                        e.currentTarget.alt = "Error al cargar el carnet";
                        e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDI0MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI0MC”IGhlaWdodD0iMTUwIiByeD0iOCIgZmlsbD0iI0QwRTRGRiIvPjxwYXRoIGQ9Ik01MCAyNUgxOTB2MTAwSDU1UVMxMDAgNTAgNTAgMjVaTTEyMCA4NUgxNTBNOTAgODVIMTIwTTYwIDg1SDkwTTEyMCAxMTFIMTUwTTkwIDExMUgxMjBNNjAgMTExSDkwIiBzdHJva2U9IiMzRDZDQkJGQyIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48dGV4dCB4PSIxMjAiIHk9IjMwIiBmb250LWZhbi1taWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VmlzdGEgQmFzaWNhIGRlIENhcm5ldDwvdGV4dD48L2N2Zz4=";
                      }}
                    />
                ) : (
                  <p className="text-gray-500">Carnet digital no disponible o aún no generado para este profesional.</p>
                )}
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProfessionalDetailsModal;
