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
import { Mail, Plus, Edit, Trash2, Users, Shield, Crown, Eye, Building2 } from "lucide-react";
import { UserProfile, UserInvitation } from "@/types/database";
import { UserRole } from "@/types/roles";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useTestInvite } from "@/hooks/useTestInvite";
import { useAuth } from "@/contexts/AuthContext";
import { useCentrosSalud } from "@/hooks/useCentrosSalud";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { PERMISSIONS } from "@/types/roles";

const UserRoleManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newUser, setNewUser] = useState<Partial<UserInvitation>>({
    email: '',
    role: 'OBSERVADOR',
    full_name: '',
    department: 'Ministerio de Sanidad y Bienestar Social'
  });

  const { inviteUser, getUserProfiles, updateUserRole, deleteUser, isLoading } = useUserManagement();
  const { loading: loadingPerms, getPermissionsForRole, getAvailablePermissions, setPermissionsForRole } = useRolePermissions();
  const { testInvite, isLoading: isTestLoading } = useTestInvite();
  const { user: currentUser, switchRole } = useAuth();
  const { data: centrosSalud = [] } = useCentrosSalud();

  const roles: Array<{ value: UserRole; label: string }> = [
    { value: 'SUPER_ADMINISTRADOR', label: 'Super Administrador' },
    { value: 'REVISOR_SOLICITUDES', label: 'Revisor de Solicitudes' },
    { value: 'PERSONALIDAD_MINISTERIAL', label: 'Personalidad Ministerial' },
    { value: 'DIRECTIVO_CENTRO_SANITARIO', label: 'Directivo Centro Sanitario' },
    { value: 'OBSERVADOR', label: 'Observador' },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const userProfiles = await getUserProfiles();
    setUsers(userProfiles);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMINISTRADOR':
        return <Crown className="w-4 h-4" />;
      case 'REVISOR_SOLICITUDES':
        return <Shield className="w-4 h-4" />;
      case 'PERSONALIDAD_MINISTERIAL':
        return <Users className="w-4 h-4" />;
      case 'DIRECTIVO_CENTRO_SANITARIO':
        return <Building2 className="w-4 h-4" />;
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
      case 'REVISOR_SOLICITUDES':
        return 'bg-blue-100 text-blue-800';
      case 'PERSONALIDAD_MINISTERIAL':
        return 'bg-purple-100 text-purple-800';
      case 'DIRECTIVO_CENTRO_SANITARIO':
        return 'bg-green-100 text-green-800';
      case 'OBSERVADOR':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleInviteUser = async () => {
    console.log('🚀 Iniciando handleInviteUser con datos:', newUser);

    if (!newUser.email || !newUser.role) {
      console.warn('⚠️ Datos incompletos:', { email: newUser.email, role: newUser.role });
      return;
    }

    const invitation: UserInvitation = {
      email: newUser.email,
      role: newUser.role,
      full_name: newUser.full_name,
      department: newUser.department || 'Ministerio de Sanidad y Bienestar Social',
      assigned_center_id: newUser.assigned_center_id,
      invited_by: currentUser?.id || 'system'
    };

    console.log('📧 Enviando invitación:', invitation);
    const result = await inviteUser(invitation);
    console.log('📬 Resultado de invitación:', result);

    if (result.success) {
      console.log('✅ Invitación exitosa, limpiando formulario');
      setNewUser({
        email: '',
        role: 'OBSERVADOR',
        full_name: '',
        department: 'Ministerio de Sanidad y Bienestar Social'
      });
      setIsAddDialogOpen(false);
      loadUsers(); // Recargar la lista de usuarios
    } else {
      console.error('❌ Error en invitación:', result.error);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const updates = {
      role: editingUser.role,
      full_name: editingUser.full_name,
      department: editingUser.department
    };

    const result = await updateUserRole(editingUser.id, updates);

    if (result.success) {
      // Si el usuario editado es el mismo que el actual, aplicar el cambio localmente
      if (editingUser.id === currentUser?.id) {
        switchRole(editingUser.role as UserRole);
      }
      setIsEditDialogOpen(false);
      setEditingUser(null);
      loadUsers(); // Recargar la lista de usuarios
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const result = await deleteUser(userId);
    
    if (result.success) {
      loadUsers(); // Recargar la lista de usuarios
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios y Roles</h2>
          <p className="text-gray-600">
            Administrar usuarios del sistema y sus permisos
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Invitar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@cualquierdominio.com"
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
              <div>
                <label className="text-sm font-medium">Departamento</label>
                <Input
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  placeholder="Departamento o área de trabajo"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Rol *</label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value) => setNewUser({ ...newUser, role: value as UserRole })}
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
              {newUser.role === 'DIRECTIVO_CENTRO_SANITARIO' && (
                <div>
                  <label className="text-sm font-medium">Centro Asignado</label>
                  <Select 
                    value={newUser.assigned_center_id} 
                    onValueChange={(value) => setNewUser({ ...newUser, assigned_center_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar centro" />
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
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => testInvite(newUser.email || 'test@test.com', newUser.role || 'OBSERVADOR')}
                  disabled={isTestLoading || !newUser.email?.trim()}
                >
                  🧪 {isTestLoading ? 'Probando...' : 'Test'}
                </Button>
                <Button
                  onClick={handleInviteUser}
                  disabled={isLoading || !newUser.email?.trim() || !newUser.role}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {isLoading ? 'Enviando...' : 'Enviar Invitación'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas de roles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          <CardTitle>Usuarios del Sistema ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Registro</TableHead>
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
                    <div className="text-sm">{user.department}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(user.created_at).toLocaleDateString('es-ES')}
                    </div>
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
                              <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. El usuario será eliminado permanentemente del sistema.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
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
              No hay usuarios registrados en el sistema
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para editar usuario */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
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
              <div>
                <label className="text-sm font-medium">Departamento</label>
                <Input
                  value={editingUser.department || ''}
                  onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Rol</label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(value) => setEditingUser({...editingUser, role: value as UserRole})}
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
