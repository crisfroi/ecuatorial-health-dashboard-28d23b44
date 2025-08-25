import React, { useState, useEffect, useRef } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { useBuscarCentros, useCentrosSalud } from '@/hooks/useCentrosSalud';
import { MapPin, Plus, Building2 } from 'lucide-react';

interface CentroTrabajoAutocompleteProps {
  form: UseFormReturn<any>;
  watchedValues: any;
}

export const CentroTrabajoAutocomplete = ({ form, watchedValues }: CentroTrabajoAutocompleteProps) => {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mostrarFormularioNuevo, setMostrarFormularioNuevo] = useState(false);
  const [nuevosCampos, setNuevosCampos] = useState({
    director: '',
    telefono: '',
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const { crearCentroMutation } = useCentrosSalud();

  const { data: centrosSugeridos = [], isLoading } = useBuscarCentros({
    nombreParcial: busqueda.length >= 2 ? busqueda : undefined,
    categoria: watchedValues.categoria_centro,
    distritoSanitario: watchedValues.distrito_sanitario,
  });

  useEffect(() => {
    if (watchedValues.nombre_centro) {
      setBusqueda(watchedValues.nombre_centro);
    }
  }, [watchedValues.nombre_centro]);

  const handleInputChange = (valor: string) => {
    setBusqueda(valor);
    form.setValue('nombre_centro', valor);
    setMostrarSugerencias(valor.length >= 2);
  };

  const seleccionarCentro = (centro: any) => {
    form.setValue('nombre_centro', centro.nombre);
    form.setValue('centro_salud_id', centro.id); // Establecer el ID del centro
    setBusqueda(centro.nombre);
    setMostrarSugerencias(false);

    // Auto-rellenar otros campos si están disponibles
    if (centro.sector && !watchedValues.tipo_sector) {
      form.setValue('tipo_sector', centro.sector);
    }

    // Auto-determinar si es función pública basado en el sector
    if (centro.sector) {
      const esFuncionPublica = centro.sector.toLowerCase().includes('público');
      form.setValue('funcion_publica', esFuncionPublica);
    }
  };

  const crearNuevoCentro = async () => {
    if (!busqueda.trim() || !watchedValues.categoria_centro || !watchedValues.provincia) {
      return;
    }

    const nuevoCentro = {
      nombre: busqueda.trim(),
      categoria: watchedValues.categoria_centro,
      distrito_sanitario: watchedValues.distrito_sanitario || '',
      sector: watchedValues.tipo_sector || 'Público',
      provincia: watchedValues.provincia,
      distrito: watchedValues.distrito,
      director: nuevosCampos.director.trim() || undefined,
      telefono: nuevosCampos.telefono.trim() || undefined,
    };

    try {
      await crearCentroMutation.mutateAsync(nuevoCentro);
      setMostrarFormularioNuevo(false);
      setNuevosCampos({ director: '', telefono: '' });
      setMostrarSugerencias(false);
    } catch (error) {
      console.error('Error al crear centro:', error);
    }
  };

  const centroExiste = centrosSugeridos.some(
    centro => centro.nombre.toLowerCase() === busqueda.toLowerCase()
  );

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="nombre_centro"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre del Centro de Trabajo *</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  ref={inputRef}
                  placeholder="Comience a escribir el nombre del centro..."
                  value={busqueda}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => busqueda.length >= 2 && setMostrarSugerencias(true)}
                  onBlur={() => {
                    // Retrasar el cierre para permitir clics en sugerencias
                    setTimeout(() => setMostrarSugerencias(false), 200);
                  }}
                />
                
                {/* Sugerencias */}
                {mostrarSugerencias && (
                  <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
                    <CardContent className="p-2">
                      {isLoading ? (
                        <div className="p-2 text-center text-gray-500">Buscando...</div>
                      ) : centrosSugeridos.length > 0 ? (
                        <>
                          {centrosSugeridos.map((centro) => (
                            <div
                              key={centro.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer rounded flex items-start space-x-2"
                              onClick={() => seleccionarCentro(centro)}
                            >
                              <Building2 className="w-4 h-4 mt-1 text-gray-500 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="font-medium">{centro.nombre}</div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {centro.distrito_sanitario && `${centro.distrito_sanitario}, `}
                                  {centro.provincia}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {centro.categoria} • {centro.sector}
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : busqueda.length >= 2 ? (
                        <div className="p-2">
                          <div className="text-gray-500 mb-2">No se encontraron centros</div>
                          {!centroExiste && watchedValues.categoria_centro && (
                            <Dialog open={mostrarFormularioNuevo} onOpenChange={setMostrarFormularioNuevo}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Crear "{busqueda}"
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Crear Nuevo Centro de Salud</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">Nombre del Centro</label>
                                    <Input value={busqueda} disabled />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Categoría</label>
                                    <Input value={watchedValues.categoria_centro} disabled />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Distrito Sanitario</label>
                                    <Input value={watchedValues.distrito_sanitario || 'No especificado'} disabled />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Director (Opcional)</label>
                                    <Input
                                      placeholder="Nombre del director"
                                      value={nuevosCampos.director}
                                      onChange={(e) => setNuevosCampos(prev => ({ ...prev, director: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Teléfono (Opcional)</label>
                                    <Input
                                      placeholder="Número de teléfono"
                                      value={nuevosCampos.telefono}
                                      onChange={(e) => setNuevosCampos(prev => ({ ...prev, telefono: e.target.value }))}
                                    />
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => setMostrarFormularioNuevo(false)}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      onClick={crearNuevoCentro}
                                      disabled={crearCentroMutation.isPending}
                                    >
                                      {crearCentroMutation.isPending ? 'Creando...' : 'Crear Centro'}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
