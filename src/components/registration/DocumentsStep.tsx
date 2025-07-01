
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertCircle } from 'lucide-react';

interface DocumentsStepProps {
  uploadedFiles: File[];
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
}

export const DocumentsStep = ({ uploadedFiles, handleFileUpload, removeFile }: DocumentsStepProps) => {
  return (
    <div className="space-y-6">
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
          <h4 className="font-medium">Documentos cargados:</h4>
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
                >
                  ×
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Puede cargar títulos académicos, certificados, foto tipo carnet y otros documentos relevantes.
        </AlertDescription>
      </Alert>
    </div>
  );
};
