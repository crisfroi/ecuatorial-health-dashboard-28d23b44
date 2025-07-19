import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  MapPin,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Download,
  Activity,
} from "lucide-react";

interface ExecutiveSummaryProps {
  areaStats: any[];
  districtStats: any[];
  ageStats: any[];
  graduationStats: any[];
  centerStats: any[];
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  areaStats,
  districtStats,
  ageStats,
  graduationStats,
  centerStats,
}) => {
  // Calculate key metrics
  const totalProfessionals = areaStats.reduce(
    (sum, area) => sum + area.total,
    0,
  );
  const totalApproved = areaStats.reduce(
    (sum, area) => sum + area.aprobados,
    0,
  );
  const totalPending = areaStats.reduce(
    (sum, area) => sum + area.pendientes,
    0,
  );
  const approvalRate =
    totalProfessionals > 0 ? (totalApproved / totalProfessionals) * 100 : 0;

  // Top performing areas
  const topAreas = areaStats
    .filter((area) => area.total > 0)
    .sort(
      (a, b) => (b.aprobados / b.total) * 100 - (a.aprobados / a.total) * 100,
    )
    .slice(0, 5);

  // Areas needing attention
  const attentionAreas = areaStats
    .filter((area) => area.pendientes > area.aprobados && area.total > 5)
    .sort((a, b) => b.pendientes / b.total - a.pendientes / a.total)
    .slice(0, 3);

  // Top districts
  const topDistricts = districtStats
    .sort((a, b) => b.total_profesionales - a.total_profesionales)
    .slice(0, 5);

  // Recent graduation trends
  const recentGraduations = graduationStats
    .sort((a, b) => b.año_graduacion - a.año_graduacion)
    .slice(0, 5);

  // Age insights
  const dominantAgeGroup = ageStats.reduce(
    (max, current) => (current.cantidad > max.cantidad ? current : max),
    ageStats[0] || {},
  );

  const generateReport = () => {
    const reportData = {
      fecha: new Date().toLocaleDateString("es-ES"),
      totalProfesionales: totalProfessionals,
      tasaAprobacion: approvalRate.toFixed(1),
      areasDestacadas: topAreas.map((a) => a.area_profesional),
      distritosLideres: topDistricts.map((d) => d.distrito_sanitario),
      recomendaciones: [
        "Fortalecer áreas con alta demanda pendiente",
        "Optimizar procesos de aprobación",
        "Mejorar distribución geográfica de profesionales",
      ],
    };

    const reportContent = `
RESUMEN EJECUTIVO - SISTEMA DE PROFESIONALES SANITARIOS
Fecha: ${reportData.fecha}

MÉTRICAS CLAVE:
- Total de Profesionales: ${reportData.totalProfesionales}
- Tasa de Aprobación: ${reportData.tasaAprobacion}%
- Áreas Profesionales Activas: ${areaStats.length}
- Distritos Sanitarios: ${districtStats.length}

ÁREAS DESTACADAS:
${reportData.areasDestacadas.map((area) => `- ${area}`).join("\n")}

DISTRITOS LÍDERES:
${reportData.distritosLideres.map((distrito) => `- ${distrito}`).join("\n")}

RECOMENDACIONES:
${reportData.recomendaciones.map((rec) => `- ${rec}`).join("\n")}
    `;

    const blob = new Blob([reportContent], {
      type: "text/plain;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `resumen_ejecutivo_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Resumen Ejecutivo
          </h2>
          <p className="text-gray-600">Análisis y métricas clave del sistema</p>
        </div>
        <Button onClick={generateReport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Descargar Reporte
        </Button>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Profesionales</p>
                <p className="text-3xl font-bold text-blue-600">
                  {totalProfessionals.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Sistema activo</span>
                </div>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasa de Aprobación</p>
                <p className="text-3xl font-bold text-green-600">
                  {approvalRate.toFixed(1)}%
                </p>
                <div className="flex items-center mt-2">
                  {approvalRate > 75 ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">Excelente</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-yellow-600">Mejorable</span>
                    </>
                  )}
                </div>
              </div>
              <Target className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-orange-600">
                  {totalPending.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-600">
                    Requiere atención
                  </span>
                </div>
              </div>
              <Activity className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Distritos Activos</p>
                <p className="text-3xl font-bold text-purple-600">
                  {districtStats.length}
                </p>
                <div className="flex items-center mt-2">
                  <MapPin className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600">
                    Cobertura nacional
                  </span>
                </div>
              </div>
              <Building2 className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Áreas de Alto Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topAreas.map((area, index) => {
                const efficiency = (area.aprobados / area.total) * 100;
                return (
                  <div
                    key={area.area_profesional}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <span className="text-sm font-bold text-green-700">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {area.area_profesional}
                        </p>
                        <p className="text-sm text-gray-600">
                          {area.total} profesionales
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-800">
                        {efficiency.toFixed(1)}% aprobación
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        {area.aprobados} aprobados
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Áreas que Requieren Atención
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attentionAreas.length > 0 ? (
                attentionAreas.map((area, index) => {
                  const pendingRatio = (area.pendientes / area.total) * 100;
                  return (
                    <div
                      key={area.area_profesional}
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {area.area_profesional}
                          </p>
                          <p className="text-sm text-gray-600">
                            {area.total} profesionales
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-orange-100 text-orange-800">
                          {area.pendientes} pendientes
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          {pendingRatio.toFixed(1)}% pendiente
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>
                    ¡Excelente! No hay áreas que requieran atención especial.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic and Demographic Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              Top 5 Distritos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDistricts.map((district, index) => (
                <div
                  key={district.distrito_sanitario}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium">
                      {district.distrito_sanitario}
                    </span>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      {district.total_profesionales}
                    </Badge>
                    <p className="text-xs text-gray-500">
                      {district.total_centros} centros
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Graduaciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentGraduations.map((grad, index) => (
                <div
                  key={grad.año_graduacion}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium">
                    {grad.año_graduacion}
                  </span>
                  <Badge variant="outline">{grad.cantidad} graduados</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Perfil Demográfico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Grupo de edad dominante</p>
                <p className="text-lg font-semibold">
                  {dominantAgeGroup?.rango_edad || "N/A"}
                </p>
                <p className="text-sm text-gray-500">
                  {dominantAgeGroup?.cantidad || 0} profesionales (
                  {dominantAgeGroup?.porcentaje?.toFixed(1) || 0}%)
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Diversidad de áreas</p>
                <p className="text-lg font-semibold">
                  {areaStats.length} especialidades
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cobertura geográfica</p>
                <p className="text-lg font-semibold">
                  {districtStats.length} distritos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Recomendaciones Estratégicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg bg-blue-50">
              <h4 className="font-semibold text-blue-800 mb-2">
                Optimización de Procesos
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Acelerar revisión de solicitudes pendientes</li>
                <li>• Implementar procesos automatizados</li>
                <li>• Mejorar comunicación con solicitantes</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg bg-green-50">
              <h4 className="font-semibold text-green-800 mb-2">
                Fortalecimiento de Áreas
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Promover áreas con alta demanda</li>
                <li>• Incentivar formación en especialidades críticas</li>
                <li>• Establecer programas de capacitación</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg bg-purple-50">
              <h4 className="font-semibold text-purple-800 mb-2">
                Expansión Geográfica
              </h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Fortalecer distritos con menor cobertura</li>
                <li>• Redistribuir recursos según demanda</li>
                <li>• Crear centros de formación regional</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutiveSummary;
