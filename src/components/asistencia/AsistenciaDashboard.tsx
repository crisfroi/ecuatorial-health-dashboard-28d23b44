import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TurnosBiometricos } from '@/components/guardias/tabs/TurnosBiometricos';

import { DispositivosPanel } from './DispositivosPanel';
import { HorariosBasePanel } from './HorariosBasePanel'; // <-- NUEVO: Importación del componente de Horarios Base
import { ImportarFichajesPanel } from './ImportarFichajesPanel';
import { ReportesPanel } from './ReportesPanel';
import { MetricasPanel } from './MetricasPanel';

const TAB_VALUES = [
  'dispositivos',
  'turnos',
  'Horarios',
  'importar',
  'reportes',
  'metricas',
] as const;

type TabValue = (typeof TAB_VALUES)[number];

export default function AsistenciaDashboard() {
  const [activeTab, setActiveTab] = useState<TabValue>('dispositivos');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Asistencia biométrica</CardTitle>
          <CardDescription>
            Administra dispositivos, Horarios, importaciones y reportes de asistencia para todos los centros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
            <TabsList className="grid grid-cols-2 gap-2 md:grid-cols-6">
              <TabsTrigger value="dispositivos">Dispositivos</TabsTrigger>
              <TabsTrigger value="turnos">Turnos</TabsTrigger>
              <TabsTrigger value="Horarios">Horarios Base</TabsTrigger> {/* Etiqueta cambiada para mayor claridad */}
              <TabsTrigger value="importar">Importar fichajes</TabsTrigger>
              <TabsTrigger value="reportes">Reportes</TabsTrigger>
              <TabsTrigger value="metricas">Métricas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
        <TabsContent value="dispositivos">
          <DispositivosPanel />
        </TabsContent>
        <TabsContent value="turnos">
          <TurnosBiometricos selectedCenter={null} />
        </TabsContent>
        <TabsContent value="Horarios">
          <HorariosBasePanel /> {/* <-- COMPONENTE REEMPLAZADO */}
        </TabsContent>
        <TabsContent value="importar">
          <ImportarFichajesPanel />
        </TabsContent>
        <TabsContent value="reportes">
          <ReportesPanel />
        </TabsContent>
        <TabsContent value="metricas">
          <MetricasPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}