import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useHosixUsers } from '@/hooks/useHosixUsers';
import { useHosixPermisos } from '@/hooks/useHosixPermisos';
import { AlertCircle, Save, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/hosixClient';

interface PermisoModulo {
  perfil_id: string;
  modulo: string;
  puede_leer: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
  puede_aprobar: boolean;
}

const MODULOS = [
  'pacientes',
  'usuarios',
  'urgencias',
  'citas',
  'hospitalizacion',
  'quirofanos',
  'farmacia',
  'facturacion',
  'reportes',
  'configuracion',
];

export const PermisosManager: React.FC = () => {
  const { toast } = useToast();
  const { perfiles } = useHosixUsers();
  
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<string>('');
  const [permisos, setPermisos] = useState<Record<string, PermisoModulo>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (perfilSeleccionado) {
      cargarPermisos();
    }
  }, [perfilSeleccionado]);

  const cargarPermisos = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: queryError } = await supabase
        .from('hosix_permisos_modulos')
        .select('*')
        .eq('perfil_id', perfilSeleccionado);

      if (queryError) throw queryError;

      const permisosMap: Record<string, PermisoModulo> = {};
      data?.forEach(p => {
        permisosMap[p.modulo] = p;
      });

      // Agregar módulos faltantes con permisos vacíos
      MODULOS.forEach(modulo => {
        if (!permisosMap[modulo]) {
          permisosMap[modulo] = {
            perfil_id: perfilSeleccionado,
            modulo,
            puede_leer: false,
            puede_crear: false,
            puede_editar: false,
            puede_eliminar: false,
            puede_aprobar: false,
          };
        }
      });

      setPermisos(permisosMap);
    } catch (err: any) {
      setError(err.message || 'Error al cargar permisos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePermisoChange = (
    modulo: string,
    permiso: keyof Omit<PermisoModulo, 'perfil_id' | 'modulo'>,
    value: boolean
  ) => {
    setPermisos(prev => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
        [permiso]: value,
      },
    }));
  };

  const handleGuardar = async () => {
    if (!perfilSeleccionado) {
      setError('Seleccione un perfil');
      return;
    }

    try {
      setLoading(true);
      setError('');

      for (const [modulo, permisoData] of Object.entries(permisos)) {
        const { error: upsertError } = await supabase
          .from('hosix_permisos_modulos')
          .upsert(
            {
              perfil_id: perfilSeleccionado,
              modulo,
              puede_leer: permisoData.puede_leer,
              puede_crear: permisoData.puede_crear,
              puede_editar: permisoData.puede_editar,
              puede_eliminar: permisoData.puede_eliminar,
              puede_aprobar: permisoData.puede_aprobar,
            },
            { onConflict: 'perfil_id,modulo' }
          );

        if (upsertError) throw upsertError;
      }

      toast({
        title: 'Éxito',
        description: 'Permisos actualizados correctamente',
      });
    } catch (err: any) {
      setError(err.message || 'Error al guardar permisos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Gestor de Permisos
          </CardTitle>
          <CardDescription>
            Configure los permisos de acceso a módulos por perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Selector de Perfil */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Seleccionar Perfil</label>
            <select
              value={perfilSeleccionado}
              onChange={(e) => setPerfilSeleccionado(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Seleccione un perfil...</option>
              {perfiles?.map(perfil => (
                <option key={perfil.id} value={perfil.id}>
                  {perfil.nombre} (Nivel: {perfil.nivel_acceso})
                </option>
              ))}
            </select>
          </div>

          {/* Tabla de Permisos */}
          {perfilSeleccionado && Object.keys(permisos).length > 0 && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Módulo</th>
                        <th className="px-4 py-3 text-center font-medium">Leer</th>
                        <th className="px-4 py-3 text-center font-medium">Crear</th>
                        <th className="px-4 py-3 text-center font-medium">Editar</th>
                        <th className="px-4 py-3 text-center font-medium">Eliminar</th>
                        <th className="px-4 py-3 text-center font-medium">Aprobar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MODULOS.map(modulo => (
                        <tr key={modulo} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium capitalize">
                            {modulo.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Checkbox
                              checked={permisos[modulo]?.puede_leer || false}
                              onCheckedChange={(checked) =>
                                handlePermisoChange(modulo, 'puede_leer', checked as boolean)
                              }
                              disabled={loading}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Checkbox
                              checked={permisos[modulo]?.puede_crear || false}
                              onCheckedChange={(checked) =>
                                handlePermisoChange(modulo, 'puede_crear', checked as boolean)
                              }
                              disabled={loading}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Checkbox
                              checked={permisos[modulo]?.puede_editar || false}
                              onCheckedChange={(checked) =>
                                handlePermisoChange(modulo, 'puede_editar', checked as boolean)
                              }
                              disabled={loading}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Checkbox
                              checked={permisos[modulo]?.puede_eliminar || false}
                              onCheckedChange={(checked) =>
                                handlePermisoChange(modulo, 'puede_eliminar', checked as boolean)
                              }
                              disabled={loading}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Checkbox
                              checked={permisos[modulo]?.puede_aprobar || false}
                              onCheckedChange={(checked) =>
                                handlePermisoChange(modulo, 'puede_aprobar', checked as boolean)
                              }
                              disabled={loading}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Button
                onClick={handleGuardar}
                disabled={loading}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Guardando...' : 'Guardar Permisos'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
