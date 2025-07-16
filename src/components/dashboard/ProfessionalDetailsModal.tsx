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
import { toast } from '@/hooks/use-toast'; // Asumo que tienes use-toast en este path

// Importamos los componentes de documentos que nos pasaste
import ApprovalLetter from '@/components/registration/ApprovalLetter'; // Ajusta el path si es diferente
import PDFSummary from '@/components/registration/PDFSummary';     // Ajusta el path si es diferente

// Importamos jspdf y html2canvas para la generación de PDFs
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Asegúrate de que tu tipo Profesional incluye url_carnet y motivo_rechazo
// Puedes importarlo desde tu useProfesionales.ts o definirlo aquí si prefieres
import { type Profesional } from '@/hooks/useProfesionales'; 

interface ProfessionalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  professional: Profesional | null;
}

const ProfessionalDetailsModal = ({ isOpen, onClose, professional }: ProfessionalDetailsModalProps) => {
  const approvalLetterRef = useRef<HTMLDivElement>(null);
  const pdfSummaryRef = useRef<HTMLDivElement>(null);

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
      // Esto es crucial para generar PDFs de elementos que no están siempre visibles
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px'; // Mueve fuera de la vista
      tempContainer.style.width = '210mm'; // Asegura un ancho fijo para el renderizado A4
      tempContainer.style.height = '297mm';
      tempContainer.style.overflow = 'hidden';
      // Importante: clona el nodo para evitar modificar el original y sus listeners
      const contentToPrint = element.cloneNode(true) as HTMLElement; 
      tempContainer.appendChild(contentToPrint);
      document.body.appendChild(tempContainer);


      const canvas = await html2canvas(contentToPrint, {
        scale: 2, // Mayor escala para mejor calidad de texto
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff', // Fondo blanco explícito
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' size
      
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
    generatePdfFromHtml(
      'approval-letter-content-modal', // ID del div dentro del modal
      `carta-aprobacion-${professional.nombre || ''}-${professional.apellidos?.replace(/\s+/g, '-') || 'profesional'}.pdf`
    );
  };

  const handleDownloadSummary = () => {
    generatePdfFromHtml(
      'pdf-summary-content-modal', // ID del div dentro del modal
      `resumen-profesional-${professional.nombre || ''}-${professional.apellidos?.replace(/\s+/g, '-') || 'profesional'}.pdf`
    );
  };

  const handleDownloadCarnet = () => {
    if (professional.url_carnet) {
      window.open(professional.url_carnet, '_blank'); // Abre en una nueva pestaña para descargar/ver
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

  // Prepara los datos para los componentes ApprovalLetter y PDFSummary
  // Asegúrate de que los nombres de las propiedades coincidan con lo que esperan tus componentes
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
    codigo_expediente: professional.id, // Usamos el ID de la solicitud como código de expediente
    // Si 'foto_carnet_base64' o 'codigo_barras' no vienen de la BD, deberías manejarlos
    // Por ahora, asumimos que professional puede tener estas propiedades si las usas en PDFSummary
    foto_carnet_base64: professional.foto_carnet_base64, // Asume que viene en el objeto Profesional si se usa
    codigo_barras: professional.id, // Puedes usar el ID como código de barras si no tienes uno específico
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Detalles y Documentos de Solicitud</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="flex-grow flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="approval-letter" disabled={professional.estado_solicitud !== 'Pendiente de Firma'}>Carta Aprobación</TabsTrigger>
            <TabsTrigger value="summary" disabled={professional.estado_solicitud !== 'Pendiente de Firma'}>Resumen Profesional</TabsTrigger>
            <TabsTrigger value="carnet" disabled={!professional.url_carnet || professional.estado_solicitud !== 'Pendiente de Firma'}>Carnet Digital</TabsTrigger>
          </TabsList>
          
          <div className="flex-grow overflow-hidden mt-4">
            <TabsContent value="details" className="h-full">
              <ScrollArea className="h-full p-4 rounded-md border">
                <h3 className="text-lg font-semibold mb-3">Información Completa del Profesional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* Aquí puedes mostrar todos los detalles relevantes del profesional */}
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
                  {/* ...otros campos que quieras mostrar... */}
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
              <ScrollArea className="flex-grow p-4 rounded-md border bg-gray-50">
                {/* Contenedor con ID para html2canvas */}
                <div id="approval-letter-content-modal" className="max-w-[210mm] mx-auto bg-white" style={{ padding: '20mm', minHeight: '297mm', fontSize: '11px', lineHeight: '1.4' }}>
                  <ApprovalLetter formData={formDataForDocuments} onDownload={() => {}} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="summary" className="h-full flex flex-col">
              <div className="flex justify-end mb-2">
                <Button onClick={handleDownloadSummary} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Descargar Resumen
                </Button>
              </div>
              <ScrollArea className="flex-grow p-4 rounded-md border bg-gray-50">
                {/* Contenedor con ID para html2canvas */}
                <div id="pdf-summary-content-modal" className="max-w-[210mm] mx-auto bg-white" style={{ padding: '20mm', minHeight: '297mm' }}>
                  <PDFSummary formData={formDataForDocuments} />
                </div>
              </ScrollArea>
            </TabsContent>

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
