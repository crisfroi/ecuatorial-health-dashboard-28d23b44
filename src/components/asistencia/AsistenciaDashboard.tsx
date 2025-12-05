import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AsistenciaIntegradoDashboard } from './AsistenciaIntegradoDashboard';
import { DispositivosPanel } from './DispositivosPanel';
import { HorariosBasePanel } from './HorariosBasePanel';
import { ImportarFichajesPanel } from './ImportarFichajesPanel';
import { ReportesPanel } from './ReportesPanel';
import { MetricasPanel } from './MetricasPanel';
import { GestorTurnosOptimizado } from '@/components/turnos/GestorTurnosOptimizado';

const TAB_VALUES = [
  'overview',
  'dispositivos',
  'turnos',
  'Horarios',
  'importar',
  'reportes',
  'metricas',
] as const;

type TabValue = (typeof TAB_VALUES)[number];

export default function AsistenciaDashboard() {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
        <TabsList className="grid grid-cols-2 gap-2 md:grid-cols-7 w-full">
          <TabsTrigger value="overview">Dashboard</TabsTrigger>
          <TabsTrigger value="dispositivos">Dispositivos</TabsTrigger>
          <TabsTrigger value="turnos">Turnos</TabsTrigger>
          <TabsTrigger value="Horarios">Horarios Base</TabsTrigger>
          <TabsTrigger value="importar">Importar</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <AsistenciaIntegradoDashboard />
        </TabsContent>

        <TabsContent value="dispositivos" className="mt-6">
          <DispositivosPanel />
        </TabsContent>

        <TabsContent value="turnos" className="mt-6">
          <GestorTurnosOptimizado centroId={null} mostrarAsignacion={false} />
        </TabsContent>

        <TabsContent value="Horarios" className="mt-6">
          <HorariosBasePanel />
        </TabsContent>

        <TabsContent value="importar" className="mt-6">
          <ImportarFichajesPanel />
        </TabsContent>

        <TabsContent value="reportes" className="mt-6">
          <ReportesPanel />
        </TabsContent>

        <TabsContent value="metricas" className="mt-6">
          <MetricasPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
