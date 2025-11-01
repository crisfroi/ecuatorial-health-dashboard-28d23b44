// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  MapPin,
  Users,
  Search,
  Filter,
  Phone,
  Eye,
  Edit,
  Plus,
  Download,
  FileImage,
} from "lucide-react";
import {
  useBuscarCentros,
  useCentrosSalud,
  useProfesionalesPorCentro,
} from "@/hooks/useCentrosSalud";
import { useDistritosSanitarios } from "@/hooks/useDistritosSanitarios";
import { useRoleBasedData } from "@/hooks/useRoleBasedData";
import { useToast } from "@/hooks/use-toast";
import { useCenterSync } from "@/hooks/useCenterSync";
import { useQuery } from "@tanstack/react-query";
import ProfessionalDetail from "@/components/dashboard/ProfessionalDetail";
import CenterAttendancePanel from "@/components/dashboard/CenterAttendancePanel";
import type { Profesional } from "@/hooks/useProfesionales";
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { getCleanGeoName } from "@/utils/geoUtils";
interface HealthCentersProps { dashboardFilters?: { distrito_sanitario?: string } }
const HealthCenters: React.FC<HealthCentersProps> = ({ dashboardFilters }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDistrito, setSelectedDistrito] = useState("");
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCenter, setEditingCenter] = useState<any>(null);
  const [filterArea, setFilterArea] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [showPendingCenters, setShowPendingCenters] = useState(false);
  const [viewType, setViewType] = useState<"kanban" | "list">("kanban");
  const [selectedProfessional, setSelectedProfessional] = useState<Profesional | null>(null);

  const { data: distritosSanitarios = [] } = useDistritosSanitarios();
  const { crearCentroMutation, actualizarCentroMutation, eliminarCentroMutation } = useCentrosSalud();
  const { validateCenterMutation, getPendingCenters } = useCenterSync();
  const { filterCentersData } = useRoleBasedData();
  const { toast } = useToast();

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const {
    data: centros = [],
    isLoading,
    isError,
    error,
  } = useBuscarCentros({
    nombreParcial: debouncedSearch || undefined,
    categoria: selectedCategory === "all" ? undefined : selectedCategory,
    distritoSanitario:
      selectedDistrito === "all" ? undefined : selectedDistrito,
  });

  if (isError) {
    return (
      <div className="p-6 text-center text-red-600">
        Ocurrió un error al cargar los centros de salud.
        <br />
        {error?.message || "Intenta recargar la página."}
      </div>
    );
  }

  const { data: profesionalesDelCentro = [] } = useProfesionalesPorCentro(
    selectedCenter?.id,
    filterArea || undefined,
    filterEstado || undefined,
  );

  const { data: pendingCenters = [], refetch: refetchPendingCenters } =
    useQuery({
      queryKey: ["pendingCenters"],
      queryFn: getPendingCenters,
      enabled: true, // Siempre cargar para mostrar el conteo correcto
    });

  useEffect(() => {
    if (dashboardFilters?.distrito_sanitario) {
      setSelectedDistrito(dashboardFilters.distrito_sanitario);
    }
    if ((dashboardFilters as any)?.categoria_centro) {
      const cat = String((dashboardFilters as any).categoria_centro).toUpperCase();
      setSelectedCategory(cat);
    }
  }, [dashboardFilters]);

  const categorias = [
    "HOSPITAL",
    "CLINICA",
    "CENTRO DE SALUD",
    "CONSULTORIO",
    "FARMACIA",
    "LABORATORIO",
  ];
  const sectores = ["Público", "Privado", "Mixto", "ONG"];
  const subcategorias = ["Regional", "Distrital", "Provincial", "General"];
  const areasProf = [
    "MEDICINA GENERAL",
    "ENFERMERÍA",
    "FARMACIA",
    "LABORATORIO",
    "RADIOLOGÍA",
    "ODONTOLOGÍA",
  ];
  const estadosSolicitud = ["Recibido", "Aprobado", "Rechazado", "En Revisión"];

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case "HOSPITAL":
        return "bg-red-100 text-red-800";
      case "CLINICA":
        return "bg-blue-100 text-blue-800";
      case "CENTRO DE SALUD":
        return "bg-green-100 text-green-800";
      case "CONSULTORIO":
        return "bg-yellow-100 text-yellow-800";
      case "FARMACIA":
        return "bg-purple-100 text-purple-800";
      case "LABORATORIO":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSectorColor = (sector: string) => {
    return sector === "Público"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-blue-100 text-blue-800";
  };

  // Aplicar filtros de rol (restricciones por centro para directivos)
  const roleFilteredCentros = filterCentersData(centros);

  // Aplicar filtros globales del dashboard si vienen
  const globallyFilteredCentros = (roleFilteredCentros || []).filter((c: any) => {
    if (dashboardFilters?.tipo_sector && dashboardFilters.tipo_sector !== 'todos') {
      if ((c.sector || '').trim() !== dashboardFilters.tipo_sector) return false;
    }
    if (dashboardFilters?.provincia && dashboardFilters.provincia !== 'todos') {
      if (getCleanGeoName(c.provincia || '') !== getCleanGeoName(dashboardFilters.provincia)) return false;
    }
    if (dashboardFilters?.distrito && dashboardFilters.distrito !== 'todos') {
      if (getCleanGeoName(c.distrito || '') !== getCleanGeoName(dashboardFilters.distrito)) return false;
    }
    if (dashboardFilters?.distrito_sanitario && dashboardFilters.distrito_sanitario !== 'todos') {
      if (getCleanGeoName(c.distrito_sanitario || '') !== getCleanGeoName(dashboardFilters.distrito_sanitario)) return false;
    }
    if ((dashboardFilters as any)?.categoria_centro) {
      const cat = String((dashboardFilters as any).categoria_centro).toUpperCase();
      if ((c.categoria || '').toUpperCase().trim() !== cat) return false;
    }
    return true;
  });

  // Excel export functionality
  const exportCentersToExcel = () => {
    try {
      const header = [[
        "ID",
        "Nombre",
        "Categoría",
        "Sector",
        "Distrito Sanitario",
        "Provincia",
        "Distrito",
        "Director",
        "Teléfono",
        "Total Profesionales",
      ]];

      const rows = globallyFilteredCentros.map((centro) => [
        centro.id || "",
        centro.nombre || "",
        centro.categoria || "",
        centro.sector || "",
        centro.distrito_sanitario || "",
        centro.provincia || "",
        centro.distrito || "",
        centro.director || "",
        centro.telefono || "",
        centro.total_profesionales || 0,
      ]);

      const worksheetData = [...header, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Centros');

      const meta = [
        ["Generado en", new Date().toLocaleString('es-ES')],
        ["Búsqueda", searchTerm || ""],
        ["Categoría", selectedCategory || ""],
        ["Distrito Sanitario", selectedDistrito || ""],
        ["Total exportado", String(globallyFilteredCentros.length)],
      ];
      const wsMeta = XLSX.utils.aoa_to_sheet([["Clave", "Valor"], ...meta]);
      XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadatos');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Centros_Salud_${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Exportación exitosa',
        description: `Se ha descargado la lista de ${globallyFilteredCentros.length} centros de salud.`,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: 'Error en la exportación',
        description: 'No se pudo exportar la lista. Intente nuevamente.',
        variant: 'destructive',
      });
    }
  };

  const exportCenterProfessionalsToExcel = () => {
    try {
      const sorted = [...profesionalesDelCentro].sort((a, b) =>
        (a?.nombre_completo || "").localeCompare(b?.nombre_completo || "", "es", { sensitivity: "base" })
      );

      const header = [[
        "ID",
        "Nombre Completo",
        "Área Profesional",
        "Estado Solicitud",
        "Provincia",
        "Distrito",
        "Distrito Sanitario",
        "Centro",
        "Teléfono",
        "Email",
        "Fecha Registro",
        "Fecha Graduación"
      ]];

      const rows = sorted.map((p: any) => [
        p.id || "",
        p.nombre_completo || "",
        p.area_profesional || p.titulacion_especifica_1 || "",
        p.estado_solicitud || "",
        p.provincia || "",
        p.distrito || "",
        p.distrito_sanitario || "",
        p.nombre_centro || p.lugar_trabajo || "",
        p.telefono || "",
        p.email || "",
        p.created_at ? new Date(p.created_at).toLocaleDateString("es-ES") : "",
        p.fecha_graduacion ? new Date(p.fecha_graduacion).toLocaleDateString("es-ES") : ""
      ]);

      const worksheetData = [...header, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Profesionales del Centro');

      const meta = [
        ["Generado en", new Date().toLocaleString('es-ES')],
        ["Centro", selectedCenter?.nombre || ""],
        ["Área filtro", filterArea || ""],
        ["Estado filtro", filterEstado || ""],
        ["Total exportado", String(sorted.length)],
      ];
      const wsMeta = XLSX.utils.aoa_to_sheet([["Clave", "Valor"], ...meta]);
      XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadatos');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Profesionales_Centro_${selectedCenter?.nombre || 'centro'}_${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Exportación exitosa',
        description: `Se ha descargado la lista de ${sorted.length} profesionales del centro.`,
      });
    } catch (error) {
      console.error('Error exporting center professionals:', error);
      toast({
        title: 'Error en la exportación',
        description: 'No se pudo exportar la lista de profesionales.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateCenter = async (formData: FormData) => {
    const data = Object.fromEntries(formData.entries());
    await crearCentroMutation.mutateAsync({
      nombre: data.nombre as string,
      categoria: data.categoria as string,
      distrito_sanitario: data.distrito_sanitario as string,
      sector: data.sector as string,
      provincia: data.provincia as string,
      distrito: data.distrito as string,
      director: (data.director as string) || undefined,
      telefono: (data.telefono as string) || undefined,
      // @ts-expect-error subcategoria no está en los tipos generados aún
      subcategoria: (data.subcategoria as string) || null,
    });
    setShowCreateDialog(false);
  };

  const handleEditCenter = async (formData: FormData) => {
    if (!editingCenter) return;
    const data = Object.fromEntries(formData.entries());
    await actualizarCentroMutation.mutateAsync({
      id: editingCenter.id,
      nombre: data.nombre as string,
      categoria: data.categoria as string,
      distrito_sanitario: data.distrito_sanitario as string,
      sector: data.sector as string,
      provincia: data.provincia as string,
      distrito: data.distrito as string,
      director: (data.director as string) || undefined,
      telefono: (data.telefono as string) || undefined,
      // @ts-expect-error subcategoria no está en los tipos generados aún
      subcategoria: (data.subcategoria as string) || null,
    });
    setShowEditDialog(false);
    setEditingCenter(null);
  };

  const handleValidateCenter = async (
    centerId: string,
    validationData: any,
  ) => {
    await validateCenterMutation.mutateAsync({
      centerId,
      validationData,
    });
    refetchPendingCenters();
  };

  // Filter centers by category for cards
  const getCentersByCategory = (categoria: string) => {
    return globallyFilteredCentros.filter((centro) => centro.categoria === categoria);
  };

  // Handle category card click to filter
  const handleCategoryFilter = (categoria: string) => {
    setSelectedCategory(categoria);
  };

  const AperturaResumen: React.FC<{ centerId: string; centerName: string }> = ({ centerId, centerName }) => {
    const { data } = useQuery({
      queryKey: ["apertura-solicitud", centerId, centerName],
      queryFn: async () => {
        // Primero buscar por centro_id
        const byId = await supabase
          .from("solicitudes_establecimientos")
          .select("id, numero_solicitud, fecha_solicitud, estado, personal_apertura, asesor_tecnico")
          .eq("centro_id", centerId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (byId.error && byId.error.code !== 'PGRST116') throw byId.error;
        if (byId.data) return byId.data as any;
        // Fallback por nombre si no hay vínculo
        const byName = await supabase
          .from("solicitudes_establecimientos")
          .select("id, numero_solicitud, fecha_solicitud, estado, personal_apertura, asesor_tecnico")
          .ilike("nombre_establecimiento", centerName)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (byName.error && byName.error.code !== 'PGRST116') throw byName.error;
        return byName.data as any;
      },
    });

    if (!data) return null;
    const categorias: Record<string, number> = data?.personal_apertura?.categorias || {};
    const personas: { nombre: string; telefono: string; categoria?: string }[] = data?.personal_apertura?.personas || [];
    const asesor = data?.asesor_tecnico || {};

    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan de Apertura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <span className="font-medium">Solicitud:</span>
            <span>{data.numero_solicitud || '—'}</span>
            <span className="mx-2">•</span>
            <span className="font-medium">Estado:</span>
            <span>{data.estado || '—'}</span>
          </div>
          {Object.keys(categorias).length > 0 && (
            <div>
              <div className="font-medium">Personal requerido:</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                {Object.entries(categorias).map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded p-2">
                    <span className="text-xs uppercase text-gray-500">{k}</span>
                    <div className="text-lg font-bold">{v as number}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {personas.length > 0 && (
            <div>
              <div className="font-medium mb-1">Listado de personal:</div>
              <div className="space-y-1">
                {personas.map((p, i) => (
                  <div key={i} className="flex justify-between border rounded p-2">
                    <div>
                      <div className="font-medium">{p.nombre}</div>
                      {p.categoria && <div className="text-xs text-gray-500">{p.categoria}</div>}
                    </div>
                    <div className="text-sm">{p.telefono}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(asesor?.nombre || asesor?.formacion || asesor?.telefono) && (
            <div>
              <div className="font-medium mb-1">Asesor Técnico</div>
              <div className="text-sm">
                {asesor?.nombre} {asesor?.formacion ? `• ${asesor.formacion}` : ''} {asesor?.telefono ? `• ${asesor.telefono}` : ''}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (selectedCenter) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setSelectedCenter(null)}>
            ← Volver a centros
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingCenter(selectedCenter);
                setShowEditDialog(true);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Centro
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (window.confirm(`¿Eliminar centro "${selectedCenter.nombre}"? Esta acción no se puede deshacer.`)) {
                  try {
                    await eliminarCentroMutation.mutateAsync(selectedCenter.id);
                    setSelectedCenter(null);
                    toast({ title: 'Centro eliminado', description: 'El centro fue eliminado correctamente.' });
                  } catch (e: any) {
                    toast({ title: 'Error al eliminar', description: e.message, variant: 'destructive' });
                  }
                }
              }}
            >
              Eliminar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              <span>{selectedCenter.nombre}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Información General</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Categoría:</strong> {selectedCenter.categoria}
                    </div>
                    <div>
                      <strong>Sector:</strong> {selectedCenter.sector}
                    </div>
                    <div>
                      <strong>NIF:</strong> {selectedCenter.nif || "No especificado"}
                    </div>
                    <div>
                      <strong>Responsable:</strong> {selectedCenter.responsable || "No especificado"}
                    </div>
                    <div>
                      <strong>Distrito Sanitario:</strong>{" "}
                      {selectedCenter.distrito_sanitario || "No especificado"}
                    </div>
                    <div>
                      <strong>Provincia:</strong> {selectedCenter.provincia}
                    </div>
                    <div>
                      <strong>Distrito:</strong> {selectedCenter.distrito}
                    </div>
                  </div>
                </div>

                {/* Resumen de solicitud de apertura (si existe) */}
                <AperturaResumen centerId={selectedCenter.id} centerName={selectedCenter.nombre} />
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Contacto</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Director:</strong>{" "}
                      {selectedCenter.director || "No especificado"}
                    </div>
                    <div>
                      <strong>Teléfono:</strong>{" "}
                      {selectedCenter.telefono || "No especificado"}
                    </div>
                  </div>
                </div>
                {Array.isArray(selectedCenter.fotos_establecimiento) && selectedCenter.fotos_establecimiento.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2"><FileImage className="w-4 h-4" /> Fotos del Establecimiento</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedCenter.fotos_establecimiento.map((foto: string, idx: number) => (
                        <img key={idx} src={foto} alt={`Foto ${idx + 1}`} className="w-full h-32 object-cover rounded border" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas de profesionales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {profesionalesDelCentro.filter(p => p.estado_solicitud === "Aprobado").length}
                </div>
                <div className="text-sm text-gray-600">Profesionales Aprobados</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {profesionalesDelCentro.filter(p => p.estado_solicitud !== "Aprobado").length}
                </div>
                <div className="text-sm text-gray-600">Profesionales Pendientes</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(profesionalesDelCentro.filter(p => p.estado_solicitud === "Aprobado").map(p => p.area_profesional)).size}
                </div>
                <div className="text-sm text-gray-600">Áreas Profesionales</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de asistencia y turnos del centro */}
        <CenterAttendancePanel
          centerId={selectedCenter.id}
          professionals={profesionalesDelCentro.map(p => ({ id: p.id, nombre_completo: p.nombre_completo, area_profesional: p.area_profesional })) as any}
        />

        {/* Profesionales del centro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Profesionales del Centro ({profesionalesDelCentro.length})</span>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-green-600 font-medium">
                  {profesionalesDelCentro.filter(p => p.estado_solicitud === "Aprobado").length} Aprobados
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-orange-600 font-medium">
                  {profesionalesDelCentro.filter(p => p.estado_solicitud !== "Aprobado").length} Pendientes
                </span>
              </div>
            </CardTitle>
            <div className="flex space-x-4 items-center">
              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las áreas</SelectItem>
                  {/* Mostrar solo áreas que existen en este centro */}
                  {[...new Set(profesionalesDelCentro.map(p => p.area_profesional))].filter(Boolean).map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Aprobado">Solo Aprobados</SelectItem>
                  <SelectItem value="Recibido">Recibido</SelectItem>
                  <SelectItem value="En Revisión">En Revisión</SelectItem>
                  <SelectItem value="Rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportCenterProfessionalsToExcel} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Resumen por áreas profesionales */}
            <div className="mb-6">
              <h5 className="font-medium mb-3">Distribución por Áreas Profesionales:</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[...new Set(profesionalesDelCentro.filter(p => p.estado_solicitud === "Aprobado").map(p => p.area_profesional))].filter(Boolean).map((area) => {
                  const count = profesionalesDelCentro.filter(p => p.area_profesional === area && p.estado_solicitud === "Aprobado").length;
                  return (
                    <div key={area} className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-blue-600">{count}</div>
                      <div className="text-xs text-blue-800">{area}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {[...profesionalesDelCentro]
                .sort((a, b) => (a?.nombre_completo || "").localeCompare(b?.nombre_completo || "", "es", { sensitivity: "base" }))
                .map((prof) => (
                  <div key={prof.id} className={`border rounded-lg p-4 ${prof.estado_solicitud === "Aprobado" ? "border-green-200 bg-green-50" : "border-gray-200"}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-gray-900">{prof.nombre_completo}</h4>
                          <Badge
                            variant="outline"
                            className={prof.estado_solicitud === "Aprobado" ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-gray-800"}
                          >
                            {prof.area_profesional}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1">
                          {prof.telefono && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {prof.telefono}
                            </p>
                          )}
                          {prof.fecha_solicitud && (
                            <p className="text-xs text-gray-500">
                              Registrado: {new Date(prof.fecha_solicitud).toLocaleDateString('es-ES')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            prof.estado_solicitud === "Aprobado"
                              ? "default"
                              : prof.estado_solicitud === "Rechazado"
                                ? "destructive"
                                : "secondary"
                          }
                          className={
                            prof.estado_solicitud === "Aprobado"
                              ? "bg-green-600 text-white"
                              : ""
                          }
                        >
                          {prof.estado_solicitud}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedProfessional(prof as Profesional)}>
                          <Eye className="w-4 h-4 mr-1" /> Ver
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              {profesionalesDelCentro.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No hay profesionales asignados a este centro con los filtros aplicados.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <ProfessionalDetail professional={selectedProfessional as any} onClose={() => setSelectedProfessional(null)} />

        {/* Dialog para editar centro */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Centro de Salud</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                if (editingCenter?.estado === "pendiente_validacion") {
                  // Handle validation for pending centers
                  const data = Object.fromEntries(formData.entries());
                  handleValidateCenter(editingCenter.id, {
                    director: data.director as string,
                    telefono: data.telefono as string,
                    estado: "validado",
                  });
                  setShowEditDialog(false);
                  setEditingCenter(null);
                } else {
                  // Handle regular center editing
                  handleEditCenter(formData);
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input
                    name="nombre"
                    defaultValue={editingCenter?.nombre}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Categoría *</label>
                  <Select
                    name="categoria"
                    defaultValue={editingCenter?.categoria}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Subcategoría</label>
                  <Select name="subcategoria" defaultValue={(editingCenter as any)?.subcategoria || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar subcategoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategorias.map((sub) => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Sector *</label>
                  <Select name="sector" defaultValue={editingCenter?.sector}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sectores.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Distrito Sanitario
                  </label>
                  <Select
                    name="distrito_sanitario"
                    defaultValue={editingCenter?.distrito_sanitario}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {distritosSanitarios.map((distrito) => (
                        <SelectItem
                          key={distrito.nombre_distrito}
                          value={distrito.nombre_distrito}
                        >
                          {distrito.nombre_distrito}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Provincia *</label>
                  <Input
                    name="provincia"
                    defaultValue={editingCenter?.provincia}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Distrito *</label>
                  <Input
                    name="distrito"
                    defaultValue={editingCenter?.distrito}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Director</label>
                  <Input
                    name="director"
                    defaultValue={editingCenter?.director}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input
                    name="telefono"
                    defaultValue={editingCenter?.telefono}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    actualizarCentroMutation.isPending ||
                    validateCenterMutation.isPending
                  }
                >
                  {editingCenter?.estado === "pendiente_validacion"
                    ? validateCenterMutation.isPending
                      ? "Validando..."
                      : "Validar Centro"
                    : actualizarCentroMutation.isPending
                      ? "Guardando..."
                      : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Centros de Salud</h2>
          <p className="text-gray-600 mt-1">
            Gestión de centros de trabajo sanitarios
          </p>
          <p className="text-xs text-gray-500">Resultados filtrados: {globallyFilteredCentros.length}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={exportCentersToExcel}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
          <Button
            variant={showPendingCenters ? "default" : "outline"}
            onClick={() => setShowPendingCenters(!showPendingCenters)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Centros Pendientes ({pendingCenters.length})
          </Button>

          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewType === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("kanban")}
              className="px-3"
            >
              <Building2 className="w-4 h-4 mr-1" />
              Tarjetas
            </Button>
            <Button
              variant={viewType === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("list")}
              className="px-3"
            >
              <Filter className="w-4 h-4 mr-1" />
              Lista
            </Button>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Centro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Centro de Salud</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateCenter(new FormData(e.currentTarget));
                }}
                className="space-y-4"
              >
                {/* Formulario similar al de editar */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nombre *</label>
                    <Input name="nombre" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Categoría *</label>
                    <Select name="categoria" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subcategoría</label>
                    <Select name="subcategoria">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar subcategoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategorias.map((sub) => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Sector *</label>
                    <Select name="sector" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectores.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Distrito Sanitario
                    </label>
                    <Select name="distrito_sanitario">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar distrito" />
                      </SelectTrigger>
                      <SelectContent>
                        {distritosSanitarios.map((distrito) => (
                          <SelectItem
                            key={distrito.nombre_distrito}
                            value={distrito.nombre_distrito}
                          >
                            {distrito.nombre_distrito}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Provincia *</label>
                    <Input name="provincia" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Distrito *</label>
                    <Input name="distrito" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Director</label>
                    <Input name="director" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Teléfono</label>
                    <Input name="telefono" />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={crearCentroMutation.isPending}
                  >
                    {crearCentroMutation.isPending
                      ? "Creando..."
                      : "Crear Centro"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pending Centers Validation Section */}
      {showPendingCenters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              Centros Pendientes de Validación
            </CardTitle>
            <p className="text-gray-600">
              Centros creados automáticamente desde registros de profesionales
              que requieren validación
            </p>
          </CardHeader>
          <CardContent>
            {pendingCenters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay centros pendientes de validación
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingCenters.map((centro) => (
                  <Card
                    key={centro.id}
                    className="border-orange-200 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => {
                      setEditingCenter(centro);
                      setShowEditDialog(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-sm">
                            {centro.nombre}
                          </h4>
                          <Badge className="mt-1 bg-orange-100 text-orange-800">
                            {centro.categoria}
                          </Badge>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-orange-600 border-orange-600"
                        >
                          Pendiente
                        </Badge>
                      </div>

                      <div className="space-y-2 text-xs text-gray-600 mb-4">
                        <div>
                          <strong>Provincia:</strong> {centro.provincia}
                        </div>
                        <div>
                          <strong>Distrito:</strong> {centro.distrito}
                        </div>
                        <div>
                          <strong>Sector:</strong> {centro.sector}
                        </div>
                        {centro.distrito_sanitario && (
                          <div>
                            <strong>Distrito Sanitario:</strong>{" "}
                            {centro.distrito_sanitario}
                          </div>
                        )}
                        <div>
                          <strong>Profesionales:</strong>{" "}
                          {centro.profesionales_count?.[0]?.count || 0}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleValidateCenter(centro.id, {
                              estado: "Activo",
                            });
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          disabled={validateCenterMutation.isPending}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          {validateCenterMutation.isPending ? "Validando..." : "Validar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`¿Estás seguro de que quieres rechazar el centro "${centro.nombre}"?`)) {
                              handleValidateCenter(centro.id, {
                                estado: "rechazado",
                              });
                            }
                          }}
                          disabled={validateCenterMutation.isPending}
                        >
                          Rechazar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estadísticas por categoría */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* Total Centros */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setSelectedCategory("")}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-xs">Total Centros</h3>
                <p className="text-xl font-bold text-blue-600">
                  {centros.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hospitales */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer hover:border-red-300"
          onClick={() => handleCategoryFilter("HOSPITAL")}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Building2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-xs">Hospitales</h3>
                <p className="text-xl font-bold text-red-600">
                  {getCentersByCategory("HOSPITAL").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clínicas */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer hover:border-blue-300"
          onClick={() => handleCategoryFilter("CLINICA")}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-xs">Clínicas</h3>
                <p className="text-xl font-bold text-blue-600">
                  {getCentersByCategory("CLINICA").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Centros de Salud */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer hover:border-green-300"
          onClick={() => handleCategoryFilter("CENTRO DE SALUD")}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-xs">Centros de Salud</h3>
                <p className="text-xl font-bold text-green-600">
                  {getCentersByCategory("CENTRO DE SALUD").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consultorios */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer hover:border-yellow-300"
          onClick={() => handleCategoryFilter("CONSULTORIO")}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Building2 className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-xs">Consultorios</h3>
                <p className="text-xl font-bold text-yellow-600">
                  {getCentersByCategory("CONSULTORIO").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Farmacias */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer hover:border-purple-300"
          onClick={() => handleCategoryFilter("FARMACIA")}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-xs">Farmacias</h3>
                <p className="text-xl font-bold text-purple-600">
                  {getCentersByCategory("FARMACIA").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Laboratorios */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer hover:border-orange-300"
          onClick={() => handleCategoryFilter("LABORATORIO")}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Building2 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-xs">Laboratorios</h3>
                <p className="text-xl font-bold text-orange-600">
                  {getCentersByCategory("LABORATORIO").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros de Búsqueda</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Buscar centro</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Nombre del centro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Categoría</label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Distrito Sanitario</label>
              <Select
                value={selectedDistrito}
                onValueChange={setSelectedDistrito}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los distritos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los distritos</SelectItem>
                  {distritosSanitarios.map((distrito) => (
                    <SelectItem
                      key={distrito.nombre_distrito}
                      value={distrito.nombre_distrito}
                    >
                      {distrito.nombre_distrito}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vista de Centros */}
      {viewType === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))
            : globallyFilteredCentros.map((centro) => (
              <Card
                key={centro.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {centro.nombre}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>
                          {centro.provincia}, {centro.distrito}
                        </span>
                      </div>
                    </div>
                    <Badge className={getCategoryColor(centro.categoria)}>
                      {centro.categoria}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <Users className="w-4 h-4 mr-2 text-blue-600" />
                        <span>
                          {centro.total_profesionales} profesionales
                        </span>
                      </div>
                      <Badge className={getSectorColor(centro.sector)}>
                        {centro.sector}
                      </Badge>
                    </div>

                    {centro.distrito_sanitario && (
                      <div className="text-sm text-gray-600 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {centro.distrito_sanitario}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => {
                        console.log("Selecting center:", centro);
                        if (!centro.id) {
                          toast({
                            title: "Error",
                            description: "El centro seleccionado no tiene un ID válido",
                            variant: "destructive",
                          });
                          return;
                        }
                        setSelectedCenter(centro);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Nombre</th>
                    <th className="text-left p-4 font-semibold">Categoría</th>
                    <th className="text-left p-4 font-semibold">Provincia</th>
                    <th className="text-left p-4 font-semibold">
                      Distrito Sanitario
                    </th>
                    <th className="text-left p-4 font-semibold">Sector</th>
                    <th className="text-left p-4 font-semibold">
                      Profesionales
                    </th>
                    <th className="text-left p-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b animate-pulse">
                        <td className="p-4">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </td>
                        <td className="p-4">
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </td>
                        <td className="p-4">
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </td>
                        <td className="p-4">
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </td>
                        <td className="p-4">
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        </td>
                        <td className="p-4">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </td>
                        <td className="p-4">
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </td>
                      </tr>
                    ))
                    : globallyFilteredCentros.map((centro) => (
                      <tr
                        key={centro.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <div className="font-semibold">{centro.nombre}</div>
                          <div className="text-sm text-gray-500">
                            {centro.distrito}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge
                            className={getCategoryColor(centro.categoria)}
                          >
                            {centro.categoria}
                          </Badge>
                        </td>
                        <td className="p-4">{centro.provincia}</td>
                        <td className="p-4">
                          {centro.distrito_sanitario || "No especificado"}
                        </td>
                        <td className="p-4">
                          <Badge className={getSectorColor(centro.sector)}>
                            {centro.sector}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2 text-blue-600" />
                            {centro.total_profesionales}
                          </div>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log("Selecting center from table:", centro);
                              if (!centro.id) {
                                toast({
                                  title: "Error",
                                  description: "El centro seleccionado no tiene un ID válido",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setSelectedCenter(centro);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!isLoading && centros.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron centros con los filtros aplicados.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HealthCenters;
