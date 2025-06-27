import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
interface ProfileSettingsProps {
  onClose: () => void;
}
const ProfileSettings = ({
  onClose
}: ProfileSettingsProps) => {
  const {
    user,
    userRole
  } = useAuth();
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente"
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'US';
  };
  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      'administrador': 'Administrador',
      'visualizer': 'Visualizador',
      'hospital': 'Hospital',
      'comite': 'Comité'
    };
    return roleNames[role] || role;
  };
  return <div className="min-h-screen bg-gradient-to-br from-guinea-light-teal/10 via-white to-guinea-teal/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} className="flex items-center space-x-2 text-base">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </Button>
          <h1 className="text-2xl font-bold text-guinea-dark-teal">Configuración del Perfil</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Perfil de Usuario */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-guinea-teal" />
                <span>Información del Usuario</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-xl bg-guinea-teal text-white">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{user?.email}</h3>
                  <p className="text-sm text-gray-600">
                    Rol: {getRoleDisplayName(userRole || 'usuario')}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" type="email" value={user?.email || ''} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol del Sistema</Label>
                  <Input id="role" value={getRoleDisplayName(userRole || 'usuario')} disabled className="bg-gray-50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="created">Fecha de Registro</Label>
                <Input id="created" value={user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'No disponible'} disabled className="bg-gray-50" />
              </div>
            </CardContent>
          </Card>

          {/* Configuración del Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-guinea-teal" />
                <span>Configuración</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Preferencias del Sistema</Label>
                <p className="text-sm text-gray-600">
                  Las configuraciones avanzadas están disponibles según tu rol de usuario.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Información de la Sesión</Label>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>ID de Usuario: {user?.id?.substring(0, 8)}...</p>
                  <p>Estado: Activo</p>
                  <p>Última Actividad: {new Date().toLocaleDateString('es-ES')}</p>
                </div>
              </div>

              <Separator />

              <Button variant="destructive" onClick={handleLogout} disabled={isLoading} className="w-full flex items-center space-x-2">
                <LogOut className="w-4 h-4" />
                <span>{isLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Información del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema RENAPROSA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-guinea-dark-teal">Versión del Sistema</h4>
                <p className="text-gray-600">RENAPROSA v2.0</p>
              </div>
              <div>
                <h4 className="font-medium text-guinea-dark-teal">Última Actualización</h4>
                <p className="text-gray-600">Junio 2025</p>
              </div>
              <div>
                <h4 className="font-medium text-guinea-dark-teal">Soporte Técnico</h4>
                <p className="text-gray-600">soporterenaprosa@sermed.com</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default ProfileSettings;