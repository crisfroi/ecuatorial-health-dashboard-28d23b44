import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useTurnosBio, TurnoBio } from '@/hooks/useTurnosBio';
import { useCuadrantesBio } from '@/hooks/useCuadrantesBio';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const CuadrantesBiometricos: React.FC<{ selectedCenter: string | null }>= ({ selectedCenter }) => {
  const { user } = useAuth();
  const centerId = selectedCenter || user?.assigned_center_id || null;
  const { list: listTurnos } = useTurnosBio();
  const { assign, exportCuadrantesXls, exportPersonalXls } = useCuadrantesBio();

  const [turnos, setTurnos] = useState<TurnoBio[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [turnoId, setTurnoId] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0,10));
  const [rangeFrom, setRangeFrom] = useState(() => new Date().toISOString().slice(0,10));
  const [rangeTo, setRangeTo] = useState(() => new Date(Date.now()+6*86400000).toISOString().slice(0,10));
  const [selectedProfIds, setSelectedProfIds] = useState<string[]>([]);
  const [showCreateTurno, setShowCreateTurno] = useState(false);
  const [newTurnoName, setNewTurnoName] = useState('');
  const [newHoraInicio, setNewHoraInicio] = useState('08:00');
  const [newHoraFin, setNewHoraFin] = useState('16:00');
  const [newTolerancia, setNewTolerancia] = useState(0);
  const [newTipo, setNewTipo] = useState<'diurno'|'nocturno'|'festivo'>('diurno');

  const { toast } = useToast();

  const refresh = async () => {
    setTurnos(await listTurnos(centerId));
    let qb = supabase.from('profesionales_sanitarios').select('id, nombre_completo, id_profesional_unico, centro_salud_id').eq('estado_solicitud','Aprobado');
    if (centerId) qb = qb.eq('centro_salud_id', centerId);
    const { data } = await qb.order('nombre_completo');
    setProfesionales(data || []);
  };
  useEffect(() => { refresh(); }, [centerId]);

  const toggleProf = (id: string) => {
    setSelectedProfIds(prev => prev.includes(id) ? prev.filter(x => x!==id) : [...prev, id]);
  };

  const assignSelected = async () => {
    if (!turnoId || !fecha) return;
    const rows = selectedProfIds.map(id => ({ id_profesional: id, turno_id: turnoId, fecha, centro_salud_id: centerId || null }));
    await assign(rows as any);
    setSelectedProfIds([]);
  };

  const handleCreateTurno = async () => {
    if (!newTurnoName) return toast({ title: 'Nombre requerido', variant: 'destructive' });
    try {
      await (await import('@/hooks/useTurnosBio')).useTurnosBio().create({ nombre_turno: newTurnoName, hora_inicio: `${newHoraInicio}:00`, hora_fin: `${newHoraFin}:00`, tolerancia_minutos: newTolerancia, tipo: newTipo, centro_salud_id: centerId || undefined });
      toast({ title: 'Turno creado' });
      setShowCreateTurno(false);
      setNewTurnoName('');
      await refresh();
    } catch (err: any) {
      toast({ title: 'Error creando turno', description: err?.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Asignación de Turnos (Cuadrantes)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {turnos.length === 0 ? (
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">No hay turnos definidos para este centro.</div>
                <Button onClick={() => setShowCreateTurno(true)}>Crear Turno</Button>
              </div>
            ) : (
              <Select value={turnoId} onValueChange={setTurnoId}>
                <SelectTrigger className="w-60"><SelectValue placeholder="Seleccionar turno"/></SelectTrigger>
                <SelectContent>
                  {turnos.map(t => (<SelectItem key={t.id} value={t.id}>{t.nombre_turno} ({t.hora_inicio.slice(0,5)}-{t.hora_fin.slice(0,5)})</SelectItem>))}
                </SelectContent>
              </Select>
            )}
            {showCreateTurno && (
              <div className="flex items-center gap-2">
                <Input placeholder="Nombre turno" value={newTurnoName} onChange={e => setNewTurnoName(e.target.value)} />
                <Input type="time" value={newHoraInicio} onChange={e => setNewHoraInicio(e.target.value)} />
                <Input type="time" value={newHoraFin} onChange={e => setNewHoraFin(e.target.value)} />
                <Input type="number" min={0} value={String(newTolerancia)} onChange={e => setNewTolerancia(Number(e.target.value))} className="w-24" />
                <Select value={newTipo} onValueChange={(v: any) => setNewTipo(v)}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Tipo"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diurno">Diurno</SelectItem>
                    <SelectItem value="nocturno">Nocturno</SelectItem>
                    <SelectItem value="festivo">Festivo</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCreateTurno}>Guardar</Button>
                <Button variant="ghost" onClick={() => setShowCreateTurno(false)}>Cancelar</Button>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="text-sm">Fecha</span>
              <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <Button onClick={assignSelected} disabled={!turnoId || !selectedProfIds.length}>Asignar a seleccionados</Button>
            <div className="flex-1"/>
            <Button variant="outline" onClick={() => exportPersonalXls(centerId, selectedProfIds.length ? selectedProfIds : undefined, fecha)}>{selectedProfIds.length ? `Exportar Personal.xls (selección ${selectedProfIds.length})` : 'Exportar Personal.xls'}</Button>
          </div>

          <div className="overflow-auto max-h-[420px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sel</TableHead>
                  <TableHead>EmpNo</TableHead>
                  <TableHead>Nombre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profesionales.map(p => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => toggleProf(p.id)}>
                    <TableCell><input type="checkbox" checked={selectedProfIds.includes(p.id)} onChange={() => toggleProf(p.id)} /></TableCell>
                    <TableCell className="font-mono text-xs">{p.id_profesional_unico}</TableCell>
                    <TableCell>{p.nombre_completo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Exportación de Cuadrantes</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-sm">Desde</span>
            <Input type="date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">Hasta</span>
            <Input type="date" value={rangeTo} onChange={e => setRangeTo(e.target.value)} />
          </div>
          <Button onClick={() => exportCuadrantesXls(centerId || null, rangeFrom, rangeTo)}>Exportar Cuadrantes.xls</Button>
        </CardContent>
      </Card>
    </div>
  );
};
