import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  Eye,
  FileText,
  X, 
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AdditionalDocumentsProps {
  professionalId: string;
  existingDocuments?: string[];
  onDocumentsUpdate?: (documents: string[]) => void;
}

const AdditionalDocuments = ({
  professionalId,
  existingDocuments = [],
  onDocumentsUpdate,
}: AdditionalDocumentsProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5); // Limitar a 5 archivos por vez
    const validFiles = newFiles.filter((file) => {
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Archivo demasiado grande",
          description: `${file.name} excede el límite de 10MB`,
          variant: "destructive",
        });
        return false;
      }

      // Validar tipos de archivo
      const allowedTypes = [ 
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de archivo no válido",
          description: `${file.name} no es un tipo de archivo permitido`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Limpiar archivos seleccionados después de subida exitosa
  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadDocuments = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No hay archivos",
        description: "Selecciona al menos un archivo para subir",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Crear FormData para enviar archivos
      const formData = new FormData();
      formData.append("profesional_id", professionalId);

      selectedFiles.forEach((file) => {
        formData.append("documentos_adicionales[]", file);
      });

      // Simular progreso de subida
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-documentos-adicionales`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: formData,
        },
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Documentos subidos exitosamente",
          description: `Se subieron ${result.uploaded_urls?.length || 0} documentos correctamente`,
        });

        // Limpiar archivos seleccionados
        clearSelectedFiles();

        // Notificar al componente padre
        if (
          onDocumentsUpdate &&
          result.updated_record?.documentos_adicionales
        ) {
          onDocumentsUpdate(result.updated_record.documentos_adicionales);
        }

        // Refrescar la lista de documentos
        if (result.updated_record?.documentos_adicionales) {
          // El componente padre debería manejar esto, pero podemos forzar un re-render
          window.location.reload();
        }
      } else {
        throw new Error(result.error || "Error desconocido");
      }
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast({
        title: "Error al subir documentos",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const openPreview = (url: string, filename?: string) => {
    setPreviewUrl(url);
    setPreviewFileName(filename || getFilenameFromUrl(url));
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewFileName("");
    setIsPreviewOpen(false);
  };

  const isImageFile = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "");
  };

  const isPdfFile = (filename: string) => {
    return filename.toLowerCase().endsWith(".pdf");
  };

  const downloadDocument = (url: string, filename?: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `documento_${Date.now()}`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return <FileText className="w-5 h-5 text-red-600" />;
      case "jpg":
      case "jpeg":
      case "png":
        return <FileText className="w-5 h-5 text-blue-600" />;
      case "doc":
      case "docx":
        return <FileText className="w-5 h-5 text-blue-800" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getFilenameFromUrl = (url: string) => {
    const urlParts = url.split("/");
    const filename = urlParts[urlParts.length - 1];
    return filename || "documento";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Efecto para limpiar archivos seleccionados cuando cambia el professionalId
  useEffect(() => {
    clearSelectedFiles();
    setUploadProgress(0);
    setIsUploading(false);
  }, [professionalId]);

  return (
    <div className="space-y-6">
      {/* Sección de subida de archivos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Subir Documentos Adicionales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileSelection}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mb-4"
            >
              <Upload className="w-4 h-4 mr-2" />
              Seleccionar Archivos
            </Button>
            <p className="text-sm text-gray-600">
              Formatos permitidos: PDF, JPG, PNG, DOC, DOCX (máximo 10MB por
              archivo, máximo 5 archivos por vez)
            </p>
          </div>

          {/* Archivos seleccionados */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Archivos seleccionados:</h4>
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    {getFileIcon(file.name)}
                    <span className="text-sm">{file.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(file.size)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSelectedFile(index)}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Botón de subida y progreso */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Button
                onClick={uploadDocuments}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Subiendo... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Documentos ({selectedFiles.length})
                  </>
                )}
              </Button>

              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentos existentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documentos Subidos ({existingDocuments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {existingDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No hay documentos adicionales subidos</p>
              <p className="text-sm">
                Sube documentos usando el formulario anterior
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-64">
              <div className="space-y-3">
                {existingDocuments.map((url, index) => {
                  const filename = getFilenameFromUrl(url);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(filename)}
                        <div>
                          <p className="text-sm font-medium truncate" title={filename}>
                            {filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            Documento #{index + 1}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPreview(url, filename)}
                          className="flex items-center gap-1 h-8 px-2"
                          title="Vista previa"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadDocument(url, filename)}
                          className="flex items-center gap-1 h-8 px-2"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Modal de vista previa */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Vista previa: {previewFileName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewUrl && (
              <div className="w-full h-[70vh] border rounded-lg overflow-hidden bg-gray-50">
                {isPdfFile(previewFileName) ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-none"
                    title={`Vista previa de ${previewFileName}`}
                  />
                ) : isImageFile(previewFileName) ? (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <img
                      src={previewUrl}
                      alt={previewFileName}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 mb-4">
                        Vista previa no disponible para este tipo de archivo
                      </p>
                      <Button onClick={() => downloadDocument(previewUrl, previewFileName)}>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar archivo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Información adicional */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">
                Información sobre documentos adicionales
              </p>
              <ul className="text-blue-800 space-y-1">
                <li>
                  • Los documentos se almacenan de forma segura en Supabase Storage
                </li>
                <li>• Puedes subir múltiples archivos a la vez</li>
                <li>
                  • Los documentos están vinculados al expediente del
                  profesional
                </li>
                <li>
                  • Formatos soportados: PDF, imágenes (JPG, PNG) y documentos
                  Word
                </li>
                <li>
                  • Máximo 10MB por archivo, hasta 5 archivos por vez
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdditionalDocuments;
