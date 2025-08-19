import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useGuardiasStore } from "@/stores/useGuardiasStore";
import { 
  Calendar, 
  Download, 
  Upload, 
  Grid, 
  List, 
  Users, 
  Clock,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CuadrantesGuardiasProps {
  selectedMonth: number;
  selectedYear: number;
  selectedCenter: string | null;
  userRole: string;
}

export const CuadrantesGuardias: React.FC<CuadrantesGuardiasProps> = ({
  selectedMonth,
  selectedYear,
  selectedCenter,
  userRole
}) => {
  const { toast } = useToast();
  const {
    cuadrantes,
    guardias,
    profesionales,
    loading,
    fetchCuadrantes,
    fetchGuardias,
    fetchProfesionales,
    createCuadrante,
    updateCuadrante,
    generateCuadrante,
    exportCuadrante
  } = useGuardiasStore();

  const [viewType, setViewType] = useState<'calendario' | 'lista'>('calendario');
  const [selectedCuadrante, setSelectedCuadrante] = useState<any>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [generateParams, setGenerateParams] = useState({
    tipo_cuadrante: 'MENSUAL' as 'MENSUAL' | 'SEMANAL',
    auto_asignar: true,
    considerar_preferencias: true
  });

  const currentDate = new Date();
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getDay();

  useEffect(() => {
    fetchCuadrantes(selectedMonth, selectedYear, selectedCenter);
    fetchGuardias(selectedMonth, selectedYear, selectedCenter);
    fetchProfesionales(selectedCenter);
  }, [selectedMonth, selectedYear, selectedCenter]);

  const cuadranteActual = cuadrantes.find(c => 
    c.mes === selectedMonth && 
    c.ano === selectedYear && 
    (selectedCenter ? c.centro_id === selectedCenter : true)
  );

  const handleGenerateCuadrante = async () => {
    try {
      await generateCuadrante({
        mes: selectedMonth,
        ano: selectedYear,
        centro_id: selectedCenter,
        ...generateParams
      });
      
      toast({
        title: "Cuadrante generado",
        description: "El cuadrante ha sido generado exitosamente.",
      });
      
      setIsGenerateDialogOpen(false);
      fetchCuadrantes(selectedMonth, selectedYear, selectedCenter);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el cuadrante.",
        variant: "destructive",
      });
    }
  };

  const handleExportCuadrante = async (formato: 'PDF' | 'EXCEL') => {
    if (!cuadranteActual) {
      toast({
        title: "Error",
        description: "No hay cuadrante para exportar.",
        variant: "destructive",
      });
      return;
    }

    try {
      await exportCuadrante(cuadranteActual.id, formato);
      toast({
        title: "Exportación exitosa",
        description: `Cuadrante exportado en formato ${formato}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar el cuadrante.",
        variant: "destructive",
      });
    }
  };

  const getGuardiasForDay = (day: number) => {
    const fecha = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return guardias.filter(guardia => guardia.fecha === fecha);
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[dayIndex];
  };

  const getMonthName = (month: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1];
  };

  const getTurnoBadgeColor = (turno: string) => {
    switch (turno) {
      case 'MAÑANA': return 'bg-blue-100 text-blue-800';
      case 'TARDE': return 'bg-orange-100 text-orange-800';
      case 'NOCHE': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canManageCuadrantes = ['SUPER_ADMINISTRADOR', 'DIRECTIVO_CENTRO_SANITARIO'].includes(userRole);

  const renderCalendarView = () => {
    const calendarDays = [];
    
    // Días vacíos al inicio del mes
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(
        <div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-200"></div>
      );
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const guardiasDelDia = getGuardiasForDay(day);
      const isToday = 
        currentDate.getDate() === day &&
        currentDate.getMonth() === selectedMonth - 1 &&
        currentDate.getFullYear() === selectedYear;

      calendarDays.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-1 overflow-hidden hover:bg-gray-50 transition-colors ${
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {guardiasDelDia.slice(0, 2).map((guardia, index) => (
              <div
                key={index}
                className="text-xs p-1 rounded truncate"
                style={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                title={`${guardia.profesional?.nombre_completo} - ${guardia.turno}`}
              >
                {guardia.profesional?.nombre_completo?.split(' ')[0]} ({guardia.turno})
              </div>
            ))}
            {guardiasDelDia.length > 2 && (
              <div className="text-xs text-gray-500">
                +{guardiasDelDia.length - 2} más
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-300 rounded-lg overflow-hidden">
        {/* Encabezados de días */}
        {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
          <div
            key={dayIndex}
            className="bg-gray-100 p-2 text-center text-sm font-medium text-gray-700 border-b border-gray-300"
          >
            {getDayName(dayIndex)}
          </div>
        ))}
        {/* Días del calendario */}
        {calendarDays}
      </div>
    );
  };

  const renderListView = () => {
    const groupedGuardias = guardias.reduce((acc, guardia) => {
      const fecha = guardia.fecha;
      if (!acc[fecha]) {
        acc[fecha] = [];
      }
      acc[fecha].push(guardia);
      return acc;
    }, {} as Record<string, any[]>);

    const sortedDates = Object.keys(groupedGuardias).sort();

    return (
      <div className="space-y-4">
        {sortedDates.map(fecha => (
          <Card key={fecha}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>{new Date(fecha).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groupedGuardias[fecha].map((guardia, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{guardia.profesional?.nombre_completo}</span>
                      <Badge className={getTurnoBadgeColor(guardia.turno)}>
                        {guardia.turno}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {guardia.horas_inicio} - {guardia.horas_fin}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {guardia.tipo_guardia}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {sortedDates.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay guardias programadas
              </h3>
              <p className="text-gray-600">
                {canManageCuadrantes ? 
                  'Genera un cuadrante para programar las guardias del mes.' :
                  'No hay guardias programadas para este período.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cuadrantes de Guardias</h2>
          <p className="text-gray-600">
            Programación y gestión de cuadrantes para {getMonthName(selectedMonth)} {selectedYear}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Controles de vista */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewType === 'calendario' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('calendario')}
              className="rounded-none"
            >
              <Grid className="w-4 h-4 mr-1" />
              Calendario
            </Button>
            <Button
              variant={viewType === 'lista' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('lista')}
              className="rounded-none"
            >
              <List className="w-4 h-4 mr-1" />
              Lista
            </Button>
          </div>

          {/* Botones de acción */}
          {cuadranteActual && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCuadrante('PDF')}
              >
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCuadrante('EXCEL')}
              >
                <Download className="w-4 h-4 mr-1" />
                Excel
              </Button>
            </>
          )}

          {canManageCuadrantes && (
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {cuadranteActual ? 'Regenerar' : 'Generar'} Cuadrante
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generar Cuadrante de Guardias</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tipo de Cuadrante</label>
                    <Select
                      value={generateParams.tipo_cuadrante}
                      onValueChange={(value: 'MENSUAL' | 'SEMANAL') => 
                        setGenerateParams(prev => ({ ...prev, tipo_cuadrante: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MENSUAL">Mensual</SelectItem>
                        <SelectItem value="SEMANAL">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="auto_asignar"
                        checked={generateParams.auto_asignar}
                        onChange={(e) => setGenerateParams(prev => ({ 
                          ...prev, 
                          auto_asignar: e.target.checked 
                        }))}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="auto_asignar" className="text-sm">
                        Asignación automática de profesionales
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="considerar_preferencias"
                        checked={generateParams.considerar_preferencias}
                        onChange={(e) => setGenerateParams(prev => ({ 
                          ...prev, 
                          considerar_preferencias: e.target.checked 
                        }))}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="considerar_preferencias" className="text-sm">
                        Considerar preferencias de profesionales
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsGenerateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleGenerateCuadrante} disabled={loading}>
                      Generar Cuadrante
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Estado del cuadrante */}
      {cuadranteActual && (
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Cuadrante {cuadranteActual.tipo_cuadrante}</h3>
                  <p className="text-sm text-gray-600">
                    Estado: <span className="font-medium">{cuadranteActual.estado}</span>
                    {cuadranteActual.fecha_aprobacion && (
                      <span> • Aprobado el {new Date(cuadranteActual.fecha_aprobacion).toLocaleDateString('es-ES')}</span>
                    )}
                  </p>
                </div>
              </div>
              <Badge 
                variant={cuadranteActual.estado === 'APROBADO' ? 'default' : 'secondary'}
              >
                {cuadranteActual.estado}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista principal */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando cuadrante...</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            {viewType === 'calendario' ? renderCalendarView() : renderListView()}
          </CardContent>
        </Card>
      )}

      {/* Resumen estadístico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Guardias</p>
                <p className="text-2xl font-bold">{guardias.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profesionales</p>
                <p className="text-2xl font-bold">
                  {new Set(guardias.map(g => g.profesional_id)).size}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Turnos Noche</p>
                <p className="text-2xl font-bold">
                  {guardias.filter(g => g.turno === 'NOCHE').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Días Festivos</p>
                <p className="text-2xl font-bold">
                  {guardias.filter(g => g.tipo_guardia === 'FESTIVA').length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
