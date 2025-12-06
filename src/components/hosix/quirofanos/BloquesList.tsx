import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useHosixQuirofanos } from '@/hooks/useHosixQuirofanos';
import { Plus, Edit2, Clock, MapPin, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface BloqueFormData {
  nombre: string;
  descripcion: string;
  ubicacion: string;
  telefono: string;
  horario_inicio: string;
  horario_fin: string;
  dias_operacion: string;
}

export function BloquesList() {
  const { useBloquesQuery, crearBloqueMutation } = useHosixQuirofanos();
  const { data: bloques = [], isLoading } = useBloquesQuery();
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState('');

  const form = useForm<BloqueFormData>({
    defaultValues: {
      horario_inicio: '07:00',
      horario_fin: '19:00',
      dias_operacion: 'L,M,X,J,V',
    },
  });

  const bloquesFiltrados = bloques.filter(b =>
    b.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    b.ubicacion?.toLowerCase().includes(filtro.toLowerCase())
  );

  const onSubmit = async (data: BloqueFormData) => {
    await crearBloqueMutation.mutateAsync({
      ...data,
      numero_salas: 0,
      activo: true,
    });
    form.reset();
    setOpen(false);
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando bloques...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Buscar bloques..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="max-w-sm"
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Bloque
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Bloque Quirúrgico</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  {...form.register('nombre', { required: true })}
                  placeholder="Ej: Bloque A - Cirugia General"
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  {...form.register('descripcion')}
                  placeholder="Describir el bloque..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ubicación</Label>
                  <Input
                    {...form.register('ubicacion')}
                    placeholder="Ej: Planta 2"
                  />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    {...form.register('telefono')}
                    placeholder="+593 999 123 456"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Horario Inicio</Label>
                  <Input
                    type="time"
                    {...form.register('horario_inicio')}
                  />
                </div>
                <div>
                  <Label>Horario Fin</Label>
                  <Input
                    type="time"
                    {...form.register('horario_fin')}
                  />
                </div>
              </div>
              <div>
                <Label>Días Operación (separados por coma)</Label>
                <Input
                  {...form.register('dias_operacion')}
                  placeholder="L,M,X,J,V"
                />
              </div>
              <Button type="submit" className="w-full">Crear Bloque</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Salas
            </TableHead>
            <TableHead className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Horario
            </TableHead>
            <TableHead>Días</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bloquesFiltrados.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                No hay bloques quirúrgicos registrados
              </TableCell>
            </TableRow>
          ) : (
            bloquesFiltrados.map((bloque) => (
              <TableRow key={bloque.id}>
                <TableCell className="font-medium">{bloque.nombre}</TableCell>
                <TableCell className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  {bloque.ubicacion || '-'}
                </TableCell>
                <TableCell>{bloque.numero_salas}</TableCell>
                <TableCell>
                  {bloque.horario_inicio} - {bloque.horario_fin}
                </TableCell>
                <TableCell>{bloque.dias_operacion}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
