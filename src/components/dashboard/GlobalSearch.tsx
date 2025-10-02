import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Users, Building2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ResultItem {
  type: 'profesional' | 'centro' | 'solicitud';
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
}

interface GlobalSearchProps {
  onNavigate: (tab: string, filters?: Record<string, any>) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  const formatDate = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString('es-ES');
  };

  useEffect(() => {
    const run = async () => {
      const q = query.trim();
      if (!q || q.length < 2) { setResults([]); return; }
      setLoading(true);
      try {
        const [profRes, centersRes] = await Promise.all([
          supabase
            .from('profesionales_sanitarios')
            .select('id,nombre_completo,area_profesional,estado_solicitud,provincia,id_profesional_unico,funcion_publica,estatus_funcionario,numero_funcionario,fecha_nombramiento,fecha_inicio_trabajo')
            .ilike('nombre_completo', `%${q}%`)
            .limit(10),
          supabase
            .from('centros_salud')
            .select('id,nombre,categoria,provincia,distrito_sanitario')
            .ilike('nombre', `%${q}%`)
            .limit(10)
        ]);

        const profItems: ResultItem[] = (profRes.data || []).map((p: any) => {
          const funcionarioMeta = (() => {
            if (!p.funcion_publica) {
              return 'Personal no funcionario';
            }
            const baseLabel = p.estatus_funcionario === 'nombrado' ? 'Funcionario nombrado' : 'Funcionario no nombrado';
            const details: string[] = [];
            if (p.numero_funcionario) {
              details.push(`Nº ${p.numero_funcionario}`);
            }
            if (p.estatus_funcionario === 'nombrado' && p.fecha_nombramiento) {
              const formatted = formatDate(p.fecha_nombramiento);
              if (formatted) details.push(`Nombramiento: ${formatted}`);
            }
            if (p.estatus_funcionario === 'no_nombrado' && p.fecha_inicio_trabajo) {
              const formatted = formatDate(p.fecha_inicio_trabajo);
              if (formatted) details.push(`Inicio: ${formatted}`);
            }
            return details.length > 0 ? `${baseLabel} (${details.join(' • ')})` : baseLabel;
          })();

          const metaParts = [funcionarioMeta, p.estado_solicitud || '', p.provincia || ''].filter(Boolean);

          return {
            type: 'profesional',
            id: p.id,
            title: p.nombre_completo,
            subtitle: p.area_profesional || '',
            meta: metaParts.join(' • ')
          } as ResultItem;
        });
        const centerItems: ResultItem[] = (centersRes.data || []).map((c: any) => ({
          type: 'centro',
          id: c.id,
          title: c.nombre,
          subtitle: c.categoria || '',
          meta: `${c.provincia || ''}${c.distrito_sanitario ? ' • ' + c.distrito_sanitario : ''}`
        }));

        const merged = [...profItems, ...centerItems]
          .sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }));
        setResults(merged);
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(run, 250);
    return () => clearTimeout(t);
  }, [query]);

  const handleOpen = (item: ResultItem) => {
    if (item.type === 'profesional') {
      onNavigate('professionals', { search: item.title });
    } else if (item.type === 'centro') {
      onNavigate('health-centers', { nombreParcial: item.title });
    }
  };

  return (
    <div className="w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar profesionales o centros..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      {query && (
        <Card className="mt-2">
          <CardContent className="p-2 max-h-72 overflow-auto">
            {loading && <div className="text-sm text-gray-500 p-2">Buscando...</div>}
            {!loading && results.length === 0 && (
              <div className="text-sm text-gray-500 p-2">Sin resultados</div>
            )}
            {!loading && results.map((r) => (
              <Button
                key={`${r.type}-${r.id}`}
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => handleOpen(r)}
              >
                {r.type === 'profesional' ? <Users className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                <div className="text-left">
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-gray-500">{r.subtitle}{r.meta ? ` • ${r.meta}` : ''}</div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GlobalSearch;
