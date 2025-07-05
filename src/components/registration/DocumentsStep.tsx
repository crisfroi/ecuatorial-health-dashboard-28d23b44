import { useFormContext } from 'react-hook-form';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertCircle, Camera, X } from 'lucide-react';

interface DocumentsStepProps {
  uploadedFiles: File[];
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
  photoFile: File | null;
  handlePhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: () => void;
  setFotoCarnetBase64: (base64: string | null) => void;
  setAceptaPoliticas?: (val: boolean) => void;
  setShowPoliticas?: (show: boolean) => void;

}

export const DocumentsStep = ({ 
  uploadedFiles, 
  handleFileUpload, 
  removeFile,
  photoFile,
  handlePhotoUpload,
  removePhoto,
  setFotoCarnetBase64,
  setAceptaPoliticas,
  setShowPoliticas
}: DocumentsStepProps) => {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div className="space-y-6">
      {/* Foto carnet */}
      <div className="space-y-4">
        <h4 className="font-medium text-lg">Foto tipo carnet *</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
            <Camera className="mx-auto h-12 w-12 text-blue-400" />
            <div className="mt-4">
              <label htmlFor="foto-carnet" className="cursor-pointer">
                <Button type="button" variant="outline" asChild>
                  <span>
                    <Camera className="w-4 h-4 mr-2" />
                    Subir Foto Carnet
                  </span>
                </Button>
              </label>
              <input
                id="foto-carnet"
                type="file"
                accept="image/jpeg,image/jpg,image/png"
               onChange={(e) => {
                 const file = e.target.files?.[0];
                 if (!file) return;
                 const reader = new FileReader();
                 reader.onloadend = () => {
                   const base64 = reader.result as string;
                   setFotoCarnetBase64(base64); // guardamos la imagen base64 para el PDF
                 };
                 reader.readAsDataURL(file);
                 handlePhotoUpload(e); // sigue guardando photoFile normalmente
               }}

                className="hidden"
              />
              <p className="mt-2 text-sm text-gray-600">
                Formato: JPG, PNG (máx. 2MB)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-medium">Foto cargada:</h5>
            {!photoFile ? (
              <p className="text-gray-500 text-sm">Ninguna foto cargada</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded border">
                  <div className="flex items-center space-x-3">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">{photoFile.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removePhoto}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {photoFile && (
                  <div className="w-32 h-40 border rounded overflow-hidden">
                    <img 
                      src={URL.createObjectURL(photoFile)} 
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documentos adicionales */}
      <div className="space-y-4">
        <h4 className="font-medium text-lg">Documentos adicionales</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="documentos" className="cursor-pointer">
                <Button type="button" variant="outline" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Documentos
                  </span>
                </Button>
              </label>
              <input
                id="documentos"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="mt-2 text-sm text-gray-600">
                Formatos: PDF, JPG, PNG (máx. 5MB cada uno)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-medium">Documentos cargados:</h5>
            {uploadedFiles.length === 0 ? (
              <p className="text-gray-500 text-sm">Ningún documento cargado</p>
            ) : (
              uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                  <span className="text-sm truncate">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2">
  <label className="flex items-start space-x-2 text-sm text-gray-700"> 
</div>
  <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          La foto tipo carnet es obligatoria. Puede cargar títulos académicos, certificados y otros documentos relevantes como documentos adicionales.
     <input 
      type="checkbox" 
      {...register('acepta_politicas')} 
      className="mt-1 border-gray-300 text-blue-600 focus:ring-blue-500"
    />
    <span>
      He leído y acepto las 
      <button 
        type="button" 
        onClick={() => window.open('/politicas', '_blank')} 
        className="text-blue-600 underline ml-1">
        políticas de privacidad y protección de datos
      </button>.
    </span>
  </label>
  {errors.acepta_politicas && (
    <p className="text-red-600 text-xs">{errors.acepta_politicas.message}</p>
  )}
    </span>
  </label>
</div>
    </div>
  );
};
