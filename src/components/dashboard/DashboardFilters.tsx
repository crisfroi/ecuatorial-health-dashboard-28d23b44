import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Filter, X, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PROVINCIAS_EG } from '@/utils/geo';
// IMPORTS ADICIONALES PARA EL MULTI-SELECT
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// =========================================================================
// INTERFAZ FILTROS (Múltiples campos ahora aceptan arrays para multi-select)
// =========================================================================
interface Filtros {
  area_profesional?: string[]; // Array (compat por nombre)
  area_profesional_id?: string[]; // Array (nuevo por FK)
  estado_solicitud?: string[]; // Array
  provincia?: string[]; // Array
  genero?: string[]; // Array
  tipo_sector?: string[]; // Array
  funcion_publica?: boolean; // Booleano (Select simple)
  estatus_funcionario?: 'nombrado' | 'no_nombrado'; // String (Select simple)
  distrito?: string[]; // Array
  distrito_sanitario?: string[]; // Array
  centro_id?: string; // String (Select simple)
  centro_nombre?: string;
  edad_minima?: number;
  edad_maxima?: number;
  año_graduacion?: number[]; // Array de Números
  pais_formacion?: string[]; // Array
  institucion_formacion?: string[]; // Array
  edad_laboral_min?: number;
  edad_laboral_max?: number;
  años_servicio_min?: number;
  años_servicio_max?: number;
  años_restantes_jubilacion_min?: number;
  años_restantes_jubilacion_max?: number;
  situacion_laboral?: string[];
}

interface DashboardFiltersProps {
  filters: Filtros;
  onFiltersChange: (filters: Filtros) => void;
  onClearFilters: () => void;
}


// =========================================================================
// COMPONENTE DropdownMultiSelect
// =========================================================================
interface SelectOption {
  value: string;
  label: string;
}

interface DropdownMultiSelectProps {
  placeholder: string;
  options: SelectOption[];
  value: string[];
  onValueChange: (values: string[]) => void;
}

const DropdownMultiSelect = ({ placeholder, options, value, onValueChange }: DropdownMultiSelectProps) => {
  const selectedCount = value.length;

  // Función para manejar la selección de un ítem
  const handleToggle = (itemValue: string, isChecked: boolean) => {
    if (isChecked) {
      onValueChange([...value, itemValue]);
    } else {
      onValueChange(value.filter(v => v !== itemValue));
    }
  };

  // Texto que se muestra en el botón principal del Dropdown
  const triggerText = selectedCount === 0
    ? placeholder
    : selectedCount === options.length
      ? `Todos (${selectedCount})`
      : `${selectedCount} seleccionado${selectedCount > 1 ? 's' : ''}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between overflow-hidden"
        >
          <span className="truncate">{triggerText}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-72 overflow-y-auto p-0 z-50">
        {/* Opciones rápidas: Seleccionar todo/Limpiar */}
        <div className="sticky top-0 bg-white p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onValueChange(options.map(o => o.value))}
            className="w-full justify-start h-8 text-xs font-normal"
          >
            Seleccionar Todo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onValueChange([])}
            className="w-full justify-start h-8 text-xs font-normal"
          >
            Limpiar Selección
          </Button>
        </div>
        <DropdownMenuSeparator />
        {/* Lista de opciones con Checkbox */}
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="p-0 cursor-pointer"
            // Evita que el menú se cierre al hacer click en el item
            onSelect={(e) => e.preventDefault()}
          >
            <div
              className="flex items-center space-x-2 p-2 w-full hover:bg-gray-100"
              onClick={() => handleToggle(option.value, !value.includes(option.value))}
            >
              <Checkbox
                id={`multiselect-${option.value}`}
                checked={value.includes(option.value)}
                // onCheckedChange se usa para manejar clics directos en el checkbox
                onCheckedChange={(checked) => handleToggle(option.value, checked as boolean)}
              />
              <label
                htmlFor={`multiselect-${option.value}`}
                className="text-sm font-medium leading-none flex-1 truncate"
              >
                {option.label}
              </label>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
// =========================================================================


const DashboardFilters = ({ filters, onFiltersChange, onClearFilters }: DashboardFiltersProps) => {
  const [areas, setAreas] = useState<{ id: string; nombre: string }[]>([]);
  const [estados, setEstados] = useState<string[]>([]);
  const [provincias, setProvincias] = useState<string[]>([]);
  const [situaciones, setSituaciones] = useState<string[]>([]);
  const [distritosSanitarios, setDistritosSanitarios] = useState<string[]>([]);
  const [generos, setGeneros] = useState<string[]>([]);
  const [sectores, setSectores] = useState<string[]>([]);
  const [distritos, setDistritos] = useState<string[]>([]);
  const [anios, setAnios] = useState<number[]>([]);
  const [centros, setCentros] = useState<{ id: string; nombre: string }[]>([]);
  const [paises, setPaises] = useState<string[]>([]);
  const [instituciones, setInstituciones] = useState<string[]>([]);

  // FUNCIÓN PARA MANEJAR LOS FILTROS DE SELECCIÓN MÚLTIPLE (Arrays)
  const handleMultiSelectChange = (key: keyof Filtros, values: (string | number)[]) => {
    // Si el array está vacío, se pone undefined para limpiar el filtro.
    const normalizedValue = values.length === 0 ? undefined : values;

    let finalValue: any = normalizedValue;
    // Conversión específica para el campo 'año_graduacion' de string[] a number[]
    if (key === 'año_graduacion' && Array.isArray(normalizedValue)) {
      finalValue = normalizedValue.map(v => Number(v)).filter(n => !Number.isNaN(n));
    }

    onFiltersChange({
      ...filters,
      [key]: finalValue
    });
  };

  // FUNCIÓN PARA MANEJAR LOS FILTROS DE SELECCIÓN SIMPLE
  const updateFilter = (key: keyof Filtros, value: string | number | undefined) => {
    let normalized: any = value;
    if (key === 'funcion_publica' && typeof value === 'string') {
      if (value === 'true') normalized = true;
      else if (value === 'false') normalized = false;
      else normalized = undefined;
    }
    onFiltersChange({
      ...filters,
      [key]: normalized === 'todos' ? undefined : normalized
    });
  };

  // ... (useEffect para la carga de datos se mantiene sin cambios) ...
  useEffect(() => {
    const fetchDistinct = async () => {
      const cols = [
        'area_profesional', 'estado_solicitud', 'situacion_laboral', 'provincia', 'distrito_sanitario',
        'genero', 'tipo_sector', 'distrito', 'año_graduacion'
      ] as const;

      const results = await Promise.all(cols.map(async (col) => {
        const { data, error } = await supabase
          .from('profesionales_sanitarios')
          .select(col)
          .not(col as any, 'is', null)
          .limit(10000);
        if (error) {
          console.warn('Distinct fetch error for', col, error);
          return { col, values: [] as string[] } as const;
        }
        const values = Array.from(new Set((data || []).map((r: any) => String(r[col]).trim()).filter(Boolean))).sort();
        return { col, values } as const;
      }));

      results.forEach(({ col, values }) => {
        if (col === 'estado_solicitud') setEstados(values);
        if (col === 'provincia') setProvincias(Array.from(new Set([...(PROVINCIAS_EG as string[]), ...values])).sort()); // Asegura el orden y la fusión
        if (col === 'situacion_laboral') setSituaciones(values);
        if (col === 'distrito_sanitario') setDistritosSanitarios(values);
        if (col === 'genero') setGeneros(values);
        if (col === 'tipo_sector') setSectores(values);
        if (col === 'distrito') setDistritos(values);
        if (col === 'año_graduacion') setAnios((values as string[]).map(v => Number(v)).filter(n => !Number.isNaN(n)).sort((a, b) => a - b));
      });

      // Cargar áreas desde la tabla de referencia
      const { data: areasData, error: areasError } = await supabase
        .from('areas_profesionales')
        .select('id, nombre')
        .order('nombre');
      if (!areasError && areasData) {
        setAreas(areasData as any);
      }

      const { data: centrosData, error: centrosError } = await supabase
        .from('centros_salud')
        .select('id, nombre')
        .order('nombre');
      if (!centrosError && centrosData) {
        setCentros(centrosData as any);
      }

      // Fetch países de formación
      const { data: paisesData } = await supabase
        .from('profesionales_sanitarios')
        .select('pais_formacion_1, pais_formacion_2')
        .not('pais_formacion_1', 'is', null);
      if (paisesData) {
        const paisesSet = new Set<string>();
        paisesData.forEach((p: any) => {
          if (p.pais_formacion_1) paisesSet.add(p.pais_formacion_1);
          if (p.pais_formacion_2) paisesSet.add(p.pais_formacion_2);
        });
        setPaises(Array.from(paisesSet).sort());
      }

      // Fetch instituciones de formación directamente de profesionales
      const { data: institucionesProfs } = await supabase
        .from('profesionales_sanitarios')
        .select('institucion_1, institucion_2')
        .not('institucion_1', 'is', null);
      if (institucionesProfs) {
        const instSet = new Set<string>();
        institucionesProfs.forEach((p: any) => {
          if (p.institucion_1) instSet.add(p.institucion_1);
          if (p.institucion_2) instSet.add(p.institucion_2);
        });
        setInstituciones(Array.from(instSet).sort());
      }
    };
    fetchDistinct();
  }, []);


  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros de Búsqueda</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Limpiar</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">

          {/* ------------------ ÁREA PROFESIONAL (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Área Profesional</label>
            <DropdownMultiSelect
              placeholder="Todas las áreas"
              options={areas.map(a => ({ value: a.id, label: a.nombre }))}
              value={filters.area_profesional_id || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('area_profesional_id' as any, value)}
            />
          </div>

          {/* ------------------ FUNCIÓN PÚBLICA (SINGLE SELECT) - APLICADO STRCIT CHECK ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Función Pública</label>
            <Select
              value={!Array.isArray(filters.funcion_publica) && typeof filters.funcion_publica === 'boolean' ? String(filters.funcion_publica) : 'todos'}
              onValueChange={(value) => updateFilter('funcion_publica' as any, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="true">Sí</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ------------------ ESTATUS FUNCIONARIO (SINGLE SELECT) - APLICADO STRCIT CHECK ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Estatus de Funcionario</label>
            <Select
              value={!Array.isArray(filters.estatus_funcionario) && typeof filters.estatus_funcionario === 'string' ? filters.estatus_funcionario : 'todos'}
              onValueChange={(value) => updateFilter('estatus_funcionario' as any, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="nombrado">Nombrados</SelectItem>
                <SelectItem value="no_nombrado">No nombrados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ------------------ ESTADO DE SOLICITUD (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Estado de Solicitud</label>
            <DropdownMultiSelect
              placeholder="Todos los estados"
              options={estados.map(v => ({ value: v, label: v }))}
              value={filters.estado_solicitud || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('estado_solicitud', value)}
            />
          </div>

          {/* ------------------ SITUACIÓN LABORAL (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Situación laboral</label>
            <DropdownMultiSelect
              placeholder="Todas"
              options={situaciones.map(v => ({ value: v, label: v }))}
              value={filters.situacion_laboral || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('situacion_laboral' as any, value)}
            />
          </div>

          {/* ------------------ PROVINCIA (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Provincia</label>
            <DropdownMultiSelect
              placeholder="Todas las provincias"
              options={provincias.map(v => ({ value: v, label: v }))}
              value={filters.provincia || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('provincia', value)}
            />
          </div>

          {/* ------------------ DISTRITO SANITARIO (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Distrito Sanitario</label>
            <DropdownMultiSelect
              placeholder="Todos los distritos"
              options={distritosSanitarios.map(v => ({ value: v, label: v }))}
              value={filters.distrito_sanitario || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('distrito_sanitario', value)}
            />
          </div>

          {/* ------------------ CENTRO (SINGLE SELECT) - APLICADO STRCIT CHECK ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Centro</label>
            <Select
              value={!Array.isArray(filters.centro_id) && typeof filters.centro_id === 'string' ? filters.centro_id : 'todos'}
              onValueChange={(value) => {
                const selected = centros.find(c => c.id === value);
                onFiltersChange({
                  ...filters,
                  centro_id: value === 'todos' ? undefined : value,
                  centro_nombre: selected ? selected.nombre : undefined,
                });
              }}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los centros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los centros</SelectItem>
                {centros.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ------------------ GÉNERO (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Género</label>
            <DropdownMultiSelect
              placeholder="Todos los géneros"
              options={generos.map(v => ({ value: v, label: v }))}
              value={filters.genero || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('genero', value)}
            />
          </div>

          {/* ------------------ TIPO DE SECTOR (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tipo de Sector</label>
            <DropdownMultiSelect
              placeholder="Todos los sectores"
              options={sectores.map(v => ({ value: v, label: v }))}
              value={filters.tipo_sector || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('tipo_sector', value)}
            />
          </div>

          {/* ------------------ DISTRITO (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Distrito</label>
            <DropdownMultiSelect
              placeholder="Todos los distritos"
              options={distritos.map(v => ({ value: v, label: v }))}
              value={filters.distrito || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('distrito', value)}
            />
          </div>

          {/* ------------------ PAÍS DE FORMACIÓN (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">País de Formación</label>
            <DropdownMultiSelect
              placeholder="Todos los países"
              options={paises.map(v => ({ value: v, label: v }))}
              value={filters.pais_formacion || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('pais_formacion', value)}
            />
          </div>

          {/* ------------------ CENTRO DE FORMACIÓN (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Centro de Formación</label>
            <DropdownMultiSelect
              placeholder="Todas las instituciones"
              options={instituciones.map(v => ({ value: v, label: v }))}
              value={filters.institucion_formacion || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('institucion_formacion', value)}
            />
          </div>

          {/* ------------------ AÑO DE GRADUACIÓN (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Año de Graduación</label>
            <DropdownMultiSelect
              placeholder="Todos los años"
              options={anios.map(v => ({ value: String(v), label: String(v) }))}
              // filters.año_graduacion es number[], se convierte a string[] para el componente
              value={filters.año_graduacion ? filters.año_graduacion.map(String) : []}
              // Se usa handleMultiSelectChange que lo convierte de vuelta a number[]
              onValueChange={(value: string[]) => handleMultiSelectChange('año_graduacion', value)}
            />
          </div>

          {/* ------------------ FILTROS NUMÉRICOS (INPUTS) - SIN CAMBIOS ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Edad</label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Mín" value={filters.edad_minima ?? ''} onChange={(e) => updateFilter('edad_minima', e.target.value ? Number(e.target.value) : undefined)} />
              <Input type="number" placeholder="Máx" value={filters.edad_maxima ?? ''} onChange={(e) => updateFilter('edad_maxima', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Edad laboral (años)</label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Mín" value={filters.edad_laboral_min ?? ''} onChange={(e) => updateFilter('edad_laboral_min' as any, e.target.value ? Number(e.target.value) : undefined)} />
              <Input type="number" placeholder="Máx" value={filters.edad_laboral_max ?? ''} onChange={(e) => updateFilter('edad_laboral_max' as any, e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Años de servicio</label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Mín" value={filters.años_servicio_min ?? ''} onChange={(e) => updateFilter('años_servicio_min' as any, e.target.value ? Number(e.target.value) : undefined)} />
              <Input type="number" placeholder="Máx" value={filters.años_servicio_max ?? ''} onChange={(e) => updateFilter('años_servicio_max' as any, e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Años restantes hasta jubilación</label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Mín" value={filters.años_restantes_jubilacion_min ?? ''} onChange={(e) => updateFilter('años_restantes_jubilacion_min' as any, e.target.value ? Number(e.target.value) : undefined)} />
              <Input type="number" placeholder="Máx" value={filters.años_restantes_jubilacion_max ?? ''} onChange={(e) => updateFilter('años_restantes_jubilacion_max' as any, e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardFilters;