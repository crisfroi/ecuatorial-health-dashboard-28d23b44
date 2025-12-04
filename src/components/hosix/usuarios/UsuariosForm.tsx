import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useHosixUsers } from '@/hooks/useHosixUsers';
import { AlertCircle, Save, X } from 'lucide-react';

interface UsuariosFormProps {
  usuarioId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const UsuariosForm: React.FC<UsuariosFormProps> = ({
  usuarioId,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const { crearUsuario, obtenerUsuario, actualizarUsuario, perfiles } = useHosixUsers();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nombre_completo: '',
    perfil_id: '',
    password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (usuarioId) {
      cargarUsuario();
    }
  }, [usuarioId]);

  const cargarUsuario = async () => {
    try {
      setLoading(true);
      const usuario = await obtenerUsuario(usuarioId!);
      if (usuario) {
        setFormData({
          username: usuario.username,
          email: usuario.email,
          nombre_completo: usuario.nombre_completo,
          perfil_id: usuario.perfil_id,
          password: '',
          confirm_password: '',
        });
      }
    } catch (err) {
      setError('Error al cargar usuario');
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

      if (!formData.username || !formData.email || !formData.nombre_completo || !formData.perfil_id) {
        setError('Usuario, email, nombre y perfil son requeridos');
        return;
      }

      if (!usuarioId && !formData.password) {
        setError('Contraseña requerida para nuevo usuario');
        return;
      }

      if (formData.password && formData.password !== formData.confirm_password) {
        setError('Las contraseñas no coinciden');
        return;
      }

      const dataToSend = {
        username: formData.username,
        email: formData.email,
        nombre_completo: formData.nombre_completo,
        perfil_id: formData.perfil_id,
        ...(formData.password && { password: formData.password }),
      };

      if (usuarioId) {
        await actualizarUsuario(usuarioId, dataToSend);
        toast({ title: 'Éxito', description: 'Usuario actualizado correctamente' });
      } else {
        await crearUsuario(dataToSend);
        toast({ title: 'Éxito', description: 'Usuario creado correctamente' });
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Error al guardar usuario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{usuarioId ? 'Editar Usuario' : 'Nuevo Usuario'}</CardTitle>
        <CardDescription>
          Complete la información del usuario del sistema
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

          {/* Usuario */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Usuario *</label>
            <Input
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="nombre_usuario"
              disabled={loading || !!usuarioId}
              title={usuarioId ? 'No se puede cambiar el usuario' : ''}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email *</label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="usuario@example.com"
              disabled={loading}
            />
          </div>

          {/* Nombre Completo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre Completo *</label>
            <Input
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              placeholder="Juan Carlos García López"
              disabled={loading}
            />
          </div>

          {/* Perfil */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Perfil *</label>
            <select
              name="perfil_id"
              value={formData.perfil_id}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Seleccionar perfil...</option>
              {perfiles?.map(perfil => (
                <option key={perfil.id} value={perfil.id}>
                  {perfil.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Contraseña */}
          {!usuarioId && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contraseña *</label>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirmar Contraseña *</label>
                <Input
                  name="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </>
          )}

          {usuarioId && (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Deje en blanco los campos de contraseña para mantener la actual
              </AlertDescription>
            </Alert>
          )}

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
