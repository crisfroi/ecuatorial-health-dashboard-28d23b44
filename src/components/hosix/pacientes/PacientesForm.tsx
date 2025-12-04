import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { AlertCircle, Save, X } from 'lucide-react';

interface PacientesFormProps {
  pacienteId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PacientesForm: React.FC<PacientesFormProps> = ({ 
  pacienteId, 
  onSuccess, 
  onCancel 
}) => {
  const { toast } = useToast();
  const { crearPaciente, obtenerPaciente, actualizarPaciente } = useHosixPacientes();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    fecha_nacimiento: '',
    sexo: 'M',
    tipo_documento: 'Cédula',
    numero_documento: '',
    email: '',
    telefono_movil: '',
    grupo_sanguineo: 'O+',
  });

  useEffect(() => {
    if (pacienteId) {
      cargarPaciente();
    }
  }, [pacienteId]);

  const cargarPaciente = async () => {
    try {
      setLoading(true);
      const paciente = await obtenerPaciente(pacienteId!);
      if (paciente) {
        setFormData({
          primer_nombre: paciente.primer_nombre,
          segundo_nombre: paciente.segundo_nombre || '',
          primer_apellido: paciente.primer_apellido,
          segundo_apellido: paciente.segundo_apellido || '',
          fecha_nacimiento: paciente.fecha_nacimiento,
          sexo: paciente.sexo,
          tipo_documento: paciente.tipo_documento,
          numero_documento: paciente.numero_documento,
          email: paciente.email || '',
          telefono_movil: paciente.telefono_movil || '',
          grupo_sanguineo: paciente.grupo_sanguineo,
        });
      }
    } catch (err) {
      setError('Error al cargar paciente');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      
      if (!formData.primer_nombre || !formData.primer_apellido || !formData.numero_documento) {
        setError('Nombre, apellido y documento son requeridos');
        return;
      }

      if (pacienteId) {
        await actualizarPaciente(pacienteId, formData);
        toast({ title: 'Éxito', description: 'Paciente actualizado correctamente' });
      } else {
        await crearPaciente(formData);
        toast({ title: 'Éxito', description: 'Paciente creado correctamente' });
      }
      
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Error al guardar paciente');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{pacienteId ? 'Editar Paciente' : 'Nuevo Paciente'}</CardTitle>
        <CardDescription>
          Complete la información del paciente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Nombres */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primer Nombre *</label>
              <Input
                name="primer_nombre"
                value={formData.primer_nombre}
                onChange={handleChange}
                placeholder="Juan"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Segundo Nombre</label>
              <Input
                name="segundo_nombre"
                value={formData.segundo_nombre}
                onChange={handleChange}
                placeholder="Carlos"
                disabled={loading}
              />
            </div>
          </div>

          {/* Apellidos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primer Apellido *</label>
              <Input
                name="primer_apellido"
                value={formData.primer_apellido}
                onChange={handleChange}
                placeholder="García"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Segundo Apellido</label>
              <Input
                name="segundo_apellido"
                value={formData.segundo_apellido}
                onChange={handleChange}
                placeholder="López"
                disabled={loading}
              />
            </div>
          </div>

          {/* Fecha de Nacimiento y Sexo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de Nacimiento</label>
              <Input
                name="fecha_nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sexo</label>
              <select
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>
          </div>

          {/* Documento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Documento</label>
              <select
                name="tipo_documento"
                value={formData.tipo_documento}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="Cédula">Cédula</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="RUC">RUC</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Número de Documento *</label>
              <Input
                name="numero_documento"
                value={formData.numero_documento}
                onChange={handleChange}
                placeholder="0123456789"
                disabled={loading}
              />
            </div>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Teléfono Móvil</label>
              <Input
                name="telefono_movil"
                value={formData.telefono_movil}
                onChange={handleChange}
                placeholder="+593 9 XXXXXXXXX"
                disabled={loading}
              />
            </div>
          </div>

          {/* Grupo Sanguíneo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Grupo Sanguíneo</label>
            <select
              name="grupo_sanguineo"
              value={formData.grupo_sanguineo}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
