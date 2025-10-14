import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from "react-leaflet";
import * as d3 from "d3";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
// Componentes de interfaz
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
import 'leaflet/dist/leaflet.css';

// ----------------------------------------------------
// PASO 1: IMPORTAR UTILIDADES Y HOOK DE DATOS
// ----------------------------------------------------
import ADM1_GEOJSON from "@/data/geoBoundaries-GNQ-ADM1.json";
import ADM2_GEOJSON from "@/data/geoBoundaries-GNQ-ADM2.json";

// Importamos la función de limpieza centralizada (¡Asegúrate de que esta ruta sea correcta!)
import { getCleanGeoName } from "@/utils/geoUtils"; 
// Importamos el nuevo hook que usa Supabase y mapea las estadísticas
import { useGeoDistrictStats } from "@/hooks/useGeoDistrictStats"; 

// --- SIMULACIÓN DE DATOS (Se mantienen intactos) ---
const useEstadisticasAvanzadas = () => ({ data: { porProvincia: { "Bioko Norte Province": 150, "Litoral Province": 80, "Annobon Province": 5, "Centro Sur Province": 40, "Kie-Ntem Province": 35, "Wele-Nzas Province": 30, "Bioko Sur Province": 15, "Djibloho Province": 10 } } });
// El hook useDistrictStats SIMULADO ha sido reemplazado
// Fin de la simulación

// --- TIPOS Y UTILS ---

type Level = "provincias" | "distritos";

type FeatureCollection = {
    type: "FeatureCollection";
    features: Array<any>;
};

// 1. UTILIDADES CORREGIDAS: Usan getCleanGeoName para unificación
function normalizeName(name: string): string {
    // Es la clave limpia para el mapa, usando la función centralizada.
    return getCleanGeoName(name || "");
}

function getShapeDisplayName(shapeName?: string): string {
    if (!shapeName) return "";
    
    // Usamos la normalización centralizada para obtener el nombre limpio
    const cleanName = getCleanGeoName(shapeName);
    
    // Re-capitalizar para presentación
    return cleanName
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

// --- COMPONENTE PRINCIPAL ---

const EquatorialGuineaMapLeaflet: React.FC<{ onNavigateToProvince?: (name: string) => void }> = ({ onNavigateToProvince }) => {
    const [level, setLevel] = useState<Level>("provincias");
    // Eliminamos el estado hoveredName para evitar el parpadeo
    const [activeFeatureName, setActiveFeatureName] = useState<string | null>(null); // Nuevo estado para el resumen activo
    const [selectedName, setSelectedName] = useState<string | null>(null);
    const geoJsonRef = useRef<any>(null);

    // Hooks data
    const { data: estadisticas } = useEstadisticasAvanzadas();
    const { data: districtStats = [], isLoading: districtsLoading } = useGeoDistrictStats();

    // 3. Carga SÍNCRONA y FILTRADO de los datos GeoJSON
    const geoData = useMemo(() => {
        if (level === "distritos" && districtsLoading) return null; 
        
        const rawData = level === "provincias" 
            ? (ADM1_GEOJSON as FeatureCollection) 
            : (ADM2_GEOJSON as FeatureCollection);
        
        // Aplicar filtro SOLO si estamos en el nivel de distritos y tenemos datos de la BD
        if (level === "distritos" && districtStats.length > 0) {
            const dbDistrictNames = new Set(districtStats.map(d => d.cleanName));

            const filteredFeatures = rawData.features.filter((feature: any) => {
                const shapeName = feature.properties?.shapeName || "";
                const geoKey = normalizeName(shapeName); 
                
                return dbDistrictNames.has(geoKey);
            });

            return {
                ...rawData,
                features: filteredFeatures
            } as FeatureCollection;
        }

        return rawData; 
    }, [level, districtStats, districtsLoading]);


    // 4. Mapas de valores - PROVINCIAS (Sin cambios)
    const provinciaValues = useMemo(() => {
        const map = new Map<string, number>();
        const byProv = (estadisticas?.porProvincia || {}) as Record<string, number>;
        for (const [prov, count] of Object.entries(byProv)) {
            map.set(normalizeName(prov), count || 0);
        }
        return map;
    }, [estadisticas]);

    // 5. Mapas de valores - DISTRITOS (Sin cambios)
    const distritoValues = useMemo(() => {
        const vals = new Map<string, number>();
        for (const d of districtStats) {
            if (!d || !d.cleanName) continue;
            vals.set(d.cleanName, d.total_profesionales || 0);
        }
        return vals;
    }, [districtStats]);

    const distritoCenters = useMemo(() => {
        const vals = new Map<string, number>();
        for (const d of districtStats) {
            if (!d || !d.cleanName) continue;
            vals.set(d.cleanName, d.total_centros || 0);
        }
        return vals;
    }, [districtStats]);


    // 6. Escala de Color - Se mantiene la lógica
    const { minValue, maxValue, colorScale } = useMemo(() => {
        if (!geoData?.features) return { minValue: 0, maxValue: 0, colorScale: () => "#f3f4f6" };

        const currentValues = level === "provincias" ? provinciaValues : distritoValues;
        const values: number[] = geoData.features.map((f: any) => {
            const raw = f.properties?.shapeName || "";
            const key = normalizeName(raw); 
            return currentValues.get(key) ?? 0;
        });

        const min = values.length ? Math.min(...values) : 0;
        const max = values.length ? Math.max(...values) : 0;
        const safeMax = Math.max(max, 1);

        const scale = d3.scaleSequential().domain([min, safeMax]).interpolator(d3.interpolateYlGnBu);
        return { minValue: min, maxValue: max, colorScale: scale };
    }, [geoData, provinciaValues, distritoValues, level]);


    // --- LÓGICA DE LEAFLET Y DISPLAY ---

    // Estabilizar la función style con useCallback
    const style = useCallback((feature: any) => {
        const raw = feature.properties?.shapeName || "";
        const key = normalizeName(raw);
        // Usamos los useMemo estables como dependencias implícitas
        const value = (level === "provincias" ? provinciaValues : distritoValues).get(key) ?? 0; 

        return {
            fillColor: value > 0 ? colorScale(value) : "#f3f4f6", 
            weight: 1.5,
            opacity: 1,
            color: '#134e4a',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }, [level, provinciaValues, distritoValues, colorScale]);


    // Estabilizar la función onEachFeature con useCallback
    const onEachFeature = useCallback((feature: any, layer: any) => {
        const name = getShapeDisplayName(feature.properties?.shapeName);

        layer.on({
            mouseover: (e: any) => {
                setActiveFeatureName(name); // Solución al parpadeo: el estado sólo se usa para el resumen externo
                e.target.setStyle({
                    weight: 3,
                    color: '#064e3b',
                    dashArray: '',
                    fillOpacity: 0.9
                });
                e.target.bringToFront();
            },
            mouseout: (e: any) => {
                setActiveFeatureName(null); // Solución al parpadeo: el estado sólo se usa para el resumen externo
                if (geoJsonRef.current) {
                    geoJsonRef.current.resetStyle(e.target);
                }
            },
            click: () => {
                setSelectedName(name);
                onNavigateToProvince?.(name);
            }
        });

        // NOTA: Si quieres un popup que no parpadee, usa el popup/tooltip nativo de Leaflet.
        // layer.bindPopup(name, { closeButton: false, className: 'leaflet-popup-content' });
    }, [onNavigateToProvince]);

    
    // Solución 1: Componente de control de mapa (Zoom/Pan)
    const MapController = () => {
        const map = useMap();

        // Utilizamos useEffect para ejecutar fitBounds cuando cambie el nivel o los datos
        useEffect(() => {
            if (geoData?.features && geoJsonRef.current) {
                try {
                    // Calculamos el recuadro que mejor se ajusta a las geometrías cargadas
                    const bounds = geoJsonRef.current.getBounds();
                    if (bounds.isValid()) {
                         // fitBounds con un pequeño padding (ej: 50, en píxeles) para que no quede pegado al borde
                        map.fitBounds(bounds, { padding: [20, 20] }); 
                    } else {
                        // Si no hay datos válidos (ej: solo un punto), volvemos al centro predeterminado
                        map.setView([1.5, 10], 7);
                    }
                } catch (error) {
                    // Manejar error si getBounds falla por datos vacíos/inválidos
                    map.setView([1.5, 10], 7);
                }
            }
        }, [level, geoData, map]); // Se ejecuta al cambiar de nivel, o al cargar geoData

        return null;
    };


    // --- RENDERIZADO DEL MAPA ---
    
    const currentValue = (name: string): number => {
        const key = normalizeName(name); 
        return level === "provincias" ? provinciaValues.get(key) ?? 0 : distritoValues.get(key) ?? 0;
    };
    const currentCenters = (name: string): number | null => {
        if (level !== "distritos") return null;
        const key = normalizeName(name);
        return distritoCenters.get(key) ?? 0;
    };

    // Usamos el estado activeFeatureName en lugar de hoveredName
    const activeName = activeFeatureName; 

    // Lógica robusta para mostrar el spinner
    const showLoading = level === "distritos" && districtsLoading;
    const showMap = geoData && !showLoading;

    return (
        <div className="space-y-6">
            {/* ... (Controles y Títulos) ... */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-teal-600" />
                        Mapa de Guinea Ecuatorial
                    </h3>
                    <p className="text-gray-600">Vista coroplética por provincias o distritos sanitarios</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={level} onValueChange={(v) => {
                        setLevel(v as Level);
                        setSelectedName(null); // Resetea la selección al cambiar de nivel
                    }}>
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
                            {level === "provincias" ? "Profesionales por Provincia" : "Profesionales por Distrito Sanitario"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative h-[550px] bg-gray-50 rounded-lg shadow-inner">
                            
                            {/* --- Lógica de renderizado del mapa --- */}
                            {showLoading ? (
                                // Muestra el spinner si estamos en distritos y están cargando
                                <div className="flex items-center justify-center gap-3 text-gray-600 h-full">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                                    <span>Cargando distritos sanitarios de la base de datos...</span>
                                </div>
                            ) : showMap ? (
                                // Muestra el mapa si tenemos geoData y no estamos cargando
                                <MapContainer
                                    // Eliminamos zoom y center fijos, ya que MapController se encarga.
                                    // Ponemos un valor inicial para evitar un error de Leaflet.
                                    center={[1.5, 10]} 
                                    zoom={7}
                                    scrollWheelZoom={true}
                                    className="h-full w-full rounded-lg z-0"
                                >
                                    <MapController /> {/* <--- Solución al Zoom/Pan Reset */}
                                    <TileLayer
                                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />

                                    <GeoJSON
                                        key={level} // Se mantiene el key para forzar la actualización de datos
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
                                    <span>No hay datos geográficos disponibles para esta selección o GeoJSON no cargado.</span>
                                </div>
                            )}

                            {/* Popup de Hover (Usando activeName en lugar de hoveredName) */}
                            {activeName && (
                                <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-xl border z-10 min-w-64">
                                    <h4 className="font-semibold text-lg mb-2">{activeName}</h4>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 flex items-center gap-1"><Users className="w-3 h-3" /> Prof. (aprobados):</span>
                                            <span className="font-bold text-teal-700">{currentValue(activeName)}</span>
                                        </div>
                                        {level === "distritos" ? (
                                            <div className="flex justify-between items-center border-t pt-1 mt-1">
                                                <span className="text-gray-600 flex items-center gap-1"><Building className="w-3 h-3" /> Centros:</span>
                                                <span className="font-medium">{currentCenters(activeName)}</span>
                                            </div>
                                        ) : null}
                                    </div>
                                    <Button size="sm" className="w-full mt-3 bg-teal-600 hover:bg-teal-700" onClick={() => onNavigateToProvince?.(activeName)}>
                                        <Eye className="w-4 h-4 mr-1" /> Ver Detalles
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Panel Lateral (Se mantiene) */}
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

export default EquatorialGuineaMapLeaflet;git