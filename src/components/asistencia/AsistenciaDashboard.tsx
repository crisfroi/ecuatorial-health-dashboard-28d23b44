import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AsistenciaBiometrica } from '@/components/guardias/tabs/AsistenciaBiometrica';
import { CuadrantesBiometricos } from '@/components/guardias/tabs/CuadrantesBiometricos';
import CenterAttendancePanel from '@/components/dashboard/CenterAttendancePanel';

export default function AsistenciaDashboard() {
  const [active, setActive] = useState('reportes');

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
                <AsistenciaBiometrica selectedCenter={null} />
              </TabsContent>

              <TabsContent value="informes">
                <CenterAttendancePanel centerId={''} professionals={[]} />
              </TabsContent>

              <TabsContent value="calendarios">
                <CuadrantesBiometricos selectedCenter={null} />
              </TabsContent>

              <TabsContent value="permisos">
                <div className="p-4">Gestión de permisos de acceso a módulos de asistencia. Aquí se pueden agregar controles para asignar roles y permisos específicos relacionados con asistencia.</div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
