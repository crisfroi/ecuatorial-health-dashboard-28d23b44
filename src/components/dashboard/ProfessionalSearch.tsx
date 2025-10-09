import React, { useState, useRef, useEffect, useMemo } from "react";
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
  Briefcase,
  X,
  StopCircle,
  Building2, // Añadido para el icono de funcionario
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ProfessionalSearchProps {
  onSelectProfessional?: (professional: Professional) => void; // Tipado a Professional
  onNavigateToProfessionals?: () => void;
}

// Interfaz extendida con los campos de la situación laboral
interface Professional {
  id: string;
  id_profesional_unico: string;
  codigo_expediente: string;
  nombre_completo: string;
  documento_identidad: string; // Campo calculado
  area_profesional: string;
  lugar_trabajo: string; // Campo calculado
  estado_solicitud: string;
  provincia: string;
  distrito: string;
  telefono: string;
  email: string;
  fecha_validez_carnet: string;
  created_at: string;
  // Nuevos campos de la DB
  funcion_publica: boolean | null;
  estatus_funcionario: 'nombrado' | 'no_nombrado' | null;
  numero_funcionario: string | null;
  fecha_nombramiento: string | null;
  fecha_inicio_trabajo: string | null;
  // Campos de la DB usados en el mapeo
  numero_dip: string | null;
  numero_pasaporte: string | null;
  nombre_centro: string | null;
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
  const [sanctionsMap, setSanctionsMap] = useState<Record<string, { suspendido: boolean; inhabilitado: boolean }>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const run = async () => {
      if (searchResults.length === 0) { setSanctionsMap({}); return; }
      const ids = searchResults.map(p => p.id);
      const { data } = await supabase
        .from('expedientes_disciplinarios')
        .select('profesional_id, sancion_tipo, inhabilitacion_permanente, sancion_fecha_fin, estado')
        .in('profesional_id', ids);
      const map: Record<string, { suspendido: boolean; inhabilitado: boolean }> = {};
      for (const r of data || []) {
        const inh = Boolean(r.inhabilitacion_permanente) || r.sancion_tipo === 'inhabilitacion';
        const now = new Date();
        const fin = r.sancion_fecha_fin ? new Date(r.sancion_fecha_fin) : null;
        const susp = r.sancion_tipo === 'suspension' && (!fin || fin >= now) && (r.estado === 'sancionado');
        map[r.profesional_id] = {
          suspendido: (map[r.profesional_id]?.suspendido || false) || susp,
          inhabilitado: (map[r.profesional_id]?.inhabilitado || false) || inh,
        };
      }
      setSanctionsMap(map);
    };
    void run();
  }, [searchResults]);

  // 1. Lógica de formateo de fecha (copiada de GlobalSearch)
  const formatDate = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString('es-ES');
  };

  // 2. Lógica para obtener el detalle de funcionario (adaptada de GlobalSearch)
  const getFuncionarioMeta = (p: Professional): string => {
    if (!p.funcion_publica) {
      return 'Personal no funcionario';
    }

    // Si no tiene estatus, pero sí función pública
    const baseLabel = p.estatus_funcionario === 'nombrado'
      ? 'Funcionario nombrado'
      : p.estatus_funcionario === 'no_nombrado'
        ? 'Contratado público'
        : 'Estatus desconocido';

    const details: string[] = [];
    if (p.numero_funcionario) {
      details.push(`Nº ${p.numero_funcionario}`);
    }
    if (p.estatus_funcionario === 'nombrado' && p.fecha_nombramiento) {
      const formatted = formatDate(p.fecha_nombramiento);
      if (formatted) details.push(`Nombramiento: ${formatted}`);
    }
    if (p.estatus_funcionario === 'no_nombrado' && p.fecha_inicio_trabajo) {
      const formatted = formatDate(p.fecha_inicio_trabajo);
      if (formatted) details.push(`Inicio: ${formatted}`);
    }

    return details.length > 0 ? `${baseLabel} (${details.join(' • ')})` : baseLabel;
  };

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
      // 1. SELECT ACTUALIZADO: Añadimos todos los campos de funcionario público.
      const { data, error } = await supabase
        .from("profesionales_sanitarios")
        .select(`
          id, id_profesional_unico, codigo_expediente, nombre_completo, area_profesional, 
          estado_solicitud, provincia, distrito, telefono, email, fecha_validez_carnet, 
          created_at, numero_dip, numero_pasaporte, nombre_centro,
          funcion_publica, estatus_funcionario, numero_funcionario, fecha_nombramiento, fecha_inicio_trabajo
        `)
        .or(
          `nombre_completo.ilike.%${query}%,id_profesional_unico.ilike.%${query}%,codigo_expediente.ilike.%${query}%`,
        )
        .limit(10);

      if (error) {
        throw error;
      }

      setSearchResults((data || []).map(item => ({
        ...item,
        // Campos calculados para el mapeo
        documento_identidad: item.numero_dip || item.numero_pasaporte || '',
        lugar_trabajo: item.nombre_centro || ''
      })) as Professional[]); // Casteamos al tipo Professional

      if (data && data.length === 0) {
        setError(`No se encontraron profesionales con "${query}"`);
      }
    } catch (err: any) {
      console.error("Error searching professionals:", err);
      const errorMessage =
        err?.message || err?.toString() || "Error desconocido en la búsqueda";
      setError(`Error en la búsqueda: ${errorMessage}`);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers and scanning logic
  const debounceRef = useRef<number | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);

  const handleInputChange = (val: string) => {
    setSearchTerm(val);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const trimmed = val.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setError(null);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      void searchProfessionals(trimmed);
    }, 300);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) { setSearchResults([]); return; }
    await searchProfessionals(q);
  };

  const startBarcodeScanning = async () => {
    try {
      if (!videoRef.current) return;
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
      setIsScanning(true);

      const BarcodeDetectorCtor = (window as any).BarcodeDetector;
      if (!BarcodeDetectorCtor) {
        toast({
          title: 'Escaneo no soportado',
          description: 'Tu navegador no soporta escaneo de códigos. Usa Chrome/Edge en móvil o escritorio.',
          variant: 'destructive'
        });
        stopBarcodeScanning();
        return;
      }

      const detector = new BarcodeDetectorCtor({
        formats: ['code_128', 'ean_13', 'qr_code', 'pdf417', 'codabar', 'code_39']
      });

      if (!canvasElRef.current) {
        canvasElRef.current = document.createElement('canvas');
      }

      scanIntervalRef.current = window.setInterval(async () => {
        try {
          const video = videoRef.current!;
          if (!video || video.readyState < 2) return;
          let codes: Array<{ rawValue?: string }> = [];
          try {
            codes = await detector.detect(video as unknown as CanvasImageSource);
          } catch {
            const canvas = canvasElRef.current!;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              codes = await detector.detect(canvas);
            }
          }
          if (codes && codes.length > 0) {
            const value = codes[0]?.rawValue || '';
            if (value) {
              setScanResult(value);
              setSearchTerm(value);
              stopBarcodeScanning();
              await searchProfessionals(value);
            }
          }
        } catch (err) {
          console.warn('Barcode scan error:', err);
        }
      }, 500);
    } catch (err: any) {
      console.error('Error starting camera', err);
      setError(err?.message || 'No se pudo iniciar la cámara');
      setIsScanning(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }
  };

  const stopBarcodeScanning = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (videoRef.current) {
      try { videoRef.current.pause(); } catch {}
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, []);


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
                            {/* NUEVO DETALLE: Estatus de Funcionario */}
                            <div className="flex items-center gap-1 col-span-1 md:col-span-2 text-gray-800 font-medium">
                              <Building2 className="w-4 h-4 text-purple-600" />
                              <span>
                                {getFuncionarioMeta(professional)}
                              </span>
                            </div>

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
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalSearch;
