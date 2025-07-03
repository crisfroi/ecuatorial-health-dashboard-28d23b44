import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ProfessionalCardProps {
  formData: any;
  onDownload: () => void;
}

const ProfessionalCard = ({ formData, onDownload }: ProfessionalCardProps) => {
  const generatePDF = async () => {
    const element = document.getElementById('professional-card-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', [85.6, 53.98]); // ID card size
      
      const cardWidth = 85.6;
      const cardHeight = 53.98;
      
      pdf.addImage(imgData, 'PNG', 0, 0, cardWidth, cardHeight);
      pdf.save(`carnet-${formData.nombre}-${formData.apellidos?.replace(/\s+/g, '-') || 'profesional'}.pdf`);
      onDownload();
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Generar código de carnet
  const generateCardNumber = () => {
    const prefijo = formData.area_profesional === 'MEDICINA GENERAL' ? 'MED' : 
                   formData.area_profesional === 'ENFERMERÍA' ? 'ENF' : 
                   formData.area_profesional === 'FARMACIA' ? 'FAR' : 
                   formData.area_profesional === 'LABORATORIO' ? 'LAB' :
                   formData.area_profesional === 'RADIOLOGÍA' ? 'RAD' :
                   formData.area_profesional === 'ODONTOLOGÍA' ? 'ODO' : 'GEN';
    const año = new Date().getFullYear();
    const numero = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `${prefijo}-${año}-${numero}`;
  };

  // Determinar color según área profesional
  const getCardColor = () => {
    switch (formData.area_profesional) {
      case 'MEDICINA GENERAL':
        return 'from-red-500 to-red-600';
      case 'ENFERMERÍA':
        return 'from-blue-500 to-blue-600';
      case 'FARMACIA':
        return 'from-green-500 to-green-600';
      case 'LABORATORIO':
        return 'from-purple-500 to-purple-600';
      case 'RADIOLOGÍA':
        return 'from-orange-500 to-orange-600';
      case 'ODONTOLOGÍA':
        return 'from-pink-500 to-pink-600';
      default:
        return 'from-teal-500 to-teal-600';
    }
  };

  const cardNumber = generateCardNumber();
  const today = new Date();
  const expiryDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

  // Generar código de barras
  const generateBarcodeCode = () => {
    const prefijo = formData.area_profesional === 'MEDICINA GENERAL' ? 'MED' : 
                   formData.area_profesional === 'ENFERMERÍA' ? 'ENF' : 
                   formData.area_profesional === 'FARMACIA' ? 'FAR' : 'GEN';
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefijo}${fecha}${random}`;
  };

  const barcodeData = generateBarcodeCode();
  const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${barcodeData}&code=Code128&translate-esc=false&width=200&height=30`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Carnet Profesional</span>
            <Button onClick={generatePDF} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Descargar Carnet
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div id="professional-card-content" className="relative">
            {/* Carnet - Tamaño estándar de tarjeta ID */}
            <div 
              className={`w-[342px] h-[216px] bg-gradient-to-br ${getCardColor()} rounded-lg overflow-hidden shadow-2xl relative`}
              style={{ aspectRatio: '85.6/53.98' }}
            >
              {/* Header con logo y ministerio */}
              <div className="relative z-10 p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
                      <div className="w-6 h-6 bg-gradient-to-br from-teal-400 to-teal-600 rounded"></div>
                    </div>
                    <div className="text-white">
                      <div className="text-xs font-bold leading-tight">Guinea</div>
                      <div className="text-xs font-bold leading-tight">Ecuatorial</div>
                      <div className="text-xs font-bold leading-tight">Salud</div>
                    </div>
                  </div>
                  
                  {/* Escudo/Logo del ministerio */}
                  <div className="text-white text-center">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-1">
                      <div className="text-xs">🏛️</div>
                    </div>
                    <div className="text-[6px] leading-tight">
                      <div>Ministerio de Sanidad, Bienestar Social e</div>
                      <div>Infraestructuras Sanitarias</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenido principal */}
              <div className="absolute inset-0 flex">
                {/* Área de foto con overlay azul claro */}
                <div className="w-24 h-full bg-gradient-to-b from-white/10 to-white/20 flex flex-col items-center justify-center p-2">
                  {formData.photoFile ? (
                    <img 
                      src={URL.createObjectURL(formData.photoFile)} 
                      alt="Foto carnet"
                      className="w-16 h-20 object-cover rounded border-2 border-white"
                    />
                  ) : formData.submittedData?.foto_carnet ? (
                    <img 
                      src={formData.submittedData.foto_carnet} 
                      alt="Foto carnet"
                      className="w-16 h-20 object-cover rounded border-2 border-white"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-white/30 rounded border-2 border-white flex items-center justify-center">
                      <div className="text-white text-xs">FOTO</div>
                    </div>
                  )}
                </div>

                {/* Información del profesional */}
                <div className="flex-1 p-3 text-white">
                  <div className="h-full flex flex-col justify-between">
                    {/* Nombre y número de carnet */}
                    <div>
                      <h2 className="text-sm font-bold uppercase leading-tight mb-1">
                        {formData.nombre} {formData.apellidos}
                      </h2>
                      <div className="text-xs font-bold mb-2">{cardNumber}</div>
                      <div className="text-xs uppercase font-medium">{formData.area_profesional}</div>
                    </div>

                    {/* Fechas */}
                    <div className="text-[10px] space-y-1">
                      <div>
                        <span>Fecha de emisión: </span>
                        <span className="font-medium">{today.toLocaleDateString('es-ES')}</span>
                      </div>
                      <div>
                        <span>Fecha de caducidad: </span>
                        <span className="font-medium">{expiryDate.toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Área de firma */}
                <div className="w-20 h-full bg-white/10 flex flex-col items-center justify-end p-2">
                  <div className="w-16 h-8 bg-white/20 rounded mb-1 flex items-center justify-center">
                    <div className="text-[8px] text-white opacity-60">Firma</div>
                  </div>
                </div>
              </div>

              {/* Código de barras en la parte inferior */}
              <div className="absolute bottom-1 left-3 right-3">
                <div className="bg-white rounded px-1 py-0.5">
                  <img 
                    src={barcodeUrl} 
                    alt={`Código: ${barcodeData}`}
                    className="w-full h-4 object-contain"
                  />
                  <div className="text-[6px] text-center font-mono text-black leading-none">{barcodeData}</div>
                </div>
              </div>

              {/* Elementos decorativos */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalCard;