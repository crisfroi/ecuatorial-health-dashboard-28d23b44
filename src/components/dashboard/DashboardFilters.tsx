
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';

interface Filtros {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  distrito?: string;
  distrito_sanitario?: string;
  anoGraduacion?: string;
}

interface DashboardFiltersProps {
  filters: Filtros;
  onFiltersChange: (filters: Filtros) => void;
  onClearFilters: () => void;
}

const DashboardFilters = ({ filters, onFiltersChange, onClearFilters }: DashboardFiltersProps) => {
  const updateFilter = (key: keyof Filtros, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'todos' ? undefined : value
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros de Búsqueda</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onClearFilters}
            className="flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Limpiar</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Área Profesional</label>
            <Select value={filters.area_profesional || 'todos'} onValueChange={(value) => updateFilter('area_profesional', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las áreas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las áreas</SelectItem>
                <SelectItem value="Medicina">Medicina</SelectItem>
                <SelectItem value="Enfermería">Enfermería</SelectItem>
                <SelectItem value="Farmacia">Farmacia</SelectItem>
                <SelectItem value="Laboratorio">Laboratorio</SelectItem>
                <SelectItem value="Odontología">Odontología</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Estado de Solicitud</label>
            <Select value={filters.estado_solicitud || 'todos'} onValueChange={(value) => updateFilter('estado_solicitud', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="Pendiente de Firma">Pendiente de Firma</SelectItem>
                <SelectItem value="Aprobado">Aprobado</SelectItem>
                <SelectItem value="Rechazado">Rechazado</SelectItem>
                <SelectItem value="Revisando">Revisando</SelectItem>
                <SelectItem value="Recibido">Recibido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Provincia</label>
            <Select value={filters.provincia || 'todos'} onValueChange={(value) => updateFilter('provincia', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las provincias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las provincias</SelectItem>
                <SelectItem value="Conakry">Conakry</SelectItem>
                <SelectItem value="Kindia">Kindia</SelectItem>
                <SelectItem value="Boké">Boké</SelectItem>
                <SelectItem value="Labé">Labé</SelectItem>
                <SelectItem value="Faranah">Faranah</SelectItem>
                <SelectItem value="Kankan">Kankan</SelectItem>
                <SelectItem value="Nzérékoré">Nzérékoré</SelectItem>
                <SelectItem value="Mamou">Mamou</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Distrito Sanitario</label>
            <Select value={filters.distrito_sanitario || 'todos'} onValueChange={(value) => updateFilter('distrito_sanitario', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los distritos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los distritos</SelectItem>
                <SelectItem value="Distrito Sanitario de Conakry">Distrito Sanitario de Conakry</SelectItem>
                <SelectItem value="Distrito Sanitario de Kindia">Distrito Sanitario de Kindia</SelectItem>
                <SelectItem value="Distrito Sanitario de Boké">Distrito Sanitario de Boké</SelectItem>
                <SelectItem value="Distrito Sanitario de Labé">Distrito Sanitario de Labé</SelectItem>
                <SelectItem value="Distrito Sanitario de Faranah">Distrito Sanitario de Faranah</SelectItem>
                <SelectItem value="Distrito Sanitario de Kankan">Distrito Sanitario de Kankan</SelectItem>
                <SelectItem value="Distrito Sanitario de Nzérékoré">Distrito Sanitario de Nzérékoré</SelectItem>
                <SelectItem value="Distrito Sanitario de Mamou">Distrito Sanitario de Mamou</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Género</label>
            <Select value={filters.genero || 'todos'} onValueChange={(value) => updateFilter('genero', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los géneros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los géneros</SelectItem>
                <SelectItem value="MASCULINO">Masculino</SelectItem>
                <SelectItem value="FEMENINO">Femenino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tipo de Sector</label>
            <Select value={filters.tipo_sector || 'todos'} onValueChange={(value) => updateFilter('tipo_sector', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los sectores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los sectores</SelectItem>
                <SelectItem value="Público">Público</SelectItem>
                <SelectItem value="Privado">Privado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Distrito</label>
            <Select value={filters.distrito || 'todos'} onValueChange={(value) => updateFilter('distrito', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los distritos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los distritos</SelectItem>
                <SelectItem value="Kaloum">Kaloum</SelectItem>
                <SelectItem value="Dixinn">Dixinn</SelectItem>
                <SelectItem value="Matam">Matam</SelectItem>
                <SelectItem value="Matoto">Matoto</SelectItem>
                <SelectItem value="Ratoma">Ratoma</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Año de Graduación</label>
            <Select value={filters.anoGraduacion || 'todos'} onValueChange={(value) => updateFilter('anoGraduacion', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los años" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los años</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
                <SelectItem value="2020">2020</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardFilters;
