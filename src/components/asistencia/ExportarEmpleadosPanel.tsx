import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useExportarEmpleados, ProfesionalExportable } from '@/hooks/useExportarEmpleados';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExportarEmpleadosPanelProps {
  centroId: string | null;
  nombreCentro?: string;
}

export const ExportarEmpleadosPanel: React.FC<ExportarEmpleadosPanelProps> = ({
  centroId,
  nombreCentro,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [soloConTurno, setSoloConTurno] = useState(false);

  const { profesionalesQuery, dispositivosQuery, exportMutation, validarExportable } =
    useExportarEmpleados(centroId);

  const profesionales = profesionalesQuery.data || [];
  const dispositivos = dispositivosQuery.data || [];

  // Filtrar por turno si está activado
  const profesionalesFiltrados = soloConTurno
    ? profesionales.filter((p) => p.tiene_turno)
    : profesionales;

  const handleToggleAll = () => {
    if (selectedIds.size === profesionalesFiltrados.length) {
      setSelectedIds(new Set());
    } else {
      const exportables = profesionalesFiltrados.filter((p) => validarExportable(p).exportable);
      setSelectedIds(new Set(exportables.map((p) => p.id)));
    }
  };

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleExport = async () => {
    await exportMutation.mutateAsync({
      profesional_ids: Array.from(selectedIds),
      solo_con_turno: soloConTurno,
    });
    setSelectedIds(new Set());
  };

  if (!centroId) {
    return (
      <Alert>
        <AlertDescription>Seleccione un centro de salud para exportar empleados</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Exportar Empleados a Dispositivos Biométricos
        </CardTitle>
        <CardDescription>
          Centro: <strong>{nombreCentro || 'Sin especificar'}</strong>
          <br />
          Dispositivos activos: <strong>{dispositivos.length}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Checkbox
              id="solo-turno"
              checked={soloConTurno}
              onCheckedChange={(checked) => setSoloConTurno(!!checked)}
            />
            <label htmlFor="solo-turno" className="text-sm cursor-pointer">
              Solo profesionales con turno asignado
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleAll}
              disabled={profesionalesQuery.isLoading || profesionalesFiltrados.length === 0}
            >
              {selectedIds.size === profesionalesFiltrados.length
                ? 'Deseleccionar todos'
                : 'Seleccionar todos'}
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedIds.size === 0 || exportMutation.isPending}
            >
              {exportMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Users className="mr-2 h-4 w-4" />
              Exportar {selectedIds.size} empleado{selectedIds.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>

        {/* Tabla de profesionales */}
        {profesionalesQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : profesionalesFiltrados.length === 0 ? (
          <Alert>
            <AlertDescription>
              No hay profesionales {soloConTurno ? 'con turno asignado' : 'disponibles'} en este
              centro
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>ENNO</TableHead>
                  <TableHead>Área Profesional</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profesionalesFiltrados.map((prof) => {
                  const validacion = validarExportable(prof);
                  return (
                    <TableRow key={prof.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(prof.id)}
                          onCheckedChange={() => handleToggle(prof.id)}
                          disabled={!validacion.exportable}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{prof.nombre_completo}</TableCell>
                      <TableCell>
                        {prof.enroll_id ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {prof.enroll_id}
                          </code>
                        ) : (
                          <Badge variant="destructive">Sin ENNO</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {prof.area_profesional || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {prof.tiene_turno ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {prof.turno_nombre}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Sin turno
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {validacion.exportable ? (
                          <Badge variant="secondary">Listo</Badge>
                        ) : (
                          <Badge variant="destructive">{validacion.razon}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Información adicional */}
        {dispositivos.length > 0 && (
          <Alert>
            <AlertDescription className="text-sm">
              Los empleados se enviarán a <strong>{dispositivos.length} dispositivo(s)</strong>:{' '}
              {dispositivos.map((d) => d.nombre).join(', ')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
