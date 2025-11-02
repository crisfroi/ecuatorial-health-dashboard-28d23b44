import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Eye,
} from 'lucide-react';
import { useGuardiaAsistenciaIntegration } from '@/hooks/useGuardiaAsistenciaIntegration';
import { useToast } from '@/hooks/use-toast';

interface GuardiaAsistenciaComparativaProps {
  mes: number;
  ano: number;
  centroId?: string | null;
}

const statusColors = {
  conforme: '#10b981',
  sin_asistencia: '#ef4444',
  asistencia_no_programada: '#f59e0b',
  sin_guardia: '#8b5cf6',
};

export const GuardiaAsistenciaComparativa: React.FC<GuardiaAsistenciaComparativaProps> = ({
  mes,
  ano,
  centroId,
}) => {
  const { toast } = useToast();
  const [viewType, setViewType] = useState<'resumen' | 'detalle' | 'inconsistencias'>('resumen');
  const [expandedProfesional, setExpandedProfesional] = useState<string | null>(null);
  const [conflictosDetalle, setConflictosDetalle] = useState<any>(null);
  const [validandoConflictos, setValidandoConflictos] = useState(false);

  const {
    guardiaAsistencias,
    comparativaAsistencia,
    reporte,
    loading,
    validarConflictosEdgeFunction,
    exportarReporte,
  } = useGuardiaAsistenciaIntegration(mes, ano, centroId);

  const handleValidarConflictos = async () => {
    setValidandoConflictos(true);
    try {
      const resultado = await validarConflictosEdgeFunction();
      setConflictosDetalle(resultado);
      toast({
        title: 'Validación completada',
        description: `Se detectaron ${resultado.total_conflictos} conflicto(s)`,
        variant: resultado.total_conflictos > 0 ? 'destructive' : 'default',
      });
    } catch (error) {
      console.error('Error validando conflictos:', error);
    } finally {
      setValidandoConflictos(false);
    }
  };

  const handleExportar = (formato: 'json' | 'csv') => {
    exportarReporte(formato);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reporte) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            <p>No hay datos disponibles para el período seleccionado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar datos para gráficos
  const estadoDistribucion = [
    {
      name: 'Conforme',
      value: guardiaAsistencias.filter(g => g.estado === 'cumplida').length,
      color: '#10b981',
    },
    {
      name: 'No cumplida',
      value: guardiaAsistencias.filter(g => g.estado === 'no_cumplida').length,
      color: '#ef4444',
    },
    {
      name: 'Parcial',
      value: guardiaAsistencias.filter(g => g.estado === 'parcial').length,
      color: '#f59e0b',
    },
  ];

  const comparativaEstados = comparativaAsistencia.reduce((acc, item) => {
    const existing = acc.find(a => a.estado === item.estado);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ estado: item.estado, count: 1, color: statusColors[item.estado as keyof typeof statusColors] });
    }
    return acc;
  }, [] as Array<{ estado: string; count: number; color: string }>);

  const profesionalesIncumplimiento = guardiaAsistencias
    .filter(g => g.estado === 'no_cumplida')
    .map(g => ({
      nombre: g.profesional_nombre,
      guardias_incumplidas: 1,
      centro: g.centro_nombre,
    }))
    .reduce((acc, item) => {
      const existing = acc.find(a => a.nombre === item.nombre);
      if (existing) {
        existing.guardias_incumplidas += 1;
      } else {
        acc.push(item);
      }
      return acc;
    }, [] as Array<{ nombre: string; guardias_incumplidas: number; centro: string }>)
    .sort((a, b) => b.guardias_incumplidas - a.guardias_incumplidas);

  const inconsistenciasPorTipo = guardiaAsistencias
    .flatMap(g => g.inconsistencias)
    .reduce((acc, inconsistencia) => {
      const existing = acc.find(a => a.tipo === inconsistencia);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ tipo: inconsistencia, count: 1 });
      }
      return acc;
    }, [] as Array<{ tipo: string; count: number }>)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integración: Guardias ↔ Asistencia</h2>
          <p className="text-gray-600 mt-1">
            Comparativa de guardias programadas vs asistencia registrada
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidarConflictos}
            disabled={validandoConflictos}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {validandoConflictos ? 'Validando...' : 'Validar Conflictos'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportar('json')}>
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportar('csv')}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Guardias Programadas</p>
                <p className="text-2xl font-bold text-blue-600">{reporte.total_guardias_programadas}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-green-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Guardias Cumplidas</p>
                <p className="text-2xl font-bold text-green-600">{reporte.total_guardias_cumplidas}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-30" />
            </div>
            <p className="text-xs text-gray-500 mt-2">{reporte.tasa_cumplimiento.toFixed(1)}% cumplimiento</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 bg-red-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Guardias No Cumplidas</p>
                <p className="text-2xl font-bold text-red-600">{reporte.total_guardias_incumplidas}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Inconsistencias</p>
                <p className="text-2xl font-bold text-yellow-600">{reporte.inconsistencias_detectadas}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600 opacity-30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conflictos detectados por Edge Function */}
      {conflictosDetalle && conflictosDetalle.total_conflictos > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Conflictos detectados: {conflictosDetalle.total_conflictos}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conflictosDetalle.conflictos.slice(0, 5).map((conflicto: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{conflicto.descripcion}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      <strong>Recomendación:</strong> {conflicto.recomendacion}
                    </p>
                  </div>
                  <Badge
                    variant={conflicto.severidad === 'alto' ? 'destructive' : 'outline'}
                    className="flex-shrink-0"
                  >
                    {conflicto.severidad}
                  </Badge>
                </div>
              ))}
              {conflictosDetalle.conflictos.length > 5 && (
                <p className="text-xs text-red-700 pt-2 text-center">
                  ... y {conflictosDetalle.conflictos.length - 5} conflicto(s) más
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumen" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="detalle" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Detalle
          </TabsTrigger>
          <TabsTrigger value="inconsistencias" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Inconsistencias
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="resumen" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Distribución de estados */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Guardias</CardTitle>
                <CardDescription>Estado de cumplimiento</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={estadoDistribucion.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {estadoDistribucion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} guardias`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Comparativa de estados */}
            <Card>
              <CardHeader>
                <CardTitle>Comparativa de Estados</CardTitle>
                <CardDescription>Guardias vs Asistencia</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparativaEstados}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="estado" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="Cantidad" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Métricas principales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Métricas Principales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Tasa de Cumplimiento</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{reporte.tasa_cumplimiento.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Guardias Cumplidas</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{reporte.total_guardias_cumplidas}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Guardias Incumplidas</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{reporte.total_guardias_incumplidas}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Asistencias No Programadas</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{reporte.asistencias_no_programadas}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Profesionales Afectados</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{reporte.profesionales_sin_asistencia}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Centros Involucrados</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{reporte.centros_afectados.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Detalle */}
        <TabsContent value="detalle" className="space-y-4">
          {/* Profesionales con incumplimiento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-red-600" />
                Profesionales con Guardias Incumplidas
              </CardTitle>
              <CardDescription>Listado de profesionales que no asistieron a sus guardias programadas</CardDescription>
            </CardHeader>
            <CardContent>
              {profesionalesIncumplimiento.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Excelente cumplimiento</p>
                  <p className="text-sm text-gray-500">Todos los profesionales cumplieron con sus guardias</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profesionalesIncumplimiento.map((prof, idx) => (
                    <div key={idx} className="flex items-start justify-between p-3 bg-red-50 rounded border border-red-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{prof.nombre}</p>
                        <p className="text-xs text-gray-600 mt-1">{prof.centro}</p>
                      </div>
                      <Badge variant="destructive">{prof.guardias_incumplidas}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Listado detallado de guardias */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Listado de Guardias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {guardiaAsistencias.map((guardia) => (
                  <div
                    key={guardia.id}
                    className={`p-3 rounded border cursor-pointer transition-colors ${
                      guardia.estado === 'cumplida'
                        ? 'bg-green-50 border-green-200'
                        : guardia.estado === 'no_cumplida'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                    onClick={() => setExpandedProfesional(expandedProfesional === guardia.id ? null : guardia.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{guardia.profesional_nombre}</p>
                        <p className="text-xs text-gray-600 mt-1">{guardia.centro_nombre}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(guardia.fecha_inicio).toLocaleDateString('es-ES')} |{' '}
                          {guardia.horas_guardadas.toFixed(1)}h
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            guardia.estado === 'cumplida'
                              ? 'default'
                              : guardia.estado === 'no_cumplida'
                              ? 'destructive'
                              : 'outline'
                          }
                          className="mb-2"
                        >
                          {guardia.estado}
                        </Badge>
                        {guardia.asistencia_confirmada && (
                          <div className="text-xs text-gray-600">
                            <p>Entrada: {guardia.entrada_registrada}</p>
                            {guardia.salida_registrada && <p>Salida: {guardia.salida_registrada}</p>}
                          </div>
                        )}
                      </div>
                    </div>

                    {expandedProfesional === guardia.id && guardia.inconsistencias.length > 0 && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <p className="text-xs font-medium text-gray-700">Inconsistencias detectadas:</p>
                        {guardia.inconsistencias.map((inc, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <AlertCircle className="w-3 h-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600">{inc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Inconsistencias */}
        <TabsContent value="inconsistencias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Inconsistencias por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inconsistenciasPorTipo.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Sin inconsistencias</p>
                  <p className="text-sm text-gray-500">No se detectaron inconsistencias</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inconsistenciasPorTipo.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-gray-900">{item.tipo}</span>
                      </div>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Asistencias no programadas */}
          {reporte.asistencias_no_programadas > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Asistencias No Programadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {comparativaAsistencia
                    .filter(c => c.estado === 'asistencia_no_programada')
                    .map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between p-3 bg-orange-50 rounded border border-orange-200">
                        <div>
                          <p className="font-medium text-gray-900">{item.profesional_nombre}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {item.fecha} | Entrada: {item.entrada_hora}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-orange-100 text-orange-800">
                          Sin guardia
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
