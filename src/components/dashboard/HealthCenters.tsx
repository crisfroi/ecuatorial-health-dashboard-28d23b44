
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, MapPin, ArrowLeft, Filter } from 'lucide-react';
import { useProfesionales } from '@/hooks/useProfesionales';
import ChartActions from './ChartActions';

interface HealthCenter {
  name: string;
  category: string;
  district: string;
  province: string;
  sanitaryDistrict: string;
  totalProfessionals: number;
  approvedProfessionals: number;
  pendingProfessionals: number;
  rejectedProfessionals: number;
}

interface HealthCentersProps {
  userRole: string;
}

const HealthCenters = ({ userRole }: HealthCentersProps) => {
  const [selectedCenter, setSelectedCenter] = useState<HealthCenter | null>(null);
  const [filters, setFilters] = useState({
    categoria: 'todos',
    genero: 'todos',
    especialidad: 'todos',
    area_profesional: 'todos'
  });

  const { data: profesionales = [] } = useProfesionales();

  // Agrupar profesionales por centro de salud
  const healthCenters = profesionales.reduce((acc, prof) => {
    const centerName = prof.lugar_trabajo || 'Centro no especificado';
    const key = `${centerName}-${prof.categoria_centro || 'Sin categoría'}`;
    
    if (!acc[key]) {
      acc[key] = {
        name: centerName,
        category: prof.categoria_centro || 'Sin categoría',
        district: prof.distrito || 'Sin especificar',
        province: prof.provincia || 'Sin especificar',
        sanitaryDistrict: prof.distrito_sanitario || 'Sin especificar',
        totalProfessionals: 0,
        approvedProfessionals: 0,
        pendingProfessionals: 0,
        rejectedProfessionals: 0,
        professionals: []
      };
    }
    
    acc[key].totalProfessionals++;
    acc[key].professionals.push(prof);
    
    switch (prof.estado_solicitud) {
      case 'Aprobado':
        acc[key].approvedProfessionals++;
        break;
      case 'Pendiente':
        acc[key].pendingProfessionals++;
        break;
      case 'Rechazado':
        acc[key].rejectedProfessionals++;
        break;
    }
    
    return acc;
  }, {} as Record<string, any>);

  const centersArray = Object.values(healthCenters) as HealthCenter[];

  // Filtrar centros según filtros seleccionados
  const filteredCenters = centersArray.filter(center => {
    if (filters.categoria !== 'todos' && center.category !== filters.categoria) {
      return false;
    }
    return true;
  });

  // Obtener profesionales del centro seleccionado con filtros aplicados
  const getFilteredProfessionals = () => {
    if (!selectedCenter) return [];
    
    const centerData = healthCenters[`${selectedCenter.name}-${selectedCenter.category}`];
    if (!centerData) return [];
    
    return centerData.professionals.filter((prof: any) => {
      if (filters.genero !== 'todos' && prof.genero !== filters.genero) return false;
      if (filters.especialidad !== 'todos' && prof.especialidad !== filters.especialidad) return false;
      if (filters.area_profesional !== 'todos' && prof.area_profesional !== filters.area_profesional) return false;
      return true;
    });
  };

  const clearFilters = () => {
    setFilters({
      categoria: 'todos',
      genero: 'todos',
      especialidad: 'todos',
      area_profesional: 'todos'
    });
  };

  if (selectedCenter) {
    const filteredProfessionals = getFilteredProfessionals();
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedCenter(null)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Centros</span>
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{selectedCenter.name}</h2>
              <p className="text-gray-600">{selectedCenter.category} - {selectedCenter.district}, {selectedCenter.province}</p>
            </div>
          </div>
        </div>

        {/* Filtros para profesionales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtros de Profesionales</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Género</label>
                <Select value={filters.genero} onValueChange={(value) => setFilters({...filters, genero: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="MASCULINO">Masculino</SelectItem>
                    <SelectItem value="FEMENINO">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Especialidad</label>
                <Select value={filters.especialidad} onValueChange={(value) => setFilters({...filters, especialidad: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="Medicina General">Medicina General</SelectItem>
                    <SelectItem value="Enfermería">Enfermería</SelectItem>
                    <SelectItem value="Pediatría">Pediatría</SelectItem>
                    <SelectItem value="Ginecología">Ginecología</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Área Profesional</label>
                <Select value={filters.area_profesional} onValueChange={(value) => setFilters({...filters, area_profesional: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="Medicina">Medicina</SelectItem>
                    <SelectItem value="Enfermería">Enfermería</SelectItem>
                    <SelectItem value="Farmacia">Farmacia</SelectItem>
                    <SelectItem value="Laboratorio">Laboratorio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de profesionales */}
        <Card>
          <CardHeader>
            <CardTitle>Profesionales ({filteredProfessionals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProfessionals.map((prof: any) => (
                <div key={prof.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{prof.nombre_completo}</h3>
                      <p className="text-sm text-gray-600">{prof.area_profesional} - {prof.especialidad}</p>
                      <p className="text-sm text-gray-500">{prof.genero} - {prof.provincia}</p>
                    </div>
                    <Badge variant={
                      prof.estado_solicitud === 'Aprobado' ? 'default' :
                      prof.estado_solicitud === 'Pendiente' ? 'secondary' :
                      'destructive'
                    }>
                      {prof.estado_solicitud}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Centros de Salud</h2>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoría de Centro</label>
              <Select value={filters.categoria} onValueChange={(value) => setFilters({...filters, categoria: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las categorías</SelectItem>
                  <SelectItem value="HOSPITALES">Hospitales</SelectItem>
                  <SelectItem value="CENTROS DE SALUD">Centros de Salud</SelectItem>
                  <SelectItem value="CLÍNICAS">Clínicas</SelectItem>
                  <SelectItem value="CONSULTORIOS">Consultorios</SelectItem>
                  <SelectItem value="FARMACIAS">Farmacias</SelectItem>
                  <SelectItem value="LABORATORIOS">Laboratorios</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de centros de salud */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCenters.map((center, index) => (
          <ChartActions key={index} title={`Estadísticas de ${center.name}`}>
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedCenter(center)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Building2 className="w-8 h-8 text-blue-600" />
                  <Badge variant="outline">{center.category}</Badge>
                </div>
                <CardTitle className="text-lg">{center.name}</CardTitle>
                <CardDescription className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{center.district}, {center.province}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Total Profesionales</span>
                    </div>
                    <Badge variant="secondary">{center.totalProfessionals}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <div className="text-green-600 font-semibold">{center.approvedProfessionals}</div>
                      <div className="text-gray-500">Aprobados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 font-semibold">{center.pendingProfessionals}</div>
                      <div className="text-gray-500">Pendientes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-600 font-semibold">{center.rejectedProfessionals}</div>
                      <div className="text-gray-500">Rechazados</div>
                    </div>
                  </div>
                  
                  {center.sanitaryDistrict !== 'Sin especificar' && (
                    <div className="text-xs text-gray-500 border-t pt-2">
                      Distrito Sanitario: {center.sanitaryDistrict}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </ChartActions>
        ))}
      </div>

      {filteredCenters.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron centros de salud con los filtros aplicados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HealthCenters;
