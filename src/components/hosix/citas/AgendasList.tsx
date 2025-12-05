import React, { useState } from 'react';
import { useHosixCitas } from '@/hooks/useHosixCitas';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Calendar, Clock, Users } from 'lucide-react';

interface AgendaFormData {
  codigo: string;
  nombre: string;
  servicio_id: string;
  profesional_id: string;
  sala: string;
  tipo_agenda: 'consulta' | 'procedimiento' | 'teleconsulta';
  duracion_default_minutos: number;
  capacidad_maxima_dia: number;
  permite_teleconsulta: boolean;
}

const AgendasList: React.FC = () => {
  const { agendas, createAgenda, isCreatingAgenda, citas, horarios } = useHosixCitas();
  const { profesionales } = useHosixPacientes();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AgendaFormData>({
    codigo: '',
    nombre: '',
    servicio_id: '',
    profesional_id: '',
    sala: '',
    tipo_agenda: 'consulta',
    duracion_default_minutos: 15,
    capacidad_maxima_dia: 20,
    permite_teleconsulta: false,
  });

  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAgenda({
        ...formData,
        activo: true,
      });
      setShowForm(false);
      setFormData({
        codigo: '',
        nombre: '',
        servicio_id: '',
        profesional_id: '',
        sala: '',
        tipo_agenda: 'consulta',
        duracion_default_minutos: 15,
        capacidad_maxima_dia: 20,
        permite_teleconsulta: false,
      });
    } catch (error) {
      console.error('Error creating agenda:', error);
    }
  };

  const filteredAgendas = agendas.data?.filter(agenda => 
    agenda.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agenda.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const citasCount = citas.data?.length || 0;
  const horariosCount = horarios.data?.length || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Agendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAgendas.length}</div>
            <p className="text-xs text-gray-500">Agendas activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Citas Programadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{citasCount}</div>
            <p className="text-xs text-gray-500">Citas en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Horarios Definidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{horariosCount}</div>
            <p className="text-xs text-gray-500">Franjas horarias</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agendas de Atención</CardTitle>
              <CardDescription>
                Gestiona las agendas de médicos, servicios y salas
              </CardDescription>
            </div>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Agenda
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Agenda</DialogTitle>
                  <DialogDescription>
                    Configura una nueva agenda de atención para médicos, servicios o salas
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigo">Código</Label>
                      <Input
                        id="codigo"
                        value={formData.codigo}
                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                        placeholder="AGE-001"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Consulta General"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sala">Sala</Label>
                      <Input
                        id="sala"
                        value={formData.sala}
                        onChange={(e) => setFormData({ ...formData, sala: e.target.value })}
                        placeholder="Sala 1"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo de Agenda</Label>
                      <Select value={formData.tipo_agenda} onValueChange={(value: any) => setFormData({ ...formData, tipo_agenda: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consulta">Consulta</SelectItem>
                          <SelectItem value="procedimiento">Procedimiento</SelectItem>
                          <SelectItem value="teleconsulta">Teleconsulta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duracion">Duración Default (minutos)</Label>
                      <Input
                        id="duracion"
                        type="number"
                        value={formData.duracion_default_minutos}
                        onChange={(e) => setFormData({ ...formData, duracion_default_minutos: parseInt(e.target.value) })}
                        min="5"
                        max="480"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="capacidad">Capacidad Máxima por Día</Label>
                      <Input
                        id="capacidad"
                        type="number"
                        value={formData.capacidad_maxima_dia}
                        onChange={(e) => setFormData({ ...formData, capacidad_maxima_dia: parseInt(e.target.value) })}
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.permite_teleconsulta}
                        onChange={(e) => setFormData({ ...formData, permite_teleconsulta: e.target.checked })}
                        className="mr-2"
                      />
                      Permite Teleconsulta
                    </Label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isCreatingAgenda}>
                      {isCreatingAgenda ? 'Creando...' : 'Crear Agenda'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <Input
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Agendas Table */}
          {agendas.isLoading ? (
            <Alert>
              <AlertDescription>Cargando agendas...</AlertDescription>
            </Alert>
          ) : agendas.error ? (
            <Alert variant="destructive">
              <AlertDescription>Error al cargar agendas: {agendas.error.message}</AlertDescription>
            </Alert>
          ) : filteredAgendas.length === 0 ? (
            <Alert>
              <AlertDescription>No hay agendas disponibles. Crea una nueva para comenzar.</AlertDescription>
            </Alert>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Sala</TableHead>
                    <TableHead className="text-right">Duración</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgendas.map((agenda) => (
                    <TableRow key={agenda.id}>
                      <TableCell className="font-mono text-sm">{agenda.codigo}</TableCell>
                      <TableCell className="font-medium">{agenda.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{agenda.tipo_agenda}</Badge>
                      </TableCell>
                      <TableCell>{agenda.sala}</TableCell>
                      <TableCell className="text-right">{agenda.duracion_default_minutos} min</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Calendar className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendasList;
