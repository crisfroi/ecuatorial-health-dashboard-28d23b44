import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/utils/errorHandler';

interface CarnetQueueItem {
  id: string;
  profesional_id: string;
  estado: 'pendiente' | 'procesando' | 'completado' | 'error';
  url_carnet?: string;
  mensaje_error?: string;
  created_at: string;
  updated_at: string;
  profesional?: {
    nombre_completo: string;
    id_profesional_unico: string;
  };
}

interface QueueProcessResult {
  success: boolean;
  message: string;
  url_carnet?: string;
  error?: string;
}

export const useCarnetQueue = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Query para obtener profesionales aprobados sin carnet
  const getProfessionalsWithoutCarnet = useQuery({
    queryKey: ['professionals-without-carnet'],
    queryFn: async () => {
      console.log('Buscando profesionales aprobados sin carnet...');
      
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select('id, nombre_completo, id_profesional_unico, url_carnet, estado_solicitud')
        .eq('estado_solicitud', 'Aprobado')
        .or('url_carnet.is.null,url_carnet.eq.')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching professionals without carnet:', error);
        throw new Error(getErrorMessage(error));
      }

      console.log(`Encontrados ${data?.length || 0} profesionales sin carnet`);
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Query para obtener el estado de la cola
  const getQueueStatus = useQuery({
    queryKey: ['carnet-queue-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cola_generacion_carnets')
        .select(`
          id,
          profesional_id,
          estado,
          url_carnet,
          mensaje_error,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      return data || [];
    },
    refetchInterval: 5000, // Actualizar cada 5 segundos
  });

  // Mutación para agregar profesionales a la cola
  const addToQueueMutation = useMutation({
    mutationFn: async (professionalIds: string[]) => {
      console.log(`Agregando ${professionalIds.length} profesionales a la cola...`);
      
      const queueItems = professionalIds.map(id => ({
        profesional_id: id,
        estado: 'pendiente' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('cola_generacion_carnets')
        .insert(queueItems)
        .select();

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Agregados a la Cola",
        description: `${data.length} profesionales agregados a la cola de generación.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['carnet-queue-status'] });
      queryClient.invalidateQueries({ queryKey: ['professionals-without-carnet'] });
    },
    onError: (error) => {
      console.error('Error adding to queue:', error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  });

  // Mutación para procesar la cola usando la edge function
  const processQueueMutation = useMutation({
    mutationFn: async (): Promise<QueueProcessResult> => {
      console.log('Procesando cola de carnets...');
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const headers: Record<string, string> = {
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8",
        };

        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(
          "https://wdieynendfjbkbhfovrx.supabase.co/functions/v1/procesar-cola-carnets",
          {
            method: "GET",
            headers,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('Resultado del procesamiento:', result);
        
        return result;

      } catch (error) {
        console.error('Error procesando cola:', error);
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Cola Procesada",
          description: result.message,
        });
      } else {
        toast({
          title: "Procesamiento Incompleto", 
          description: result.message,
          variant: "destructive",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['carnet-queue-status'] });
      queryClient.invalidateQueries({ queryKey: ['professionals-without-carnet'] });
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
    },
    onError: (error) => {
      console.error('Error in queue processing:', error);
      toast({
        title: "Error en Procesamiento",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  });

  // Función para procesar múltiples items de la cola
  const processMultipleQueue = async (maxItems: number = 5) => {
    setIsProcessingQueue(true);
    
    try {
      for (let i = 0; i < maxItems; i++) {
        await processQueueMutation.mutateAsync();
        
        // Pausa de 2 segundos entre procesamiento para no sobrecargar
        if (i < maxItems - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      console.error('Error in batch queue processing:', error);
    } finally {
      setIsProcessingQueue(false);
    }
  };

  // Función para automatizar: agregar profesionales sin carnet a la cola y procesarlos
  const automateCarnetGeneration = async () => {
    const professionalsWithoutCarnet = getProfessionalsWithoutCarnet.data;
    
    if (!professionalsWithoutCarnet || professionalsWithoutCarnet.length === 0) {
      toast({
        title: "No hay Profesionales",
        description: "No se encontraron profesionales aprobados sin carnet.",
      });
      return;
    }

    try {
      // Agregar a la cola
      const professionalIds = professionalsWithoutCarnet.map(p => p.id);
      await addToQueueMutation.mutateAsync(professionalIds);
      
      // Esperar un momento y luego procesar
      setTimeout(() => {
        processMultipleQueue(Math.min(professionalIds.length, 10));
      }, 3000);
      
    } catch (error) {
      console.error('Error in automated carnet generation:', error);
    }
  };

  return {
    // Data
    professionalsWithoutCarnet: getProfessionalsWithoutCarnet.data || [],
    queueStatus: getQueueStatus.data || [],
    
    // Loading states
    isLoadingProfessionals: getProfessionalsWithoutCarnet.isLoading,
    isLoadingQueue: getQueueStatus.isLoading,
    isAddingToQueue: addToQueueMutation.isPending,
    isProcessingQueue: processQueueMutation.isPending || isProcessingQueue,
    
    // Actions
    addToQueue: addToQueueMutation.mutate,
    addToQueueAsync: addToQueueMutation.mutateAsync,
    processQueue: processQueueMutation.mutate,
    processQueueAsync: processQueueMutation.mutateAsync,
    processMultipleQueue,
    automateCarnetGeneration,
    
    // Refetch functions
    refetchProfessionals: getProfessionalsWithoutCarnet.refetch,
    refetchQueue: getQueueStatus.refetch,
  };
};
