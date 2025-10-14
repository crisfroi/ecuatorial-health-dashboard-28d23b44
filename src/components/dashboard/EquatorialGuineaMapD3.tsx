import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import * as d3 from "d3"; // Se mantiene solo para la escala de color (d3.scaleSequential)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Building, Eye, Map as MapIcon } from "lucide-react";

// *** IMPORTANTE: NECESITAS INSTALAR ESTO: ***
// npm install leaflet react-leaflet
import 'leaflet/dist/leaflet.css';
// Si no tienes los iconos de Leaflet, podrías necesitar un fix como este:
/*
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'leaflet/images/marker-icon-2x.png',
  iconUrl: 'leaflet/images/marker-icon.png',
  shadowUrl: 'leaflet/images/marker-shadow.png',
});
*/

// --- SIMULACIÓN DE DATOS (Mismos que antes) ---
const useEstadisticasAvanzadas = () => ({ data: { porProvincia: { "Bioko Norte Province": 150, "Litoral Province": 80, "Annobon Province": 5, "Centro Sur Province": 40, "Kie-Ntem Province": 35, "Wele-Nzas Province": 30, "Bioko Sur Province": 15, "Djibloho Province": 10 } } });
const useDistrictStats = () => ({
  data: [
    { distrito_sanitario: "Malabo", total_profesionales: 90, total_centros: 12 },
    { distrito_sanitario: "Bata", total_profesionales: 60, total_centros: 8 },
    { distrito_sanitario: "Ebebiyin", total_profesionales: 25, total_centros: 4 },
    { distrito_sanitario: "Luba", total_profesionales: 10, total_centros: 2 },
    { distrito_sanitario: "Riaba", total_profesionales: 5, total_centros: 1 },
    { distrito_sanitario: "Mongomo", total_profesionales: 15, total_centros: 3 },
    { distrito_sanitario: "Añisoc", total_profesionales: 12, total_centros: 2 },
    { distrito_sanitario: "Akonibe", total_profesionales: 8, total_centros: 1 },
    { distrito_sanitario: "Micomeseng", total_profesionales: 18, total_centros: 3 },
    { distrito_sanitario: "Mbini", total_profesionales: 6, total_centros: 1 },
  ],
});
// Fin de la simulación

// URLs de GeoJSON (Las mismas que arreglamos en el intento con D3)
const ADM1_URL = "https://www.geoboundaries.org/api/current/simplified/GNQ/ADM1/";
const ADM2_URL = "https://www.geoboundaries.org/api/current/simplified/GNQ/ADM2/";

// --- TIPOS Y UTILS ---

type Level = "provincias" | "distritos";

type FeatureCollection = {
  type: "FeatureCollection";
  features: Array<any>; // Simplificado para Leaflet
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+province$/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getShapeDisplayName(shapeName?: string): string {
  if (!shapeName) return "";
  const cleanName = shapeName.replace(/\s+Province$/i, "").trim();
  return cleanName
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Función para obtener GeoJSON de la URL de geoBoundaries y manejar backoff
const fetchGeoJSON = async (url: string, retries = 3): Promise<FeatureCollection | null> => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const geojsonUrl = json.filter((r: any) => r.fileExtension === "geojson")[0]?.downloadURL;
      if (!geojsonUrl) throw new Error("No se encontró URL de GeoJSON en la respuesta de geoBoundaries.");

      const geoRes = await fetch(geojsonUrl);
      if (!geoRes.ok) throw new Error(`HTTP ${geoRes.status} al descargar GeoJSON`);

      return (await geoRes.json()) as FeatureCollection;
    } catch (e: any) {
      console.error(`Intento ${i + 1} fallido:`, e);
      if (i === retries - 1) throw e;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 500));
    }
  }
  return null;
};


// --- COMPONENTE PRINCIPAL ---

const EquatorialGuineaMapLeaflet: React.FC<{ onNavigateToProvince?: (name: string) => void }> = ({ onNavigateToProvince }) => {
  const [level, setLevel] = useState<Level>("provincias");
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const geoJsonRef = useRef<any>(null);

  // Hooks data
  const { data: estadisticas } = useEstadisticasAvanzadas();
  const { data: districtStats = [] } = useDistrictStats();

  // 1. Fetching de los datos GeoJSON
  useEffect(() => {
    const url = level === "provincias" ? ADM1_URL : ADM2_URL;
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        setGeoData(null);
        const json = await fetchGeoJSON(url);
        if (!cancelled) setGeoData(json);
      } catch (e: any) {
        if (!cancelled) setError(`Error cargando GeoJSON (${level}): ${e?.message || e}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [level]);

  // 2. Mapas de valores (para el coroplético)
  const provinciaValues = useMemo(() => {
    const map = new Map<string, number>();
    const byProv = (estadisticas?.porProvincia || {}) as Record<string, number>;
    for (const [prov, count] of Object.entries(byProv)) {
      map.set(normalizeName(prov), count || 0);
    }
    return map;
  }, [estadisticas]);

  const distritoValues = useMemo(() => {
    const vals = new Map<string, number>();
    for (const d of districtStats) {
      if (!d || !d.distrito_sanitario) continue;
      vals.set(normalizeName(getShapeDisplayName(String(d.distrito_sanitario))), d.total_profesionales || 0);
    }
    return vals;
  }, [districtStats]);

  const distritoCenters = useMemo(() => {
    const vals = new Map<string, number>();
    for (const d of districtStats) {
      if (!d || !d.distrito_sanitario) continue;
      vals.set(normalizeName(getShapeDisplayName(String(d.distrito_sanitario))), d.total_centros || 0);
    }
    return vals;
  }, [districtStats]);


  // 3. Escala de Color
  const { minValue, maxValue, colorScale } = useMemo(() => {
    if (!geoData?.features) return { minValue: 0, maxValue: 0, colorScale: () => "#f3f4f6" };

    const currentValues = level === "provincias" ? provinciaValues : distritoValues;
    const values: number[] = geoData.features.map((f: any) => {
      const raw = f.properties?.shapeName || "";
      const key = normalizeName(getShapeDisplayName(raw));
      return currentValues.get(key) ?? 0;
    });

    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;
    const safeMax = Math.max(max, 1);

    // Reutilizamos la escala de D3
    const scale = d3.scaleSequential().domain([min, safeMax]).interpolator(d3.interpolateYlGnBu);
    return { minValue: min, maxValue: max, colorScale: scale };
  }, [geoData, provinciaValues, distritoValues, level]);


  // --- LÓGICA DE STYLING Y EVENTOS DE LEAFLET ---

  // Función para obtener el estilo de cada polígono
  const style = (feature: any) => {
    const raw = feature.properties?.shapeName || "";
    const key = normalizeName(getShapeDisplayName(raw));
    const value = (level === "provincias" ? provinciaValues : distritoValues).get(key) ?? 0;

    return {
      fillColor: value > 0 ? colorScale(value) : "#f3f4f6", // Gris si no hay datos
      weight: 1.5,
      opacity: 1,
      color: '#134e4a', // Borde
      dashArray: '3',
      fillOpacity: 0.7
    };
  };

  // Función para manejar eventos (hover/click) en cada polígono
  const onEachFeature = (feature: any, layer: any) => {
    const name = getShapeDisplayName(feature.properties?.shapeName);

    layer.on({
      mouseover: (e: any) => {
        setHoveredName(name);
        e.target.setStyle({
          weight: 3,
          color: '#064e3b',
          dashArray: '',
          fillOpacity: 0.9
        });
        e.target.bringToFront();
      },
      mouseout: (e: any) => {
        setHoveredName(null);
        // Resetea al estilo original. Se necesita `geoJsonRef.current`
        if (geoJsonRef.current) {
          geoJsonRef.current.resetStyle(e.target);
        }
      },
      click: () => {
        setSelectedName(name);
        onNavigateToProvince?.(name);
      }
    });

    // Opcional: Popup al hacer click
    layer.bindPopup(name, { closeButton: false, className: 'leaflet-popup-content' });
  };

  // Custom Hook para controlar la vista del mapa (ej. centrado/zoom)
  const RecenterMap = () => {
    const map = useMap();
    // Coordenadas de Guinea Ecuatorial: [1.5, 10]
    useEffect(() => {
      map.setView([1.5, 10], map.getZoom() < 7 ? 7 : map.getZoom());
    }, [map]);
    return null;
  };


  // --- RENDERIZADO DEL MAPA ---

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center text-red-600">
          {error}
        </CardContent>
      </Card>
    );
  }

  const currentValue = (name: string): number => {
    const key = normalizeName(name);
    return level === "provincias" ? provinciaValues.get(key) ?? 0 : distritoValues.get(key) ?? 0;
  };
  const currentCenters = (name: string): number | null => {
    if (level !== "distritos") return null;
    const key = normalizeName(name);
    return distritoCenters.get(key) ?? 0;
  };

  const mapCenter: [number, number] = [1.5, 10]; // Centro de Guinea Ecuatorial

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            Mapa de Guinea Ecuatorial
          </h3>
          <p className="text-gray-600">Vista coroplética por provincias o distritos sanitarios</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={level} onValueChange={(v) => setLevel(v as Level)}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Seleccionar nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="provincias">
                <div className="flex items-center gap-2">
                  <MapIcon className="w-4 h-4" /> Provincias (ADM1)
                </div>
              </SelectItem>
              <SelectItem value="distritos">
                <div className="flex items-center gap-2">
                  <MapIcon className="w-4 h-4" /> Distritos Sanitarios (ADM2)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {level === "provincias" ? "Aprobados por Provincia" : "Aprobados por Distrito Sanitario"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-[550px] bg-gray-50 rounded-lg shadow-inner">
              {geoData ? (
                <MapContainer
                  center={mapCenter}
                  zoom={7}
                  scrollWheelZoom={true}
                  className="h-full w-full rounded-lg z-0"
                // Nota: La capa GeoJSON de Leaflet no se escala tan bien en React como D3 para las islas. 
                // El mapa se centra en el país. Se puede usar un "Inset map" de Leaflet si es necesario, pero lo omitimos por simplicidad.
                >
                  <RecenterMap />
                  <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* El componente GeoJSON maneja el dibujo de los polígonos */}
                  <GeoJSON
                    key={level} // Forzar re-render cuando cambia el nivel
                    data={geoData}
                    style={style}
                    onEachFeature={onEachFeature}
                    ref={geoJsonRef}
                  />

                  {/* Leyenda Simple */}
                  <div className="absolute bottom-4 left-4 p-2 bg-white/90 rounded shadow-md z-[400] text-sm">
                    <h4 className="font-bold mb-1 border-b pb-1">Leyenda</h4>
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2" style={{ backgroundColor: colorScale(maxValue * 0.75), border: '1px solid #aaa' }}></div>
                      Alto ({maxValue})
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2" style={{ backgroundColor: colorScale(maxValue * 0.4), border: '1px solid #aaa' }}></div>
                      Medio
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2" style={{ backgroundColor: colorScale(minValue), border: '1px solid #aaa' }}></div>
                      Bajo ({minValue})
                    </div>
                  </div>

                </MapContainer>
              ) : (
                <div className="flex items-center justify-center gap-3 text-gray-600 h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                  <span>Cargando mapa...</span>
                </div>
              )}


              {hoveredName && (
                <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-xl border z-10 min-w-64">
                  <h4 className="font-semibold text-lg mb-2">{hoveredName}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-1"><Users className="w-3 h-3" /> Prof. (aprobados):</span>
                      <span className="font-bold text-teal-700">{currentValue(hoveredName)}</span>
                    </div>
                    {level === "distritos" ? (
                      <div className="flex justify-between items-center border-t pt-1 mt-1">
                        <span className="text-gray-600 flex items-center gap-1"><Building className="w-3 h-3" /> Centros:</span>
                        <span className="font-medium">{currentCenters(hoveredName)}</span>
                      </div>
                    ) : null}
                  </div>
                  <Button size="sm" className="w-full mt-3 bg-teal-600 hover:bg-teal-700" onClick={() => onNavigateToProvince?.(hoveredName)}>
                    <Eye className="w-4 h-4 mr-1" /> Ver Detalles
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Panel Lateral (mismo que antes) */}
        <Card>
          <CardHeader>
            <CardTitle>{selectedName ? selectedName : "Estadísticas Generales"}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedName ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <div className="text-3xl font-bold text-teal-600">{currentValue(selectedName)}</div>
                  <div className="text-sm text-gray-600">Profesionales (aprobados)</div>
                </div>
                {level === "distritos" ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-gray-600" />
                      <span className="text-base font-medium">Centros</span>
                    </div>
                    <Badge variant="default" className="bg-teal-500 hover:bg-teal-500 text-white text-md p-2">{currentCenters(selectedName)}</Badge>
                  </div>
                ) : null}
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => onNavigateToProvince?.(selectedName)}>
                  <Eye className="w-4 h-4 mr-2" /> Ver detalles de {selectedName}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Haz clic en una región para ver detalles</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700 border-b pb-1">Top 3 {level === "provincias" ? "Provincias" : "Distritos"}</h4>
                  {Array.from((level === "provincias" ? provinciaValues : distritoValues).entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([name, value], index) => (
                      <div key={name} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm border">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-600"}`} />
                          <span className="text-sm font-medium">{getShapeDisplayName(name)}</span>
                        </div>
                        <Badge variant="secondary" className="bg-teal-100 text-teal-700">{value}</Badge>
                      </div>
                    ))}
                </div>
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-2 text-xs text-center">
                    <div className="p-3 bg-blue-50 rounded-lg shadow-inner">
                      <div className="font-bold text-lg text-blue-600">
                        {Array.from((level === "provincias" ? provinciaValues : distritoValues).values()).reduce((s, v) => s + v, 0)}
                      </div>
                      <div className="text-gray-600">Total Profesionales</div>
                    </div>
                    {level === "distritos" ? (
                      <div className="p-3 bg-green-50 rounded-lg shadow-inner">
                        <div className="font-bold text-lg text-green-600">
                          {Array.from(distritoCenters.values()).reduce((s, v) => s + v, 0)}
                        </div>
                        <div className="text-gray-600">Total Centros</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EquatorialGuineaMapLeaflet;