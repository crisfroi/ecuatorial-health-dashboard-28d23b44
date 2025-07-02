
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Camera } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface ConfirmationStepProps {
  form: UseFormReturn<any>;
  watchedValues: any;
  uploadedFiles: File[];
  photoFile: File | null;
}

export const ConfirmationStep = ({ form, watchedValues, uploadedFiles, photoFile }: ConfirmationStepProps) => {
  return (
    <div className="space-y-6">
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Revise toda la información antes de enviar su solicitud.
        </AlertDescription>
      </Alert>

      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <h3 className="font-semibold text-lg">Resumen de la Solicitud</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Nombre:</span> {watchedValues.nombre} {watchedValues.apellidos}
          </div>
          <div>
            <span className="font-medium">Nacionalidad:</span> {watchedValues.nacionalidad}
          </div>
          <div>
            <span className="font-medium">Área Profesional:</span> {watchedValues.area_profesional}
          </div>
          <div>
            <span className="font-medium">Categoría de Titulación:</span> {watchedValues.categoria_titulacion}
          </div>
          <div>
            <span className="font-medium">Situación Laboral:</span> {watchedValues.situacion_laboral}
          </div>
          {watchedValues.situacion_laboral === 'Activo' && (
            <div>
              <span className="font-medium">Centro de Trabajo:</span> {watchedValues.nombre_centro}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <span className="font-medium">Foto tipo carnet:</span>
            {photoFile ? (
              <div className="mt-2 flex items-center space-x-2">
                <Camera className="w-4 h-4 text-green-600" />
                <span className="text-green-600 text-sm">✓ {photoFile.name}</span>
              </div>
            ) : (
              <span className="text-red-600 text-sm">✗ No cargada</span>
            )}
          </div>
          <div>
            <span className="font-medium">Documentos adicionales:</span> {uploadedFiles.length} archivo(s)
          </div>
        </div>
      </div>

      <FormField
        control={form.control}
        name="acepta_politicas"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Acepto las políticas de privacidad y términos de uso *
              </FormLabel>
              <p className="text-sm text-gray-600">
                Al marcar esta casilla, confirmo que he leído y acepto las políticas de tratamiento de datos personales.
              </p>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
