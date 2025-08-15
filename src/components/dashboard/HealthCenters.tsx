
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  useCentrosSalud, 
  useBuscarCentros, 
  useProfesionalesPorCentro,
  useCrearCentro,
  type CentroSalud 
} from '@/hooks/useCentrosSalud';
import { Building2, Search, Plus, Users, MapPin } from 'lucide-react';

const HealthCenters = () => {
  const { data: centros = [], isLoading } = useCentrosSalud();
  const buscarCentrosMutation = useBuscarCentros();
  const crearCentroMutation = useCrearCentro();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCentros, setFilteredCentros] = useState<CentroSalud[]>([]);
  const [selectedCentro, setSelectedCentro] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCentro, setNewCentro] = useState({
    nombre: '',
    categoria: '',
    distrito_sanitario: '',
    sector: '',
    provincia: '',
    distrito: '',
    director: '',
    telefono: '',
    estado: 'activo'
  });

  const { data: profesionalesCentro = [] } = useProfesionalesPorCentro(selectedCentro || '');

  const handleSearch = async () => {
    if (!searchTerm) {
      setFilteredCentros([]);
      return;
    }

    try {
      const resultados = await buscarCentrosMutation.mutateAsync({
        nombre_parcial: searchTerm
      });
      setFilteredCentros(resultados);
    } catch (error) {
      console.error('Error searching centers:', error);
    }
  };

  const handleCreateCentro = async () => {
    try {
      await crearCentroMutation.mutateAsync(newCentro);
      setShowCreateForm(false);
      setNewCentro({
        nombre: '',
        categoria: '',
        distrito_sanitario: '',
        sector: '',
        provincia: '',
        distrito: '',
        director: '',
        telefono: '',
        estado: 'activo'
      });
    } catch (error) {
      console.error('Error creating center:', error);
    }
  };

  const displayCentros = filteredCentros.length > 0 ? filteredCentros : centros;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando centros de salud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building2 className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Centros de Salud</h2>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Centro
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Centros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Nombre del centro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={buscarCentrosMutation.isPending}>
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Centers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayCentros.map((centro) => (
          <Card key={centro.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{centro.nombre}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{centro.categoria}</Badge>
                <Badge variant={centro.estado === 'activo' ? 'default' : 'secondary'}>
                  {centro.estado}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{centro.distrito_sanitario}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{centro.profesionales_aprobados_count || 0} profesionales</span>
                </div>
                {centro.director && (
                  <p><strong>Director:</strong> {centro.director}</p>
                )}
                {centro.telefono && (
                  <p><strong>Teléfono:</strong> {centro.telefono}</p>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4"
                onClick={() => setSelectedCentro(centro.id)}
              >
                Ver Detalles
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Crear Nuevo Centro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Nombre del centro"
                value={newCentro.nombre}
                onChange={(e) => setNewCentro({ ...newCentro, nombre: e.target.value })}
              />
              <Input
                placeholder="Categoría"
                value={newCentro.categoria}
                onChange={(e) => setNewCentro({ ...newCentro, categoria: e.target.value })}
              />
              <Input
                placeholder="Distrito Sanitario"
                value={newCentro.distrito_sanitario}
                onChange={(e) => setNewCentro({ ...newCentro, distrito_sanitario: e.target.value })}
              />
              <Input
                placeholder="Sector"
                value={newCentro.sector}
                onChange={(e) => setNewCentro({ ...newCentro, sector: e.target.value })}
              />
              <Input
                placeholder="Provincia"
                value={newCentro.provincia}
                onChange={(e) => setNewCentro({ ...newCentro, provincia: e.target.value })}
              />
              <Input
                placeholder="Distrito"
                value={newCentro.distrito}
                onChange={(e) => setNewCentro({ ...newCentro, distrito: e.target.value })}
              />
              <Input
                placeholder="Director"
                value={newCentro.director}
                onChange={(e) => setNewCentro({ ...newCentro, director: e.target.value })}
              />
              <Input
                placeholder="Teléfono"
                value={newCentro.telefono}
                onChange={(e) => setNewCentro({ ...newCentro, telefono: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateCentro} disabled={crearCentroMutation.isPending}>
                Crear Centro
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Center Details */}
      {selectedCentro && profesionalesCentro.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Profesionales del Centro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {profesionalesCentro.map((prof: any) => (
                <div key={prof.id} className="flex justify-between items-center p-2 border rounded">
                  <span>{prof.nombre} {prof.apellidos}</span>
                  <Badge>{prof.area_profesional}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HealthCenters;
