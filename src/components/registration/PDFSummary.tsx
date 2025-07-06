
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, User } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BarcodeGenerator } from './BarcodeGenerator';

interface PDFSummaryProps {
  formData: any;
  onDownload?: () => void;
}

const PDFSummary = ({ formData, onDownload }: PDFSummaryProps) => {
  const pdfRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (!pdfRef.current) return;

    try {
      const canvas = await html2canvas(pdfRef.current, {
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

      const fileName = `solicitud_${formData.codigo_expediente || 'pendiente'}_${formData.nombre}_${formData.apellidos}.pdf`;
      pdf.save(fileName);
      
      if (onDownload) onDownload();
    } catch (error) {
      console.error('Error generando PDF:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Resumen de Solicitud</h2>
        <Button onClick={generatePDF} className="flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Descargar PDF</span>
        </Button>
      </div>

      <div ref={pdfRef} className="bg-white p-8 space-y-6" style={{ minHeight: '297mm' }}>
        {/* Encabezado oficial */}
        <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
          <h1 className="text-2xl font-bold text-guinea-teal mb-2">
            MINISTERIO DE SANIDAD Y BIENESTAR SOCIAL
          </h1>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            REPÚBLICA DE GUINEA ECUATORIAL
          </h2>
          <h3 className="text-base font-medium text-gray-600">
            SOLICITUD DE ACREDITACIÓN PROFESIONAL SANITARIA
          </h3>
          {formData.codigo_expediente && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Código de Expediente: {formData.codigo_expediente}
              </p>
            </div>
          )}
        </div>

        {/* Foto y código de barras */}
        <div className="flex justify-center items-center space-x-8 mb-8">
          <div className="flex flex-col items-center space-y-4">
            {formData.foto_carnet_base64 && (
              <div className="w-32 h-40 border-2 border-gray-300 rounded overflow-hidden">
                <img 
                  src={formData.foto_carnet_base64} 
                  alt="Foto carnet"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {formData.codigo_barras && (
              <div className="flex flex-col items-center">
                <BarcodeGenerator 
                  code={formData.codigo_barras}
                  width={200}
                  height={60}
                  className="mb-2"
                />
                <p className="text-xs text-gray-600">Código de Barras</p>
              </div>
            )}
          </div>
        </div>

        {/* Información personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-guinea-teal" />
              <span>Información Personal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Nombre completo:</strong> {formData.nombre} {formData.apellidos}</div>
              <div><strong>Género:</strong> {formData.genero}</div>
              <div><strong>Fecha de nacimiento:</strong> {formData.fecha_nacimiento}</div>
              <div><strong>Edad:</strong> {formData.edad} años</div>
              <div><strong>Nacionalidad:</strong> {formData.nacionalidad}</div>
              <div><strong>Teléfono:</strong> {formData.telefono}</div>
              {formData.numero_dip && <div><strong>Número DIP:</strong> {formData.numero_dip}</div>}
              {formData.numero_pasaporte && <div><strong>Número Pasaporte:</strong> {formData.numero_pasaporte}</div>}
            </div>
          </CardContent>
        </Card>

        {/* Información de domicilio */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Domicilio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Domicilio:</strong> {formData.domicilio}</div>
              <div><strong>Provincia:</strong> {formData.provincia}</div>
              <div><strong>Distrito:</strong> {formData.distrito}</div>
            </div>
          </CardContent>
        </Card>

        {/* Información profesional */}
        <Card>
          <CardHeader>
            <CardTitle>Información Profesional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Área profesional:</strong> {formData.area_profesional}</div>
              {formData.especialidad && <div><strong>Especialidad:</strong> {formData.especialidad}</div>}
              <div><strong>Categoría titulación:</strong> {formData.categoria_titulacion}</div>
              <div><strong>Titulación:</strong> {formData.titulacion_especifica_1}</div>
              <div><strong>Institución:</strong> {formData.institucion_1}</div>
              <div><strong>Período formación:</strong> {formData.periodo_formacion}</div>
              <div><strong>País formación:</strong> {formData.pais_formacion_1}</div>
            </div>
          </CardContent>
        </Card>

        {/* Información laboral */}
        <Card>
          <CardHeader>
            <CardTitle>Información Laboral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Situación laboral:</strong> {formData.situacion_laboral}</div>
              <div><strong>Centro de trabajo:</strong> {formData.nombre_centro}</div>
              <div><strong>Categoría centro:</strong> {formData.categoria_centro}</div>
              <div><strong>Tipo sector:</strong> {formData.tipo_sector}</div>
              {formData.distrito_sanitario && <div><strong>Distrito sanitario:</strong> {formData.distrito_sanitario}</div>}
              {formData.pertenece_brigada_medica && (
                <div><strong>Brigada médica:</strong> {formData.tipo_cooperacion}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fecha y firma */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm"><strong>Fecha de solicitud:</strong> {new Date().toLocaleDateString('es-ES')}</p>
              {formData.codigo_expediente && (
                <p className="text-sm"><strong>Código de expediente:</strong> {formData.codigo_expediente}</p>
              )}
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 w-48 mb-2"></div>
              <p className="text-sm">Firma del solicitante</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFSummary;
