import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { useEnhancedErrorHandler } from './useEnhancedErrorHandler';
import { useCallback, useEffect } from 'react';

// Enhanced useQuery hook with better error handling
export function useEnhancedQuery<TData = unknown, TError = unknown>(
  options: UseQueryOptions<TData, TError> & { 
    context?: string;
    onBlankScreen?: () => void;
  }
) {
  const { context = 'Query', onBlankScreen, ...queryOptions } = options;
  const { handleQueryError } = useEnhancedErrorHandler(context);

  const enhancedOptions: UseQueryOptions<TData, TError> = {
    ...queryOptions,
    onError: (error) => {
      handleQueryError(error);
      queryOptions.onError?.(error);
    },
    retry: (failureCount, error) => {
      // Custom retry logic
      if (failureCount >= 3) return false;
      
      // Don't retry on authentication errors
      if ((error as any)?.code === 'PGRST301') return false;
      
      // Don't retry on permission errors
      if ((error as any)?.code === 'PGRST116') return false;
      
      return queryOptions.retry !== false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: queryOptions.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    cacheTime: queryOptions.cacheTime ?? 10 * 60 * 1000, // 10 minutes default
  };

  const query = useQuery(enhancedOptions);

  // Detect potential blank screen scenarios
  useEffect(() => {
    if (query.isError && !query.isFetching && !query.data) {
      console.warn(`⚠️ Potential blank screen in ${context}:`, {
        error: query.error,
        isError: query.isError,
        isFetching: query.isFetching,
        hasData: !!query.data
      });
      onBlankScreen?.();
    }
  }, [query.isError, query.isFetching, query.data, context, onBlankScreen]);

  return {
    ...query,
    // Enhanced properties
    isEmpty: !query.data || (Array.isArray(query.data) && query.data.length === 0),
    hasError: query.isError,
    isReady: !query.isLoading && !query.isError,
  };
}

// Enhanced useMutation hook with better error handling
export function useEnhancedMutation<TData = unknown, TError = unknown, TVariables = unknown>(
  options: UseMutationOptions<TData, TError, TVariables> & { 
    context?: string;
    invalidateQueries?: string[];
  }
) {
  const { context = 'Mutation', invalidateQueries = [], ...mutationOptions } = options;
  const { handleMutationError } = useEnhancedErrorHandler(context);
  const queryClient = useQueryClient();

  const enhancedOptions: UseMutationOptions<TData, TError, TVariables> = {
    ...mutationOptions,
    onError: (error, variables, context) => {
      handleMutationError(error);
      mutationOptions.onError?.(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      // Auto-invalidate specified queries
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
      
      mutationOptions.onSuccess?.(data, variables, context);
    },
  };

  const mutation = useMutation(enhancedOptions);

  const mutateWithErrorHandling = useCallback(async (variables: TVariables) => {
    try {
      return await mutation.mutateAsync(variables);
    } catch (error) {
      // Error is already handled by onError, but we can add additional logic here
      console.error(`Mutation failed in ${context}:`, error);
      throw error; // Re-throw to allow component-level error handling
    }
  }, [mutation, context]);

  return {
    ...mutation,
    mutateWithErrorHandling,
    // Enhanced properties
    hasError: mutation.isError,
    isReady: !mutation.isPending,
  };
}

// Utility hook for managing loading states across multiple queries
export function useLoadingState(queries: Array<{ isLoading: boolean; isError: boolean }>) {
  const isAnyLoading = queries.some(q => q.isLoading);
  const hasAnyError = queries.some(q => q.isError);
  const allReady = queries.every(q => !q.isLoading && !q.isError);

  return {
    isAnyLoading,
    hasAnyError,
    allReady,
    loadingCount: queries.filter(q => q.isLoading).length,
    errorCount: queries.filter(q => q.isError).length,
  };
}

// Hook for handling optimistic updates safely
export function useOptimisticUpdate<TData>(queryKey: string[]) {
  const queryClient = useQueryClient();

  const updateOptimistically = useCallback((
    updater: (oldData: TData | undefined) => TData,
    rollback?: (oldData: TData | undefined) => TData
  ) => {
    const oldData = queryClient.getQueryData<TData>(queryKey);
    
    // Apply optimistic update
    queryClient.setQueryData<TData>(queryKey, updater);
    
    return {
      rollback: () => {
        if (rollback) {
          queryClient.setQueryData<TData>(queryKey, rollback);
        } else {
          queryClient.setQueryData<TData>(queryKey, oldData);
        }
      }
    };
  }, [queryClient, queryKey]);

  return { updateOptimistically };
}
