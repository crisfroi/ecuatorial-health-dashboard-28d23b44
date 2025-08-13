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
    id: 'user_management',
    name: 'Gestión de Usuarios',
    description: 'Estadísticas de usuarios y roles del sistema',
    queries: ['user_management'],
    examples: [
      '¿Cuántos usuarios hay por rol?',
      '¿Cuántos usuarios están activos?',
      '¿Qué departamentos tienen más usuarios?',
      '¿Cuántos usuarios tienen centros asignados?'
    ]
  },
  {
    id: 'system_performance',
    name: 'Rendimiento del Sistema',
    description: 'Métricas de rendimiento y salud del sistema',
    queries: ['system_performance'],
    examples: [
      '¿Cuántos registros hay en total?',
      '¿Cuál es el estado de salud del sistema?',
      '¿Cómo están distribuidos los registros por tabla?',
      'Dame un reporte de rendimiento del sistema'
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
      'Necesito un análisis completo de todos los datos',
      'Análisis integral del sistema de salud'
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
          filters: query.filters || {}
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
    const input = userInput.toLowerCase();
    
    // Mapeo de palabras clave a consultas
    const keywordMappings: Record<string, string> = {
      'demografía': 'demographics',
      'demografico': 'demographics',
      'genero': 'demographics',
      'edad': 'demographics',
      'nacionalidad': 'demographics',
      'provincia': 'demographics',
      
      'area': 'professional_areas',
      'especialidad': 'professional_areas',
      'profesional': 'professional_areas',
      'categoria': 'professional_areas',
      
      'formacion': 'education',
      'educacion': 'education',
      'graduacion': 'education',
      'institucion': 'education',
      'universidad': 'education',
      'pais': 'education',
      
      'centro': 'work_centers',
      'trabajo': 'work_centers',
      'distrito': 'work_centers',
      'sector': 'work_centers',
      'situacion': 'work_centers',
      
      'solicitud': 'application_status',
      'estado': 'application_status',
      'aprobacion': 'application_status',
      'rechazo': 'application_status',
      'urgencia': 'application_status',
      
      'carnet': 'carnet_generation',
      'generacion': 'carnet_generation',
      'cola': 'carnet_generation',
      'vencimiento': 'carnet_generation',
      'vigente': 'carnet_generation',

      'temporal': 'temporal_analysis',
      'tiempo': 'temporal_analysis',
      'evolucion': 'temporal_analysis',
      'tendencia': 'temporal_analysis',
      'historico': 'temporal_analysis',
      'mes': 'temporal_analysis',
      'año': 'temporal_analysis',

      'usuario': 'user_management',
      'usuarios': 'user_management',
      'rol': 'user_management',
      'roles': 'user_management',
      'departamento': 'user_management',
      'activo': 'user_management',
      'gestión': 'user_management',

      'sistema': 'system_performance',
      'rendimiento': 'system_performance',
      'performance': 'system_performance',
      'salud': 'system_performance',
      'registros': 'system_performance',
      'tabla': 'system_performance',
      'base': 'system_performance',
      'datos': 'system_performance',

      'completo': 'comprehensive',
      'comprehensive': 'comprehensive',
      'todo': 'comprehensive',
      'resumen': 'comprehensive',
      'integral': 'comprehensive',
      'general': 'comprehensive',
      'panorama': 'comprehensive',
      'dashboard': 'comprehensive',
      'estadisticas': 'comprehensive'
    };

    // Buscar la consulta más apropiada
    for (const [keyword, query] of Object.entries(keywordMappings)) {
      if (input.includes(keyword)) {
        return {
          query,
          description: userInput
        };
      }
    }

    // Si no se encuentra una coincidencia específica, devolver análisis comprehensivo
    return {
      query: 'comprehensive',
      description: userInput
    };
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
