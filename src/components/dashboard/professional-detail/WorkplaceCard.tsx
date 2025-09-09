import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin } from 'lucide-react';
import type { Profesional } from '@/hooks/useProfesionales';
import { supabase } from '@/integrations/supabase/client';

interface WorkplaceCardProps {
  professional: Profesional;
}

interface CentroSaludLite {
  id: string;
  nombre: string;
  categoria?: string | null;
  sector?: string | null;
  distrito?: string | null;
  distrito_sanitario?: string | null;
  provincia?: string | null;
}

const WorkplaceCard = ({ professional }: WorkplaceCardProps) => {
  const [centro, setCentro] = useState<CentroSaludLite | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchCentro = async () => {
      try {
        if (professional.centro_salud_id) {
          const { data } = await supabase
            .from('centros_salud')
            .select('id, nombre, categoria, sector, distrito, distrito_sanitario, provincia')
            .eq('id', professional.centro_salud_id)
            .maybeSingle();
          if (isMounted) setCentro((data as any) || null);
        } else if (professional.nombre_centro) {
          const { data } = await supabase
            .from('centros_salud')
            .select('id, nombre, categoria, sector, distrito, distrito_sanitario, provincia')
            .eq('nombre', professional.nombre_centro)
            .maybeSingle();
          if (isMounted) setCentro((data as any) || null);
        } else {
          setCentro(null);
        }
      } catch (_) {
        if (isMounted) setCentro(null);
      }
    };
    fetchCentro();
    return () => { isMounted = false; };
  }, [professional.centro_salud_id, professional.nombre_centro]);

  const nombreCentro = centro?.nombre || professional.nombre_centro || 'No especificado';
  const categoriaCentro = centro?.categoria || professional.categoria_centro || undefined;
  const sectorCentro = centro?.sector || professional.tipo_sector || undefined;
  const distritoTexto = (centro?.distrito || professional.distrito || 'No especificado');
  const provinciaTexto = (centro?.provincia || professional.provincia || 'No especificado');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building className="w-5 h-5 text-purple-600" />
          <span>Centro de Trabajo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <span className="text-sm font-medium text-gray-600">Institución:</span>
          <p className="font-medium">{nombreCentro}</p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-600">Área profesional:</span>
          <p>{professional.area_profesional || 'No especificado'}</p>
        </div>
        {professional.especialidad && (
          <div>
            <span className="text-sm font-medium text-gray-600">Especialidad:</span>
            <p>{professional.especialidad}</p>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span>{distritoTexto}, {provinciaTexto}</span>
        </div>
        {categoriaCentro && (
          <div>
            <span className="text-sm font-medium text-gray-600">Categoría del centro:</span>
            <p>{categoriaCentro}</p>
          </div>
        )}
        {sectorCentro && (
          <div>
            <span className="text-sm font-medium text-gray-600">Sector:</span>
            <Badge variant="outline">{sectorCentro}</Badge>
          </div>
        )}
        
        {professional.funcion_publica && (
          <div className="pt-3 border-t border-gray-200 space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-600">Función pública:</span>
              <Badge variant="secondary" className="ml-2">Funcionario Público</Badge>
            </div>
            {professional.estatus_funcionario && (
              <div>
                <span className="text-sm font-medium text-gray-600">Estatus:</span>
                <p>{professional.estatus_funcionario === 'nombrado' ? 'Nombrado' : 'No nombrado'}</p>
              </div>
            )}
            {professional.fecha_nombramiento && (
              <div>
                <span className="text-sm font-medium text-gray-600">Fecha nombramiento:</span>
                <p>{new Date(professional.fecha_nombramiento).toLocaleDateString('es-ES')}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkplaceCard;
