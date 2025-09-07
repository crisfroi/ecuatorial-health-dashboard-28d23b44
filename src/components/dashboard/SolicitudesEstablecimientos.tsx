import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Building2, Eye, Edit, Save, X, RefreshCw, FileImage, Download } from "lucide-react";
import { useSolicitudesEstablecimientosQuery, useSolicitudesEstablecimientos } from "@/hooks/useSolicitudesEstablecimientos";
import { useToast } from "@/hooks/use-toast";

interface SolicitudesEstablecimientosProps {
  userRole: string;
}

const SolicitudesEstablecimientos = ({ userRole }: SolicitudesEstablecimientosProps) => {
  const [estadoFiltro, setEstadoFiltro] = useState("Pendiente");
  const [editandoEstados, setEditandoEstados] = useState<Record<string, string>>({});
  const [motivosRechazo, setMotivosRechazo] = useState<Record<string, string>>({});
  const [notasRevision, setNotasRevision] = useState<Record<string, string>>({});
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null);

  const { toast } = useToast();
  const { data: solicitudes = [], isLoading, refetch } = useSolicitudesEstablecimientosQuery({ estado: estadoFiltro === "todos" ? undefined : estadoFiltro });
  const { actualizarEstadoMutation } = useSolicitudesEstablecimientos();

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "Pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Revisando":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Pendiente de Firma":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "Autorizado":
        return "bg-green-100 text-green-800 border-green-300";
      case "Rechazado":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getOpcionesEstado = (estadoActual: string) => {
    const opciones = ["Revisando", "Pendiente de Firma", "Autorizado", "Rechazado"];
    
    if (estadoActual === "Pendiente") return opciones;
    if (estadoActual === "Revisando") return ["Pendiente de Firma", "Autorizado", "Rechazado"];
    if (estadoActual === "Pendiente de Firma") return ["Autorizado", "Rechazado"];
    
    return [];
  };

  const handleEditarEstado = (id: string, estadoActual: string) => {
    setEditandoEstados(prev => ({ ...prev, [id]: estadoActual }));
    setMotivosRechazo(prev => {
      const nuevos = { ...prev };
      delete nuevos[id];
      return nuevos;
    });
    setNotasRevision(prev => {
      const nuevas = { ...prev };
      delete nuevas[id];
      return nuevas;
    });
  };

  const handleGuardarEstado = async (id: string) => {
    const nuevoEstado = editandoEstados[id];
    if (!nuevoEstado) return;

    if (nuevoEstado === "Rechazado" && !motivosRechazo[id]) {
      toast({
        title: "Motivo de Rechazo Requerido",
        description: "Debe introducir un motivo si el estado es 'Rechazado'.",
        variant: "destructive",
      });
      return;
    }

    try {
      await actualizarEstadoMutation.mutateAsync({
        id,
        estado: nuevoEstado,
        motivo_rechazo: nuevoEstado === "Rechazado" ? motivosRechazo[id] : undefined,
        notas_revision: notasRevision[id],
      });

      setEditandoEstados(prev => {
        const nuevos = { ...prev };
        delete nuevos[id];
        return nuevos;
      });
      setMotivosRechazo(prev => {
        const nuevos = { ...prev };
        delete nuevos[id];
        return nuevos;
      });
      setNotasRevision(prev => {
        const nuevas = { ...prev };
        delete nuevas[id];
        return nuevas;
      });
    } catch (error) {
      console.error("Error actualizando estado:", error);
    }
  };

  const handleCancelarEdicion = (id: string) => {
    setEditandoEstados(prev => {
      const nuevos = { ...prev };
      delete nuevos[id];
      return nuevos;
    });
    setMotivosRechazo(prev => {
      const nuevos = { ...prev };
      delete nuevos[id];
      return nuevos;
    });
    setNotasRevision(prev => {
      const nuevas = { ...prev };
      delete nuevas[id];
      return nuevas;
    });
  };

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleDateString("es-ES");
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Cargando solicitudes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6" />
              <span>Gestión de Solicitudes de Establecimientos</span>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Revisando">Revisando</SelectItem>
                <SelectItem value="Pendiente de Firma">Pendiente de Firma</SelectItem>
                <SelectItem value="Autorizado">Autorizado</SelectItem>
                <SelectItem value="Rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600">
              Total: {solicitudes.length} solicitudes
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de solicitudes */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Solicitud</TableHead>
                <TableHead>Establecimiento</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Provincia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Solicitud</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitudes.map((solicitud) => (
                <TableRow key={solicitud.id}>
                  <TableCell className="font-mono text-sm">
                    {solicitud.numero_solicitud}
                    {solicitud.numero_registro && (
                      <div className="text-xs text-green-600">
                        Reg: {solicitud.numero_registro}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{solicitud.nombre_establecimiento}</div>
                      <div className="text-sm text-gray-500">{solicitud.director_responsable}</div>
                    </div>
                  </TableCell>
                  <TableCell>{solicitud.categoria}</TableCell>
                  <TableCell>{solicitud.provincia}</TableCell>
                  <TableCell>
                    {editandoEstados[solicitud.id] ? (
                      <div className="space-y-2">
                        <Select
                          value={editandoEstados[solicitud.id]}
                          onValueChange={(value) =>
                            setEditandoEstados(prev => ({ ...prev, [solicitud.id]: value }))
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getOpcionesEstado(solicitud.estado).map((opcion) => (
                              <SelectItem key={opcion} value={opcion}>
                                {opcion}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {editandoEstados[solicitud.id] === "Rechazado" && (
                          <Textarea
                            placeholder="Motivo del rechazo..."
                            value={motivosRechazo[solicitud.id] || ""}
                            onChange={(e) =>
                              setMotivosRechazo(prev => ({ ...prev, [solicitud.id]: e.target.value }))
                            }
                            className="text-sm"
                          />
                        )}
                        
                        <Textarea
                          placeholder="Notas de revisión (opcional)..."
                          value={notasRevision[solicitud.id] || ""}
                          onChange={(e) =>
                            setNotasRevision(prev => ({ ...prev, [solicitud.id]: e.target.value }))
                          }
                          className="text-sm"
                        />

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleGuardarEstado(solicitud.id)}
                            disabled={actualizarEstadoMutation.isPending}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelarEdicion(solicitud.id)}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Badge className={getStatusColor(solicitud.estado)}>
                        {solicitud.estado}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatearFecha(solicitud.fecha_solicitud)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSolicitudSeleccionada(solicitud)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Detalles de Solicitud - {solicitudSeleccionada?.numero_solicitud}
                            </DialogTitle>
                          </DialogHeader>
                          {solicitudSeleccionada && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Información General</h4>
                                  <div className="space-y-2 text-sm">
                                    <div><strong>Nombre:</strong> {solicitudSeleccionada.nombre_establecimiento}</div>
                                    <div><strong>Categoría:</strong> {solicitudSeleccionada.categoria}</div>
                                    <div><strong>Tipo:</strong> {solicitudSeleccionada.tipo_servicio}</div>
                                    <div><strong>Director:</strong> {solicitudSeleccionada.director_responsable}</div>
                                    <div><strong>Teléfono:</strong> {solicitudSeleccionada.telefono}</div>
                                    <div><strong>Email:</strong> {solicitudSeleccionada.email}</div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Ubicación</h4>
                                  <div className="space-y-2 text-sm">
                                    <div><strong>Provincia:</strong> {solicitudSeleccionada.provincia}</div>
                                    <div><strong>Distrito Sanitario:</strong> {solicitudSeleccionada.distrito_sanitario}</div>
                                    <div><strong>Dirección:</strong> {solicitudSeleccionada.direccion}</div>
                                  </div>
                                </div>
                              </div>

                              {solicitudSeleccionada.fotos_establecimiento?.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Fotos del Establecimiento</h4>
                                  <div className="grid grid-cols-3 gap-4">
                                    {solicitudSeleccionada.fotos_establecimiento.map((foto: string, index: number) => (
                                      <img
                                        key={index}
                                        src={foto}
                                        alt={`Foto ${index + 1}`}
                                        className="w-full h-32 object-cover rounded border"
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {solicitudSeleccionada.documentos_adicionales?.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Documentos Adicionales</h4>
                                  <div className="space-y-2">
                                    {solicitudSeleccionada.documentos_adicionales.map((doc: string, index: number) => (
                                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <span className="text-sm">Documento {index + 1}</span>
                                        <Button size="sm" variant="outline" asChild>
                                          <a href={doc} target="_blank" rel="noopener noreferrer">
                                            <Download className="h-3 w-3 mr-1" />
                                            Descargar
                                          </a>
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {solicitudSeleccionada.observaciones && (
                                <div>
                                  <h4 className="font-medium mb-2">Observaciones</h4>
                                  <p className="text-sm bg-gray-50 p-3 rounded">{solicitudSeleccionada.observaciones}</p>
                                </div>
                              )}

                              {solicitudSeleccionada.motivo_rechazo && (
                                <div>
                                  <h4 className="font-medium mb-2 text-red-600">Motivo de Rechazo</h4>
                                  <p className="text-sm bg-red-50 p-3 rounded">{solicitudSeleccionada.motivo_rechazo}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {!editandoEstados[solicitud.id] && 
                       getOpcionesEstado(solicitud.estado).length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditarEstado(solicitud.id, solicitud.estado)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SolicitudesEstablecimientos;