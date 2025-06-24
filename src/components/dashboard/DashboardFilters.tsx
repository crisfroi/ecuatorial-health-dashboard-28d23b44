
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, Search, Download, X } from 'lucide-react';

interface DashboardFiltersProps {
  onFiltersChange?: (filters: any) => void;
  activeFilters?: any;
}

const DashboardFilters = ({ onFiltersChange, activeFilters }: DashboardFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState(activeFilters?.search || '');
  const [provincia, setProvincia] = useState(activeFilters?.provincia || 'todos');
  const [distrito, setDistrito] = useState(activeFilters?.distrito || 'todos');
  const [genero, setGenero] = useState(activeFilters?.genero || 'todos');
  const [anoGraduacion, setAnoGraduacion] = useState(activeFilters?.anoGraduacion || 'todos');

  const handleFilterChange = () => {
    const filters = {
      search: searchTerm,
      provincia: provincia === 'todos' ? '' : provincia,
      distrito: distrito === 'todos' ? '' : distrito,
      genero: genero === 'todos' ? '' : genero,
      anoGraduacion: anoGraduacion === 'todos' ? '' : anoGraduacion
    };
    
    console.log('Dashboard filters changing:', filters);
    
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setProvincia('todos');
    setDistrito('todos');
    setGenero('todos');
    setAnoGraduacion('todos');
    
    console.log('Clearing all filters');
    
    if (onFiltersChange) {
      onFiltersChange({});
    }
  };

  const hasActiveFilters = searchTerm || provincia !== 'todos' || distrito !== 'todos' || genero !== 'todos' || anoGraduacion !== 'todos';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4" />
            <span>Filtros:</span>
          </div>
          
          <Select value={provincia} onValueChange={(value) => {
            setProvincia(value);
            setTimeout(handleFilterChange, 100);
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Provincia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las provincias</SelectItem>
              <SelectItem value="Malabo">Malabo</SelectItem>
              <SelectItem value="Bata">Bata</SelectItem>
              <SelectItem value="Ebebiyín">Ebebiyín</SelectItem>
              <SelectItem value="Mongomo">Mongomo</SelectItem>
              <SelectItem value="Evinayong">Evinayong</SelectItem>
            </SelectContent>
          </Select>

          <Select value={distrito} onValueChange={(value) => {
            setDistrito(value);
            setTimeout(handleFilterChange, 100);
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Distrito Sanitario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los distritos</SelectItem>
              <SelectItem value="Distrito Malabo Norte">Distrito Malabo Norte</SelectItem>
              <SelectItem value="Distrito Malabo Sur">Distrito Malabo Sur</SelectItem>
              <SelectItem value="Distrito Bata Centro">Distrito Bata Centro</SelectItem>
              <SelectItem value="Distrito Bata Este">Distrito Bata Este</SelectItem>
              <SelectItem value="Distrito Ebebiyín">Distrito Ebebiyín</SelectItem>
              <SelectItem value="Distrito Mongomo">Distrito Mongomo</SelectItem>
              <SelectItem value="Distrito Evinayong">Distrito Evinayong</SelectItem>
            </SelectContent>
          </Select>

          <Select value={genero} onValueChange={(value) => {
            setGenero(value);
            setTimeout(handleFilterChange, 100);
          }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Género" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Femenino</SelectItem>
            </SelectContent>
          </Select>

          <Select value={anoGraduacion} onValueChange={(value) => {
            setAnoGraduacion(value);
            setTimeout(handleFilterChange, 100);
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Año Graduación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los años</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
              <SelectItem value="2020">2020</SelectItem>
              <SelectItem value="2019">2019</SelectItem>
              <SelectItem value="2018">2018</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2 ml-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Buscar profesional..." 
                className="pl-10 w-64" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setTimeout(handleFilterChange, 300);
                }}
              />
            </div>
            
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpiar
              </Button>
            )}
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardFilters;
