import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
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
import {
  MapPin,
  Users,
  Building,
  Stethoscope,
  GraduationCap,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useEstadisticasAvanzadas } from "@/hooks/useEstadisticasAvanzadas";

interface ProvinceData {
  id: string;
  name: string;
  professionals: number;
  centers: number;
  doctors: number;
  nurses: number;
  pharmacists: number;
  publicSector: number;
  privateSector: number;
  approved: number;
  pending: number;
}

interface EquatorialGuineaMapD3Props {
  onNavigateToProvince?: (provinceName: string) => void;
}

const EquatorialGuineaMapD3: React.FC<EquatorialGuineaMapD3Props> = ({
  onNavigateToProvince,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>("professionals");
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: estadisticas } = useEstadisticasAvanzadas();

  // Mock data for provinces
  const provinceData: Record<string, ProvinceData> = useMemo(() => {
    const mockData: Record<string, ProvinceData> = {
      "Bioko Norte": {
        id: "bioko-norte",
        name: "Bioko Norte",
        professionals: estadisticas?.porProvincia?.["Malabo"] || 245,
        centers: 12,
        doctors: 78,
        nurses: 125,
        pharmacists: 42,
        publicSector: 180,
        privateSector: 65,
        approved: 220,
        pending: 25,
      },
      "Bioko Sur": {
        id: "bioko-sur",
        name: "Bioko Sur",
        professionals: 89,
        centers: 6,
        doctors: 28,
        nurses: 45,
        pharmacists: 16,
        publicSector: 70,
        privateSector: 19,
        approved: 78,
        pending: 11,
      },
      Annobón: {
        id: "annobon",
        name: "Annobón",
        professionals: 15,
        centers: 2,
        doctors: 4,
        nurses: 8,
        pharmacists: 3,
        publicSector: 12,
        privateSector: 3,
        approved: 14,
        pending: 1,
      },
      Litoral: {
        id: "litoral",
        name: "Litoral",
        professionals: estadisticas?.porProvincia?.["Bata"] || 198,
        centers: 15,
        doctors: 62,
        nurses: 98,
        pharmacists: 38,
        publicSector: 150,
        privateSector: 48,
        approved: 185,
        pending: 13,
      },
      "Centro Sur": {
        id: "centro-sur",
        name: "Centro Sur",
        professionals: estadisticas?.porProvincia?.["Evinayong"] || 78,
        centers: 8,
        doctors: 25,
        nurses: 40,
        pharmacists: 13,
        publicSector: 62,
        privateSector: 16,
        approved: 72,
        pending: 6,
      },
      "Kié-Ntem": {
        id: "kie-ntem",
        name: "Kié-Ntem",
        professionals: estadisticas?.porProvincia?.["Ebebiyín"] || 87,
        centers: 10,
        doctors: 28,
        nurses: 45,
        pharmacists: 14,
        publicSector: 70,
        privateSector: 17,
        approved: 81,
        pending: 6,
      },
      "Wele-Nzas": {
        id: "wele-nzas",
        name: "Wele-Nzas",
        professionals: estadisticas?.porProvincia?.["Mongomo"] || 56,
        centers: 7,
        doctors: 18,
        nurses: 30,
        pharmacists: 8,
        publicSector: 45,
        privateSector: 11,
        approved: 52,
        pending: 4,
      },
    };
    return mockData;
  }, [estadisticas]);

  // Load GeoJSON data
  useEffect(() => {
    const loadGeoData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/data/equatorial-guinea.geojson");
        if (!response.ok) {
          throw new Error(`Failed to load GeoJSON: ${response.status}`);
        }

        const data = await response.json();
        setGeoData(data);
      } catch (err: any) {
        console.error("Error loading GeoJSON:", err);
        setError(`Error cargando datos del mapa: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadGeoData();
  }, []);

  // Draw map with D3
  useEffect(() => {
    if (!geoData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    // Set up projection
    const projection = d3
      .geoMercator()
      .fitSize(
        [
          width - margin.left - margin.right,
          height - margin.top - margin.bottom,
        ],
        geoData,
      );

    const pathGenerator = d3.geoPath().projection(projection);

    // Create main group with viewBox for responsive scaling
    const mapGroup = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Get metric values for color scale
    const metricValues = Object.values(provinceData).map((p) =>
      getMetricValue(p, selectedMetric),
    );
    const maxValue = Math.max(...metricValues);
    const minValue = Math.min(...metricValues);

    // Color scale
    const colorScale = d3
      .scaleSequential()
      .domain([minValue, maxValue])
      .interpolator(d3.interpolateBlues);

    // Draw provinces
    const provinces = mapGroup
      .selectAll(".province")
      .data(geoData.features)
      .enter()
      .append("g")
      .attr("class", "province");

    provinces
      .append("path")
      .attr("d", pathGenerator)
      .attr("fill", (d: any) => {
        const provinceName = d.properties.name;
        const province = provinceData[provinceName];
        if (!province) return "#f3f4f6";

        const value = getMetricValue(province, selectedMetric);
        return colorScale(value);
      })
      .attr("stroke", "#374151")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseover", function (event: any, d: any) {
        setHoveredProvince(d.properties.name);
        d3.select(this).attr("stroke-width", 2).attr("stroke", "#1f2937");
      })
      .on("mouseout", function (event: any, d: any) {
        setHoveredProvince(null);
        d3.select(this).attr("stroke-width", 1).attr("stroke", "#374151");
      })
      .on("click", function (event: any, d: any) {
        const provinceName = d.properties.name;
        setSelectedProvince(provinceName);
        onNavigateToProvince?.(provinceName);
      });

    // Add province labels
    provinces
      .append("text")
      .attr("x", (d: any) => pathGenerator.centroid(d)[0])
      .attr("y", (d: any) => pathGenerator.centroid(d)[1])
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#1f2937")
      .style("pointer-events", "none")
      .text((d: any) => d.properties.name);

    // Add legend
    const legendWidth = 300;
    const legendHeight = 20;
    const legendGroup = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width - legendWidth - 20}, ${height - 60})`,
      );

    // Legend gradient
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");

    gradient
      .selectAll("stop")
      .data(d3.range(0, 1.1, 0.1))
      .enter()
      .append("stop")
      .attr("offset", (d) => `${d * 100}%`)
      .attr("stop-color", (d) => d3.interpolateBlues(d));

    legendGroup
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)")
      .attr("stroke", "#374151")
      .attr("stroke-width", 1);

    // Legend labels
    legendGroup
      .append("text")
      .attr("x", 0)
      .attr("y", legendHeight + 15)
      .style("font-size", "12px")
      .style("fill", "#4b5563")
      .text(minValue.toString());

    legendGroup
      .append("text")
      .attr("x", legendWidth)
      .attr("y", legendHeight + 15)
      .attr("text-anchor", "end")
      .style("font-size", "12px")
      .style("fill", "#4b5563")
      .text(maxValue.toString());

    legendGroup
      .append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#1f2937")
      .text(getMetricLabel(selectedMetric));
  }, [geoData, selectedMetric, provinceData]);

  const getMetricValue = (province: ProvinceData, metric: string): number => {
    switch (metric) {
      case "professionals":
        return province.professionals;
      case "centers":
        return province.centers;
      case "doctors":
        return province.doctors;
      case "nurses":
        return province.nurses;
      case "pharmacists":
        return province.pharmacists;
      case "publicSector":
        return province.publicSector;
      case "privateSector":
        return province.privateSector;
      case "approved":
        return province.approved;
      case "pending":
        return province.pending;
      default:
        return province.professionals;
    }
  };

  const getMetricLabel = (metric: string): string => {
    const labels: Record<string, string> = {
      professionals: "Total Profesionales",
      centers: "Centros de Salud",
      doctors: "Médicos",
      nurses: "Enfermeros",
      pharmacists: "Farmacéuticos",
      publicSector: "Sector Público",
      privateSector: "Sector Privado",
      approved: "Aprobados",
      pending: "Pendientes",
    };
    return labels[metric] || "Total Profesionales";
  };

  const metricOptions = [
    { value: "professionals", label: "Total Profesionales", icon: Users },
    { value: "centers", label: "Centros de Salud", icon: Building },
    { value: "doctors", label: "Médicos", icon: Stethoscope },
    { value: "nurses", label: "Enfermeros", icon: Users },
    { value: "pharmacists", label: "Farmacéuticos", icon: GraduationCap },
    { value: "publicSector", label: "Sector Público", icon: Building },
    { value: "privateSector", label: "Sector Privado", icon: Building },
    { value: "approved", label: "Aprobados", icon: Users },
    { value: "pending", label: "Pendientes", icon: Users },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando mapa...</span>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            Mapa de Guinea Ecuatorial (D3.js)
          </h3>
          <p className="text-gray-600">
            Distribución geográfica interactiva por provincias
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Seleccionar métrica" />
            </SelectTrigger>
            <SelectContent>
              {metricOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Mapa Coroplético - {getMetricLabel(selectedMetric)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gray-50 rounded-lg p-4">
              <svg
                ref={svgRef}
                className="w-full"
                style={{ maxHeight: "600px" }}
              />

              {/* Hover tooltip */}
              {hoveredProvince && (
                <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg border z-10 min-w-64">
                  <h4 className="font-semibold text-lg mb-2">
                    {hoveredProvince}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Profesionales:</span>
                      <span className="font-medium">
                        {provinceData[hoveredProvince]?.professionals}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Centros:</span>
                      <span className="font-medium">
                        {provinceData[hoveredProvince]?.centers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Médicos:</span>
                      <span className="font-medium">
                        {provinceData[hoveredProvince]?.doctors}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Enfermeros:</span>
                      <span className="font-medium">
                        {provinceData[hoveredProvince]?.nurses}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aprobados:</span>
                      <span className="font-medium text-green-600">
                        {provinceData[hoveredProvince]?.approved}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pendientes:</span>
                      <span className="font-medium text-orange-600">
                        {provinceData[hoveredProvince]?.pending}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => onNavigateToProvince?.(hoveredProvince)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Detalles
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Panel */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedProvince
                ? `${selectedProvince}`
                : "Estadísticas Generales"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProvince ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <div className="text-3xl font-bold text-teal-600">
                    {getMetricValue(
                      provinceData[selectedProvince],
                      selectedMetric,
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {getMetricLabel(selectedMetric)}
                  </div>
                </div>

                <div className="space-y-3">
                  {metricOptions.map((option) => {
                    const Icon = option.icon;
                    const value = getMetricValue(
                      provinceData[selectedProvince],
                      option.value,
                    );
                    return (
                      <div
                        key={option.value}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-600" />
                          <span className="text-sm">{option.label}</span>
                        </div>
                        <Badge variant="outline">{value}</Badge>
                      </div>
                    );
                  })}
                </div>

                <Button
                  className="w-full"
                  onClick={() => onNavigateToProvince?.(selectedProvince)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Profesionales de {selectedProvince}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Haz clic en una provincia para ver detalles
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    Top 3 Provincias ({getMetricLabel(selectedMetric)})
                  </h4>
                  {Object.values(provinceData)
                    .sort(
                      (a, b) =>
                        getMetricValue(b, selectedMetric) -
                        getMetricValue(a, selectedMetric),
                    )
                    .slice(0, 3)
                    .map((province, index) => (
                      <div
                        key={province.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              index === 0
                                ? "bg-yellow-500"
                                : index === 1
                                  ? "bg-gray-400"
                                  : "bg-orange-600"
                            }`}
                          />
                          <span className="text-sm font-medium">
                            {province.name}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {getMetricValue(province, selectedMetric)}
                        </Badge>
                      </div>
                    ))}
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-2 text-xs text-center">
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="font-bold text-blue-600">
                        {Object.values(provinceData).reduce(
                          (sum, p) => sum + p.professionals,
                          0,
                        )}
                      </div>
                      <div className="text-gray-600">Total Profesionales</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <div className="font-bold text-green-600">
                        {Object.values(provinceData).reduce(
                          (sum, p) => sum + p.centers,
                          0,
                        )}
                      </div>
                      <div className="text-gray-600">Total Centros</div>
                    </div>
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
