import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Check, X, Clock, AlertTriangle } from 'lucide-react';

const ValidacionGuardias: React.FC = () => {
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendientes' | 'validadas' | 'rechazadas'>('pendientes');

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Validación de Guardias
          </h2>
          <p className="text-gray-600">
            Proceso de validación multi-etapa con firmas digitales
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={filtroEstado === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado('todos')}
          >
            Todas
          </Button>
          <Button
            variant={filtroEstado === 'pendientes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado('pendientes')}
          >
            Pendientes
          </Button>
          <Button
            variant={filtroEstado === 'validadas' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado('validadas')}
          >
            Validadas
          </Button>
          <Button
            variant={filtroEstado === 'rechazadas' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado('rechazadas')}
          >
            Rechazadas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">12</div>
            <p className="text-xs text-muted-foreground">Requieren validación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validadas</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">45</div>
            <p className="text-xs text-muted-foreground">Aprobadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <p className="text-xs text-muted-foreground">Con observaciones</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Guardias para Validación</CardTitle>
          <CardDescription>
            Guardias que requieren validación y aprobación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">Sistema de Validación</h3>
            <p>Esta funcionalidad se está implementando.</p>
            <p className="text-sm mt-2">
              Incluirá proceso multi-etapa de validación con firmas digitales.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ValidacionGuardias;
