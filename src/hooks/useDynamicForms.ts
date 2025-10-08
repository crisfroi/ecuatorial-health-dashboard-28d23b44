import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  DynamicForm, 
  FormSubmission, 
  FormAnalytics, 
  ProfessionalIndicator, 
  ProfessionalIndicatorValue,
  FormFieldConfig 
} from '@/types/dynamic-forms';

// Hook para gestionar formularios dinámicos
export const useDynamicForms = () => {
  const queryClient = useQueryClient();

  const { data: forms = [], isLoading, error } = useQuery({
    queryKey: ['dynamic-forms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dynamic_forms')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DynamicForm[];
    }
  });

  const createFormMutation = useMutation({
    mutationFn: async (form: Omit<DynamicForm, 'id' | 'created_at' | 'updated_at' | 'submissions_count'>) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error('No autenticado');

      const payload: any = {
        title: form.title,
        description: form.description ?? null,
        category: form.category,
        fields: form.fields,
        settings: form.settings,
        public_settings: {
          ...form.publicSettings,
          public_url: generatePublicUrl(form.title)
        },
        created_by: userId,
        is_active: form.is_active ?? true
      };

      const { data, error } = await supabase
        .from('dynamic_forms')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data as DynamicForm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-forms'] });
    }
  });

  const updateFormMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DynamicForm> & { id: string }) => {
      const dbUpdates: any = {
        title: updates.title,
        description: updates.description,
        category: updates.category,
        fields: updates.fields,
        settings: updates.settings,
        is_active: (updates as any).is_active,
        updated_at: new Date().toISOString()
      };
      if ((updates as any).publicSettings) {
        dbUpdates.public_settings = (updates as any).publicSettings;
      }

      Object.keys(dbUpdates).forEach((k) => dbUpdates[k] === undefined && delete dbUpdates[k]);

      const { data, error } = await supabase
        .from('dynamic_forms')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DynamicForm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-forms'] });
    }
  });

  const deleteFormMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dynamic_forms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-forms'] });
    }
  });

  return {
    forms,
    isLoading,
    error,
    createForm: createFormMutation.mutateAsync,
    updateForm: updateFormMutation.mutateAsync,
    deleteForm: deleteFormMutation.mutate,
    isCreating: createFormMutation.isPending,
    isUpdating: updateFormMutation.isPending,
    isDeleting: deleteFormMutation.isPending
  };
};

// Hook para un formulario específico
export const useDynamicForm = (id: string) => {
  const { data: form, isLoading, error } = useQuery({
    queryKey: ['dynamic-form', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dynamic_forms')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as DynamicForm;
    },
    enabled: !!id
  });

  return { form, isLoading, error };
};

// Hook para envíos de formularios
export const useFormSubmissions = (formId: string) => {
  const { data: submissions = [], isLoading, error } = useQuery({
    queryKey: ['form-submissions', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      return data as FormSubmission[];
    },
    enabled: !!formId
  });

  const submitFormMutation = useMutation({
    mutationFn: async (submission: Omit<FormSubmission, 'id' | 'submitted_at'>) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error('No autenticado');

      const payload: any = {
        form_id: submission.formId,
        data: submission.data,
        submitted_by: userId,
        submitted_at: new Date().toISOString(),
        ip_address: (submission as any).ipAddress ?? null,
        user_agent: submission.userAgent ?? null,
        status: submission.status ?? 'submitted',
        metadata: submission.metadata ?? {}
      };

      const { data, error } = await supabase
        .from('form_submissions')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data as FormSubmission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-submissions', formId] });
    }
  });

  return {
    submissions,
    isLoading,
    error,
    submitForm: submitFormMutation.mutateAsync,
    isSubmitting: submitFormMutation.isPending
  };
};

// Hook para indicadores de profesionales
export const useProfessionalIndicators = () => {
  const { data: indicators = [], isLoading, error } = useQuery({
    queryKey: ['professional-indicators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_indicators')
        .select('*')
        .order('order', { ascending: true });
      
      if (error) throw error;
      return data as ProfessionalIndicator[];
    }
  });

  const createIndicatorMutation = useMutation({
    mutationFn: async (indicator: Omit<ProfessionalIndicator, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('professional_indicators')
        .insert([indicator])
        .select()
        .single();
      
      if (error) throw error;
      return data as ProfessionalIndicator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-indicators'] });
    }
  });

  return {
    indicators,
    isLoading,
    error,
    createIndicator: createIndicatorMutation.mutate,
    isCreating: createIndicatorMutation.isPending
  };
};

// Hook para valores de indicadores de un profesional
export const useProfessionalIndicatorValues = (professionalId: string) => {
  const { data: values = [], isLoading, error } = useQuery({
    queryKey: ['professional-indicator-values', professionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_indicator_values')
        .select(`
          *,
          professional_indicators (*)
        `)
        .eq('professional_id', professionalId);
      
      if (error) throw error;
      return data as (ProfessionalIndicatorValue & { professional_indicators: ProfessionalIndicator })[];
    },
    enabled: !!professionalId
  });

  const updateIndicatorValueMutation = useMutation({
    mutationFn: async ({ 
      indicatorId, 
      value, 
      submissionId 
    }: { 
      indicatorId: string; 
      value: any; 
      submissionId?: string; 
    }) => {
      // Buscar si ya existe un valor para este indicador
      const { data: existing } = await supabase
        .from('professional_indicator_values')
        .select('id')
        .eq('professional_id', professionalId)
        .eq('indicator_id', indicatorId)
        .single();

      if (existing) {
        // Actualizar valor existente
        const { data, error } = await supabase
          .from('professional_indicator_values')
          .update({ 
            value, 
            submission_id: submissionId,
            updated_at: new Date().toISOString() 
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Crear nuevo valor
        const { data, error } = await supabase
          .from('professional_indicator_values')
          .insert([{
            professional_id: professionalId,
            indicator_id: indicatorId,
            value,
            submission_id: submissionId,
            created_by: (await supabase.auth.getUser()).data.user?.id || 'system'
          }])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-indicator-values', professionalId] });
    }
  });

  return {
    values,
    isLoading,
    error,
    updateIndicatorValue: updateIndicatorValueMutation.mutate,
    isUpdating: updateIndicatorValueMutation.isPending
  };
};

// Hook para formulario público (sin autenticación)
export const usePublicForm = (publicUrl: string) => {
  const { data: form, isLoading, error } = useQuery({
    queryKey: ['public-form', publicUrl],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dynamic_forms')
        .select('*')
        .eq('public_settings->>public_url', publicUrl)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data as DynamicForm;
    },
    enabled: !!publicUrl
  });

  return { form, isLoading, error };
};

// Hook para analytics de formularios
export const useFormAnalytics = (formId: string) => {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['form-analytics', formId],
    queryFn: async () => {
      // Obtener estadísticas básicas
      const { data: submissions } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('form_id', formId);

      if (!submissions) return null;

      const totalSubmissions = submissions.length;
      const completionRate = submissions.filter(s => s.status === 'submitted').length / totalSubmissions;
      
      // Calcular tiempo promedio (simplificado)
      const averageTimeToComplete = 300; // 5 minutos por defecto

      // Estadísticas de dispositivos (simplificado)
      const deviceStats = {
        desktop: Math.floor(totalSubmissions * 0.6),
        mobile: Math.floor(totalSubmissions * 0.35),
        tablet: Math.floor(totalSubmissions * 0.05)
      };

      // Tendencias de envío (últimos 30 días)
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 10) // Simulado
        };
      }).reverse();

      return {
        formId,
        totalSubmissions,
        completionRate,
        averageTimeToComplete,
        mostCommonAnswers: {}, // Implementar análisis de respuestas
        submissionTrends: last30Days,
        deviceStats
      } as FormAnalytics;
    },
    enabled: !!formId
  });

  return { analytics, isLoading, error };
};

// Utilidades
function generatePublicUrl(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  const randomId = Math.random().toString(36).substring(2, 8);
  return `${slug}-${randomId}`;
}
