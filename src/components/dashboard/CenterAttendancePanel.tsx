import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useAsistencia, useDispositivosFichaje } from '@/hooks/useAsistencia';

interface Props {
  centerId: string;
  professionals: { id: string; nombre_completo: string }[];
}

export default function CenterAttendancePanel({ centerId }: Props) {
  const { fetchLogsByRange, consolidateDaily, generateAttendanceStats } = useAsistencia();
  const { list: listDevices } = useDispositivosFichaje();

  const [from, setFrom] = useState(() => new Date(Date.now() - 7*86400000).toISOString().slice(0,10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0,10));
  const [stats, setStats] = useState<any|null>(null);

  const load = async () => {
    const devices = await listDevices(centerId);
    const deviceIds = new Set((devices||[]).map(d => d.id));
    const logs = await fetchLogsByRange(new Date(from).toISOString(), new Date(new Date(to).getTime()+86399999).toISOString());
    const centerLogs = logs.filter(l => deviceIds.has(l.id_dispositivo));
    const days = consolidateDaily(centerLogs);
    setStats(generateAttendanceStats(days));
  };

  useEffect(() => { load(); }, [centerId, from, to]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asistencia del Centro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-sm">Desde</span>
            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">Hasta</span>
            <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
        </div>
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded border bg-white"><div className="text-xs text-gray-500">Días</div><div className="text-xl font-semibold">{stats.totals.dias}</div></div>
            <div className="p-3 rounded border bg-white"><div className="text-xs text-gray-500">Horas Totales</div><div className="text-xl font-semibold">{stats.totals.horasTotales.toFixed(2)}</div></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
