import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdvancedStatsQuery {
  query: string;
  filters?: Record<string, any>;
  description?: string;
}

export interface AdvancedStatsResult {
  success: boolean;
  data: any;
  error?: string;
  query?: string;
  timestamp: string;
}

export interface AnalyticsCategory {
  id: string;
  name: string;
  description: string;
  queries: string[];
  examples: string[];
}

export const ANALYTICS_CATEGORIES: AnalyticsCategory[] = [
  {
    id: 'query_professionals',
    name: 'Consultas Específicas',
    description: 'Búsquedas dirigidas con filtros (cuentas exactas)',
    queries: ['query_professionals'],
    examples: [
      '¿Cuántos profesionales tendrán el carnet vencido en menos de 90 días?',
      '¿Cuántos graduados en la UNGE trabajan en el distrito sanitario de Litoral?',
      '¿Cuántas enfermeras aprobadas hay en Bioko Norte?',
      '¿Cuántos profesionales con carnet vencido hay actualmente?'
    ]
  },
  {
    id: 'demographics',
    name: 'Demografía',
    description: 'Estadísticas demográficas de los profesionales',
    queries: ['demographics'],
    examples: [
      '¿Cuántos profesionales hay por género?',
      '¿Cuál es la distribución por edades?',
      '¿Qué nacionalidades predominan?',
      '¿Cuántos profesionales hay por provincia?'
    ]
  },
  {
    id: 'professional_areas',
    name: 'Áreas Profesionales',
    description: 'Análisis por áreas y especialidades',
    queries: ['professional_areas'],
    examples: [
      '¿Cuáles son las áreas profesionales más comunes?',
      '¿Qué especialidades hay disponibles?',
      '¿Cuántos profesionales hay por categoría de titulación?'
    ]
  },
  {
    id: 'education',
    name: 'Formación y Educación',
    description: 'Estadísticas de formación académica',
    queries: ['education'],
    examples: [
      '¿En qué países se formaron más profesionales?',
      '¿Cuál es la distribución por años de graduación?',
      '¿Qué instituciones educativas son más comunes?',
      '¿Qué tipos de formación predominan?'
    ]
  },
  {
    id: 'work_centers',
    name: 'Centros de Trabajo',
    description: 'Análisis de lugares de trabajo',
    queries: ['work_centers'],
    examples: [
      '¿Qué centros tienen más profesionales?',
      '¿Cuántos profesionales hay por distrito sanitario?',
      '¿Qué categorías de centro predominan?',
      '¿Cuáles son las situaciones laborales más comunes?'
    ]
  },
  {
    id: 'application_status',
    name: 'Estados de Solicitud',
    description: 'Análisis de estados y procesos',
    queries: ['application_status'],
    examples: [
      '¿Cuántas solicitudes están en cada estado?',
      '¿Cuáles son los motivos de rechazo más comunes?',
      '¿Cuántas solicitudes se reciben por mes?',
      '¿Qué nivel de urgencia tienen las solicitudes?'
    ]
  },
  {
    id: 'carnet_generation',
    name: 'Generación de Carnets',
    description: 'Estadísticas de generación de carnets',
    queries: ['carnet_generation'],
    examples: [
      '¿Cuántos carnets se han generado?',
      '¿Cuántos están en cola de generación?',
      '¿Cuáles son los estados de la cola?',
      '¿Cuántos carnets se generan por día?'
    ]
  },
  {
    id: 'centers_analysis',
    name: 'Análisis de Centros',
    description: 'Estadísticas de centros de salud',
    queries: ['centers_analysis'],
    examples: [
      '¿Cuántos centros de salud hay?',
      '¿Qué categorías de centro predominan?',
      '¿Cuántos centros hay por provincia?',
      '¿Cuántos profesionales hay por centro?'
    ]
  },
  {
    id: 'temporal_analysis',
    name: 'Análisis Temporal',
    description: 'Tendencias y evolución temporal',
    queries: ['temporal_analysis'],
    examples: [
      '¿Cómo evolucionan los registros por mes?',
      '¿Cuántas aprobaciones hay por mes?',
      '¿Cuál es la distribución por años de graduación?'
    ]
  },
  {
    id: 'comprehensive',
    name: 'Análisis Comprehensivo',
    description: 'Todas las estadísticas disponibles',
    queries: ['comprehensive'],
    examples: [
      'Dame un resumen completo de todas las estadísticas',
      '¿Cuál es el panorama general del sistema?',
      'Necesito un análisis completo de todos los datos'
    ]
  }
];

export function useAdvancedAnalyticsAI() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AdvancedStatsResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const queryStats = useCallback(async (query: AdvancedStatsQuery): Promise<AdvancedStatsResult> => {
    setLoading(true);
    setError(null);

    try {
      // Intentar usar la función de Supabase primero
      const { data, error: functionError } = await supabase.functions.invoke('ai-analytics-advanced', {
        body: {
          query: query.query,
          filters: query.filters || {},
          message: query.description || ''
        }
      });

      if (functionError) {
        throw new Error(`Error en función: ${functionError.message}`);
      }

      const result: AdvancedStatsResult = {
        success: data.success,
        data: data.data,
        query: query.query,
        timestamp: new Date().toISOString()
      };

      setResults(prev => [...prev, result]);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      const errorResult: AdvancedStatsResult = {
        success: false,
        error: errorMessage,
        query: query.query,
        timestamp: new Date().toISOString()
      };

      setResults(prev => [...prev, errorResult]);
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, []);

  const queryMultipleStats = useCallback(async (queries: AdvancedStatsQuery[]): Promise<AdvancedStatsResult[]> => {
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        queries.map(query => queryStats(query))
      );

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [queryStats]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  const getCategoryByQuery = useCallback((query: string): AnalyticsCategory | undefined => {
    return ANALYTICS_CATEGORIES.find(category => 
      category.queries.includes(query)
    );
  }, []);

  const getSuggestions = useCallback((userInput: string): string[] => {
    const suggestions: string[] = [];
    
    ANALYTICS_CATEGORIES.forEach(category => {
      category.examples.forEach(example => {
        if (example.toLowerCase().includes(userInput.toLowerCase())) {
          suggestions.push(example);
        }
      });
    });

    return suggestions.slice(0, 5); // Máximo 5 sugerencias
  }, []);

  const parseNaturalLanguage = useCallback((userInput: string): AdvancedStatsQuery | null => {
    const original = userInput.trim()
    const input = original.toLowerCase()

    // 1) Detectar consultas de conteo específicas (query_professionals)
    const wantsCount = /(cuant[ao]s|n[uú]mero|total|cu[aá]ntos)/i.test(original)

    // a) Vencimientos en N días
    const vencKeywords = /(vencid|vence|caduc|pr[oó]xim[oa]s? a vencer|pr[oó]xim[oa]s)/i
    const daysMatch = input.match(/(menos\s+de\s+|en\s+los\s+pr[oó]ximos\s+|en\s+)?(\d{1,4})\s*d[ií]as/)

    if (vencKeywords.test(input) && daysMatch) {
      const days = parseInt(daysMatch[2], 10)
      return {
        query: 'query_professionals',
        description: original,
        filters: { expira_en_dias: isNaN(days) ? 30 : days }
      }
    }

    // b) Carnets vencidos actualmente
    if (/(carnet|acreditaci[oó]n).*(vencid[oa]s?|caducad[oa]s?)/i.test(original)) {
      return {
        query: 'query_professionals',
        description: original,
        filters: { carnet_vencido: true }
      }
    }

    // c) Graduados en UNGE + distrito sanitario
    const unge = /(unge|universidad\s+nacional\s+de\s+guinea\s+ecuatorial)/i.test(input)
    const distritoMatch = input.match(/distrito\s+sanitario\s+de\s+([a-zA-Z\u00C0-\u017F\s]+)/)
    if (unge || distritoMatch) {
      const filters: Record<string, any> = {}
      if (unge) filters.institucion = 'UNGE'
      if (distritoMatch) filters.distrito_sanitario = distritoMatch[1].trim()
      return {
        query: 'query_professionals',
        description: original,
        filters
      }
    }

    // d) Área profesional, provincia, género (búsquedas simples)
    const areaMatch = input.match(/(área|area)\s+profesional\s+de\s+([a-zA-Z\u00C0-\u017F\s]+)/)
    if (wantsCount && areaMatch) {
      return { query: 'query_professionals', description: original, filters: { area_profesional: areaMatch[2].trim() } }
    }

    const provinciaMatch = input.match(/provincia\s+de\s+([a-zA-Z\u00C0-\u017F\s]+)/)
    if (wantsCount && provinciaMatch) {
      return { query: 'query_professionals', description: original, filters: { provincia: provinciaMatch[1].trim() } }
    }

    const generoMatch = input.match(/(hombres|mujeres|masculino|femenino)/)
    if (wantsCount && generoMatch) {
      const gen = generoMatch[1]
      const genero = /hombres|masculino/.test(gen) ? 'Masculino' : 'Femenino'
      return { query: 'query_professionals', description: original, filters: { genero } }
    }

    // 2) Mapeo de palabras clave a consultas agregadas
    const keywordMappings: Record<string, string> = {
      'demografía': 'demographics',
      'demografico': 'demographics',
      'género': 'demographics',
      'genero': 'demographics',
      'edad': 'demographics',
      'nacionalidad': 'demographics',
      'provincia': 'demographics',

      'área': 'professional_areas',
      'area': 'professional_areas',
      'especialidad': 'professional_areas',
      'profesional': 'professional_areas',
      'categoría': 'professional_areas',
      'categoria': 'professional_areas',

      'formación': 'education',
      'formacion': 'education',
      'educación': 'education',
      'educacion': 'education',
      'graduación': 'education',
      'graduacion': 'education',
      'institución': 'education',
      'institucion': 'education',
      'universidad': 'education',
      'país': 'education',
      'pais': 'education',

      'centro': 'work_centers',
      'trabajo': 'work_centers',
      'distrito': 'work_centers',
      'sector': 'work_centers',
      'situación': 'work_centers',
      'situacion': 'work_centers',

      'solicitud': 'application_status',
      'estado': 'application_status',
      'aprobación': 'application_status',
      'aprobacion': 'application_status',
      'rechazo': 'application_status',
      'urgencia': 'application_status',

      'carnet': 'carnet_generation',
      'generación': 'carnet_generation',
      'generacion': 'carnet_generation',
      'cola': 'carnet_generation',

      'temporal': 'temporal_analysis',
      'tiempo': 'temporal_analysis',
      'evolución': 'temporal_analysis',
      'evolucion': 'temporal_analysis',
      'tendencia': 'temporal_analysis',

      'completo': 'comprehensive',
      'comprehensive': 'comprehensive',
      'todo': 'comprehensive',
      'resumen': 'comprehensive'
    }

    for (const [keyword, query] of Object.entries(keywordMappings)) {
      if (input.includes(keyword)) {
        return { query, description: original }
      }
    }

    // Fallback: no ejecutar análisis si no hay intención clara
    return null
  }, []);

  return {
    loading,
    results,
    error,
    queryStats,
    queryMultipleStats,
    clearResults,
    getCategoryByQuery,
    getSuggestions,
    parseNaturalLanguage,
    categories: ANALYTICS_CATEGORIES
  };
}
