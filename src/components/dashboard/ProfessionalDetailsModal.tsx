// src/components/requests/ProfessionalDetailsModal.jsx
import React, { useRef, useCallback } from 'react';
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

// Importamos los componentes de documentos que nos pasaste
import ApprovalLetter from '@/components/registration/ApprovalLetter';

// PDFSummary ya no se importa ni se usa

// Importamos jspdf y html2canvas para la generación de PDFs
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Asegúrate de que tu tipo Profesional incluye url_carnet y motivo_rechazo
import { type Profesional } from '@/hooks/useProfesionales';

interface ProfessionalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  professional: Profesional | null;
}

const ProfessionalDetailsModal = ({ isOpen, onClose, professional }: ProfessionalDetailsModalProps) => {
  const approvalLetterRef = useRef<HTMLDivElement>(null);
  // pdfSummaryRef ya no es necesario

  if (!professional) {
    return null; // No renderizar si no hay profesional seleccionado
  }

  // --- Función genérica para generar PDF a partir de un elemento HTML ---
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
      // Clona el elemento y lo adjunta temporalmente a un div oculto para asegurar que `html2canvas` lo vea en el DOM
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px'; // Mueve fuera de la vista
      tempContainer.style.width = '210mm'; // Asegura un ancho fijo para el renderizado A4
      tempContainer.style.height = '297mm';
      tempContainer.style.overflow = 'hidden';
      const contentToPrint = element.cloneNode(true) as HTMLElement;
      tempContainer.appendChild(contentToPrint);
      document.body.appendChild(tempContainer);

      // Pequeña pausa para asegurar que el contenido se ha adjuntado y renderizado en el DOM
      await new Promise(resolve => setTimeout(resolve, 50));

      const canvas = await html2canvas(contentToPrint, {
        scale: 2, // Mayor escala para mejor calidad de texto
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff', // Fondo blanco explícito
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
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
      // Limpiar el contenedor temporal
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
      'approval-letter-content-modal', // ID del div dentro del modal
      `carta-aprobacion-${professional.nombre || ''}-${professional.apellidos?.replace(/\s+/g, '-') || 'profesional'}.pdf`
    );
  };

  // handleDownloadSummary ya no es necesario

  const handleDownloadCarnet = () => {
    if (professional.url_carnet) {
      window.open(professional.url_carnet, '_blank');
      toast({
        title: "Carnet Abierto",
        description: "El carnet se ha abierto en una nueva pestaña para su visualización/descarga.",
      });
    } else {
      toast({
        title: "Carnet No Disponible",
        description: "La URL del carnet no está disponible para este profesional.",
        variant: "destructive",
      });
    }
  };

  // Prepara los datos para los componentes ApprovalLetter
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
    codigo_barras: professional.id,
    foto_carnet: professional.foto_carnet, // Aseguramos que esta propiedad se pasa
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Detalles y Documentos de Solicitud</DialogTitle>
        </DialogHeader>

        {/* Añadimos flex-col y flex-grow para que el contenido de las pestañas ocupe el espacio restante */}
        <Tabs defaultValue="details" className="flex-grow flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-3"> {/* Cambiamos a 3 columnas */}
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="approval-letter" disabled={professional.estado_solicitud !== 'Pendiente de Firma'}>Carta Aprobación</TabsTrigger>
            {/* Eliminamos la pestaña "Resumen Profesional" */}
            <TabsTrigger value="carnet" disabled={!professional.url_carnet || professional.estado_solicitud !== 'Pendiente de Firma'}>Carnet Digital</TabsTrigger>
          </TabsList>

          {/* Este div encapsula el contenido de las pestañas y gestiona su altura */}
          <div className="flex-grow overflow-hidden mt-4">
            <TabsContent value="details" className="h-full">
              {/* ScrollArea para el contenido de detalles */}
              <ScrollArea className="h-full p-4 rounded-md border">
                <h3 className="text-lg font-semibold mb-3">Información Completa del Profesional</h3>
                {professional.foto_carnet && ( // Solo si la URL de la foto existe
                  <div className="mb-4 text-center">
                    <p className="font-semibold mb-2">Foto del Carnet:</p>
                    <img
                      src={professional.foto_carnet}
                      alt="Foto del Profesional"
                      className="mx-auto border border-gray-300 shadow-md object-contain"
                      style={{ maxWidth: '200px', maxHeight: '250px' }} // Ajusta el tamaño de la previsualización
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
              {/* El ScrollArea ahora es flex-grow, permitiendo que su contenido lo desborde y active el scroll */}
              <ScrollArea className="flex-grow p-4 rounded-md border bg-gray-50">
                <div id="approval-letter-content-modal" className="max-w-[210mm] mx-auto bg-white" style={{ padding: '20mm', minHeight: '297mm', fontSize: '11px', lineHeight: '1.4' }}>
                  <ApprovalLetter formData={formDataForDocuments} onDownload={() => {}} />
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Eliminamos completamente la TabsContent para "summary" */}

            <TabsContent value="carnet" className="h-full flex flex-col">
              <div className="flex justify-end mb-2">
                <Button onClick={handleDownloadCarnet} className="flex items-center gap-2" disabled={!professional.url_carnet}>
                  <Download className="w-4 h-4" />
                  Descargar Carnet
                </Button>
                {professional.url_carnet && (
                  <Button variant="outline" onClick={() => window.open(professional.url_carnet, '_blank')} className="ml-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Abrir en Nueva Pestaña
                  </Button>
                )}
              </div>
              <ScrollArea className="flex-grow p-4 rounded-md border bg-gray-50 flex items-center justify-center">
                {professional.url_carnet ? (
                  <img
                    src={professional.url_carnet}
                    alt="Carnet Digital del Profesional"
                    className="max-w-full max-h-full object-contain"
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
