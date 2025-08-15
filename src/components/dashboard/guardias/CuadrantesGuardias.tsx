import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Plus, Eye, Edit, Trash2 } from 'lucide-react';

const CuadrantesGuardias: React.FC = () => {
  const [vistaActual, setVistaActual] = useState<'mensual' | 'semanal' | 'diaria'>('mensual');

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Cuadrantes de Guardias
          </h2>
          <p className="text-gray-600">
            Planificación y visualización de turnos de guardias médicas
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={vistaActual === 'mensual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVistaActual('mensual')}
          >
            Mensual
          </Button>
          <Button
            variant={vistaActual === 'semanal' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVistaActual('semanal')}
          >
            Semanal
          </Button>
          <Button
            variant={vistaActual === 'diaria' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVistaActual('diaria')}
          >
            Diaria
          </Button>
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Cuadrante
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vista {vistaActual.charAt(0).toUpperCase() + vistaActual.slice(1)}</CardTitle>
          <CardDescription>
            Cuadrante de guardias para el período seleccionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">Cuadrante en desarrollo</h3>
            <p>Esta funcionalidad se está implementando.</p>
            <p className="text-sm mt-2">
              Permitirá visualizar y gestionar los cuadrantes de guardias en formato calendario.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CuadrantesGuardias;
