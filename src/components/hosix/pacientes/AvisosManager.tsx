import React, { useState } from 'react';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Plus, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const AvisosManager: React.FC = () => {
  const { pacientes, agregarAviso, isAddingAviso } = useHosixPacientes();
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'alerta' as 'alerta' | 'alergia' | 'contraindicacion' | 'precaución' | 'importante',
    titulo: '',
    descripcion: '',
    severidad: 'media' as 'baja' | 'media' | 'alta' | 'crítica',
  });

  const pacienteSeleccionado = pacientes.data?.find(p => p.id === selectedPacienteId);
  const avisosPaciente = pacienteSeleccionado?.avisos || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPacienteId || !formData.titulo.trim() || !formData.descripcion.trim()) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    try {
      await agregarAviso({
        paciente_id: selectedPacienteId,
        tipo: formData.tipo,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        severidad: formData.severidad,
        activo: true,
        fecha_creacion: new Date().toISOString(),
      });

      setShowForm(false);
      setFormData({
        tipo: 'alerta',
        titulo: '',
        descripcion: '',
        severidad: 'media',
      });
    } catch (error) {
      console.error('Error al agregar aviso:', error);
    }
  };

  const getTipoBadge = (tipo: string) => {
    const tipos: Record<string, any> = {
      alerta: { variant: 'default', icon: AlertTriangle, label: 'Alerta' },
      alergia: { variant: 'destructive', icon: AlertCircle, label: 'Alergia' },
      contraindicacion: { variant: 'destructive', icon: AlertTriangle, label: 'Contraindicación' },
      precaución: { variant: 'secondary', icon: AlertCircle, label: 'Precaución' },
      importante: { variant: 'default', icon: AlertTriangle, label: 'Importante' },
    };
    const config = tipos[tipo] || tipos.alerta;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getSeveridadColor = (severidad: string) => {
    const colores: Record<string, string> = {
      baja: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      media: 'bg-orange-100 text-orange-800 border-orange-300',
      alta: 'bg-red-100 text-red-800 border-red-300',
      crítica: 'bg-red-900 text-white border-red-900',
    };
    return colores[severidad] || colores.media;
  };

  return (
    <div className="space-y-6">
      {/* Selector de Paciente */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Paciente</CardTitle>
          <CardDescription>
            Selecciona un paciente para administrar sus avisos y alertas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedPacienteId} onValueChange={setSelectedPacienteId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un paciente" />
            </SelectTrigger>
            <SelectContent>
              {pacientes.data?.map((paciente) => (
                <SelectItem key={paciente.id} value={paciente.id}>
                  {paciente.primer_nombre} {paciente.primer_apellido} - {paciente.ppi}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Avisos */}
      {pacienteSeleccionado ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Avisos y Alertas</CardTitle>
                <CardDescription>
                  {pacienteSeleccionado.primer_nombre} {pacienteSeleccionado.primer_apellido}
                </CardDescription>
              </div>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Aviso
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Aviso</DialogTitle>
                    <DialogDescription>
                      Agrega un aviso o alerta importante para el paciente
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tipo">Tipo de Aviso *</Label>
                        <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alerta">Alerta</SelectItem>
                            <SelectItem value="alergia">Alergia</SelectItem>
                            <SelectItem value="contraindicacion">Contraindicación</SelectItem>
                            <SelectItem value="precaución">Precaución</SelectItem>
                            <SelectItem value="importante">Importante</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="severidad">Severidad *</Label>
                        <Select value={formData.severidad} onValueChange={(value: any) => setFormData({ ...formData, severidad: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baja">Baja</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="crítica">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="titulo">Título *</Label>
                      <Input
                        id="titulo"
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        placeholder="Ej: Alergia a Penicilina"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descripcion">Descripción *</Label>
                      <Textarea
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Describe el aviso, síntomas, reacción, etc."
                        className="min-h-32"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isAddingAviso}>
                        {isAddingAviso ? 'Creando...' : 'Crear Aviso'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {avisosPaciente.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay avisos registrados para este paciente
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {avisosPaciente.map((aviso: any, idx: number) => (
                  <div
                    key={idx}
                    className={`border-l-4 rounded-lg p-4 ${getSeveridadColor(aviso.severidad)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <div>
                          <h3 className="font-semibold">{aviso.titulo}</h3>
                          <p className="text-sm">{getTipoBadge(aviso.tipo)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <p className="text-sm whitespace-pre-wrap mb-2">{aviso.descripcion}</p>

                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="outline">
                        {aviso.severidad.charAt(0).toUpperCase() + aviso.severidad.slice(1)}
                      </Badge>
                      <span>
                        Creado: {new Date(aviso.fecha_creacion).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Selecciona un paciente para administrar sus avisos y alertas
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AvisosManager;
