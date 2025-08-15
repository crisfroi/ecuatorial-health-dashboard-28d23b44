
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Mail, Plus, Edit, Trash2, Users, Shield, Crown, Eye, Building2, Hospital } from "lucide-react";
import { UserRole } from "@/types/roles";
import { useAuth } from "@/contexts/AuthContext";
import { useCentrosSalud } from "@/hooks/useCentrosSalud";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  assigned_center_id?: string;
  department?: string;
  is_active: boolean;
  created_at: string;
  center_name?: string;
}

const UserRoleManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    role: 'OBSERVADOR' as UserRole,
    full_name: '',
    department: 'Ministerio de Sanidad y Bienestar Social',
    assigned_center_id: ''
  });

  const { user: currentUser, refreshProfile } = useAuth();
  const { data: centrosSalud = [] } = useCentrosSalud();

  const roles: Array<{ value: UserRole; label: string; description: string }> = [
    { 
      value: 'SUPER_ADMINISTRADOR', 
      label: 'Super Administrador',
      description: 'Acceso completo al sistema'
    },
    { 
      value: 'PERSONALIDAD_MINISTERIAL', 
      label: 'Personalidad Ministerial',
      description: 'Panel ministerial, validación de nóminas'
    },
    { 
      value: 'DIRECTIVO_CENTRO_SANITARIO', 
      label: 'Directivo Centro Sanitario',
      description: 'Gestión de guardias de su centro asignado'
    },
    { 
      value: 'HOSPITAL', 
      label: 'Gestión Hospitalaria',
      description: 'Gestión de red hospitalaria asignada'
    },
    { 
      value: 'REVISOR_SOLICITUDES', 
      label: 'Revisor de Solicitudes',
      description: 'Revisión y validación de solicitudes'
    },
    { 
      value: 'OBSERVADOR', 
      label: 'Observador',
      description: 'Solo lectura de datos públicos'
    },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          centros_salud:assigned_center_id (
            nombre
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithCenterName = data.map(user => ({
        ...user,
        center_name: user.centros_salud?.nombre
      }));

      setUsers(usersWithCenterName as UserProfile[]);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMINISTRADOR':
        return <Crown className="w-4 h-4" />;
      case 'PERSONALIDAD_MINISTERIAL':
        return <Users className="w-4 h-4" />;
      case 'DIRECTIVO_CENTRO_SANITARIO':
        return <Building2 className="w-4 h-4" />;
      case 'HOSPITAL':
        return <Hospital className="w-4 h-4" />;
      case 'REVISOR_SOLICITUDES':
        return <Shield className="w-4 h-4" />;
      case 'OBSERVADOR':
        return <Eye className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMINISTRADOR':
        return 'bg-red-100 text-red-800';
      case 'PERSONALIDAD_MINISTERIAL':
        return 'bg-purple-100 text-purple-800';
      case 'DIRECTIVO_CENTRO_SANITARIO':
        return 'bg-green-100 text-green-800';
      case 'HOSPITAL':
        return 'bg-teal-100 text-teal-800';
      case 'REVISOR_SOLICITUDES':
        return 'bg-blue-100 text-blue-800';
      case 'OBSERVADOR':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.role) {
      toast.error('Email y rol son requeridos');
      return;
    }

    setIsLoading(true);
    try {
      // Create the user profile directly in the database
      // In a real app, you would use Supabase Auth admin functions
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: crypto.randomUUID(), // Temporary ID for demo
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          department: newUser.department,
          assigned_center_id: newUser.assigned_center_id || null,
          created_by: currentUser?.id
        });

      if (profileError) throw profileError;

      toast.success('Usuario creado exitosamente');
      
      setNewUser({
        email: '',
        role: 'OBSERVADOR',
        full_name: '',
        department: 'Ministerio de Sanidad y Bienestar Social',
        assigned_center_id: ''
      });
      setIsAddDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('Error al crear usuario: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: editingUser.full_name,
          role: editingUser.role,
          department: editingUser.department,
          assigned_center_id: editingUser.assigned_center_id || null,
          is_active: editingUser.is_active
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast.success('Usuario actualizado exitosamente');
      setIsEditDialogOpen(false);
      setEditingUser(null);
      loadUsers();
      
      // Refresh current user profile if editing themselves
      if (editingUser.id === currentUser?.id) {
        await refreshProfile();
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error('Error al actualizar usuario: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Usuario desactivado exitosamente');
      loadUsers();
    } catch (error: any) {
      console.error('Error deactivating user:', error);
      toast.error('Error al desactivar usuario: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const requiresCenter = (role: UserRole) => {
    return ['DIRECTIVO_CENTRO_SANITARIO', 'HOSPITAL'].includes(role);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios y Roles</h2>
          <p className="text-gray-600">
            Administrar usuarios del sistema con control de acceso multinivel
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="usuario@ministerio.gq"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nombre Completo</label>
                  <Input
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    placeholder="Nombre completo del usuario"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Rol del Sistema *</label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value) => setNewUser({ ...newUser, role: value as UserRole, assigned_center_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(role.value)}
                            <span className="font-medium">{role.label}</span>
                          </div>
                          <span className="text-xs text-gray-500">{role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {requiresCenter(newUser.role) && (
                <div>
                  <label className="text-sm font-medium">
                    {newUser.role === 'HOSPITAL' ? 'Red Hospitalaria Asignada *' : 'Centro Sanitario Asignado *'}
                  </label>
                  <Select
                    value={newUser.assigned_center_id}
                    onValueChange={(value) => setNewUser({ ...newUser, assigned_center_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar centro..." />
                    </SelectTrigger>
                    <SelectContent>
                      {centrosSalud
                        .filter(centro => 
                          newUser.role === 'HOSPITAL' 
                            ? centro.categoria?.includes('Hospital') 
                            : true
                        )
                        .map((centro) => (
                        <SelectItem key={centro.id} value={centro.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{centro.nombre}</span>
                            <span className="text-xs text-gray-500">
                              {centro.categoria} - {centro.distrito_sanitario}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Departamento</label>
                <Input
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  placeholder="Departamento o área de trabajo"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateUser}
                  disabled={isLoading || !newUser.email?.trim() || !newUser.role || 
                           (requiresCenter(newUser.role) && !newUser.assigned_center_id)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {isLoading ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas de roles */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {roles.map((role) => {
          const count = users.filter(user => user.role === role.value && user.is_active).length;
          return (
            <Card key={role.value}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getRoleColor(role.value)}`}>
                    {getRoleIcon(role.value)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">{role.label}</p>
                    <p className="text-xl font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema ({users.filter(u => u.is_active).length} activos)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Centro Asignado</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.full_name || user.email}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(user.role)}
                        {roles.find(r => r.value === user.role)?.label}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.center_name ? (
                      <div className="text-sm">
                        <div className="font-medium">{user.center_name}</div>
                        <div className="text-gray-500 text-xs">Centro asignado</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No asignado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{user.department}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingUser(user);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      {user.role !== 'SUPER_ADMINISTRADOR' && user.id !== currentUser?.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Desactivar usuario?</AlertDialogTitle>
                              <AlertDialogDescription>
                                El usuario será desactivado pero no eliminado del sistema.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Desactivar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {isLoading ? 'Cargando usuarios...' : 'No hay usuarios registrados en el sistema'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para editar usuario */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={editingUser.email} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Nombre Completo</label>
                  <Input
                    value={editingUser.full_name || ''}
                    onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Rol</label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(value) => setEditingUser({
                    ...editingUser, 
                    role: value as UserRole,
                    assigned_center_id: requiresCenter(value as UserRole) ? editingUser.assigned_center_id : undefined
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role.value)}
                          {role.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {requiresCenter(editingUser.role) && (
                <div>
                  <label className="text-sm font-medium">Centro Asignado</label>
                  <Select
                    value={editingUser.assigned_center_id || ''}
                    onValueChange={(value) => setEditingUser({...editingUser, assigned_center_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar centro..." />
                    </SelectTrigger>
                    <SelectContent>
                      {centrosSalud.map((centro) => (
                        <SelectItem key={centro.id} value={centro.id}>
                          {centro.nombre} - {centro.categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Departamento</label>
                <Input
                  value={editingUser.department || ''}
                  onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editingUser.is_active}
                  onChange={(e) => setEditingUser({...editingUser, is_active: e.target.checked})}
                  className="rounded"
                />
                <label className="text-sm">Usuario activo</label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdateUser} disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserRoleManagement;
