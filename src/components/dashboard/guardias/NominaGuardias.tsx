import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, DollarSign, Calculator } from 'lucide-react';

const NominaGuardias: React.FC = () => {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>('2024-01');

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Gestión de Nómina
          </h2>
          <p className="text-gray-600">
            Generación automática de nóminas y cálculo de pagos
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="sm" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calcular Nómina
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nómina</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€85,420</div>
            <p className="text-xs text-muted-foreground">Enero 2024</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profesionales</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">47</div>
            <p className="text-xs text-muted-foreground">Con guardias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Totales</CardTitle>
            <Calculator className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">1,243</div>
            <p className="text-xs text-muted-foreground">Horas de guardia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
            <Badge variant="outline" className="text-orange-600">
              Pendiente
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">85%</div>
            <p className="text-xs text-muted-foreground">Completado</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nómina Detallada</CardTitle>
          <CardDescription>
            Desglose por profesional y categoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">Generación de Nómina</h3>
            <p>Esta funcionalidad se está implementando.</p>
            <p className="text-sm mt-2">
              Incluirá cálculo automático de pagos según baremos y categorías.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NominaGuardias;
