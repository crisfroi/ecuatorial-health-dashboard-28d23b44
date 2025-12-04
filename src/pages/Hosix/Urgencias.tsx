import React from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const UrgenciasPage: React.FC = () => {
  const urgencias = [
    {
      id: '1',
      paciente: 'Carlos Pérez',
      triage: 'Nivel 2',
      hora: '14:30',
      diagnostico: 'Dolor abdominal',
      estado: 'En atención',
    },
    {
      id: '2',
      paciente: 'Ana García',
      triage: 'Nivel 3',
      hora: '14:15',
      diagnostico: 'Caída con trauma',
      estado: 'Espera',
    },
    {
      id: '3',
      paciente: 'Luis Martínez',
      triage: 'Nivel 1',
      hora: '14:00',
      diagnostico: 'Disnea severa',
      estado: 'En atención',
    },
  ];

  const getTriageColor = (nivel: string) => {
    switch (nivel) {
      case 'Nivel 1':
        return 'bg-red-100 text-red-800';
      case 'Nivel 2':
        return 'bg-orange-100 text-orange-800';
      case 'Nivel 3':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Módulo de Urgencias</h1>
          <p className="text-gray-500 mt-1">
            Gestione y registre los episodios de urgencia
          </p>
        </div>
        <Button className="gap-2 bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4" />
          Nueva Urgencia
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              En Espera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5</div>
            <p className="text-xs text-gray-500 mt-1">Pacientes esperando atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              En Atención
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-gray-500 mt-1">Siendo atendidos ahora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24</div>
            <p className="text-xs text-gray-500 mt-1">Episodios registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Urgencias List */}
      <Card>
        <CardHeader>
          <CardTitle>Urgencias Actuales</CardTitle>
          <CardDescription>Pacientes en el área de urgencias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {urgencias.map((urgencia) => (
              <div key={urgencia.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{urgencia.paciente}</p>
                    <Badge className={getTriageColor(urgencia.triage)}>
                      {urgencia.triage}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{urgencia.diagnostico}</p>
                  <p className="text-xs text-gray-500 mt-1">Registrado a las {urgencia.hora}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{urgencia.estado}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Ver Detalle
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UrgenciasPage;
