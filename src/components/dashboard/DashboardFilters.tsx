import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Se importan Select y sus subcomponentes, aunque se usen menos
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PROVINCIAS_EG } from '@/utils/geo';

// =========================================================================
// ⚡️ MODIFICACIÓN 1: Interfaz Filtros actualizada para Arrays (Selección Múltiple)
// =========================================================================
interface Filtros {
  area_profesional?: string[]; // CAMBIO a Array
  estado_solicitud?: string[]; // CAMBIO a Array
  provincia?: string[]; // CAMBIO a Array
  genero?: string[]; // CAMBIO a Array
  tipo_sector?: string[]; // CAMBIO a Array
  funcion_publica?: string;
  estatus_funcionario?: 'nombrado' | 'no_nombrado';
  distrito?: string[]; // CAMBIO a Array
  distrito_sanitario?: string[]; // CAMBIO a Array
  centro_id?: string;
  centro_nombre?: string;
  edad_minima?: number;
  edad_maxima?: number;
  año_graduacion?: number[]; // CAMBIO a Array de Números
  pais_formacion?: string[]; // CAMBIO a Array
  institucion_formacion?: string[]; // CAMBIO a Array
  edad_laboral_min?: number;
  edad_laboral_max?: number;
  años_servicio_min?: number;
  años_servicio_max?: number;
  años_restantes_jubilacion_min?: number;
  años_restantes_jubilacion_max?: number;
}

interface DashboardFiltersProps {
  filters: Filtros;
  onFiltersChange: (filters: Filtros) => void;
  onClearFilters: () => void;
}

// -------------------------------------------------------------------------
// 💡 PLACEHOLDER: Este componente debe ser reemplazado por su implementación
// real de MultiSelect que reciba 'value' como array y use 'onValueChange'
// para devolver el array de strings/numbers seleccionados.
// -------------------------------------------------------------------------
const MultiSelectComponent = ({ value, options, onValueChange, placeholder }: any) => {
    // Genera una cadena con los valores seleccionados para mostrar en el placeholder
    const selectedLabels = Array.isArray(value) && value.length > 0
        ? value.join(', ')
        : placeholder;

    // Se usa un Select normal solo para demostrar la estructura del filtro en el código
    return (
        <div className="space-y-1 border p-2 rounded-md border-dashed border-gray-300">
            <div className="text-sm font-semibold text-blue-700">{placeholder}</div>
            <div className="text-xs text-gray-600">
                Seleccionados: {selectedLabels}
            </div>
            <Button
                variant="secondary"
                size="sm"
                onClick={() => onValueChange(value.length === 0 ? options.map((o: any) => o.value) : [])}
                className="w-full text-xs"
            >
                {value.length === 0 ? 'Seleccionar Todo (Placeholder)' : 'Limpiar Selección (Placeholder)'}
            </Button>
            <span className="text-xs text-red-500 italic block mt-1">REEMPLAZAR POR MULTI-SELECT REAL</span>
        </div>
    );
};
// -------------------------------------------------------------------------


const DashboardFilters = ({ filters, onFiltersChange, onClearFilters }: DashboardFiltersProps) => {
  const [areas, setAreas] = useState<string[]>([]);
  const [estados, setEstados] = useState<string[]>([]);
  const [provincias, setProvincias] = useState<string[]>([]);
  const [distritosSanitarios, setDistritosSanitarios] = useState<string[]>([]);
  const [generos, setGeneros] = useState<string[]>([]);
  const [sectores, setSectores] = useState<string[]>([]);
  const [distritos, setDistritos] = useState<string[]>([]);
  const [anios, setAnios] = useState<number[]>([]);
  const [centros, setCentros] = useState<{ id: string; nombre: string }[]>([]);
  const [paises, setPaises] = useState<string[]>([]);
  const [instituciones, setInstituciones] = useState<string[]>([]);

  // ⚡️ NUEVA FUNCIÓN: Maneja los campos de Selección Múltiple (Array de valores)
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
  
  // ⚡️ MODIFICACIÓN: updateFilter se mantiene para campos de selección simple (booleano/numérico/string)
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

  useEffect(() => {
    const fetchDistinct = async () => {
      const cols = [
        'area_profesional', 'estado_solicitud', 'provincia', 'distrito_sanitario',
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
        if (col === 'area_profesional') setAreas(values);
        if (col === 'estado_solicitud') setEstados(values);
        if (col === 'provincia') setProvincias(Array.from(new Set([...(PROVINCIAS_EG as string[]), ...values])));
        if (col === 'distrito_sanitario') setDistritosSanitarios(values);
        if (col === 'genero') setGeneros(values);
        if (col === 'tipo_sector') setSectores(values);
        if (col === 'distrito') setDistritos(values);
        if (col === 'año_graduacion') setAnios((values as string[]).map(v => Number(v)).filter(n => !Number.isNaN(n)).sort((a,b)=>a-b));
      });

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
            <MultiSelectComponent
              placeholder="Todas las áreas"
              options={areas.map(v => ({ value: v, label: v }))}
              value={filters.area_profesional || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('area_profesional', value)}
            />
          </div>

          {/* ------------------ FUNCIÓN PÚBLICA (SINGLE SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Función Pública</label>
            <Select value={typeof filters.funcion_publica === 'boolean' ? String(filters.funcion_publica) : 'todos'} onValueChange={(value) => updateFilter('funcion_publica' as any, value)}>
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

          {/* ------------------ ESTATUS FUNCIONARIO (SINGLE SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Estatus de Funcionario</label>
            <Select value={(filters as any).estatus_funcionario || 'todos'} onValueChange={(value) => updateFilter('estatus_funcionario' as any, value)}>
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
            <MultiSelectComponent
              placeholder="Todos los estados"
              options={estados.map(v => ({ value: v, label: v }))}
              value={filters.estado_solicitud || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('estado_solicitud', value)}
            />
          </div>

          {/* ------------------ PROVINCIA (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Provincia</label>
            <MultiSelectComponent
              placeholder="Todas las provincias"
              options={provincias.map(v => ({ value: v, label: v }))}
              value={filters.provincia || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('provincia', value)}
            />
          </div>

          {/* ------------------ DISTRITO SANITARIO (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Distrito Sanitario</label>
            <MultiSelectComponent
              placeholder="Todos los distritos"
              options={distritosSanitarios.map(v => ({ value: v, label: v }))}
              value={filters.distrito_sanitario || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('distrito_sanitario', value)}
            />
          </div>

          {/* ------------------ CENTRO (SINGLE SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Centro</label>
            <Select value={filters.centro_id || 'todos'} onValueChange={(value) => {
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
            <MultiSelectComponent
              placeholder="Todos los géneros"
              options={generos.map(v => ({ value: v, label: v }))}
              value={filters.genero || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('genero', value)}
            />
          </div>

          {/* ------------------ TIPO DE SECTOR (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tipo de Sector</label>
            <MultiSelectComponent
              placeholder="Todos los sectores"
              options={sectores.map(v => ({ value: v, label: v }))}
              value={filters.tipo_sector || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('tipo_sector', value)}
            />
          </div>

          {/* ------------------ DISTRITO (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Distrito</label>
            <MultiSelectComponent
              placeholder="Todos los distritos"
              options={distritos.map(v => ({ value: v, label: v }))}
              value={filters.distrito || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('distrito', value)}
            />
          </div>

          {/* ------------------ PAÍS DE FORMACIÓN (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">País de Formación</label>
            <MultiSelectComponent
              placeholder="Todos los países"
              options={paises.map(v => ({ value: v, label: v }))}
              value={filters.pais_formacion || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('pais_formacion', value)}
            />
          </div>

          {/* ------------------ CENTRO DE FORMACIÓN (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Centro de Formación</label>
            <MultiSelectComponent
              placeholder="Todas las instituciones"
              options={instituciones.map(v => ({ value: v, label: v }))}
              value={filters.institucion_formacion || []}
              onValueChange={(value: string[]) => handleMultiSelectChange('institucion_formacion', value)}
            />
          </div>

          {/* ------------------ AÑO DE GRADUACIÓN (MULTI-SELECT) ------------------ */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Año de Graduación</label>
            <MultiSelectComponent
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