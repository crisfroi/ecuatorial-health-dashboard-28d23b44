import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DocumentsStep } from './DocumentsStep';
interface PDFSummaryProps {
  formData: any;
  onDownload: () => void;
}
const PDFSummary = ({
  formData,
  onDownload
}: PDFSummaryProps) => {
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

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidthMM = 210;
    const pageHeightMM = 297;
    const imgWidthPX = canvas.width;
    const imgHeightPX = canvas.height;

    // Factor de conversión px → mm
    const pxPerMM = imgWidthPX / pageWidthMM;
    const imgHeightMM = imgHeightPX / pxPerMM;

    // Recorta el canvas si excede la altura de página
    const cropHeightPX = imgHeightMM > pageHeightMM
      ? pageHeightMM * pxPerMM
      : imgHeightPX;

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = imgWidthPX;
    croppedCanvas.height = cropHeightPX;
    croppedCanvas.getContext('2d')!
      .drawImage(canvas, 0, 0, imgWidthPX, cropHeightPX, 0, 0, imgWidthPX, cropHeightPX);

    const imgData = croppedCanvas.toDataURL('image/png');
    const imgHeightFinalMM = croppedCanvas.height / pxPerMM;

    // Centra verticalmente si es más corto que la página
    const yOffset = imgHeightFinalMM < pageHeightMM
      ? (pageHeightMM - imgHeightFinalMM) / 2
      : 0;

    pdf.addImage(imgData, 'PNG', 0, yOffset, pageWidthMM, imgHeightFinalMM);
    pdf.save(`solicitud-${formData.nombre}-${formData.apellidos?.replace(/\s+/g, '-') || 'profesional'}.pdf`);
    onDownload();
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};
  const generateBarcodeCode = () => {
    // Generar código único basado en área profesional y timestamp
    const prefijo = formData.area_profesional === 'MEDICINA GENERAL' ? 'MED' : formData.area_profesional === 'ENFERMERÍA' ? 'ENF' : formData.area_profesional === 'FARMACIA' ? 'FAR' : 'GEN';
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefijo}${fecha}${random}`;
  };
  const barcodeData = generateBarcodeCode();
  const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${barcodeData}&code=Code128&translate-esc=false&width=300&height=80`;
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [fotoCarnetBase64, setFotoCarnetBase64] = useState<string | null>(null);
  return <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resumen Completo de Solicitud</span>
            <Button onClick={generatePDF} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Descargar PDF
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div id="pdf-content" className="max-w-[210mm] mx-auto bg-white" style={{
          padding: '5mm',
          fontSize: '11px',
          lineHeight: '1.2'
        }}>
            {/* Header Oficial */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 style={{
              fontSize: '16px'
            }} className="font-bold mb-1 text-base">MINISTERIO DE SANIDAD SANIDAD, BIENESTAR SOCIAL E INFRAESTRUCTURAS SANITARIAS</h1>
              <h2 className="font-semibold text-gray-700" style={{
              fontSize: '12px'
            }}>
              </h2>
              <p className="mt-2 font-medium" style={{
              fontSize: '12px'
            }}>SOLICITUD DE ACREDITACIÓN PROFESIONAL</p>
              <div className="mt-3">
                <div className="inline-block bg-gray-100 p-1 font-mono font-bold" style={{
                fontSize: '10px'
              }}>
            {/* Sección Principal con Foto */}
            <div className="grid grid-cols-4 gap-6">
              <div className="col-span-1">
               {formData.foto_carnet_base64 ? <div className="text-center">
                   <img src={formData.foto_carnet_base64} alt="Foto carnet" className="w-full max-w-[120px] h-40 object-cover border-2 border-gray-400 mx-auto" style={{
                  maxWidth: '120px',
                  height: '160px'
                }} />
                     <p className="text-xs mt-2 text-gray-600 break-words">Fotografía tamaño carnet</p>
                 </div> : formData.foto_carnet ? <div className="text-center">
                    <img src={formData.foto_carnet} alt="Foto carnet" className="w-full max-w-[120px] h-40 object-cover border-2 border-gray-400 mx-auto" style={{
                  maxWidth: '120px',
                  height: '160px'
                }} />
                    <p className="text-xs mt-2 text-gray-600 break-words">Fotografía tamaño carnet</p>
                  </div> : formData.submittedData?.foto_carnet ? <div className="text-center">
                    <img src={formData.submittedData.foto_carnet} alt="Foto carnet" className="w-full max-w-[120px] h-40 object-cover border-2 border-gray-400 mx-auto" style={{
                  maxWidth: '120px',
                  height: '160px'
                }} />
                    <p className="text-xs mt-2 text-gray-600 break-words">Fotografía tamaño carnet</p>
                  </div> : <div className="w-full max-w-[120px] h-40 border-2 border-dashed border-gray-300 flex items-center justify-center mx-auto">
                    <span className="text-gray-400 text-xs">Sin foto</span>
                  </div>}
              </div>
              
              <div className="col-span-3 space-y-6">
                {/* DATOS PERSONALES */}
                <div>
                  <h3 className="text-xl font-bold border-b-2 border-guinea-teal pb-2 mb-4">
                    I. DATOS PERSONALES
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Nombre Completo:</strong>
                      <p className="mt-1">{formData.nombre} {formData.apellidos}</p>
                    </div>
                    <div>
                      <strong>Género:</strong>
                      <p className="mt-1">{formData.genero}</p>
                    </div>
                    <div>
                      <strong>Fecha de Nacimiento:</strong>
                      <p className="mt-1">{formData.fecha_nacimiento}</p>
                    </div>
                    <div>
                      <strong>Nacionalidad:</strong>
                      <p className="mt-1">{formData.nacionalidad}</p>
                    </div>
                    <div>
                      <strong>Número DIP:</strong>
                      <p className="mt-1">{formData.numero_dip || 'N/A'}</p>
                    </div>
                    <div>
                      <strong>Número Pasaporte:</strong>
                      <p className="mt-1">{formData.numero_pasaporte || 'N/A'}</p>
                    </div>
                    <div>
                      <strong>Teléfono:</strong>
                      <p className="mt-1">{formData.telefono}</p>
                    </div>
                    <div>
                      <strong>Domicilio:</strong>
                      <p className="mt-1">{formData.domicilio}</p>
                    </div>
                    <div>
                      <strong>Provincia:</strong>
                      <p className="mt-1">{formData.provincia}</p>
                    </div>
                    <div>
                      <strong>Distrito:</strong>
                      <p className="mt-1">{formData.distrito}</p>
                    </div>
                  </div>
                </div>

                {/* INFORMACIÓN PROFESIONAL */}
                <div>
                  <h3 className="text-xl font-bold border-b-2 border-guinea-teal pb-2 mb-4">
                    II. INFORMACIÓN PROFESIONAL
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Área Profesional:</strong>
                      <p className="mt-1">{formData.area_profesional}</p>
                    </div>
                    <div>
                      <strong>Especialidad:</strong>
                      <p className="mt-1">{formData.especialidad || 'N/A'}</p>
                    </div>
                    <div>
                      <strong>Categoría de Titulación:</strong>
                      <p className="mt-1">{formData.categoria_titulacion}</p>
                    </div>
                    <div>
                      <strong>Situación Laboral:</strong>
                      <p className="mt-1">{formData.situacion_laboral}</p>
                    </div>
                  </div>
                </div>

                {/* FORMACIÓN ACADÉMICA */}
                <div>
                  <h3 className="text-xl font-bold border-b-2 border-guinea-teal pb-2 mb-4">
                    III. FORMACIÓN ACADÉMICA
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Titulación Específica:</strong>
                      <p className="mt-1">{formData.titulacion_especifica_1}</p>
                    </div>
                    <div>
                      <strong>Institución de Formación:</strong>
                      <p className="mt-1">{formData.institucion_1}</p>
                    </div>
                    <div>
                      <strong>Período de Formación:</strong>
                      <p className="mt-1">{formData.periodo_formacion}</p>
                    </div>
                    <div>
                      <strong>País de Formación:</strong>
                      <p className="mt-1">{formData.pais_formacion_1}</p>
                    </div>
                  </div>
                </div>

                {/* INFORMACIÓN LABORAL */}
                <div>
                  <h3 className="text-xl font-bold border-b-2 border-guinea-teal pb-2 mb-4">
                    IV. INFORMACIÓN LABORAL
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Centro de Trabajo:</strong>
                      <p className="mt-1">{formData.nombre_centro}</p>
                    </div>
                    <div>
                      <strong>Categoría del Centro:</strong>
                      <p className="mt-1">{formData.categoria_centro}</p>
                    </div>
                    <div>
                      <strong>Tipo de Sector:</strong>
                      <p className="mt-1">{formData.tipo_sector}</p>
                    </div>
                    <div>
                      <strong>Distrito Sanitario:</strong>
                      <p className="mt-1">{formData.distrito_sanitario || 'N/A'}</p>
                    </div>
                    <div>
                      <strong>Pertenece a Brigada Médica:</strong>
                      <p className="mt-1">{formData.pertenece_brigada_medica ? 'Sí' : 'No'}</p>
                    </div>
                    {formData.pertenece_brigada_medica && <div>
                        <strong>Tipo de Cooperación:</strong>
                        <p className="mt-1">{formData.tipo_cooperacion || 'N/A'}</p>
                      </div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Código de Barras */}
            <div className="text-center border-t-2 border-gray-200 pt-6">
              <h4 className="text-lg font-semibold mb-4">CÓDIGO DE EXPEDIENTE</h4>
              <img src={barcodeUrl} alt={`Código de barras: ${barcodeData}`} className="mx-auto" style={{
              maxWidth: '300px',
              height: 'auto'
            }} />
              <p className="font-mono text-sm mt-2 font-semibold">{barcodeData}</p>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-200 pt-6 text-center text-sm text-gray-600">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p><strong>Fecha de Solicitud:</strong> {new Date().toLocaleDateString('es-ES')}</p>
                  <p><strong>Estado:</strong> Pendiente de Revisión</p>
                </div>
                <div>
                  <p><strong>Código de Expediente:</strong> {barcodeData}</p>
                  <p><strong>Generado por:</strong> Sistema RENAPROSA</p>
                </div>
              </div>
              <div className="mt-6 text-xs">
                <p>Este documento es un resumen de la solicitud de acreditación profesional.</p>
                <p>Para verificar la autenticidad, consulte el código de barras en el sistema oficial.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default PDFSummary;
