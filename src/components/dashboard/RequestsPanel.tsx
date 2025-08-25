import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Eye,
  Edit,
  Save,
  X,
  RefreshCw,
  MoreVertical,
  Download,
  ChevronDown,
} from "lucide-react";
import { useProfesionales, type Profesional } from "@/hooks/useProfesionales";
import { useProfesionalesMutations } from "@/hooks/useProfesionalesMutations";
import { useToast } from "@/hooks/use-toast";
import { useCarnetGeneration } from "@/hooks/useCarnetGeneration";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Importamos el nuevo modal y los componentes de generación de PDF
import NewProfessionalModal from "@/components/dashboard/NewProfessionalModal";
import ApprovalLetter from "@/components/registration/ApprovalLetter"; // Para generación oculta
// PDFSummary ya no se importa ni se usa aquí

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Importaciones necesarias para la nueva lógica
import { supabase } from "@/lib/supabaseClient"; // Asegúrate de que esta ruta sea correcta


// Definimos los estados válidos y su orden para el flujo
const STATUS_ORDER = [
  "Recibido",
  "Revisando",
  "Pendiente de Firma",
  "Aprobado",
  "Rechazado",
];

interface RequestsPanelProps {
  userRole: string;
  initialStatusFilter?: string;
  onSelectProfessional?: (professional: Profesional) => void;
}

const RequestsPanel = ({
  userRole,
  initialStatusFilter,
  onSelectProfessional,
}: RequestsPanelProps) => {
  const [statusFilter, setStatusFilter] = useState(
    initialStatusFilter || "Recibido",
  );
  const [editingStates, setEditingStates] = useState<Record<string, string>>(
    {},
  );
  const [rejectionReasons, setRejectionReasons] = useState<
    Record<string, string>
  >({});

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [bulkUpdateStatus, setBulkUpdateStatus] = useState<string>("");
  const [bulkRejectionReason, setBulkRejectionReason] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfessionalForModal, setSelectedProfessionalForModal] =
    useState<Profesional | null>(null);

  const hiddenPdfContainerRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const { updateProfesional } = useProfesionalesMutations();
  const { generateCarnetAfterStatusChange, isGenerating } = useCarnetGeneration();

  // Excel export functionality
  const exportRequestsToExcel = () => {
    try {
      // Create worksheet data
      const worksheetData = [
        // Header row
        [
          "ID",
          "Nombre Completo",
          "Área Profesional",
          "Estado Solicitud",
          "Provincia",
          "Teléfono",
          "Email",
          "Fecha Solicitud",
          "Fecha Graduación",
          "Universidad",
          "Lugar de Trabajo",
          "Motivo Rechazo",
        ],
        // Data rows
        ...filteredRequests.map((request) => [
          request.id || "",
          request.nombre_completo || "",
          request.area_profesional || "",
          request.estado_solicitud || "",
          request.provincia || "",
          request.telefono || "",
          request.email || "",
          request.created_at
            ? new Date(request.created_at).toLocaleDateString("es-ES")
            : "",
          request.fecha_graduacion
            ? new Date(request.fecha_graduacion).toLocaleDateString("es-ES")
            : "",
          request.universidad || "",
          request.lugar_trabajo || "",
          request.motivo_rechazo || "",
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
        `Solicitudes_${statusFilter}_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportación exitosa",
        description: `Se ha descargado la lista de ${filteredRequests.length} solicitudes.`,
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

  useEffect(() => {
    console.log(
      "RequestsPanel: initialStatusFilter received in useEffect:",
      initialStatusFilter,
    );
    if (
      initialStatusFilter !== undefined &&
      initialStatusFilter !== statusFilter
    ) {
      setStatusFilter(initialStatusFilter);
    } else if (
      initialStatusFilter === undefined &&
      statusFilter !== "Recibido"
    ) {
      setStatusFilter("Recibido");
    }
    setStartDate("");
    setEndDate("");
  }, [initialStatusFilter]);

  const queryFilters = useMemo(() => {
    const filters: { [key: string]: any } = {
      estado_solicitud: statusFilter === "todos" ? "" : statusFilter,
    };
    if (startDate) {
      filters.fecha_solicitud_gte = startDate;
    }
    if (endDate) {
      filters.fecha_solicitud_lte = endDate;
    }
    console.log("RequestsPanel: Query filters for useProfesionales:", filters);
    return filters;
  }, [statusFilter, startDate, endDate]);

  const {
    data: profesionales = [],
    isLoading,
    refetch,
    error,
  } = useProfesionales(queryFilters);

  const filteredRequests = useMemo(() => {
    if (statusFilter === "todos") {
      return profesionales.filter((req) => req.estado_solicitud !== "Aprobado");
    }
    return profesionales;
  }, [profesionales, statusFilter]);

  console.log(
    "Total professionals from DB (filtered by hook):",
    profesionales.length,
  );
  console.log(
    "Filtered requests (non-approved, post-hook):",
    filteredRequests.length,
  );
  console.log("Applied status filter:", statusFilter);

  const getAvailableStatusOptions = useCallback(
    (currentStatus: string | undefined) => {
      const currentStatusIndex = STATUS_ORDER.indexOf(
        currentStatus || "Recibido",
      );
      const options = [
        "Revisando",
        "Pendiente de Firma",
        "Aprobado",
        "Rechazado",
      ];

      return options.filter((option) => {
        const optionIndex = STATUS_ORDER.indexOf(option);

        if (currentStatus === "Recibido" && option === "Aprobado") return false;

        if (optionIndex < currentStatusIndex && option !== "Rechazado") {
          return false;
        }
        return true;
      });
    },
    [],
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Revisando":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Pendiente de Firma":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "Rechazado":
        return "bg-red-100 text-red-800 border-red-300";
      case "Aprobado":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Carnet generation is now handled automatically by the useProfesionalesMutations hook
  // when the status changes to "Pendiente de Firma"

  const handleEditState = (requestId: string, currentState: string) => {
    setEditingStates((prev) => ({
      ...prev,
      [requestId]: currentState,
    }));
    setRejectionReasons((prev) => {
      const newReasons = { ...prev };
      delete newReasons[requestId];
      return newReasons;
    });
  };

  const handleSaveState = async (requestId: string) => {
    const newState = editingStates[requestId];
    if (!newState) return;

    const currentProfesional = profesionales.find((p) => p.id === requestId);
    const currentStatus = currentProfesional?.estado_solicitud || "Recibido";

    const availableOptions = getAvailableStatusOptions(currentStatus);
    if (!availableOptions.includes(newState) && newState !== currentStatus) {
      if (currentStatus === "Recibido" && newState === "Aprobado") {
        toast({
          title: "Error de Flujo",
          description:
            "No se puede pasar de 'Recibido' a 'Aprobado' directamente. Debe pasar por 'Pendiente de Firma'.",
          variant: "destructive",
        });
        return;
      }
    }

    if (newState === "Rechazado" && !rejectionReasons[requestId]) {
      toast({
        title: "Motivo de Rechazo Requerido",
        description: "Debe introducir un motivo si el estado es 'Rechazado'.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Updating request state:", requestId, "to:", newState);

      await updateProfesional.mutateAsync({
        id: requestId,
        updates: {
          estado_solicitud: newState,
          fecha_revision:
            newState !== "Recibido" &&
            newState !== "Revisando" &&
            newState !== "Rechazado"
              ? new Date().toISOString().split("T")[0]
              : null,
          fecha_aprobacion:
            newState === "Aprobado"
              ? new Date().toISOString().split("T")[0]
              : null,
          revisor_solicitud: newState !== "Recibido" ? "Sistema" : null,
          motivo_rechazo:
            newState === "Rechazado" ? rejectionReasons[requestId] : null,
        },
      });

      // Carnet generation is now handled automatically by the mutation hook

      setEditingStates((prev) => {
        const newStates = { ...prev };
        delete newStates[requestId];
        return newStates;
      });
      setRejectionReasons((prev) => {
        const newReasons = { ...prev };
        delete newReasons[requestId];
        return newReasons;
      });

      await refetch();

      toast({
        title: "Estado actualizado",
        description: `El estado de la solicitud ha sido actualizado a ${newState}`,
      });
    } catch (error) {
      console.error("Error updating request state:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la solicitud",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = (requestId: string) => {
    setEditingStates((prev) => {
      const newStates = { ...prev };
      delete newStates[requestId];
      return newStates;
    });
    setRejectionReasons((prev) => {
      const newReasons = { ...prev };
      delete newReasons[requestId];
      return newReasons;
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("es-ES");
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Datos actualizados",
        description: "La lista de solicitudes se ha actualizado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos",
        variant: "destructive",
      });
    }
  };

  // --- Lógica de Selección Masiva ---
  const handleCheckboxChange = (requestId: string, isChecked: boolean) => {
    setSelectedRequestIds((prev) => {
      if (isChecked) {
        return [...prev, requestId];
      } else {
        return prev.filter((id) => id !== requestId);
      }
    });
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      const allIds = filteredRequests.map((req) => req.id);
      setSelectedRequestIds(allIds);
    } else {
      setSelectedRequestIds([]);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkUpdateStatus) {
      toast({
        title: "Estado Requerido",
        description: "Debe seleccionar un estado para la actualización masiva.",
        variant: "destructive",
      });
      return;
    }

    if (bulkUpdateStatus === "Rechazado" && !bulkRejectionReason) {
      toast({
        title: "Motivo de Rechazo Requerido",
        description:
          "Debe introducir un motivo si el estado es 'Rechazado' en la actualización masiva.",
        variant: "destructive",
      });
      return;
    }

    if (selectedRequestIds.length === 0) {
      toast({
        title: "Sin Seleccionar",
        description: "No hay solicitudes seleccionadas para actualizar.",
        variant: "default",
      });
      return;
    }

    const updates = selectedRequestIds.map(async (id) => {
      const currentProfesional = profesionales.find((p) => p.id === id);
      const currentStatus = currentProfesional?.estado_solicitud || "Recibido";

      const availableOptions = getAvailableStatusOptions(currentStatus);
      if (
        !availableOptions.includes(bulkUpdateStatus) &&
        bulkUpdateStatus !== currentStatus
      ) {
        if (currentStatus === "Recibido" && bulkUpdateStatus === "Aprobado") {
          console.warn(
            `Saltando actualización para ${id}: No se puede pasar de 'Recibido' a 'Aprobado'.`,
          );
          return { id, success: false, reason: "Invalid status transition" };
        }
      }

      try {
        await updateProfesional.mutateAsync({
          id: id,
          updates: {
            estado_solicitud: bulkUpdateStatus,
            fecha_revision:
              bulkUpdateStatus !== "Recibido" &&
              bulkUpdateStatus !== "Revisando" &&
              bulkUpdateStatus !== "Rechazado"
                ? new Date().toISOString().split("T")[0]
                : null,
            fecha_aprobacion:
              bulkUpdateStatus === "Aprobado"
                ? new Date().toISOString().split("T")[0]
                : null,
            revisor_solicitud:
              bulkUpdateStatus !== "Recibido" ? "Sistema" : null,
            motivo_rechazo:
              bulkUpdateStatus === "Rechazado" ? bulkRejectionReason : null,
          },
        });
        
        // Carnet generation is now handled automatically by the mutation hook
        
        return { id, success: true };
      } catch (error) {
        console.error(`Error updating professional ${id}:`, error);
        return { id, success: false, reason: (error as Error).message };
      }
    });

    const results = await Promise.all(updates);
    const successfulUpdates = results.filter((r) => r.success).length;
    const failedUpdates = results.filter((r) => !r.success).length;

    if (successfulUpdates > 0) {
      toast({
        title: "Actualización Masiva Completa",
        description: `Se actualizaron ${successfulUpdates} solicitudes. ${failedUpdates > 0 ? `(${failedUpdates} fallaron o fueron omitidas por reglas de flujo).` : ""}`,
      });
      setSelectedRequestIds([]);
      setBulkUpdateStatus("");
      setBulkRejectionReason("");
      await refetch();
    } else {
      toast({
        title: "Actualización Fallida",
        description:
          "Ninguna solicitud pudo ser actualizada. Revise las reglas de flujo o los errores.",
        variant: "destructive",
      });
    }
  };

  // --- Lógica para abrir el modal de detalles ---
  const handleOpenDetailsModal = (professional: Profesional) => {
    setSelectedProfessionalForModal(professional);
    setIsModalOpen(true);
  };

  // --- Lógica de Generación de PDFs Ocultos (para descargas directas) ---
  const generatePdfFromHiddenElement = useCallback(
    async (
      professional: Profesional,
      Component: React.ComponentType<{
        formData: any;
        onDownload?: () => void;
      }>, // Added onDownload as optional
      elementId: string,
      filenamePrefix: string,
    ) => {
      if (!hiddenPdfContainerRef.current) {
        toast({
          title: "Error",
          description: "Contenedor de PDF no disponible.",
          variant: "destructive",
        });
        return {
          id: professional.id,
          success: false,
          reason: "Hidden container not found",
        };
      }

      const formDataForDocuments = {
        ...professional,
        nombre: professional.nombre || "",
        apellidos: professional.apellidos || "",
        numero_dip: professional.numero_dip || "",
        numero_pasaporte: professional.numero_pasaporte || "",
        area_profesional: professional.area_profesional || "",
        especialidad: professional.especialidad || "No especificada",
        titulacion_especifica_1: professional.titulacion_especifica_1 || "",
        institucion_1: professional.institucion_1 || "",
        pais_formacion_1: professional.pais_formacion_1 || "",
        genero: professional.genero || "",
        nacionalidad: professional.nacionalidad || "",
        fecha_nacimiento: professional.fecha_nacimiento
          ? new Date(professional.fecha_nacimiento).toLocaleDateString("es-ES")
          : "N/A",
        edad: professional.fecha_nacimiento
          ? Math.floor(
              (new Date().getTime() -
                new Date(professional.fecha_nacimiento).getTime()) /
                31557600000,
            )
          : "N/A",
        telefono: professional.telefono || "",
        domicilio: professional.domicilio || "",
        provincia: professional.provincia || "",
        distrito: professional.distrito || "",
        categoria_titulacion: professional.categoria_titulacion || "",
        periodo_formacion: professional.periodo_formacion || "",
        situacion_laboral: professional.situacion_laboral || "",
        nombre_centro: professional.nombre_centro || "",
        categoria_centro: professional.categoria_centro || "",
        tipo_sector: professional.tipo_sector || "",
        distrito_sanitario: professional.distrito_sanitario || "",
        pertenece_brigada_medica: professional.pertenece_brigada_medica,
        tipo_cooperacion: professional.tipo_cooperacion || "",
        codigo_expediente: professional.codigo_expediente,
        foto_carnet_base64: professional.foto_carnet_base64,
        codigo_barras: professional.url_codigo_barras,
        foto_carnet: professional.foto_carnet, // Ensure this property is passed
      };

      const tempDiv = document.createElement("div");
      tempDiv.id = elementId; // Using the unique ID passed
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = "210mm"; // A4 width
      tempDiv.style.height = "297mm"; // A4 height
      tempDiv.style.overflow = "hidden"; // Prevents scrollbars in temp div
      hiddenPdfContainerRef.current.appendChild(tempDiv);

      let root = null;
      if ((window as any).ReactDOM && (window as any).ReactDOM.createRoot) {
        root = (window as any).ReactDOM.createRoot(tempDiv);
        root.render(
          <Component formData={formDataForDocuments} onDownload={() => {}} />,
        ); // Pass onDownload
      } else if ((window as any).ReactDOM) {
        // Fallback for React 17 or older versions
        (window as any).ReactDOM.render(
          <Component formData={formDataForDocuments} onDownload={() => {}} />,
          tempDiv,
        ); // Pass onDownload
      } else {
        console.error(
          "ReactDOM no está disponible globalmente. La generación de PDF oculta puede fallar.",
        );
        toast({
          title: "Error",
          description: "Configuración de React incompleta para PDF.",
          variant: "destructive",
        });
        if (
          hiddenPdfContainerRef.current &&
          tempDiv.parentNode === hiddenPdfContainerRef.current
        ) {
          hiddenPdfContainerRef.current.removeChild(tempDiv);
        }
        return {
          id: professional.id,
          success: false,
          reason: "ReactDOM not global",
        };
      }

      // Increased timeout for better rendering reliability
      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(
          `${filenamePrefix}-${professional.nombre || ""}-${professional.apellidos?.replace(/\s+/g, "-") || "profesional"}.pdf`,
        );
        toast({
          title: "Descarga Exitosa",
          description: `"${filenamePrefix}" para ${professional.nombre} ha sido generado y descargado.`,
        });
        return { id: professional.id, success: true };
      } catch (error) {
        console.error(`Error generating PDF for ${professional.id}:`, error);
        toast({
          title: "Error de Generación",
          description: `Hubo un problema al generar el ${filenamePrefix} para ${professional.nombre}.`,
          variant: "destructive",
        });
        return {
          id: professional.id,
          success: false,
          reason: (error as Error).message,
        };
      } finally {
        if (root) {
          root.unmount();
        } else {
          (window as any).ReactDOM.unmountComponentAtNode(tempDiv);
        }
        if (
          hiddenPdfContainerRef.current &&
          tempDiv.parentNode === hiddenPdfContainerRef.current
        ) {
          hiddenPdfContainerRef.current.removeChild(tempDiv);
        }
      }
    },
    [],
  );

  const handleDownloadSingleLetter = async (professional: Profesional) => {
    // Added async
    toast({
      // Added toast for user feedback
      title: "Generando Carta",
      description: `Por favor, espere mientras se genera la carta para ${professional.nombre || "el profesional"}...`,
      duration: 3000,
    });
    const result = await generatePdfFromHiddenElement(
      professional,
      ApprovalLetter,
      `hidden-approval-letter-content-${professional.id}`,
      "carta-aprobacion",
    ); // Unique ID for each call
    if (result.success) {
      // Added success/failure toast
      toast({
        title: "Descarga Exitosa",
        description: `Carta para ${professional.nombre || "el profesional"} generada y descargada.`,
      });
    } else {
      toast({
        title: "Error de Descarga",
        description: `No se pudo descargar la carta para ${professional.nombre || "el profesional"}. ${result.reason || ""}`,
        variant: "destructive",
      });
    }
  };

  // Removed handleDownloadSingleSummary

  const handleDownloadSingleCarnet = (professional: Profesional) => {
    if (professional.url_carnet) {
      window.open(professional.url_carnet, "_blank");
      toast({
        title: "Carnet Abierto",
        description:
          "El carnet se ha abierto en una nueva pestaña para su visualización/descarga.",
      });
    } else {
      toast({
        title: "Carnet No Disponible",
        description:
          "La URL del carnet no está disponible para este profesional.",
        variant: "destructive",
      });
    }
  };

  // --- Funciones para Descarga Masiva ---
  const handleBulkDownloadCarnets = () => {
    const pendingFirmSelected = filteredRequests.filter(
      (req) =>
        selectedRequestIds.includes(req.id) &&
        req.estado_solicitud === "Pendiente de Firma" &&
        req.url_carnet,
    );

    if (pendingFirmSelected.length === 0) {
      toast({
        title: "Advertencia",
        description:
          "No hay carnets seleccionados disponibles para descarga masiva en estado 'Pendiente de Firma'.",
      });
      return;
    }

    toast({
      title: "Iniciando Descarga Masiva",
      description: `Abriendo ${pendingFirmSelected.length} carnets... Puede que su navegador requiera permiso.`,
    });

    pendingFirmSelected.forEach((professional) => {
      window.open(professional.url_carnet, "_blank");
    });
    setSelectedRequestIds([]);
  };

  const handleBulkDownloadDocuments = async (
    Component: React.ComponentType<{ formData: any; onDownload?: () => void }>, // Added onDownload as optional
    elementIdPrefix: string,
    filenamePrefix: string,
    maxDownloads: number = 5,
  ) => {
    const pendingFirmSelected = filteredRequests.filter(
      (req) =>
        selectedRequestIds.includes(req.id) &&
        req.estado_solicitud === "Pendiente de Firma",
    );

    if (pendingFirmSelected.length === 0) {
      toast({
        title: "Advertencia",
        description: `No hay solicitudes seleccionadas en estado 'Pendiente de Firma' para descargar ${filenamePrefix}.`,
      });
      return;
    }

    if (pendingFirmSelected.length > maxDownloads) {
      toast({
        title: "Demasiadas Solicitudes",
        description: `Se han seleccionado ${pendingFirmSelected.length} solicitudes. Por favor, selecciona un máximo de ${maxDownloads} para la descarga masiva de ${filenamePrefix}s para evitar problemas de rendimiento.`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Preparando Descarga Masiva",
      description: `Generando ${filenamePrefix}s para ${pendingFirmSelected.length} solicitudes... Esto puede tardar.`,
      duration: 5000,
    }); // Added duration

    let successfulDownloads = 0;
    for (const professional of pendingFirmSelected) {
      const result = await generatePdfFromHiddenElement(
        professional,
        Component,
        `${elementIdPrefix}-${professional.id}`, // Unique ID for each render
        filenamePrefix,
      );
      if (result.success) {
        successfulDownloads++;
      }
      // Small pause to avoid overwhelming the browser
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    toast({
      title: "Descarga Masiva Completa",
      description: `Se descargaron ${successfulDownloads} ${filenamePrefix}s exitosamente.`,
    });
    setSelectedRequestIds([]);
  };

  const isAllSelected =
    filteredRequests.length > 0 &&
    selectedRequestIds.length === filteredRequests.length;
  const isIndeterminate =
    selectedRequestIds.length > 0 &&
    selectedRequestIds.length < filteredRequests.length;

  const allSelectedArePendingFirm =
    selectedRequestIds.length > 0 &&
    selectedRequestIds.every(
      (id) =>
        filteredRequests.find((req) => req.id === id)?.estado_solicitud ===
        "Pendiente de Firma",
    );

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">
            Error al cargar solicitudes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Error: {error.message}</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando solicitudes...</CardTitle>
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Gestión de Solicitudes</span>
              <Badge variant="outline" className="ml-2">
                {filteredRequests.length} solicitudes
              </Badge>
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Fecha Inicio"
                  className="w-auto"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Fecha Fin"
                  className="w-auto"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="Recibido">Recibido</SelectItem>
                    <SelectItem value="Revisando">Revisando</SelectItem>
                    <SelectItem value="Pendiente de Firma">
                      Pendiente de Firma
                    </SelectItem>
                    <SelectItem value="Rechazado">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportRequestsToExcel}
                  className="flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Exportar Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedRequestIds.length > 0 && (
            <div className="flex items-center justify-between p-3 mb-4 bg-gray-50 border rounded-md shadow-sm">
              <span className="text-sm font-medium">
                {selectedRequestIds.length} solicitudes seleccionadas
              </span>
              <div className="flex items-center space-x-3">
                <Select
                  value={bulkUpdateStatus}
                  onValueChange={setBulkUpdateStatus}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Cambiar estado a..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStatusOptions(undefined).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {bulkUpdateStatus === "Rechazado" && (
                  <Input
                    placeholder="Motivo de rechazo masivo"
                    value={bulkRejectionReason}
                    onChange={(e) => setBulkRejectionReason(e.target.value)}
                    className="w-64"
                  />
                )}
                <Button
                  onClick={handleBulkUpdate}
                  disabled={
                    updateProfesional.isLoading ||
                    !bulkUpdateStatus ||
                    (bulkUpdateStatus === "Rechazado" && !bulkRejectionReason)
                  }
                >
                  Aplicar <Save className="w-4 h-4 ml-2" />
                </Button>

                {allSelectedArePendingFirm && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Descargar Seleccionados
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={handleBulkDownloadCarnets}>
                        <Download className="w-4 h-4 mr-2" /> Descargar Carnets
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          handleBulkDownloadDocuments(
                            ApprovalLetter,
                            "hidden-bulk-approval-letter",
                            "carta-aprobacion",
                            5,
                          )
                        }
                      >
                        <Download className="w-4 h-4 mr-2" /> Descargar Cartas
                        (Max 5)
                      </DropdownMenuItem>
                      {/* Removed bulk download for summary */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )}

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      indeterminate={isIndeterminate ? true : undefined}
                    />
                  </TableHead>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Area Profesional</TableHead>
                  <TableHead>Centro de Trabajo</TableHead>
                  <TableHead>Distrito Sanitario</TableHead>
                  <TableHead>Fecha Solicitud</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="text-lg font-medium">
                          {statusFilter === "todos"
                            ? "No hay solicitudes pendientes o activas en este momento."
                            : `No hay solicitudes con el estado: "${statusFilter}".`}
                        </p>
                        {startDate || endDate ? (
                          <p className="text-sm text-gray-400 mt-1">
                            Ajusta tu rango de fechas o los filtros.
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 mt-1">
                            Revisa el filtro de estado o los rangos de fecha.
                          </p>
                        )}
                        <Button
                          variant="link"
                          onClick={() => setStatusFilter("todos")}
                          className="mt-2"
                        >
                          Mostrar todos los estados
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-gray-50">
                      <TableCell className="w-[50px] text-center">
                        <Checkbox
                          checked={selectedRequestIds.includes(request.id)}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(request.id, !!checked)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {request.nombre_completo ||
                          `${request.nombre || ""} ${request.apellidos || ""}`.trim()}
                      </TableCell>
                      <TableCell>{request.area_profesional || "N/A"}</TableCell>
                      <TableCell>{request.nombre_centro || "N/A"}</TableCell>
                      <TableCell>
                        {request.distrito_sanitario || "N/A"}
                      </TableCell>
                      <TableCell>
                        {formatDate(
                          request.created_at || request.fecha_solicitud,
                        )}
                      </TableCell>
                      <TableCell>
                        {editingStates[request.id] !== undefined ? (
                          <div className="flex flex-col space-y-2">
                            <Select
                              value={editingStates[request.id]}
                              onValueChange={(value) => {
                                setEditingStates((prev) => ({
                                  ...prev,
                                  [request.id]: value,
                                }));
                                if (value !== "Rechazado") {
                                  setRejectionReasons((prev) => {
                                    const newReasons = { ...prev };
                                    delete newReasons[request.id];
                                    return newReasons;
                                  });
                                } else {
                                  setRejectionReasons((prev) => ({
                                    ...prev,
                                    [request.id]: prev[request.id] || "",
                                  }));
                                }
                              }}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableStatusOptions(
                                  request.estado_solicitud,
                                ).map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {editingStates[request.id] === "Rechazado" && (
                              <Textarea
                                placeholder="Motivo de rechazo..."
                                value={rejectionReasons[request.id] || ""}
                                onChange={(e) =>
                                  setRejectionReasons((prev) => ({
                                    ...prev,
                                    [request.id]: e.target.value,
                                  }))
                                }
                                className="mt-2 resize-y"
                              />
                            )}
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveState(request.id)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                disabled={
                                  updateProfesional.isLoading ||
                                  (editingStates[request.id] === "Rechazado" &&
                                    !rejectionReasons[request.id])
                                }
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancelEdit(request.id)}
                                className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Badge
                              className={`${getStatusColor(request.estado_solicitud || "Pendiente")} border`}
                            >
                              {request.estado_solicitud || "Pendiente"}
                            </Badge>
                            {(userRole === "SUPER_ADMINISTRADOR" ||
                              userRole === "REVISOR_SOLICITUDES") && (
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleEditState(
                                      request.id,
                                      request.estado_solicitud || "Pendiente",
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <span className="sr-only">
                                        Abrir menú
                                      </span>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleOpenDetailsModal(request)
                                      }
                                    >
                                      <Eye className="mr-2 h-4 w-4" /> Ver
                                      Detalles
                                    </DropdownMenuItem>

                                    {request.estado_solicitud ===
                                      "Pendiente de Firma" && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleDownloadSingleLetter(request)
                                          }
                                        >
                                          <Download className="mr-2 h-4 w-4" />{" "}
                                          Descargar Carta
                                        </DropdownMenuItem>
                                        {/* Removed single download for summary */}
                                        {request.url_carnet && (
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleDownloadSingleCarnet(
                                                request,
                                              )
                                            }
                                          >
                                            <Download className="mr-2 h-4 w-4" />{" "}
                                            Descargar Carnet
                                          </DropdownMenuItem>
                                        )}
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalles del Profesional */}
      {selectedProfessionalForModal && (
        <NewProfessionalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          professional={selectedProfessionalForModal}
        />
      )}

      {/* Contenedor oculto para la generación de PDFs (html2canvas necesita elementos en el DOM) */}
      <div
        ref={hiddenPdfContainerRef}
        style={{
          position: "fixed",
          left: "-9999px",
          top: "-9999px",
          width: "210mm",
          height: "297mm",
          overflow: "hidden",
          zIndex: -1,
        }}
      >
        {/* Los componentes para generar PDFs se renderizarán aquí temporalmente */}
      </div>
    </div>
  );
};

export default RequestsPanel;
