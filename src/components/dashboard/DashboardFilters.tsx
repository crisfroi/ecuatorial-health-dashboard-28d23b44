import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PROVINCIAS_EG } from '@/utils/geo';

// INTERFAZ ACTUALIZADA A ARRAYS
interface Filtros {
  area_profesional?: string[];
  estado_solicitud?: string[];
  provincia?: string[];
  genero?: string[]; // <-- AHORA ES ARRAY
  tipo_sector?: string[];
  funcion_publica?: string;
  estatus_funcionario?: 'nombrado' | 'no_nombrado';
  distrito?: string[];
  distrito_sanitario?: string[];
  centro_id?: string[];
  centro_nombre?: string;
  edad_minima?: number;
  edad_maxima?: number;
  año_graduacion?: number[];
  pais_formacion?: string[];
  institucion_formacion?: string[];
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

  const updateFilter = (key: keyof Filtros, value: string | number | string[] | number[] | undefined) => {
    let normalized: any = value;
    if (key === 'funcion_publica' && typeof value === 'string') {
      if (value === 'true') normalized = true;
      else if (value === 'false') normalized = false;
      else normalized = undefined;
    }

    // LÓGICA DE LIMPIEZA PARA MULTISELECT: Si es un array vacío, convertirlo a undefined
    if (Array.isArray(value) && value.length === 0) {
      normalized = undefined;
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
        if (col === 'año_graduacion') setAnios((values as string[]).map(v => Number(v)).filter(n => !Number.isNaN(n)).sort((a, b) => a - b));
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
            <span>Limpiar Todos</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Área Profesional</label>
            <MultiSelect
              options={areas}
              selected={filters.area_profesional || []}
              onChange={(selected) => updateFilter('area_profesional', selected)}
              placeholder="Todas las áreas"
            />
          </div>

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

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Estado de Solicitud</label>
            <MultiSelect
              options={estados}
              selected={filters.estado_solicitud || []}
              onChange={(selected) => updateFilter('estado_solicitud', selected)}
              placeholder="Todos los estados"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Provincia</label>
            <MultiSelect
              options={provincias}
              selected={filters.provincia || []}
              onChange={(selected) => updateFilter('provincia', selected)}
              placeholder="Todas las provincias"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Distrito Sanitario</label>
            <MultiSelect
              options={distritosSanitarios}
              selected={filters.distrito_sanitario || []}
              onChange={(selected) => updateFilter('distrito_sanitario', selected)}
              placeholder="Todos los distritos"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Centro</label>
            <MultiSelect
              options={centros.map(c => c.nombre)}
              selected={filters.centro_id ? centros.filter(c => filters.centro_id?.includes(c.id)).map(c => c.nombre) : []}
              onChange={(selectedNames) => {
                const selectedIds = centros.filter(c => selectedNames.includes(c.nombre)).map(c => c.id);
                updateFilter('centro_id', selectedIds);
              }}
              placeholder="Todos los centros"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Género</label>
            <MultiSelect
              options={generos}
              selected={filters.genero || []}
              onChange={(selected) => updateFilter('genero', selected)}
              placeholder="Todos los géneros"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tipo de Sector</label>
            <MultiSelect
              options={sectores}
              selected={filters.tipo_sector || []}
              onChange={(selected) => updateFilter('tipo_sector', selected)}
              placeholder="Todos los sectores"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Distrito</label>
            <MultiSelect
              options={distritos}
              selected={filters.distrito || []}
              onChange={(selected) => updateFilter('distrito', selected)}
              placeholder="Todos los distritos"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">País de Formación</label>
            <MultiSelect
              options={paises}
              selected={filters.pais_formacion || []}
              onChange={(selected) => updateFilter('pais_formacion', selected)}
              placeholder="Todos los países"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Centro de Formación</label>
            <MultiSelect
              options={instituciones}
              selected={filters.institucion_formacion || []}
              onChange={(selected) => updateFilter('institucion_formacion', selected)}
              placeholder="Todas las instituciones"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Año de Graduación</label>
            <MultiSelect
              options={anios.map(a => String(a))}
              selected={(filters.año_graduacion || []).map(a => String(a))}
              onChange={(selected) => updateFilter('año_graduacion', selected.map(s => Number(s)))}
              placeholder="Todos los años"
            />
          </div>

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