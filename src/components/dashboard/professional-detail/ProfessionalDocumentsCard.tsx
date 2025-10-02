import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Profesional } from '@/hooks/useProfesionales';
// Asegúrate de que esta ruta sea correcta para tu proyecto
import AdditionalDocuments from '@/components/AdditionalDocuments'; 
import ApprovalLetter from './ApprovalLetter'; 

// Importaciones para PDF (generación en cliente)
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ProfessionalDocumentsCardProps {
  professional: Profesional;
  // Prop para notificar al componente padre sobre la actualización de documentos adicionales
  onDocumentsUpdate?: (documents: string[]) => void;
}

const ProfessionalDocumentsCard = ({ professional, onDocumentsUpdate }: ProfessionalDocumentsCardProps) => {
  const { toast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Lógica para determinar la fecha del documento de Resolución
  const getDocumentDate = (dateString?: string | null) => {
    // Si la solicitud está Aprobada, usamos la fecha de aprobación del registro.
    if (professional.estado_solicitud === 'Aprobado' && dateString) {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    // Si está 'Pendiente de Firma' o es el primer acceso (Aprobado sin fecha), usamos la fecha actual.
    // El 'Pendiente de Firma' es el primer estado donde se genera la carta por primera vez.
    return new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const documentDate = getDocumentDate(professional.fecha_aprobacion);

  const handleGenerateAndDownloadResolution = async () => {
    setIsGeneratingPdf(true);
    try {
      // 1. Obtener el elemento que contiene la plantilla ApprovalLetter
      const element = document.getElementById('approval-letter-content-capture-target');
      if (!element) {
        throw new Error("No se encontró el contenido de la carta para la captura.");
      }
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      // 2. Generar PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Manejo de múltiples páginas
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 3. Descargar
      pdf.save(
        `Resolucion-${professional.nombre_completo?.replace(/\s+/g, "-") || "profesional"}.pdf`,
      );

      toast({
        title: "Descarga completada",
        description: "La Carta de Resolución ha sido generada y descargada.",
      });

    } catch (error) {
      console.error("Error al generar la Carta de Resolución:", error);
      toast({
        title: "Error en la descarga",
        description: "No se pudo generar ni descargar la Carta de Resolución.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-purple-600" />
          <span>Documentos del Expediente</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Contenedor Oculto de la Carta de Resolución para la Captura */}
        {/* Es crucial renderizar este componente *fuera* de la vista pero en el DOM
            para que html2canvas pueda capturarlo al hacer clic en el botón.
        */}
        <div 
          style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm', zIndex: -1 }}
        >
          <ApprovalLetter professional={professional} documentDate={documentDate} />
        </div>

        {/* Documentos Oficiales */}
        <div className="space-y-3">
          <h4 className="font-semibold text-base mb-2 border-b pb-1">Documentos Oficiales</h4>
          
          {/* Carnet Profesional */}
          {professional.numero_carnet_profesional && (
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => window.open(`/api/documents/carnet/${professional.id}`, '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              Carnet Profesional (PDF)
            </Button>
          )}
          
          {/* Ficha de Solicitud */}
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => window.open(`/api/documents/solicitud/${professional.id}`, '_blank')}
          >
            <Download className="w-4 h-4 mr-2" />
            Ficha de Solicitud (PDF)
          </Button>

          {/* Carta de Resolución (Generación en Cliente) */}
          {(professional.estado_solicitud === 'Aprobado' || professional.estado_solicitud === 'Pendiente de Firma') && (
            <Button 
              variant="default" // Destacar
              className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleGenerateAndDownloadResolution}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando Resolución...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Carta de Resolución (PDF)
                </>
              )}
            </Button>
          )}
        </div>
        
        <Separator />
        
        {/* Documentos Adicionales (Integrado) */}
        <div className='space-y-4'>
          <h4 className="font-semibold text-base mb-2 border-b pb-1">Documentos Adicionales</h4>
          {/* Se pasa el professionalId y los documentos_adicionales (urls) para visualizar y subir */}
          <AdditionalDocuments 
            professionalId={professional.id}
            existingDocuments={professional.documentos_adicionales}
            onDocumentsUpdate={onDocumentsUpdate}
          />
        </div>

      </CardContent>
    </Card>
  );
};

export default ProfessionalDocumentsCard;
