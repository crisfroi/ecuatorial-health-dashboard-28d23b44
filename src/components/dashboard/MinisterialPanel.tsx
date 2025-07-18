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
  DialogTrigger,
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
  AlertDialogTrigger,
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
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const MinisterialPanel = () => {
  const { toast } = useToast();
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [signatureReason, setSignatureReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [autoNotifications, setAutoNotifications] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const pendingSignatures = [
    {
      id: 1,
      profesional: "Dr. María José Nsue Ela",
      profesion: "Médico General",
      fechaRevision: "2024-01-20",
      revisor: "Dr. Carlos Obiang",
      urgencia: "Alta",
      telefono: "+240222123456",
      email: "maria.nsue@sanidad.gq",
    },
    {
      id: 2,
      profesional: "Farm. José Antonio Mba",
      profesion: "Farmacia",
      fechaRevision: "2024-01-18",
      revisor: "Farm. Ana Nguema",
      urgencia: "Media",
      telefono: "+240222654321",
      email: "jose.mba@sanidad.gq",
    },
    {
      id: 3,
      profesional: "Enf. Carmen Obiang Nsue",
      profesion: "Enfermería",
      fechaRevision: "2024-01-22",
      revisor: "Enf. Jefa María Ela",
      urgencia: "Baja",
      telefono: "+240222789012",
      email: "carmen.obiang@sanidad.gq",
    },
  ];

  const statusHistory = [
    {
      id: 1,
      profesional: "Enfermera Carmen Obiang",
      accion: 'Estado cambiado de "Recibido" a "Revisando"',
      usuario: "Admin. Pedro Nsue",
      fecha: "2024-01-22 14:30",
      detalles: "Revisión inicial completada",
      tipo: "status_change",
    },
    {
      id: 2,
      profesional: "Dr. Luis Mba Ela",
      accion: "Solicitud aprobada y firmada",
      usuario: "Ministro Juan Nsue",
      fecha: "2024-01-22 10:15",
      detalles: "Carta de resolución generada",
      tipo: "approval",
    },
    {
      id: 3,
      profesional: "Farm. Ana Nguema Mba",
      accion: "Solicitud rechazada",
      usuario: "Comité Evaluador",
      fecha: "2024-01-21 16:45",
      detalles: "Documentación incompleta",
      tipo: "rejection",
    },
  ];

  const ministerialStats = {
    totalPendientes: pendingSignatures.length,
    firmadosHoy: 5,
    rechazadosHoy: 2,
    promedioTiempoFirma: "2.3 días",
    urgenciasAltas: pendingSignatures.filter((p) => p.urgencia === "Alta")
      .length,
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

  const handleReviewProfessional = (professional) => {
    setSelectedProfessional(professional);
    setIsReviewDialogOpen(true);
  };

  const handleSignProfessional = (professional) => {
    setSelectedProfessional(professional);
    setIsSignDialogOpen(true);
  };

  const handleRejectProfessional = (professional) => {
    setSelectedProfessional(professional);
    setIsRejectDialogOpen(true);
  };

  const confirmSignature = () => {
    toast({
      title: "Solicitud Firmada",
      description: `La solicitud de ${selectedProfessional?.profesional} ha sido firmada exitosamente.`,
    });
    setIsSignDialogOpen(false);
    setSignatureReason("");
    setSelectedProfessional(null);
  };

  const confirmRejection = () => {
    toast({
      title: "Solicitud Rechazada",
      description: `La solicitud de ${selectedProfessional?.profesional} ha sido rechazada.`,
      variant: "destructive",
    });
    setIsRejectDialogOpen(false);
    setRejectionReason("");
    setSelectedProfessional(null);
  };

  const handleExportDocument = (type: string) => {
    toast({
      title: "Exportando documento",
      description: `Descargando ${type}...`,
    });
  };

  const handleSendNotification = (professional) => {
    toast({
      title: "Notificación enviada",
      description: `Se ha enviado una notificación a ${professional.profesional}.`,
    });
  };

  const handleBatchAction = (action: string) => {
    const count = filteredPendingSignatures.length;
    toast({
      title: `Acción masiva: ${action}`,
      description: `Se procesarán ${count} solicitudes.`,
    });
  };

  const filteredPendingSignatures = pendingSignatures.filter(
    (item) => urgencyFilter === "all" || item.urgencia === urgencyFilter,
  );

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
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            {ministerialStats.urgenciasAltas} Urgentes
          </Badge>
        </div>
      </div>

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
              <div className="mb-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBatchAction("Firmar Todas")}
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Firmar Todas
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBatchAction("Notificar Todas")}
                  className="flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  Notificar Todas
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportDocument("Lista de Pendientes")}
                  className="flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Exportar Lista
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Profesión</TableHead>
                    <TableHead>Fecha Revisión</TableHead>
                    <TableHead>Revisor</TableHead>
                    <TableHead>Urgencia</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPendingSignatures.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.profesional}
                      </TableCell>
                      <TableCell>{item.profesion}</TableCell>
                      <TableCell>{item.fechaRevision}</TableCell>
                      <TableCell>{item.revisor}</TableCell>
                      <TableCell>
                        <Badge className={getUrgencyColor(item.urgencia)}>
                          {item.urgencia}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>{item.telefono}</div>
                          <div className="text-gray-500">{item.email}</div>
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
                          >
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectProfessional(item)}
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
                    <p className="text-sm text-gray-700 mb-1">{entry.accion}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Por: {entry.usuario}</span>
                      <span>{entry.detalles}</span>
                    </div>
                  </div>
                ))}
              </div>
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
                    <span>Total procesados esta semana:</span>
                    <Badge>24</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Tasa de aprobación:</span>
                    <Badge className="bg-green-100 text-green-800">87%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiempo promedio de revisión:</span>
                    <Badge variant="outline">2.3 días</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Pendientes de alta urgencia:</span>
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
                  <Users className="w-5 h-5 text-purple-600" />
                  Rendimiento por Revisor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Dr. Carlos Obiang</span>
                    <Badge variant="outline">8 revisiones</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Farm. Ana Nguema</span>
                    <Badge variant="outline">6 revisiones</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Enf. Jefa María Ela</span>
                    <Badge variant="outline">4 revisiones</Badge>
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

      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Documentos de Resolución</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 text-sm mb-4">
            Los documentos de carta de resolución ministerial están disponibles
            solo para usuarios autorizados del comité.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="justify-start border-red-200 text-red-700 hover:bg-red-100"
              onClick={() =>
                handleExportDocument("Cartas de Resolución (Enero 2024)")
              }
            >
              <Download className="w-4 h-4 mr-2" />
              Cartas de Resolución (Enero 2024)
            </Button>
            <Button
              variant="outline"
              className="justify-start border-red-200 text-red-700 hover:bg-red-100"
              onClick={() =>
                handleExportDocument("Registro de Firmas Ministeriales")
              }
            >
              <Download className="w-4 h-4 mr-2" />
              Registro de Firmas Ministeriales
            </Button>
          </div>
        </CardContent>
      </Card>

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
                <Label>Revisor</Label>
                <p>{selectedProfessional?.revisor}</p>
              </div>
              <div>
                <Label>Urgencia</Label>
                <Badge
                  className={getUrgencyColor(selectedProfessional?.urgencia)}
                >
                  {selectedProfessional?.urgencia}
                </Badge>
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
                onClick={() => handleSignProfessional(selectedProfessional)}
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
                className="bg-green-600 hover:bg-green-700"
              >
                Confirmar Firma
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
              disabled={!rejectionReason.trim()}
            >
              Confirmar Rechazo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MinisterialPanel;
