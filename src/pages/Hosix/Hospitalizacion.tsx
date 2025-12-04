import React from 'react';
import { Plus, Bed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const HospitalizacionPage: React.FC = () => {
  const episodios = [
    { id: '1', paciente: 'Carlos López', servicio: 'Medicina General', cama: '201', diagnostico: 'Infección respiratoria', dias: 3 },
    { id: '2', paciente: 'Ana García', servicio: 'Cirugía', cama: '315', diagnostico: 'Post operatorio', dias: 2 },
    { id: '3', paciente: 'Luis Martínez', servicio: 'Cardiología', cama: '412', diagnostico: 'Infarto miocardio', dias: 5 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hospitalización</h1>
          <p className="text-gray-500 mt-1">
            Gestione pacientes hospitalizados y camas
          </p>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Nuevo Ingreso
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Camas Ocupadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">45</div>
            <p className="text-xs text-gray-500 mt-1">De 60 disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tasa Ocupación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">75%</div>
            <p className="text-xs text-gray-500 mt-1">Capacidad actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Est. Media Estancia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4.2</div>
            <p className="text-xs text-gray-500 mt-1">Días promedio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Altas Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2</div>
            <p className="text-xs text-gray-500 mt-1">Pacientes dados de alta</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pacientes Hospitalizados</CardTitle>
          <CardDescription>Episodios activos de hospitalización</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {episodios.map((ep) => (
              <div key={ep.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="bg-green-100 rounded-lg p-3">
                  <Bed className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{ep.paciente}</p>
                  <p className="text-sm text-gray-600">{ep.servicio} - Cama {ep.cama}</p>
                  <p className="text-xs text-gray-500">{ep.diagnostico}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{ep.dias} días</Badge>
                  <Button variant="outline" size="sm" className="mt-2">Ver</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HospitalizacionPage;
