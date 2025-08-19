import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Calendar, 
  FileText, 
  DollarSign, 
  CheckCircle,
  Lightbulb,
  Target
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    text: string;
    tab: string;
  };
}

interface GuardiasOnboardingTourProps {
  userRole: string;
  isFirstTime: boolean;
  onComplete: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const GuardiasOnboardingTour: React.FC<GuardiasOnboardingTourProps> = ({
  userRole,
  isFirstTime,
  onComplete,
  onNavigateToTab
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(isFirstTime);

  const getTourSteps = (): TourStep[] => {
    const baseSteps: TourStep[] = [
      {
        id: 'welcome',
        title: '¡Bienvenido al Sistema de Guardias Médicas!',
        content: 'Este sistema le permitirá gestionar de manera integral las guardias médicas, desde el registro hasta el pago de profesionales.',
        target: 'header',
        position: 'bottom'
      },
      {
        id: 'navigation',
        title: 'Navegación por Pestañas',
        content: 'Use las pestañas para navegar entre las diferentes funcionalidades. Cada pestaña está adaptada a sus permisos.',
        target: 'tabs',
        position: 'bottom'
      },
      {
        id: 'notifications',
        title: 'Sistema de Notificaciones',
        content: 'Las notificaciones le alertarán sobre tareas pendientes y acciones importantes que requieren su atención.',
        target: 'notifications',
        position: 'bottom'
      },
      {
        id: 'help',
        title: 'Sistema de Ayuda',
        content: 'Acceda al sistema de ayuda en cualquier momento para obtener guías detalladas y tutoriales paso a paso.',
        target: 'help',
        position: 'bottom'
      }
    ];

    // Agregar pasos específicos según el rol
    if (['SUPER_ADMINISTRADOR', 'DIRECTIVO_CENTRO_SANITARIO'].includes(userRole)) {
      baseSteps.push({
        id: 'registro',
        title: 'Comenzar con el Registro',
        content: 'Su primer paso será registrar las guardias médicas. Vaya a la pestaña "Registro" para comenzar.',
        target: 'registro-tab',
        position: 'bottom',
        action: {
          text: 'Ir a Registro',
          tab: 'registro'
        }
      });
    }

    if (['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole)) {
      baseSteps.push({
        id: 'configuracion',
        title: 'Configuración del Sistema',
        content: 'Configure los baremos y días festivos en la pestaña "Ajustes" antes de generar nóminas.',
        target: 'ajustes-tab',
        position: 'bottom',
        action: {
          text: 'Ver Configuración',
          tab: 'ajustes'
        }
      });
    }

    if (['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'REVISOR_SOLICITUDES'].includes(userRole)) {
      baseSteps.push({
        id: 'validacion',
        title: 'Proceso de Validación',
        content: 'Valide las guardias registradas antes de proceder con los cálculos de nómina para asegurar la precisión.',
        target: 'validacion-tab',
        position: 'bottom',
        action: {
          text: 'Ver Validaciones',
          tab: 'validacion'
        }
      });
    }

    baseSteps.push({
      id: 'complete',
      title: '¡Listo para comenzar!',
      content: 'Ya conoce las funcionalidades principales. Explore el sistema y use la ayuda contextual cuando lo necesite.',
      target: 'status',
      position: 'top'
    });

    return baseSteps;
  };

  const tourSteps = getTourSteps();

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  const completeTour = () => {
    setShowTour(false);
    onComplete();
    // Guardar en localStorage que el tour se completó
    localStorage.setItem(`guardias-tour-completed-${userRole}`, 'true');
  };

  const handleAction = () => {
    const step = tourSteps[currentStep];
    if (step.action && onNavigateToTab) {
      onNavigateToTab(step.action.tab);
      completeTour();
    }
  };

  const restartTour = () => {
    setCurrentStep(0);
    setShowTour(true);
  };

  // No mostrar el tour si no es primera vez o si se completó antes
  useEffect(() => {
    const tourCompleted = localStorage.getItem(`guardias-tour-completed-${userRole}`);
    if (tourCompleted && !isFirstTime) {
      setShowTour(false);
    }
  }, [userRole, isFirstTime]);

  if (!showTour) {
    // Botón para reiniciar el tour
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={restartTour}
        className="text-blue-600 hover:text-blue-700"
      >
        <Lightbulb className="w-4 h-4 mr-1" />
        Tour Guiado
      </Button>
    );
  }

  const currentTourStep = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardContent className="p-6">
          {/* Header con progreso */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">
                Paso {currentStep + 1} de {tourSteps.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
            />
          </div>

          {/* Contenido del paso */}
          <div className="space-y-4">
            <div className="text-center">
              {currentTourStep.id === 'welcome' && <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />}
              {currentTourStep.id === 'navigation' && <FileText className="w-12 h-12 text-green-600 mx-auto mb-4" />}
              {currentTourStep.id === 'configuracion' && <DollarSign className="w-12 h-12 text-purple-600 mx-auto mb-4" />}
              {currentTourStep.id === 'complete' && <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />}
            </div>

            <h3 className="text-lg font-semibold text-center text-gray-900">
              {currentTourStep.title}
            </h3>
            
            <p className="text-gray-600 text-center">
              {currentTourStep.content}
            </p>

            {/* Información específica del rol */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Su rol:</strong> {userRole}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Este tour está personalizado para sus permisos y responsabilidades.
              </p>
            </div>
          </div>

          {/* Botones de navegación */}
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>

            <div className="flex space-x-2">
              {currentTourStep.action && (
                <Button
                  onClick={handleAction}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {currentTourStep.action.text}
                </Button>
              )}
              
              <Button onClick={handleNext}>
                {currentStep === tourSteps.length - 1 ? 'Finalizar' : 'Siguiente'}
                {currentStep < tourSteps.length - 1 && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>

          {/* Botón para saltar el tour */}
          <div className="text-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              Saltar tour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
