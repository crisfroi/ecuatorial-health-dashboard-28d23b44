import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isWeekend, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Users,
  Calendar as CalendarIcon,
  Search,
  Eye,
  AlertCircle,
  Shield,
  Zap,
} from 'lucide-react';
import { useGuardiasStore } from '@/stores/useGuardiasStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Guardia {
  id: string;
  profesional_ids: string[];
  centro_salud_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: string;
  estado?: string;
}

interface Conflicto {
  profesionalId: string;
  profesionalNombre: string;
  fecha: string;
  guardias: Guardia[];
  tipo: 'solapamiento' | 'mismo_dia_dos_guardias';
}

interface DiaStats {
  fecha: string;
  guardias: Guardia[];
  profesionales: Set<string>;
  conflictos: Conflicto[];
  tasaCubertura: number;
}

export const GuardiasCalendarView: React.FC<{
  selectedMonth: number;
  selectedYear: number;
  selectedCenter: string | null;
  userRole: string;
}> = ({ selectedMonth, selectedYear, selectedCenter, userRole }) => {
  const { toast } = useToast();
  const { guardias, profesionales, centros, loading, fetchGuardias, fetchProfesionales, fetchCentros } = useGuardiasStore();

  const [currentDate, setCurrentDate] = useState(new Date(selectedYear, selectedMonth - 1, 1));
  const [viewType, setViewType] = useState<'calendar' | 'list'>('calendar');
  const [selectedDayDetails, setSelectedDayDetails] = useState<DiaStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);
  const [validandoConflictos, setValidandoConflictos] = useState(false);
  const [conflictosEdgeFunction, setConflictosEdgeFunction] = useState<any>(null);

  // Fetch data
  useEffect(() => {
    fetchGuardias(selectedMonth, selectedYear, selectedCenter);
    fetchProfesionales(selectedCenter);
    if (!centros.length) fetchCentros(true);
  }, [selectedMonth, selectedYear, selectedCenter]);

  // Calculate conflicts
  const conflictosGlobales = useMemo(() => {
    const conflictos: Map<string, Conflicto> = new Map();

    // Group guardias by professional and date
    const guardiasXProfesional: Map<string, Guardia[]> = new Map();

    for (const guardia of guardias) {
      if (guardia.profesional_ids && Array.isArray(guardia.profesional_ids)) {
        for (const profId of guardia.profesional_ids) {
          if (!guardiasXProfesional.has(profId)) {
            guardiasXProfesional.set(profId, []);
          }
          guardiasXProfesional.get(profId)?.push(guardia);
        }
      }
    }

    // Detect conflicts
    for (const [profId, guardiasDelProf] of guardiasXProfesional.entries()) {
      const prof = profesionales.find((p) => p.id === profId);
      const profNombre = prof?.nombre_completo || profId;

      for (let i = 0; i < guardiasDelProf.length; i++) {
        for (let j = i + 1; j < guardiasDelProf.length; j++) {
          const g1 = guardiasDelProf[i];
          const g2 = guardiasDelProf[j];

          const inicio1 = new Date(g1.fecha_inicio).getTime();
          const fin1 = new Date(g1.fecha_fin).getTime();
          const inicio2 = new Date(g2.fecha_inicio).getTime();
          const fin2 = new Date(g2.fecha_fin).getTime();

          // Check for overlap
          if (inicio1 < fin2 && inicio2 < fin1) {
            const key = `${profId}-${Math.min(inicio1, inicio2)}`;
            if (!conflictos.has(key)) {
              conflictos.set(key, {
                profesionalId: profId,
                profesionalNombre: profNombre,
                fecha: format(new Date(Math.max(inicio1, inicio2)), 'yyyy-MM-dd'),
                guardias: [g1, g2],
                tipo: 'solapamiento',
              });
            }
          }

          // Check if same day
          const fecha1 = format(new Date(g1.fecha_inicio), 'yyyy-MM-dd');
          const fecha2 = format(new Date(g2.fecha_inicio), 'yyyy-MM-dd');
          if (fecha1 === fecha2) {
            const key = `${profId}-${fecha1}`;
            if (!conflictos.has(key)) {
              conflictos.set(key, {
                profesionalId: profId,
                profesionalNombre: profNombre,
                fecha: fecha1,
                guardias: [g1, g2],
                tipo: 'mismo_dia_dos_guardias',
              });
            }
          }
        }
      }
    }

    return Array.from(conflictos.values());
  }, [guardias, profesionales]);

  // Calculate daily stats
  const diasStats = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const dias = eachDayOfInterval({ start, end });

    return dias.map((dia) => {
      const diaStr = format(dia, 'yyyy-MM-dd');
      const guardiasDelDia = guardias.filter((g) => {
        const inicio = format(new Date(g.fecha_inicio), 'yyyy-MM-dd');
        return inicio === diaStr;
      });

      const profesionalesSet = new Set<string>();
      for (const g of guardiasDelDia) {
        if (g.profesional_ids && Array.isArray(g.profesional_ids)) {
          g.profesional_ids.forEach((id) => profesionalesSet.add(id));
        }
      }

      const conflictosDelDia = conflictosGlobales.filter((c) => c.fecha === diaStr);

      const totalProfesionales = profesionales.length;
      const tasaCubertura = totalProfesionales > 0 ? (profesionalesSet.size / totalProfesionales) * 100 : 0;

      return {
        fecha: diaStr,
        guardias: guardiasDelDia,
        profesionales: profesionalesSet,
        conflictos: conflictosDelDia,
        tasaCubertura,
      };
    });
  }, [currentDate, guardias, profesionales, conflictosGlobales]);

  // Filter for list view
  const diasFiltrados = diasStats.filter((dia) => {
    const matchesSearch =
      searchTerm === '' ||
      dia.guardias.some((g) => {
        const prof = profesionales.find((p) => g.profesional_ids?.includes(p.id));
        return prof?.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase());
      });

    const matchesConflict = !showConflictsOnly || dia.conflictos.length > 0;

    return matchesSearch && matchesConflict;
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleValidarConflictosEdgeFunction = async () => {
    setValidandoConflictos(true);
    try {
      const { data, error } = await supabase.functions.invoke('detect-guardia-conflicts', {
        body: {
          mes: selectedMonth,
          ano: selectedYear,
          centro_id: selectedCenter,
        },
      });

      if (error) {
        throw error;
      }

      setConflictosEdgeFunction(data);
      toast({
        title: data.total_conflictos > 0 ? 'Conflictos detectados' : 'Validación completada',
        description: data.mensaje || `Se validaron ${data.guardias_validadas} guardia(s)`,
        variant: data.total_conflictos > 0 ? 'destructive' : 'default',
      });
    } catch (error) {
      console.error('Error validando conflictos:', error);
      toast({
        title: 'Error',
        description: 'No se pudo validar conflictos',
        variant: 'destructive',
      });
    } finally {
      setValidandoConflictos(false);
    }
  };

  // Stats
  const totalGuardias = guardias.length;
  const diasConConflictos = diasStats.filter((d) => d.conflictos.length > 0).length;
  const tasaCoberturaPromedio = diasStats.length > 0 ? (diasStats.reduce((sum, d) => sum + d.tasaCubertura, 0) / diasStats.length) : 0;

  const monthName = format(currentDate, 'MMMM yyyy', { locale: es });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cuadrantes de Guardias</h1>
          <p className="text-gray-600 mt-1">Visualización e gestión de guardias médicas</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidarConflictosEdgeFunction}
            disabled={validandoConflictos}
          >
            <Zap className="w-4 h-4 mr-2" />
            {validandoConflictos ? 'Validando...' : 'Validar (Backend)'}
          </Button>
          <Button variant={viewType === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setViewType('calendar')}>
            <CalendarIcon className="w-4 h-4 mr-2" />
            Calendario
          </Button>
          <Button variant={viewType === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewType('list')}>
            <Users className="w-4 h-4 mr-2" />
            Lista
          </Button>
        </div>
      </div>

      {/* KPI Stats - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Guardias</p>
                <p className="text-2xl font-bold text-blue-600">{totalGuardias}</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-blue-600 opacity-30" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Programadas</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${diasConConflictos > 0 ? 'border-l-red-500 bg-red-50/30' : 'border-l-green-500 bg-green-50/30'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Conflictos</p>
                <p className={`text-2xl font-bold ${diasConConflictos > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {diasConConflictos}
                </p>
              </div>
              {diasConConflictos > 0 ? (
                <AlertTriangle className="w-8 h-8 text-red-600 opacity-30" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600 opacity-30" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">Detectados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-purple-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Cobertura</p>
                <p className="text-2xl font-bold text-purple-600">{tasaCoberturaPromedio.toFixed(0)}%</p>
              </div>
              <Users className="w-8 h-8 text-purple-600 opacity-30" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Promedio</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-orange-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Conflictos</p>
                <p className="text-2xl font-bold text-orange-600">{conflictosGlobales.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600 opacity-30" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Globales</p>
          </CardContent>
        </Card>
      </div>

      {/* Conflictos Alert - Local (frontend) */}
      {conflictosGlobales.length > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Se detectaron {conflictosGlobales.length} conflicto(s) locales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conflictosGlobales.slice(0, 3).map((conflicto, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-red-200">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{conflicto.profesionalNombre}</p>
                    <p className="text-xs text-gray-600">
                      {conflicto.tipo === 'solapamiento' ? 'Guardias solapadas' : 'Dos guardias el mismo día'} - {conflicto.fecha}
                    </p>
                  </div>
                  <Badge variant="destructive">{conflicto.guardias.length} guardias</Badge>
                </div>
              ))}
              {conflictosGlobales.length > 3 && (
                <p className="text-xs text-red-700 pt-2">... y {conflictosGlobales.length - 3} conflicto(s) más</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conflictos Alert - Edge Function (backend) */}
      {conflictosEdgeFunction && conflictosEdgeFunction.total_conflictos > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Zap className="w-5 h-5" />
              Validación de Backend: {conflictosEdgeFunction.total_conflictos} conflicto(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conflictosEdgeFunction.conflictos.slice(0, 3).map((conflicto: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-2 bg-white rounded border border-orange-200">
                  <Shield className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{conflicto.descripcion}</p>
                    <p className="text-xs text-gray-600 mt-1">{conflicto.recomendacion}</p>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0">
                    {conflicto.severidad}
                  </Badge>
                </div>
              ))}
              {conflictosEdgeFunction.conflictos.length > 3 && (
                <p className="text-xs text-orange-700 pt-2">... y {conflictosEdgeFunction.conflictos.length - 3} conflicto(s) más</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      {viewType === 'calendar' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="capitalize">{monthName}</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleToday}>
                  Hoy
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                  <div key={day} className="text-center font-bold text-gray-700 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {diasStats.map((diaStats, idx) => {
                  const dia = parseISO(diaStats.fecha);
                  const isCurrentMonth = isSameMonth(dia, currentDate);
                  const isCurrentDay = isToday(dia);
                  const isWeekendDay = isWeekend(dia);
                  const hasConflicts = diaStats.conflictos.length > 0;

                  return (
                    <Dialog key={idx}>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => setSelectedDayDetails(diaStats)}
                          className={`
                            min-h-24 p-2 rounded-lg border-2 cursor-pointer transition-all
                            ${!isCurrentMonth ? 'opacity-40 cursor-not-allowed' : ''}
                            ${isCurrentDay ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                            ${hasConflicts ? 'border-red-500 bg-red-50' : ''}
                            ${isWeekendDay && isCurrentMonth ? 'bg-gray-50' : ''}
                            hover:shadow-md
                          `}
                        >
                          <div className="text-sm font-bold text-gray-900">{format(dia, 'd')}</div>
                          <div className="text-xs mt-1 space-y-1">
                            {diaStats.guardias.length > 0 && (
                              <div className="text-blue-600 font-medium">{diaStats.guardias.length} guardias</div>
                            )}
                            {hasConflicts && <div className="text-red-600 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              ¡Conflicto!
                            </div>}
                            <div className="text-gray-600">{diaStats.profesionales.size} prof.</div>
                          </div>
                        </button>
                      </DialogTrigger>

                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{format(dia, 'EEEE, d MMMM', { locale: es })}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {diaStats.conflictos.length > 0 && (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                              <p className="font-bold text-red-700 flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4" />
                                ⚠️ Se detectaron {diaStats.conflictos.length} conflicto(s)
                              </p>
                              <div className="space-y-2">
                                {diaStats.conflictos.map((c, idx) => (
                                  <div key={idx} className="bg-white p-2 rounded text-sm">
                                    <p className="font-medium">{c.profesionalNombre}</p>
                                    <p className="text-xs text-gray-600">
                                      {c.tipo === 'solapamiento' ? 'Guardias solapadas' : 'Dos guardias el mismo día'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {diaStats.guardias.length === 0 ? (
                            <div className="text-center py-8">
                              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-600">No hay guardias programadas</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {diaStats.guardias.map((guardia, gIdx) => (
                                <Card key={gIdx}>
                                  <CardContent className="p-3">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <p className="font-bold text-sm">{guardia.tipo.toUpperCase()}</p>
                                        <Badge variant="outline">{guardia.estado || 'Activa'}</Badge>
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        <p>
                                          <strong>Profesionales:</strong>{' '}
                                          {guardia.profesional_ids
                                            ?.map(
                                              (id) => profesionales.find((p) => p.id === id)?.nombre_completo || id
                                            )
                                            .join(', ')}
                                        </p>
                                        <p>
                                          <strong>Horario:</strong> {format(new Date(guardia.fecha_inicio), 'HH:mm')} -{' '}
                                          {format(new Date(guardia.fecha_fin), 'HH:mm')}
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-4 border-t space-y-2">
                <p className="text-xs font-bold text-gray-700">Leyenda:</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 bg-blue-50 rounded"></div>
                    <span>Hoy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-red-500 bg-red-50 rounded"></div>
                    <span>Con conflictos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-200 bg-gray-50 rounded"></div>
                    <span>Fin de semana</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewType === 'list' && (
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <CardTitle>Vista en Lista</CardTitle>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar profesional..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant={showConflictsOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowConflictsOnly(!showConflictsOnly)}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Conflictos
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {diasFiltrados.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No se encontraron resultados</p>
                </div>
              ) : (
                diasFiltrados.map((diaStats) => (
                  <Card key={diaStats.fecha}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2">{format(parseISO(diaStats.fecha), 'EEEE, d MMMM', { locale: es })}</h3>
                          <div className="space-y-2">
                            {diaStats.guardias.map((guardia) => (
                              <div key={guardia.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                                <div>
                                  <p className="font-medium">
                                    {guardia.profesional_ids
                                      ?.slice(0, 2)
                                      .map((id) => profesionales.find((p) => p.id === id)?.nombre_completo || id)
                                      .join(', ')}
                                    {guardia.profesional_ids && guardia.profesional_ids.length > 2 && ` +${guardia.profesional_ids.length - 2} más`}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {format(new Date(guardia.fecha_inicio), 'HH:mm')} - {format(new Date(guardia.fecha_fin), 'HH:mm')}
                                  </p>
                                </div>
                                <Badge variant="outline">{guardia.tipo}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                        {diaStats.conflictos.length > 0 && (
                          <AlertTriangle className="w-5 h-5 text-red-600 ml-2 flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
