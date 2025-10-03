import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Profesional } from '@/hooks/useProfesionales';
import AdditionalDocuments from '@/components/AdditionalDocuments'; 
import ApprovalLetter from '@/components/registration/ApprovalLetter.tsx';

// Importaciones para PDF (generación en cliente)
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ProfessionalDocumentsCardProps {
  professional: Profesional; // Ahora incluye fecha_generacion_resolucion
  onDocumentsUpdate?: (documents: string[]) => void;
}

const ProfessionalDocumentsCard = ({ professional, onDocumentsUpdate }: ProfessionalDocumentsCardProps) => {
  const { toast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Lógica para obtener la fecha de emisión del documento (LA CLAVE)
  const getDocumentDate = (p: Profesional) => {
    
    // 1. **PRIORIDAD (La fecha fija):** Usamos la fecha generada por el trigger de la DB 
    // cuando el estado pasó por primera vez a 'Pendiente de Firma'.
    if (p.fecha_generacion_resolucion) {
      return new Date(p.fecha_generacion_resolucion).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    // 2. **FALLBACK:** Si el campo no se ha poblado (ej. expedientes muy antiguos), 
    // usamos la fecha de aprobación final (comportamiento anterior).
    if (p.estado_solicitud === 'Aprobado' && p.fecha_aprobacion) {
        return new Date(p.fecha_aprobacion).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    // 3. **INICIAL:** Si el estado es 'Pendiente de Firma' pero el trigger aún no se ejecutó 
    // (o el hook no se refrescó), usamos la fecha actual.
    // NOTA: Este caso es muy improbable con el trigger, pero sirve de seguridad.
    return new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const documentDate = getDocumentDate(professional);

  const handleGenerateAndDownloadResolution = async () => {
    setIsGeneratingPdf(true);
    
    try {
      // 1. Obtener el elemento que contiene la plantilla ApprovalLetter
      const element = document.getElementById('approval-letter-content-capture-target');
      if (!element) {
        throw new Error("No se encontró el contenido de la carta para la captura.");
      }
      
      // La clave: Asegurar que el componente de la carta está visible para html2canvas
      // Si la carta está oculta (display: none), html2canvas no funcionará.
      // Se utiliza una posición absoluta fuera de la vista (-9999px) con un tamaño fijo (210mm)
      // para que html2canvas pueda renderizar las dimensiones correctas.

      const canvas = await html2canvas(element, {
        scale: 2, // Mejora la calidad de la imagen
        useCORS: true,
        allowTaint: true,
      });

      // 2. Generar PDF (misma lógica que antes)
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // Ancho A4 en mm
      const pageHeight = 295; // Alto A4 en mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Manejo de múltiples páginas
      while (heightLeft > -1) { // Ligeramente ajustado para asegurar la última sección
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
        {/* La clave aquí es que el componente SÍ debe estar en el DOM para la captura */}
        <div 
          style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm', zIndex: -1 }}
        >
          {/* Se pasa el objeto professional completo y la fecha de documento fija */}
          <ApprovalLetter professional={professional} documentDate={documentDate} />
        </div>

        {/* Documentos Oficiales VISIBLES */}
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
          {/* Asumiendo que este endpoint existe */}
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
              variant="default"
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
