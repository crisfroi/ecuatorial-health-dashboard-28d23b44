import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHosixQuirofanos } from '@/hooks/useHosixQuirofanos';
import { BloquesList } from '@/components/hosix/quirofanos/BloquesList';
import { SalasQuirofanosManager } from '@/components/hosix/quirofanos/SalasQuirofanosManager';
import { ProgramacionesManager } from '@/components/hosix/quirofanos/ProgramacionesManager';
import { DiarioQuirurgicoManager } from '@/components/hosix/quirofanos/DiarioQuirurgicoManager';
import { Stethoscope, Users, Calendar, ClipboardList } from 'lucide-react';

export default function QuirovanosPage() {
  const { useBloquesQuery, useSalasQuery, useProgramacionesQuery, useDiarioQuery } = useHosixQuirofanos();
  const { data: bloques = [] } = useBloquesQuery();
  const { data: salas = [] } = useSalasQuery();
  const { data: programaciones = [] } = useProgramacionesQuery();
  const { data: diarios = [] } = useDiarioQuery();

  const [selectedTab, setSelectedTab] = useState('dashboard');

  // Cálculos para KPIs
  const salasOperativas = salas.filter((s: any) => s.estado === 'operativa').length;
  const programacionesActivas = programaciones.filter((p: any) => p.estado === 'programada').length;
  const programacionesHoy = programaciones.filter((p: any) => {
    const hoy = new Date().toISOString().split('T')[0];
    return p.fecha_programada === hoy;
  }).length;
  const cirugiasCumplidasHoy = diarios.filter((d: any) => {
    const hoy = new Date().toISOString().split('T')[0];
    return d.created_at.split('T')[0] === hoy;
  }).length;

  const eventosPendientes = diarios.filter((d: any) => d.evento_adverso).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Quirófanos (ASIS 3.0)</h1>
        <p className="text-gray-600">Gestión de bloques, salas, programaciones y diario quirúrgico</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Bloques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{bloques.length}</div>
            <p className="text-xs text-gray-500 mt-1">Activos en el hospital</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Salas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{salasOperativas}</div>
            <p className="text-xs text-gray-500 mt-1">de {salas.length} operativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{programacionesHoy}</div>
            <p className="text-xs text-gray-500 mt-1">Cirugías programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{cirugiasCumplidasHoy}</div>
            <p className="text-xs text-gray-500 mt-1">Hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${eventosPendientes > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {eventosPendientes}
            </div>
            <p className="text-xs text-gray-500 mt-1">Adversos registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="bloques">Bloques</TabsTrigger>
          <TabsTrigger value="salas">Salas</TabsTrigger>
          <TabsTrigger value="programaciones">Programaciones</TabsTrigger>
          <TabsTrigger value="diario">Diario</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resumen de Salas */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de Salas</CardTitle>
                <CardDescription>Distribución de salas por estado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Operativas</span>
                    <span className="text-2xl font-bold text-green-600">
                      {salas.filter((s: any) => s.estado === 'operativa').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="font-medium">Mantenimiento</span>
                    <span className="text-2xl font-bold text-yellow-600">
                      {salas.filter((s: any) => s.estado === 'mantenimiento').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">Fuera de Servicio</span>
                    <span className="text-2xl font-bold text-red-600">
                      {salas.filter((s: any) => s.estado === 'fuera_servicio').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumen de Programaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Programaciones Activas</CardTitle>
                <CardDescription>Por estado actual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Programadas</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {programaciones.filter((p: any) => p.estado === 'programada').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">En Quirófano</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {programaciones.filter((p: any) => p.estado === 'en_quirofano').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Pendientes Hoy</span>
                    <span className="text-2xl font-bold text-gray-600">
                      {programacionesActivas}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Próximas Cirugías */}
          <Card>
            <CardHeader>
              <CardTitle>Próximas Cirugías Programadas</CardTitle>
              <CardDescription>Próximas 24 horas</CardDescription>
            </CardHeader>
            <CardContent>
              {programacionesHoy === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay cirugías programadas para hoy
                </div>
              ) : (
                <div className="space-y-3">
                  {programaciones
                    .filter((p: any) => {
                      const hoy = new Date().toISOString().split('T')[0];
                      return p.fecha_programada === hoy && p.estado === 'programada';
                    })
                    .slice(0, 5)
                    .map((prog: any) => (
                      <div key={prog.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-semibold">{prog.tipo_procedimiento}</p>
                          <p className="text-sm text-gray-500">{prog.paciente?.nombre_completo || 'Paciente'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{prog.hora_entrada}</p>
                          <p className="text-sm text-gray-500">{prog.duracion_estimada}min</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bloques Tab */}
        <TabsContent value="bloques" className="space-y-4">
          <BloquesList />
        </TabsContent>

        {/* Salas Tab */}
        <TabsContent value="salas" className="space-y-4">
          <SalasQuirofanosManager />
        </TabsContent>

        {/* Programaciones Tab */}
        <TabsContent value="programaciones" className="space-y-4">
          <ProgramacionesManager />
        </TabsContent>

        {/* Diario Tab */}
        <TabsContent value="diario" className="space-y-4">
          <DiarioQuirurgicoManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
