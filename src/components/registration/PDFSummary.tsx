
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFSummaryProps {
  formData: any;
  onDownload: () => void;
}

const PDFSummary = ({ formData, onDownload }: PDFSummaryProps) => {
  const generatePDF = async () => {
    const element = document.getElementById('pdf-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
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

      pdf.save(`solicitud-${formData.nombre_completo?.replace(/\s+/g, '-') || 'profesional'}.pdf`);
      onDownload();
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const generateBarcode = (text: string) => {
    // Generar código de barras simple usando texto
    const barcode = `GEQ${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    return barcode;
  };

  const expedientCode = generateBarcode(formData.nombre_completo || '');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resumen de Solicitud</span>
            <Button onClick={generatePDF} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Descargar PDF
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div id="pdf-content" className="space-y-6 p-6 bg-white">
            {/* Header */}
            <div className="text-center border-b pb-4">
              <h1 className="text-2xl font-bold text-guinea-teal">
                MINISTERIO DE SANIDAD Y BIENESTAR SOCIAL
              </h1>
              <h2 className="text-lg font-semibold mt-2">
                REPÚBLICA DE GUINEA ECUATORIAL
              </h2>
              <p className="text-sm mt-2">SOLICITUD DE ACREDITACIÓN PROFESIONAL</p>
              <div className="mt-4 text-center">
                <div className="inline-block bg-gray-100 p-2 font-mono text-sm">
                  {expedientCode}
                </div>
                <p className="text-xs mt-1">Código de Expediente</p>
              </div>
            </div>

            {/* Foto y datos personales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                {formData.foto_carnet && (
                  <div className="text-center">
                    <img 
                      src={formData.foto_carnet} 
                      alt="Foto carnet"
                      className="w-32 h-40 object-cover border-2 border-gray-300 mx-auto"
                    />
                    <p className="text-xs mt-2">Fotografía tamaño carnet</p>
                  </div>
                )}
              </div>
              
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">DATOS PERSONALES</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Nombre Completo:</strong>
                    <p>{formData.nombre_completo}</p>
                  </div>
                  <div>
                    <strong>Género:</strong>
                    <p>{formData.genero}</p>
                  </div>
                  <div>
                    <strong>Fecha de Nacimiento:</strong>
                    <p>{formData.fecha_nacimiento}</p>
                  </div>
                  <div>
                    <strong>Nacionalidad:</strong>
                    <p>{formData.nacionalidad}</p>
                  </div>
                  <div>
                    <strong>Teléfono:</strong>
                    <p>{formData.telefono}</p>
                  </div>
                  <div>
                    <strong>Domicilio:</strong>
                    <p>{formData.domicilio}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información profesional */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">INFORMACIÓN PROFESIONAL</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Área Profesional:</strong>
                  <p>{formData.area_profesional}</p>
                </div>
                <div>
                  <strong>Especialidad:</strong>
                  <p>{formData.especialidad || 'N/A'}</p>
                </div>
                <div>
                  <strong>Año de Graduación:</strong>
                  <p>{formData.año_graduacion}</p>
                </div>
                <div>
                  <strong>Institución de Formación:</strong>
                  <p>{formData.institucion_1}</p>
                </div>
              </div>
            </div>

            {/* Información laboral */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">INFORMACIÓN LABORAL</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Centro de Trabajo:</strong>
                  <p>{formData.nombre_centro}</p>
                </div>
                <div>
                  <strong>Provincia:</strong>
                  <p>{formData.provincia}</p>
                </div>
                <div>
                  <strong>Distrito Sanitario:</strong>
                  <p>{formData.distrito_sanitario}</p>
                </div>
                <div>
                  <strong>Tipo de Sector:</strong>
                  <p>{formData.tipo_sector}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t text-xs text-gray-600">
              <p>Fecha de Solicitud: {new Date().toLocaleDateString('es-ES')}</p>
              <p>Estado: Pendiente de Revisión</p>
              <div className="mt-4 text-center">
                <p className="font-mono text-lg">{expedientCode}</p>
                <div className="mt-2 bg-black text-white inline-block px-4 py-1 font-mono text-xs">
                  ||||| {expedientCode} |||||
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFSummary;
