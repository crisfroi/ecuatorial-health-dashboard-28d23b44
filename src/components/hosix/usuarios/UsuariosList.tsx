import React, { useState } from 'react';
import { useHosixUsers } from '@/hooks/useHosixUsers';
import { useHosixAuth } from '@/hooks/useHosixAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit, Lock, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useHosixAuditoria } from '@/hooks/useHosixAuditoria';

const UsuariosList: React.FC = () => {
  const { user } = useHosixAuth();
  const {
    usuarios,
    isLoadingUsuarios,
    perfiles,
    resetearIntentos,
    desactivarUsuario,
  } = useHosixUsers();
  const { auditarAcceso, auditarEliminacion } = useHosixAuditoria();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsuarios, setFilteredUsuarios] = useState(usuarios);

  // Registrar acceso
  React.useEffect(() => {
    auditarAcceso('hosix_usuarios');
  }, []);

  // Filtrar usuarios
  React.useEffect(() => {
    if (!searchTerm) {
      setFilteredUsuarios(usuarios);
    } else {
      const filtered = usuarios.filter(u =>
        u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsuarios(filtered);
    }
  }, [searchTerm, usuarios]);

  const getPerfilNombre = (perfilId: string) => {
    return perfiles.find(p => p.id === perfilId)?.nombre || 'N/D';
  };

  const handleResetearIntentos = (usuarioId: string, nombre: string) => {
    if (window.confirm(`¿Resetear intentos fallidos de ${nombre}?`)) {
      resetearIntentos(usuarioId);
    }
  };

  const handleDelete = (usuarioId: string, nombre: string) => {
    if (window.confirm(`¿Desactivar usuario ${nombre}?`)) {
      desactivarUsuario(usuarioId);
      auditarEliminacion('hosix_usuarios', usuarioId, { nombre });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>
            Centro de Salud: {user?.nombre_completo || 'Cargando...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de búsqueda */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex gap-2"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, usuario o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" type="button">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          </form>

          {/* Tabla de usuarios */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>Usuario</TableHead>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingUsuarios ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-gray-500">No hay usuarios registrados</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsuarios.map(usuario => (
                    <TableRow key={usuario.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">{usuario.username}</TableCell>
                      <TableCell>{usuario.nombre_completo}</TableCell>
                      <TableCell className="text-sm">{usuario.email}</TableCell>
                      <TableCell>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                          {getPerfilNombre(usuario.perfil_id)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {usuario.activo ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-xs">Activo</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-gray-400" />
                              <span className="text-xs">Inactivo</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {usuario.ultimo_acceso
                          ? new Date(usuario.ultimo_acceso).toLocaleDateString('es-GQ')
                          : 'Nunca'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            title="Resetear intentos"
                            onClick={() =>
                              handleResetearIntentos(usuario.id, usuario.nombre_completo)
                            }
                          >
                            <Lock className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0"
                            title="Desactivar"
                            onClick={() =>
                              handleDelete(usuario.id, usuario.nombre_completo)
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Total de Usuarios</p>
              <p className="text-2xl font-bold">{filteredUsuarios.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Usuarios Activos</p>
              <p className="text-2xl font-bold">
                {filteredUsuarios.filter(u => u.activo).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Usuarios Inactivos</p>
              <p className="text-2xl font-bold">
                {filteredUsuarios.filter(u => !u.activo).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsuariosList;
