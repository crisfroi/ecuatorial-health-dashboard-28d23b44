
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

import {
  Crown,
  Users,
  FileText,
  Settings,
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Mail,
  Phone
} from 'lucide-react';

import { useProfesionales } from '@/hooks/useProfesionales';
import { useEstadisticas } from '@/hooks/useEstadisticas';

interface MinisterialPanelProps {
  userRole?: string;
}

const MinisterialPanel: React.FC<MinisterialPanelProps> = ({ userRole = 'ministerial' }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['total', 'aprobados', 'pendientes']);
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    estado: 'todos',
    area: 'todos',
    provincia: 'todos',
    urgencia: 'todos'
  });

  const { toast } = useToast();
  const { data: profesionales = [], isLoading: loadingProfesionales } = useProfesionales();
  const { data: estadisticas, isLoading: loadingEstadisticas } = useEstadisticas();

  // Calculate ministerial-level metrics
  const ministerialMetrics = useMemo(() => {
    if (!estadisticas) return null;

    return {
      totalProfesionales: estadisticas.total,
      aprobadosMes: estadisticas.aprobados,
      pendientesFirma: estadisticas.pendientes,
      rechazadosMes: estadisticas.rechazados,
      eficienciaAprobacion: estadisticas.tasaAprobacion,
      tiempoPromedioRevision: '3.2 días', // This would come from actual data analysis
      centrosActivos: Object.keys(estadisticas.porArea).length,
      alertasVencimiento: estadisticas.vencimientosProximos
    };
  }, [estadisticas]);

  const handleBulkAction = (action: string) => {
    if (bulkSelection.length === 0) {
      toast({
        title: "Ninguna selección",
        description: "Selecciona al menos un elemento para realizar acciones masivas.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: `Acción ${action}`,
      description: `Se ejecutará ${action} en ${bulkSelection.length} elementos seleccionados.`,
      variant: "default"
    });
  };

  const handleExportReport = (type: string) => {
    toast({
      title: "Exportando reporte",
      description: `Generando reporte ${type}...`,
      variant: "default"
    });
  };

  if (loadingProfesionales || loadingEstadisticas) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Crown className="h-6 w-6 mr-2 text-yellow-600" />
          <h1 className="text-3xl font-bold">Panel Ministerial</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Crown className="h-6 w-6 mr-2 text-yellow-600" />
          <div>
            <h1 className="text-3xl font-bold">Panel Ministerial</h1>
            <p className="text-gray-600">Dashboard ejecutivo para la toma de decisiones</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">Este mes</SelectItem>
              <SelectItem value="lastMonth">Mes pasado</SelectItem>
              <SelectItem value="thisYear">Este año</SelectItem>
              <SelectItem value="lastYear">Año pasado</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => handleExportReport('ejecutivo')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      {ministerialMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Profesionales</p>
                  <p className="text-3xl font-bold text-blue-700">
                    {ministerialMetrics.totalProfesionales}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Aprobados</p>
                  <p className="text-3xl font-bold text-green-700">
                    {ministerialMetrics.aprobadosMes}
                  </p>
                  <p className="text-xs text-green-600">
                    {ministerialMetrics.eficienciaAprobacion}% eficiencia
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Pendientes Firma</p>
                  <p className="text-3xl font-bold text-yellow-700">
                    {ministerialMetrics.pendientesFirma}
                  </p>
                  <p className="text-xs text-yellow-600">
                    Requieren atención
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Alertas Vencimiento</p>
                  <p className="text-3xl font-bold text-red-700">
                    {ministerialMetrics.alertasVencimiento}
                  </p>
                  <p className="text-xs text-red-600">
                    Próximos 30 días
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Indicadores Clave de Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ministerialMetrics && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-700">
                    {ministerialMetrics.tiempoPromedioRevision}
                  </div>
                  <div className="text-sm text-gray-600">Tiempo Promedio Revisión</div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-700">
                    {ministerialMetrics.centrosActivos}
                  </div>
                  <div className="text-sm text-gray-600">Centros Activos</div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {ministerialMetrics.eficienciaAprobacion}%
                  </div>
                  <div className="text-sm text-green-600">Tasa de Aprobación</div>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    98.5%
                  </div>
                  <div className="text-sm text-blue-600">Satisfacción Sistema</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Tendencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Crecimiento mensual</span>
                <Badge className="bg-green-100 text-green-800">+12.5%</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Eficiencia operativa</span>
                <Badge className="bg-blue-100 text-blue-800">+8.2%</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tiempo de procesamiento</span>
                <Badge className="bg-yellow-100 text-yellow-800">-15.3%</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Satisfacción usuarios</span>
                <Badge className="bg-green-100 text-green-800">+5.1%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decision Support Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Herramientas de Decisión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={() => handleExportReport('completo')}
                className="w-full justify-start"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generar Reporte Ejecutivo Completo
              </Button>

              <Button 
                onClick={() => handleExportReport('tendencias')}
                className="w-full justify-start"
                variant="outline"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Análisis de Tendencias
              </Button>

              <Button 
                onClick={() => handleExportReport('predicciones')}
                className="w-full justify-start"
                variant="outline"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Predicciones y Proyecciones
              </Button>

              <Button 
                onClick={() => handleExportReport('comparativo')}
                className="w-full justify-start"
                variant="outline"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Análisis Comparativo Periodos
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Alertas y Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">Vencimientos Próximos</p>
                  <p className="text-sm text-red-700">
                    {ministerialMetrics?.alertasVencimiento} carnets vencen en 30 días
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-800">Pendientes de Firma</p>
                  <p className="text-sm text-yellow-700">
                    {ministerialMetrics?.pendientesFirma} solicitudes requieren firma ministerial
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-800">Reporte Semanal</p>
                  <p className="text-sm text-blue-700">
                    Nuevo reporte ejecutivo disponible
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions for Ministry Level */}
      {bulkSelection.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-800">
              Acciones Ministeriales ({bulkSelection.length} seleccionados)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => handleBulkAction('aprobar')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobación Ministerial
              </Button>
              
              <Button 
                onClick={() => handleBulkAction('firmar')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Firma Digital
              </Button>
              
              <Button 
                onClick={() => handleBulkAction('exportar')}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Selección
              </Button>

              <Button 
                onClick={() => setBulkSelection([])}
                variant="outline"
              >
                Limpiar Selección
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium">Aprobar Lote</p>
              <p className="text-sm text-gray-600">Aprobación masiva de solicitudes</p>
            </div>

            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="font-medium">Generar Decreto</p>
              <p className="text-sm text-gray-600">Crear documento oficial</p>
            </div>

            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <Settings className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="font-medium">Configuración</p>
              <p className="text-sm text-gray-600">Ajustes del sistema</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MinisterialPanel;
