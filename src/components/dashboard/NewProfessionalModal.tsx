import React, { useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Download,
  ExternalLink,
  AlertTriangle,
  User,
  FileText,
  CreditCard,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

import ApprovalLetter from "@/components/registration/ApprovalLetter";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { type Profesional } from "@/hooks/useProfesionales";

interface NewProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  professional: Profesional | null;
}

const NewProfessionalModal = ({
  isOpen,
  onClose,
  professional,
}: NewProfessionalModalProps) => {
  const approvalLetterRef = useRef<HTMLDivElement>(null);

  if (!professional) {
    return null;
  }

  const generatePdfFromHtml = useCallback(
    async (elementId: string, filename: string) => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(
          `Element with ID '${elementId}' not found for PDF generation.`,
        );
        toast({
          title: "Error de Generación",
          description: "No se pudo encontrar el contenido para generar el PDF.",
          variant: "destructive",
        });
        return;
      }

      try {
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.left = "-9999px";
        tempContainer.style.width = "210mm";
        tempContainer.style.height = "250mm";
        tempContainer.style.overflow = "hidden";
        const contentToPrint = element.cloneNode(true) as HTMLElement;
        tempContainer.appendChild(contentToPrint);
        document.body.appendChild(tempContainer);

        await new Promise((resolve) => setTimeout(resolve, 50));

        const canvas = await html2canvas(contentToPrint, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        const imgWidth = 190; // Reducir ancho para márgenes
        const pageHeight = 270; // Reducir altura de página
        const marginLeft = 10; // Margen izquierdo
        const marginTop = 10; // Margen superior
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

        pdf.save(filename);
        toast({
          title: "Descarga Exitosa",
          description: `"${filename}" ha sido generado y descargado.`,
        });
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast({
          title: "Error de Generación",
          description:
            "Hubo un problema al generar el PDF. Inténtelo de nuevo.",
          variant: "destructive",
        });
      } finally {
        const tempContainer = document.querySelector('div[style*="-9999px"]');
        if (tempContainer && tempContainer.parentNode) {
          document.body.removeChild(tempContainer);
        }
      }
    },
    [],
  );

  const handleDownloadLetter = () => {
    toast({
      title: "Generando Carta",
      description:
        "Por favor, espere mientras se genera la carta de aprobación...",
      duration: 3000,
    });
    generatePdfFromHtml(
      "approval-letter-content",
      `carta-aprobacion-${professional.nombre || ""}-${professional.apellidos?.replace(/\s+/g, "-") || "profesional"}.pdf`,
    );
  };

  const handleDownloadCarnet = async () => {
    if (!professional.url_carnet) {
      toast({
        title: "Carnet no disponible",
        description: "No hay una URL de carnet para descargar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(professional.url_carnet);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const svgBlob = await response.blob();

      const url = window.URL.createObjectURL(svgBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `carnet-${professional.nombre || ""}-${professional.apellidos?.replace(/\s+/g, "-") || "profesional"}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Descarga Iniciada",
        description: "El carnet digital se está descargando.",
      });
    } catch (error) {
      console.error("Error al descargar el carnet:", error);
      toast({
        title: "Error de Descarga",
        description:
          "Hubo un problema al descargar el carnet. Inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const formDataForDocuments = {
    ...professional,
    nombre: professional.nombre || "",
    apellidos: professional.apellidos || "",
    numero_dip: professional.numero_dip || "",
    numero_pasaporte: professional.numero_pasaporte || "",
    area_profesional: professional.area_profesional || "",
    especialidad: professional.especialidad || "No especificada",
    titulacion_especifica_1: professional.titulacion_especifica_1 || "",
    institucion_1: professional.institucion_1 || "",
    pais_formacion_1: professional.pais_formacion_1 || "",
    genero: professional.genero || "",
    nacionalidad: professional.nacionalidad || "",
    fecha_nacimiento: professional.fecha_nacimiento
      ? new Date(professional.fecha_nacimiento).toLocaleDateString("es-ES")
      : "N/A",
    edad: professional.fecha_nacimiento
      ? Math.floor(
          (new Date().getTime() -
            new Date(professional.fecha_nacimiento).getTime()) /
            31557600000,
        )
      : "N/A",
    telefono: professional.telefono || "",
    domicilio: professional.domicilio || "",
    provincia: professional.provincia || "",
    distrito: professional.distrito || "",
    categoria_titulacion: professional.categoria_titulacion || "",
    periodo_formacion: professional.periodo_formacion || "",
    situacion_laboral: professional.situacion_laboral || "",
    nombre_centro: professional.nombre_centro || "",
    categoria_centro: professional.categoria_centro || "",
    tipo_sector: professional.tipo_sector || "",
    distrito_sanitario: professional.distrito_sanitario || "",
    pertenece_brigada_medica: professional.pertenece_brigada_medica,
    tipo_cooperacion: professional.tipo_cooperacion || "",
    codigo_expediente: professional.codigo_expediente,
    foto_carnet_base64: professional.foto_carnet_base64,
    codigo_barras: professional.url_codigo_barras_expediente,
    foto_carnet: professional.foto_carnet,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Detalles del Profesional: {professional.nombre}{" "}
            {professional.apellidos}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Detalles
            </TabsTrigger>
            <TabsTrigger
              value="approval-letter"
              disabled={professional.estado_solicitud !== "Pendiente de Firma"}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Carta Aprobación
            </TabsTrigger>
            <TabsTrigger
              value="carnet"
              disabled={!professional.url_carnet}
              className="flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Carnet Digital
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 mt-4">
            <TabsContent value="details" className="h-full">
              <ScrollArea className="h-[calc(90vh-200px)] rounded-md border p-4">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">
                    Información Personal
                  </h3>

                  {professional.foto_carnet && (
                    <div className="flex justify-center mb-6">
                      <img
                        src={professional.foto_carnet}
                        alt="Foto del Profesional"
                        className="w-32 h-40 object-cover border rounded-lg shadow-sm"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p>
                        <strong>Código de Expediente:</strong>{" "}
                        {formDataForDocuments.codigo_expediente}
                      </p>
                      <p>
                        <strong>Nombre Completo:</strong>{" "}
                        {formDataForDocuments.nombre}{" "}
                        {formDataForDocuments.apellidos}
                      </p>
                      <p>
                        <strong>Nacionalidad:</strong>{" "}
                        {formDataForDocuments.nacionalidad}
                      </p>
                      <p>
                        <strong>DIP/Pasaporte:</strong>{" "}
                        {formDataForDocuments.numero_dip ||
                          formDataForDocuments.numero_pasaporte}
                      </p>
                      <p>
                        <strong>Fecha de Nacimiento:</strong>{" "}
                        {formDataForDocuments.fecha_nacimiento}
                      </p>
                      <p>
                        <strong>Género:</strong> {formDataForDocuments.genero}
                      </p>
                      <p>
                        <strong>Teléfono:</strong>{" "}
                        {formDataForDocuments.telefono}
                      </p>
                      <p>
                        <strong>Email:</strong> {professional.email}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p>
                        <strong>Domicilio:</strong>{" "}
                        {formDataForDocuments.domicilio}
                      </p>
                      <p>
                        <strong>Provincia:</strong>{" "}
                        {formDataForDocuments.provincia}
                      </p>
                      <p>
                        <strong>Distrito:</strong>{" "}
                        {formDataForDocuments.distrito}
                      </p>
                      <p>
                        <strong>Área Profesional:</strong>{" "}
                        {formDataForDocuments.area_profesional}
                      </p>
                      <p>
                        <strong>Especialidad:</strong>{" "}
                        {formDataForDocuments.especialidad}
                      </p>
                      <p>
                        <strong>Titulación:</strong>{" "}
                        {formDataForDocuments.titulacion_especifica_1}
                      </p>
                      <p>
                        <strong>Institución:</strong>{" "}
                        {formDataForDocuments.institucion_1}
                      </p>
                      <p>
                        <strong>País de Formación:</strong>{" "}
                        {formDataForDocuments.pais_formacion_1}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Información Laboral</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <p>
                        <strong>Situación Laboral:</strong>{" "}
                        {formDataForDocuments.situacion_laboral}
                      </p>
                      <p>
                        <strong>Centro de Trabajo:</strong>{" "}
                        {formDataForDocuments.nombre_centro}
                      </p>
                      <p>
                        <strong>Tipo de Sector:</strong>{" "}
                        {formDataForDocuments.tipo_sector}
                      </p>
                      <p>
                        <strong>Estado de Solicitud:</strong>
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            professional.estado_solicitud === "Aprobado"
                              ? "bg-green-100 text-green-800"
                              : professional.estado_solicitud ===
                                  "Pendiente de Firma"
                                ? "bg-blue-100 text-blue-800"
                                : professional.estado_solicitud === "Rechazado"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {professional.estado_solicitud}
                        </span>
                      </p>
                    </div>
                  </div>

                  {professional.motivo_rechazo && (
                    <div className="pt-4 border-t">
                      <p className="text-red-600">
                        <strong>Motivo de Rechazo:</strong>{" "}
                        {professional.motivo_rechazo}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="approval-letter" className="h-full">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={handleDownloadLetter}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar Carta
                </Button>
              </div>
              <ScrollArea className="h-[calc(90vh-250px)] rounded-md border bg-gray-50 p-4">
                <div
                  id="approval-letter-content"
                  className="max-w-[210mm] mx-auto bg-white"
                  style={{ padding: "15mm", minHeight: "250mm" }}
                >
                  <ApprovalLetter
                    formData={formDataForDocuments}
                    onDownload={() => {}}
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="carnet" className="h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Carnet Digital</h3>
                {professional.url_carnet &&
                  professional.estado_solicitud === "Pendiente de Firma" && (
                    <Button
                      onClick={handleDownloadCarnet}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Carnet
                    </Button>
                  )}
              </div>

              <div className="h-[calc(90vh-250px)] rounded-md border bg-gray-50">
                {professional.url_carnet ? (
                  <div className="h-full flex flex-col">
                    <div className="text-center p-4 border-b bg-white">
                      <p className="text-sm font-medium text-gray-600">
                        Vista Previa del Carnet
                      </p>
                    </div>

                    <ScrollArea className="flex-1">
                      <div className="p-4 flex justify-center">
                        <img
                          src={professional.url_carnet}
                          alt="Carnet Profesional"
                          className="w-full max-w-lg h-auto object-contain border rounded-md shadow-sm bg-white"
                          onError={(e) => {
                            console.error(
                              "Error loading carnet image:",
                              professional.url_carnet,
                            );
                            e.currentTarget.onerror = null;
                            e.currentTarget.alt = "Error al cargar el carnet";
                            e.currentTarget.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDI0MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI0MCIgaGVpZ2h0PSIxNTAiIHJ4PSI4IiBmaWxsPSIjRkZEREREIi8+PHBhdGggZD0iTTYwIDQwSDE4MFY3MEg2MFY0ME0xMDAgODBIMTgwTTEwMCAxMDBIMTgwTTEwMCAxMjBIMTgwIiBzdHJva2U9IiNFRjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHRleHQgeD0iMTIwIiB5PSI1OCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjRUY0NDQ0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5FcnJvciBhbCBjYXJnYXI8L3RleHQ+PC9zdmc+";
                          }}
                          onLoad={() => {
                            console.log(
                              "Carnet image loaded successfully:",
                              professional.url_carnet,
                            );
                          }}
                        />
                      </div>
                    </ScrollArea>

                    {professional.estado_solicitud !== "Pendiente de Firma" && (
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-500 bg-gray-100 rounded-md p-2">
                          Descarga disponible solo en estado "Pendiente de
                          Firma"
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <AlertTriangle className="w-16 h-16 mx-auto text-orange-500 mb-4" />
                      <p className="text-lg font-medium text-gray-600 mb-2">
                        Vista previa del carnet no disponible
                      </p>
                      <p className="text-sm text-gray-500">
                        No se ha generado aún un carnet digital para este
                        profesional
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default NewProfessionalModal;
