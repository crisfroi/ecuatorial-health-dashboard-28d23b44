
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Users } from 'lucide-react';
import { useProfesionales } from '@/hooks/useProfesionales';

const HealthCenters = () => {
  const { data: profesionales = [] } = useProfesionales();

  // Agrupar profesionales por centro
  const centrosPorNombre = profesionales.reduce((acc, prof) => {
    const centro = prof.nombre_centro || 'Sin especificar';
    if (!acc[centro]) {
      acc[centro] = {
        nombre: centro,
        categoria: prof.categoria_centro || 'No especificada',
        sector: prof.tipo_sector || 'No especificado',
        provincia: prof.provincia || 'No especificada',
        distrito: prof.distrito || 'No especificado',
        profesionales: []
      };
    }
    acc[centro].profesionales.push(prof);
    return acc;
  }, {} as Record<string, any>);

  const centros = Object.values(centrosPorNombre);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Centros de Salud</h2>
          <p className="text-gray-600">Gestión de centros sanitarios y personal asignado</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {centros.length} centros registrados
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {centros.map((centro, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg line-clamp-1">{centro.nombre}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {centro.categoria}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{centro.distrito}, {centro.provincia}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {centro.profesionales.length} profesionales
                  </span>
                </div>
                <Badge 
                  variant={centro.sector === 'Público' ? 'default' : 'outline'}
                  className="text-xs"
                >
                  {centro.sector}
                </Badge>
              </div>

              <div className="border-t pt-3">
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Por área profesional:</div>
                  {Object.entries(
                    centro.profesionales.reduce((acc: Record<string, number>, prof: any) => {
                      const area = prof.area_profesional || 'Sin especificar';
                      acc[area] = (acc[area] || 0) + 1;
                      return acc;
                    }, {})
                  ).slice(0, 3).map(([area, count]) => (
                    <div key={area} className="flex justify-between">
                      <span className="truncate">{area}:</span>
                      <span className="font-medium">{String(count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {centros.length === 0 && (
        <Card className="p-8 text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay centros registrados
          </h3>
          <p className="text-gray-600">
            Los centros aparecerán aquí cuando se registren profesionales con lugares de trabajo.
          </p>
        </Card>
      )}
    </div>
  );
};

export default HealthCenters;
