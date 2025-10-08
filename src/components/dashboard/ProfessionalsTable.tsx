import { useState, useEffect, useMemo } from "react";
import { Professional } from '@/types/Professional';
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
import { Search, X, Eye, Edit, Download, Save, Copy } from "lucide-react";
import { useProfesionales } from "@/hooks/useProfesionales";
import { useProfesionalesMutations } from "@/hooks/useProfesionalesMutations";
import { useRoleBasedData } from "@/hooks/useRoleBasedData";
import { useToast } from "@/hooks/use-toast";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { DataRestrictionIndicator } from "@/components/ui/data-restriction-indicator";
import * as XLSX from 'xlsx';

// INTERFAZ ACTUALIZADA PARA ACEPTAR ARRAYS
interface DashboardFilters {
  area_profesional?: string[]; // <-- MultiSelect (Array)
  estado_solicitud?: string[]; // <-- MultiSelect (Array)
  provincia?: string[]; // <-- MultiSelect (Array)
  genero?: string[]; // <-- MultiSelect (Array)
  tipo_sector?: string[]; // <-- MultiSelect (Array)
  distrito?: string[]; // <-- MultiSelect (Array)
  distrito_sanitario?: string[]; // <-- MultiSelect (Array)
  lugar_trabajo?: string; // Se mantiene string
  edad_minima?: number;
  edad_maxima?: number;
  año_graduacion?: number[]; // <-- MultiSelect (Array)
  categoria_titulacion?: string;
  categoria_centro?: string;
  funcion_publica?: boolean;
  pais_formacion?: string[]; // <-- MultiSelect (Array)
  institucion?: string[]; // <-- MultiSelect (Array)
  vencimiento_proximo?: boolean;
  carnet_vencido?: boolean;
  prioridad_renovacion?: "alta" | "media" | "baja" | "vencido" | "all";
  centro_id?: string[];
  centro_nombre?: string;
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
  const dashboardFilters = appliedFilters;

  const [searchTerm, setSearchTerm] = useState("");
  const [editingStates, setEditingStates] = useState<Record<string, string>>(
    {},
  );

  // ELIMINAMOS EL ESTADO LOCAL DUPLICADO (areaOptions, localFilters)
  const { toast } = useToast();

  // ELIMINAMOS EL useEffect para cargar áreas (lo gestiona DashboardFilters)

  const { updateProfesional } = useProfesionalesMutations();
  const { filterProfessionalsData, getFilterStats } = useRoleBasedData();

  // Helper para verificar si un array de filtro está activo
  const isArrayActive = (arr?: string[] | number[]) => (arr?.length ?? 0) > 0;
  // Helper para verificar si el filtro de estado de solicitud está activo (no es solo 'Aprobado')
  const isEstadoActive = (arr?: string[]) => isArrayActive(arr) && !(arr?.length === 1 && arr[0] === "Aprobado");

  // Función de exportación de Excel
  const exportProfessionalsToExcel = () => {
    try {
      // ... (Lógica de exportación de Excel sin cambios en el cuerpo, pero adaptada a leer filtros de dashboardFilters)
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

      // Metadata ahora lee directamente de dashboardFilters (arrays)
      const metadata = [
        ["Generado en", new Date().toLocaleString('es-ES')],
        ["Búsqueda", searchTerm || ""],
        ["Área Profesional", (dashboardFilters?.area_profesional || []).join(", ") || "Todas"],
        ["Provincia", (dashboardFilters?.provincia || []).join(", ") || "Todas"],
        ["Género", (dashboardFilters?.genero || []).join(", ") || "Todos"],
        ["Tipo Sector", (dashboardFilters?.tipo_sector || []).join(", ") || "Todos"],
        ["Estado Solicitud", (dashboardFilters?.estado_solicitud || []).join(", ") || "Aprobado (Por defecto)"],
        ["Total exportado", String(sortedFilteredProfesionales.length)],
      ];
      const wsMeta = XLSX.utils.aoa_to_sheet([["Clave", "Valor"], ...metadata]);
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

  // ELIMINAMOS TODOS LOS useEffects DE PERSISTENCIA Y SINCRONIZACIÓN DE localFilters

  const combinedQueryFilters = useMemo(() => {
    // Si no vienen filtros de estado, forzamos "Aprobado" (comportamiento por defecto de la tabla)
    const defaultEstado =
      dashboardFilters?.estado_solicitud && dashboardFilters.estado_solicitud.length > 0
        ? undefined
        : ["Aprobado"];

    const filters: any = {
      // Búsqueda de texto
      search: searchTerm.trim() || undefined,

      // Multi-Select Filters (leídos como array o undefined si están vacíos)
      genero: isArrayActive(dashboardFilters?.genero) ? dashboardFilters?.genero : undefined,
      area_profesional: isArrayActive(dashboardFilters?.area_profesional) ? dashboardFilters?.area_profesional : undefined,
      provincia: isArrayActive(dashboardFilters?.provincia) ? dashboardFilters?.provincia : undefined,
      tipo_sector: isArrayActive(dashboardFilters?.tipo_sector) ? dashboardFilters?.tipo_sector : undefined,
      distrito: isArrayActive(dashboardFilters?.distrito) ? dashboardFilters?.distrito : undefined,
      distrito_sanitario: isArrayActive(dashboardFilters?.distrito_sanitario) ? dashboardFilters?.distrito_sanitario : undefined,
      año_graduacion: isArrayActive(dashboardFilters?.año_graduacion) ? dashboardFilters?.año_graduacion : undefined,
      pais_formacion: isArrayActive(dashboardFilters?.pais_formacion) ? dashboardFilters?.pais_formacion : undefined,
      institucion: isArrayActive(dashboardFilters?.institucion) ? dashboardFilters?.institucion : undefined,
      centro_id: isArrayActive(dashboardFilters?.centro_id) ? dashboardFilters?.centro_id : undefined,

      // Estado de Solicitud (usa el array si existe, sino usa el valor por defecto)
      estado_solicitud: dashboardFilters?.estado_solicitud || defaultEstado,

      // Filtros especiales provenientes del dashboard (sin cambios)
      vencimiento_proximo: dashboardFilters?.vencimiento_proximo || undefined,
      carnet_vencido: dashboardFilters?.carnet_vencido || undefined,
      prioridad_renovacion:
        dashboardFilters?.prioridad_renovacion && dashboardFilters.prioridad_renovacion !== "all"
          ? dashboardFilters.prioridad_renovacion
          : undefined,

      // Otros filtros de valor único/rango
      ...(dashboardFilters?.centro_nombre && { lugar_trabajo: dashboardFilters.centro_nombre }),
      ...(dashboardFilters?.lugar_trabajo && { lugar_trabajo: dashboardFilters.lugar_trabajo }),
      ...(dashboardFilters?.edad_minima !== undefined && { edad_minima: dashboardFilters.edad_minima }),
      ...(dashboardFilters?.edad_maxima !== undefined && { edad_maxima: dashboardFilters.edad_maxima }),
      ...(dashboardFilters?.categoria_titulacion && { categoria_titulacion: dashboardFilters.categoria_titulacion }),
      ...(dashboardFilters?.categoria_centro && { categoria_centro: dashboardFilters.categoria_centro }),
      ...(dashboardFilters?.funcion_publica !== undefined && { funcion_publica: dashboardFilters.funcion_publica }),
      ...((dashboardFilters as any)?.estatus_funcionario && { estatus_funcionario: (dashboardFilters as any).estatus_funcionario }),
      ...((dashboardFilters as any)?.edad_laboral_min !== undefined && { edad_laboral_min: (dashboardFilters as any).edad_laboral_min }),
      ...((dashboardFilters as any)?.edad_laboral_max !== undefined && { edad_laboral_max: (dashboardFilters as any).edad_laboral_max }),
      ...((dashboardFilters as any)?.años_servicio_min !== undefined && { años_servicio_min: (dashboardFilters as any).años_servicio_min }),
      ...((dashboardFilters as any)?.años_servicio_max !== undefined && { años_servicio_max: (dashboardFilters as any).años_servicio_max }),
      ...((dashboardFilters as any)?.años_restantes_jubilacion_min !== undefined && { años_restantes_jubilacion_min: (dashboardFilters as any).años_restantes_jubilacion_min }),
      ...((dashboardFilters as any)?.años_restantes_jubilacion_max !== undefined && { años_restantes_jubilacion_max: (dashboardFilters as any).años_restantes_jubilacion_max }),
    };

    return filters;
  }, [dashboardFilters, searchTerm]);

  const {
    data: profesionales = [],
    isLoading,
    error,
    refetch,
  } = useProfesionales(combinedQueryFilters);

  // ... (roleFilteredProfesionales, getFilterStats, filteredProfesionales, sortedFilteredProfesionales, handleEditState, etc. sin cambios)

  // Aplicar primero filtros de rol (restricciones por centro para directivos)
  const roleFilteredProfesionales = filterProfessionalsData((profesionales || []) as Professional[]);

  // Obtener estadísticas de filtrado
  const filterStats = getFilterStats((profesionales || []) as Professional[], roleFilteredProfesionales, 'profesionales');

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
    setSearchTerm("");
    // Llamamos al método del padre para limpiar los filtros de selección múltiple
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
  const hasActiveFilters =
    searchTerm ||
    // Chequear filtros Multi-Select (arrays)
    isArrayActive(dashboardFilters?.area_profesional) ||
    isEstadoActive(dashboardFilters?.estado_solicitud) ||
    isArrayActive(dashboardFilters?.provincia) ||
    isArrayActive(dashboardFilters?.genero) ||
    isArrayActive(dashboardFilters?.tipo_sector) ||
    isArrayActive(dashboardFilters?.distrito) ||
    isArrayActive(dashboardFilters?.distrito_sanitario) ||
    isArrayActive(dashboardFilters?.año_graduacion) ||
    isArrayActive(dashboardFilters?.pais_formacion) ||
    isArrayActive(dashboardFilters?.institucion) ||
    isArrayActive(dashboardFilters?.centro_id) ||
    // Chequear otros filtros de Dashboard
    dashboardFilters?.edad_minima !== undefined ||
    dashboardFilters?.edad_maxima !== undefined ||
    !!dashboardFilters?.centro_nombre ||
    !!dashboardFilters?.lugar_trabajo ||
    !!dashboardFilters?.categoria_titulacion ||
    !!dashboardFilters?.categoria_centro ||
    dashboardFilters?.funcion_publica !== undefined ||
    (dashboardFilters as any)?.estatus_funcionario !== undefined ||
    dashboardFilters?.vencimiento_proximo ||
    dashboardFilters?.carnet_vencido ||
    (dashboardFilters?.prioridad_renovacion && dashboardFilters.prioridad_renovacion !== "all");

  // Helper para mostrar los badges de arrays
  const ArrayBadges = ({ title, arr }: { title: string; arr?: string[] | number[] }) => {
    if (!arr || arr.length === 0) return null;
    return (
      <>
        {arr.map((item, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="bg-guinea-light-teal text-guinea-dark-teal"
          >
            {title}: {item}
          </Badge>
        ))}
      </>
    );
  };

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
            <CardContent className="pt-0 flex flex-wrap gap-2">
              {searchTerm && (
                <Badge
                  variant="secondary"
                  className="bg-guinea-light-teal text-guinea-dark-teal"
                >
                  Búsqueda: {searchTerm}
                </Badge>
              )}

              {/* BADGES PARA MULTI-SELECT (ARRAYS) */}
              {ArrayBadges({ title: "Área", arr: dashboardFilters?.area_profesional })}
              {ArrayBadges({ title: "Provincia", arr: dashboardFilters?.provincia })}
              {ArrayBadges({ title: "Género", arr: dashboardFilters?.genero })}
              {ArrayBadges({ title: "Tipo Sector", arr: dashboardFilters?.tipo_sector })}
              {ArrayBadges({ title: "Distrito Sanitario", arr: dashboardFilters?.distrito_sanitario })}
              {ArrayBadges({ title: "Distrito", arr: dashboardFilters?.distrito })}
              {ArrayBadges({ title: "País Formación", arr: dashboardFilters?.pais_formacion })}
              {ArrayBadges({ title: "Institución", arr: dashboardFilters?.institucion })}
              {ArrayBadges({ title: "Año Graduación", arr: dashboardFilters?.año_graduacion })}
              {ArrayBadges({
                title: "Estado Solicitud",
                arr: dashboardFilters?.estado_solicitud?.filter(e => e !== 'Aprobado'),
              })}

              {/* BADGES PARA OTROS FILTROS (VALOR ÚNICO/RANGO) */}
              {(dashboardFilters?.edad_minima !== undefined || dashboardFilters?.edad_maxima !== undefined) && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Edad: {dashboardFilters?.edad_minima ?? 'Mín'} - {dashboardFilters?.edad_maxima ?? 'Máx'}
                </Badge>
              )}
              {dashboardFilters?.funcion_publica !== undefined && (
                <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
                  Función Pública: {dashboardFilters.funcion_publica ? 'Sí' : 'No'}
                </Badge>
              )}
              {/* Agregue aquí más badges de filtros de valor único si es necesario */}

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
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="flex items-center space-x-2">
                {/* Nota: El título ahora es genérico ya que el filtro de estado viene del dashboard */}
                <span>Profesionales</span>
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
                    // Serializa SOLO el searchTerm aquí, ya que el resto de filtros son del dashboard
                    url.searchParams.set('search', encodeURIComponent(searchTerm));
                    navigator.clipboard.writeText(url.toString());
                    toast({ title: 'Enlace copiado', description: 'Filtros listos para compartir.' });
                  }}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Compartir filtros
                </Button>

                {/* ¡BLOQUE DE SELECTORES ELIMINADO! La lógica de filtros de selección (Área, Provincia, Género, Sector, Estado) se ha movido al componente DashboardFilters. */}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Indicador de restricciones de datos */}
            <DataRestrictionIndicator
              dataType="profesionales"
              originalCount={(profesionales || []).length}
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