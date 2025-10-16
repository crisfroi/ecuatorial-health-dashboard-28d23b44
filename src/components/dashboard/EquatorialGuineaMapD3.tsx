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
import * as LucideIcons from "lucide-react";
const MaleIcon = (LucideIcons as any).Male || (LucideIcons as any).GenderMale || (LucideIcons as any).Man || (LucideIcons as any).User || null;
const FemaleIcon = (LucideIcons as any).Female || (LucideIcons as any).GenderFemale || (LucideIcons as any).Woman || (LucideIcons as any).User || null;
const { MapPin, Users, Building, Eye, Map: MapIcon } = LucideIcons;
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

const EquatorialGuineaMapLeaflet: React.FC<{ onNavigateToProvince?: (name: string) => void; onSelectRegion?: (name: string, level: Level) => void; onNavigateToTab?: (tab: string, filters?: any) => void; }> = ({ onNavigateToProvince, onSelectRegion, onNavigateToTab }) => {
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

    // Preload centers per region to ensure accurate center counts
    const { data: centersByRegion = { provinceCounts: new Map<string, number>(), districtCounts: new Map<string, number>() } } = useQuery({
        queryKey: ['centersByRegion'],
        queryFn: async () => {
            const { data: centers } = await supabase.from('centros_salud').select('id, provincia, distrito_sanitario');
            const provinceCounts = new Map<string, number>();
            const districtCounts = new Map<string, number>();
            (centers || []).forEach((c: any) => {
                const provKey = normalizeName(c.provincia || '');
                const distKey = normalizeName(c.distrito_sanitario || '');
                provinceCounts.set(provKey, (provinceCounts.get(provKey) || 0) + 1);
                districtCounts.set(distKey, (districtCounts.get(distKey) || 0) + 1);
            });
            return { provinceCounts, districtCounts };
        },
        staleTime: 5 * 60_000,
        refetchOnWindowFocus: false,
    });

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

    // Deterministic categorical color for each region (consistent across renders)
    const regionColor = useCallback((key: string) => {
        const palette = ["#e11d48", "#fb923c", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#7c3aed", "#ef4444", "#f97316", "#a3e635"];
        let h = 0;
        for (let i = 0; i < key.length; i++) {
            h = (h * 31 + key.charCodeAt(i)) >>> 0;
        }
        return palette[h % palette.length];
    }, []);

    const style = useCallback((feature: any) => {
        const raw = feature.properties?.shapeName || "";
        const key = normalizeName(raw);
        const value = getCanonicalValue(key, level);
        const isSelected = key === selectedGeoKey;
        return {
            fillColor: value > 0 ? colorScale(value) : regionColor(key),
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
        // Prefer centersByRegion.districtCounts if available
        const districtCountFromCentersByRegion = centersByRegion?.districtCounts?.get(key);
        if (typeof districtCountFromCentersByRegion === 'number') return districtCountFromCentersByRegion;
        const lookup = DB_LOOKUP_MAP.get(key);
        if (lookup) {
            const canonicalDbKey = normalizeName(lookup.dbName);
            return distritoCenters.get(canonicalDbKey) ?? centersByRegion?.districtCounts?.get(canonicalDbKey) ?? 0;
        }
        return distritoCenters.get(key) ?? centersByRegion?.districtCounts?.get(key) ?? 0;
    };

    const activeName = getDisplayTitle(hoveredGeoKey, level);
    const selectedName = getDisplayTitle(selectedGeoKey, level);

    // Fetch additional per-region stats when hovering (cached by react-query)
    const hoveredFilters = useMemo(() => {
        if (!activeName) return null;
        if (level === 'provincias') return { provincia: activeName } as any;
        return { distrito_sanitario: activeName } as any;
    }, [activeName, level]);

    const { data: titulacionHover = [] } = useTitulacionCategoryStats(hoveredFilters || undefined as any);
    const { data: ageRangesHover = [] } = useWorkAgeStats(hoveredFilters || undefined as any);

    // Province-level aggregated stats lookup
    const { data: provinceStatsList = [] } = useProvinceStats();
    const hoveredProvinceStats = useMemo(() => {
        if (level !== 'provincias' || !activeName) return null;
        return (provinceStatsList || []).find((p: any) => normalizeName(p.provincia) === normalizeName(activeName)) || null;
    }, [provinceStatsList, activeName, level]);

    const { data: genderAndPublic = null } = useQuery({
        queryKey: ['geoGenderPublic', level, activeName],
        queryFn: async () => {
            if (!activeName) return null;
            const field = level === 'provincias' ? 'provincia' : 'distrito_sanitario';

            const buildCandidates = (n: string) => {
                const arr: string[] = [];
                if (!n) return arr;
                arr.push(n);
                const stripped = n.replace(/^Distrito Sanitario de\s*/i, "").replace(/Province$/i, "").trim();
                if (stripped && !arr.includes(stripped)) arr.push(stripped);
                const cleaned = getCleanGeoName(n || '');
                if (cleaned && !arr.includes(cleaned)) arr.push(cleaned);
                return arr;
            };

            const computeCountsFromRows = (rows: any[] | null) => {
                if (!rows || rows.length === 0) return { male: 0, female: 0, funcionarios: 0 };
                let male = 0;
                let female = 0;
                let funcionarios = 0;
                for (const r of rows) {
                    const g = (r.genero || '').toString().toLowerCase();
                    if (g === 'masculino' || g === 'm' || g === 'male') male++;
                    if (g === 'femenino' || g === 'f' || g === 'female') female++;
                    if (r.funcion_publica === true || r.funcion_publica === 't' || r.funcion_publica === 1) funcionarios++;
                }
                return { male, female, funcionarios };
            };

            const candidates = buildCandidates(activeName);
            // Try exact equals for candidates first
            for (const c of candidates) {
                const { data: rows, error } = await supabase
                    .from('profesionales_sanitarios')
                    .select('genero, funcion_publica')
                    .eq('estado_solicitud', 'Aprobado')
                    .eq(field, c);
                if (!error && rows && rows.length > 0) {
                    return computeCountsFromRows(rows);
                }
            }

            // Fallback: ilike on cleaned name
            const cleaned = getCleanGeoName(activeName);
            const { data: rows2 } = await supabase
                .from('profesionales_sanitarios')
                .select('genero, funcion_publica')
                .eq('estado_solicitud', 'Aprobado')
                .ilike(field, `%${cleaned}%`);

            return computeCountsFromRows(rows2 || []);
        },
        enabled: !!activeName,
    });

    // Selected region filters and data
    const selectedFilters = useMemo(() => {
        if (!selectedName) return null;
        if (level === 'provincias') return { provincia: selectedName } as any;
        return { distrito_sanitario: selectedName } as any;
    }, [selectedName, level]);

    const { data: titulacionSelected = [] } = useTitulacionCategoryStats(selectedFilters || undefined as any);
    const { data: ageRangesSelected = [] } = useWorkAgeStats(selectedFilters || undefined as any);

    const { data: genderAndPublicSelected = null } = useQuery({
        queryKey: ['geoGenderPublic', level, selectedName, 'selected'],
        queryFn: async () => {
            if (!selectedName) return null;
            const field = level === 'provincias' ? 'provincia' : 'distrito_sanitario';

            const buildCandidates = (n: string) => {
                const arr: string[] = [];
                if (!n) return arr;
                arr.push(n);
                const stripped = n.replace(/^Distrito Sanitario de\s*/i, "").replace(/Province$/i, "").trim();
                if (stripped && !arr.includes(stripped)) arr.push(stripped);
                const cleaned = getCleanGeoName(n || '');
                if (cleaned && !arr.includes(cleaned)) arr.push(cleaned);
                return arr;
            };

            const computeCountsFromRows = (rows: any[] | null) => {
                if (!rows || rows.length === 0) return { male: 0, female: 0, funcionarios: 0 };
                let male = 0;
                let female = 0;
                let funcionarios = 0;
                for (const r of rows) {
                    const g = (r.genero || '').toString().toLowerCase();
                    if (g === 'masculino' || g === 'm' || g === 'male') male++;
                    if (g === 'femenino' || g === 'f' || g === 'female') female++;
                    if (r.funcion_publica === true || r.funcion_publica === 't' || r.funcion_publica === 1) funcionarios++;
                }
                return { male, female, funcionarios };
            };

            const candidates = buildCandidates(selectedName);
            for (const c of candidates) {
                const { data: rows, error } = await supabase
                    .from('profesionales_sanitarios')
                    .select('genero, funcion_publica')
                    .eq('estado_solicitud', 'Aprobado')
                    .eq(field, c);
                if (!error && rows && rows.length > 0) {
                    return computeCountsFromRows(rows);
                }
            }

            const cleaned = getCleanGeoName(selectedName);
            const { data: rows2 } = await supabase
                .from('profesionales_sanitarios')
                .select('genero, funcion_publica')
                .eq('estado_solicitud', 'Aprobado')
                .ilike(field, `%${cleaned}%`);

            return computeCountsFromRows(rows2 || []);
        },
        enabled: !!selectedName,
    });

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
                                <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-xl border z-10 min-w-64 pointer-events-none">
                                    <h4 className="font-semibold text-lg mb-2">{activeName}</h4>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 flex items-center gap-1"><Users className="w-3 h-3" /> Prof. (aprobados):</span>
                                            <span className="font-bold text-teal-700">{currentValue(hoveredGeoKey)}</span>
                                        </div>

                                        <div className="flex justify-between items-center border-t pt-1 mt-1">
                                            <span className="text-gray-600 flex items-center gap-1"><MapPin className="w-3 h-3" /> Área predominante:</span>
                                            <span className="font-medium">{level === 'provincias' ? (hoveredProvinceStats?.areas_mas_comunes?.[0] || '—') : '—'}</span>
                                        </div>

                                        {level === "distritos" ? (
                                            <div className="flex justify-between items-center border-t pt-1 mt-1">
                                                <span className="text-gray-600 flex items-center gap-1"><Building className="w-3 h-3" /> Centros:</span>
                                                <span className="font-medium">{currentCenters(hoveredGeoKey)}</span>
                                            </div>
                                        ) : null}

                                        <div className="flex justify-between items-center border-t pt-1 mt-1">
                                            <span className="text-gray-600 flex items-center gap-1">Género:</span>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">{MaleIcon ? <MaleIcon className="w-4 h-4 text-blue-600" /> : null} <span className="font-medium">{genderAndPublic ? genderAndPublic.male : '—'}</span></div>
                                                <div className="flex items-center gap-1">{FemaleIcon ? <FemaleIcon className="w-4 h-4 text-pink-600" /> : null} <span className="font-medium">{genderAndPublic ? genderAndPublic.female : '—'}</span></div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center border-t pt-1 mt-1">
                                            <span className="text-gray-600 flex items-center gap-1">Funcionarios públicos:</span>
                                            <span className="font-medium">{genderAndPublic ? genderAndPublic.funcionarios : '—'}</span>
                                        </div>

                                        <div className="flex justify-between items-center border-t pt-1 mt-1">
                                            <span className="text-gray-600 flex items-center gap-1">Titulación predominante:</span>
                                            <span className="font-medium">{titulacionHover && titulacionHover.length ? `${titulacionHover[0].categoria_titulacion} (${titulacionHover[0].total || 0})` : '—'}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 pointer-events-auto" onClick={() => {
                                            const navName = getDisplayTitle(hoveredGeoKey, level);
                                            if (navName) onNavigateToProvince?.(navName);
                                        }}>
                                            <Eye className="w-4 h-4 mr-1" /> Ver Detalles
                                        </Button>
                                    </div>
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
                                <div role="button" tabIndex={0} onClick={() => onNavigateToTab?.('professionals', { provincia: selectedName, estado_solicitud: 'Aprobado' })} className="text-center p-4 bg-teal-50 rounded-lg cursor-pointer hover:shadow">
                                    <div className="text-3xl font-bold text-teal-600">{currentValue(selectedGeoKey)}</div>
                                    <div className="text-sm text-gray-600">Profesionales (aprobados)</div>
                                </div>
                                {level === "distritos" ? (
                                    <div role="button" tabIndex={0} onClick={() => onNavigateToTab?.('health-centers', { distrito_sanitario: selectedName })} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border cursor-pointer hover:shadow">
                                        <div className="flex items-center gap-2">
                                            <Building className="w-5 h-5 text-gray-600" />
                                            <span className="text-base font-medium">Centros</span>
                                        </div>
                                        <Badge variant="default" className="bg-teal-500 hover:bg-teal-500 text-white text-md p-2">{currentCenters(selectedGeoKey)}</Badge>
                                    </div>
                                ) : (
                                    <div role="button" tabIndex={0} onClick={() => onNavigateToTab?.('health-centers', { provincia: selectedName })} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border cursor-pointer hover:shadow">
                                        <div className="flex items-center gap-2">
                                            <Building className="w-5 h-5 text-gray-600" />
                                            <span className="text-base font-medium">Centros</span>
                                        </div>
                                        <Badge variant="default" className="bg-teal-500 hover:bg-teal-500 text-white text-md p-2">{centersByRegion?.provinceCounts?.get(normalizeName(selectedName || '')) ?? hoveredProvinceStats?.total_centros ?? 0}</Badge>
                                    </div>
                                )}

                                <div role="button" tabIndex={0} onClick={() => onNavigateToTab?.('professionals', { provincia: selectedName, area_profesional: hoveredProvinceStats?.areas_mas_comunes?.[0] })} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border cursor-pointer hover:shadow">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-gray-600" />
                                        <span className="text-base font-medium">Área predominante</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{hoveredProvinceStats?.areas_mas_comunes?.[0] || '—'}</div>
                                        <div className="text-xs text-gray-500">Top area</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2 bg-white rounded border text-center cursor-pointer hover:shadow" onClick={() => onNavigateToTab?.('professionals', { provincia: selectedName, genero: 'Masculino' })}>
                                        <div className="text-sm text-gray-600 flex items-center justify-center gap-2">{MaleIcon ? <MaleIcon className="w-4 h-4" /> : null}<span> Hombres</span></div>
                                        <div className="font-bold">{genderAndPublicSelected?.male ?? '—'}</div>
                                    </div>
                                    <div className="p-2 bg-white rounded border text-center cursor-pointer hover:shadow" onClick={() => onNavigateToTab?.('professionals', { provincia: selectedName, genero: 'Femenino' })}>
                                        <div className="text-sm text-gray-600 flex items-center justify-center gap-2">{FemaleIcon ? <FemaleIcon className="w-4 h-4" /> : null}<span> Mujeres</span></div>
                                        <div className="font-bold">{genderAndPublicSelected?.female ?? '—'}</div>
                                    </div>
                                </div>

                                <div className="p-2 bg-white rounded border text-center cursor-pointer hover:shadow" onClick={() => onNavigateToTab?.('professionals', { provincia: selectedName, funcion_publica: true })}>
                                    <div className="text-sm text-gray-600">Funcionarios públicos</div>
                                    <div className="font-bold">{genderAndPublicSelected?.funcionarios ?? '—'}</div>
                                </div>

                                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => {
                                    // Open analytics detail view via onSelectRegion if available, otherwise fall back
                                    if (onSelectRegion) onSelectRegion(selectedName || '', level);
                                    else onNavigateToProvince?.(selectedName || '');
                                }}>
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
