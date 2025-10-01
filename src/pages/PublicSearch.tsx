import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Shield, Calendar, User, Award, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePublicSearch } from '@/hooks/usePublicSearch';
import { useAccreditationStatusUpdate } from '@/hooks/useAccreditationStatusUpdate';
import CoachMarks, { CoachMarkStep } from '@/components/onboarding/CoachMarks';
import { ENABLE_INTERACTIVE_TOURS, isTourCompleted, setTourCompleted } from '@/config/featureFlags';

const PublicSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'carnet' | 'nombre'>('carnet');
  const { data: results, isLoading, error, refetch } = usePublicSearch(searchTerm, searchType);
  const { updateAccreditationStatus, isUpdating } = useAccreditationStatusUpdate();
  const [openTour, setOpenTour] = useState(false);

  // Ejecutar actualización automática de estados al cargar el componente
  useEffect(() => {
    updateAccreditationStatus();
  }, [updateAccreditationStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      refetch();
    }
  };

  const steps: CoachMarkStep[] = [
    {
      id: 'header-refresh',
      target: '[data-tour="public-refresh"]',
      title: 'Actualizar Estados',
      content: 'Actualiza manualmente los estados de acreditación si lo necesitas.',
    },
    {
      id: 'input',
      target: '[data-tour="public-input"]',
      title: 'Búsqueda',
      content: 'Escribe el número de carnet o nombre completo del profesional.',
    },
    {
      id: 'type',
      target: '[data-tour="public-type"]',
      title: 'Tipo de Búsqueda',
      content: 'Elige si buscas por número de carnet o por nombre.',
    },
    {
      id: 'submit',
      target: '[data-tour="public-submit"]',
      title: 'Buscar',
      content: 'Haz clic para iniciar la búsqueda y ver resultados.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <h1 className="text-lg font-semibold text-gray-900">
                  Verificación de Profesionales Sanitarios
                </h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={updateAccreditationStatus}
              disabled={isUpdating}
              className="flex items-center space-x-2"
              data-tour="public-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'Actualizando...' : 'Actualizar Estados'}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-blue-600" />
                <span>Verificar Acreditación Profesional</span>
              </CardTitle>
              <CardDescription>
                Busque por número de carnet profesional o nombre completo para verificar
                el estado de acreditación de un profesional sanitario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1" data-tour="public-input">
                    <Input
                      type="text"
                      placeholder={
                        searchType === 'carnet'
                          ? "Ej: MED-2024-0001"
                          : "Ej: CRISTIAN FROILAN"
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  <div className="flex gap-2" data-tour="public-type">
                    <Button
                      type="button"
                      variant={searchType === 'carnet' ? 'default' : 'outline'}
                      onClick={() => setSearchType('carnet')}
                    >
                      Por Carnet
                    </Button>
                    <Button
                      type="button"
                      variant={searchType === 'nombre' ? 'default' : 'outline'}
                      onClick={() => setSearchType('nombre')}
                    >
                      Por Nombre
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading} data-tour="public-submit">
                  <Search className="w-4 h-4 mr-2" />
                  {isLoading ? 'Buscando...' : 'Buscar Profesional'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results Section */}
          {error && (
            <Card className="mb-8 border-red-200">
              <CardContent className="pt-6">
                <div className="text-center text-red-600">
                  <p>Error al realizar la búsqueda. Intente nuevamente.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {results && results.length === 0 && searchTerm && (
            <Card className="mb-8 border-yellow-200">
              <CardContent className="pt-6">
                <div className="text-center text-yellow-600">
                  <Search className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">No se encontraron resultados</p>
                  <p className="text-sm">
                    Verifique que el número de carnet o nombre sea correcto.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {results && results.length > 0 && (
            <div className="space-y-4">
              {results.map((profesional) => (
                <Card key={profesional.id} className="border-green-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <User className="w-5 h-5 text-green-600" />
                        <span>{profesional.nombre_completo}</span>
                      </CardTitle>
                      <Badge className={`${
                        profesional.estado_acreditacion === 'vigente'
                          ? 'bg-green-100 text-green-800'
                          : profesional.estado_acreditacion === 'proximo_vencimiento'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {profesional.estado_acreditacion === 'vigente'
                          ? 'Acreditado Vigente'
                          : profesional.estado_acreditacion === 'proximo_vencimiento'
                          ? 'Próximo a Vencer'
                          : 'Acreditación Vencida'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Número de Carnet:</span>
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {profesional.numero_carnet}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium">Área Profesional:</span>
                          <Badge variant="outline">
                            {profesional.area_profesional}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium">Válido hasta:</span>
                          <span className={`text-sm font-medium ${
                            new Date(profesional.fecha_validez) > new Date()
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {new Date(profesional.fecha_validez).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            profesional.estado_acreditacion === 'vigente'
                              ? 'bg-green-500'
                              : profesional.estado_acreditacion === 'proximo_vencimiento'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}></div>
                          <span className={`text-sm font-medium ${
                            profesional.estado_acreditacion === 'vigente'
                              ? 'text-green-600'
                              : profesional.estado_acreditacion === 'proximo_vencimiento'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {profesional.estado_acreditacion === 'vigente'
                              ? 'Carnet Vigente'
                              : profesional.estado_acreditacion === 'proximo_vencimiento'
                              ? `Próximo a Vencer (${profesional.dias_hasta_vencimiento} días)`
                              : 'Carnet Vencido'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Info Section */}
          <Card className="mt-8 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">Información Importante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-blue-700">
                <p>• Solo se muestran profesionales con estado "Acreditado"</p>
                <p>• Los estados se actualizan automáticamente según las fechas de caducidad</p>
                <p>• <span className="font-medium text-green-700">Verde:</span> Carnet vigente</p>
                <p>• <span className="font-medium text-yellow-700">Amarillo:</span> Próximo a vencer (30 días o menos)</p>
                <p>• <span className="font-medium text-red-700">Rojo:</span> Carnet vencido</p>
                <p>• Verifique siempre la fecha de validez del carnet profesional</p>
                <p>• En caso de dudas, contacte al Ministerio de Sanidad</p>
                <p>• Esta información es de carácter público y verificable</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {ENABLE_INTERACTIVE_TOURS && !isTourCompleted('publicSearch') && (
        <>
          <button
            onClick={() => setOpenTour(true)}
            className="fixed bottom-6 right-6 z-50 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors p-3"
            aria-label="Ayuda"
            title="Guía rápida"
          >
            ?
          </button>
          <CoachMarks
            open={openTour}
            steps={steps}
            onClose={() => setOpenTour(false)}
            onFinish={() => setTourCompleted('publicSearch')}
          />
        </>
      )}
    </div>
  );
};

export default PublicSearch;
