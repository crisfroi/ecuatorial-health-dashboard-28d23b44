import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar,
  Clock,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Shield,
  Settings,
  AlertTriangle,
  Plus,
  Download,
  RefreshCw
} from 'lucide-react';

import { useGuardiasStore } from '@/stores/useGuardiasStore';
import { formatearMoneda, formatearCategoriaProfesional } from '@/utils/guardiasUtils';

// Importar componentes de las pestañas (los crearemos después)
import RegistroGuardias from './guardias/RegistroGuardias';
import CuadrantesGuardias from './guardias/CuadrantesGuardias';
import ValidacionGuardias from './guardias/ValidacionGuardias';
import NominaGuardias from './guardias/NominaGuardias';
import PagosGuardias from './guardias/PagosGuardias';
import ReportesGuardias from './guardias/ReportesGuardias';
import AuditoriaGuardias from './guardias/AuditoriaGuardias';
import AjustesGuardias from './guardias/AjustesGuardias';

const GuardiasDashboard: React.FC = () => {
  const {
    selectedMes,
    selectedAnio,
    selectedHospital,
    setSelectedMes,
    setSelectedAnio,
    setSelectedHospital,
    getEstadisticas,
    configuracion,
    loading,
    error
  } = useGuardiasStore();

  const [activeTab, setActiveTab] = useState('registro');
  const estadisticas = getEstadisticas();

  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  const años = Array.from({ length: 7 }, (_, i) => 2024 + i);

  const hospitales = [
    { id: 'hospital_1', nombre: 'Hospital Nacional de Malabo' },
    { id: 'hospital_2', nombre: 'Hospital Regional de Bata' },
    { id: 'hospital_3', nombre: 'Hospital de Ebebiyín' },
    { id: 'hospital_4', nombre: 'Hospital de Mongomo' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              Gestión de Guardias Médicas
            </h1>
            <p className="text-gray-600 mt-1">
              Sistema integrado de planificación, validación y pago de guardias hospitalarias
            </p>
          </div>

          {/* Controles de periodo y hospital */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedMes.toString()} onValueChange={(value) => setSelectedMes(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                {meses.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value.toString()}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAnio.toString()} onValueChange={(value) => setSelectedAnio(parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {años.map((año) => (
                  <SelectItem key={año} value={año.toString()}>
                    {año}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedHospital} onValueChange={setSelectedHospital}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Hospital" />
              </SelectTrigger>
              <SelectContent>
                {hospitales.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Indicador de fuente de baremo */}
        {configuracion.fuenteBaremo !== 'protocol' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Usando baremos desde: {configuracion.fuenteBaremo === 'excel' ? 'Hoja Excel' : 'Configuración Manual'}
              </span>
            </div>
          </div>
        )}

        {/* Cards de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Guardias</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.totalGuardias}</div>
              <p className="text-xs text-muted-foreground">
                {meses.find(m => m.value === selectedMes)?.label} {selectedAnio}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Guardias Validadas</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{estadisticas.guardiasValidas}</div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.totalGuardias > 0 
                  ? `${Math.round((estadisticas.guardiasValidas / estadisticas.totalGuardias) * 100)}% del total`
                  : 'Sin guardias registradas'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes Validación</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{estadisticas.guardiasPendientes}</div>
              <p className="text-xs text-muted-foreground">
                Requieren aprobación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatearMoneda(estadisticas.costoTotal)}
              </div>
              <p className="text-xs text-muted-foreground">
                Según baremos actuales
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Error:</span>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8 lg:grid-cols-8">
          <TabsTrigger value="registro" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Registro</span>
          </TabsTrigger>
          <TabsTrigger value="cuadrantes" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Cuadrantes</span>
          </TabsTrigger>
          <TabsTrigger value="validacion" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Validación</span>
          </TabsTrigger>
          <TabsTrigger value="nomina" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Nómina</span>
          </TabsTrigger>
          <TabsTrigger value="pagos" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Pagos</span>
          </TabsTrigger>
          <TabsTrigger value="reportes" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Reportes</span>
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Auditoría</span>
          </TabsTrigger>
          <TabsTrigger value="ajustes" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Ajustes</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <div className={`${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          <TabsContent value="registro" className="space-y-6">
            <RegistroGuardias />
          </TabsContent>

          <TabsContent value="cuadrantes" className="space-y-6">
            <CuadrantesGuardias />
          </TabsContent>

          <TabsContent value="validacion" className="space-y-6">
            <ValidacionGuardias />
          </TabsContent>

          <TabsContent value="nomina" className="space-y-6">
            <NominaGuardias />
          </TabsContent>

          <TabsContent value="pagos" className="space-y-6">
            <PagosGuardias />
          </TabsContent>

          <TabsContent value="reportes" className="space-y-6">
            <ReportesGuardias />
          </TabsContent>

          <TabsContent value="auditoria" className="space-y-6">
            <AuditoriaGuardias />
          </TabsContent>

          <TabsContent value="ajustes" className="space-y-6">
            <AjustesGuardias />
          </TabsContent>
        </div>
      </Tabs>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span>Cargando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardiasDashboard;
