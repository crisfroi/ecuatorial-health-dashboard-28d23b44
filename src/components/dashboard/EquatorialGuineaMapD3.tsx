import * as d3 from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { MapPin, Users, Building, Eye, RefreshCw, Map } from "lucide-react";
import { useEstadisticasAvanzadas } from "@/hooks/useEstadisticasAvanzadas";
import { useDistrictStats } from "@/hooks/useAdvancedAnalytics";
// Import GeoJSONs (ADM1 = provincias, ADM2 = distritos)
// Large files, but needed for accurate choropleth
import ADM1_URL from "@/data/geoBoundaries-GNQ-ADM1.geojson?url";
import ADM2_URL from "@/data/geoBoundaries-GNQ-ADM2.geojson?url";

interface EquatorialGuineaMapD3Props {
  onNavigateToProvince?: (name: string) => void;
}

type Level = "provincias" | "distritos";

type FeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: { shapeName?: string; shapeISO?: string; shapeID?: string; shapeGroup?: string; shapeType?: string } & Record<string, any>;
    geometry: any;
  }>;
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
  return shapeName.replace(/\s+Province$/i, "");
}

const EquatorialGuineaMapD3: React.FC<EquatorialGuineaMapD3Props> = ({ onNavigateToProvince }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [level, setLevel] = useState<Level>("provincias");
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hooks data
  const { data: estadisticas } = useEstadisticasAvanzadas();
  const { data: districtStats = [] } = useDistrictStats();

  // GeoJSON state loaded via URL
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  useEffect(() => {
    const url = level === "provincias" ? ADM1_URL : ADM2_URL;
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as FeatureCollection;
        if (!cancelled) setGeoData(json);
      } catch (e: any) {
        if (!cancelled) setError(`Error cargando GeoJSON (${level}): ${e?.message || e}`);
      }
    })();
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
    if (!geoData || !svgRef.current) return;

    try {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const width = 800;
      const height = 600;
      const margin = { top: 20, right: 20, bottom: 20, left: 20 };

      const projection = d3.geoMercator().fitSize([width - margin.left - margin.right, height - margin.top - margin.bottom], geoData as any);
      const pathGenerator = d3.geoPath().projection(projection);

      const mapGroup = svg
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const domainMin = minValue;
      const domainMax = Math.max(maxValue, 1);
      const colorScale = d3.scaleSequential().domain([domainMin, domainMax]).interpolator(d3.interpolateYlGnBu);

      const regions = mapGroup.selectAll(".region").data(geoData.features).enter().append("g").attr("class", "region");

      regions
        .append("path")
        .attr("d", pathGenerator as any)
        .attr("fill", (d: any) => {
          const raw = d.properties?.shapeName || "";
          const key = normalizeName(getShapeDisplayName(raw));
          const value = level === "provincias" ? provinciaValues.get(key) ?? 0 : distritoValues.get(key) ?? 0;
          return value > 0 ? colorScale(value) : "#f3f4f6";
        })
        .attr("stroke", "#374151")
        .attr("stroke-width", 1)
        .style("cursor", "pointer")
        .on("mouseover", function (_event: any, d: any) {
          const label = getShapeDisplayName(d.properties?.shapeName);
          setHoveredName(label);
          d3.select(this).attr("stroke-width", 2).attr("stroke", "#1f2937");
        })
        .on("mouseout", function () {
          setHoveredName(null);
          d3.select(this).attr("stroke-width", 1).attr("stroke", "#374151");
        })
        .on("click", function (_event: any, d: any) {
          const label = getShapeDisplayName(d.properties?.shapeName);
          setSelectedName(label);
          onNavigateToProvince?.(label);
        });

      regions
        .append("text")
        .attr("x", (d: any) => (pathGenerator.centroid(d) as [number, number])[0])
        .attr("y", (d: any) => (pathGenerator.centroid(d) as [number, number])[1])
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .style("fill", "#111827")
        .style("pointer-events", "none")
        .text((d: any) => getShapeDisplayName(d.properties?.shapeName));

      // Legend
      const legendWidth = 300;
      const legendHeight = 16;
      const legendGroup = svg.append("g").attr("transform", `translate(${width - legendWidth - 20}, ${height - 60})`);

      const defs = svg.append("defs");
      const gradient = defs.append("linearGradient").attr("id", "legend-gradient").attr("x1", "0%").attr("x2", "100%").attr("y1", "0%").attr("y2", "0%");
      gradient
        .selectAll("stop")
        .data(d3.range(0, 1.1, 0.1))
        .enter()
        .append("stop")
        .attr("offset", (d) => `${d * 100}%`)
        .attr("stop-color", (d) => d3.interpolateYlGnBu(d));

      legendGroup.append("rect").attr("width", legendWidth).attr("height", legendHeight).style("fill", "url(#legend-gradient)").attr("stroke", "#374151").attr("stroke-width", 1);

      legendGroup.append("text").attr("x", 0).attr("y", legendHeight + 14).style("font-size", "12px").style("fill", "#4b5563").text(String(domainMin));
      legendGroup.append("text").attr("x", legendWidth).attr("y", legendHeight + 14).attr("text-anchor", "end").style("font-size", "12px").style("fill", "#4b5563").text(String(domainMax));
      legendGroup
        .append("text")
        .attr("x", legendWidth / 2)
        .attr("y", -6)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#1f2937")
        .text(level === "provincias" ? "Aprobados por Provincia" : "Aprobados por Distrito Sanitario");
    } catch (e: any) {
      if (
        typeof e?.message === "string" &&
        (e.message.includes("ResizeObserver loop completed with undelivered notifications") ||
          e.message.includes("ResizeObserver loop limit exceeded"))
      ) {
        return;
      }
      setError(`Error renderizando el mapa: ${e?.message || e}`);
    }
  }, [geoData, provinciaValues, distritoValues, minValue, maxValue, level, onNavigateToProvince]);

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
                  <Map className="w-4 h-4" /> Provincias (ADM1)
                </div>
              </SelectItem>
              <SelectItem value="distritos">
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4" /> Distritos Sanitarios (ADM2)
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
            <div className="relative bg-gray-50 rounded-lg p-4">
              <svg ref={svgRef} className="w-full" style={{ maxHeight: "600px" }} />

              {hoveredName && (
                <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg border z-10 min-w-64">
                  <h4 className="font-semibold text-lg mb-2">{hoveredName}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Profesionales (aprobados):</span>
                      <span className="font-medium">{currentValue(hoveredName)}</span>
                    </div>
                    {level === "distritos" ? (
                      <div className="flex justify-between">
                        <span>Centros:</span>
                        <span className="font-medium">{currentCenters(hoveredName)}</span>
                      </div>
                    ) : null}
                  </div>
                  <Button size="sm" className="w-full mt-3" onClick={() => onNavigateToProvince?.(hoveredName)}>
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
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">Centros</span>
                    </div>
                    <Badge variant="outline">{currentCenters(selectedName)}</Badge>
                  </div>
                ) : null}
                <Button className="w-full" onClick={() => onNavigateToProvince?.(selectedName)}>
                  <Eye className="w-4 h-4 mr-2" /> Ver detalles de {selectedName}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Haz clic en una región para ver detalles</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Top 3 {level === "provincias" ? "Provincias" : "Distritos"}</h4>
                  {Array.from((level === "provincias" ? provinciaValues : distritoValues).entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([name, value], index) => (
                      <div key={name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-600"}`} />
                          <span className="text-sm font-medium">{name}</span>
                        </div>
                        <Badge variant="outline">{value}</Badge>
                      </div>
                    ))}
                </div>
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-2 text-xs text-center">
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="font-bold text-blue-600">
                        {Array.from((level === "provincias" ? provinciaValues : distritoValues).values()).reduce((s, v) => s + v, 0)}
                      </div>
                      <div className="text-gray-600">Total Profesionales</div>
                    </div>
                    {level === "distritos" ? (
                      <div className="p-2 bg-green-50 rounded">
                        <div className="font-bold text-green-600">
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
