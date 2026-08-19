import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SolicitudEstablecimiento from './SolicitudEstablecimiento';
import { FilePlus2, RefreshCw, Copy, FileWarning, ArrowRight } from 'lucide-react';

export const ESTABLISHMENT_REQUEST_TYPE_KEY = 'establishment_request_type';

const options = [
  { value: 'REGISTRO', label: 'Registro inicial', description: 'Alta y autorización inicial del establecimiento.', icon: FilePlus2 },
  { value: 'RENOVACION', label: 'Renovación de licencia', description: 'Renovación de una licencia sanitaria vigente.', icon: RefreshCw },
  { value: 'DUPLICADO', label: 'Duplicado de licencia', description: 'Reposición de licencia por extravío o deterioro.', icon: Copy },
  { value: 'ACTUALIZACION', label: 'Actualización', description: 'Actualización de datos del establecimiento o responsable.', icon: FileWarning },
];

const EstablishmentRegistrationEntry = () => {
  const [selected, setSelected] = React.useState<string | null>(null);

  // El tipo anterior nunca debe saltarse esta pantalla al iniciar un nuevo trámite.
  React.useEffect(() => {
    localStorage.removeItem(ESTABLISHMENT_REQUEST_TYPE_KEY);
  }, []);

  const start = (value: string) => {
    localStorage.setItem(ESTABLISHMENT_REQUEST_TYPE_KEY, value);
    setSelected(value);
  };

  if (selected) return <SolicitudEstablecimiento />;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Tipo de trámite del establecimiento</CardTitle>
            <p className="text-sm text-gray-600">Seleccione el trámite antes de comenzar. El tipo se utilizará en el expediente y la documentación.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {options.map(({value,label,description,icon:Icon}) => (
                <button key={value} type="button" onClick={() => start(value)} className="text-left border rounded-xl p-5 bg-white hover:border-blue-500 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-3"><Icon className="w-6 h-6 text-blue-600"/><span className="font-semibold">{label}</span></div>
                  <p className="text-sm text-gray-600 min-h-12">{description}</p>
                  <div className="mt-4 text-sm font-medium text-blue-600 flex items-center gap-1">Continuar <ArrowRight className="w-4 h-4" /></div>
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-lg border bg-white p-4 text-center text-xs text-gray-500">
              El sistema volverá a solicitar el tipo de trámite al iniciar de nuevo el registro. No se reutiliza automáticamente el tipo de una solicitud anterior.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EstablishmentRegistrationEntry;
