import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Users,
  FileText,
  Settings,
  TrendingUp,
  Calendar,
  MapPin,
  Activity,
  MessageSquare,
  Gavel,
  UserCog,
  Building2,
  Clock,
  ArrowRight,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react';
import { DashboardNavigation, TabConfig } from './DashboardNavigation';
import { AdvancedSearchPanel, FilterGroup } from './AdvancedSearchPanel';
import { FormFieldWithValidation } from '@/components/forms/FormFieldWithValidation';

// Tabs disponibles con metadatos
const AVAILABLE_TABS: TabConfig[] = [
  {
    id: 'overview',
    label: 'Inicio',
    icon: BarChart3,
    group: 'core',
    description: 'Panel principal con estadísticas generales',
  },
  {
    id: 'professionals',
    label: 'Profesionales',
    icon: Users,
    group: 'core',
    badge: '245',
    description: 'Gestión de profesionales sanitarios',
  },
  {
    id: 'requests',
    label: 'Solicitudes',
    icon: FileText,
    group: 'core',
    badge: '12',
    description: 'Solicitudes de renovación y acreditación',
  },
  {
    id: 'renewals',
    label: 'Renovaciones',
    icon: TrendingUp,
    group: 'core',
    badge: '5',
    description: 'Seguimiento de renovaciones',
  },
  {
    id: 'guardias',
    label: 'Guardias',
    icon: Calendar,
    group: 'guardias',
    badge: '8',
    description: 'Gestión de guardias y cuadrantes',
  },
  {
    id: 'asistencia',
    label: 'Asistencia',
    icon: Clock,
    group: 'asistencia',
    description: 'Control de asistencia biométrica',
  },
  {
    id: 'analytics',
    label: 'Analíticas',
    icon: TrendingUp,
    group: 'core',
    description: 'Reportes y análisis avanzados',
  },
  {
    id: 'incidents',
    label: 'Incidencias',
    icon: AlertTriangle,
    group: 'otros',
    badge: '3',
    description: 'Gestión de incidencias',
  },
  {
    id: 'health-centers',
    label: 'Centros de Salud',
    icon: MapPin,
    group: 'otros',
    description: 'Gestión de centros',
  },
  {
    id: 'admin',
    label: 'Administración',
    icon: Settings,
    group: 'admin',
    description: 'Configuración del sistema',
  },
];

// Grupos de filtros para búsqueda avanzada
const SEARCH_FILTER_GROUPS: FilterGroup[] = [
  {
    id: 'personal',
    label: 'Información Personal',
    filters: [
      {
        id: 'nombre',
        label: 'Nombre',
        type: 'text',
        placeholder: 'Buscar por nombre...',
      },
      {
        id: 'cedula',
        label: 'Cédula de Identidad',
        type: 'text',
        placeholder: 'Ej: 001-000001-0001A',
      },
      {
        id: 'genero',
        label: 'Género',
        type: 'select',
        options: [
          { value: 'masculino', label: 'Masculino' },
          { value: 'femenino', label: 'Femenino' },
        ],
      },
    ],
  },
  {
    id: 'profesional',
    label: 'Información Profesional',
    filters: [
      {
        id: 'especialidad',
        label: 'Especialidad',
        type: 'multiselect',
        options: [
          { value: 'medicina_general', label: 'Medicina General' },
          { value: 'pediatria', label: 'Pediatría' },
          { value: 'cardiologia', label: 'Cardiología' },
          { value: 'psicologia', label: 'Psicología' },
          { value: 'enfermeria', label: 'Enfermería' },
        ],
      },
      {
        id: 'estado_carnet',
        label: 'Estado del Carnet',
        type: 'select',
        options: [
          { value: 'activo', label: 'Activo' },
          { value: 'vencido', label: 'Vencido' },
          { value: 'renovacion', label: 'En renovación' },
          { value: 'suspendido', label: 'Suspendido' },
        ],
      },
    ],
  },
  {
    id: 'ubicacion',
    label: 'Ubicación y Centro',
    filters: [
      {
        id: 'provincia',
        label: 'Provincia',
        type: 'select',
        options: [
          { value: 'bioko_norte', label: 'Bioko Norte' },
          { value: 'bioko_sur', label: 'Bioko Sur' },
          { value: 'littoral', label: 'Litoral' },
          { value: 'centro_sur', label: 'Centro Sur' },
          { value: 'kye_ostem', label: 'Kye-Ostem' },
        ],
      },
      {
        id: 'centro',
        label: 'Centro de Salud',
        type: 'select',
        options: [
          { value: 'centro_1', label: 'Centro de Salud #1' },
          { value: 'centro_2', label: 'Centro de Salud #2' },
          { value: 'centro_3', label: 'Centro de Salud #3' },
        ],
      },
    ],
  },
  {
    id: 'fechas',
    label: 'Fechas y Períodos',
    filters: [
      {
        id: 'fecha_desde',
        label: 'Desde',
        type: 'date',
      },
      {
        id: 'fecha_hasta',
        label: 'Hasta',
        type: 'date',
      },
      {
        id: 'vencimiento_proximo',
        label: 'Días para vencimiento',
        type: 'range',
        min: 0,
        max: 365,
        step: 30,
      },
    ],
  },
];

interface ImprovedDashboardLayoutProps {
  onTabChange?: (tabId: string) => void;
  onSearch?: (query: string, filters: Record<string, any>) => void;
}

export const ImprovedDashboardLayout: React.FC<ImprovedDashboardLayoutProps> = ({
  onTabChange,
  onSearch,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showFormExample, setShowFormExample] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
  });

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query, filters);
  };

  const handleFiltersChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    onSearch?.(searchQuery, newFilters);
  };

  return (
    <div className="space-y-6">
      {/* Sección 1: Navegación Mejorada */}
      <Card>
        <CardHeader>
          <CardTitle>Navegación del Dashboard</CardTitle>
          <CardDescription>
            Organización mejorada con grupos de tabs y búsqueda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardNavigation
            tabs={AVAILABLE_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </CardContent>
      </Card>

      {/* Sección 2: Búsqueda Avanzada */}
      <AdvancedSearchPanel
        searchPlaceholder="Buscar profesionales por nombre, cédula, especialidad..."
        filterGroups={SEARCH_FILTER_GROUPS}
        onSearchChange={handleSearch}
        onFiltersChange={handleFiltersChange}
        minimalMode={false}
        showActiveFiltersCount={true}
      />

      {/* Sección 3: Ejemplo de Validación de Formularios */}
      <Card>
        <CardHeader>
          <CardTitle>Validación Mejorada de Formularios</CardTitle>
          <CardDescription>
            Campos con validación en tiempo real y feedback visual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormFieldWithValidation
            name="nombre"
            label="Nombre Completo"
            type="text"
            value={formData.nombre}
            onChange={(value) => setFormData({ ...formData, nombre: value })}
            placeholder="Juan Pérez García"
            required={true}
            helpText="Ingresa tu nombre completo como aparece en tu cédula"
            validationRules={[
              { type: 'required', message: 'El nombre es requerido' },
              {
                type: 'minLength',
                value: 5,
                message: 'El nombre debe tener al menos 5 caracteres',
              },
              {
                type: 'maxLength',
                value: 100,
                message: 'El nombre no puede exceder 100 caracteres',
              },
            ]}
            showValidationIcon={true}
          />

          <FormFieldWithValidation
            name="email"
            label="Correo Electrónico"
            type="email"
            value={formData.email}
            onChange={(value) => setFormData({ ...formData, email: value })}
            placeholder="juan@ejemplo.com"
            required={true}
            helpText="Usaremos este email para contactarte"
            validationRules={[
              { type: 'required', message: 'El email es requerido' },
              { type: 'email', message: 'Ingresa un email válido' },
            ]}
            showValidationIcon={true}
          />

          <FormFieldWithValidation
            name="telefono"
            label="Teléfono"
            type="text"
            value={formData.telefono}
            onChange={(value) => setFormData({ ...formData, telefono: value })}
            placeholder="+240 XXX XXX XXX"
            required={false}
            helpText="Formato: +240 ABC DEF GHI"
            validationRules={[
              {
                type: 'pattern',
                value: '^\\+?[0-9\\s\\-()]{10,}$',
                message: 'Ingresa un teléfono válido',
              },
            ]}
            showValidationIcon={true}
          />
        </CardContent>
      </Card>

      {/* Sección 4: Información sobre Mejoras */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">✨ Mejoras Implementadas</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900 space-y-3">
          <div>
            <h4 className="font-semibold mb-2">🎯 Navegación Mejorada (DashboardNavigation)</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Organización de tabs en grupos (Profesionales, Guardias, Asistencia, Admin)</li>
              <li>Vista compacta (solo iconos) y expandida (con etiquetas)</li>
              <li>Búsqueda dentro de las tabs</li>
              <li>Breadcrumbs mostrando ubicación actual</li>
              <li>Badges con notificaciones de items pendientes</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">📝 Validación de Formularios (FormFieldWithValidation)</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Validación en tiempo real mientras escribes</li>
              <li>Iconos de estado: ✓ (válido), ✗ (error), ⏳ (validando)</li>
              <li>Mensajes de error/éxito contextualizados</li>
              <li>Soporte para múltiples tipos de campos</li>
              <li>Regex patterns para validaciones complejas</li>
              <li>Help text y descripciones de campos</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">🔍 Búsqueda Avanzada (AdvancedSearchPanel)</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Búsqueda por texto + múltiples filtros simultáneos</li>
              <li>Grupos de filtros colapsables</li>
              <li>Tipos: text, select, multiselect, date, range</li>
              <li>Contador de filtros activos</li>
              <li>Botón "Limpiar todo"</li>
              <li>Modo minimal (expandible) o expandido permanente</li>
              <li>Resumen visual de filtros aplicados</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
