import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profesional } from "@/hooks/useProfesionales";

interface SearchResult extends Profesional {
  documento_identidad: string;
  lugar_trabajo: string;
  universidad: string;
  numero_carnet_profesional: string;
}

const ProfessionalSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profesional[]>([]);

  const searchMutation = useMutation(async (query: string) => {
    const { data, error } = await supabase
      .from('profesionales_sanitarios')
      .select('*')
      .ilike('nombre_completo', `%${query}%`)
      .limit(10);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  });

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const results = await searchMutation.mutateAsync(searchQuery);
      // Transform data to match Professional type
      const transformedResults = results.map(item => ({
        ...item,
        documento_identidad: item.numero_documento || '',
        lugar_trabajo: item.nombre_centro || '',
        universidad: item.institucion_1 || '',
        numero_carnet_profesional: item.numero_autonumerico_correlativo?.toString() || '',
        // Ensure all required fields have non-null values
        año_graduacion: item.año_graduacion || 0,
        año_inicio_paro: item.año_inicio_paro || 0,
        apellidos: item.apellidos || '',
        area_profesional: item.area_profesional || '',
        brigada_cooperacion: item.brigada_cooperacion || '',
        categoria_centro: item.categoria_centro || '',
        categoria_titulacion: item.categoria_titulacion || '',
        centro_salud_id: item.centro_salud_id || '',
        codigo_barras: item.codigo_barras || '',
        codigo_expediente: item.codigo_expediente || '',
        copia_dip: item.copia_dip || '',
        copia_pasaporte: item.copia_pasaporte || '',
        creada: item.creada || '',
        created_at: item.created_at || '',
        created_time: item.created_time || '',
        distrito: item.distrito || '',
        distrito_sanitario: item.distrito_sanitario || '',
        documentos_adicionales: item.documentos_adicionales || [],
        documentos_cargados: item.documentos_cargados || {},
        domicilio: item.domicilio || '',
        edad: item.edad || 0,
        email: item.email || '',
        especialidad: item.especialidad || '',
        estado_solicitud: item.estado_solicitud || '',
        estado_trabajo: item.estado_trabajo || '',
        fecha_alta: item.fecha_alta || '',
        fecha_aprobacion: item.fecha_aprobacion || '',
        fecha_caducidad: item.fecha_caducidad || '',
        fecha_creacion_solicitud: item.fecha_creacion_solicitud || '',
        fecha_emision: item.fecha_emision || '',
        fecha_nacimiento: item.fecha_nacimiento || '',
        fecha_rechazo: item.fecha_rechazo || '',
        fecha_revision: item.fecha_revision || '',
        fecha_solicitud: item.fecha_solicitud || '',
        fecha_validez_carnet: item.fecha_validez_carnet || '',
        foto_carnet: item.foto_carnet || '',
        genero: item.genero || '',
        gentilicio_femenino: item.gentilicio_femenino || '',
        id: item.id,
        id_distrito: item.id_distrito || '',
        id_profesional_unico: item.id_profesional_unico || '',
        institucion_1: item.institucion_1 || '',
        institucion_2: item.institucion_2 || '',
        meses_en_paro: item.meses_en_paro || 0,
        motivo_rechazo: item.motivo_rechazo || '',
        nacionalidad: item.nacionalidad || '',
        nombre: item.nombre || '',
        nombre_centro: item.nombre_centro || '',
        nombre_completo: item.nombre_completo,
        notas_aprobacion: item.notas_aprobacion || '',
        notas_revision: item.notas_revision || '',
        numero_autonumerico_correlativo: item.numero_autonumerico_correlativo || 0,
        numero_dip: item.numero_dip || '',
        numero_documento: item.numero_documento || '',
        numero_pasaporte: item.numero_pasaporte || '',
        pais_formacion_1: item.pais_formacion_1 || '',
        pais_formacion_2: item.pais_formacion_2 || '',
        pdf_formulario: item.pdf_formulario || '',
        periodo_formacion: item.periodo_formacion || '',
        periodo_formacion_1: item.periodo_formacion_1 || '',
        periodo_formacion_2: item.periodo_formacion_2 || '',
        pertenece_brigada_medica: item.pertenece_brigada_medica || false,
        provincia: item.provincia || '',
        puesto_responsabilidad: item.puesto_responsabilidad || '',
        revisor_solicitud: item.revisor_solicitud || '',
        situacion_laboral: item.situacion_laboral || '',
        telefono: item.telefono || '',
        tipo_cooperacion: item.tipo_cooperacion || '',
        tipo_documento: item.tipo_documento || '',
        tipo_formacion_1: item.tipo_formacion_1 || '',
        tipo_formacion_2: item.tipo_formacion_2 || '',
        tipo_sector: item.tipo_sector || '',
        titulacion_especifica_1: item.titulacion_especifica_1 || '',
        titulacion_especifica_2: item.titulacion_especifica_2 || '',
        titulo_adjunto_1: item.titulo_adjunto_1 || '',
        titulo_adjunto_2: item.titulo_adjunto_2 || '',
        ultima_modificacion_por: item.ultima_modificacion_por || '',
        updated_at: item.updated_at || '',
        urgencia_solicitud: item.urgencia_solicitud || '',
        url_carnet: item.url_carnet || '',
        url_carta_resolucion: item.url_carta_resolucion || '',
        url_codigo_barras: item.url_codigo_barras || '',
        url_codigo_barras_expediente: item.url_codigo_barras_expediente || '',
        url_pdf: item.url_pdf || ''
      }));
      setSearchResults(transformedResults);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buscar Profesional</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <Input
            type="text"
            placeholder="Nombre completo del profesional"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleSearch}>Buscar</Button>
        </div>
        {searchResults.length > 0 && (
          <ScrollArea className="h-[300px] mt-4">
            <div className="list-none p-0">
              {searchResults.map((result) => (
                <li key={result.id} className="py-2 border-b border-gray-200">
                  {result.nombre_completo} - {result.area_profesional}
                </li>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfessionalSearch;
