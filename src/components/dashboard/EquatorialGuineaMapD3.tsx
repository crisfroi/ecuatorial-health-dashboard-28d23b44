import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import * as d3 from "d3";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import "leaflet/dist/leaflet.css";

// PASO 1: IMPORTAR UTILIDADES Y HOOK DE DATOS
import ADM1_GEOJSON from "@/data/geoBoundaries-GNQ-ADM1.json";
import ADM2_GEOJSON from "@/data/geoBoundaries-GNQ-ADM2.json";
import { getCleanGeoName } from "@/utils/geoUtils";
import { useGeoDistrictStats } from "@/hooks/useGeoDistrictStats";
import { useProvinceStats, useDistrictStats, useTitulacionCategoryStats, useWorkAgeStats } from "@/hooks/useAdvancedAnalytics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { useEstadisticasAvanzadas } from "@/hooks/useEstadisticasAvanzadas";

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

// ESTRUCTURA DE DATOS DEL CSV Y LÓGICA DE ABSORCIÓN
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
    { shapeName: "NKIMI", dbName: "Distrito Sanitario de Niefang" },
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

const ABSORBED_SHAPES_SET = new Set([
    normalizeName("CORISCO"),
    normalizeName("MACHINDA"),
    normalizeName("BICURGA"),
    normalizeName("BITICA"),
    normalizeName("MONGOMOYEN"),
    normalizeName("NKUE"),
    normalizeName("NSOC NSOMO"),
    normalizeName("NKIMI"),
]);

const getDisplayTitle = (geoKey: string | null, currentLevel: Level): string | null => {
    if (!geoKey) return null;
    if (currentLevel === "provincias") {
        return getShapeDisplayName(geoKey);
    }
    const lookup = DB_LOOKUP_MAP.get(geoKey);
    if (!lookup) {
        return getShapeDisplayName(geoKey);
    }
    const isAbsorbed = ABSORBED_SHAPES_SET.has(geoKey);
    if (isAbsorbed) {
        return `${lookup.dbName} (${lookup.shapeNameRaw})`;
    }
    return lookup.dbName;
};

const MapController = ({ level, geoData, geoJsonRef }: { level: Level, geoData: FeatureCollection | null, geoJsonRef: React.MutableRefObject<any> }) => {
    const map = useMap();
    const lastLevelRef = useRef(level);

    useEffect(() => {
        if (!geoData?.features || !geoJsonRef.current) {
            map.setView([1.5, 10], 7);
            return;
        }
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
        lastLevelRef.current = level;
    }, [level, geoData, map, geoJsonRef]);

    return null;
};

const EquatorialGuineaMapLeaflet: React.FC<{ onNavigateToProvince?: (name: string) => void; onSelectRegion?: (name: string, level: Level) => void }> = ({ onNavigateToProvince, onSelectRegion }) => {
    const [level, setLevel] = useState<Level>("provincias");
    const [hoveredGeoKey, setHoveredGeoKey] = useState<string | null>(null);
    const [selectedGeoKey, setSelectedGeoKey] = useState<string | null>(null);
    const geoJsonRef = useRef<any>(null);

    const { data: estadisticas } = useEstadisticasAvanzadas();
    const { data: districtStats = [], isLoading: districtsLoading } = useGeoDistrictStats();

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
                if (dbDistrictNames.has(geoKey)) {
                    return true;
                }
                const lookup = DB_LOOKUP_MAP.get(geoKey);
                if (lookup) {
                    const canonicalDbKey = normalizeName(lookup.dbName);
                    if (dbDistrictNames.has(canonicalDbKey)) {
                        return true;
                    }
                }
                return false;
            });
            return {
                ...rawData,
                features: filteredFeatures
            } as FeatureCollection;
        }
        return rawData;
    }, [level, districtStats, districtsLoading]);

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

    const getCanonicalValue = useCallback((geoKey: string, level: Level): number => {
        const currentValues = level === "provincias" ? provinciaValues : distritoValues;
        if (currentValues.has(geoKey)) {
            return currentValues.get(geoKey) ?? 0;
        }
        const lookup = DB_LOOKUP_MAP.get(geoKey);
        if (lookup) {
            const canonicalDbKey = normalizeName(lookup.dbName);
            return currentValues.get(canonicalDbKey) ?? 0;
        }
        return 0;
    }, [provinciaValues, distritoValues]);

    const distritoCenters = useMemo(() => {
        const vals = new Map<string, number>();
        for (const d of districtStats) {
            if (!d || !d.cleanName) continue;
            vals.set(d.cleanName, d.total_centros || 0);
        }
        return vals;
    }, [districtStats]);

    const { minValue, maxValue, colorScale } = useMemo(() => {
        if (!geoData?.features) return { minValue: 0, maxValue: 0, colorScale: () => "#f3f4f6" };
        const values: number[] = geoData.features.map((f: any) => {
            const raw = f.properties?.shapeName || "";
            const key = normalizeName(raw);
            return getCanonicalValue(key, level);
        });
        const min = values.length ? Math.min(...values) : 0;
        const max = values.length ? Math.max(...values) : 0;
        const safeMax = Math.max(max, 1);
        const scale = d3.scaleSequential().domain([min, safeMax]).interpolator(d3.interpolateYlGnBu);
        return { minValue: min, maxValue: max, colorScale: scale };
    }, [geoData, level, getCanonicalValue]);

    const style = useCallback((feature: any) => {
        const raw = feature.properties?.shapeName || "";
        const key = normalizeName(raw);
        const value = getCanonicalValue(key, level);
        const isSelected = key === selectedGeoKey;
        return {
            fillColor: value > 0 ? colorScale(value) : "#f3f4f6",
            weight: isSelected ? 4 : 1.5,
            opacity: 1,
            color: isSelected ? '#a80000' : '#134e4a',
            dashArray: isSelected ? '' : '3',
            fillOpacity: isSelected ? 0.9 : 0.7
        };
    }, [level, colorScale, selectedGeoKey, getCanonicalValue]);

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
                const navName = getDisplayTitle(newSelectedKey, level);
                if (navName) {
                    // backward compatibility
                    onNavigateToProvince?.(navName);
                    // new callback with level information
                    onSelectRegion?.(navName, level);
                }
            }
        });
    }, [onNavigateToProvince, selectedGeoKey, level]);

    const currentValue = (key: string): number => getCanonicalValue(key, level);

    const currentCenters = (key: string): number | null => {
        if (level !== "distritos") return null;
        const lookup = DB_LOOKUP_MAP.get(key);
        if (lookup) {
            const canonicalDbKey = normalizeName(lookup.dbName);
            return distritoCenters.get(canonicalDbKey) ?? 0;
        }
        return distritoCenters.get(key) ?? 0;
    };

    const activeName = getDisplayTitle(hoveredGeoKey, level);
    const selectedName = getDisplayTitle(selectedGeoKey, level);

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
                        setSelectedGeoKey(null);
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
                                    />
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
                                        if (navName) onNavigateToProvince?.(navName);
                                    }}>
                                        <Eye className="w-4 h-4 mr-1" /> Ver Detalles
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{selectedName ? selectedName : "Estadísticas Generales"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedGeoKey ? (
                            <div className="space-y-4">
                                <div className="text-center p-4 bg-teal-50 rounded-lg">
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
                                <Button
                                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700"
                                    onClick={() => setSelectedGeoKey(null)}
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
                                        .map(([geoKey, value]) => ({
                                            name: getDisplayTitle(geoKey, level),
                                            value: value
                                        }))
                                        .filter(item => item.name !== null)
                                        .sort((a, b) => b.value - a.value)
                                        .slice(0, 3)
                                        .map(({ name, value }, index) => (
                                            <div key={name as string} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm border">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-600"}`} />
                                                    <span className="text-sm font-medium">{name}</span>
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
