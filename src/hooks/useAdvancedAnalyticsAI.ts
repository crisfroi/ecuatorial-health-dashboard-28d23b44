
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
  textResponse?: string;
  summary?: {
    total_profesionales?: number;
    total_centros?: number;
    total_distritos?: number;
    areas_principales?: string[];
    datos_principales?: Record<string, any>;
  };
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
      '¿Qué instituciones educativas son más comunes?'
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
      '¿Qué categorías de centro predominan?'
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
      '¿Cuántas solicitudes se reciben por mes?'
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
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      setConnectionStatus('connecting');
      
      // Test básico de conectividad con timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Conexión timeout después de 5 segundos')), 5000)
      );
      
      const connectionPromise = supabase
        .from('profesionales_sanitarios')
        .select('id')
        .limit(1);
      
      const result = await Promise.race([connectionPromise, timeoutPromise]);
      
      if (result && !result.error) {
        setConnectionStatus('connected');
        console.log('✅ Conexión establecida correctamente');
        return true;
      } else {
        throw new Error('Error en la consulta de prueba');
      }
    } catch (err) {
      console.error('❌ Error de conexión:', err);
      setConnectionStatus('error');
      setError(`Error de conexión: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  }, []);

  const queryStats = useCallback(async (query: AdvancedStatsQuery): Promise<AdvancedStatsResult> => {
    console.log('🔍 Iniciando consulta:', query);
    setLoading(true);
    setError(null);

    try {
      // Verificar conexión primero
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('No se pudo establecer conexión con la base de datos');
      }

      console.log('📡 Invocando edge function...');
      
      // Configurar timeout específico para la edge function
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000); // 15 segundos timeout

      const { data, error: functionError } = await supabase.functions.invoke('ai-analytics-advanced', {
        body: {
          query: query.query,
          filters: query.filters || {},
          description: query.description
        },
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      console.log('📨 Respuesta de edge function:', data);

      if (functionError) {
        console.error('❌ Error en edge function:', functionError);
        throw new Error(`Error en función: ${functionError.message}`);
      }

      if (!data || !data.success) {
        console.error('❌ Datos inválidos:', data);
        throw new Error(data?.error || 'Respuesta inválida del servidor');
      }

      // Generar respuesta de texto descriptiva
      const textResponse = generateTextResponse(data.data, query);

      const result: AdvancedStatsResult = {
        success: true,
        data: data.data,
        query: query.query,
        timestamp: new Date().toISOString(),
        textResponse,
        summary: extractSummary(data.data)
      };

      console.log('✅ Consulta completada exitosamente');
      setResults(prev => [...prev, result]);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error en queryStats:', errorMessage);
      setError(errorMessage);
      
      const errorResult: AdvancedStatsResult = {
        success: false,
        error: errorMessage,
        query: query.query,
        timestamp: new Date().toISOString(),
        textResponse: `Error: ${errorMessage}`
      };

      setResults(prev => [...prev, errorResult]);
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, [testConnection]);

  const generateTextResponse = (data: any, query: AdvancedStatsQuery): string => {
    if (!data) return 'No se obtuvieron datos válidos.';

    try {
      const queryType = query.query;
      let response = '';

      switch (queryType) {
        case 'demographics':
          response = `📊 **Análisis Demográfico Completo**\n\n`;
          if (data.total_profesionales) {
            response += `**Total de profesionales:** ${data.total_profesionales}\n\n`;
          }
          if (data.distribucion_genero) {
            response += `**Distribución por género:**\n`;
            Object.entries(data.distribucion_genero).forEach(([genero, cantidad]: [string, any]) => {
              response += `• ${genero}: ${cantidad} profesionales\n`;
            });
            response += '\n';
          }
          if (data.distribucion_edad) {
            response += `**Distribución por edad:**\n`;
            Object.entries(data.distribucion_edad).forEach(([rango, cantidad]: [string, any]) => {
              response += `• ${rango}: ${cantidad} profesionales\n`;
            });
          }
          break;

        case 'professional_areas':
          response = `🏥 **Análisis por Áreas Profesionales**\n\n`;
          if (data.total_profesionales) {
            response += `**Total de profesionales:** ${data.total_profesionales}\n\n`;
          }
          if (data.areas_profesionales) {
            response += `**Top áreas profesionales:**\n`;
            data.areas_profesionales.slice(0, 5).forEach((area: any, index: number) => {
              response += `${index + 1}. **${area.area}**: ${area.cantidad} profesionales (${area.porcentaje}%)\n`;
            });
          }
          break;

        case 'work_centers':
          response = `🏢 **Análisis de Centros de Trabajo**\n\n`;
          if (data.total_centros) {
            response += `**Total de centros:** ${data.total_centros}\n`;
          }
          if (data.total_profesionales) {
            response += `**Total de profesionales:** ${data.total_profesionales}\n\n`;
          }
          if (data.top_centros) {
            response += `**Centros con más profesionales:**\n`;
            data.top_centros.slice(0, 5).forEach((centro: any, index: number) => {
              response += `${index + 1}. **${centro.nombre}**: ${centro.profesionales} profesionales\n`;
            });
          }
          break;

        case 'comprehensive':
          response = `📈 **Análisis Comprehensivo del Sistema**\n\n`;
          if (data.resumen_general) {
            const resumen = data.resumen_general;
            response += `**Resumen General:**\n`;
            response += `• Total de profesionales: ${resumen.total_profesionales || 'N/A'}\n`;
            response += `• Total de centros: ${resumen.total_centros || 'N/A'}\n`;
            response += `• Distritos sanitarios: ${resumen.total_distritos || 'N/A'}\n`;
            response += `• Países de formación: ${resumen.total_paises || 'N/A'}\n\n`;
          }
          break;

        default:
          response = `📋 **Resultados del Análisis**\n\n`;
          if (data.total_profesionales) {
            response += `**Total de profesionales:** ${data.total_profesionales}\n\n`;
          }
          response += `**Datos disponibles:** ${Object.keys(data).length} categorías de información`;
      }

      return response;
    } catch (error) {
      console.error('Error generando respuesta de texto:', error);
      return 'Se obtuvieron datos pero hubo un error al formatear la respuesta.';
    }
  };

  const extractSummary = (data: any): any => {
    try {
      return {
        total_profesionales: data?.total_profesionales || data?.resumen_general?.total_profesionales || 0,
        total_centros: data?.total_centros || data?.resumen_general?.total_centros || 0,
        total_distritos: data?.total_distritos || data?.resumen_general?.total_distritos || 0,
        areas_principales: data?.areas_profesionales?.slice(0, 3)?.map((a: any) => a.area) || [],
        datos_principales: data
      };
    } catch (error) {
      console.error('Error extrayendo resumen:', error);
      return {};
    }
  };

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setConnectionStatus('idle');
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

    return suggestions.slice(0, 5);
  }, []);

  const parseNaturalLanguage = useCallback((userInput: string): AdvancedStatsQuery | null => {
    const input = userInput.toLowerCase();
    
    const keywordMappings: Record<string, string> = {
      'demografía': 'demographics',
      'demográfico': 'demographics',
      'género': 'demographics',
      'edad': 'demographics',
      'nacionalidad': 'demographics',
      'provincia': 'demographics',
      
      'área': 'professional_areas',
      'especialidad': 'professional_areas',
      'profesional': 'professional_areas',
      'categoría': 'professional_areas',
      
      'formación': 'education',
      'educación': 'education',
      'graduación': 'education',
      'institución': 'education',
      'universidad': 'education',
      'país': 'education',
      
      'centro': 'work_centers',
      'trabajo': 'work_centers',
      'distrito': 'work_centers',
      'hospital': 'work_centers',
      'clínica': 'work_centers',
      
      'solicitud': 'application_status',
      'estado': 'application_status',
      'aprobación': 'application_status',
      'rechazo': 'application_status',
      
      'completo': 'comprehensive',
      'comprehensive': 'comprehensive',
      'todo': 'comprehensive',
      'resumen': 'comprehensive',
      'general': 'comprehensive'
    };

    for (const [keyword, query] of Object.entries(keywordMappings)) {
      if (input.includes(keyword)) {
        return {
          query,
          description: userInput
        };
      }
    }

    // Por defecto, análisis comprehensivo
    return {
      query: 'comprehensive',
      description: userInput
    };
  }, []);

  return {
    loading,
    results,
    error,
    connectionStatus,
    queryStats,
    clearResults,
    getCategoryByQuery,
    getSuggestions,
    parseNaturalLanguage,
    testConnection,
    categories: ANALYTICS_CATEGORIES
  };
}
