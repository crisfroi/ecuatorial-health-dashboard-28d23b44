import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AsistenciaBiometrica } from '@/components/guardias/tabs/AsistenciaBiometrica';
import { CuadrantesBiometricos } from '@/components/guardias/tabs/CuadrantesBiometricos';
import CenterAttendancePanel from '@/components/dashboard/CenterAttendancePanel';
import { useCuadrantesBio } from '@/hooks/useCuadrantesBio';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AsistenciaDashboard() {
  const [active, setActive] = useState('reportes');
  const { exportPersonalXls } = useCuadrantesBio();
  const { toast } = useToast();

  const roles = ['SUPER_ADMINISTRADOR','DIRECTIVO_CENTRO_SANITARIO','REVISOR_SOLICITUDES','PERSONALIDAD_MINISTERIAL','RRHH_MINISTERIO'];
  const [permisos, setPermisos] = useState<Record<string, any>>({});

  useEffect(() => {
    // Load permisos from DB if table exists
    (async () => {
      try {
        const { data } = await supabase.from('asistencia_permisos').select('*');
        if (data) {
          const map: Record<string, any> = {};
          data.forEach((r: any) => { map[r.role] = r; });
          setPermisos(map);
        }
      } catch (e) {
        // table may not exist; ignore silently
      }
    })();
  }, []);

  const togglePerm = (role: string, key: string) => {
    setPermisos(prev => ({ ...prev, [role]: { ...(prev[role]||{}), [key]: !(prev[role]?.[key]||false), role } }));
  };

  const savePermisos = async () => {
    try {
      const rows = Object.values(permisos).map((p: any) => ({ role: p.role, can_import: !!p.can_import, can_export: !!p.can_export, can_manage_turnos: !!p.can_manage_turnos, can_view_reports: !!p.can_view_reports }));
      if (!rows.length) return toast({ title: 'Sin cambios' });
      const { error } = await supabase.from('asistencia_permisos').upsert(rows, { onConflict: 'role' });
      if (error) throw error;
      toast({ title: 'Permisos guardados' });
    } catch (err: any) {
      toast({ title: 'No se pudieron guardar permisos', description: String(err.message || err), variant: 'destructive' });
    }
  };

  const handleExportEjemplo = async () => {
    try {
      await exportPersonalXls(undefined, undefined, new Date().toISOString().slice(0,10));
      toast({ title: 'Export iniciado' });
    } catch (err: any) {
      toast({ title: 'Error exportando', description: err?.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Asistencia</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={active} onValueChange={setActive}>
            <TabsList className="grid grid-cols-4 gap-2">
              <TabsTrigger value="reportes">Reportes</TabsTrigger>
              <TabsTrigger value="informes">Informes</TabsTrigger>
              <TabsTrigger value="calendarios">Calendarios</TabsTrigger>
              <TabsTrigger value="permisos">Permisos</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="reportes">
                <div className="flex items-center gap-2 mb-3">
                  <Button onClick={handleExportEjemplo}>Exportar Personal.xls (ejemplo)</Button>
                </div>
                <AsistenciaBiometrica selectedCenter={null} />
              </TabsContent>

              <TabsContent value="informes">
                <CenterAttendancePanel centerId={''} professionals={[]} />
              </TabsContent>

              <TabsContent value="calendarios">
                <CuadrantesBiometricos selectedCenter={null} />
              </TabsContent>

              <TabsContent value="permisos">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Define qué roles pueden realizar acciones relacionadas con Asistencia.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {roles.map(role => (
                      <div key={role} className="p-3 border rounded">
                        <div className="font-medium mb-2">{role}</div>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={!!permisos[role]?.can_import} onChange={() => togglePerm(role, 'can_import')}/> Permitir import</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={!!permisos[role]?.can_export} onChange={() => togglePerm(role, 'can_export')}/> Permitir export</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={!!permisos[role]?.can_manage_turnos} onChange={() => togglePerm(role, 'can_manage_turnos')}/> Gestionar turnos</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={!!permisos[role]?.can_view_reports} onChange={() => togglePerm(role, 'can_view_reports')}/> Ver reportes</label>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2">
                    <Button onClick={savePermisos}>Guardar permisos</Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
