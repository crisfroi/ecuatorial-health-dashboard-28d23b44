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
import { Plus, FileUp, Download, Trash2, AlertCircle } from 'lucide-react';

const DocumentosManager: React.FC = () => {
  const { pacientes, agregarDocumento, isAddingDocumento } = useHosixPacientes();
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'otro' as 'cédula' | 'pasaporte' | 'licencia' | 'comprobante_domicilio' | 'seguro' | 'otro',
  });

  const pacienteSeleccionado = pacientes.data?.find(p => p.id === selectedPacienteId);
  const documentosPaciente = pacienteSeleccionado?.documentos || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPacienteId || !formData.nombre.trim()) {
      alert('Por favor selecciona un paciente y proporciona nombre del documento');
      return;
    }

    try {
      await agregarDocumento({
        paciente_id: selectedPacienteId,
        nombre: formData.nombre,
        tipo: formData.tipo,
        descripcion: formData.descripcion,
        url: '#', // En producción, aquí iría la URL del archivo
        fecha_carga: new Date().toISOString(),
      });

      setShowForm(false);
      setFormData({
        nombre: '',
        descripcion: '',
        tipo: 'otro',
      });
    } catch (error) {
      console.error('Error al agregar documento:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector de Paciente */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Paciente</CardTitle>
          <CardDescription>
            Selecciona un paciente para administrar sus documentos
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

      {/* Documentos */}
      {pacienteSeleccionado ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Documentos</CardTitle>
                <CardDescription>
                  {pacienteSeleccionado.primer_nombre} {pacienteSeleccionado.primer_apellido}
                </CardDescription>
              </div>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button>
                    <FileUp className="w-4 h-4 mr-2" />
                    Agregar Documento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Documento</DialogTitle>
                    <DialogDescription>
                      Carga un nuevo documento para el paciente
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre del Documento *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej: Cédula de identidad, Comprobante de domicilio"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cédula">Cédula de Identidad</SelectItem>
                          <SelectItem value="pasaporte">Pasaporte</SelectItem>
                          <SelectItem value="licencia">Licencia de Conducir</SelectItem>
                          <SelectItem value="comprobante_domicilio">Comprobante de Domicilio</SelectItem>
                          <SelectItem value="seguro">Documento de Seguro</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Input
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Información adicional (opcional)"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isAddingDocumento}>
                        {isAddingDocumento ? 'Agregando...' : 'Agregar'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {documentosPaciente.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay documentos cargados para este paciente
                </AlertDescription>
              </Alert>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Fecha Carga</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentosPaciente.map((doc: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{doc.nombre}</TableCell>
                        <TableCell>{doc.tipo}</TableCell>
                        <TableCell className="text-sm text-gray-600">{doc.descripcion || '-'}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(doc.fecha_carga).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
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
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Selecciona un paciente para administrar sus documentos
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentosManager;
