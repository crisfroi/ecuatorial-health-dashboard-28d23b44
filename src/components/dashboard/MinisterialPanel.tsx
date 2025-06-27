
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileCheck, Signature, Eye, AlertCircle } from 'lucide-react';
import { useProfesionales } from '@/hooks/useProfesionales';
import { useActualizarProfesional } from '@/hooks/useProfesionalesMutations';
import { useToast } from '@/hooks/use-toast';

const MinisterialPanel = () => {
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const { toast } = useToast();
  const updateProfessional = useActualizarProfesional();

  const { data: pendingApproval = [], isLoading, refetch } = useProfesionales({
    estado_solicitud: 'Pendiente de Firma'
  });

  const { data: underReview = [] } = useProfesionales({
    estado_solicitud: 'Revisando'
  });

  const handleReview = async (professionalId: string, action: 'approve' | 'reject') => {
    try {
      const updates = {
        estado_solicitud: action === 'approve' ? 'Pendiente de Firma' : 'Rechazado',
        fecha_revision: new Date().toISOString().split('T')[0],
        revisor_solicitud: 'Comité Ministerial',
        notas_revision: reviewNotes || null,
        motivo_rechazo: action === 'reject' ? reviewNotes : null
      };

      await updateProfessional.mutateAsync({
        id: professionalId,
        updates
      });

      toast({
        title: action === 'approve' ? "Solicitud aprobada para firma" : "Solicitud rechazada",
        description: `La solicitud ha sido ${action === 'approve' ? 'aprobada y enviada para firma ministerial' : 'rechazada'}`,
        variant: "default",
      });

      setSelectedProfessional(null);
      setReviewNotes('');
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la solicitud",
        variant: "destructive",
      });
    }
  };

  const handleFinalApproval = async (professionalId: string) => {
    try {
      const updates = {
        estado_solicitud: 'Aprobado',
        fecha_aprobacion: new Date().toISOString().split('T')[0],
        fecha_aprobacion_carnet: new Date().toISOString().split('T')[0],
        numero_carnet_profesional: generateCarnetNumber(),
        revisor_solicitud: 'Ministro de Sanidad'
      };

      await updateProfessional.mutateAsync({
        id: professionalId,
        updates
      });

      toast({
        title: "Aprobación final completada",
        description: "El carnet profesional ha sido aprobado y generado",
        variant: "default",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo completar la aprobación final",
        variant: "destructive",
      });
    }
  };

  const generateCarnetNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `CNP-${year}${month}-${random}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cargando panel ministerial...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Panel de Revisión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <span>Solicitudes en Revisión</span>
            <Badge variant="secondary">{underReview.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Área Profesional</TableHead>
                <TableHead>Fecha Solicitud</TableHead>
                <TableHead>Urgencia</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {underReview.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No hay solicitudes en revisión
                  </TableCell>
                </TableRow>
              ) : (
                underReview.map((professional) => (
                  <TableRow key={professional.id}>
                    <TableCell className="font-medium">{professional.nombre_completo}</TableCell>
                    <TableCell>{professional.area_profesional}</TableCell>
                    <TableCell>{formatDate(professional.fecha_creacion_solicitud)}</TableCell>
                    <TableCell>
                      <Badge variant={professional.urgencia_solicitud === 'Alta' ? 'destructive' : 'secondary'}>
                        {professional.urgencia_solicitud || 'Media'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedProfessional(professional)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Revisar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Revisión de Solicitud</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Nombre:</label>
                                <p>{professional.nombre_completo}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Área:</label>
                                <p>{professional.area_profesional}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Centro:</label>
                                <p>{professional.nombre_centro || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Provincia:</label>
                                <p>{professional.provincia || 'N/A'}</p>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Notas de revisión:</label>
                              <Textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Añade comentarios sobre la revisión..."
                                className="mt-1"
                              />
                            </div>
                            
                            <div className="flex space-x-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => handleReview(professional.id, 'reject')}
                                className="text-red-600 hover:text-red-700"
                              >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Rechazar
                              </Button>
                              <Button
                                onClick={() => handleReview(professional.id, 'approve')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <FileCheck className="w-4 h-4 mr-1" />
                                Aprobar para Firma
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Panel de Firma Ministerial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Signature className="w-5 h-5 text-green-600" />
            <span>Pendientes de Firma Ministerial</span>
            <Badge variant="secondary">{pendingApproval.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Área Profesional</TableHead>
                <TableHead>Fecha Revisión</TableHead>
                <TableHead>Revisor</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApproval.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No hay solicitudes pendientes de firma
                  </TableCell>
                </TableRow>
              ) : (
                pendingApproval.map((professional) => (
                  <TableRow key={professional.id}>
                    <TableCell className="font-medium">{professional.nombre_completo}</TableCell>
                    <TableCell>{professional.area_profesional}</TableCell>
                    <TableCell>{formatDate(professional.fecha_revision)}</TableCell>
                    <TableCell>{professional.revisor_solicitud || 'N/A'}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleFinalApproval(professional.id)}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <Signature className="w-4 h-4 mr-1" />
                        Firmar y Aprobar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MinisterialPanel;
