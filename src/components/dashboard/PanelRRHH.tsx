import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  UserPlus, 
  Settings, 
  Shield,
  Building,
  FileText,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { UserRole, ROLE_DEFINITIONS } from '@/types/roles';

interface PanelRRHHProps {
  userRole: UserRole;
}

const PanelRRHH: React.FC<PanelRRHHProps> = ({ userRole }) => {
  const [selectedTab, setSelectedTab] = useState('usuarios');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    fullName: '',
    role: 'OBSERVADOR' as UserRole,
    centroAsignado: '',
    department: '',
    permissions: [] as string[]
  });

  // Mock data para demostración
  const usuarios = [
    { id: '1', email: 'juan.perez@ministerio.gq', fullName: 'Juan Pérez', role: 'REVISOR_SOLICITUDES', centro: 'Hospital Nacional', active: true },
    { id: '2', email: 'maria.garcia@centro1.gq', fullName: 'María García', role: 'ADMIN_CENTRO_SANITARIO', centro: 'Centro Malabo', active: true },
    { id: '3', email: 'carlos.lopez@observador.gq', fullName: 'Carlos López', role: 'OBSERVADOR', centro: null, active: false }
  ];

  const centrosSalud = [
    { id: '1', nombre: 'Hospital Nacional', categoria: 'Hospital', distrito: 'Malabo' },
    { id: '2', nombre: 'Centro Malabo', categoria: 'Centro de Salud', distrito: 'Malabo' },
    { id: '3', nombre: 'Clínica Bata', categoria: 'Clínica', distrito: 'Bata' }
  ];

  const handleCreateUser = () => {
    console.log('Creating user:', newUser);
    // Aquí iría la lógica para crear el usuario
    setIsCreateUserOpen(false);
    setNewUser({
      email: '',
      fullName: '',
      role: 'OBSERVADOR',
      centroAsignado: '',
      department: '',
      permissions: []
    });
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMINISTRADOR':
        return 'bg-red-100 text-red-800';
      case 'RRHH_MINISTERIO':
        return 'bg-purple-100 text-purple-800';
      case 'MIEMBRO_GOBIERNO':
        return 'bg-blue-100 text-blue-800';
      case 'HABILITACION':
        return 'bg-green-100 text-green-800';
      case 'ADMIN_CENTRO_SANITARIO':
        return 'bg-orange-100 text-orange-800';
      case 'REVISOR_SOLICITUDES':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Panel de Recursos Humanos
            </CardTitle>
            <Badge variant="outline">
              {usuarios.filter(u => u.active).length} usuarios activos
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="usuarios">
                <Users className="w-4 h-4 mr-2" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="roles">
                <Settings className="w-4 h-4 mr-2" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="centros">
                <Building className="w-4 h-4 mr-2" />
                Centros
              </TabsTrigger>
              <TabsTrigger value="solicitudes">
                <FileText className="w-4 h-4 mr-2" />
                Solicitudes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="usuarios" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Gestión de Usuarios</h3>
                <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Crear Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Email</label>
                          <Input
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            placeholder="usuario@ministerio.gq"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Nombre Completo</label>
                          <Input
                            value={newUser.fullName}
                            onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                            placeholder="Juan Pérez García"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Rol</label>
                          <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser({...newUser, role: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ROLE_DEFINITIONS).map(([key, role]) => (
                                <SelectItem key={key} value={key}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Centro Asignado</label>
                          <Select value={newUser.centroAsignado} onValueChange={(value) => setNewUser({...newUser, centroAsignado: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar centro" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Sin centro asignado</SelectItem>
                              {centrosSalud.map((centro) => (
                                <SelectItem key={centro.id} value={centro.id}>
                                  {centro.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">Departamento</label>
                        <Input
                          value={newUser.department}
                          onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                          placeholder="Departamento de Recursos Humanos"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleCreateUser}>
                          Crear Usuario
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Centro</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{usuario.fullName}</div>
                            <div className="text-sm text-gray-500">{usuario.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(usuario.role as UserRole)}>
                            {ROLE_DEFINITIONS[usuario.role as UserRole]?.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {usuario.centro || 'No asignado'}
                        </TableCell>
                        <TableCell>
                          {usuario.active ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Activo
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactivo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4">
              <h3 className="text-lg font-medium">Configuración de Roles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(ROLE_DEFINITIONS).map(([key, role]) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {role.name}
                        <Badge className={getRoleBadgeColor(key as UserRole)}>
                          {role.permissions.length} permisos
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Pestañas disponibles:</div>
                        <div className="flex flex-wrap gap-1">
                          {role.dashboardTabs.map((tab) => (
                            <Badge key={tab} variant="outline" className="text-xs">
                              {tab}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="centros" className="space-y-4">
              <h3 className="text-lg font-medium">Gestión de Centros de Salud</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Centro</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Distrito</TableHead>
                      <TableHead>Usuarios Asignados</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {centrosSalud.map((centro) => (
                      <TableRow key={centro.id}>
                        <TableCell className="font-medium">{centro.nombre}</TableCell>
                        <TableCell>{centro.categoria}</TableCell>
                        <TableCell>{centro.distrito}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {usuarios.filter(u => u.centro === centro.nombre).length} usuarios
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Users className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="solicitudes" className="space-y-4">
              <h3 className="text-lg font-medium">Solicitudes de Traslado</h3>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No hay solicitudes de traslado pendientes</p>
                    <p className="text-sm">Las nuevas solicitudes aparecerán aquí para su revisión</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PanelRRHH;