import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Users, Search, Filter } from 'lucide-react';
const HealthCenters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Datos simulados de centros de salud
  const centros = [{
    id: 1,
    nombre: 'Hospital Regional de Malabo',
    categoria: 'HOSPITAL',
    provincia: 'Bioko Norte',
    distrito: 'Malabo',
    sector: 'Público',
    profesionales: 156,
    especialidades: ['Medicina General', 'Cirugía', 'Pediatría', 'Ginecología'],
    director: 'Dr. Carlos Obiang Nguema',
    telefono: '+240 333 123 456',
    estado: 'Activo'
  }, {
    id: 2,
    nombre: 'Centro de Salud de Bata',
    categoria: 'CENTRO DE SALUD',
    provincia: 'Litoral',
    distrito: 'Bata',
    sector: 'Público',
    profesionales: 45,
    especialidades: ['Medicina General', 'Enfermería', 'Laboratorio'],
    director: 'Dra. María Nsue Ela',
    telefono: '+240 333 987 654',
    estado: 'Activo'
  }, {
    id: 3,
    nombre: 'Clínica Santa Isabel',
    categoria: 'CLINICA',
    provincia: 'Bioko Norte',
    distrito: 'Malabo',
    sector: 'Privado',
    profesionales: 28,
    especialidades: ['Medicina General', 'Odontología', 'Radiología'],
    director: 'Dr. José Mba Obono',
    telefono: '+240 333 555 777',
    estado: 'Activo'
  }, {
    id: 4,
    nombre: 'Farmacia Central Malabo',
    categoria: 'FARMACIA',
    provincia: 'Bioko Norte',
    distrito: 'Malabo',
    sector: 'Privado',
    profesionales: 8,
    especialidades: ['Farmacia'],
    director: 'Farm. Ana Nguema Mba',
    telefono: '+240 333 444 888',
    estado: 'Activo'
  }, {
    id: 5,
    nombre: 'Laboratorio Clínico Continental',
    categoria: 'LABORATORIO',
    provincia: 'Litoral',
    distrito: 'Bata',
    sector: 'Privado',
    profesionales: 12,
    especialidades: ['Laboratorio', 'Microbiología'],
    director: 'Dra. Carmen Obiang Asue',
    telefono: '+240 333 222 999',
    estado: 'Activo'
  }, {
    id: 6,
    nombre: 'Consultorio Médico Evinayong',
    categoria: 'CONSULTORIO',
    provincia: 'Centro Sur',
    distrito: 'Evinayong',
    sector: 'Público',
    profesionales: 6,
    especialidades: ['Medicina General', 'Enfermería'],
    director: 'Dr. Luis Mba Ela',
    telefono: '+240 333 111 333',
    estado: 'Activo'
  }];
  const categorias = ['HOSPITAL', 'CLINICA', 'CENTRO DE SALUD', 'CONSULTORIO', 'FARMACIA', 'LABORATORIO'];
  const centrosFiltrados = centros.filter(centro => {
    const matchesSearch = centro.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || centro.provincia.toLowerCase().includes(searchTerm.toLowerCase()) || centro.director.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || centro.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'HOSPITAL':
        return 'bg-red-100 text-red-800';
      case 'CLINICA':
        return 'bg-blue-100 text-blue-800';
      case 'CENTRO DE SALUD':
        return 'bg-green-100 text-green-800';
      case 'CONSULTORIO':
        return 'bg-yellow-100 text-yellow-800';
      case 'FARMACIA':
        return 'bg-purple-100 text-purple-800';
      case 'LABORATORIO':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getSectorColor = (sector: string) => {
    return sector === 'Público' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800';
  };
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Centros de Salud</h2>
          <p className="text-gray-600 mt-1">Gestión de centros de trabajo sanitarios</p>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Total Centros</h3>
                <p className="text-2xl font-bold text-blue-600">{centros.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Total Profesionales</h3>
                <p className="text-2xl font-bold text-green-600">
                  {centros.reduce((sum, centro) => sum + centro.profesionales, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Provincias</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(centros.map(c => c.provincia)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Building2 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Sector Público</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {centros.filter(c => c.sector === 'Público').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros de Búsqueda</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Buscar centro</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Nombre, provincia o director..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Categoría</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">Todas las categorías</option>
                {categorias.map(categoria => <option key={categoria} value={categoria}>{categoria}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de centros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Centros de Salud</span>
            <Badge variant="outline">{centrosFiltrados.length} centros</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Centro</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Profesionales</TableHead>
                <TableHead>Director</TableHead>
                <TableHead>Contacto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {centrosFiltrados.map(centro => <TableRow key={centro.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{centro.nombre}</div>
                      <div className="text-sm text-gray-500">
                        {centro.especialidades.slice(0, 2).join(', ')}
                        {centro.especialidades.length > 2 && ` +${centro.especialidades.length - 2} más`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(centro.categoria)}>
                      {centro.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{centro.provincia}</div>
                      <div className="text-sm text-gray-500">{centro.distrito}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSectorColor(centro.sector)}>
                      {centro.sector}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{centro.profesionales}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{centro.director}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{centro.telefono}</div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>;
};
export default HealthCenters;