import { useState } from "react";
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
} from "lucide-react";
import {
  useBuscarCentros,
  useCentrosSalud,
  useProfesionalesPorCentro,
} from "@/hooks/useCentrosSalud";
import { useDistritosSanitarios } from "@/hooks/useDistritosSanitarios";
import { useToast } from "@/hooks/use-toast";

const HealthCenters = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDistrito, setSelectedDistrito] = useState("");
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCenter, setEditingCenter] = useState<any>(null);
  const [filterArea, setFilterArea] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  const { data: distritosSanitarios = [] } = useDistritosSanitarios();
  const { crearCentroMutation, actualizarCentroMutation } = useCentrosSalud();
  const { toast } = useToast();

  const {
    data: centros = [],
    isLoading,
    isError,
    error,
  } = useBuscarCentros({
    nombreParcial: searchTerm || undefined,
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

  const categorias = [
    "HOSPITAL",
    "CLINICA",
    "CENTRO DE SALUD",
    "CONSULTORIO",
    "FARMACIA",
    "LABORATORIO",
  ];
  const sectores = ["Público", "Privado", "Mixto", "ONG"];
  const areasProf = [
    "MEDICINA GENERAL",
    "ENFERMERÍA",
    "FARMACIA",
    "LABORATORIO",
    "RADIOLOGÍA",
    "ODONTOLOGÍA",
  ];
  const estadosSolicitud = [
    "Pendiente",
    "Aprobado",
    "Rechazado",
    "En Revisión",
  ];

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

  // Excel export functionality
  const exportCentersToExcel = () => {
    try {
      // Create worksheet data
      const worksheetData = [
        // Header row
        [
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
        ],
        // Data rows
        ...centros.map((centro) => [
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
        ]),
      ];

      // Create CSV content
      const csvContent = worksheetData
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `Centros_Salud_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportación exitosa",
        description: `Se ha descargado la lista de ${centros.length} centros de salud.`,
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Error en la exportación",
        description: "No se pudo exportar la lista. Intente nuevamente.",
        variant: "destructive",
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
    });
    setShowEditDialog(false);
    setEditingCenter(null);
  };

  if (selectedCenter) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setSelectedCenter(null)}>
            ← Volver a centros
          </Button>
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profesionales del centro */}
        <Card>
          <CardHeader>
            <CardTitle>
              Profesionales Asignados ({profesionalesDelCentro.length})
            </CardTitle>
            <div className="flex space-x-4">
              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las áreas</SelectItem>
                  {areasProf.map((area) => (
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
                  {estadosSolicitud.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profesionalesDelCentro.map((prof) => (
                <div key={prof.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{prof.nombre_completo}</h4>
                      <p className="text-sm text-gray-600">
                        {prof.area_profesional}
                      </p>
                      <p className="text-sm text-gray-500">{prof.telefono}</p>
                    </div>
                    <Badge
                      variant={
                        prof.estado_solicitud === "Aprobado"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {prof.estado_solicitud}
                    </Badge>
                  </div>
                </div>
              ))}
              {profesionalesDelCentro.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No hay profesionales asignados a este centro con los filtros
                  aplicados.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialog para editar centro */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Centro de Salud</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditCenter(new FormData(e.currentTarget));
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
                  disabled={actualizarCentroMutation.isPending}
                >
                  {actualizarCentroMutation.isPending
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

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Total Centros</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {centros.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Más estadísticas... */}
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
          : centros.map((centro) => (
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
                        <span>{centro.total_profesionales} profesionales</span>
                      </div>
                      <Badge className={getSectorColor(centro.sector)}>
                        {centro.sector}
                      </Badge>
                    </div>

                    {centro.distrito_sanitario && (
                      <div className="text-sm text-gray-600">
                        <strong>Distrito Sanitario:</strong>{" "}
                        {centro.distrito_sanitario}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => setSelectedCenter(centro)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
};

export default HealthCenters;
