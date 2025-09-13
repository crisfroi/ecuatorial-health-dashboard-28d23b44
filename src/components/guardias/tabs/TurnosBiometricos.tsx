import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTurnosBio, TurnoBio } from '@/hooks/useTurnosBio';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

export const TurnosBiometricos: React.FC<{ selectedCenter: string | null }>= ({ selectedCenter }) => {
  const { user } = useAuth();
  const centerId = selectedCenter || user?.assigned_center_id || null;
  const { list, create, update, remove, exportTurnosXls, importTurnosXls } = useTurnosBio();

  const [turnos, setTurnos] = useState<TurnoBio[]>([]);
  const [nombre, setNombre] = useState('');
  const [inicio, setInicio] = useState('08:00');
  const [fin, setFin] = useState('16:00');
  const [tol, setTol] = useState(5);
  const [tipo, setTipo] = useState<'diurno'|'nocturno'|'festivo'>('diurno');

  const refresh = async () => { setTurnos(await list(centerId)); };
  useEffect(() => { refresh(); }, [centerId]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files?.length) return;
    await importTurnosXls(files[0], centerId);
    await refresh();
    e.currentTarget.value = '';
  };

  const handleCreate = async () => {
    if (!nombre.trim()) return;
    await create({ nombre_turno: nombre.trim(), hora_inicio: `${inicio}:00`, hora_fin: `${fin}:00`, tolerancia_minutos: tol, tipo, centro_salud_id: centerId || undefined });
    setNombre(''); setInicio('08:00'); setFin('16:00'); setTol(5); setTipo('diurno');
    await refresh();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Definición de Turnos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} className="w-44" />
            <div className="flex items-center gap-1">
              <span className="text-sm">Inicio</span>
              <Input type="time" value={inicio} onChange={e => setInicio(e.target.value)} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm">Fin</span>
              <Input type="time" value={fin} onChange={e => setFin(e.target.value)} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm">Tol (min)</span>
              <Input type="number" value={tol} onChange={e => setTol(parseInt(e.target.value||'0',10))} className="w-24" />
            </div>
            <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diurno">Diurno</SelectItem>
                <SelectItem value="nocturno">Nocturno</SelectItem>
                <SelectItem value="festivo">Festivo</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreate}>Agregar</Button>
            <Button variant="outline" onClick={() => exportTurnosXls(turnos)}>Exportar Turno.xls</Button>
            <Input type="file" accept=".xls,.xlsx" onChange={handleImport} className="w-56" />
          </div>

          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Tolerancia</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turnos.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{t.nombre_turno}</TableCell>
                    <TableCell>{t.hora_inicio?.slice(0,5)}</TableCell>
                    <TableCell>{t.hora_fin?.slice(0,5)}</TableCell>
                    <TableCell>{t.tolerancia_minutos}</TableCell>
                    <TableCell>{t.tipo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
