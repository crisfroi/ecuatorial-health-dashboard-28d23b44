import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ApprovalLetterProps {
  formData: any;
  onDownload: () => void;
}

const ApprovalLetter = ({ formData, onDownload }: ApprovalLetterProps) => {
  const generatePDF = async () => {
    const element = document.getElementById("approval-letter-content");
    if (!element) return;

    try {
      // Crear un contenedor temporal sin marcos para el PDF
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.width = "210mm";
      tempContainer.style.background = "white";
      tempContainer.style.padding = "20mm";
      tempContainer.style.fontFamily = "system-ui, -apple-system, sans-serif";

      // Clonar el contenido sin los estilos de contenedor
      const contentToPrint = element.cloneNode(true) as HTMLElement;

      // Remover clases que puedan generar marcos o bordes
      contentToPrint.style.border = "none";
      contentToPrint.style.boxShadow = "none";
      contentToPrint.style.margin = "0";
      contentToPrint.style.padding = "0";

      tempContainer.appendChild(contentToPrint);
      document.body.appendChild(tempContainer);

      // Esperar un momento para que se renderice
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(contentToPrint, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        removeContainer: true,
        logging: false,
        width: contentToPrint.scrollWidth,
        height: contentToPrint.scrollHeight
      });

      // Limpiar el contenedor temporal
      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 190; // Reducir ancho para márgenes
      const pageHeight = 270; // Reducir altura de página
      const marginLeft = 10; // Margen izquierdo
      const marginTop = 10; // Margen superior
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(
        imgData,
        "PNG",
        marginLeft,
        position + marginTop,
        imgWidth,
        imgHeight,
      );
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          imgData,
          "PNG",
          marginLeft,
          position + marginTop,
          imgWidth,
          imgHeight,
        );
        heightLeft -= pageHeight;
      }

      pdf.save(
        `carta-aprobacion-${formData.nombre}-${formData.apellidos?.replace(/\s+/g, "-") || "profesional"}.pdf`,
      );
      onDownload();
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const today = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Carta de Aprobación Ministerial</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            id="approval-letter-content"
            className="bg-white"
            style={{
              padding: "10mm",
              width: "210mm",
              minHeight: "297mm",
              fontSize: "11px",
              lineHeight: "1.4",
              border: "none",
              boxShadow: "none",
              outline: "none",
              margin: "0",
            }}
          >
            {/* Membrete Oficial */}
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div className="flex-1 text-center">
                  <h1 className="text-lg font-bold mb-2">
                    REPÚBLICA DE GUINEA ECUATORIAL
                  </h1>
                  <h2 className="text-base font-semibold">
                    MINISTERIO DE SANIDAD Y BIENESTAR SOCIAL
                  </h2>
                  <h3 className="text-sm font-medium">
                    DIRECCIÓN GENERAL DE RECURSOS HUMANOS
                  </h3>
                </div>
                {/* Logo en esquina superior derecha */}
                <div className="flex-shrink-0">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F696aeb7245c24fa8957a85fb78836206%2F9f0f84e2fe5c4ac7bf20d675db3ea3cc?format=webp&width=800"
                    alt="Guinea Ecuatorial Salud"
                    className="h-16 w-auto"
                  />
                </div>
              </div>
              <div className="border-b-2 border-black mt-4 mb-6"></div>
            </div>

            {/* Fecha y lugar */}
            <div className="text-right mb-8">
              <p>{formData.distrito || 'Malabo'}, {today}</p>
            </div>

            {/* Número de expediente */}
            <div className="mb-6">
              <p className="font-semibold">
                EXPEDIENTE: {formData.codigo_expediente}
              </p>
              <p className="font-semibold">
                ASUNTO: Aprobación de Acreditación Profesional Sanitaria
              </p>
            </div>

            {/* Cuerpo de la carta */}
            <div className="mb-8 space-y-4 text-justify">
              <p className="font-semibold text-center mb-4">
                RESOLUCIÓN MINISTERIAL DE ACREDITACIÓN PROFESIONAL
              </p>

              <p>
                En virtud de las atribuciones conferidas por la Ley de Ejercicio
                Profesional de las Ciencias de la Salud de la República de
                Guinea Ecuatorial, y tras el análisis y evaluación exhaustiva de
                la documentación presentada por {formData.genero === "Femenino" ? "la" : "el"} solicitante:
              </p>

              <div className="bg-gray-50 p-4" style={{borderLeft: "4px solid #14b8a6"}}>
                <p>
                  <strong>Nombre Completo:</strong> {formData.nombre}{" "}
                  {formData.apellidos}
                </p>
                <p>
                  <strong>Nacionalidad:</strong> {formData.nacionalidad}
                </p>
                <p>
                  <strong>Documento de Identidad:</strong>{" "}
                  {formData.numero_dip
                    ? `DIP: ${formData.numero_dip}`
                    : `Pasaporte: ${formData.numero_pasaporte}`}
                </p>
                <p>
                  <strong>Área Profesional:</strong> {formData.area_profesional}
                </p>
                <p>
                  <strong>Especialidad:</strong>{" "}
                  {formData.especialidad || "No especificada"}
                </p>
                <p>
                  <strong>Titulación:</strong>{" "}
                  {formData.titulacion_especifica_1}
                </p>
                <p>
                  <strong>Institución de Formación:</strong>{" "}
                  {formData.institucion_1}
                </p>
                <p>
                  <strong>País de Formación:</strong>{" "}
                  {formData.pais_formacion_1}
                </p>
              </div>

              <p>
                <strong>RESUELVO:</strong>
              </p>

              <p>
                <strong>PRIMERO:</strong> APROBAR la solicitud de acreditación
                profesional sanitaria presentada por
                {formData.genero === "Femenino" ? " la señora " : " el señor "}
                <span className="font-semibold">
                  {formData.nombre} {formData.apellidos}
                </span>
                , reconociendo su competencia profesional en el área de{" "}
                <span className="font-semibold">
                  {formData.area_profesional}
                </span>
                .
              </p>

              <p>
                <strong>SEGUNDO:</strong> AUTORIZAR el ejercicio profesional en
                el territorio nacional de Guinea Ecuatorial, con todas las
                responsabilidades y derechos que ello conlleva, en estricto
                cumplimiento del código deontológico de su profesión.
              </p>

              <p>
                <strong>TERCERO:</strong> OTORGAR el número de carnet
                profesional <span className="font-semibold">{formData.id_profesional_unico || formData.codigo_expediente}</span>, el cual será emitido por la
                Dirección General de Recursos Humanos del Ministerio de Sanidad
                y Bienestar Social.
              </p>

              <p>
                <strong>CUARTO:</strong> Esta acreditación tendrá una validez de
                365 días a partir de la fecha de emisión, sujeta a las renovaciones
                periódicas establecidas por la normativa vigente y al cumplimiento
                de los requisitos de formación continuada.
              </p>

              <p>
                <strong>QUINTO:</strong> Notifíquese la presente resolución al
                interesado y procédase a su inscripción en el Registro Nacional
                de Profesionales Sanitarios Acreditados (RENAPROSA).
              </p>

              <p>
                Esta resolución será efectiva a partir de la fecha de su firma y
                podrá ser impugnada ante la jurisdicción
                contencioso-administrativa en el plazo establecido por la ley.
              </p>
            </div>

            {/* Firmas */}
            <div className="mt-12 grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="border-t border-black w-48 mx-auto mb-2 mt-16"></div>
                <p className="font-semibold">DIRECTOR GENERAL</p>
                <p className="text-sm">Recursos Humanos Sanitarios</p>
              </div>

              <div className="text-center">
                <div className="border-t border-black w-48 mx-auto mb-2 mt-16"></div>
                <p className="font-semibold">MINISTRO DE SANIDAD</p>
                <p className="font-semibold">Y BIENESTAR SOCIAL</p>
                <p className="text-sm">República de Guinea Ecuatorial</p>
              </div>
            </div>

            {/* Pie de página */}
            <div className="mt-12 text-xs text-gray-600 text-center border-t pt-4">
              <p>
                Ministerio de Sanidad y Bienestar Social - República de Guinea
                Ecuatorial
              </p>
              <p>Dirección General de Recursos Humanos - Sistema RENAPROSA</p>
              <p>Generado el {today}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalLetter;
