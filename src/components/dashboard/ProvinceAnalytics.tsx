import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { MapPin, Users, Building2, Download, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { useRef } from 'react';

interface ProvinceDetailStats {
  provincia: string;
  total_profesionales: number;
  profesionales_por_area: Array<{ area: string; cantidad: number; porcentaje: number }>;
  centros_por_categoria: Array<{ categoria: string; cantidad: number }>;
  distribucion_edad: Array<{ rango_edad: string; cantidad: number }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]; 

const useProvinceDetailStats = (provincia: string) => {
  return useQuery({
    queryKey: ["provinceDetailStats", provincia],
    queryFn: async (): Promise<ProvinceDetailStats> => {
      if (!provincia || provincia === "all") {
        throw new Error("Provincia no seleccionada");
      }

      const { data: professionals, error } = await supabase
        .from("profesionales_sanitarios")
        .select("*")
        .eq("provincia", provincia)
        .eq("estado_solicitud", "Aprobado");
      if (error) throw error;

      const { data: centers, error: centersError } = await supabase
        .from("centros_salud")
        .select("categoria")
        .eq("provincia", provincia);
      if (centersError) throw centersError;

      const areaDistribution = professionals.reduce((acc: Record<string, number>, prof: any) => {
        if (prof.area_profesional) acc[prof.area_profesional] = (acc[prof.area_profesional] || 0) + 1;
        return acc;
      }, {});
      const profesionales_por_area = Object.entries(areaDistribution)
        .map(([area, cantidad]) => ({ area, cantidad: cantidad as number, porcentaje: (cantidad as number) / (professionals.length || 1) * 100 }))
        .sort((a, b) => b.cantidad - a.cantidad);

      const centerCategories = centers.reduce((acc: Record<string, number>, c: any) => {
        acc[c.categoria] = (acc[c.categoria] || 0) + 1;
        return acc;
      }, {});
      const centros_por_categoria = Object.entries(centerCategories)
        .map(([categoria, cantidad]) => ({ categoria, cantidad: cantidad as number }))
        .sort((a, b) => b.cantidad - a.cantidad);

      const ageDistribution = professionals
        .filter((p: any) => p.edad)
        .reduce((acc: Record<string, number>, p: any) => {
          const edad = p.edad as number;
          let rango = "";
          if (edad < 25) rango = "< 25 años";
          else if (edad < 35) rango = "25-34 años";
          else if (edad < 45) rango = "35-44 años";
          else if (edad < 55) rango = "45-54 años";
          else if (edad < 65) rango = "55-64 años";
          else rango = "65+ años";
          acc[rango] = (acc[rango] || 0) + 1;
          return acc;
        }, {});
      const distribucion_edad = Object.entries(ageDistribution).map(([rango_edad, cantidad]) => ({ rango_edad, cantidad: cantidad as number }));

      return {
        provincia,
        total_profesionales: professionals.length,
        profesionales_por_area,
        centros_por_categoria,
        distribucion_edad,
      };
    },
    enabled: !!provincia && provincia !== "all",
  });
};

interface ProvinceAnalyticsProps {
  selectedProvince: string;
  onProvinceChange: (provincia: string) => void;
  availableProvinces: string[];
  onNavigateToTab?: (tab: string, filters?: any) => void;
}

const ProvinceAnalytics: React.FC<ProvinceAnalyticsProps> = ({ selectedProvince, onProvinceChange, availableProvinces, onNavigateToTab }) => {
  const { data: stats, isLoading, error } = useProvinceDetailStats(selectedProvince);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const exportProvinceData = () => {
    if (!stats) return;
    const wb = XLSX.utils.book_new();
    const headerArea = [["Área Profesional","Cantidad","Porcentaje"]];
    const rowsArea = stats.profesionales_por_area.map((a) => [a.area, a.cantidad, Number(a.porcentaje.toFixed(2))]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...headerArea, ...rowsArea]), 'Profesionales_por_Area');

    const headerCentros = [["Categoría","Cantidad"]];
    const rowsCentros = stats.centros_por_categoria.map((c) => [c.categoria, c.cantidad]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...headerCentros, ...rowsCentros]), 'Centros_por_Categoria');

    const headerEdad = [["Rango Edad","Cantidad"]];
    const rowsEdad = stats.distribucion_edad.map((r) => [r.rango_edad, r.cantidad]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...headerEdad, ...rowsEdad]), 'Distribucion_por_Edad');

    const meta = [["Generado en", new Date().toLocaleString('es-ES')],["Provincia", selectedProvince]];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Clave","Valor"], ...meta]), 'Metadatos');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analiticas_provincia_${selectedProvince}_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const captureViewAsImage = async (filename = 'province_analytics') => {
    if (!rootRef.current) return;
    try {
      const canvas = await html2canvas(rootRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `${filename}_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Error capturing province analytics image:', e);
    }
  };

  if (selectedProvince === "all") {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Selecciona una Provincia</h3>
          <p className="text-gray-600 mb-4">Elige una provincia para ver análisis detallados</p>
          <Select value={selectedProvince} onValueChange={onProvinceChange}>
            <SelectTrigger className="w-64 mx-auto">
              <SelectValue placeholder="Seleccionar provincia" />
            </SelectTrigger>
            <SelectContent>
              {availableProvinces.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas de la provincia...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <h3 className="text-lg font-semibold mb-2 text-red-600">Error al cargar datos</h3>
          <p className="text-gray-600">No se pudieron cargar las estadísticas de la provincia</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" ref={rootRef}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.provincia}</h3>
          <p className="text-gray-600">Análisis detallado por provincia</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedProvince} onValueChange={onProvinceChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las provincias</SelectItem>
              {availableProvinces.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportProvinceData} className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => captureViewAsImage(`analiticas_provincia_${selectedProvince}`)} className="flex items-center gap-2">
            <Eye className="w-4 h-4" /> Capturar imagen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow" onClick={() => onNavigateToTab && onNavigateToTab("professionals", { provincia: selectedProvince, estado_solicitud: "Aprobado" })}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-500">Total Profesionales</h4>
                <p className="text-xl font-bold text-blue-600">{stats.total_profesionales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow" onClick={() => onNavigateToTab && onNavigateToTab("health-centers", { provincia: selectedProvince })}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-500">Centros</h4>
                <p className="text-xl font-bold text-green-600">{stats.centros_por_categoria.reduce((s, c) => s + c.cantidad, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-500">Áreas Profesionales</h4>
                <p className="text-xl font-bold text-purple-600">{stats.profesionales_por_area.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profesionales por Área</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={stats.profesionales_por_area.slice(0, 6)} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="cantidad" label={(entry) => `${entry.area} (${entry.cantidad})`} className="cursor-pointer hover:opacity-80">
                  {stats.profesionales_por_area.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Centros por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.centros_por_categoria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" fontSize={10} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#00C49F" className="cursor-pointer hover:opacity-80" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Edad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.distribucion_edad}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rango_edad" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#8884D8" className="cursor-pointer hover:opacity-80" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle por Área Profesional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.profesionales_por_area.map((area) => (
              <div key={area.area} className="border rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">{area.area}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs"><span>Cantidad:</span><span className="font-medium">{area.cantidad}</span></div>
                  <div className="flex justify-between text-xs"><span>Porcentaje:</span><span className="font-medium">{area.porcentaje.toFixed(1)}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${area.porcentaje}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProvinceAnalytics;
