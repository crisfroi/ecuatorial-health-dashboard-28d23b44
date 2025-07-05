import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, MapPin, Users, Search, Filter, Phone, Eye } from 'lucide-react';
const HealthCenters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCenter, setSelectedCenter] = useState(null);

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

      {/* Vista Kanban de Centros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {centrosFiltrados.map(centro => (
          <Card key={centro.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{centro.nombre}</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{centro.provincia}, {centro.distrito}</span>
                  </div>
                </div>
                <Badge className={getCategoryColor(centro.categoria)}>
                  {centro.categoria}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    <Users className="w-4 h-4 mr-2 text-blue-600" />
                    <span>{centro.profesionales} profesionales</span>
                  </div>
                  <Badge className={getSectorColor(centro.sector)}>
                    {centro.sector}
                  </Badge>
                </div>

                <div className="text-sm text-gray-600">
                  <strong>Director:</strong> {centro.director}
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>{centro.telefono}</span>
                </div>

                <div className="text-sm">
                  <div className="text-gray-600 mb-1">Especialidades:</div>
                  <div className="flex flex-wrap gap-1">
                    {centro.especialidades.slice(0, 2).map((esp, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {esp}
                      </span>
                    ))}
                    {centro.especialidades.length > 2 && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        +{centro.especialidades.length - 2} más
                      </span>
                    )}
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => setSelectedCenter(centro)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <span>{centro.nombre}</span>
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Información General</h4>
                          <div className="space-y-2 text-sm">
                            <div><strong>Categoría:</strong> {centro.categoria}</div>
                            <div><strong>Sector:</strong> {centro.sector}</div>
                            <div><strong>Estado:</strong> {centro.estado}</div>
                            <div><strong>Profesionales:</strong> {centro.profesionales}</div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Ubicación</h4>
                          <div className="space-y-2 text-sm">
                            <div><strong>Provincia:</strong> {centro.provincia}</div>
                            <div><strong>Distrito:</strong> {centro.distrito}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Contacto</h4>
                          <div className="space-y-2 text-sm">
                            <div><strong>Director:</strong> {centro.director}</div>
                            <div><strong>Teléfono:</strong> {centro.telefono}</div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Especialidades</h4>
                          <div className="flex flex-wrap gap-2">
                            {centro.especialidades.map((esp, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {esp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>;
};
export default HealthCenters;