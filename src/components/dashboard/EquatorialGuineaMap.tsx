import React, { useState, useMemo } from "react";
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

interface EquatorialGuineaMapProps {
  onNavigateToProvince?: (provinceName: string) => void;
}

// SVG paths for Equatorial Guinea provinces (simplified coordinates)
const PROVINCE_PATHS = {
  "Bioko Norte": "M50,50 L150,50 L150,120 L50,120 Z",
  "Bioko Sur": "M50,130 L150,130 L150,200 L50,200 Z",
  Annobón: "M200,300 L250,300 L250,350 L200,350 Z",
  Litoral: "M300,50 L500,50 L500,150 L300,150 Z",
  "Centro Sur": "M300,160 L500,160 L500,250 L300,250 Z",
  "Kié-Ntem": "M300,260 L500,260 L500,350 L300,350 Z",
  "Wele-Nzas": "M510,50 L700,50 L700,200 L510,200 Z",
};

const EquatorialGuineaMap: React.FC<EquatorialGuineaMapProps> = ({
  onNavigateToProvince,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>("professionals");
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  const { data: estadisticas } = useEstadisticasAvanzadas();

  // Mock data for provinces - in real implementation this would come from your API
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

  const getColor = (value: number, maxValue: number): string => {
    const intensity = value / maxValue;
    if (intensity > 0.8) return "#0f766e"; // Dark teal
    if (intensity > 0.6) return "#14b8a6"; // Medium teal
    if (intensity > 0.4) return "#5eead4"; // Light teal
    if (intensity > 0.2) return "#a7f3d0"; // Very light teal
    return "#f0fdfa"; // Lightest teal
  };

  const maxValue = Math.max(
    ...Object.values(provinceData).map((p) =>
      getMetricValue(p, selectedMetric),
    ),
  );

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

  const selectedMetricLabel =
    metricOptions.find((option) => option.value === selectedMetric)?.label ||
    "Total Profesionales";

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            Mapa de Guinea Ecuatorial
          </h3>
          <p className="text-gray-600">
            Distribución geográfica por provincias
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
            <CardTitle>Mapa Coroplético - {selectedMetricLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <svg
                viewBox="0 0 750 400"
                className="w-full h-96 border rounded-lg bg-blue-50"
              >
                {/* Background Ocean */}
                <rect width="750" height="400" fill="#dbeafe" />

                {/* Province paths */}
                {Object.entries(PROVINCE_PATHS).map(([provinceName, path]) => {
                  const provinceInfo = provinceData[provinceName];
                  const value = getMetricValue(provinceInfo, selectedMetric);
                  const fillColor = getColor(value, maxValue);
                  const isHovered = hoveredProvince === provinceName;
                  const isSelected = selectedProvince === provinceName;

                  return (
                    <g key={provinceName}>
                      <path
                        d={path}
                        fill={fillColor}
                        stroke="#0f766e"
                        strokeWidth={isHovered || isSelected ? 3 : 1}
                        className="cursor-pointer transition-all duration-200"
                        onMouseEnter={() => setHoveredProvince(provinceName)}
                        onMouseLeave={() => setHoveredProvince(null)}
                        onClick={() => {
                          setSelectedProvince(provinceName);
                          onNavigateToProvince?.(provinceName);
                        }}
                      />
                      {/* Province label */}
                      <text
                        x={
                          path.includes("M50")
                            ? 100
                            : path.includes("M200")
                              ? 225
                              : path.includes("M300")
                                ? 400
                                : 600
                        }
                        y={
                          path.includes("M50,50")
                            ? 85
                            : path.includes("M50,130")
                              ? 165
                              : path.includes("M200")
                                ? 325
                                : path.includes("M300,50")
                                  ? 105
                                  : path.includes("M300,160")
                                    ? 205
                                    : path.includes("M300,260")
                                      ? 305
                                      : 125
                        }
                        textAnchor="middle"
                        fontSize="12"
                        fill="#0f766e"
                        className="font-medium pointer-events-none"
                      >
                        {provinceName}
                      </text>
                    </g>
                  );
                })}
              </svg>

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
                        {provinceData[hoveredProvince].professionals}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Centros:</span>
                      <span className="font-medium">
                        {provinceData[hoveredProvince].centers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Médicos:</span>
                      <span className="font-medium">
                        {provinceData[hoveredProvince].doctors}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Enfermeros:</span>
                      <span className="font-medium">
                        {provinceData[hoveredProvince].nurses}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aprobados:</span>
                      <span className="font-medium text-green-600">
                        {provinceData[hoveredProvince].approved}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pendientes:</span>
                      <span className="font-medium text-orange-600">
                        {provinceData[hoveredProvince].pending}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => onNavigateToProvince?.(hoveredProvince)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Detalles
                  </Button>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">{selectedMetricLabel}</div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Menor</span>
                <div className="flex space-x-1">
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((intensity) => (
                    <div
                      key={intensity}
                      className="w-4 h-4 border border-gray-300"
                      style={{
                        backgroundColor: getColor(
                          intensity * maxValue,
                          maxValue,
                        ),
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">Mayor</span>
              </div>
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
                    {selectedMetricLabel}
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
                    Top 3 Provincias ({selectedMetricLabel})
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

export default EquatorialGuineaMap;
