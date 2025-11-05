import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTurnosOptimizados, type TurnoMaestro, type HorarioProfesionalConTurno } from '@/hooks/useTurnosOptimizados';
import { Plus, Edit2, Trash2, Copy, Clock, AlertCircle } from 'lucide-react';

interface GestorTurnosOptimizadoProps {
  centroId?: string | null;
  profesionalId?: string;
  mostrarAsignacion?: boolean;
}

/**
 * Componente principal para gestión de turnos biométricos.
 * 
 * Funcionalidades:
 * - Crear/editar turnos maestros
 * - Asignar turnos a profesionales (por día de semana)
 * - Visualizar horarios actuales
 * - Sincronización automática a dispositivos
 */
export const GestorTurnosOptimizado: React.FC<GestorTurnosOptimizadoProps> = ({
  centroId,
  profesionalId,
  mostrarAsignacion = !!profesionalId,
}) => {
  const { toast } = useToast();
  const {
    turnosQuery,
    horariosQuery,
    createTurnoMutation,
    updateTurnoMutation,
    deleteTurnoMutation,
    asignarTurnoMutation,
    eliminarHorarioMutation,
    getNombreDia,
  } = useTurnosOptimizados(centroId);

  // Estados locales
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTurno, setEditingTurno] = useState<TurnoMaestro | null>(null);
  const [nuevoTurno, setNuevoTurno] = useState({
    nombre_turno: '',
    hora_inicio: '08:00',
    hora_fin: '16:00',
    tipo: 'diurno' as const,
    tolerancia_entrada_min: 5,
    tolerancia_salida_min: 5,
  });

  // Query para horarios del profesional
  const horariosResult = mostrarAsignacion && profesionalId 
    ? horariosQuery(profesionalId)
    : null;

  const horarios = useMemo(() => {
    return horariosResult?.data || [];
  }, [horariosResult?.data]);

  // Handlers para crear/editar turno
  const handleOpenCreateDialog = (turnoToEdit?: TurnoMaestro) => {
    if (turnoToEdit) {
      setEditingTurno(turnoToEdit);
      setNuevoTurno({
        nombre_turno: turnoToEdit.nombre_turno,
        hora_inicio: turnoToEdit.hora_inicio.slice(0, 5),
        hora_fin: turnoToEdit.hora_fin.slice(0, 5),
        tipo: turnoToEdit.tipo as any,
        tolerancia_entrada_min: turnoToEdit.tolerancia_entrada_min,
        tolerancia_salida_min: turnoToEdit.tolerancia_salida_min,
      });
    } else {
      setEditingTurno(null);
      setNuevoTurno({
        nombre_turno: '',
        hora_inicio: '08:00',
        hora_fin: '16:00',
        tipo: 'diurno',
        tolerancia_entrada_min: 5,
        tolerancia_salida_min: 5,
      });
    }
    setShowCreateDialog(true);
  };

  const handleSaveTurno = async () => {
    if (!nuevoTurno.nombre_turno.trim()) {
      toast({
        title: 'Error de validación',
        description: 'El nombre del turno es requerido',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingTurno) {
        await updateTurnoMutation.mutateAsync({
          id: editingTurno.id,
          patch: {
            nombre_turno: nuevoTurno.nombre_turno,
            hora_inicio: `${nuevoTurno.hora_inicio}:00`,
            hora_fin: `${nuevoTurno.hora_fin}:00`,
            tipo: nuevoTurno.tipo,
            tolerancia_entrada_min: nuevoTurno.tolerancia_entrada_min,
            tolerancia_salida_min: nuevoTurno.tolerancia_salida_min,
          },
        });
      } else {
        await createTurnoMutation.mutateAsync({
          nombre_turno: nuevoTurno.nombre_turno,
          hora_inicio: `${nuevoTurno.hora_inicio}:00`,
          hora_fin: `${nuevoTurno.hora_fin}:00`,
          tipo: nuevoTurno.tipo,
          tolerancia_entrada_min: nuevoTurno.tolerancia_entrada_min,
          tolerancia_salida_min: nuevoTurno.tolerancia_salida_min,
        });
      }
      setShowCreateDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error al guardar turno',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTurno = async (turnoId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este turno?')) return;

    try {
      await deleteTurnoMutation.mutateAsync(turnoId);
    } catch (error: any) {
      toast({
        title: 'Error al eliminar turno',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAsignarTurno = async (turnoId: string, diaSemana: number) => {
    if (!profesionalId) return;

    try {
      await asignarTurnoMutation.mutateAsync({
        profesional_id: profesionalId,
        turno_id: turnoId,
        dia_semana: diaSemana,
      });
    } catch (error: any) {
      toast({
        title: 'Error al asignar turno',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEliminarHorario = async (horarioId: string) => {
    if (!confirm('¿Eliminar esta asignación?')) return;

    try {
      await eliminarHorarioMutation.mutateAsync(horarioId);
    } catch (error: any) {
      toast({
        title: 'Error al eliminar asignación',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Renderizar lista de turnos maestros
  const renderTurnosMaestros = () => {
    if (turnosQuery.isLoading) {
      return (
        <div className="p-8 text-center text-gray-500">
          <p>Cargando turnos...</p>
        </div>
      );
    }

    if (!turnosQuery.data || turnosQuery.data.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No hay turnos creados</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {turnosQuery.data.map((turno) => (
          <div
            key={turno.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">{turno.nombre_turno}</p>
              <p className="text-sm text-gray-600">
                {turno.hora_inicio.slice(0, 5)} - {turno.hora_fin.slice(0, 5)} •{' '}
                <span className="capitalize">{turno.tipo}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Tolerancia: ±{turno.tolerancia_entrada_min} min
              </p>
            </div>

            <div className="flex gap-2">
              {mostrarAsignacion && (
                <Button
                  onClick={() => handleAsignarTurno(turno.id, 1)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Asignar
                </Button>
              )}

              <Button
                onClick={() => handleOpenCreateDialog(turno)}
                variant="outline"
                size="sm"
              >
                <Edit2 className="w-3 h-3" />
              </Button>

              <Button
                onClick={() => handleDeleteTurno(turno.id)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar horarios del profesional
  const renderHorariosProfesional = () => {
    if (!mostrarAsignacion || !profesionalId) return null;

    if (horariosResult?.isLoading) {
      return <p className="text-gray-500 p-4">Cargando horarios...</p>;
    }

    if (!horarios || horarios.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500 bg-blue-50 rounded-lg border border-blue-200">
          <AlertCircle className="w-5 h-5 mx-auto mb-2" />
          <p className="text-sm">No hay horarios asignados aún</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {horarios.map((horario) => (
          <div
            key={horario.id}
            className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div>
              <p className="font-medium text-gray-900">
                {getNombreDia(horario.dia_semana)}
              </p>
              {horario.turno && (
                <p className="text-sm text-gray-600">
                  {horario.turno.nombre_turno} ({horario.turno.hora_inicio.slice(0, 5)} -{' '}
                  {horario.turno.hora_fin.slice(0, 5)})
                </p>
              )}
            </div>

            <Button
              onClick={() => handleEliminarHorario(horario.id)}
              variant="outline"
              size="sm"
              className="text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sección: Turnos Maestros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Turnos Maestros</CardTitle>
              <CardDescription>Gestiona los turnos biométricos disponibles</CardDescription>
            </div>
            <Button onClick={() => handleOpenCreateDialog()} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Turno
            </Button>
          </div>
        </CardHeader>
        <CardContent>{renderTurnosMaestros()}</CardContent>
      </Card>

      {/* Sección: Horarios del Profesional */}
      {mostrarAsignacion && (
        <Card>
          <CardHeader>
            <CardTitle>Horario Base del Profesional</CardTitle>
            <CardDescription>Asignaciones semanales (lunes-domingo)</CardDescription>
          </CardHeader>
          <CardContent>{renderHorariosProfesional()}</CardContent>
        </Card>
      )}

      {/* Dialog: Crear/Editar Turno */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTurno ? 'Editar Turno' : 'Crear Nuevo Turno'}
            </DialogTitle>
            <DialogDescription>
              {editingTurno
                ? 'Modifica los detalles del turno'
                : 'Define un nuevo turno biométrico'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nombre del turno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Turno
              </label>
              <input
                type="text"
                value={nuevoTurno.nombre_turno}
                onChange={(e) =>
                  setNuevoTurno({ ...nuevoTurno, nombre_turno: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Mañana 08-16"
              />
            </div>

            {/* Hora inicio y fin */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora Inicio
                </label>
                <input
                  type="time"
                  value={nuevoTurno.hora_inicio}
                  onChange={(e) =>
                    setNuevoTurno({ ...nuevoTurno, hora_inicio: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora Fin
                </label>
                <input
                  type="time"
                  value={nuevoTurno.hora_fin}
                  onChange={(e) =>
                    setNuevoTurno({ ...nuevoTurno, hora_fin: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Tipo de turno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Turno
              </label>
              <select
                value={nuevoTurno.tipo}
                onChange={(e) =>
                  setNuevoTurno({
                    ...nuevoTurno,
                    tipo: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="diurno">Diurno</option>
                <option value="nocturno">Nocturno</option>
                <option value="festivo">Festivo</option>
              </select>
            </div>

            {/* Tolerancia */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tolerancia Entrada (min)
                </label>
                <input
                  type="number"
                  value={nuevoTurno.tolerancia_entrada_min}
                  onChange={(e) =>
                    setNuevoTurno({
                      ...nuevoTurno,
                      tolerancia_entrada_min: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tolerancia Salida (min)
                </label>
                <input
                  type="number"
                  value={nuevoTurno.tolerancia_salida_min}
                  onChange={(e) =>
                    setNuevoTurno({
                      ...nuevoTurno,
                      tolerancia_salida_min: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="60"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSaveTurno}
                disabled={
                  createTurnoMutation.isPending ||
                  updateTurnoMutation.isPending
                }
                className="flex-1"
              >
                {editingTurno ? 'Actualizar' : 'Crear'} Turno
              </Button>
              <Button
                onClick={() => setShowCreateDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
