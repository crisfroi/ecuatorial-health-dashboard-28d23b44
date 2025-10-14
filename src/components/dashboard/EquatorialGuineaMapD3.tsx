import * as d3 from "d3";
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
import { MapPin, Users, Building, Eye, RefreshCw, Map as MapIcon } from "lucide-react";
// Supongo que estos hooks están definidos en el entorno
// import { useEstadisticasAvanzadas } from "@/hooks/useEstadisticasAvanzadas";
// import { useDistrictStats } from "@/hooks/useAdvancedAnalytics";

// Simulación de los hooks de datos para que el componente sea ejecutable
const useEstadisticasAvanzadas = () => ({ data: { porProvincia: { "Bioko Norte Province": 150, "Litoral Province": 80, "Annobon Province": 5 } } });
const useDistrictStats = () => ({
  data: [
    { distrito_sanitario: "Malabo", total_profesionales: 90, total_centros: 12 },
    { distrito_sanitario: "Bata", total_profesionales: 60, total_centros: 8 },
    { distrito_sanitario: "Ebebiyin", total_profesionales: 25, total_centros: 4 },
  ],
});
// Fin de la simulación

// Import GeoJSONs (ADM1 = provincias, ADM2 = distritos)
// Estos imports deben funcionar correctamente si la ruta es correcta en tu entorno.
import ADM1_RAW from "@/data/geoBoundaries-GNQ-ADM1.geojson?raw";
import ADM2_RAW from "@/data/geoBoundaries-GNQ-ADM2.geojson?raw";

// --- UTILIDADES ---

/**
 * Hook para obtener el tamaño dinámico del contenedor usando ResizeObserver.
 * Necesario para que D3 calcule correctamente la proyección en contenedores responsivos.
 */
const useContainerSize = (ref: React.RefObject<HTMLElement>) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      // Establece un tamaño máximo de 600px de alto para evitar mapas demasiado grandes
      const width = entry.contentRect.width;
      const height = Math.min(width * 0.75, 600); // Proporción 4:3 con máx 600px
      setSize({ width, height });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
};

// --- TIPOS ---

interface EquatorialGuineaMapD3Props {
  onNavigateToProvince?: (name: string) => void;
}

type Level = "provincias" | "distritos";

type FeatureCollection = {
  type: "FeatureCollection";
  crs: any;
  features: Array<{
    type: "Feature";
    properties: { shapeName?: string; shapeISO?: string; shapeID?: string; shapeGroup?: string; shapeType?: string } & Record<string, any>;
    geometry: any;
  }>;
};

// --- LÓGICA DE COMPONENTE ---

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
  // Limpia el nombre, asegurando mayúscula al inicio
  const cleanName = shapeName.replace(/\s+Province$/i, "").trim();
  return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
}

const EquatorialGuineaMapD3: React.FC<EquatorialGuineaMapD3Props> = ({ onNavigateToProvince }) => {
  // Referencia al contenedor para medir su tamaño real
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(mapContainerRef); // Dimensiones dinámicas
  const svgRef = useRef<SVGSVGElement>(null);

  const [level, setLevel] = useState<Level>("provincias");
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hooks data (usando simulación o los hooks reales si están disponibles)
  const { data: estadisticas } = useEstadisticasAvanzadas();
  const { data: districtStats = [] } = useDistrictStats();

  // GeoJSON state loaded via URL
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  useEffect(() => {
    let cancelled = false;
    try {
      setError(null);
      const raw = level === "provincias" ? ADM1_RAW : ADM2_RAW;
      const json = JSON.parse(raw) as FeatureCollection;
      if (!cancelled) setGeoData(json);
    } catch (e: any) {
      if (!cancelled) setError(`Error leyendo GeoJSON (${level}): ${e?.message || e}`);
    }
    return () => {
      cancelled = true;
    };
  }, [level]);

  // Build value maps for choropleth
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
      vals.set(normalizeName(String(d.distrito_sanitario)), d.total_profesionales || 0);
    }
    return vals;
  }, [districtStats]);

  const distritoCenters = useMemo(() => {
    const vals = new Map<string, number>();
    for (const d of districtStats) {
      if (!d || !d.distrito_sanitario) continue;
      vals.set(normalizeName(String(d.distrito_sanitario)), d.total_centros || 0);
    }
    return vals;
  }, [districtStats]);

  // Compute numeric domain for color scale
  const { minValue, maxValue } = useMemo(() => {
    const values: number[] = [];
    if (!geoData?.features) return { minValue: 0, maxValue: 0 };
    for (const f of geoData.features) {
      const raw = f.properties?.shapeName || "";
      const key = normalizeName(getShapeDisplayName(raw));
      const v = level === "provincias" ? provinciaValues.get(key) ?? 0 : distritoValues.get(key) ?? 0;
      values.push(v);
    }
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;
    return { minValue: min, maxValue: max };
  }, [geoData, provinciaValues, distritoValues, level]);

  // Draw map
  useEffect(() => {
    // 🚨 FIX: Salir si las dimensiones aún son 0 (o si los datos no están)
    if (!geoData || !svgRef.current || width === 0 || height === 0) return;

    try {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      // Usar dimensiones dinámicas
      const margin = { top: 20, right: 20, bottom: 20, left: 20 };

      // Se reserva el espacio para la leyenda en la parte inferior del contenedor
      const legendSpace = 60;
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom - legendSpace;

      // Centroids son usados para separar las islas (latitud < 0) del continente
      const features = geoData.features;
      const islands = features.filter((f: any) => d3.geoCentroid(f)[1] < 0); // Annobón
      const mainland = features.filter((f: any) => d3.geoCentroid(f)[1] >= 0); // Río Muni + Bioko

      // Espacio reservado para el inset map (si existen islas)
      const hasIslands = islands.length > 0;
      const insetW = hasIslands ? Math.min(160, innerW / 3) : 0;
      const insetH = hasIslands ? Math.min(160, innerH / 3) : 0;

      // Proyección principal (solo en la masa continental y Bioko)
      const projection = d3
        .geoMercator()
        // Ajusta el fitSize en el espacio disponible, restando el espacio del inset
        .fitSize([innerW - insetW - (hasIslands ? 16 : 0), innerH], { type: "FeatureCollection", features: mainland } as any);
      const pathMain = d3.geoPath().projection(projection);

      // 1. Configuración del SVG y Grupo Principal
      const mapGroup = svg
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const domainMin = minValue;
      const domainMax = Math.max(maxValue, 1);
      const colorScale = d3.scaleSequential().domain([domainMin, domainMax]).interpolator(d3.interpolateYlGnBu);

      // 2. Fondo del mapa para contraste
      mapGroup
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", innerW)
        .attr("height", innerH)
        .attr("fill", "#e0f2f7"); // Azul claro para el océano

      // 3. Dibuja el continente (incluyendo Bioko)
      const mainRegions = mapGroup.selectAll(".region-main").data(mainland).enter().append("g").attr("class", "region-main");

      mainRegions
        .append("path")
        .attr("d", pathMain as any)
        .attr("fill", (d: any) => {
          const raw = d.properties?.shapeName || "";
          const key = normalizeName(getShapeDisplayName(raw));
          const value = level === "provincias" ? provinciaValues.get(key) ?? 0 : distritoValues.get(key) ?? 0;
          return value > 0 ? colorScale(value) : "#f3f4f6"; // Gris muy claro si no hay datos
        })
        .attr("stroke", "#134e4a")
        .attr("stroke-width", 1)
        .style("cursor", "pointer")
        .on("mouseover", function (event: any, d: any) {
          const label = getShapeDisplayName(d.properties?.shapeName);
          setHoveredName(label);
          d3.select(this).attr("stroke-width", 2.5).attr("stroke", "#064e3b");
        })
        .on("mouseout", function () {
          setHoveredName(null);
          d3.select(this).attr("stroke-width", 1).attr("stroke", "#134e4a");
        })
        .on("click", function (event: any, d: any) {
          const label = getShapeDisplayName(d.properties?.shapeName);
          setSelectedName(label);
          onNavigateToProvince?.(label);
        });

      // Etiquetas (centros)
      mainRegions
        .append("text")
        .attr("x", (d: any) => (pathMain.centroid(d) as [number, number])[0])
        .attr("y", (d: any) => (pathMain.centroid(d) as [number, number])[1])
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "10px")
        .style("font-weight", "700")
        .style("fill", "#000000")
        .style("text-shadow", "0 0 2px white") // Para asegurar legibilidad
        .style("pointer-events", "none")
        .text((d: any) => getShapeDisplayName(d.properties?.shapeName));


      // 4. Dibuja las islas como un mapa inset (Annobón)
      if (hasIslands) {
        // Coordenadas del inset: esquina inferior derecha, ajustado por el espacio de la leyenda
        const insetX = innerW - insetW;
        const insetY = innerH - insetH;
        const insetGroup = mapGroup.append("g").attr("transform", `translate(${insetX - 8}, ${insetY - 8})`);

        // Inset background
        insetGroup
          .append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", insetW)
          .attr("height", insetH)
          .attr("rx", 8)
          .attr("fill", "#ffffff")
          .attr("stroke", "#94a3b8")
          .attr("stroke-width", 1);

        const projInset = d3.geoMercator().fitSize([insetW - 16, insetH - 24], { type: "FeatureCollection", features: islands } as any);
        const pathInset = d3.geoPath().projection(projInset);

        const islandRegions = insetGroup
          .append("g")
          .attr("transform", `translate(8, 8)`) // padding
          .selectAll(".region-inset")
          .data(islands)
          .enter()
          .append("g")
          .attr("class", "region-inset");

        islandRegions
          .append("path")
          .attr("d", pathInset as any)
          .attr("fill", (d: any) => {
            const raw = d.properties?.shapeName || "";
            const key = normalizeName(getShapeDisplayName(raw));
            const value = level === "provincias" ? provinciaValues.get(key) ?? 0 : distritoValues.get(key) ?? 0;
            return value > 0 ? colorScale(value) : "#f3f4f6";
          })
          .attr("stroke", "#134e4a")
          .attr("stroke-width", 1.2)
          .style("cursor", "pointer")
          .on("mouseover", function (event: any, d: any) {
            const label = getShapeDisplayName(d.properties?.shapeName);
            setHoveredName(label);
            d3.select(this).attr("stroke-width", 1.8).attr("stroke", "#064e3b");
          })
          .on("mouseout", function () {
            setHoveredName(null);
            d3.select(this).attr("stroke-width", 1.2).attr("stroke", "#134e4a");
          })
          .on("click", function (event: any, d: any) {
            const label = getShapeDisplayName(d.properties?.shapeName);
            setSelectedName(label);
            onNavigateToProvince?.(label);
          });

        insetGroup
          .append("text")
          .attr("x", insetW / 2)
          .attr("y", insetH + 10)
          .attr("text-anchor", "middle")
          .style("font-size", "10px")
          .style("fill", "#334155")
          .text("Annobón (ampliado)");
      }

      // 5. Leyenda (siempre se dibuja abajo, aprovechando el espacio 'legendSpace')
      const legendW = innerW > 400 ? 300 : innerW * 0.7; // Responsividad de la leyenda
      const legendH = 16;
      const legendGroup = svg.append("g").attr("transform", `translate(${margin.left + (innerW - legendW) / 2}, ${height - legendSpace + 16})`); // Centrado en la parte inferior

      const defs = svg.append("defs");
      const gradient = defs.append("linearGradient").attr("id", "legend-gradient").attr("x1", "0%").attr("x2", "100%").attr("y1", "0%").attr("y2", "0%");
      gradient
        .selectAll("stop")
        .data(d3.range(0, 1.1, 0.1))
        .enter()
        .append("stop")
        .attr("offset", (d) => `${d * 100}%`)
        .attr("stop-color", (d) => d3.interpolateYlGnBu(d));

      legendGroup.append("rect").attr("width", legendW).attr("height", legendH).style("fill", "url(#legend-gradient)").attr("stroke", "#374151").attr("stroke-width", 1);

      legendGroup.append("text").attr("x", 0).attr("y", legendH + 14).style("font-size", "12px").style("fill", "#4b5563").text(String(domainMin));
      legendGroup.append("text").attr("x", legendW).attr("y", legendH + 14).attr("text-anchor", "end").style("font-size", "12px").style("fill", "#4b5563").text(String(domainMax));
      legendGroup
        .append("text")
        .attr("x", legendW / 2)
        .attr("y", -6)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#1f2937")
        .text(level === "provincias" ? "Aprobados por Provincia" : "Aprobados por Distrito Sanitario");

    } catch (e: any) {
      // Ignorar errores comunes de ResizeObserver que no afectan el dibujo
      if (
        typeof e?.message === "string" &&
        (e.message.includes("ResizeObserver loop completed with undelivered notifications") ||
          e.message.includes("ResizeObserver loop limit exceeded"))
      ) {
        return;
      }
      setError(`Error renderizando el mapa: ${e?.message || e}`);
    }
  }, [geoData, provinciaValues, distritoValues, minValue, maxValue, level, onNavigateToProvince, width, height]); // 🚨 FIX: Añadir width y height como dependencias

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Recargar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!geoData || width === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3 text-gray-600 h-[300px]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
            <span>Cargando mapa...</span>
          </div>
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
            {/* 🚨 FIX: Usar el contenedor para obtener las dimensiones */}
            <div ref={mapContainerRef} className="relative bg-gray-50 rounded-lg p-4 flex justify-center items-center overflow-hidden" style={{ height: `${height}px` }}>
              <svg ref={svgRef} width={width} height={height} className="w-full" />

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

export default EquatorialGuineaMapD3;
