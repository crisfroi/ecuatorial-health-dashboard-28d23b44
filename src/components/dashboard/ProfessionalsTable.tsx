import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X, Eye, Edit, Download, Save } from "lucide-react";
import { useProfesionales, type Profesional } from "@/hooks/useProfesionales";
import { useProfesionalesMutations } from "@/hooks/useProfesionalesMutations";
import { useRoleBasedData } from "@/hooks/useRoleBasedData";
import { useToast } from "@/hooks/use-toast";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { DataRestrictionIndicator } from "@/components/ui/data-restriction-indicator";
import { supabase } from '@/integrations/supabase/client';
import { PROVINCIAS_EG } from '@/utils/geo';
import * as XLSX from 'xlsx';
import { Copy } from 'lucide-react';

interface DashboardFilters {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  distrito?: string;
  distrito_sanitario?: string;
  lugar_trabajo?: string;
  edad_minima?: number;
  edad_maxima?: number;
  año_graduacion?: number;
  categoria_titulacion?: string;
  categoria_centro?: string;
  funcion_publica?: boolean;
  pais_formacion?: string;
  institucion?: string;
  vencimiento_proximo?: boolean;
  carnet_vencido?: boolean;
  prioridad_renovacion?: "alta" | "media" | "baja" | "vencido" | "all";
}

interface ProfessionalsTableProps {
  onSelectProfessional: (professional: any) => void;
  userRole: string;
  appliedFilters?: DashboardFilters;
  onClearFilters?: () => void;
}

const ProfessionalsTable = (props: ProfessionalsTableProps) => {
  const { onSelectProfessional, userRole, appliedFilters, onClearFilters } =
    props;
  const dashboardFilters = appliedFilters; // Esto sigue siendo el filtro que viene del Dashboard

  // --- LOGS CLAVE PARA LA DEPURACIÓN (Mantenemos estos para que veas que el appliedFilters del dashboard llega) ---
  console.log("ProfessionalsTable: OBJETO PROPS COMPLETO RECIBIDO:", props);
  console.log(
    "ProfessionalsTable: Prop appliedFilters específica:",
    appliedFilters,
  );
  console.log(
    "ProfessionalsTable: Filtros desestructurados (dashboardFilters):",
    dashboardFilters,
  );
  // --- FIN LOGS CLAVE ---

  const [searchTerm, setSearchTerm] = useState("");
  const [editingStates, setEditingStates] = useState<Record<string, string>>(
    {},
  );

  // Ahora 'genero' se incluye en localFilters y se inicializa con 'todos'
  const [areaOptions, setAreaOptions] = useState<string[]>([]);

  const [localFilters, setLocalFilters] = useState({
    area_profesional: "todos",
    estado_solicitud: "Aprobado",
    provincia: "todos",
    genero: "todos", // <<< CAMBIO CLAVE 1: Género ahora es parte de localFilters
    tipo_sector: "todos",
  });

  const { toast } = useToast();

  useEffect(() => {
    const loadAreas = async () => {
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select('area_profesional')
        .not('area_profesional', 'is', null)
        .limit(10000)
      if (!error) {
        const vals = Array.from(new Set((data || []).map((r: any) => String(r.area_profesional).trim()).filter(Boolean))).sort()
        setAreaOptions(vals)
      }
    }
    loadAreas()
  }, [])
  const { updateProfesional } = useProfesionalesMutations();
  const { filterProfessionalsData, getFilterStats } = useRoleBasedData();

  // Excel export functionality
  const exportProfessionalsToExcel = () => {
    try {
      const header = [[
        "ID",
        "Nombre Completo",
        "Profesión",
        "ID Profesional",
        "Estado Solicitud",
        "Provincia",
        "Género",
        "Teléfono",
        "Email",
        "Fecha Registro",
        "Fecha Graduación",
        "Lugar de Trabajo",
      ]];

      const rows = sortedFilteredProfesionales.map((profesional) => [
        profesional.id || "",
        profesional.nombre_completo || "",
        profesional.titulacion_especifica_1 || profesional.area_profesional || "",
        profesional.id_profesional_unico || "",
        profesional.estado_solicitud || "",
        profesional.provincia || "",
        profesional.genero || "",
        profesional.telefono || "",
        profesional.email || "",
        profesional.created_at ? new Date(profesional.created_at).toLocaleDateString("es-ES") : "",
        profesional.fecha_graduacion ? new Date(profesional.fecha_graduacion).toLocaleDateString("es-ES") : "",
        profesional.nombre_centro || "",
      ]);

      const worksheetData = [...header, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Profesionales');

      const metadata = [
        ["Generado en", new Date().toLocaleString('es-ES')],
        ["Búsqueda", searchTerm || ""],
        ["Área Profesional", localFilters.area_profesional],
        ["Provincia", localFilters.provincia],
        ["Género", localFilters.genero],
        ["Tipo Sector", localFilters.tipo_sector],
        ["Estado Solicitud", localFilters.estado_solicitud],
        ["Total exportado", String(sortedFilteredProfesionales.length)],
      ];
      const wsMeta = XLSX.utils.aoa_to_sheet([["Clave","Valor"], ...metadata]);
      XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadatos');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Profesionales_${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Exportación exitosa',
        description: `Se ha descargado la lista de ${sortedFilteredProfesionales.length} profesionales.`,
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

  // Cargar filtros guardados al montar (persistencia)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('professionals.filters')
      if (saved) {
        const parsed = JSON.parse(saved)
        setLocalFilters((prev) => ({ ...prev, ...parsed }))
      }
    } catch {}
  }, [])

  // Guardar filtros cuando cambien
  useEffect(() => {
    try {
      sessionStorage.setItem('professionals.filters', JSON.stringify(localFilters))
    } catch {}
  }, [localFilters])

  // Leer filtros desde la URL si existen (enlace compartido)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'professionals' && params.get('filters')) {
        const parsed = JSON.parse(decodeURIComponent(params.get('filters') || ''));
        setLocalFilters((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, [])

  // Aplicar filtros del dashboard solo si vienen definidos, sin resetear los locales
  useEffect(() => {
    if (!dashboardFilters || Object.keys(dashboardFilters).length === 0) return

    console.log(
      'ProfessionalsTable: Applying dashboardFilters (merge without reset):',
      dashboardFilters,
    )

    setLocalFilters((prev) => ({
      ...prev,
      ...(dashboardFilters.area_profesional && dashboardFilters.area_profesional !== 'todos'
        ? { area_profesional: dashboardFilters.area_profesional }
        : {}),
      ...(dashboardFilters.provincia && dashboardFilters.provincia !== 'todos'
        ? { provincia: dashboardFilters.provincia }
        : {}),
      ...(dashboardFilters.genero && dashboardFilters.genero !== 'todos'
        ? { genero: dashboardFilters.genero }
        : {}),
      ...(dashboardFilters.tipo_sector && dashboardFilters.tipo_sector !== 'todos'
        ? { tipo_sector: dashboardFilters.tipo_sector }
        : {}),
      ...(dashboardFilters.estado_solicitud && dashboardFilters.estado_solicitud !== 'todos'
        ? { estado_solicitud: dashboardFilters.estado_solicitud }
        : {}),
    }))
  }, [dashboardFilters])

  const combinedQueryFilters = useMemo(() => {
    const filters: any = {
      // Búsqueda de texto enviada al servidor
      search: searchTerm.trim() || undefined,
      // Género: Ahora siempre se lee de localFilters
      genero: localFilters.genero === "todos" ? "" : localFilters.genero,

      estado_solicitud:
        localFilters.estado_solicitud === "todos" ||
        localFilters.estado_solicitud === "Aprobado"
          ? "Aprobado"
          : localFilters.estado_solicitud,

      area_profesional:
        localFilters.area_profesional === "todos" ? "" : localFilters.area_profesional,
      provincia: localFilters.provincia === "todos" ? "" : localFilters.provincia,
      tipo_sector: localFilters.tipo_sector === "todos" ? "" : localFilters.tipo_sector,

      // Filtros especiales provenientes del dashboard
      vencimiento_proximo: dashboardFilters?.vencimiento_proximo || undefined,
      carnet_vencido: dashboardFilters?.carnet_vencido || undefined,
      prioridad_renovacion:
        dashboardFilters?.prioridad_renovacion && dashboardFilters.prioridad_renovacion !== "all"
          ? dashboardFilters.prioridad_renovacion
          : undefined,
    };

    // Pasar directamente otros filtros provenientes de analytics
    if (dashboardFilters?.distrito_sanitario) filters.distrito_sanitario = dashboardFilters.distrito_sanitario;
    if (dashboardFilters?.distrito) filters.distrito = dashboardFilters.distrito;
    if (dashboardFilters?.lugar_trabajo) filters.lugar_trabajo = dashboardFilters.lugar_trabajo;
    if (dashboardFilters?.edad_minima !== undefined) filters.edad_minima = dashboardFilters.edad_minima;
    if (dashboardFilters?.edad_maxima !== undefined) filters.edad_maxima = dashboardFilters.edad_maxima;
    if (dashboardFilters?.año_graduacion !== undefined) filters.año_graduacion = dashboardFilters.año_graduacion;
    if (dashboardFilters?.categoria_titulacion) filters.categoria_titulacion = dashboardFilters.categoria_titulacion;
    if (dashboardFilters?.categoria_centro) filters.categoria_centro = dashboardFilters.categoria_centro;
    if (dashboardFilters?.funcion_publica !== undefined) filters.funcion_publica = dashboardFilters.funcion_publica;
    if (dashboardFilters?.pais_formacion) filters.pais_formacion = dashboardFilters.pais_formacion;
    if (dashboardFilters?.institucion) filters.institucion = dashboardFilters.institucion;
    console.log(
      "ProfessionalsTable: Final combinedQueryFilters passed to useProfesionales (from useMemo):",
      filters,
    );
    return filters;
  }, [dashboardFilters, localFilters]);

  const {
    data: profesionales = [],
    isLoading,
    error,
    refetch,
  } = useProfesionales(combinedQueryFilters);

  // Aplicar primero filtros de rol (restricciones por centro para directivos)
  const roleFilteredProfesionales = filterProfessionalsData(profesionales);

  // Obtener estadísticas de filtrado
  const filterStats = getFilterStats(profesionales, roleFilteredProfesionales, 'profesionales');

  // Luego aplicar filtros de búsqueda
  const filteredProfesionales = roleFilteredProfesionales.filter(
    (prof) =>
      prof.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.area_profesional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.id_profesional_unico?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Orden alfabético por defecto en todas las listas de profesionales
  const sortedFilteredProfesionales = useMemo(() => {
    return [...filteredProfesionales].sort((a, b) =>
      (a.nombre_completo || "").localeCompare(b.nombre_completo || "", "es", { sensitivity: "base" })
    );
  }, [filteredProfesionales]);

  const handleClearAllFilters = () => {
    console.log("Clearing all filters in ProfessionalsTable");
    setSearchTerm("");
    setLocalFilters({
      area_profesional: "todos",
      estado_solicitud: "Aprobado",
      provincia: "todos",
      genero: "todos", // <<< CAMBIO CLAVE 4: Resetear género también
      tipo_sector: "todos",
    });
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const handleEditState = (professionalId: string, currentState: string) => {
    setEditingStates((prev) => ({
      ...prev,
      [professionalId]: currentState,
    }));
  };

  const handleSaveState = async (professionalId: string) => {
    const newState = editingStates[professionalId];
    if (!newState) return;

    try {
      await updateProfesional.mutateAsync({
        id: professionalId,
        updates: {
          estado_solicitud: newState,
          fecha_revision:
            newState !== "Pendiente"
              ? new Date().toISOString().split("T")[0]
              : null,
          fecha_aprobacion:
            newState === "Aprobado"
              ? new Date().toISOString().split("T")[0]
              : null,
        },
      });

      setEditingStates((prev) => {
        const newStates = { ...prev };
        delete newStates[professionalId];
        return newStates;
      });

      refetch();
      toast({
        title: "Estado actualizado",
        description: `El estado del profesional ha sido cambiado a "${newState}".`,
      });
    } catch (error) {
      console.error("Error updating professional state:", error);
      toast({
        title: "Error al actualizar",
        description: "Hubo un problema al cambiar el estado del profesional.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = (professionalId: string) => {
    setEditingStates((prev) => {
      const newStates = { ...prev };
      delete newStates[professionalId];
      return newStates;
    });
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, string> = {
      Aprobado: "bg-green-100 text-green-800",
      Pendiente: "bg-yellow-100 text-yellow-800",
      "Pendiente de Firma": "bg-blue-100 text-blue-800",
      Rechazado: "bg-red-100 text-red-800",
      Revisando: "bg-orange-100 text-orange-800",
    };
    return variants[estado] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  // Determinar si hay filtros activos para mostrar la tarjeta de filtros aplicados
  // Se ha simplificado ligeramente la lógica de los localFilters
  const hasActiveFilters =
    searchTerm ||
    Object.entries(localFilters).some(([key, value]) => {
      // Para estado_solicitud, solo lo consideramos activo si no es 'Aprobado'
      if (key === "estado_solicitud") {
        return value !== "Aprobado";
      }
      // Para los demás, si no es 'todos'
      return value !== "todos";
    }) ||
    // Los filtros que solo pueden venir del dashboard
    dashboardFilters?.vencimiento_proximo ||
    dashboardFilters?.carnet_vencido ||
    (dashboardFilters?.prioridad_renovacion &&
      dashboardFilters.prioridad_renovacion !== "all");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando profesionales...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">
            Error al cargar los datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
      {hasActiveFilters && (
        <Card className="border-guinea-teal">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-guinea-teal">
                Filtros Aplicados
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllFilters}
                className="text-guinea-teal hover:text-guinea-dark-teal hover:bg-guinea-light-teal"
              >
                <X className="w-4 h-4 mr-1" />
                Limpiar Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge
                  variant="secondary"
                  className="bg-guinea-light-teal text-guinea-dark-teal"
                >
                  Búsqueda: {searchTerm}
                </Badge>
              )}
              {/* Ahora los filtros de dashboard se muestran si tienen un valor,
                  y los locales si no son 'todos' (ya que género está aqu�� ahora) */}
              {localFilters.area_profesional !== "todos" && (
                <Badge
                  variant="secondary"
                  className="bg-guinea-light-teal text-guinea-dark-teal"
                >
                  Área: {localFilters.area_profesional}
                </Badge>
              )}
              {localFilters.provincia !== "todos" && (
                <Badge
                  variant="secondary"
                  className="bg-guinea-light-teal text-guinea-dark-teal"
                >
                  Provincia: {localFilters.provincia}
                </Badge>
              )}
              {localFilters.genero !== "todos" && ( // <<< CAMBIO CLAVE 5: Mostrar género de localFilters
                <Badge
                  variant="secondary"
                  className="bg-guinea-light-teal text-guinea-dark-teal"
                >
                  Género: {localFilters.genero}
                </Badge>
              )}
              {localFilters.tipo_sector !== "todos" && (
                <Badge
                  variant="secondary"
                  className="bg-guinea-light-teal text-guinea-dark-teal"
                >
                  Tipo Sector: {localFilters.tipo_sector}
                </Badge>
              )}
              {localFilters.estado_solicitud !== "Aprobado" && (
                <Badge
                  variant="secondary"
                  className="bg-guinea-light-teal text-guinea-dark-teal"
                >
                  Estado Solicitud: {localFilters.estado_solicitud}
                </Badge>
              )}

              {dashboardFilters?.vencimiento_proximo && (
                <Badge
                  variant="secondary"
                  className="bg-guinea-light-teal text-guinea-dark-teal"
                >
                  Vencimiento: Próximo
                </Badge>
              )}
              {dashboardFilters?.carnet_vencido && (
                <Badge
                  variant="secondary"
                  className="bg-guinea-light-teal text-guinea-dark-teal"
                >
                  Vencimiento: Vencido
                </Badge>
              )}
              {dashboardFilters?.prioridad_renovacion &&
                dashboardFilters.prioridad_renovacion !== "all" && (
                  <Badge
                    variant="secondary"
                    className="bg-guinea-light-teal text-guinea-dark-teal"
                  >
                    Prioridad Renovación:{" "}
                    {dashboardFilters.prioridad_renovacion}
                  </Badge>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center space-x-2">
              <span>Profesionales Aprobados</span>
              <Badge variant="outline">{filteredProfesionales.length}</Badge>
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar profesional..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={exportProfessionalsToExcel}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', 'professionals');
                  url.searchParams.set('filters', encodeURIComponent(JSON.stringify(localFilters)));
                  navigator.clipboard.writeText(url.toString());
                  toast({ title: 'Enlace copiado', description: 'Filtros listos para compartir.' });
                }}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Compartir filtros
              </Button>

              <div className="flex gap-2">
                {/* Selector de Área Profesional (dinámico) */}
                <Select
                  value={localFilters.area_profesional}
                  onValueChange={(value) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      area_profesional: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las áreas</SelectItem>
                    {areaOptions.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selector de Provincia (lista oficial) */}
                <Select
                  value={localFilters.provincia}
                  onValueChange={(value) =>
                    setLocalFilters((prev) => ({ ...prev, provincia: value }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Provincia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {PROVINCIAS_EG.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selector de Género: Ahora es controlable localmente */}
                <Select
                  value={localFilters.genero} // <<< CAMBIO CLAVE 6: El valor viene de localFilters
                  onValueChange={(value) =>
                    setLocalFilters((prev) => ({ ...prev, genero: value }))
                  } // <<< CAMBIO CLAVE 7: Actualizar localFilters
                  // disabled ya no está aquí, así que siempre es editable
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los géneros</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>

                {/* Selector de Tipo de Sector (sin cambios) */}
                <Select
                  value={localFilters.tipo_sector}
                  onValueChange={(value) =>
                    setLocalFilters((prev) => ({ ...prev, tipo_sector: value }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los sectores</SelectItem>
                    <SelectItem value="Público">Público</SelectItem>
                    <SelectItem value="Privado">Privado</SelectItem>
                  </SelectContent>
                </Select>

                {/* Selector de Estado de Solicitud (sin cambios) */}
                <Select
                  value={localFilters.estado_solicitud}
                  onValueChange={(value) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      estado_solicitud: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="Aprobado">Aprobado</SelectItem>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Pendiente de Firma">
                      Pendiente de Firma
                    </SelectItem>
                    <SelectItem value="Rechazado">Rechazado</SelectItem>
                    <SelectItem value="Revisando">Revisando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Indicador de restricciones de datos */}
          <DataRestrictionIndicator
            dataType="profesionales"
            originalCount={profesionales.length}
            filteredCount={roleFilteredProfesionales.length}
            className="mb-4"
          />

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Area Profesional</TableHead>
                  <TableHead>ID Profesional</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Provincia</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfesionales.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      No se encontraron profesionales con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedFilteredProfesionales.map((profesional) => (
                    <TableRow key={profesional.id}>
                      <TableCell className="font-medium">
                        {profesional.nombre_completo}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {profesional.titulacion_especifica_1 || profesional.area_profesional}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {profesional.id_profesional_unico || "Pendiente"}
                      </TableCell>
                      <TableCell>
                        {editingStates[profesional.id!] ? (
                          <div className="flex items-center space-x-2">
                            <Select
                              value={editingStates[profesional.id!]}
                              onValueChange={(value) =>
                                setEditingStates((prev) => ({
                                  ...prev,
                                  [profesional.id!]: value,
                                }))
                              }
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Aprobado">Aprobado</SelectItem>
                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                <SelectItem value="Pendiente de Firma">Pendiente de Firma</SelectItem>
                                <SelectItem value="Rechazado">Rechazado</SelectItem>
                                <SelectItem value="Revisando">Revisando</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveState(profesional.id!)}
                              disabled={updateProfesional.isPending}
                            >
                              <Save className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleCancelEdit(profesional.id!)}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <Badge className={getEstadoBadge(profesional.estado_solicitud || "Pendiente")}>
                            {profesional.estado_solicitud || "Pendiente"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{profesional.provincia || "N/A"}</TableCell>
                      <TableCell>{formatDate(profesional.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectProfessional(profesional)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {userRole === "administrador" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleEditState(
                                  profesional.id!,
                                  profesional.estado_solicitud || "Pendiente",
                                )
                              }
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </ErrorBoundary>
  );
};

export default ProfessionalsTable;
