import React, { useState, useEffect } from 'react';
import { useHosixPacientes, PacienteFormData } from '@/hooks/useHosixPacientes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PacienteFormProps {
  paciente?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PacienteForm({ paciente, onSuccess, onCancel }: PacienteFormProps) {
  const { crearPaciente, isCreatingPaciente, actualizarPaciente, isUpdatingPaciente, buscarDuplicados } = useHosixPacientes();
  const [formData, setFormData] = useState<PacienteFormData>({
    primer_nombre: '',
    primer_apellido: '',
    fecha_nacimiento: '',
    sexo: 'M',
    centro_registro_id: '',
  });
  const [duplicados, setDuplicados] = useState<any[]>([]);
  const [checkedDuplicados, setCheckedDuplicados] = useState(false);
  const isLoading = isCreatingPaciente || isUpdatingPaciente;

  useEffect(() => {
    if (paciente) {
      setFormData(paciente);
    }
  }, [paciente]);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleBuscarDuplicados = async () => {
    if (!formData.numero_documento) {
      toast.warning('Ingrese número de documento para buscar duplicados');
      return;
    }

    const dups = await buscarDuplicados(formData.numero_documento);
    setDuplicados(dups);
    setCheckedDuplicados(true);

    if (dups.length > 0) {
      toast.warning(`Se encontraron ${dups.length} paciente(s) con el mismo documento`);
    } else {
      toast.success('No se encontraron pacientes duplicados');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.primer_nombre || !formData.primer_apellido || !formData.fecha_nacimiento) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    if (paciente) {
      actualizarPaciente(
        { id: paciente.id, data: formData },
        {
          onSuccess: () => {
            toast.success('Paciente actualizado correctamente');
            onSuccess();
          },
          onError: (error: any) => {
            toast.error(`Error: ${error.message}`);
          },
        }
      );
    } else {
      crearPaciente(formData, {
        onSuccess: () => {
          toast.success('Paciente creado correctamente');
          onSuccess();
        },
        onError: (error: any) => {
          toast.error(`Error: ${error.message}`);
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Personal */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primer_nombre">Primer Nombre *</Label>
            <Input
              id="primer_nombre"
              value={formData.primer_nombre}
              onChange={(e) => handleChange('primer_nombre', e.target.value)}
              placeholder="Juan"
              required
            />
          </div>
          <div>
            <Label htmlFor="segundo_nombre">Segundo Nombre</Label>
            <Input
              id="segundo_nombre"
              value={formData.segundo_nombre || ''}
              onChange={(e) => handleChange('segundo_nombre', e.target.value)}
              placeholder="Carlos"
            />
          </div>
          <div>
            <Label htmlFor="primer_apellido">Primer Apellido *</Label>
            <Input
              id="primer_apellido"
              value={formData.primer_apellido}
              onChange={(e) => handleChange('primer_apellido', e.target.value)}
              placeholder="Pérez"
              required
            />
          </div>
          <div>
            <Label htmlFor="segundo_apellido">Segundo Apellido</Label>
            <Input
              id="segundo_apellido"
              value={formData.segundo_apellido || ''}
              onChange={(e) => handleChange('segundo_apellido', e.target.value)}
              placeholder="García"
            />
          </div>
          <div>
            <Label htmlFor="fecha_nacimiento">Fecha Nacimiento *</Label>
            <Input
              id="fecha_nacimiento"
              type="date"
              value={formData.fecha_nacimiento}
              onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="sexo">Sexo *</Label>
            <Select value={formData.sexo} onValueChange={(value) => handleChange('sexo', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Documentación */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Documentación</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tipo_documento">Tipo de Documento</Label>
            <Select value={formData.tipo_documento || ''} onValueChange={(value) => handleChange('tipo_documento', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cedula">Cédula de Identidad</SelectItem>
                <SelectItem value="pasaporte">Pasaporte</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="numero_documento">Número de Documento</Label>
            <Input
              id="numero_documento"
              value={formData.numero_documento || ''}
              onChange={(e) => handleChange('numero_documento', e.target.value)}
              placeholder="0123456789"
            />
          </div>
          <div className="col-span-2">
            {formData.numero_documento && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBuscarDuplicados}
                className="w-full"
              >
                🔍 Buscar Duplicados
              </Button>
            )}
          </div>
        </div>

        {checkedDuplicados && duplicados.length > 0 && (
          <Alert className="mt-4 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              Se encontraron {duplicados.length} paciente(s) con el mismo documento. Revise antes de guardar.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Contacto */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="telefono_fijo">Teléfono Fijo</Label>
            <Input
              id="telefono_fijo"
              value={formData.telefono_fijo || ''}
              onChange={(e) => handleChange('telefono_fijo', e.target.value)}
              placeholder="+240 333 012345"
            />
          </div>
          <div>
            <Label htmlFor="telefono_movil">Teléfono Móvil</Label>
            <Input
              id="telefono_movil"
              value={formData.telefono_movil || ''}
              onChange={(e) => handleChange('telefono_movil', e.target.value)}
              placeholder="+240 222 123456"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="paciente@example.com"
            />
          </div>
        </div>
      </div>

      {/* Información Médica */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Información Médica</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="grupo_sanguineo">Grupo Sanguíneo</Label>
            <Select value={formData.grupo_sanguineo || ''} onValueChange={(value) => handleChange('grupo_sanguineo', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="numero_poliza">Número de Póliza</Label>
            <Input
              id="numero_poliza"
              value={formData.numero_poliza || ''}
              onChange={(e) => handleChange('numero_poliza', e.target.value)}
              placeholder="POL-2025-001234"
            />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : paciente ? 'Actualizar' : 'Crear Paciente'}
        </Button>
      </div>
    </form>
  );
}
