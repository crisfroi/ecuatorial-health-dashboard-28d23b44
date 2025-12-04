import React from 'react';
import { Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const QuirofanosPage: React.FC = () => {
  const intervenciones = [
    { id: '1', paciente: 'Rosa Fernández', procedimiento: 'Apendicectomía', quirofano: '1', hora: '09:00', duracion: '45 min', estado: 'En proceso' },
    { id: '2', paciente: 'Miguel Santos', procedimiento: 'Laparoscopia', quirofano: '2', hora: '10:30', duracion: '60 min', estado: 'Programada' },
    { id: '3', paciente: 'Teresa Díaz', procedimiento: 'Cesárea', quirofano: '3', hora: '14:00', duracion: '90 min', estado: 'Programada' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quirófanos</h1>
          <p className="text-gray-500 mt-1">
            Gestione intervenciones quirúrgicas
          </p>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Nueva Intervención
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Quirófanos Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1</div>
            <p className="text-xs text-gray-500 mt-1">De 4 quirófanos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">En Proceso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1</div>
            <p className="text-xs text-gray-500 mt-1">Intervención activa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-gray-500 mt-1">Intervenciones programadas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Programación Quirúrgica</CardTitle>
          <CardDescription>Intervenciones de hoy y próximas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {intervenciones.map((int) => (
              <div key={int.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="bg-purple-100 rounded-lg p-3">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{int.paciente}</p>
                  <p className="text-sm text-gray-600">{int.procedimiento}</p>
                  <p className="text-xs text-gray-500">Quirófano {int.quirofano} - {int.hora} ({int.duracion})</p>
                </div>
                <div className="text-right">
                  <Badge variant={int.estado === 'En proceso' ? 'default' : 'outline'}>
                    {int.estado}
                  </Badge>
                  <Button variant="outline" size="sm" className="mt-2">Detalles</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuirofanosPage;
