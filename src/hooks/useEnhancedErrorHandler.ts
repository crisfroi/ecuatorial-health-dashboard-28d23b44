import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/utils/errorHandler';

interface ErrorHandlerOptions {
  showToast?: boolean;
  toastTitle?: string;
  logError?: boolean;
  onError?: (error: any) => void;
  retryable?: boolean;
}

export const useEnhancedErrorHandler = (context: string = 'Application') => {
  const { toast } = useToast();

  const handleError = useCallback((
    error: any, 
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      toastTitle = 'Error',
      logError = true,
      onError,
      retryable = false
    } = options;

    // Enhanced error logging
    if (logError) {
      console.group(`🔴 Error in ${context}`);
      console.error('Error object:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Log Supabase specific errors
      if (error?.code || error?.details || error?.hint) {
        console.error('Supabase error details:', {
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message
        });
      }
      
      // Log network errors
      if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        console.error('Network error detected - possible connectivity issue');
      }
      
      console.groupEnd();
    }

    // Get user-friendly error message
    const errorMessage = getErrorMessage(error);

    // Show toast notification
    if (showToast) {
      toast({
        title: toastTitle,
        description: errorMessage,
        variant: "destructive",
        action: retryable ? {
          altText: "Reintentar",
          onClick: () => onError?.(error)
        } : undefined
      });
    }

    // Call custom error handler
    onError?.(error);

    return errorMessage;
  }, [toast, context]);

  // Specific handlers for different error types
  const handleMutationError = useCallback((error: any) => {
    return handleError(error, {
      toastTitle: 'Error en la operación',
      retryable: true
    });
  }, [handleError]);

  const handleQueryError = useCallback((error: any) => {
    return handleError(error, {
      toastTitle: 'Error al cargar datos',
      retryable: true
    });
  }, [handleError]);

  const handleNetworkError = useCallback((error: any) => {
    return handleError(error, {
      toastTitle: 'Error de conexión',
      retryable: true
    });
  }, [handleError]);

  const handleSupabaseError = useCallback((error: any) => {
    // Check for specific Supabase error patterns
    let toastTitle = 'Error de base de datos';
    
    if (error?.code === 'PGRST301') {
      toastTitle = 'Error de autenticación';
    } else if (error?.code === 'PGRST116') {
      toastTitle = 'Error de conexión a la base de datos';
    } else if (error?.code?.startsWith('23')) {
      toastTitle = 'Error de integridad de datos';
    }

    return handleError(error, {
      toastTitle,
      retryable: !error?.code?.startsWith('23') // Don't retry integrity errors
    });
  }, [handleError]);

  return {
    handleError,
    handleMutationError,
    handleQueryError,
    handleNetworkError,
    handleSupabaseError
  };
};

// Hook specifically for detecting and handling "blank screen" errors
export const useBlankScreenDetector = () => {
  const { handleError } = useEnhancedErrorHandler('BlankScreenDetector');

  const detectAndHandleBlankScreen = useCallback((componentName: string) => {
    // Check if critical data is missing that could cause blank screens
    const checks = {
      reactQueryClient: !!document.querySelector('[data-reactroot]'),
      errorBoundaryPresent: !!document.querySelector('[data-error-boundary]'),
      criticalElementsPresent: document.querySelectorAll('main, [role="main"], .main-content').length > 0
    };

    const failedChecks = Object.entries(checks)
      .filter(([, passed]) => !passed)
      .map(([check]) => check);

    if (failedChecks.length > 0) {
      console.warn(`🔍 Blank screen risk detected in ${componentName}:`, {
        failedChecks,
        url: window.location.href,
        userAgent: navigator.userAgent
      });

      handleError(new Error(`Blank screen risk: ${failedChecks.join(', ')}`), {
        showToast: false,
        logError: true
      });

      return false;
    }

    return true;
  }, [handleError]);

  return {
    detectAndHandleBlankScreen
  };
};
