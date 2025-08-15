import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle, Clock, AlertCircle, DollarSign } from 'lucide-react';

const PagosGuardias: React.FC = () => {
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendientes' | 'pagados' | 'rechazados'>('pendientes');

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Gestión de Pagos
          </h2>
          <p className="text-gray-600">
            Control y seguimiento de pagos de guardias médicas
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={filtroEstado === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado('todos')}
          >
            Todos
          </Button>
          <Button
            variant={filtroEstado === 'pendientes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado('pendientes')}
          >
            Pendientes
          </Button>
          <Button
            variant={filtroEstado === 'pagados' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado('pagados')}
          >
            Pagados
          </Button>
          <Button
            variant={filtroEstado === 'rechazados' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado('rechazados')}
          >
            Rechazados
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">€42,150</div>
            <p className="text-xs text-muted-foreground">23 pagos pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€128,350</div>
            <p className="text-xs text-muted-foreground">87 pagos realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">€3,200</div>
            <p className="text-xs text-muted-foreground">2 pagos rechazados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">€173,700</div>
            <p className="text-xs text-muted-foreground">112 pagos totales</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pagos</CardTitle>
          <CardDescription>
            Estado y seguimiento de todos los pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">Sistema de Pagos</h3>
            <p>Esta funcionalidad se está implementando.</p>
            <p className="text-sm mt-2">
              Incluirá seguimiento completo del estado de pagos y notificaciones automáticas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PagosGuardias;
