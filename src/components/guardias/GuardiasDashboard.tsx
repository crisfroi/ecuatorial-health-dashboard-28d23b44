import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Shield, 
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  Building2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Hourglass,
  Coins,
  History,
} from 'lucide-react';
import { useGuardiasStore, Nomina, Guardia, ProfesionalGuardia, CategoriaGuardia, TipoGuardia, TipoDia, EtapaValidacion, EventoAuditoria } from './stores/useGuardiasStore';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Helper function to get days in a month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Helper function to get the starting day of the month (0 = Sunday, 1 = Monday)
const getStartDayOfWeek = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

// Componente para la pestaña de Registro de Guardias
const RegistroGuardias = () => {
  const { profesionales, addGuardia, isSaving, validarHorarios } = useGuardiasStore();
  const [formData, setFormData] = useState({
    profesional_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo: 'fisica' as TipoGuardia,
    tipo_dia: 'ordinario' as TipoDia,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fechaInicio = new Date(formData.fecha_inicio);
    const fechaFin = new Date(formData.fecha_fin);

    if (fechaInicio >= fechaFin) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    if (!validarHorarios(fechaInicio, fechaFin)) {
      toast.error('La duración de la guardia no cumple con las horas mínimas o máximas configuradas.');
      return;
    }

    const horas = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);

    const nuevaGuardia = {
      ...formData,
      fecha_inicio: fechaInicio.toISOString(),
      fecha_fin: fechaFin.toISOString(),
      horas,
      estado: 'borrador' as const,
      validaciones: [],
    };
    
    await addGuardia(nuevaGuardia as Omit<Guardia, 'id' | 'validaciones' | 'estado'>);
    setFormData({
      profesional_id: '',
      fecha_inicio: '',
      fecha_fin: '',
      tipo: 'fisica',
      tipo_dia: 'ordinario',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Nueva Guardia</CardTitle>
        <CardDescription>Completa los detalles para añadir una nueva guardia al sistema.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profesional">Profesional</Label>
            <Select 
              value={formData.profesional_id} 
              onValueChange={handleSelectChange('profesional_id')}
              disabled={isSaving}
            >
              <SelectTrigger id="profesional">
                <SelectValue placeholder="Seleccionar Profesional" />
              </SelectTrigger>
              <SelectContent>
                {profesionales.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_inicio">Fecha y Hora de Inicio</Label>
              <Input 
                id="fecha_inicio" 
                name="fecha_inicio" 
                type="datetime-local" 
                value={formData.fecha_inicio} 
                onChange={handleInputChange} 
                required 
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_fin">Fecha y Hora de Fin</Label>
              <Input 
                id="fecha_fin" 
                name="fecha_fin" 
                type="datetime-local" 
                value={formData.fecha_fin} 
                onChange={handleInputChange} 
                required 
                disabled={isSaving}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Guardia</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={handleSelectChange('tipo')}
                disabled={isSaving}
              >
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Seleccionar Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fisica">Física</SelectItem>
                  <SelectItem value="localizable">Localizable</SelectItem>
                  <SelectItem value="administrativa">Administrativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_dia">Tipo de Día</Label>
              <Select 
                value={formData.tipo_dia} 
                onValueChange={handleSelectChange('tipo_dia')}
                disabled={isSaving}
              >
                <SelectTrigger id="tipo_dia">
                  <SelectValue placeholder="Seleccionar Día" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ordinario">Ordinario</SelectItem>
                  <SelectItem value="fin_semana">Fin de Semana</SelectItem>
                  <SelectItem value="festivo">Festivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Registrar Guardia'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

// Componente para la pestaña de Cuadrantes de Guardias
const CuadrantesGuardias = () => {
  const { guardias, profesionales, fetchGuardias } = useGuardiasStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchGuardias({ mes: currentDate.getMonth() + 1, anio: currentDate.getFullYear() });
  }, [currentDate, fetchGuardias]);

  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1);
      return newDate;
    });
  };

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDayOfWeek(year, month);

  const professionalNameMap = new Map(profesionales.map(p => [p.id, p.nombre_completo]));

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="p-2 border rounded-md min-h-[100px] bg-gray-50 dark:bg-gray-800"></div>);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const day = i;
    const currentDayGuardias = guardias.filter(g => {
      const guardiaDate = new Date(g.fecha_inicio);
      return guardiaDate.getDate() === day && guardiaDate.getMonth() === month && guardiaDate.getFullYear() === year;
    });

    days.push(
      <div key={`day-${day}`} className="p-2 border rounded-md min-h-[100px] overflow-y-auto">
        <div className="font-semibold text-right text-lg mb-2">{day}</div>
        <div className="space-y-1">
          {currentDayGuardias.map(guardia => (
            <div key={guardia.id} className="text-xs p-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <p className="font-semibold">{professionalNameMap.get(guardia.profesional_id) || 'Desconocido'}</p>
              <p>{new Date(guardia.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {guardia.horas}h</p>
              <p>{guardia.tipo}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuadrantes de Guardias</CardTitle>
        <CardDescription>Visualiza y gestiona las guardias en una vista de calendario.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold">{monthNames[month]} {year}</h2>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 text-center font-bold text-sm mb-2">
          {daysOfWeek.map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para la pestaña de Validación de Guardias
const ValidacionGuardias = () => {
  const { guardias, profesionales, validarGuardia } = useGuardiasStore();
  const guardiasPendientes = guardias.filter(g => g.estado === 'borrador');
  const professionalNameMap = new Map(profesionales.map(p => [p.id, p.nombre_completo]));

  const handleValidation = (guardiaId: string, isValid: boolean, etapa: EtapaValidacion) => {
    validarGuardia(guardiaId, isValid, etapa);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validación de Guardias</CardTitle>
        <CardDescription>Revisa y valida las guardias registradas por los profesionales.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {guardiasPendientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <Check className="w-10 h-10 mb-2" />
            <p className="text-lg">¡No hay guardias pendientes de validación!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {guardiasPendientes.map(guardia => (
              <Card key={guardia.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>
                      Guardia de {professionalNameMap.get(guardia.profesional_id) || 'Profesional Desconocido'}
                    </span>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      <Hourglass className="w-3 h-3 mr-1" />
                      Pendiente
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(guardia.fecha_inicio).toLocaleDateString()}
                    <Clock className="w-4 h-4" />
                    {new Date(guardia.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {guardia.horas}h
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-600 hover:text-red-800 hover:bg-red-50"
                    onClick={() => handleValidation(guardia.id, false, 'dir_medica')}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Rechazar
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleValidation(guardia.id, true, 'dir_medica')}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Aprobar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const NominaGuardias = () => {
  const { nominas, profesionales, generarNomina, exportarNominaPDF, exportarNominaExcel, isLoading, isSaving } = useGuardiasStore();
  const [selectedNomina, setSelectedNomina] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  
  const professionalNameMap = new Map(profesionales.map(p => [p.id, p.nombre_completo]));
  const filteredNominas = nominas.filter(n => n.mes === Number(selectedMonth) && n.anio === Number(selectedYear));

  const handleGenerateNomina = () => {
    generarNomina(Number(selectedMonth), Number(selectedYear));
  };

  const handleExportPDF = () => {
    if (selectedNomina) {
      exportarNominaPDF(selectedNomina);
    } else {
      toast.error('Selecciona una nómina para exportar.');
    }
  };

  const handleExportExcel = () => {
    if (selectedNomina) {
      exportarNominaExcel(selectedNomina);
    } else {
      toast.error('Selecciona una nómina para exportar.');
    }
  };
  
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i, 1).toLocaleString('es-ES', { month: 'long' }),
  }));
  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 2 + i));

  return (
    <Card className="flex flex-col space-y-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Nómina de Guardias
        </CardTitle>
        <CardDescription>Genera y gestiona las nóminas basadas en las guardias validadas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row items-end md:items-center gap-4 border-b pb-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mes-nomina">Mes</Label>
              <Select onValueChange={setSelectedMonth} value={selectedMonth} disabled={isSaving}>
                <SelectTrigger id="mes-nomina">
                  <SelectValue placeholder="Seleccionar Mes" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anio-nomina">Año</Label>
              <Select onValueChange={setSelectedYear} value={selectedYear} disabled={isSaving}>
                <SelectTrigger id="anio-nomina">
                  <SelectValue placeholder="Seleccionar Año" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleGenerateNomina} disabled={isSaving || isLoading} className="w-full md:w-auto">
            <Coins className="w-4 h-4 mr-2" />
            {isSaving ? 'Generando...' : 'Generar Nómina'}
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Nóminas Disponibles
            <Badge>{filteredNominas.length}</Badge>
          </h3>
          <div className="flex items-center gap-4">
            <Select onValueChange={setSelectedNomina} value={selectedNomina} disabled={isSaving || filteredNominas.length === 0}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Seleccionar Nómina" />
              </SelectTrigger>
              <SelectContent>
                {filteredNominas.map(nomina => (
                  <SelectItem key={nomina.id} value={nomina.id}>
                    {professionalNameMap.get(nomina.profesional_id) || 'Profesional Desconocido'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleExportPDF} disabled={!selectedNomina}>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={handleExportExcel} disabled={!selectedNomina}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>
        
        {selectedNomina && (
          <NominaDetails nomina={nominas.find(n => n.id === selectedNomina)} professionalNameMap={professionalNameMap} />
        )}
      </CardContent>
    </Card>
  );
};

const PagosGuardias = () => {
  const { nominas, profesionales, pagarNomina, isSaving } = useGuardiasStore();
  const professionalNameMap = new Map(profesionales.map(p => [p.id, p.nombre_completo]));

  const handlePagar = (nominaId: string) => {
    pagarNomina(nominaId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Pagos de Guardias</CardTitle>
        <CardDescription>Revisa el estado de pago de las nóminas y registra los pagos realizados.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {nominas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <CreditCard className="w-10 h-10 mb-2" />
            <p className="text-lg">No hay nóminas para gestionar pagos.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {nominas.map(nomina => (
              <Card key={nomina.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>
                      Nómina de {professionalNameMap.get(nomina.profesional_id) || 'Profesional Desconocido'}
                    </span>
                    <Badge variant={nomina.estado_pago === 'pagada' ? 'default' : 'secondary'} className={nomina.estado_pago === 'pagada' ? 'bg-green-500 text-white' : 'bg-orange-100 text-orange-800'}>
                      {nomina.estado_pago === 'pagada' ? <Check className="w-3 h-3 mr-1" /> : <Hourglass className="w-3 h-3 mr-1" />}
                      {nomina.estado_pago === 'pagada' ? 'Pagada' : 'Pendiente'}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(nomina.fecha_generacion).toLocaleDateString()}
                    <Coins className="w-4 h-4" />
                    {nomina.total_importe.toLocaleString('es-GQ', { style: 'currency', currency: 'XAF' })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-end gap-2">
                  <Button 
                    disabled={nomina.estado_pago === 'pagada' || isSaving}
                    onClick={() => handlePagar(nomina.id)}
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    {isSaving ? 'Procesando...' : 'Marcar como Pagada'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ReportesGuardias = () => {
  const { guardias, baremos, profesionales, calcularImporteGuardia } = useGuardiasStore();

  const horasPorTipo = guardias.reduce((acc, guardia) => {
    acc[guardia.tipo] = (acc[guardia.tipo] || 0) + guardia.horas;
    return acc;
  }, {} as Record<TipoGuardia, number>);

  const horasData = Object.keys(horasPorTipo).map(key => ({
    tipo: key.charAt(0).toUpperCase() + key.slice(1),
    horas: horasPorTipo[key as TipoGuardia]
  }));

  const importesPorCategoria: Record<CategoriaGuardia, number> = {};
  guardias.forEach(guardia => {
    const profesional = profesionales.find(p => p.id === guardia.profesional_id);
    if (profesional) {
      const categoria = profesional.categoria;
      const importe = calcularImporteGuardia(guardia);
      if (importesPorCategoria[categoria] === undefined) {
        importesPorCategoria[categoria] = 0;
      }
      importesPorCategoria[categoria] += importe;
    }
  });

  const importesData = Object.keys(importesPorCategoria).map(key => ({
    categoria: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
    importe: importesPorCategoria[key as CategoriaGuardia]
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reportes de Guardias</CardTitle>
        <CardDescription>Visualiza estadísticas clave y métricas de rendimiento del servicio de guardias.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Horas por Tipo de Guardia</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={horasData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tipo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="horas" fill="#8884d8" name="Total Horas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Importe por Categoría Profesional</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={importesData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="importe" fill="#82ca9d" name="Importe Total (XAF)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Nuevo componente para la pestaña de Auditoría
const AuditoriaGuardias = () => {
  const { auditoria, fetchAuditoria, isLoading } = useGuardiasStore();

  useEffect(() => {
    fetchAuditoria();
  }, [fetchAuditoria]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Auditoría</CardTitle>
        <CardDescription>Consulta un registro cronológico de todas las acciones importantes del sistema.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
            <p>Cargando historial...</p>
          </div>
        ) : auditoria.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <History className="w-10 h-10 mb-2" />
            <p className="text-lg">No hay eventos de auditoría registrados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {auditoria.map(evento => (
              <Card key={evento.id} className="p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">{evento.descripcion}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Acción: <span className="font-medium">{evento.accion.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">
                    <p>Por: <span className="font-medium">{evento.usuario_nombre}</span></p>
                    <p>{new Date(evento.fecha).toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const NominaDetails = ({ nomina, professionalNameMap }: { nomina: Nomina | undefined; professionalNameMap: Map<string, string | undefined> }) => {
  if (!nomina) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles de Nómina: {professionalNameMap.get(nomina.profesional_id) || 'Profesional Desconocido'}</CardTitle>
      </CardHeader>
      <CardContent>
        <p><strong>Periodo:</strong> {nomina.mes}/{nomina.anio}</p>
        <p><strong>Fecha de Generación:</strong> {new Date(nomina.fecha_generacion).toLocaleDateString()}</p>
        <p><strong>Total Importe:</strong> {nomina.total_importe.toLocaleString('es-GQ', { style: 'currency', currency: 'XAF' })}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 mt-4 gap-4 text-sm">
          <p><strong>Horas Físicas:</strong> {nomina.total_horas_fisicas}h</p>
          <p><strong>Horas Localizables:</strong> {nomina.total_horas_localizables}h</p>
          <p><strong>Horas Administrativas:</strong> {nomina.total_horas_administrativas}h</p>
        </div>
        <h4 className="font-semibold mt-4 text-lg">Guardias Incluidas:</h4>
        <div className="space-y-2 mt-2">
          {nomina.guardias.map(guardia => (
            <div key={guardia.id} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-3 h-3" />
                {new Date(guardia.fecha_inicio).toLocaleDateString()}
                <Clock className="w-3 h-3" />
                {new Date(guardia.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {guardia.horas}h
              </div>
              <p className="mt-1 text-sm">Tipo: <span className="font-semibold">{guardia.tipo}</span></p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Define las pestañas disponibles para la navegación
const availableTabs = [
  { id: 'registro', label: 'Registro', icon: Plus, component: RegistroGuardias, description: 'Registro de nuevas guardias' },
  { id: 'cuadrantes', label: 'Cuadrantes', icon: Calendar, component: CuadrantesGuardias, description: 'Visualización de cuadrantes de guardias' },
  { id: 'validacion', label: 'Validación', icon: Shield, component: ValidacionGuardias, description: 'Validación de guardias para nómina' },
  { id: 'nomina', label: 'Nómina', icon: CreditCard, component: NominaGuardias, description: 'Generación y gestión de nóminas' },
  { id: 'pagos', label: 'Pagos', icon: FileText, component: PagosGuardias, description: 'Control de pagos de guardias' },
  { id: 'reportes', label: 'Reportes', icon: BarChart3, component: ReportesGuardias, description: 'Generación de informes' },
  { id: 'auditoria', label: 'Auditoría', icon: History, component: AuditoriaGuardias, description: 'Historial de cambios y auditoría' },
  { id: 'ajustes', label: 'Ajustes', icon: Settings, component: AjustesGuardias, description: 'Configuración del sistema' },
];

export const GuardiasDashboard = () => {
  const [activeTab, setActiveTab] = useState('auditoria'); // Iniciar en la pestaña de auditoría
  const { isLoading, error, fetchGuardias, fetchNominas, fetchProfesionales, fetchBaremos, fetchPagos, fetchAuditoria } = useGuardiasStore();

  // Cargar todos los datos al iniciar
  useEffect(() => {
    fetchProfesionales();
    fetchBaremos();
    fetchGuardias();
    fetchNominas();
    fetchPagos();
    fetchAuditoria();
  }, [fetchProfesionales, fetchBaremos, fetchGuardias, fetchNominas, fetchPagos, fetchAuditoria]);

  // Mostrar errores en toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Guardias</h1>
          <Badge variant="secondary">v1.0</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Buscar..." className="w-40 sm:w-64" />
          <Button variant="outline">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-1.5 px-3 py-2"
                title={tab.description}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline text-xs font-medium">
                  {tab.label}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Contenido de las pestañas */}
        {availableTabs.map((tab) => {
          const Component = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              <Component />
            </TabsContent>
          );
        })}
      </Tabs>

      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Cargando datos de guardias...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
