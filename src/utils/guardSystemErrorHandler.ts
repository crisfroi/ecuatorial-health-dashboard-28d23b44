// Comprehensive error handler for guard system

export interface GuardSystemError {
  type: 'database_missing' | 'permission_denied' | 'network_error' | 'unknown';
  message: string;
  originalError?: any;
  component?: string;
  action?: string;
}

export const handleGuardSystemError = (
  error: any, 
  context: { component: string; action: string }
): GuardSystemError => {
  
  // Handle case where error is null or undefined
  if (!error) {
    return {
      type: 'unknown',
      message: 'Unknown error occurred',
      component: context.component,
      action: context.action
    };
  }

  // Handle database table missing errors
  if (
    error.code === 'PGRST116' ||
    error.message?.includes('relation') ||
    error.message?.includes('does not exist') ||
    error.message?.includes('table') ||
    error.message?.includes('schema')
  ) {
    return {
      type: 'database_missing',
      message: 'Las tablas del sistema de guardias no han sido creadas. Ejecute las migraciones de base de datos.',
      originalError: error,
      component: context.component,
      action: context.action
    };
  }

  // Handle permission errors
  if (
    error.message?.includes('permission') ||
    error.message?.includes('unauthorized') ||
    error.message?.includes('forbidden') ||
    error.code === 'PGRST301'
  ) {
    return {
      type: 'permission_denied',
      message: 'No tiene permisos para acceder a esta funcionalidad.',
      originalError: error,
      component: context.component,
      action: context.action
    };
  }

  // Handle network errors
  if (
    error.message?.includes('network') ||
    error.message?.includes('fetch') ||
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('connection') ||
    error.message?.includes('ERR_NETWORK') ||
    error.message?.includes('ERR_INTERNET_DISCONNECTED') ||
    error.name === 'NetworkError' ||
    error.name === 'TypeError' && error.message?.includes('fetch')
  ) {
    return {
      type: 'network_error',
      message: 'Error de conexión con la base de datos. Verifique su conexión a internet.',
      originalError: error,
      component: context.component,
      action: context.action
    };
  }

  // Handle generic error with proper message extraction
  let errorMessage = 'Error desconocido';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object' && error !== null) {
    if (error.message) {
      errorMessage = error.message;
    } else if (error.error_description) {
      errorMessage = error.error_description;
    } else if (error.details) {
      errorMessage = error.details;
    } else {
      // Fallback for complex objects
      errorMessage = JSON.stringify(error, null, 2);
    }
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  return {
    type: 'unknown',
    message: errorMessage,
    originalError: error,
    component: context.component,
    action: context.action
  };
};

export const logGuardSystemError = (guardError: GuardSystemError) => {
  console.group(`🚨 Guard System Error - ${guardError.component}`);
  console.log('Type:', guardError.type);
  console.log('Action:', guardError.action);
  console.log('Message:', guardError.message);
  
  if (guardError.originalError) {
    console.log('Original Error:', guardError.originalError);
  }
  
  console.groupEnd();
};

// Enhanced error thrower that provides better error messages
export const throwFormattedGuardError = (error: any, context: { component: string; action: string }) => {
  const guardError = handleGuardSystemError(error, context);
  logGuardSystemError(guardError);
  
  // Throw a proper Error object with the formatted message
  const formattedError = new Error(guardError.message);
  (formattedError as any).type = guardError.type;
  (formattedError as any).component = guardError.component;
  (formattedError as any).action = guardError.action;
  
  throw formattedError;
};
