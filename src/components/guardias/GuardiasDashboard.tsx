import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
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
  Building2
} from 'lucide-react';
import { useGuardiasStore, Nomina, Guardia, ProfesionalGuardia, CategoriaGuardia, TipoGuardia, TipoDia } from './stores/useGuardiasStore';
import { toast } from 'sonner';

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
    toast.success('Guardia registrada con éxito.');
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

const CuadrantesGuardias = () => <div>Componente de Cuadrantes de Guardias (simulado)</div>;
const ValidacionGuardias = () => <div>Componente de Validación de Guardias (simulado)</div>;
const NominaGuardias = () => {
  const { nominas, fetchNominas, exportarNominaPDF, exportarNominaExcel } = useGuardiasStore();
  const [selectedNomina, setSelectedNomina] = useState<string>('');

  useEffect(() => {
    fetchNominas({ mes: 8, anio: 2025 }); // Ejemplo: Cargar nóminas de un mes específico
  }, [fetchNominas]);

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
  
  return (
    <Card className="flex flex-col space-y-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Nómina de Guardias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Select onValueChange={setSelectedNomina} value={selectedNomina}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar Nómina" />
            </SelectTrigger>
            <SelectContent>
              {nominas.map(nomina => (
                <SelectItem key={nomina.id} value={nomina.id}>
                  Nómina {nomina.mes}/{nomina.anio} - {nomina.profesional_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={handleExportExcel}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
        
        {selectedNomina && (
          <NominaDetails nomina={nominas.find(n => n.id === selectedNomina)} />
        )}
      </CardContent>
    </Card>
  );
};
const PagosGuardias = () => <div>Componente de Pagos de Guardias (simulado)</div>;
const ReportesGuardias = () => <div>Componente de Reportes de Guardias (simulado)</div>;
const AuditoriaGuardias = () => <div>Componente de Auditoría de Guardias (simulado)</div>;
const AjustesGuardias = () => <div>Componente de Ajustes de Guardias (simulado)</div>;

const NominaDetails = ({ nomina }: { nomina: Nomina | undefined }) => {
  if (!nomina) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles de Nómina</CardTitle>
      </CardHeader>
      <CardContent>
        <p><strong>Total Importe:</strong> €{nomina.total_importe.toFixed(2)}</p>
        <p><strong>Total Horas Físicas:</strong> {nomina.total_horas_fisicas}</p>
        <p><strong>Total Horas Localizables:</strong> {nomina.total_horas_localizables}</p>
        <p><strong>Total Horas Administrativas:</strong> {nomina.total_horas_administrativas}</p>
        <h4 className="font-semibold mt-4">Guardias Incluidas:</h4>
        <ul className="list-disc list-inside">
          {nomina.guardias.map(guardia => (
            <li key={guardia.id}>
              {new Date(guardia.fecha_inicio).toLocaleDateString()} - {guardia.horas}h ({guardia.tipo})
            </li>
          ))}
        </ul>
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
  { id: 'auditoria', label: 'Auditoría', icon: Users, component: AuditoriaGuardias, description: 'Historial de cambios y auditoría' },
  { id: 'ajustes', label: 'Ajustes', icon: Settings, component: AjustesGuardias, description: 'Configuración del sistema' },
];

export const GuardiasDashboard = () => {
  const [activeTab, setActiveTab] = useState('registro'); // Iniciar en la pestaña de registro para que se vea el formulario.
  const { isLoading, error, fetchGuardias, fetchNominas, fetchProfesionales, fetchBaremos } = useGuardiasStore();

  // Cargar todos los datos al iniciar
  useEffect(() => {
    fetchProfesionales();
    fetchBaremos();
    fetchGuardias();
    fetchNominas();
  }, [fetchProfesionales, fetchBaremos, fetchGuardias, fetchNominas]);

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

      {/* Estado de carga */}
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
