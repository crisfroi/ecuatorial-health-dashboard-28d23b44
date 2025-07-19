import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  QrCode,
  User,
  FileText,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Briefcase,
  X,
  Camera,
  StopCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ProfessionalSearchProps {
  onSelectProfessional?: (professional: any) => void;
  onNavigateToProfessionals?: () => void;
}

interface Professional {
  id: string;
  id_profesional_unico: string;
  codigo_expediente: string;
  nombre_completo: string;
  documento_identidad: string;
  area_profesional: string;
  lugar_trabajo: string;
  estado_solicitud: string;
  provincia: string;
  distrito: string;
  telefono: string;
  email: string;
  fecha_validez_carnet: string;
  created_at: string;
}

const ProfessionalSearch: React.FC<ProfessionalSearchProps> = ({
  onSelectProfessional,
  onNavigateToProfessionals,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const searchProfessionals = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select("*")
        .or(
          `nombre_completo.ilike.%${query}%,id_profesional_unico.ilike.%${query}%,codigo_expediente.ilike.%${query}%,documento_identidad.ilike.%${query}%`,
        )
        .limit(10);

      if (error) {
        throw error;
      }

      setSearchResults(data || []);

      if (data && data.length === 0) {
        setError(`No se encontraron profesionales con "${query}"`);
      }
    } catch (err: any) {
      console.error("Error searching professionals:", err);
      setError(`Error en la búsqueda: ${err.message}`);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchProfessionals(searchTerm);
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    // Auto-search as user types (debounced)
    if (value.length >= 3) {
      const timeoutId = setTimeout(() => {
        searchProfessionals(value);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (value.length === 0) {
      setSearchResults([]);
      setError(null);
    }
  };

  const startBarcodeScanning = async () => {
    try {
      setIsScanning(true);
      setError(null);

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera if available
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Note: For a real barcode scanner, you would integrate a library like QuaggaJS or ZXing
      // For now, we'll simulate with a manual input after scanning
      toast({
        title: "Cámara activada",
        description:
          "Apunta la cámara hacia el código de barras. Presiona 'Detener' para introducir el código manualmente.",
      });
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setError(`Error al acceder a la cámara: ${err.message}`);
      setIsScanning(false);
    }
  };

  const stopBarcodeScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);

    // For demo purposes, show a prompt to enter the scanned code
    const scannedCode = prompt("Introduce el código de barras escaneado:");
    if (scannedCode) {
      setScanResult(scannedCode);
      setSearchTerm(scannedCode);
      searchProfessionals(scannedCode);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Aprobado":
        return "bg-green-100 text-green-800";
      case "Pendiente":
      case "Recibido":
        return "bg-yellow-100 text-yellow-800";
      case "Rechazado":
        return "bg-red-100 text-red-800";
      case "Revisando":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setScanResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Búsqueda de Profesionales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Buscar por nombre, ID único o código de expediente..."
                  value={searchTerm}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="pr-10"
                />
                {searchTerm && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button type="submit" disabled={isLoading}>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={
                  isScanning ? stopBarcodeScanning : startBarcodeScanning
                }
                disabled={isLoading}
              >
                {isScanning ? (
                  <>
                    <StopCircle className="w-4 h-4 mr-2" />
                    Detener
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Escanear
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Camera View for Barcode Scanning */}
          {isScanning && (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full max-w-md mx-auto rounded-lg border"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-red-500 w-64 h-32 rounded-lg"></div>
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">
                Posiciona el código de barras dentro del rectángulo rojo
              </p>
            </div>
          )}

          {/* Scan Result */}
          {scanResult && (
            <Alert>
              <QrCode className="h-4 w-4" />
              <AlertDescription>
                Código escaneado: <strong>{scanResult}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2">Buscando...</span>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Resultados de búsqueda
                </h3>
                <Badge variant="outline">
                  {searchResults.length} encontrado(s)
                </Badge>
              </div>

              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {searchResults.map((professional) => (
                  <Card
                    key={professional.id}
                    className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-blue-300"
                    onClick={() => onSelectProfessional?.(professional)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <h4 className="font-semibold text-lg">
                              {professional.nombre_completo}
                            </h4>
                            <Badge
                              className={getStatusBadgeColor(
                                professional.estado_solicitud,
                              )}
                            >
                              {professional.estado_solicitud}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              <span>
                                ID: {professional.id_profesional_unico}
                              </span>
                            </div>
                            {professional.codigo_expediente && (
                              <div className="flex items-center gap-1">
                                <QrCode className="w-4 h-4" />
                                <span>
                                  Exp: {professional.codigo_expediente}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              <span>{professional.area_profesional}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{professional.provincia}</span>
                            </div>
                            {professional.telefono && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                <span>{professional.telefono}</span>
                              </div>
                            )}
                            {professional.fecha_validez_carnet && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Válido hasta:{" "}
                                  {new Date(
                                    professional.fecha_validez_carnet,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {professional.lugar_trabajo && (
                            <div className="text-sm text-gray-600">
                              <strong>Centro:</strong>{" "}
                              {professional.lugar_trabajo}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-blue-600 font-medium">
                          Haz clic para ver detalles completos →
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {searchResults.length >= 10 && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={onNavigateToProfessionals}>
                    Ver todos los profesionales
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {searchTerm && searchResults.length === 0 && !isLoading && !error && (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron profesionales con "{searchTerm}"</p>
              <p className="text-sm mt-2">Intenta con:</p>
              <ul className="text-sm mt-1 space-y-1">
                <li>• Nombre completo o parcial</li>
                <li>• ID profesional único</li>
                <li>• Código de expediente</li>
                <li>• Número de documento</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalSearch;
