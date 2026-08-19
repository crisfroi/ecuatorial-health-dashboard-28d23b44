import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, FilePlus2, RefreshCw, Copy, FileWarning, Pencil, Save, Trash2 } from 'lucide-react';
import ProfessionalRegistration from './ProfessionalRegistration';

export const PROFESSIONAL_REQUEST_TYPE_KEY = 'professional_request_type';
export const PROFESSIONAL_DRAFT_KEY = 'professional_registration_form_data';

const options = [
  { value: 'REGISTRO', label: 'Registro inicial', description: 'Primera inscripción y acreditación como profesional sanitario.', icon: FilePlus2 },
  { value: 'RENOVACION', label: 'Renovación', description: 'Renovar una acreditación profesional existente.', icon: RefreshCw },
  { value: 'EXTRAVIO', label: 'Duplicado por extravío', description: 'Solicitar un nuevo documento profesional por pérdida o extravío.', icon: FileWarning },
  { value: 'DETERIORO', label: 'Duplicado por deterioro', description: 'Solicitar un nuevo documento por deterioro del anterior.', icon: Copy },
  { value: 'ACTUALIZACION', label: 'Actualización de datos', description: 'Modificar o actualizar información del expediente profesional.', icon: Pencil },
];

const ProfessionalRegistrationEntry = () => {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [draftType, setDraftType] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedType = localStorage.getItem(PROFESSIONAL_REQUEST_TYPE_KEY);
    const draft = localStorage.getItem(PROFESSIONAL_DRAFT_KEY);

    // Nunca entrar directamente por un tipo antiguo sin un borrador real.
    if (storedType && draft) {
      setDraftType(storedType);
      return;
    }

    if (storedType && !draft) {
      localStorage.removeItem(PROFESSIONAL_REQUEST_TYPE_KEY);
    }
  }, []);

  const startNew = (value: string) => {
    localStorage.removeItem(PROFESSIONAL_DRAFT_KEY);
    localStorage.setItem(PROFESSIONAL_REQUEST_TYPE_KEY, value);
    setDraftType(null);
    setSelected(value);
  };

  const continueDraft = () => {
    if (!draftType) return;
    setSelected(draftType);
    setDraftType(null);
  };

  const discardDraft = () => {
    localStorage.removeItem(PROFESSIONAL_DRAFT_KEY);
    localStorage.removeItem(PROFESSIONAL_REQUEST_TYPE_KEY);
    setDraftType(null);
    setSelected(null);
  };

  if (selected) return <ProfessionalRegistration />;

  if (draftType) {
    const label = options.find(o => o.value === draftType)?.label || draftType;
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Tiene un progreso guardado</CardTitle>
              <p className="text-sm text-gray-600">Existe una solicitud de <strong>{label}</strong> sin finalizar.</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button onClick={continueDraft} className="w-full">
                <Save className="mr-2 h-4 w-4" /> Continuar con el progreso guardado
              </Button>
              <Button variant="outline" onClick={discardDraft} className="w-full">
                <Trash2 className="mr-2 h-4 w-4" /> Descartar y comenzar una nueva solicitud
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Seleccione el tipo de solicitud</CardTitle>
            <p className="text-sm text-gray-600">El trámite seleccionado determinará el formulario, la ficha y la documentación que se genere.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {options.map(({ value, label, description, icon: Icon }) => (
                <button key={value} type="button" onClick={() => startNew(value)} className="text-left border rounded-xl p-5 bg-white hover:border-blue-500 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-3"><Icon className="w-6 h-6 text-blue-600" /><span className="font-semibold">{label}</span></div>
                  <p className="text-sm text-gray-600 min-h-12">{description}</p>
                  <div className="mt-4 text-sm font-medium text-blue-600 flex items-center gap-1">Continuar <ArrowRight className="w-4 h-4" /></div>
                </button>
              ))}
            </div>
            <div className="mt-6 text-xs text-gray-500 text-center">Si abandona un trámite incompleto, al volver podrá continuar el progreso guardado o descartarlo.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfessionalRegistrationEntry;
