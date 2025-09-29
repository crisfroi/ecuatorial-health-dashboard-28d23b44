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
import { useBuscarCentros } from "@/hooks/useCentrosSalud";
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
  const [directMode, setDirectMode] = useState<boolean>(false);
  const [directUsername, setDirectUsername] = useState<string>('');
  const [directPassword, setDirectPassword] = useState<string>('');
  // 👇 NUEVO ESTADO PARA EL EMAIL OPCIONAL
  const [directEmail, setDirectEmail] = useState<string>(''); 

  const { inviteUser, createUserWithCredentials, getUserProfiles, updateUserRole, deleteUser, isLoading } = useUserManagement();
  const { loading: loadingPerms, getPermissionsForRole, getAvailablePermissions, setPermissionsForRole } = useRolePermissions();
  const { testInvite, isLoading: isTestLoading } = useTestInvite();
  const { user: currentUser, switchRole } = useAuth();
  const { data: centrosSalud = [] } = useBuscarCentros({});

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

  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');

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
              <DialogTitle>Agregar Usuario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Modo</span>
                <div className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setDirectMode(false)}
                    className={`px-3 py-1 rounded ${!directMode ? 'bg-guinea-teal text-white' : 'bg-gray-100'}`}
                  >Invitación por email</button>
                  <button
                    type="button"
                    onClick={() => setDirectMode(true)}
                    className={`px-3 py-1 rounded ${directMode ? 'bg-guinea-teal text-white' : 'bg-gray-100'}`}
                  >Crear con usuario/contraseña</button>
                </div>
              </div>

              {!directMode && (
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="usuario@cualquierdominio.com"
                  />
                </div>
              )}

              {directMode && (
                <>
                  <div>
                    <label className="text-sm font-medium">Nombre de usuario *</label>
                    <Input
                      type="text"
                      value={directUsername}
                      onChange={(e) => setDirectUsername(e.target.value)}
                      placeholder="ej: juanfr"
                    />
                    <p className='text-xs text-yellow-600 mt-1'>
                      Este será el identificador principal. Si el email opcional está vacío, se usará este campo con un dominio interno.
                    </p>
                  </div>
                  {/* 👇 NUEVO CAMPO EMAIL OPCIONAL */}
                  <div>
                    <label className="text-sm font-medium">Email (Opcional)</label>
                    <Input
                      type="email"
                      value={directEmail}
                      onChange={(e) => setDirectEmail(e.target.value)}
                      placeholder="ej: juanfr@sanidad.gq (anulará el nombre de usuario como identificador)"
                    />
                  </div>
                  {/* 👆 FIN NUEVO CAMPO */}
                  <div>
                    <label className="text-sm font-medium">Contraseña *</label>
                    <Input
                      type="password"
                      value={directPassword}
                      onChange={(e) => setDirectPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres con mayúscula y símbolo"
                    />
                  </div>
                </>
              )}

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
                {!directMode && (
                  <>
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
                  </>
                )}
                {directMode && (
                  <Button
                    onClick={async () => {
                      const usernamePrefix = directUsername.trim();
                      const optionalEmail = directEmail.trim();

                      // 1. Determinar el identificador final que debe ser un email válido
                      let finalIdentifier: string;

                      if (optionalEmail) {
                        // Opción 1: Si el email opcional se proporciona, se usa directamente
                        finalIdentifier = optionalEmail;
                      } else {
                        // Opción 2: Si el email opcional está vacío, se usa el nombre de usuario
                        // y se le aplica el dominio de contingencia si no tiene formato de email.
                        finalIdentifier = usernamePrefix.includes('@') 
                          ? usernamePrefix 
                          : `${usernamePrefix}@sanidad.gq`; // ✅ Dominio solicitado
                      }
                      
                      // Se mantiene la validación de campos obligatorios
                      if (!usernamePrefix || !directPassword.trim() || !newUser.role) return;

                      const res = await createUserWithCredentials({
                        username: finalIdentifier,
                        password: directPassword,
                        role: (newUser.role as UserRole) || 'OBSERVADOR',
                        full_name: newUser.full_name?.trim(),
                        department: newUser.department?.trim(),
                        assigned_center_id: newUser.assigned_center_id
                      });
                      if (res.success) {
                        setDirectUsername('');
                        setDirectPassword('');
                        setDirectEmail(''); // Limpiar el nuevo campo
                        setNewUser({ email: '', role: 'OBSERVADOR', full_name: '', department: 'Ministerio de Sanidad y Bienestar Social' });
                        setIsAddDialogOpen(false);
                        loadUsers();
                      }
                    }}
                    disabled={isLoading || !directUsername.trim() || !directPassword.trim() || !newUser.role}
                  >
                    Crear Usuario
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

{/* ... resto del componente sin cambios ... */}
