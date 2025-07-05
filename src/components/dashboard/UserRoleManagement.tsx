import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus, Shield, Edit, Trash2, Mail, Users, Lock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const UserRoleManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([
    {
      id: 1,
      email: 'admin@sanidad.gq',
      nombre: 'Administrador Principal',
      rol: 'administrador',
      estado: 'activo',
      fechaCreacion: '2024-01-15',
      ultimoAcceso: '2024-06-23'
    },
    {
      id: 2,
      email: 'comite@sanidad.gq',
      nombre: 'Comité Evaluador',
      rol: 'comite',
      estado: 'activo',
      fechaCreacion: '2024-02-01',
      ultimoAcceso: '2024-06-22'
    },
    {
      id: 3,
      email: 'hospital.malabo@sanidad.gq',
      nombre: 'Hospital Regional Malabo',
      rol: 'hospital',
      estado: 'activo',
      fechaCreacion: '2024-02-15',
      ultimoAcceso: '2024-06-23'
    },
    {
      id: 4,
      email: 'consultor@external.com',
      nombre: 'Consultor Externo',
      rol: 'visualizador',
      estado: 'inactivo',
      fechaCreacion: '2024-03-01',
      ultimoAcceso: '2024-05-15'
    }
  ]);

  const [newUser, setNewUser] = useState({
    email: '',
    nombre: '',
    rol: '',
    estado: 'activo'
  });

  const [editingUser, setEditingUser] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const roles = [
    { value: 'administrador', label: 'Administrador', description: 'Acceso completo al sistema' },
    { value: 'comite', label: 'Comité Evaluador', description: 'Puede revisar y aprobar solicitudes' },
    { value: 'hospital', label: 'Hospital', description: 'Puede registrar incidencias y consultar datos' },
    { value: 'visualizador', label: 'Visualizador', description: 'Solo lectura de estadísticas' }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'administrador':
        return 'bg-red-100 text-red-800';
      case 'comite':
        return 'bg-blue-100 text-blue-800';
      case 'hospital':
        return 'bg-green-100 text-green-800';
      case 'visualizador':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'administrador':
        return ['Gestión completa', 'Asignación de roles', 'Configuración del sistema'];
      case 'comite':
        return ['Revisión de solicitudes', 'Aprobación/Rechazo', 'Estadísticas avanzadas'];
      case 'hospital':
        return ['Registro de incidencias', 'Consulta de profesionales', 'Estadísticas básicas'];
      case 'visualizador':
        return ['Solo lectura', 'Estadísticas básicas'];
      default:
        return [];
    }
  };

  const handleAddUser = () => {
    if (!newUser.email || !newUser.nombre || !newUser.rol) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      });
      return;
    }

    const userExists = users.some(user => user.email === newUser.email);
    if (userExists) {
      toast({
        title: "Error",
        description: "Ya existe un usuario con este correo electrónico",
        variant: "destructive",
      });
      return;
    }

    const newUserData = {
      id: users.length + 1,
      ...newUser,
      fechaCreacion: new Date().toISOString().split('T')[0],
      ultimoAcceso: null
    };

    setUsers([...users, newUserData]);
    setNewUser({ email: '', nombre: '', rol: '', estado: 'activo' });
    setIsAddDialogOpen(false);

    toast({
      title: "Usuario agregado",
      description: `Se ha enviado una invitación a ${newUser.email}`,
    });
  };

  const handleEditUser = () => {
    if (!editingUser) return;

    setUsers(users.map(user => 
      user.id === editingUser.id ? editingUser : user
    ));
    
    setEditingUser(null);
    setIsEditDialogOpen(false);

    toast({
      title: "Usuario actualizado",
      description: "Los cambios se han guardado correctamente",
    });
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter(user => user.id !== userId));
    
    toast({
      title: "Usuario eliminado",
      description: "El usuario ha sido eliminado del sistema",
    });
  };

  const handleToggleStatus = (userId: number) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, estado: user.estado === 'activo' ? 'inactivo' : 'activo' }
        : user
    ));

    const user = users.find(u => u.id === userId);
    const newStatus = user?.estado === 'activo' ? 'inactivo' : 'activo';
    
    toast({
      title: `Usuario ${newStatus === 'activo' ? 'activado' : 'desactivado'}`,
      description: `El estado del usuario ha sido actualizado`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios y Roles</h2>
          <p className="text-gray-600 mt-1">Administra los accesos y permisos del sistema</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-guinea-teal hover:bg-guinea-dark-teal">
              <UserPlus className="w-4 h-4 mr-2" />
              Agregar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-guinea-teal" />
                <span>Agregar Nuevo Usuario</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Correo Electrónico</label>
                <Input
                  type="email"
                  placeholder="usuario@sanidad.gq"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nombre Completo</label>
                <Input
                  placeholder="Nombre del usuario"
                  value={newUser.nombre}
                  onChange={(e) => setNewUser({...newUser, nombre: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Rol</label>
                <Select value={newUser.rol} onValueChange={(value) => setNewUser({...newUser, rol: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-gray-500">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddUser} className="bg-guinea-teal hover:bg-guinea-dark-teal">
                  Agregar Usuario
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumen de Roles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {roles.map((role) => {
          const count = users.filter(user => user.rol === role.value && user.estado === 'activo').length;
          return (
            <Card key={role.value} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getRoleColor(role.value).replace('text-', 'bg-').replace('100', '200')}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{role.label}</h3>
                    <p className="text-2xl font-bold text-guinea-teal">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabla de Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-guinea-teal" />
            <span>Lista de Usuarios</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead>Permisos</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.nombre}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.rol)}>
                      {roles.find(r => r.value === user.rol)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.estado)}>
                      {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.ultimoAcceso ? new Date(user.ultimoAcceso).toLocaleDateString() : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getRolePermissions(user.rol).map((permission, index) => (
                        <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {permission}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingUser(user);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(user.id)}
                        className={user.estado === 'activo' ? 'text-red-600' : 'text-green-600'}
                      >
                        <Lock className="w-4 h-4" />
                      </Button>
                      {user.rol !== 'administrador' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. El usuario perderá acceso al sistema.
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
        </CardContent>
      </Card>

      {/* Dialog de Edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5 text-guinea-teal" />
              <span>Editar Usuario</span>
            </DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Correo Electrónico</label>
                <Input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nombre Completo</label>
                <Input
                  value={editingUser.nombre}
                  onChange={(e) => setEditingUser({...editingUser, nombre: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Rol</label>
                <Select 
                  value={editingUser.rol} 
                  onValueChange={(value) => setEditingUser({...editingUser, rol: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-gray-500">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditUser} className="bg-guinea-teal hover:bg-guinea-dark-teal">
                  Guardar Cambios
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