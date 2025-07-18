import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  FileCheck,
  Clock,
  History,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Stamp,
  Send,
  AlertTriangle,
  Settings,
  BarChart3,
  Users,
  TrendingUp,
  Building2,
  Bell,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Import the new hooks
import {
  usePendingSignatures,
  useSignProfessional,
  useSignMultipleProfessionals,
  useRejectProfessional,
  type PendingSignature,
} from "@/hooks/usePendingSignatures";
import { useSignatureHistory } from "@/hooks/useSignatureHistory";

const MinisterialPanel = () => {
  const { toast } = useToast();

  // Database hooks
  const {
    data: pendingSignatures = [],
    isLoading: isLoadingPending,
    error: pendingError,
    refetch: refetchPending,
  } = usePendingSignatures();
  const {
    data: statusHistory = [],
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useSignatureHistory();
  const signProfessionalMutation = useSignProfessional();
  const signMultipleMutation = useSignMultipleProfessionals();
  const rejectProfessionalMutation = useRejectProfessional();

  // UI state
  const [selectedProfessional, setSelectedProfessional] =
    useState<PendingSignature | null>(null);
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>(
    [],
  );
  const [signatureReason, setSignatureReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [multiSignatureReason, setMultiSignatureReason] = useState("");

  // Dialog states
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isMultiSignDialogOpen, setIsMultiSignDialogOpen] = useState(false);

  // Settings
  const [autoNotifications, setAutoNotifications] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  // Filter pending signatures by urgency
  const filteredPendingSignatures = pendingSignatures.filter(
    (item) => urgencyFilter === "all" || item.urgencia === urgencyFilter,
  );

  // Statistics
  const ministerialStats = {
    totalPendientes: pendingSignatures.length,
    firmadosHoy: statusHistory.filter(
      (h) =>
        h.tipo === "approval" &&
        new Date(h.fecha).toDateString() === new Date().toDateString(),
    ).length,
    rechazadosHoy: statusHistory.filter(
      (h) =>
        h.tipo === "rejection" &&
        new Date(h.fecha).toDateString() === new Date().toDateString(),
    ).length,
    promedioTiempoFirma:
      pendingSignatures.length > 0
        ? `${Math.round(pendingSignatures.reduce((acc, p) => acc + p.dias_pendiente, 0) / pendingSignatures.length)} días`
        : "N/A",
    urgenciasAltas: pendingSignatures.filter((p) => p.urgencia === "Alta")
      .length,
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProfessionals(filteredPendingSignatures.map((p) => p.id));
    } else {
      setSelectedProfessionals([]);
    }
  };

  const handleSelectProfessional = (
    professionalId: string,
    checked: boolean,
  ) => {
    if (checked) {
      setSelectedProfessionals((prev) => [...prev, professionalId]);
    } else {
      setSelectedProfessionals((prev) =>
        prev.filter((id) => id !== professionalId),
      );
    }
  };

  // Action handlers
  const handleReviewProfessional = (professional: PendingSignature) => {
    setSelectedProfessional(professional);
    setIsReviewDialogOpen(true);
  };

  const handleSignProfessional = (professional: PendingSignature) => {
    setSelectedProfessional(professional);
    setIsSignDialogOpen(true);
  };

  const handleRejectProfessional = (professional: PendingSignature) => {
    setSelectedProfessional(professional);
    setIsRejectDialogOpen(true);
  };

  const handleMultipleSign = () => {
    if (selectedProfessionals.length === 0) {
      toast({
        title: "Selección requerida",
        description: "Debe seleccionar al menos un profesional para firmar.",
        variant: "destructive",
      });
      return;
    }
    setIsMultiSignDialogOpen(true);
  };

  const confirmSignature = () => {
    if (!selectedProfessional) return;

    signProfessionalMutation.mutate(
      { professionalId: selectedProfessional.id, reason: signatureReason },
      {
        onSuccess: () => {
          setIsSignDialogOpen(false);
          setSignatureReason("");
          setSelectedProfessional(null);
        },
      },
    );
  };

  const confirmMultipleSignature = () => {
    signMultipleMutation.mutate(
      { professionalIds: selectedProfessionals, reason: multiSignatureReason },
      {
        onSuccess: () => {
          setIsMultiSignDialogOpen(false);
          setMultiSignatureReason("");
          setSelectedProfessionals([]);
        },
      },
    );
  };

  const confirmRejection = () => {
    if (!selectedProfessional || !rejectionReason.trim()) return;

    rejectProfessionalMutation.mutate(
      { professionalId: selectedProfessional.id, reason: rejectionReason },
      {
        onSuccess: () => {
          setIsRejectDialogOpen(false);
          setRejectionReason("");
          setSelectedProfessional(null);
        },
      },
    );
  };

  const handleExportDocument = (type: string) => {
    toast({
      title: "Exportando documento",
      description: `Descargando ${type}...`,
    });
  };

  const handleSendNotification = (professional: PendingSignature) => {
    toast({
      title: "Notificación enviada",
      description: `Se ha enviado una notificación a ${professional.profesional}.`,
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "Alta":
        return "bg-red-100 text-red-800";
      case "Media":
        return "bg-yellow-100 text-yellow-800";
      case "Baja":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case "approval":
        return "bg-green-100 text-green-800";
      case "rejection":
        return "bg-red-100 text-red-800";
      case "status_change":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isAllSelected =
    filteredPendingSignatures.length > 0 &&
    selectedProfessionals.length === filteredPendingSignatures.length;
  const isPartiallySelected =
    selectedProfessionals.length > 0 &&
    selectedProfessionals.length < filteredPendingSignatures.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Panel Ministerial
          </h2>
          <Badge variant="destructive" className="ml-2">
            Acceso Restringido
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchPending();
              refetchHistory();
            }}
            disabled={isLoadingPending || isLoadingHistory}
            className="flex items-center gap-1"
          >
            <RefreshCw
              className={`w-3 h-3 ${isLoadingPending || isLoadingHistory ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            {ministerialStats.urgenciasAltas} Urgentes
          </Badge>
        </div>
      </div>

      {/* Error handling */}
      {pendingError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span>Error al cargar datos: {pendingError.message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Pendientes</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {ministerialStats.totalPendientes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Firmados Hoy</h3>
                <p className="text-2xl font-bold text-green-600">
                  {ministerialStats.firmadosHoy}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-red-100">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Rechazados Hoy</h3>
                <p className="text-2xl font-bold text-red-600">
                  {ministerialStats.rechazadosHoy}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Tiempo Promedio</h3>
                <p className="text-xl font-bold text-blue-600">
                  {ministerialStats.promedioTiempoFirma}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <AlertTriangle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Alta Urgencia</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {ministerialStats.urgenciasAltas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="signatures" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger
            value="signatures"
            className="flex items-center space-x-2"
          >
            <FileCheck className="w-4 h-4" />
            <span>Pendientes de Firma</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>Historial</span>
          </TabsTrigger>
          <TabsTrigger
            value="statistics"
            className="flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Estadísticas</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signatures">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span>Solicitudes Pendientes de Firma Ministerial</span>
                </span>
                <div className="flex items-center gap-2">
                  <Select
                    value={urgencyFilter}
                    onValueChange={setUrgencyFilter}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge variant="outline">
                    {filteredPendingSignatures.length} pendientes
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPendingSignatures.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {isLoadingPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Cargando profesionales...
                    </div>
                  ) : pendingSignatures.length === 0 ? (
                    <>
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                      <p className="text-lg font-medium">¡Excelente trabajo!</p>
                      <p>
                        No hay profesionales pendientes de firma ministerial.
                      </p>
                    </>
                  ) : (
                    <p>
                      No hay profesionales que coincidan con el filtro
                      seleccionado.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-4 flex gap-2 items-center">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isAllSelected}
                        ref={(ref) => {
                          if (ref) ref.indeterminate = isPartiallySelected;
                        }}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label className="text-sm">
                        Seleccionar todos ({selectedProfessionals.length}{" "}
                        seleccionados)
                      </Label>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    <Button
                      size="sm"
                      onClick={handleMultipleSign}
                      disabled={
                        selectedProfessionals.length === 0 ||
                        signMultipleMutation.isPending
                      }
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Firmar Seleccionados ({selectedProfessionals.length})
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleExportDocument("Lista de Pendientes")
                      }
                      className="flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Exportar Lista
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <span className="sr-only">Seleccionar</span>
                        </TableHead>
                        <TableHead>Profesional</TableHead>
                        <TableHead>Profesión</TableHead>
                        <TableHead>Fecha Solicitud</TableHead>
                        <TableHead>Días Pendiente</TableHead>
                        <TableHead>Urgencia</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPendingSignatures.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProfessionals.includes(item.id)}
                              onCheckedChange={(checked) =>
                                handleSelectProfessional(
                                  item.id,
                                  checked as boolean,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.profesional}
                          </TableCell>
                          <TableCell>{item.profesion}</TableCell>
                          <TableCell>
                            {new Date(item.fecha_solicitud).toLocaleDateString(
                              "es-ES",
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                item.dias_pendiente > 15
                                  ? "text-red-600 font-medium"
                                  : item.dias_pendiente > 7
                                    ? "text-yellow-600"
                                    : "text-green-600"
                              }
                            >
                              {item.dias_pendiente} días
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getUrgencyColor(item.urgencia)}>
                              {item.urgencia}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              {item.telefono && <div>{item.telefono}</div>}
                              {item.email && (
                                <div className="text-gray-500">
                                  {item.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReviewProfessional(item)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                                onClick={() => handleSignProfessional(item)}
                                disabled={signProfessionalMutation.isPending}
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectProfessional(item)}
                                disabled={rejectProfessionalMutation.isPending}
                                className="flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendNotification(item)}
                                className="flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-blue-600" />
                  <span>Historial de Cambios de Estado</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportDocument("Historial de Cambios")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Log
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Cargando historial...
                </div>
              ) : statusHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4" />
                  <p>No hay actividad reciente registrada.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {statusHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{entry.profesional}</h4>
                          <Badge
                            className={getActionTypeColor(entry.tipo)}
                            variant="outline"
                          >
                            {entry.tipo === "approval"
                              ? "Aprobado"
                              : entry.tipo === "rejection"
                                ? "Rechazado"
                                : "Cambio de Estado"}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {entry.fecha}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        {entry.accion}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Por: {entry.usuario}</span>
                        <span>{entry.detalles}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Estadísticas de Firma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total pendientes:</span>
                    <Badge>{ministerialStats.totalPendientes}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Firmados hoy:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {ministerialStats.firmadosHoy}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiempo promedio:</span>
                    <Badge variant="outline">
                      {ministerialStats.promedioTiempoFirma}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Urgencia alta:</span>
                    <Badge className="bg-red-100 text-red-800">
                      {ministerialStats.urgenciasAltas}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Distribución por Urgencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">
                      Urgencia Alta ({">"}15 días)
                    </span>
                    <Badge className="bg-red-100 text-red-800">
                      {
                        pendingSignatures.filter((p) => p.urgencia === "Alta")
                          .length
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Urgencia Media (7-15 días)</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {
                        pendingSignatures.filter((p) => p.urgencia === "Media")
                          .length
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Urgencia Baja (1-7 días)</span>
                    <Badge className="bg-green-100 text-green-800">
                      {
                        pendingSignatures.filter((p) => p.urgencia === "Baja")
                          .length
                      }
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                Configuración del Panel Ministerial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Notificaciones Automáticas
                    </Label>
                    <p className="text-sm text-gray-500">
                      Enviar notificaciones automáticas al firmar/rechazar
                      solicitudes
                    </p>
                  </div>
                  <Switch
                    checked={autoNotifications}
                    onCheckedChange={setAutoNotifications}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    Configuración de Firmas
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Configurar Plantilla de Carta
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Stamp className="w-4 h-4 mr-2" />
                      Gestionar Sellos Digitales
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    Herramientas Administrativas
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => handleExportDocument("Reporte Mensual")}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Generar Reporte Mensual
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Building2 className="w-4 h-4 mr-2" />
                      Configurar Departamentos
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Revisar Solicitud: {selectedProfessional?.profesional}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Profesional</Label>
                <p className="font-medium">
                  {selectedProfessional?.profesional}
                </p>
              </div>
              <div>
                <Label>Profesión</Label>
                <p>{selectedProfessional?.profesion}</p>
              </div>
              <div>
                <Label>Número Colegiado</Label>
                <p>
                  {selectedProfessional?.numero_colegiado || "No disponible"}
                </p>
              </div>
              <div>
                <Label>Urgencia</Label>
                <Badge
                  className={getUrgencyColor(
                    selectedProfessional?.urgencia || "",
                  )}
                >
                  {selectedProfessional?.urgencia} (
                  {selectedProfessional?.dias_pendiente} días)
                </Badge>
              </div>
              <div>
                <Label>Fecha de Solicitud</Label>
                <p>
                  {selectedProfessional?.fecha_solicitud
                    ? new Date(
                        selectedProfessional.fecha_solicitud,
                      ).toLocaleDateString("es-ES")
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label>Contacto</Label>
                <div className="text-sm">
                  {selectedProfessional?.telefono && (
                    <div>{selectedProfessional.telefono}</div>
                  )}
                  {selectedProfessional?.email && (
                    <div>{selectedProfessional.email}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsReviewDialogOpen(false)}
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setIsReviewDialogOpen(false);
                  handleSignProfessional(selectedProfessional!);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Proceder a Firmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Dialog */}
      <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Firmar Solicitud: {selectedProfessional?.profesional}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo de la firma (opcional)</Label>
              <Textarea
                value={signatureReason}
                onChange={(e) => setSignatureReason(e.target.value)}
                placeholder="Ingrese el motivo o comentarios adicionales..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsSignDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmSignature}
                disabled={signProfessionalMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {signProfessionalMutation.isPending
                  ? "Firmando..."
                  : "Confirmar Firma"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Multiple Sign Dialog */}
      <Dialog
        open={isMultiSignDialogOpen}
        onOpenChange={setIsMultiSignDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Firmar Múltiples Solicitudes ({selectedProfessionals.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Profesionales seleccionados:</Label>
              <div className="mt-2 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                {selectedProfessionals.map((id) => {
                  const professional = pendingSignatures.find(
                    (p) => p.id === id,
                  );
                  return professional ? (
                    <div key={id} className="text-sm py-1">
                      • {professional.profesional} ({professional.profesion})
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            <div>
              <Label>Motivo de las firmas (opcional)</Label>
              <Textarea
                value={multiSignatureReason}
                onChange={(e) => setMultiSignatureReason(e.target.value)}
                placeholder="Ingrese el motivo o comentarios para todas las firmas..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsMultiSignDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmMultipleSignature}
                disabled={signMultipleMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {signMultipleMutation.isPending
                  ? "Firmando..."
                  : `Confirmar ${selectedProfessionals.length} Firmas`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Rechazar Solicitud: {selectedProfessional?.profesional}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción rechazará permanentemente la solicitud. Debe
              proporcionar un motivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label>Motivo del rechazo *</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ingrese el motivo del rechazo..."
              required
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsRejectDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRejection}
              className="bg-red-600 hover:bg-red-700"
              disabled={
                !rejectionReason.trim() || rejectProfessionalMutation.isPending
              }
            >
              {rejectProfessionalMutation.isPending
                ? "Rechazando..."
                : "Confirmar Rechazo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MinisterialPanel;
