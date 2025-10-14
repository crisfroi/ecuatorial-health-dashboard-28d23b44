import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
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
// NOTA: Estas importaciones deben ser archivos existentes en tu proyecto.
import ADM1_GEOJSON from "@/data/geoBoundaries-GNQ-ADM1.json";
import ADM2_GEOJSON from "@/data/geoBoundaries-GNQ-ADM2.json";
import { getCleanGeoName } from "@/utils/geoUtils"; 
import { useGeoDistrictStats } from "@/hooks/useGeoDistrictStats"; 

// --- SIMULACIÓN DE DATOS (Se mantienen intactos) ---
const useEstadisticasAvanzadas = () => ({ data: { porProvincia: { "Bioko Norte Province": 150, "Litoral Province": 80, "Annobon Province": 5, "Centro Sur Province": 40, "Kie-Ntem Province": 35, "Wele-Nzas Province": 30, "Bioko Sur Province": 15, "Djibloho Province": 10 } } });
// Fin de la simulación

// --- TIPOS Y UTILS ---

type Level = "provincias" | "distritos";

type FeatureCollection = {
    type: "FeatureCollection";
    features: Array<any>;
};

function normalizeName(name: string): string {
    return getCleanGeoName(name || "");
}

function getShapeDisplayName(shapeName?: string): string {
    if (!shapeName) return "";
    const cleanName = getCleanGeoName(shapeName);
    return cleanName
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

// ----------------------------------------------------
// PASO 2: ESTRUCTURA DE DATOS DEL CSV (RELACION GEOJSON-BD.csv)
// ----------------------------------------------------

const GEO_DB_LOOKUP_RAW: Array<{ shapeName: string; dbName: string }> = [
    { shapeName: "AYENE", dbName: "Distrito Sanitario de Anisok" },
    { shapeName: "NKUE", dbName: "Distrito Sanitario de Micomiseng" },
    { shapeName: "NSOC NSOMO", dbName: "Distrito Sanitario de Nsok Nsomo" },
    { shapeName: "AÑISOC", dbName: "Distrito Sanitario de Anisok" },
    { shapeName: "ACONIBE", dbName: "Distrito Sanitario de Akonibe" },
    { shapeName: "BICURGA", dbName: "Distrito Sanitario de Evinayong" },
    { shapeName: "EVINAYONG", dbName: "Distrito Sanitario de Evinayong" },
    { shapeName: "MONGOMOYEN", dbName: "Distrito Sanitario de Mongomo" },
    { shapeName: "CORISCO", dbName: "Distrito Sanitario de Cogo" },
    { shapeName: "BATA", dbName: "Distrito Sanitario de Bata" },
    { shapeName: "MACHINDA", dbName: "Distrito Sanitario de Bata" },
    { shapeName: "NIEFANG", dbName: "Distrito Sanitario de Niefang" },
    { shapeName: "NKIMI", dbName: "Distrito Sanitario de Oyala" },
    { shapeName: "MICOMISENG", dbName: "Distrito Sanitario de Micomiseng" },
    { shapeName: "EBEBIYIN", dbName: "Distrito Sanitario de Ebebiyin" },
    { shapeName: "MONGOMO", dbName: "Distrito Sanitario de Mongomo" },
    { shapeName: "NSORK", dbName: "Distrito Sanitario de Nsork" },
    { shapeName: "ACURENAM", dbName: "Distrito Sanitario de Akurenam" },
    { shapeName: "MBINI", dbName: "Distrito Sanitario de Mbini" },
    { shapeName: "BITICA", dbName: "Distrito Sanitario de Mbini" },
    { shapeName: "COGO", dbName: "Distrito Sanitario de Cogo" },
    { shapeName: "ELOBEY GRANDE", dbName: "Distrito Sanitario de Cogo" },
    { shapeName: "ELOBEY CHICO", dbName: "Distrito Sanitario de Cogo" },
    { shapeName: "ANNOBON", dbName: "Distrito Sanitario de Annobón" },
    { shapeName: "MALABO", dbName: "Distrito Sanitario de Malabo" },
    { shapeName: "BANEY", dbName: "Distrito Sanitario de Baney" },
    { shapeName: "LUBA", dbName: "Distrito Sanitario de Luba" },
    { shapeName: "RIABA", dbName: "Distrito Sanitario de Riaba" },
];

const DB_LOOKUP_MAP = new Map<string, { dbName: string, shapeNameRaw: string }>();
GEO_DB_LOOKUP_RAW.forEach(item => {
    DB_LOOKUP_MAP.set(normalizeName(item.shapeName), {
        dbName: item.dbName,
        shapeNameRaw: item.shapeName
    });
});

// Nombres GeoJSON que FUERON ABSORBIDOS y DEBEN llevar el (GeoJSON Name) entre paréntesis
const ABSORBED_SHAPES_SET = new Set([
    normalizeName("AYENE"),
    normalizeName("CORISCO"),
    normalizeName("MACHINDA"),
    normalizeName("BICURGA"),
    normalizeName("BITICA"),
]);

// ----------------------------------------------------
// PASO 3: FUNCIÓN DE NOMBRE DE VISUALIZACIÓN (Lógica Correcta)
// ----------------------------------------------------
const getDisplayTitle = (geoKey: string | null, currentLevel: Level): string | null => {
    if (!geoKey) return null;
    
    if (currentLevel === "provincias") {
        return getShapeDisplayName(geoKey); 
    }
    
    // Lógica para Distritos
    const lookup = DB_LOOKUP_MAP.get(geoKey);
    
    // Fallback: Si no está en el CSV, usa el nombre GeoJSON
    if (!lookup) {
        return getShapeDisplayName(geoKey);
    }

    const isAbsorbed = ABSORBED_SHAPES_SET.has(geoKey);
    
    if (isAbsorbed) {
        // Caso especial: Distritos absorbidos. Muestra el nombre de la BD + (GeoJSON Name)
        // Ej: Distrito Sanitario de Mbini (BITICA)
        return `${lookup.dbName} (${lookup.shapeNameRaw})`;
    } else {
        // Caso estándar: Incluye distritos "padre" que absorben y distritos normales.
        // Muestra solo el nombre de la BD.
        // Ej: Distrito Sanitario de Mbini
        return lookup.dbName;
    }
};


// --- COMPONENTE CONTROLADOR DEL MAPA (FIXED: Static Zoom/Pan) ---
// Se ha refactorizado para garantizar el desplazamiento estático.
const MapController = ({ level, geoData, geoJsonRef }: { level: Level, geoData: FeatureCollection | null, geoJsonRef: React.MutableRefObject<any> }) => {
    const map = useMap();
    const lastLevelRef = useRef(level);

    useEffect(() => {
        // Condition 1: Check if the map is initialized and we have data
        if (!geoData?.features || !geoJsonRef.current) {
            map.setView([1.5, 10], 7); // Default view if no data
            return;
        }

        // Condition 2: Solo ejecutar fitBounds (recentering) cuando el nivel cambie.
        // El mapa mantiene el desplazamiento y zoom del usuario si solo cambia la selección.
        if (lastLevelRef.current !== level) {
            try {
                const bounds = geoJsonRef.current.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [20, 20] });
                } else {
                    map.setView([1.5, 10], 7);
                }
            } catch (error) {
                map.setView([1.5, 10], 7);
            }
        }
        
        // Actualiza la referencia para la siguiente renderización
        lastLevelRef.current = level;

    // Dependencias son SÓLO las que deben causar un ajuste de límites.
    }, [level, geoData, map, geoJsonRef]); 

    return null;
};


// --- COMPONENTE PRINCIPAL ---

const EquatorialGuineaMapLeaflet: React.FC<{ onNavigateToProvince?: (name: string) => void }> = ({ onNavigateToProvince }) => {
    const [level, setLevel] = useState<Level>("provincias");
    const [hoveredGeoKey, setHoveredGeoKey] = useState<string | null>(null); 
    const [selectedGeoKey, setSelectedGeoKey] = useState<string | null>(null);
    const geoJsonRef = useRef<any>(null);

    // Hooks data
    const { data: estadisticas } = useEstadisticasAvanzadas();
    const { data: districtStats = [], isLoading: districtsLoading } = useGeoDistrictStats();

    // Carga SÍNCRONA y FILTRADO de los datos GeoJSON
    const geoData = useMemo(() => {
        if (level === "distritos" && districtsLoading) return null; 
        
        const rawData = level === "provincias" 
            ? (ADM1_GEOJSON as FeatureCollection) 
            : (ADM2_GEOJSON as FeatureCollection);
        
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


    // Mapas de valores (Sin cambios)
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

    // Escala de Color (Sin cambios)
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


    // Estabilizar la función style
    const style = useCallback((feature: any) => {
        const raw = feature.properties?.shapeName || "";
        const key = normalizeName(raw);
        const value = (level === "provincias" ? provinciaValues : distritoValues).get(key) ?? 0; 
        
        const isSelected = key === selectedGeoKey; 
        
        return {
            fillColor: value > 0 ? colorScale(value) : "#f3f4f6", 
            weight: isSelected ? 4 : 1.5,
            opacity: 1,
            color: isSelected ? '#a80000' : '#134e4a', 
            dashArray: isSelected ? '' : '3',
            fillOpacity: isSelected ? 0.9 : 0.7
        };
    }, [level, provinciaValues, distritoValues, colorScale, selectedGeoKey]);


    // Estabilizar la función onEachFeature
    const onEachFeature = useCallback((feature: any, layer: any) => {
        const raw = feature.properties?.shapeName || "";
        const geoKey = normalizeName(raw); 

        layer.on({
            mouseover: (e: any) => {
                setHoveredGeoKey(geoKey); 
                e.target.setStyle({
                    weight: 3,
                    color: '#064e3b',
                    dashArray: '',
                    fillOpacity: 0.9
                });
                e.target.bringToFront();
            },
            mouseout: (e: any) => {
                setHoveredGeoKey(null); 
                if (geoJsonRef.current) {
                    geoJsonRef.current.resetStyle(e.target);
                }
            },
            click: () => {
                const newSelectedKey = geoKey === selectedGeoKey ? null : geoKey; 
                setSelectedGeoKey(newSelectedKey); 
                
                // Navegación usa el nombre de visualización
                if (newSelectedKey) {
                    const navName = getDisplayTitle(newSelectedKey, level);
                    if(navName) onNavigateToProvince?.(navName);
                }
            }
        });
    }, [onNavigateToProvince, selectedGeoKey, level]);


    // --- RENDERIZADO DEL MAPA UTILS ---
    
    // Funciones de valor usan la clave GeoJSON
    const currentValue = (key: string): number => {
        return level === "provincias" ? provinciaValues.get(key) ?? 0 : distritoValues.get(key) ?? 0;
    };
    const currentCenters = (key: string): number | null => {
        if (level !== "distritos") return null;
        return distritoCenters.get(key) ?? 0;
    };

    // Nombres de visualización derivados de las claves almacenadas (Usa la función corregida)
    const activeName = getDisplayTitle(hoveredGeoKey, level); 
    const selectedName = getDisplayTitle(selectedGeoKey, level); 

    // Lógica robusta para mostrar el spinner
    const showLoading = level === "distritos" && districtsLoading;
    const showMap = geoData && !showLoading;

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
                    <Select value={level} onValueChange={(v) => {
                        setLevel(v as Level);
                        setSelectedGeoKey(null); // Resetea la selección al cambiar de nivel
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
                            
                            {showLoading ? (
                                <div className="flex items-center justify-center gap-3 text-gray-600 h-full">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                                    <span>Cargando distritos sanitarios de la base de datos...</span>
                                </div>
                            ) : showMap ? (
                                <MapContainer
                                    center={[1.5, 10]} 
                                    zoom={7}
                                    scrollWheelZoom={true}
                                    className="h-full w-full rounded-lg z-0"
                                >
                                    <MapController 
                                        level={level} 
                                        geoData={geoData} 
                                        geoJsonRef={geoJsonRef} 
                                    /> {/* <--- Controla el ajuste de límites estático */}
                                    <TileLayer
                                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />

                                    <GeoJSON
                                        key={level} 
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

                            {/* Popup de Hover (Usa el nombre de visualización) */}
                            {activeName && hoveredGeoKey && (
                                <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-xl border z-10 min-w-64">
                                    <h4 className="font-semibold text-lg mb-2">{activeName}</h4>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 flex items-center gap-1"><Users className="w-3 h-3" /> Prof. (aprobados):</span>
                                            <span className="font-bold text-teal-700">{currentValue(hoveredGeoKey)}</span>
                                        </div>
                                        {level === "distritos" ? (
                                            <div className="flex justify-between items-center border-t pt-1 mt-1">
                                                <span className="text-gray-600 flex items-center gap-1"><Building className="w-3 h-3" /> Centros:</span>
                                                <span className="font-medium">{currentCenters(hoveredGeoKey)}</span>
                                            </div>
                                        ) : null}
                                    </div>
                                    <Button size="sm" className="w-full mt-3 bg-teal-600 hover:bg-teal-700" onClick={() => {
                                        const navName = getDisplayTitle(hoveredGeoKey, level);
                                        if(navName) onNavigateToProvince?.(navName);
                                    }}>
                                        <Eye className="w-4 h-4 mr-1" /> Ver Detalles
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Panel Lateral */}
                <Card>
                    <CardHeader>
                        {/* Utiliza el nombre de visualización (DB Name) */}
                        <CardTitle>{selectedName ? selectedName : "Estadísticas Generales"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedGeoKey ? ( // Comprueba si existe una clave seleccionada
                            <div className="space-y-4">
                                <div className="text-center p-4 bg-teal-50 rounded-lg">
                                    {/* Utiliza la clave para la búsqueda del valor */}
                                    <div className="text-3xl font-bold text-teal-600">{currentValue(selectedGeoKey)}</div>
                                    <div className="text-sm text-gray-600">Profesionales (aprobados)</div>
                                </div>
                                {level === "distritos" ? (
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                        <div className="flex items-center gap-2">
                                            <Building className="w-5 h-5 text-gray-600" />
                                            <span className="text-base font-medium">Centros</span>
                                        </div>
                                        <Badge variant="default" className="bg-teal-500 hover:bg-teal-500 text-white text-md p-2">{currentCenters(selectedGeoKey)}</Badge>
                                    </div>
                                ) : null}
                                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => onNavigateToProvince?.(selectedName || '')}>
                                    <Eye className="w-4 h-4 mr-2" /> Ver detalles de {selectedName}
                                </Button>
                                {/* Botón para deseleccionar */}
                                <Button 
                                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700"
                                    onClick={() => setSelectedGeoKey(null)} // Limpia la clave
                                >
                                    Limpiar Selección
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
                                        .map(([geoKey, value], index) => ( // geoKey es el nombre normalizado
                                            <div key={geoKey} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm border">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-600"}`} />
                                                    {/* Usa la función de visualización para el nombre */}
                                                    <span className="text-sm font-medium">{getDisplayTitle(geoKey, level)}</span>
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