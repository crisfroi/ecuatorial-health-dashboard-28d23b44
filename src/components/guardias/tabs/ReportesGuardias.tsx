import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useGuardiasStore } from "@/stores/useGuardiasStore";
import { 
  BarChart3, 
  Download, 
  FileText, 
  TrendingUp,
  Calendar,
  Users,
  Clock,
  DollarSign,
  PieChart,
  Activity,
  Filter,
  Eye
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReportesGuardiasProps {
  selectedMonth: number;
  selectedYear: number;
  selectedCenter: string | null;
  userRole: string;
}

export const ReportesGuardias: React.FC<ReportesGuardiasProps> = ({
  selectedMonth,
  selectedYear,
  selectedCenter,
  userRole
}) => {
  const { toast } = useToast();
  const {
    guardias,
    profesionales,
    centros,
    nominas,
    pagos,
    loading,
    fetchGuardias,
    fetchProfesionales,
    fetchCentros,
    fetchNominas,
    fetchPagos,
    generateReport,
    exportReport
  } = useGuardiasStore();

  const [selectedTab, setSelectedTab] = useState('estadisticas');
  const [tipoReporte, setTipoReporte] = useState('mensual');
  const [formatoExport, setFormatoExport] = useState<'PDF' | 'EXCEL'>('PDF');

  useEffect(() => {
    fetchGuardias(selectedMonth, selectedYear, selectedCenter);
    fetchProfesionales(selectedCenter);
    fetchCentros();
    fetchNominas(selectedMonth, selectedYear, selectedCenter);
    fetchPagos(selectedMonth, selectedYear, selectedCenter);
  }, [selectedMonth, selectedYear, selectedCenter]);

  // Cálculos estadísticos
  const totalGuardias = guardias.length;
  const totalProfesionales = new Set(guardias.map(g => g.profesional_id)).size;
  const totalHoras = guardias.reduce((sum, g) => {
    const inicio = new Date(`1970-01-01T${g.horas_inicio}:00`);
    const fin = new Date(`1970-01-01T${g.horas_fin}:00`);
    if (fin < inicio) fin.setDate(fin.getDate() + 1); // Cruzar medianoche
    return sum + (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
  }, 0);

  const guardiasPerTurno = {
    MAÑANA: guardias.filter(g => g.turno === 'MAÑANA').length,
    TARDE: guardias.filter(g => g.turno === 'TARDE').length,
    NOCHE: guardias.filter(g => g.turno === 'NOCHE').length
  };

  const guardiasPerTipo = {
    ORDINARIA: guardias.filter(g => g.tipo_guardia === 'ORDINARIA').length,
    FESTIVA: guardias.filter(g => g.tipo_guardia === 'FESTIVA').length,
    NOCTURNA: guardias.filter(g => g.tipo_guardia === 'NOCTURNA').length
  };

  const profesionalesStats = profesionales.map(prof => {
    const guardiasProfesional = guardias.filter(g => g.profesional_id === prof.id);
    const horasProfesional = guardiasProfesional.reduce((sum, g) => {
      const inicio = new Date(`1970-01-01T${g.horas_inicio}:00`);
      const fin = new Date(`1970-01-01T${g.horas_fin}:00`);
      if (fin < inicio) fin.setDate(fin.getDate() + 1);
      return sum + (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
    }, 0);
    
    return {
      ...prof,
      totalGuardias: guardiasProfesional.length,
      totalHoras: horasProfesional,
      guardiasManana: guardiasProfesional.filter(g => g.turno === 'MAÑANA').length,
      guardiasTarde: guardiasProfesional.filter(g => g.turno === 'TARDE').length,
      guardiasNoche: guardiasProfesional.filter(g => g.turno === 'NOCHE').length,
      guardiasOrdinarias: guardiasProfesional.filter(g => g.tipo_guardia === 'ORDINARIA').length,
      guardiasFestivas: guardiasProfesional.filter(g => g.tipo_guardia === 'FESTIVA').length
    };
  }).filter(prof => prof.totalGuardias > 0);

  const centrosStats = centros.map(centro => {
    const guardiasCentro = guardias.filter(g => g.centro_id === centro.id);
    const profesionalesCentro = new Set(guardiasCentro.map(g => g.profesional_id)).size;
    
    return {
      ...centro,
      totalGuardias: guardiasCentro.length,
      totalProfesionales: profesionalesCentro,
      guardiasManana: guardiasCentro.filter(g => g.turno === 'MAÑANA').length,
      guardiasTarde: guardiasCentro.filter(g => g.turno === 'TARDE').length,
      guardiasNoche: guardiasCentro.filter(g => g.turno === 'NOCHE').length
    };
  }).filter(centro => centro.totalGuardias > 0);

  const totalNominas = nominas.reduce((sum, n) => sum + n.total, 0);
  const totalPagos = pagos.reduce((sum, p) => sum + p.monto, 0);

  const handleExportReport = async (tipo: string) => {
    try {
      await exportReport(tipo, {
        mes: selectedMonth,
        ano: selectedYear,
        centro_id: selectedCenter,
        formato: formatoExport
      });
      
      toast({
        title: "Reporte exportado",
        description: `Reporte ${tipo} exportado exitosamente.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'XAF'
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
  };

  const canViewReports = ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO', 'REVISOR_SOLICITUDES'].includes(userRole);
  const canExportReports = ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO'].includes(userRole);

  if (!canViewReports) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Acceso Restringido
          </h3>
          <p className="text-gray-600">
            No tiene permisos para ver los reportes de guardias.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes de Guardias</h2>
          <p className="text-gray-600">
            Análisis y reportes de guardias médicas para {selectedMonth}/{selectedYear}
          </p>
        </div>
        
        {canExportReports && (
          <div className="flex items-center space-x-2">
            <Select value={formatoExport} onValueChange={(value: 'PDF' | 'EXCEL') => setFormatoExport(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="EXCEL">Excel</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => handleExportReport('completo')}
            >
              <Download className="w-4 h-4 mr-1" />
              Exportar Completo
            </Button>
          </div>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="estadisticas">Estadísticas Generales</TabsTrigger>
          <TabsTrigger value="profesionales">Por Profesional</TabsTrigger>
          <TabsTrigger value="centros">Por Centro</TabsTrigger>
          <TabsTrigger value="financiero">Reporte Financiero</TabsTrigger>
        </TabsList>

        <TabsContent value="estadisticas" className="space-y-6">
          {/* Métricas generales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Guardias</p>
                    <p className="text-2xl font-bold">{totalGuardias}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Profesionales Activos</p>
                    <p className="text-2xl font-bold">{totalProfesionales}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Horas</p>
                    <p className="text-2xl font-bold">{formatHours(totalHoras)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Promedio/Profesional</p>
                    <p className="text-2xl font-bold">
                      {totalProfesionales > 0 ? Math.round(totalGuardias / totalProfesionales) : 0}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribución por turnos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5" />
                  <span>Distribución por Turnos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(guardiasPerTurno).map(([turno, cantidad]) => (
                    <div key={turno} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${
                          turno === 'MAÑANA' ? 'bg-blue-500' :
                          turno === 'TARDE' ? 'bg-orange-500' :
                          'bg-purple-500'
                        }`}></div>
                        <span className="font-medium">{turno}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{cantidad}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({totalGuardias > 0 ? Math.round((cantidad / totalGuardias) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Distribución por Tipo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(guardiasPerTipo).map(([tipo, cantidad]) => (
                    <div key={tipo} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${
                          tipo === 'ORDINARIA' ? 'bg-green-500' :
                          tipo === 'FESTIVA' ? 'bg-red-500' :
                          'bg-indigo-500'
                        }`}></div>
                        <span className="font-medium">{tipo}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{cantidad}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({totalGuardias > 0 ? Math.round((cantidad / totalGuardias) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profesionales" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Reporte por Profesional</h3>
            {canExportReports && (
              <Button
                variant="outline"
                onClick={() => handleExportReport('profesionales')}
              >
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {profesionalesStats.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay datos de profesionales
                  </h3>
                  <p className="text-gray-600">
                    No se encontraron guardias registradas para mostrar estadísticas por profesional.
                  </p>
                </CardContent>
              </Card>
            ) : (
              profesionalesStats
                .sort((a, b) => b.totalGuardias - a.totalGuardias)
                .map((prof) => (
                  <Card key={prof.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-2">{prof.nombre_completo}</h4>
                          <p className="text-sm text-gray-600 mb-3">{prof.especialidad}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Total Guardias:</span>
                              <p className="text-lg font-bold text-blue-600">{prof.totalGuardias}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Total Horas:</span>
                              <p className="text-lg font-bold text-green-600">{formatHours(prof.totalHoras)}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Mañana/Tarde/Noche:</span>
                              <p className="text-sm">{prof.guardiasManana}/{prof.guardiasTarde}/{prof.guardiasNoche}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Ordinarias/Festivas:</span>
                              <p className="text-sm">{prof.guardiasOrdinarias}/{prof.guardiasFestivas}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="centros" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Reporte por Centro</h3>
            {canExportReports && (
              <Button
                variant="outline"
                onClick={() => handleExportReport('centros')}
              >
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {centrosStats.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay datos de centros
                  </h3>
                  <p className="text-gray-600">
                    No se encontraron guardias registradas para mostrar estadísticas por centro.
                  </p>
                </CardContent>
              </Card>
            ) : (
              centrosStats
                .sort((a, b) => b.totalGuardias - a.totalGuardias)
                .map((centro) => (
                  <Card key={centro.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-2">{centro.nombre}</h4>
                          <p className="text-sm text-gray-600 mb-3">{centro.tipo_centro}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Total Guardias:</span>
                              <p className="text-lg font-bold text-blue-600">{centro.totalGuardias}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Profesionales:</span>
                              <p className="text-lg font-bold text-green-600">{centro.totalProfesionales}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Promedio/Prof:</span>
                              <p className="text-lg font-bold text-orange-600">
                                {centro.totalProfesionales > 0 ? Math.round(centro.totalGuardias / centro.totalProfesionales) : 0}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">M/T/N:</span>
                              <p className="text-sm">{centro.guardiasManana}/{centro.guardiasTarde}/{centro.guardiasNoche}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="financiero" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Reporte Financiero</h3>
            {canExportReports && (
              <Button
                variant="outline"
                onClick={() => handleExportReport('financiero')}
              >
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Nóminas</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalNominas)}</p>
                  </div>
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Pagos</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPagos)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pendiente</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalNominas - totalPagos)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Nóminas del Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {nominas.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No hay nóminas registradas</p>
                  ) : (
                    nominas.map((nomina) => (
                      <div key={nomina.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{nomina.mes}/{nomina.ano}</p>
                          <p className="text-sm text-gray-600">
                            {nomina.total_lineas} profesionales
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(nomina.total)}</p>
                          <Badge className={
                            nomina.estado === 'APROBADO' ? 'bg-green-100 text-green-800' :
                            nomina.estado === 'GENERADA' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {nomina.estado}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pagos.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No hay pagos registrados</p>
                  ) : (
                    ['PENDIENTE', 'APROBADO', 'PROCESADO', 'RECHAZADO'].map((estado) => {
                      const pagosPorEstado = pagos.filter(p => p.estado === estado);
                      const totalPorEstado = pagosPorEstado.reduce((sum, p) => sum + p.monto, 0);
                      
                      return (
                        <div key={estado} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <Badge className={
                              estado === 'PROCESADO' ? 'bg-green-100 text-green-800' :
                              estado === 'APROBADO' ? 'bg-blue-100 text-blue-800' :
                              estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {estado}
                            </Badge>
                            <span className="text-sm text-gray-600">({pagosPorEstado.length})</span>
                          </div>
                          <span className="font-bold">{formatCurrency(totalPorEstado)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
