import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Send,
  Download,
} from "lucide-react"; // ¡Importado 'Send' aquí!
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Profesional } from "@/hooks/useProfesionales";
import { useToast } from "@/hooks/use-toast"; // Asegúrate de que esta importación sea correcta

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ProfessionalDetail from "@/components/dashboard/ProfessionalDetail.tsx"; // Asegúrate de que la ruta sea correcta

// Extender el tipo Profesional para incluir los campos calculados para las alertas
// Asegúrate de que 'fecha_caducidad' exista en tu tipo base 'Profesional'
interface ProfesionalAlert extends Profesional {
  diasRestantes: number;
  prioridad: "alta" | "media" | "baja" | "vencido";
  // fecha_caducidad ya debería estar en Profesional si lo usas directamente
}

interface RenewalAlertsProps {
  dashboardFilters?: {
    vencimiento_proximo?: boolean;
    carnet_vencido?: boolean;
    prioridad_renovacion?: "alta" | "media" | "baja" | "vencido" | "all";
  };
  // *** NUEVO PROP: Función para enviar la notificación SMS ***
  onSendSmsNotification: (
    profesionalId: string,
    telefono: string | null, // Puede ser nulo, por eso la validación
    nombreCompleto: string,
    fechaValidezCarnet: string | null, // Puede ser nulo
    tipoNotificacion: "manual_proximo" | "manual_vencido", // Tipos para notificaciones manuales
  ) => Promise<void>;
}

const RenewalAlerts = ({
  dashboardFilters,
  onSendSmsNotification,
}: RenewalAlertsProps) => {
  // ¡Añadido onSendSmsNotification aquí!
  console.log("RenewalAlerts component rendered.");
  console.log(
    "RenewalAlerts: Initial dashboardFilters received:",
    dashboardFilters,
  );

  const { toast } = useToast();

  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<
    ProfesionalAlert["prioridad"] | "all"
  >("all");
  const [selectedProfessional, setSelectedProfessional] =
    useState<ProfesionalAlert | null>(null);

  // useEffect para reaccionar a cambios en dashboardFilters y actualizar el estado interno
  useEffect(() => {
    console.log(
      "RenewalAlerts: Dashboard filters updated in useEffect:",
      dashboardFilters,
    );
    if (dashboardFilters) {
      if (dashboardFilters.prioridad_renovacion) {
        setSelectedPriorityFilter(dashboardFilters.prioridad_renovacion);
      } else if (dashboardFilters.vencimiento_proximo) {
        setSelectedPriorityFilter("alta");
      } else if (dashboardFilters.carnet_vencido) {
        setSelectedPriorityFilter("vencido");
      } else {
        setSelectedPriorityFilter("all");
      }
    } else {
      setSelectedPriorityFilter("all");
    }
  }, [dashboardFilters]);

  const calculateRenewalInfo = (
    professional: Profesional,
  ): ProfesionalAlert | null => {
    if (!professional.fecha_caducidad) {
      return null;
    }

    const today = new Date();
    const expiryDate = new Date(professional.fecha_caducidad);
    expiryDate.setHours(23, 59, 59, 999); // Asegura que la fecha de caducidad incluya todo el día

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let prioridad: "alta" | "media" | "baja" | "vencido";
    if (diffDays <= 0) {
      prioridad = "vencido";
    } else if (diffDays < 30) {
      prioridad = "alta";
    } else if (diffDays >= 30 && diffDays < 60) {
      prioridad = "media";
    } else {
      prioridad = "baja";
    }

    // Incluye vencidos y los próximos 90 días para mostrar en las alertas
    if (diffDays <= 90 || diffDays <= 0) {
      return {
        ...professional,
        diasRestantes: diffDays,
        prioridad: prioridad,
      };
    }
    return null;
  };

  const {
    data: professionalsData = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<ProfesionalAlert[]>({
    queryKey: ["renewalAlerts", dashboardFilters],
    queryFn: async () => {
      console.log(
        "RenewalAlerts: Starting Supabase data fetch with dashboardFilters:",
        dashboardFilters,
      );

      const today = new Date();
      let query = supabase.from("profesionales_sanitarios").select("*");

      query = query.eq("estado_solicitud", "Aprobado");

      if (dashboardFilters?.carnet_vencido) {
        const todayIso = today.toISOString().split("T")[0];
        query = query.lte("fecha_caducidad", todayIso);
        console.log(
          `RenewalAlerts: Applying carnet_vencido filter: fecha_caducidad <= ${todayIso}`,
        );
      } else if (dashboardFilters?.vencimiento_proximo) {
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + 30);
        const todayIso = today.toISOString().split("T")[0];
        const futureDateIso = futureDate.toISOString().split("T")[0];
        query = query
          .gte("fecha_caducidad", todayIso)
          .lte("fecha_caducidad", futureDateIso);
        console.log(
          `RenewalAlerts: Applying vencimiento_proximo filter: fecha_caducidad between ${todayIso} and ${futureDateIso}`,
        );
      } else {
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + 90);
        const futureDateIso = futureDate.toISOString().split("T")[0];
        query = query.lte("fecha_caducidad", futureDateIso);
        console.log(
          `RenewalAlerts: No specific dashboard filter, fetching fecha_caducidad <= ${futureDateIso}`,
        );
      }

      query = query.order("fecha_caducidad", { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching renewal alerts from Supabase:", error);
        throw error;
      }
      console.log(
        `Successfully fetched ${data ? data.length : 0} raw professionals from Supabase.`,
      );

      const processedAlerts: ProfesionalAlert[] = [];
      data.forEach((prof) => {
        const alertInfo = calculateRenewalInfo(prof);
        if (alertInfo) {
          processedAlerts.push(alertInfo);
        }
      });
      console.log(
        `Finished processing raw data. ${processedAlerts.length} alerts generated.`,
      );
      return processedAlerts;
    },
  });

  const filteredRenewalAlerts = professionalsData.filter((alert) => {
    if (selectedPriorityFilter === "all") {
      return true;
    }
    return alert.prioridad === selectedPriorityFilter;
  });
  console.log(
    `Displaying ${filteredRenewalAlerts.length} alerts after client-side filter by priority.`,
  );

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return "bg-red-100 text-red-800 border-red-200";
      case "media":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "baja":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "vencido":
        return "bg-gray-200 text-gray-700 border-gray-300 line-through";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleViewAll = (prioridad?: ProfesionalAlert["prioridad"] | "all") => {
    console.log(
      "RenewalAlerts: Dropdown filter changed to:",
      prioridad || "all",
    );
    setSelectedPriorityFilter(prioridad || "all");
  };

  const handleViewProfessionalDetail = (professional: ProfesionalAlert) => {
    console.log(
      "Opening professional detail for:",
      professional.id_profesional_unico,
    );
    setSelectedProfessional(professional);
  };

  // *** NUEVA FUNCIÓN LOCAL PARA LLAMAR AL PROP ***
  const handleSendNotificationClick = (professional: ProfesionalAlert) => {
    if (
      professional.telefono &&
      professional.id_profesional_unico &&
      professional.nombre_completo &&
      professional.fecha_caducidad
    ) {
      const tipo =
        professional.prioridad === "vencido"
          ? "manual_vencido"
          : "manual_proximo";
      // Llama a la función pasada por prop
      onSendSmsNotification(
        professional.id_profesional_unico,
        professional.telefono,
        professional.nombre_completo,
        professional.fecha_caducidad,
        tipo,
      );
    } else {
      alert(
        "No se puede enviar la notificación: Falta información de contacto (teléfono) o de identificación.",
      );
      console.warn(
        "Missing professional data for SMS notification:",
        professional,
      );
    }
  };

  // Excel export functionality
  const exportRenewalsToExcel = () => {
    try {
      // Create worksheet data
      const worksheetData = [
        // Header row
        [
          "ID Profesional",
          "Nombre Completo",
          "Área Profesional",
          "Teléfono",
          "Email",
          "Provincia",
          "Fecha Caducidad",
          "Días Restantes",
          "Prioridad",
          "Número Carnet",
          "Lugar de Trabajo",
        ],
        // Data rows
        ...filteredRenewalAlerts.map((alert) => [
          alert.id_profesional_unico || "",
          alert.nombre_completo || "",
          alert.area_profesional || "",
          alert.telefono || "",
          alert.email || "",
          alert.provincia || "",
          alert.fecha_caducidad
            ? new Date(alert.fecha_caducidad).toLocaleDateString("es-ES")
            : "",
          alert.diasRestantes,
          alert.prioridad,
          alert.numero_carnet_profesional || "",
          alert.lugar_trabajo || "",
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
        `Renovaciones_${selectedPriorityFilter}_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportación exitosa",
        description: `Se ha descargado la lista de ${filteredRenewalAlerts.length} alertas de renovación.`,
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

  console.log(
    `Component rendering complete. Is loading: ${isLoading}, Is error: ${isError}.`,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span>Alertas de Renovación</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-800"
            >
              {filteredRenewalAlerts.length} pendientes
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={exportRenewalsToExcel}
              className="flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Ver por:{" "}
                  {selectedPriorityFilter === "all"
                    ? "Todas"
                    : selectedPriorityFilter.charAt(0).toUpperCase() +
                      selectedPriorityFilter.slice(1)}{" "}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filtrar por Urgencia</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleViewAll("all")}>
                  Todas las alertas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewAll("alta")}>
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>{" "}
                    Alta Urgencia
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewAll("media")}>
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-2"></span>{" "}
                    Media Urgencia
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewAll("baja")}>
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>{" "}
                    Baja Urgencia
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewAll("vencido")}>
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-gray-500 mr-2"></span>{" "}
                    Vencidos
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <p className="text-center text-gray-500">Cargando alertas...</p>
        )}
        {isError && (
          <p className="text-center text-red-500">
            Error al cargar las alertas.
          </p>
        )}
        {!isLoading && !isError && filteredRenewalAlerts.length === 0 && (
          <p className="text-center text-gray-500">
            No hay alertas de renovación próximas con este filtro.
          </p>
        )}
        <div className="space-y-4">
          {filteredRenewalAlerts.map((alert) => (
            <Alert
              key={alert.id_profesional_unico}
              className={`${getPriorityColor(alert.prioridad)} cursor-pointer hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{alert.nombre_completo}</span>
                    <Badge variant="outline" className="text-xs">
                      {alert.area_profesional || "Sin profesión"}
                    </Badge>
                  </div>

                  <AlertDescription className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Vence:{" "}
                        {alert.fecha_caducidad
                          ? new Date(alert.fecha_caducidad).toLocaleDateString(
                              "es-ES",
                            )
                          : "N/A"}
                      </span>
                      <span className="font-medium">
                        {alert.diasRestantes <= 0
                          ? "(Vencido)"
                          : `(${alert.diasRestantes} días)`}
                      </span>
                    </div>

                    {alert.distrito_sanitario && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>Distrito: {alert.distrito_sanitario}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      {alert.telefono && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{alert.telefono}</span>
                        </div>
                      )}
                      {alert.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>{alert.email}</span>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </div>

                <div className="flex flex-col space-y-1 ml-4">
                  {" "}
                  {/* Añadido ml-4 para espacio */}
                  {/* Botón de Notificar SMS */}
                  {alert.telefono && ( // Solo muestra el botón si hay un número de teléfono
                    <Button
                      variant="default" // Puedes usar 'default', 'secondary', 'outline', etc.
                      size="sm"
                      className="flex items-center gap-1 text-xs"
                      onClick={() => handleSendNotificationClick(alert)}
                    >
                      <Send className="w-3 h-3" /> Notificar SMS
                    </Button>
                  )}
                  <Dialog
                    onOpenChange={(open) => {
                      if (!open) setSelectedProfessional(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleViewProfessionalDetail(alert)}
                      >
                        Ver Detalle
                      </Button>
                    </DialogTrigger>
                    {selectedProfessional && (
                      <DialogContent className="sm:max-w-[700px] h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detalles del Profesional</DialogTitle>
                          <DialogDescription>
                            Información completa de{" "}
                            {selectedProfessional.nombre_completo}.
                          </DialogDescription>
                        </DialogHeader>
                        <ProfessionalDetail
                          professional={selectedProfessional}
                          onClose={() => setSelectedProfessional(null)}
                        />
                      </DialogContent>
                    )}
                  </Dialog>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RenewalAlerts;
