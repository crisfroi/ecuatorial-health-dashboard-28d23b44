import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, X, Download, FileText, ChevronDown } from "lucide-react";
import {
  useNotificationCount,
  useSendSMSNotification,
} from "@/hooks/useSMSNotifications";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import type { Profesional } from "@/hooks/useProfesionales";
import PersonalInfoCard from "./professional-detail/PersonalInfoCard";
import EducationCard from "./professional-detail/EducationCard";
import WorkplaceCard from "./professional-detail/WorkplaceCard";
import ProfessionalCardInfo from "./professional-detail/ProfessionalCardInfo";
// NUEVOS COMPONENTES
import StatusCard from "./professional-detail/StatusCard"; 
import ProfessionalDocumentsCard from "./professional-detail/ProfessionalDocumentsCard";
import NotificationAlerts from "./professional-detail/NotificationAlerts";
import { ParametrosPersonalizadosCard } from "./professional-detail/ParametrosPersonalizadosCard";
import { DisciplinaryHistoryCard } from "./professional-detail/DisciplinaryHistoryCard";

interface ProfessionalDetailProps {
  professional: Profesional;
  onClose: () => void;
  // Prop opcional para que el padre pueda actualizar el estado del profesional
  onProfessionalUpdate?: (updatedProfessional: Profesional) => void; 
}

const ProfessionalDetail = ({
  professional,
  onClose,
  onProfessionalUpdate,
}: ProfessionalDetailProps) => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  
  // 1. Hook (Corregido el error 'Cannot read properties of null')
  const [localDocuments, setLocalDocuments] = useState(professional?.documentos_adicionales || []); 

  // 2. Hook (Corregido el error 'Cannot read properties of null')
  const { data: notificationCount } = useNotificationCount(professional?.id); 
  
  // 3. Hook
  const sendSMSMutation = useSendSMSNotification();

  // 4. Hook (Este fue el hook que fallaba al ser omitido condicionalmente)
  // Sincronizar documentos locales con el prop inicial si cambia el ID del profesional
  useEffect(() => { 
      setLocalDocuments(professional?.documentos_adicionales || []);
  }, [professional?.id]);

  // 🚀 LÍNEA CRUCIAL CORREGIDA: La verificación CONDICIONAL debe ir DESPUÉS de TODOS los Hooks.
  if (!professional) return null;


  // --- LÓGICA DE NEGOCIO (DESPUÉS DE LA VERIFICACIÓN DE NULIDAD) ---

  // Función para calcular días hasta renovación
  const calculateDaysUntilRenewal = (validityDate?: string) => {
    if (!validityDate) return null;
    const today = new Date();
    const validity = new Date(validityDate);
    const diffTime = validity.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilRenewal = calculateDaysUntilRenewal(
    professional.fecha_caducidad,
  );
  const isRenewalSoon = daysUntilRenewal !== null && daysUntilRenewal <= 30;

  // Función para manejar la actualización de los documentos desde el sub-componente
  const handleDocumentsUpdate = (documents: string[]) => {
    setLocalDocuments(documents); 
    // Notificar al componente padre de que la lista de documentos ha cambiado
    if (onProfessionalUpdate) {
        onProfessionalUpdate({
            ...professional,
            documentos_adicionales: documents,
        });
    }
  };

  const handleDownload = async (format: "pdf" | "png") => {
    setIsDownloading(true);
    try {
      const element = document.getElementById("professional-detail-content");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      if (format === "png") {
        const link = document.createElement("a");
        link.download = `perfil-${professional.nombre_completo?.replace(/\s+/g, "-") || "profesional"}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } else {
        const pdf = new jsPDF("p", "mm", "a4");
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(
          `perfil-${professional.nombre_completo?.replace(/\s+/g, "-") || "profesional"}.pdf`,
        );
      }

      toast({
        title: "Descarga completada",
        description: `El perfil se ha descargado en formato ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Error al descargar:", error);
      toast({
        title: "Error en la descarga",
        description: "No se pudo completar la descarga",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendSMS = async (tipoNotificacion: string) => {
    // Lógica para enviar SMS (mantenida igual)
    if (!professional.telefono) {
      toast({
        title: "Sin teléfono",
        description: "Este profesional no tiene número de teléfono registrado",
        variant: "destructive",
      });
      return;
    }

    let mensaje = "";
    if (tipoNotificacion === "30_dias_antes") {
      mensaje = `Estimado/a ${professional.nombre_completo}, su carnet profesional vence el ${professional.fecha_caducidad || "pronto"}. Por favor, renueve antes del vencimiento. Ministerio de Sanidad - Guinea Ecuatorial`;
    } else if (tipoNotificacion === "10_dias_despues") {
      mensaje = `Estimado/a ${professional.nombre_completo}, su carnet profesional venció el ${professional.fecha_caducidad || "recientemente"}. Debe renovar urgentemente. Contacte al Ministerio de Sanidad - Guinea Ecuatorial`;
    }

    try {
      await sendSMSMutation.mutateAsync({
        profesionalId: professional.id,
        telefono: professional.telefono,
        tipoNotificacion,
        mensaje,
      });

      toast({
        title: "SMS enviado",
        description: "La notificación SMS ha sido enviada exitosamente",
      });
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el SMS",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={!!professional} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Perfil Profesional Detallado</span>
            </span>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isDownloading}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleDownload("pdf")}>
                    <FileText className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload("png")}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PNG
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div id="professional-detail-content">
          <NotificationAlerts
            isRenewalSoon={isRenewalSoon}
            daysUntilRenewal={daysUntilRenewal}
            validityDate={professional.fecha_caducidad}
            notificationCount={notificationCount}
            onSendSMS={handleSendSMS}
          />

          <div className="columns-1 md:columns-2 xl:columns-3 gap-4 mt-4">
            <div className="mb-4" style={{ breakInside: 'avoid' }}>
              <PersonalInfoCard professional={professional} />
            </div>
            <div className="mb-4" style={{ breakInside: 'avoid' }}>
              <EducationCard professional={professional} />
            </div>
            <div className="mb-4" style={{ breakInside: 'avoid' }}>
              <WorkplaceCard professional={professional} />
            </div>
            <div className="mb-4" style={{ breakInside: 'avoid' }}>
              <ProfessionalCardInfo
                professional={professional}
                daysUntilRenewal={daysUntilRenewal}
                isRenewalSoon={isRenewalSoon}
              />
            </div>
            <div className="mb-4" style={{ breakInside: 'avoid' }}>
              <StatusCard professional={professional} />
            </div>
            <div className="mb-4" style={{ breakInside: 'avoid' }}>
              <ProfessionalDocumentsCard
                // Usamos localDocuments para que el subcomponente no falle
                professional={{ ...professional, documentos_adicionales: localDocuments }}
                onDocumentsUpdate={handleDocumentsUpdate}
              />
            </div>
            <div className="mb-4" style={{ breakInside: 'avoid' }}>
              <ParametrosPersonalizadosCard professionalId={professional.id} />
            </div>
            <div className="mb-4" style={{ breakInside: 'avoid' }}>
              <DisciplinaryHistoryCard profesionalId={professional.id} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfessionalDetail;