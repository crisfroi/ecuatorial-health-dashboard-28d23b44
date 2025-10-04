import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAdvancedRoleManagement } from "@/hooks/useAdvancedRoleManagement";
import { useState } from "react";
import { RefreshCw, CheckCircle, XCircle, Building2, ArrowRight } from "lucide-react";

const TrasladosTab = () => {
  const { traslados, loading, processTrasladoSolicitud, loadTraslados } = useAdvancedRoleManagement();
  const [selectedTraslado, setSelectedTraslado] = useState<any>(null);
  const [rejectionDialog, setRejectionDialog] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [observaciones, setObservaciones] = useState("");

  const handleApprove = async () => {
    if (selectedTraslado) {
      await processTrasladoSolicitud(selectedTraslado.id, 'aprobado', observaciones);
      setApprovalDialog(false);
      setSelectedTraslado(null);
      setObservaciones("");
      loadTraslados();
    }
  };

  const handleReject = async () => {
    if (selectedTraslado && observaciones.trim()) {
      await processTrasladoSolicitud(selectedTraslado.id, 'rechazado', observaciones);
      setRejectionDialog(false);
      setSelectedTraslado(null);
      setObservaciones("");
      loadTraslados();
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'aprobado':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Aprobado</Badge>;
      case 'rechazado':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rechazado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Solicitudes de Traslado de Profesionales
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTraslados}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2">Cargando traslados...</span>
            </div>
          ) : traslados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay solicitudes de traslado pendientes</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profesional</TableHead>
                  <TableHead>Centro Origen</TableHead>
                  <TableHead>Centro Destino</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Fecha Solicitud</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {traslados.map((traslado: any) => (
                  <TableRow key={traslado.id}>
                    <TableCell className="font-medium">
                      {traslado.profesional?.nombre_completo || 'N/A'}
                      <div className="text-xs text-muted-foreground">
                        {traslado.profesional?.area_profesional || ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{traslado.nombre_centro_origen || traslado.centro_origen?.nombre || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground">
                          {traslado.distrito_sanitario_origen || traslado.centro_origen?.distrito_sanitario || ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-600" />
                        <div className="flex flex-col">
                          <span className="font-medium">{traslado.nombre_centro_destino || traslado.centro_destino?.nombre || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground">
                            {traslado.distrito_sanitario_destino || traslado.centro_destino?.distrito_sanitario || ''}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{traslado.motivo}</TableCell>
                    <TableCell>
                      {new Date(traslado.fecha_solicitud).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell>{getEstadoBadge(traslado.estado)}</TableCell>
                    <TableCell>
                      {traslado.estado === 'pendiente' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 bg-green-500/10 text-green-600 hover:bg-green-500/20"
                            onClick={() => {
                              setSelectedTraslado(traslado);
                              setApprovalDialog(true);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 bg-red-500/10 text-red-600 hover:bg-red-500/20"
                            onClick={() => {
                              setSelectedTraslado(traslado);
                              setRejectionDialog(true);
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar Traslado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>¿Está seguro de aprobar esta solicitud de traslado?</p>
            {selectedTraslado && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p><strong>Profesional:</strong> {selectedTraslado.profesional?.nombre_completo}</p>
                <p><strong>De:</strong> {selectedTraslado.nombre_centro_origen || selectedTraslado.centro_origen?.nombre}</p>
                <p><strong>A:</strong> {selectedTraslado.nombre_centro_destino || selectedTraslado.centro_destino?.nombre}</p>
              </div>
            )}
            <div>
              <Label>Observaciones (opcional)</Label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ingrese observaciones sobre la aprobación..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Aprobación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialog} onOpenChange={setRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Traslado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Proporcione un motivo para rechazar esta solicitud de traslado.</p>
            {selectedTraslado && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p><strong>Profesional:</strong> {selectedTraslado.profesional?.nombre_completo}</p>
                <p><strong>De:</strong> {selectedTraslado.nombre_centro_origen || selectedTraslado.centro_origen?.nombre}</p>
                <p><strong>A:</strong> {selectedTraslado.nombre_centro_destino || selectedTraslado.centro_destino?.nombre}</p>
              </div>
            )}
            <div>
              <Label>Motivo del rechazo *</Label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ingrese el motivo del rechazo..."
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleReject}
              disabled={!observaciones.trim()}
              variant="destructive"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TrasladosTab;
