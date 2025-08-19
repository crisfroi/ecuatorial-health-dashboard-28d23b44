import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  Book, 
  PlayCircle, 
  CheckCircle,
  ArrowRight,
  X,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  Users,
  BarChart3
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tab: string;
  role?: string[];
}

interface GuardiasHelpSystemProps {
  userRole: string;
  onNavigateToTab?: (tab: string) => void;
}

export const GuardiasHelpSystem: React.FC<GuardiasHelpSystemProps> = ({
  userRole,
  onNavigateToTab
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showQuickStart, setShowQuickStart] = useState(false);

  const getGuideSteps = (): GuideStep[] => {
    const allSteps: GuideStep[] = [
      {
        id: 'registro',
        title: 'Registrar Guardias',
        description: 'Comience registrando las guardias médicas del mes. Asigne profesionales, turnos y horarios.',
        icon: <Calendar className="w-5 h-5" />,
        tab: 'registro',
        role: ['SUPER_ADMINISTRADOR', 'DIRECTIVO_CENTRO_SANITARIO']
      },
      {
        id: 'cuadrantes',
        title: 'Generar Cuadrantes',
        description: 'Organice las guardias en cuadrantes mensuales para una mejor visualización y planificación.',
        icon: <FileText className="w-5 h-5" />,
        tab: 'cuadrantes',
        role: ['SUPER_ADMINISTRADOR', 'DIRECTIVO_CENTRO_SANITARIO', 'REVISOR_SOLICITUDES']
      },
      {
        id: 'validacion',
        title: 'Validar Guardias',
        description: 'Revise y valide las guardias registradas antes de proceder con los cálculos de nómina.',
        icon: <CheckCircle className="w-5 h-5" />,
        tab: 'validacion',
        role: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'REVISOR_SOLICITUDES']
      },
      {
        id: 'nomina',
        title: 'Generar Nóminas',
        description: 'Calcule automáticamente las nóminas basadas en los baremos y guardias realizadas.',
        icon: <DollarSign className="w-5 h-5" />,
        tab: 'nomina',
        role: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL']
      },
      {
        id: 'pagos',
        title: 'Procesar Pagos',
        description: 'Gestione los pagos a profesionales una vez aprobadas las nóminas.',
        icon: <DollarSign className="w-5 h-5" />,
        tab: 'pagos',
        role: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL']
      },
      {
        id: 'reportes',
        title: 'Generar Reportes',
        description: 'Consulte estadísticas y genere reportes para análisis y seguimiento.',
        icon: <BarChart3 className="w-5 h-5" />,
        tab: 'reportes',
        role: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO', 'REVISOR_SOLICITUDES']
      },
      {
        id: 'ajustes',
        title: 'Configurar Sistema',
        description: 'Configure baremos, días festivos y ajustes específicos del sistema.',
        icon: <Settings className="w-5 h-5" />,
        tab: 'ajustes',
        role: ['SUPER_ADMINISTRADOR']
      }
    ];

    return allSteps.filter(step => 
      !step.role || step.role.includes(userRole)
    );
  };

  const guideSteps = getGuideSteps();

  const quickStartGuides = [
    {
      title: 'Primer Uso - Configuración Inicial',
      description: 'Configure baremos y días festivos antes de registrar guardias',
      steps: ['ajustes', 'registro', 'cuadrantes'],
      role: ['SUPER_ADMINISTRADOR']
    },
    {
      title: 'Flujo Mensual - Gestión Completa',
      description: 'Proceso completo desde registro hasta pago de guardias',
      steps: ['registro', 'validacion', 'nomina', 'pagos'],
      role: ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL']
    },
    {
      title: 'Director de Centro - Gestión Diaria',
      description: 'Funciones principales para directores de centros de salud',
      steps: ['registro', 'cuadrantes', 'reportes'],
      role: ['DIRECTIVO_CENTRO_SANITARIO']
    },
    {
      title: 'Revisor - Validación de Guardias',
      description: 'Proceso de revisión y validación de guardias médicas',
      steps: ['validacion', 'cuadrantes', 'reportes'],
      role: ['REVISOR_SOLICITUDES']
    }
  ];

  const availableGuides = quickStartGuides.filter(guide => 
    guide.role.includes(userRole)
  );

  const handleStepNavigation = (stepId: string) => {
    if (onNavigateToTab) {
      onNavigateToTab(stepId);
    }
    setIsHelpOpen(false);
  };

  const handleQuickStartStep = (stepId: string) => {
    handleStepNavigation(stepId);
  };

  return (
    <div className="relative">
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <HelpCircle className="w-4 h-4 mr-1" />
            Ayuda
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Book className="w-5 h-5" />
              <span>Sistema de Ayuda - Gestión de Guardias</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Guías de inicio rápido */}
            {availableGuides.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <PlayCircle className="w-5 h-5 text-blue-600" />
                  <span>Guías de Inicio Rápido</span>
                </h3>
                <div className="grid gap-3">
                  {availableGuides.map((guide, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {guide.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-3">
                              {guide.description}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {guide.steps.map((stepId, stepIndex) => {
                                const step = guideSteps.find(s => s.id === stepId);
                                return step ? (
                                  <Badge 
                                    key={stepIndex} 
                                    variant="outline" 
                                    className="text-xs"
                                  >
                                    {stepIndex + 1}. {step.title}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => setShowQuickStart(index)}
                          >
                            Iniciar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Pasos detallados */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Funcionalidades Disponibles</h3>
              <div className="space-y-3">
                {guideSteps.map((step, index) => (
                  <Card 
                    key={step.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleStepNavigation(step.tab)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            {step.icon}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {step.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {step.description}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Información adicional */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">
                      ¿Necesita más ayuda?
                    </h4>
                    <p className="text-sm text-blue-800 mb-2">
                      Su rol actual es: <Badge className="bg-blue-100 text-blue-800">{userRole}</Badge>
                    </p>
                    <p className="text-sm text-blue-700">
                      Las funcionalidades mostradas están adaptadas a sus permisos. 
                      Si necesita acceso a funciones adicionales, contacte con el administrador del sistema.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para guía paso a paso */}
      <Dialog open={showQuickStart !== false} onOpenChange={() => setShowQuickStart(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showQuickStart !== false && availableGuides[showQuickStart as number]?.title}
            </DialogTitle>
          </DialogHeader>
          
          {showQuickStart !== false && (
            <div className="space-y-4">
              <p className="text-gray-600">
                {availableGuides[showQuickStart as number]?.description}
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium">Pasos a seguir:</h4>
                {availableGuides[showQuickStart as number]?.steps.map((stepId, index) => {
                  const step = guideSteps.find(s => s.id === stepId);
                  return step ? (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleQuickStartStep(stepId)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                        {step.icon}
                        <span className="font-medium">{step.title}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
