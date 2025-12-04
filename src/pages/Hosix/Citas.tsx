import React from 'react';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CitasPage: React.FC = () => {
  const citas = [
    { id: '1', paciente: 'Juan López', servicio: 'Cardiología', fecha: '15/01/2025', hora: '09:30', estado: 'Confirmada' },
    { id: '2', paciente: 'María García', servicio: 'Pediatría', fecha: '15/01/2025', hora: '10:00', estado: 'Confirmada' },
    { id: '3', paciente: 'Pedro Martínez', servicio: 'Neurology', fecha: '16/01/2025', hora: '11:30', estado: 'Pendiente' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Citas y Agendas</h1>
          <p className="text-gray-500 mt-1">
            Gestione y programe citas médicas
          </p>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Nueva Cita
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <p className="text-xs text-gray-500 mt-1">Citas programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Esta Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">42</div>
            <p className="text-xs text-gray-500 mt-1">Total de citas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">En Espera</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-gray-500 mt-1">Confirmación pendiente</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas Citas</CardTitle>
          <CardDescription>Citas programadas para los próximos días</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {citas.map((cita) => (
              <div key={cita.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="bg-blue-100 rounded-lg p-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{cita.paciente}</p>
                  <p className="text-sm text-gray-600">{cita.servicio}</p>
                  <p className="text-xs text-gray-500">{cita.fecha} a las {cita.hora}</p>
                </div>
                <Badge variant="outline">{cita.estado}</Badge>
                <Button variant="outline" size="sm">Detalles</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CitasPage;
