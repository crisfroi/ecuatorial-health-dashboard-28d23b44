import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import BarcodeGenerator from './BarcodeGenerator';

interface ProfessionalCardProps {
  formData: any;
  onDownload: () => void;
}

const CARD_WIDTH = 1017;
const CARD_HEIGHT = 642;
const BARCODE_WIDTH = 420;
const BARCODE_HEIGHT = 86;

const ProfessionalCard = ({ formData, onDownload }: ProfessionalCardProps) => {
  const professionalId = formData.id_profesional_unico || formData.submittedData?.id_profesional_unico || formData.codigo_expediente || '';

  const generatePDF = async () => {
    const element = document.getElementById('professional-card-content');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', [85.6, 53.98]);
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 53.98);
      pdf.save(`carnet-${formData.nombre || ''}-${formData.apellidos?.replace(/\s+/g, '-') || 'profesional'}.pdf`);
      onDownload();
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const today = formData.fecha_emision ? new Date(formData.fecha_emision) : new Date();
  const expiryDate = formData.fecha_caducidad ? new Date(formData.fecha_caducidad) : new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Carnet Profesional</span>
            <Button onClick={generatePDF} className="flex items-center gap-2"><Download className="w-4 h-4" />Descargar Carnet</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center overflow-auto">
          <div id="professional-card-content" className="relative bg-gradient-to-br from-teal-600 to-teal-800 text-white overflow-hidden shadow-2xl" style={{ width: CARD_WIDTH, height: CARD_HEIGHT, minWidth: CARD_WIDTH }}>
            <div className="absolute inset-0 opacity-10 bg-white" />
            <div className="relative z-10 p-10 h-full">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center text-teal-700 font-bold text-2xl">GQ</div>
                  <div><div className="text-3xl font-bold">Guinea Ecuatorial</div><div className="text-2xl font-semibold">Salud</div></div>
                </div>
                <div className="text-right text-xl font-semibold">CARNET PROFESIONAL SANITARIO</div>
              </div>

              <div className="absolute left-10 top-40 flex gap-8">
                <div className="w-[250px] h-[310px] bg-white/15 border-4 border-white rounded-xl overflow-hidden flex items-center justify-center">
                  {formData.photoFile ? (
                    <img src={URL.createObjectURL(formData.photoFile)} alt="Foto carnet" className="w-full h-full object-cover" />
                  ) : formData.foto_carnet ? (
                    <img src={formData.foto_carnet} alt="Foto carnet" className="w-full h-full object-cover" />
                  ) : formData.submittedData?.foto_carnet ? (
                    <img src={formData.submittedData.foto_carnet} alt="Foto carnet" className="w-full h-full object-cover" />
                  ) : <span className="text-xl">FOTO</span>}
                </div>

                <div className="w-[500px] space-y-7 pt-2">
                  <div><div className="text-4xl font-bold uppercase">{formData.nombre} {formData.apellidos}</div><div className="text-2xl font-semibold mt-3">{formData.area_profesional || 'PROFESIONAL SANITARIO'}</div></div>
                  <div className="grid grid-cols-2 gap-5 text-lg">
                    <div><span className="opacity-75">N.º profesional</span><div className="font-mono font-bold text-xl">{professionalId || 'Pendiente'}</div></div>
                    <div><span className="opacity-75">Especialidad</span><div className="font-semibold">{formData.especialidad || '—'}</div></div>
                    <div><span className="opacity-75">Emisión</span><div>{today.toLocaleDateString('es-ES')}</div></div>
                    <div><span className="opacity-75">Caducidad</span><div>{expiryDate.toLocaleDateString('es-ES')}</div></div>
                  </div>
                </div>
              </div>

              {/* El barcode ocupa una zona física de 420x86 px y queda debajo de la foto, sin escalarlo arbitrariamente. */}
              {professionalId && (
                <div className="absolute left-10 bottom-8 bg-white rounded-md p-2 text-black" style={{ width: BARCODE_WIDTH + 16, height: BARCODE_HEIGHT + 16 }}>
                  <BarcodeGenerator code={professionalId} width={BARCODE_WIDTH} height={BARCODE_HEIGHT} />
                </div>
              )}

              <div className="absolute right-10 bottom-10 text-right text-sm opacity-90">
                <div>Ministerio de Sanidad y Bienestar Social</div>
                <div>República de Guinea Ecuatorial</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalCard;
