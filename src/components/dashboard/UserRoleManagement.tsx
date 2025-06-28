
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UserPlus, Mail, Shield, Trash2, Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const formSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['administrador', 'visualizer', 'hospital', 'comite']),
  full_name: z.string().min(1, 'Nombre completo es requerido'),
});

type FormData = z.infer<typeof formSchema>;

const UserRoleManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [users, setUsers] = useState([
    {
      id: '1',
      email: 'admin@minsalud.gq',
      full_name: 'Dr. Carlos Obiang',
      role: 'administrador',
      created_at: '2024-01-15',
      last_sign_in: '2024-06-27'
    },
    {
      id: '2',
      email: 'visualizer@minsalud.gq',
      full_name: 'Ana Nguema',
      role: 'visualizer',
      created_at: '2024-02-10',
      last_sign_in: '2024-06-26'
    }
  ]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      role: 'visualizer',
      full_name: ''
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Invitar usuario por email usando Supabase Auth Admin
      const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(data.email, {
        data: {
          role: data.role,
          full_name: data.full_name
        },
        redirectTo: `${window.location.origin}/dashboard`
      });

      if (authError) {
        console.error('Error inviting user:', authError);
        toast.error('Error al enviar invitación: ' + authError.message);
        return;
      }

      console.log('User invited successfully:', authData);
      
      // Actualizar la lista local de usuarios
      const newUser = {
        id: authData.user?.id || Math.random().toString(),
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        created_at: new Date().toISOString().split('T')[0],
        last_sign_in: 'Nunca'
      };

      setUsers(prev => [...prev, newUser]);
      toast.success('Invitación enviada correctamente');
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Error al crear usuario');
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      'administrador': 'bg-red-100 text-red-800',
      'visualizer': 'bg-blue-100 text-blue-800',
      'hospital': 'bg-green-100 text-green-800',
      'comite': 'bg-purple-100 text-purple-800'
    };
    return roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      'administrador': 'Administrador',
      'visualizer': 'Visualizador',
      'hospital': 'Hospital',
      'comite': 'Comité Ministerial'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Gestión de Usuarios y Roles</span>
            </span>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invitar Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Dr. Juan Pérez" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="usuario@minsalud.gq" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol del Usuario</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="visualizer">Visualizador</SelectItem>
                              <SelectItem value="hospital">Hospital</SelectItem>
                              <SelectItem value="comite">Comité Ministerial</SelectItem>
                              <SelectItem value="administrador">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar Invitación
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadge(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.created_at}</TableCell>
                    <TableCell>{user.last_sign_in}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Descripción de Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-red-700 mb-2">Administrador</h3>
              <p className="text-sm text-gray-600">
                Acceso completo al sistema. Puede gestionar usuarios, procesar solicitudes, 
                ver estadísticas y configurar el sistema.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-blue-700 mb-2">Visualizador</h3>
              <p className="text-sm text-gray-600">
                Puede ver estadísticas, profesionales registrados y centros de salud. 
                Sin permisos de edición.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-green-700 mb-2">Hospital</h3>
              <p className="text-sm text-gray-600">
                Gestión de incidencias hospitalarias y seguimiento de profesionales 
                en su institución.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-purple-700 mb-2">Comité Ministerial</h3>
              <p className="text-sm text-gray-600">
                Revisión y aprobación de solicitudes, generación de reportes ministeriales 
                y toma de decisiones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoleManagement;
