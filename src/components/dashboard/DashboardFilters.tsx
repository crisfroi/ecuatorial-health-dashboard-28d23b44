
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, Search, Download } from 'lucide-react';

const DashboardFilters = () => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4" />
            <span>Filtros:</span>
          </div>
          
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Provincia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="malabo">Malabo</SelectItem>
              <SelectItem value="bata">Bata</SelectItem>
              <SelectItem value="ebebiyin">Ebebiyín</SelectItem>
              <SelectItem value="mongomo">Mongomo</SelectItem>
              <SelectItem value="evinayong">Evinayong</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Distrito Sanitario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distrito1">Distrito 1</SelectItem>
              <SelectItem value="distrito2">Distrito 2</SelectItem>
              <SelectItem value="distrito3">Distrito 3</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Género" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="femenino">Femenino</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Año Graduación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
              <SelectItem value="2020">2020</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2 ml-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input placeholder="Buscar profesional..." className="pl-10 w-64" />
            </div>
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
