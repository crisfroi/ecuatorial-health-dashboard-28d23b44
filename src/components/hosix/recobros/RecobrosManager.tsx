import { useState } from 'react';
import { useHosixRecobros } from '@/hooks/useHosixRecobros';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, TrendingDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function RecobrosManager() {
  const { recobros, recobrosLoading, crearRecobro, actualizarRecobro, crearRecobroLoading, error, setError } = useHosixRecobros();
  const [open, setOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todas');
  
  const [formData, setFormData] = useState({
    numero_factura: '',
    motivo_recobro: '',
    descripcion: '',
    monto_original: '',
    prioridad: 'media',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.numero_factura || !formData.motivo_recobro || !formData.monto_original) {
      setError('Factura, motivo y monto son requeridos');
      return;
    }

    crearRecobro({
      numero_recobro: `REC-${Date.now()}`,
      factura_id: formData.numero_factura,
      motivo_recobro: formData.motivo_recobro,
      descripcion: formData.descripcion,
      monto_original: parseFloat(formData.monto_original),
      monto_recobrado: 0,
      estado: 'pendiente',
      prioridad: formData.prioridad as any,
      fecha_solicitud: new Date().toISOString(),
      fecha_cierre: null,
      usuario_responsable_id: '',
      observaciones: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      id: ''
    });

    setFormData({
      numero_factura: '',
      motivo_recobro: '',
      descripcion: '',
      monto_original: '',
      prioridad: 'media',
    });
    setOpen(false);
  };

  const recobrosFiltered = recobros.filter(r => {
    if (filtroEstado !== 'todos' && r.estado !== filtroEstado) return false;
    if (filtroPrioridad !== 'todas' && r.prioridad !== filtroPrioridad) return false;
    return true;
  });

  const handleChangeEstado = (id: string, nuevoEstado: string) => {
    actualizarRecobro({
      id,
      estado: nuevoEstado as any,
      updated_at: new Date().toISOString()
    });
  };

  const estadoColors = {
    pendiente: 'bg-red-100 text-red-800',
    en_proceso: 'bg-blue-100 text-blue-800',
    parcial: 'bg-yellow-100 text-yellow-800',
    completado: 'bg-green-100 text-green-800',
    rechazado: 'bg-slate-100 text-slate-800'
  };

  const prioridadColors = {
    baja: 'text-slate-600',
    media: 'text-blue-600',
    alta: 'text-orange-600',
    urgente: 'text-red-600'
  };

  if (recobrosLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestión de Recobros</CardTitle>
            <CardDescription>Denegación de facturas y solicitudes de recobro</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>+ Nuevo Recobro</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Solicitud de Recobro</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="numero_factura">Número de Factura *</Label>
                  <Input
                    id="numero_factura"
                    value={formData.numero_factura}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero_factura: e.target.value }))}
                    placeholder="ej. FAC-001234"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivo_recobro">Motivo del Recobro *</Label>
                  <Select value={formData.motivo_recobro} onValueChange={(value) => setFormData(prev => ({ ...prev, motivo_recobro: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="factura_duplicada">Factura Duplicada</SelectItem>
                      <SelectItem value="error_datos">Error en Datos</SelectItem>
                      <SelectItem value="error_cantidad">Error en Cantidad</SelectItem>
                      <SelectItem value="error_precio">Error en Precio</SelectItem>
                      <SelectItem value="procedimiento_no_realizado">Procedimiento No Realizado</SelectItem>
                      <SelectItem value="servicio_incompleto">Servicio Incompleto</SelectItem>
                      <SelectItem value="no_autorizado">No Autorizado</SelectItem>
                      <SelectItem value="fuera_cobertura">Fuera de Cobertura</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción Detallada</Label>
                  <textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripción del motivo del recobro"
                    className="w-full px-3 py-2 border rounded-md"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monto_original">Monto Original *</Label>
                  <Input
                    id="monto_original"
                    type="number"
                    step="0.01"
                    value={formData.monto_original}
                    onChange={(e) => setFormData(prev => ({ ...prev, monto_original: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <Select value={formData.prioridad} onValueChange={(value) => setFormData(prev => ({ ...prev, prioridad: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={crearRecobroLoading} className="w-full">
                  {crearRecobroLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Recobro'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Label className="text-sm">Estado</Label>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label className="text-sm">Prioridad</Label>
            <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabla */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Monto Original</TableHead>
                <TableHead>Recobrado</TableHead>
                <TableHead>Pendiente</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recobrosFiltered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No hay recobros creados. Crea uno nuevo para comenzar.
                  </TableCell>
                </TableRow>
              ) : (
                recobrosFiltered.map(recobro => (
                  <TableRow key={recobro.id}>
                    <TableCell className="font-mono text-sm">{recobro.numero_recobro}</TableCell>
                    <TableCell className="font-mono text-sm">{recobro.factura_id}</TableCell>
                    <TableCell className="text-sm">{recobro.motivo_recobro}</TableCell>
                    <TableCell className="text-right font-mono">${recobro.monto_original.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      ${recobro.monto_recobrado.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-orange-600">
                      ${(recobro.monto_original - recobro.monto_recobrado).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold ${prioridadColors[recobro.prioridad as keyof typeof prioridadColors]}`}>
                        {recobro.prioridad.charAt(0).toUpperCase() + recobro.prioridad.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select value={recobro.estado} onValueChange={(value) => handleChangeEstado(recobro.id, value)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en_proceso">En Proceso</SelectItem>
                          <SelectItem value="parcial">Parcial</SelectItem>
                          <SelectItem value="completado">Completado</SelectItem>
                          <SelectItem value="rechazado">Rechazado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(recobro.fecha_solicitud), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" title="Ver detalles">
                        <TrendingDown className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
