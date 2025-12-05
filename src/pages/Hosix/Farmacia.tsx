import React from 'react';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const FarmaciaPage: React.FC = () => {
  const medicamentos = [
    { id: '1', nombre: 'Amoxicilina 500mg', stock: 250, minimo: 100, estado: 'Normal' },
    { id: '2', nombre: 'Paracetamol 500mg', stock: 45, minimo: 100, estado: 'Bajo' },
    { id: '3', nombre: 'Ibuprofeno 400mg', stock: 320, minimo: 100, estado: 'Normal' },
  ];

  const prescripciones = [
    { id: '1', paciente: 'José Ruiz', medicamento: 'Diclofenaco', cantidad: 30, estado: 'Pendiente' },
    { id: '2', paciente: 'Laura Vega', medicamento: 'Atorvastatina', cantidad: 60, estado: 'Dispensado' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Farmacia</h1>
          <p className="text-gray-500 mt-1">
            Gestione medicamentos y prescripciones
          </p>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Nueva Prescripción
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Medicamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">156</div>
            <p className="text-xs text-gray-500 mt-1">Tipos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">5</div>
            <p className="text-xs text-gray-500 mt-1">Medicamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Prescripciones Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-xs text-gray-500 mt-1">Dispensaciones pendientes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Control de Stock</CardTitle>
            <CardDescription>Medicamentos en inventario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {medicamentos.map((med) => (
                <div key={med.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="bg-blue-100 rounded p-2">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{med.nombre}</p>
                    <p className="text-xs text-gray-500">Stock: {med.stock} unidades</p>
                  </div>
                  <Badge
                    variant={med.estado === 'Normal' ? 'outline' : 'destructive'}
                  >
                    {med.estado}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prescripciones Recientes</CardTitle>
            <CardDescription>Medicamentos prescritos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prescripciones.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="bg-green-100 rounded p-2">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{p.paciente}</p>
                    <p className="text-xs text-gray-500">{p.medicamento} - {p.cantidad} unidades</p>
                  </div>
                  <Badge variant={p.estado === 'Dispensado' ? 'default' : 'outline'}>
                    {p.estado}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FarmaciaPage;
