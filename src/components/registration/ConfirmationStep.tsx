
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, User, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PDFSummary from './PDFSummary';
import RequestLetter from './RequestLetter';
import ApprovalLetter from './ApprovalLetter';
import ProfessionalCard from './ProfessionalCard';

interface ConfirmationStepProps {
  formData: any;
  isSubmitting: boolean;
}

const ConfirmationStep = ({ formData, isSubmitting }: ConfirmationStepProps) => {
  const [showPDF, setShowPDF] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [showApprovalLetter, setShowApprovalLetter] = useState(false);
  const [showCard, setShowCard] = useState(false);

  if (isSubmitting) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-guinea-teal mx-auto"></div>
            <p className="text-lg font-medium">Enviando solicitud...</p>
            <p className="text-gray-600">Por favor, espere mientras procesamos su información</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showPDF) {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => setShowPDF(false)}
          className="mb-4"
        >
          ← Volver al resumen
        </Button>
        <PDFSummary 
          formData={formData} 
          onDownload={() => console.log('PDF descargado')}
        />
      </div>
    );
  }

  if (showLetter) {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => setShowLetter(false)}
          className="mb-4"
        >
          ← Volver al resumen
        </Button>
        <RequestLetter 
          formData={formData} 
          onDownload={() => console.log('Carta descargada')}
        />
      </div>
    );
  }

  if (showApprovalLetter) {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => setShowApprovalLetter(false)}
          className="mb-4"
        >
          ← Volver al resumen
        </Button>
        <ApprovalLetter 
          formData={formData} 
          onDownload={() => console.log('Carta de aprobación descargada')}
        />
      </div>
    );
  }

  if (showCard) {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => setShowCard(false)}
          className="mb-4"
        >
          ← Volver al resumen
        </Button>
        <ProfessionalCard 
          formData={formData} 
          onDownload={() => console.log('Carnet descargado')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="w-6 h-6" />
            <span>¡Gracias por su Solicitud!</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-6 rounded-lg border text-center">
            <div className="text-6xl mb-4">🙏</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              ¡Muchas gracias por confiar en nosotros!
            </h3>
            <p className="text-gray-700 mb-4">
              Su solicitud de acreditación profesional ha sido recibida exitosamente y está siendo procesada por nuestro equipo técnico.
            </p>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Estado: Pendiente de Revisión
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Recibirá notificaciones sobre el progreso de su solicitud en el teléfono proporcionado.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Próximos Pasos:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Su solicitud será revisada por el comité técnico</li>
              <li>• Recibirá notificaciones sobre el estado de su solicitud</li>
              <li>• El proceso de revisión puede tomar entre 5-10 días hábiles</li>
              <li>• Una vez aprobada, podrá descargar su carnet profesional</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              onClick={() => setShowPDF(true)}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Resumen PDF</span>
            </Button>
            
            <Button 
              onClick={() => setShowLetter(true)}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <Mail className="w-4 h-4" />
              <span>Carta de Instancia</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 sm:col-span-2"
            >
              <User className="w-4 h-4" />
              <span>Volver al Inicio</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen rápido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-guinea-teal" />
            <span>Resumen de su Solicitud</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Nombre completo:</strong>
              <p>{formData.nombre} {formData.apellidos}</p>
            </div>
            <div>
              <strong>Área Profesional:</strong>
              <p>{formData.area_profesional}</p>
            </div>
            <div>
              <strong>Centro de Trabajo:</strong>
              <p>{formData.nombre_centro || 'N/A'}</p>
            </div>
            <div>
              <strong>Provincia:</strong>
              <p>{formData.provincia}</p>
            </div>
            <div>
              <strong>Fecha de Solicitud:</strong>
              <p>{new Date().toLocaleDateString('es-ES')}</p>
            </div>
            <div>
              <strong>Estado:</strong>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Pendiente
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmationStep;
