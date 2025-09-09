import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PROVINCIAS_EG } from '@/utils/geo';

interface Filtros {
  area_profesional?: string;
  estado_solicitud?: string;
  provincia?: string;
  genero?: string;
  tipo_sector?: string;
  funcion_publica?: string; // string 'true'/'false' as used by UI
  estatus_funcionario?: 'nombrado' | 'no_nombrado';
  distrito?: string;
  distrito_sanitario?: string;
  centro_id?: string;
  centro_nombre?: string;
  edad_minima?: number;
  edad_maxima?: number;
  año_graduacion?: number;
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Área Profesional</label>
            <Select value={filters.area_profesional || 'todos'} onValueChange={(value) => updateFilter('area_profesional', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las áreas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las áreas</SelectItem>
                {areas.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Select value={filters.estado_solicitud || 'todos'} onValueChange={(value) => updateFilter('estado_solicitud', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {estados.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Provincia</label>
            <Select value={filters.provincia || 'todos'} onValueChange={(value) => updateFilter('provincia', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las provincias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las provincias</SelectItem>
                {provincias.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Distrito Sanitario</label>
            <Select value={filters.distrito_sanitario || 'todos'} onValueChange={(value) => updateFilter('distrito_sanitario', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los distritos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los distritos</SelectItem>
                {distritosSanitarios.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Género</label>
            <Select value={filters.genero || 'todos'} onValueChange={(value) => updateFilter('genero', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los géneros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los géneros</SelectItem>
                {generos.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tipo de Sector</label>
            <Select value={filters.tipo_sector || 'todos'} onValueChange={(value) => updateFilter('tipo_sector', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los sectores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los sectores</SelectItem>
                {sectores.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Distrito</label>
            <Select value={filters.distrito || 'todos'} onValueChange={(value) => updateFilter('distrito', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los distritos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los distritos</SelectItem>
                {distritos.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Año de Graduación</label>
            <Select value={filters.año_graduacion ?? 'todos'} onValueChange={(value) => updateFilter('año_graduacion', value === 'todos' ? undefined : Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los años" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los años</SelectItem>
                {anios.map((v) => (
                  <SelectItem key={v} value={String(v)}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Edad</label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Mín" value={filters.edad_minima ?? ''} onChange={(e) => updateFilter('edad_minima', e.target.value ? Number(e.target.value) : undefined)} />
              <Input type="number" placeholder="Máx" value={filters.edad_maxima ?? ''} onChange={(e) => updateFilter('edad_maxima', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardFilters;
